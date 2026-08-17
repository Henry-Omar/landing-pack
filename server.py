#!/usr/bin/env python3
"""留学生落地包 (Landing Pack) — bilingual hub for international Chinese students.
Stdlib-only backend (http.server + sqlite3) with email/password auth + monetization
(affiliate shop, paid Landing Kits, mentorship bookings)."""
import http.server
import socketserver
import json
import os
import sqlite3
import hashlib
import hmac
import re
import secrets
import time
from datetime import datetime, timedelta
from urllib.parse import urlparse, parse_qs

# ---- Payment provider config (deploy: set env vars; local/dev uses mock) ----
# PAYMENT_PROVIDER: "mock" | "stripe" | "wechat" | "alipay"
PAYMENT_PROVIDER = os.environ.get("PAYMENT_PROVIDER", "mock")
# Monetization master switch. Free-launch = "0" (off): /api/buy_kit and /api/subscribe
# are refused server-side too (not just hidden in the UI), so payments can't be triggered
# by calling the API directly. Flip to "1" (after company + 微信/支付宝/Stripe) to enable.
PAYMENTS_ENABLED = os.environ.get("PAYMENTS_ENABLED", "0") == "1"
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_PUBLISHABLE_KEY = os.environ.get("STRIPE_PUBLISHABLE_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
# WeChat Pay (V3): merchant id + APIv3 key (used to verify notify HMAC-SHA256)
WECHAT_MCH_ID = os.environ.get("WECHAT_MCH_ID", "")
WECHAT_APIV3_KEY = os.environ.get("WECHAT_APIV3_KEY", "")
WECHAT_APP_ID = os.environ.get("WECHAT_APP_ID", "")
# Alipay: app id + app secret (HMAC-SHA256 notify verify; RSA2 is the production path)
ALIPAY_APP_ID = os.environ.get("ALIPAY_APP_ID", "")
ALIPAY_APP_SECRET = os.environ.get("ALIPAY_APP_SECRET", "")
ALIPAY_PUBLIC_KEY = os.environ.get("ALIPAY_PUBLIC_KEY", "")
APP_BASE_URL = os.environ.get("APP_BASE_URL", "http://localhost:8000")

# Platform take on mentor bookings (the app earns this % of each session fee)
MENTOR_FEE_PCT = 20

# Admin: only this account email can open the in-app admin console (/admin).
# Override with env ADMIN_EMAIL on deploy.
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@landing.pack")
# Server-side admin session token. Regenerated each boot; returned ONLY to the
# admin account on login. All /api/admin/* calls must present it. This stops a
# client from forging admin access by sending a guessed uid (e.g. "u_admin").
ADMIN_TOKEN = secrets.token_hex(16)

DB = os.path.join(os.environ.get("DATA_DIR", os.path.dirname(__file__)), "landing.db")

# In-memory login rate limit: IP -> list of failed timestamps. Cheap, no extra deps.
LOGIN_FAILS = {}  # ip -> [unix_ts, ...]

def _login_blocked(ip):
    now = time.time()
    fails = LOGIN_FAILS.get(ip, [])
    fails = [t for t in fails if now - t < 300]  # keep last 5 min
    LOGIN_FAILS[ip] = fails
    return len(fails) >= 8  # block after 8 failures / 5 min

def _login_fail(ip):
    LOGIN_FAILS.setdefault(ip, []).append(time.time())

def _login_ok(ip):
    LOGIN_FAILS.pop(ip, None)

CHECKLIST = [
    ("Visa", "签证", "Apply for student visa", "申请学生签证"),
    ("Visa", "签证", "Medical check & police clearance", "体检与无犯罪证明"),
    ("Housing", "住宿", "Book on/off-campus housing", "预订校内/外住宿"),
    ("Housing", "住宿", "Understand lease & deposit", "了解租约与押金"),
    ("Flight", "机票", "Book flight", "购买机票"),
    ("Flight", "机票", "Print visa & offer letter", "打印签证信/录取信"),
    ("Bank", "银行卡", "Gather bank-opening docs", "准备开户材料"),
    ("Bank", "银行卡", "Open bank account on arrival", "抵达后开户"),
    ("SIM", "手机卡", "Get local SIM or roaming", "购买当地SIM/开通漫游"),
    ("Insurance", "保险", "Get health insurance", "购买医疗保险"),
    ("Enrollment", "报到", "Course registration", "完成选课注册"),
    ("Enrollment", "报到", "Health check & vaccines", "体检与疫苗"),
]
CITIES = [("London", "伦敦"), ("New York", "纽约"), ("Sydney", "悉尼"), ("Toronto", "多伦多"), ("Tokyo", "东京")]
WIKI = {
    "London": [
        ("Housing", "住宿", "Hall vs private rental", "校内宿舍 vs 私人租房",
         "Uni halls are simple but pricey and competitive; private rents need a guarantor. Students are exempt from Council Tax with proof.",
         "校内宿舍(过一个学年合同简单但贵且需早起申请)；私人租房注意 Council Tax 学生可免，但需提供学生证明。"),
        ("Transport", "交通", "Oyster / contactless", "牡蛎卡/Oyster",
         "Use Oyster or contactless on the Tube; an 18+ Student Oyster gives 30% off with student status.",
         "伦敦地铁用 Oyster 或 contactless 银行卡，学生可办 18+ Student Oyster 享 30% 折扣。"),
        ("Bank", "银行", "Common banks", "常见银行",
         "Barclays, HSBC, Lloyds are intl-student friendly; bring passport, BRP, offer letter, proof of address.",
         "Barclays、HSBC、Lloyds 对中国留学生较友好，需护照、BRP、录取信、住址证明。"),
        ("SIM", "手机", "SIM / eSIM", "手机卡",
         "Get a Pay As You Go SIM (EE, O2, Vodafone) or an eSIM (Airalo) on arrival; a UK number helps with rentals and GP.",
         "落地办 Pay As You Go 卡（EE、O2、Vodafone）或 eSIM（Airalo）；本地号码方便租房和注册 GP。"),
        ("Food", "饮食", "Groceries & eating", "超市与吃饭",
         "Tesco, Sainsbury's and Lidl are cheap; student discounts via UNiDAYS. A rice cooker is worth bringing.",
         "Tesco、Sainsbury's、Lidl 较便宜；用 UNiDAYS 享学生折扣。电饭煲建议自带。"),
    ],
    "New York": [
        ("Housing", "住宿", "Dorms vs off-campus", "宿舍与校外租房",
         "Dorms are pricey but easy; off-campus leases often need an SSN or guarantor and 1-2 months deposit.",
         "校内宿舍贵但省心；校外租房需 Social Security Number 或担保人，押金常为一到两个月租金。"),
        ("Transport", "交通", "Subway / OMNY", "地铁 MetroCard",
         "The subway runs 24/7 via OMNY (tap phone/card) or MetroCard; stay alert late at night.",
         "纽约地铁 24 小时运营，用 OMNY（刷手机/卡）或 MetroCard；注意深夜安全。"),
        ("Bank", "银行", "Opening an account", "开户",
         "Chase and BofA have many branches; bring passport, I-20, address; some ask for SSN/ITIN.",
         "Chase、Bank of America 网点多；国际学生需护照、I-20、住址与部分银行要 SSN/ITIN。"),
        ("SIM", "手机", "Carriers", "手机卡",
         "T-Mobile and Mint Mobile have cheap student plans; an eSIM works on most phones. No contract needed.",
         "T-Mobile、Mint Mobile 有便宜学生套餐；多数手机支持 eSIM，无需合约。"),
        ("Work", "打工", "On-campus jobs", "校内打工",
         "F-1 students may work on campus up to 20h/week; get an SSN first. CPT/OPT needed for off-campus internships.",
         "F-1 学生校内每周最多 20 小时；先办 SSN。校外实习需 CPT/OPT。"),
    ],
    "Sydney": [
        ("Housing", "住宿", "Renting", "租房",
         "Rent is high; shared housing is common. Bond must be lodged with the RTA, not the landlord.",
         "悉尼房租高，合租(common share)较常见；签约前查明 bond 押金需交政府 RTA 托管。"),
        ("Transport", "交通", "Opal card", "Opal 卡",
         "Use an Opal card on buses/trains/ferries; some concessions apply with a student card.",
         "公交地铁用 Opal 卡；国际学生可享部分交通优惠，需学生证绑定。"),
        ("Bank", "银行", "Big four banks", "四大行",
         "CBA, Westpac, ANZ, NAB are student-friendly; bring passport, CoE, address.",
         "Commonwealth、Westpac、ANZ、NAB 对中国学生友好，需护照、COE、住址。"),
        ("SIM", "手机", "Telcos", "手机卡",
         "Optus and Telstra have student plans; eSIM supported. Activate after arrival with your passport.",
         "Optus、Telstra 有学生套餐，支持 eSIM；落地凭护照开通。"),
        ("Work", "打工", "Work rights", "打工权限",
         "Student visa allows 48h/fortnight; get a TFN to avoid top tax rate. Pay slips are mandatory.",
         "学生签每两周 48 小时；办 TFN 避免高税率。务必索取工资单。"),
    ],
    "Toronto": [
        ("Housing", "住宿", "Renting", "租房",
         "Rent is high; leases are usually 12 months. Photo the unit on move-in to avoid deposit disputes.",
         "多伦多租金高，注意 lease 通常一年起；入住前拍照留证避免押金纠纷。"),
        ("Transport", "交通", "Presto card", "Presto 卡",
         "Subway and buses use Presto; students can apply for discounted fares.",
         "地铁与公车用 Presto 卡；学生可申请优惠费率。"),
        ("Bank", "银行", "Opening an account", "开户",
         "RBC, TD, Scotiabank welcome intl students; bring passport, study permit, address proof.",
         "RBC、TD、Scotiabank 国际学生友好，需护照、学签、住址证明。"),
        ("SIM", "手机", "Carriers", "手机卡",
         "Rogers, Bell and Freedom Mobile cover students; bring passport + study permit to activate.",
         "Rogers、Bell、Freedom Mobile 覆盖好；凭护照+学签开通。"),
        ("Winter", "过冬", "Cold-weather prep", "过冬准备",
         "Winter drops to -20°C; a down jacket, thermal layers and winter boots are essential. Indoors are well heated.",
         "冬季可达 -20°C；羽绒服、保暖层与雪地靴必备。室内暖气充足。"),
    ],
    "Tokyo": [
        ("Housing", "住宿", "Dorms vs apartments", "宿舍与租房",
         "Uni dorms are cheap but limited; private leases need a guarantor—students can use a guarantee company.",
         "大学宿舍便宜但名额少；民间公寓需保证人(guarantor)，留学生可用保证公司代替。"),
        ("Transport", "交通", "Suica / PASMO", "Suica / PASMO",
         "Use Suica/PASMO IC cards; a student commuter pass cuts travel costs.",
         "电车地铁用 Suica/PASMO 储值卡；学生定期券可省通勤费。"),
        ("Bank", "银行", "Opening an account", "开户",
         "Japan Post or MUFG are easier; bring residence card, student ID, address. Some need Japanese support.",
         "邮局银行或三菱UFJ较易开户；需在留卡、学生证、住址。部分银行需日语对应。"),
        ("SIM", "手机", "Carriers", "手机卡",
         "Docomo, au and SoftBank have student discounts; an eSIM (povo, LINEMO) is contract-free and quick.",
         "Docomo、au、SoftBank 有学生优惠；eSIM（povo、LINEMO）免合约、开通快。"),
        ("Food", "饮食", "Daily life", "日常生活",
         "Convenience stores and supermarkets are everywhere; a rice cooker and electric kettle make life easier.",
         "便利店与超市遍地；电饭煲和电热水壶让生活更方便。"),
    ],
}

# Affiliate shop — partner slots. Replace each `url` with YOUR tracked affiliate
# link (from the partner's Affiliates/Partners program). `commission` is shown to users
# as "we earn X, no extra cost to you". You sign up for these programs (see DEPLOY-CN.md).
PRODUCTS = [
    ("sim", "Airalo eSIM", "Airalo eSIM 全球流量", "Instant data on landing, no SIM swap. 180+ countries.", "落地即用，免换卡，覆盖180+国家。",
     "from $4.5/GB", "up to $3/order", "https://www.airalo.com/?ref=YOUR_AIRALO_ID"),
    ("sim", "Holafly eSIM", "Holafly 留学生 eSIM", "Unlimited plans for students, daily pricing.", "留学生无限流量套餐，按天计费。",
     "from $5.9/day", "up to $6/order", "https://www.holafly.com/?ref=YOUR_HOLAFLY_ID"),
    ("insurance", "AXA Student", "AXA 留学生医疗险", "Worldwide cover + repatriation, meets visa rules.", "全球医疗+遣返保障，符合签证要求。",
     "from ¥1200/yr", "5% commission", "https://www.axa.com/partners?ref=YOUR_AXA_ID"),
    ("insurance", "Allianz Care", "Allianz Care 留学险", "Flexible international health, monthly.", "灵活国际健康险，可按月付。",
     "from €39/mo", "5% commission", "https://www.allianzcare.com/partners?ref=YOUR_ALLIANZ_ID"),
    ("flight", "Skyscanner", "Skyscanner 机票比价", "Compare millions of flights, price alerts.", "比价全网机票，学生优惠提醒。",
     "free", "affiliate", "https://www.skyscanner.com/?ref=YOUR_SKYSCANNER_ID"),
    ("bank", "Wise", "Wise 多币种账户", "Hold 40+ currencies, referral bonus.", "多币种账户，推荐返现。",
     "free", "£50/referral", "https://wise.com/invite/YOUR_WISE_ID"),
    ("bank", "Revolut", "Revolut 学生账户", "No-fee FX for students.", "学生免手续费换汇。",
     "free", "€10/referral", "https://www.revolut.com/?ref=YOUR_REVOLUT_ID"),
    ("essentials", "Travel Adapter", "转换插头 (Amazon)", "Must-have for appliances abroad.", "电器必备转换插头。",
     "¥39", "6% commission", "https://www.amazon.com/?tag=YOUR_AMAZON_ID"),
    ("essentials", "Luggage Scale", "便携行李秤 (Amazon)", "Avoid overweight fees.", "避免超重罚款。",
     "¥29", "6% commission", "https://www.amazon.com/?tag=YOUR_AMAZON_ID"),
]

KIT1_ZH = """# 全能落地包 Pro

## 1. 行前签证清单（按国家）
- 英国：CAS、资金证明28天、TB检测
- 美国：I-20、SEVIS费、面签
- 澳洲：CoE、GTE、体检
- 加拿大：LOA、GIC、生物信息
- 日本：在留资格、经费支付书

## 2. 租房合同审核模板
- 押金是否由政府/第三方托管
- 租期与提前解约条款
- 水电煤与网费归属
- 看房检查表（入住拍照留证）

## 3. 抵达生存手册
- 机场到市区交通
- 办理当地手机卡 / eSIM
- 银行开户材料清单
- 买保险时间线

## 4. 打包清单
- 证件类、电器类、药品类、衣物类"""
KIT1_EN = """# All-in-One Landing Kit Pro

## 1. Pre-arrival visa checklist (by country)
- UK: CAS, 28-day funds proof, TB test
- US: I-20, SEVIS fee, interview
- AU: CoE, GTE, medical
- CA: LOA, GIC, biometrics
- JP: COE, financial sponsor letter

## 2. Lease review template
- Is the deposit lodged with gov/3rd party?
- Lease term & early-termination clauses
- Who pays utilities & internet
- Viewing checklist (photo on move-in)

## 3. Arrival survival guide
- Airport to city transport
- Local SIM / eSIM
- Bank docs checklist
- Insurance timeline

## 4. Packing list
- Documents, electronics, medicine, clothing"""
KIT2_ZH = """# 租房避坑包

## 各国红flag清单
- 英国：押金未进 Deposit Protection Scheme
- 美国：要求预付全年租金且无机构担保
- 澳洲：bond 未交 RTA 托管
- 加拿大：lease 起租日早于签证生效
- 日本：保证公司费用过高且无说明

## 看房必查
- 采光 / 隔音 / 霉斑
- 门锁 / 烟雾报警器
- 水电表读数拍照

## 押金保护
- 入住前拍照留证
- 退租清洁凭证保留"""
KIT2_EN = """# Lease Safety Kit

## Red flags by country
- UK: deposit not in a Deposit Protection Scheme
- US: full-year rent upfront with no escrow
- AU: bond not lodged with the RTA
- CA: lease start before visa validity
- JP: guarantor fee unexplained / too high

## Viewing must-checks
- Light / sound / mould
- Locks / smoke alarm
- Photo the utility meters

## Deposit protection
- Photo on move-in
- Keep end-of-lease cleaning proof"""

KIT3_ZH = """# 签证不慌包（¥9 入门）

## 5国签证材料清单
- 英国：CAS、资金证明（连续28天）、TB检测、ATAS（如适用）
- 美国：I-20、SEVIS费、DS-160、面签预约
- 澳洲：CoE、GTE陈述、体检、无犯罪
- 加拿大：LOA、GIC担保金、生物信息、PAL（如适用）
- 日本：在留资格认定、经费支付书、照片规格

## 时间线（建议）
- 入学前 6 个月：定校+存资金证明
- 入学前 3 个月：递签+体检
- 入学前 6 周：等结果+订机票

## 拒签红flag
- 资金证明天数不够
- 学习计划（GTE/Study Plan）空泛
- 递签时间过晚导致来不及

照着打勾，不漏一项。"""

KIT3_EN = """# Visa-No-Panic Kit (¥9 intro)

## Document checklist — 5 countries
- UK: CAS, 28-day funds proof, TB test, ATAS if applicable
- US: I-20, SEVIS fee, DS-160, interview
- AU: CoE, GTE statement, medical, police check
- CA: LOA, GIC deposit, biometrics, PAL if applicable
- JP: COE, financial sponsor letter, photo spec

## Timeline (recommended)
- 6 months out: confirm school + fund proof
- 3 months out: apply + medical
- 6 weeks out: get result + book flight

## Rejection red-flags
- Funds proof too short
- Vague study plan (GTE)
- Applied too late

Tick every box — miss nothing."""

KITS = [
    ("签证不慌包", "Visa-No-Panic Kit",
     "怕漏交材料被拒签？5国（英/美/澳/加/日）签证材料清单+时间线+拒签红flag，照着打勾即可。",
     "Scared of a rejected visa? Document checklist + timeline + rejection red-flags for UK/US/AU/CA/JP. Tick and go.",
     9, KIT3_EN, KIT3_ZH),
    ("租房避坑包", "Lease Safety Kit",
     "怕租到坑房、押金拿不回？各国租房红flag清单+押金保护指南+看房检查表。",
     "Scared of a scam lease or lost deposit? Red-flag checklist per country + deposit protection + viewing checklist.",
     19, KIT2_EN, KIT2_ZH),
    ("全能落地包 Pro", "All-in-One Landing Kit Pro",
     "签证+租房+抵达生存+打包，一条龙双语。最省心的一站式落地方案。",
     "Visa + lease + arrival survival + packing, all bilingual. The done-for-you landing bundle.",
     39, KIT1_EN, KIT1_ZH),
]

# Seed Q&A (genuine bilingual content so the Q&A tab isn't empty on first run)
QUESTIONS = [
    ("zh", "英国学生签证要多久下来？", "我想9月入学，现在办签证还来得及吗？BRP还要不要领？"),
    ("zh", "纽约租房押金一般要几个月？", "哥大附近一居室大概什么价位？有没有靠谱平台？"),
    ("en", "How do I open a UK bank account as a new international student?", "Which banks are easiest and what documents do I need besides my passport?"),
    ("en", "Sydney rental bond — where does it go?", "Is it normal for the landlord to hold the bond, or should it be lodged with the RTA?"),
    ("zh", "东京租房的保证人怎么办？", "中国留学生没有日本亲友做保证人，能用保证公司吗？费用高吗？"),
]
ANSWERS = {
    0: [("zh", "英国学生签通常3周出结果，优先签证(Priority)约5个工作日。BRP已逐步被eVisa取代，具体看你的签证决定信。", "Li Mei")],
    1: [("zh", "纽约押金通常1个月，部分要求先付最后一个月租金。哥大附近studio约$3000-4000/月，可用 Streeteasy / Zillow 筛选。", "Zhang Wei")],
    2: [("en", "Barclays, HSBC and Lloyds are intl-student friendly. Bring passport, BRP/eVisa, offer letter and proof of address (a uni letter works). Monzo/Starling are easy online alternatives.", "Li Mei")],
    3: [("en", "In NSW the bond MUST be lodged with the RTA (Fair Trading), not held by the landlord. Get a receipt and do a condition report on move-in.", "Wang Fang")],
    4: [("zh", "可以用保证公司（保証会社）代替亲友保证人，费用通常半个月到一个月租金，且多为一次性。入学后很多学校也有支援。", "Sato Yuki")],
}


MENTORS = [
    ("Li Mei", "UCL", "伦敦大学学院", "UCL 硕士，帮过30+学弟妹落地伦敦。", "UCL MSc, helped 30+ juniors land in London.", "签证/租房/银行", 99),
    ("Zhang Wei", "NYU", "纽约大学", "NYU 在校生，熟悉F1签证与纽约生活。", "NYU student, knows F1 visa & NYC life.", "签证/保险/社交", 89),
    ("Wang Fang", "Uni of Sydney", "悉尼大学", "悉尼租房与打工经验丰富。", "Rich in Sydney renting & part-time jobs.", "租房/打工/保险", 79),
    ("Chen Hao", "UofT", "多伦多大学", "多伦多开户与冬装采购达人。", "Toronto banking & winter gear pro.", "银行/生活", 69),
    ("Sato Yuki", "UTokyo", "东京大学", "东京租房与在留卡办理经验。", "Tokyo renting & residence card help.", "签证/租房", 89),
]


SCHOOLS = [
    ("UCL", "伦敦大学学院", 1, "UK", "英国"),
    ("Imperial College London", "帝国理工学院", 1, "UK", "英国"),
    ("LSE", "伦敦政治经济学院", 1, "UK", "英国"),
    ("NYU", "纽约大学", 2, "USA", "美国"),
    ("Columbia University", "哥伦比亚大学", 2, "USA", "美国"),
    ("University of Sydney", "悉尼大学", 3, "Australia", "澳大利亚"),
    ("UNSW", "新南威尔士大学", 3, "Australia", "澳大利亚"),
    ("University of Toronto", "多伦多大学", 4, "Canada", "加拿大"),
    ("University of Tokyo", "东京大学", 5, "Japan", "日本"),
    ("Waseda University", "早稻田大学", 5, "Japan", "日本"),
]
SCHOOL_COUNTRY = {0: "UK", 1: "UK", 2: "UK", 3: "USA", 4: "USA", 5: "Australia", 6: "Australia", 7: "Canada", 8: "Japan", 9: "Japan"}
COUNTRY_TASKS = {
    "UK": [
        ("Visa", "签证", "Apply for a UK Student Route visa (you need a CAS from your school)", "申请英国学生签证（需学校发的 CAS）"),
        ("Visa", "签证", "Pay the IHS health surcharge", "缴纳 IHS 医疗附加费"),
        ("Visa", "签证", "Collect your BRP / eVisa after arriving in the UK", "抵达英国后领取 BRP / 电子签证"),
        ("Health", "体检", "TB test if required for your country", "如来自清单国家需做肺结核(TB)检测"),
        ("Arrival", "抵达", "Register with a GP (NHS doctor)", "注册 NHS 社区医生(GP)"),
        ("Bank", "银行", "Open a UK bank account (needs your BRP)", "开设英国银行账户（需 BRP）"),
    ],
    "USA": [
        ("Visa", "签证", "Receive your I-20 from the school", "从学校领取 I-20 表格"),
        ("Visa", "签证", "Pay the SEVIS I-901 fee", "缴纳 SEVIS I-901 费用"),
        ("Visa", "签证", "Complete the DS-160 form and attend your visa interview", "填写 DS-160 并参加签证面签"),
        ("Visa", "签证", "Pay the MRV visa application fee", "缴纳签证申请费(MRV)"),
        ("Arrival", "抵达", "Apply for an SSN if you'll work on campus", "如需校内工作申请社安号(SSN)"),
        ("Bank", "银行", "Open a US bank account", "开设美国银行账户"),
    ],
    "Australia": [
        ("Visa", "签证", "Receive your CoE (Confirmation of Enrolment)", "领取 CoE 入学确认书"),
        ("Visa", "签证", "Buy OSHC overseas student health cover", "购买 OSHC 海外学生医疗保险"),
        ("Visa", "签证", "Apply for a student visa (subclass 500)", "申请学生签证(500 类别)"),
        ("Tax", "税务", "Apply for a TFN (Tax File Number)", "申请税号(TFN)"),
        ("Bank", "银行", "Open an Australian bank account", "开设澳大利亚银行账户"),
        ("Arrival", "抵达", "Get a local SIM card / phone plan", "办理本地手机卡/套餐"),
    ],
    "Canada": [
        ("Visa", "签证", "Receive your LOA (Letter of Acceptance)", "领取录取通知书(LOA)"),
        ("Visa", "签证", "Apply for a study permit", "申请学习许可(study permit)"),
        ("Visa", "签证", "Prepare your GIC (Guaranteed Investment Certificate)", "准备 GIC 担保投资证"),
        ("Arrival", "抵达", "Apply for an SIN (Social Insurance Number)", "申请工卡(SIN)"),
        ("Bank", "银行", "Open a Canadian bank account", "开设加拿大银行账户"),
    ],
    "Japan": [
        ("Visa", "签证", "Obtain your Certificate of Eligibility (CoE)", "取得在留资格认定证明书(CoE)"),
        ("Visa", "签证", "Apply for a student visa at the embassy", "在使馆申请留学签证"),
        ("Arrival", "抵达", "Get your Residence Card (在留卡) on arrival", "抵达后办理在留卡"),
        ("Bank", "银行", "Open a Japanese bank account (needs your residence card)", "开设日本银行账户（需在留卡）"),
        ("Phone", "手机", "Get a phone plan (needs your residence card)", "办理手机套餐（需个人番号/在留卡）"),
    ],
}
SCHOOL_TASKS = []
for _i, _sch in enumerate(SCHOOLS):
    _sid = _i + 1
    for _t in COUNTRY_TASKS[SCHOOL_COUNTRY[_i]]:
        SCHOOL_TASKS.append((_sid, _t[0], _t[1], _t[2], _t[3]))

SCHOOL_NOTES = [
    (1, "Collect your BRP at a local Post Office using your visa decision letter. Open a Monzo/Starling account online with your BRP + passport. UCL sends pre-enrolment tasks via Portico.", "凭签证决定信到附近邮局领取 BRP。用 BRP+护照在线开 Monzo/Starling 银行账户。UCL 通过 Portico 发送入学前任务。"),
    (2, "Imperial may require ATAS for your course - check early. Collect your BRP, then get your College ID at the library. South Kensington housing is pricey, so book early.", "若课程需要请尽早办 ATAS。领取 BRP 后到图书馆领学院 ID。南肯辛顿房租高，尽早订房。"),
    (3, "LSE accommodation opens early - apply fast. Collect your BRP, then your LSE ID at the Students' Union. Strong alumni network for finance internships.", "LSE 宿舍开放早，尽快申请。领取 BRP 后在学联领 LSE 学生卡。金融实习校友网强。"),
    (4, "Pay SEVIS and book your visa interview early - NYC slots fill fast. On arrival get your NYU NCard and activate Albert for registration. Open a US bank account with passport + student ID.", "尽早缴 SEVIS 并约面签 - 纽约名额紧。抵达后办 NYU NCard，在 Albert 选课。凭护照+学生证开户。"),
    (5, "Columbia uses SSOL for registration - get your UNI and ID first. A US bank account needs passport, visa, I-20 and a campus address. Morningside Heights housing is competitive.", "哥大用 SSOL 选课，先拿 UNI 和 ID。开户需护照、签证、I-20 和校园地址。Morningside 租房激烈。"),
    (6, "Buy OSHC before lodging your visa. On arrival get your USI (student number) and a local SIM. Open a bank account (Commonwealth/NAB) with passport + CoE + visa.", "递签前买 OSHC。抵达后拿 USI 学号和本地手机卡。凭护照+CoE+签证开银行账户。"),
    (7, "UNSW uses myUNSW for enrolment - get your zID and student card. Open a bank account with passport + CoE. Apply for a TFN after arrival to avoid tax withholding.", "UNSW 用 myUNSW 注册，拿 zID 和学生卡。凭护照+CoE 开户。抵澳后尽快申请 TFN 避免扣税。"),
    (8, "Apply for your GIC and study permit early. On arrival get your TCard (student ID) and activate ACORN. Open a bank account (RBC/CIBC) with passport + permit + SIN.", "尽早准备 GIC 和学习许可。抵达后办 TCard 并激活 ACORN。凭护照+许可+SIN 开银行账户。"),
    (9, "Apply for your CoE via your faculty, then the visa. Within 14 days of arrival, register your address at the city office and get your Residence Card. Open a bank account only after you have the card.", "经研究科申请 CoE 再办签证。抵达 14 天内到区役所登记住址并领在留卡。有在留卡后才能开户。"),
    (10, "Waseda issues your CoE through admissions. After arrival, complete address registration and get your Residence Card. Open a bank account (Japan Post / SMBC) with the card + student ID.", "早稻田经招生办发 CoE。抵达后办住址登记与在留卡。凭在留卡+学生证开银行账户。"),
]


def db():
    c = sqlite3.connect(DB, timeout=30, check_same_thread=False)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA busy_timeout=30000")
    c.execute("PRAGMA journal_mode=WAL")
    return c


def hash_pw(pw):
    salt = secrets.token_hex(8)
    d = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 100000).hex()
    return salt + ":" + d


def verify_pw(pw, stored):
    try:
        salt, d = stored.split(":")
    except Exception:
        return False
    return hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 100000).hex() == d


def verify_stripe_sig(payload: bytes, sig_header: str, secret: str) -> dict:
    """Verify a Stripe webhook signature using stdlib HMAC (no stripe SDK needed).
    Returns the parsed event dict, or raises ValueError on bad signature."""
    if not secret or not sig_header:
        raise ValueError("missing secret or signature header")
    parts = dict(kv.strip().split("=", 1) for kv in sig_header.split(",") if "=" in kv)
    ts = parts.get("t")
    v1 = parts.get("v1")
    if not ts or not v1:
        raise ValueError("malformed signature header")
    signed = (ts + "." + payload.decode("utf-8")).encode("utf-8")
    expected = hmac.new(secret.encode("utf-8"), signed, hashlib.sha256).hexdigest()
    # constant-time compare
    if not hmac.compare_digest(expected, v1):
        raise ValueError("signature mismatch")
    return json.loads(payload.decode("utf-8"))


def create_pending_order(uid, kit_id):
    """Insert a pending order and return its rowid."""
    c = db()
    cur = c.execute("INSERT INTO orders(user_id,kit_id,status) VALUES(?,?,?)", (uid, kit_id, "pending"))
    c.commit(); c.close()
    return cur.lastrowid


def parse_ref(ref):
    """Parse 'uid:kit_id' -> ('kit', uid, kit_id) or 'sub:uid:plan' -> ('sub', uid, plan), else (None, None, None)."""
    if not ref or ":" not in ref:
        return None, None, None
    parts = ref.split(":", 2)
    if parts[0] == "sub" and len(parts) == 3:
        return "sub", parts[1], parts[2]
    if len(parts) == 2:
        return "kit", parts[0], parts[1]
    return None, None, None


def verify_wechat_sig(timestamp: str, nonce: str, body: bytes, sig: str, key: str) -> bool:
    """WeChat Pay V3 notify signature: HMAC-SHA256 over 'timestamp\\nnonceStr\\nbody\\n' with APIv3 key.
    Constant-time compare. Returns True if valid."""
    if not key or not sig:
        return False
    msg = f"{timestamp}\n{nonce}\n".encode("utf-8") + body + b"\n"
    expected = hmac.new(key.encode("utf-8"), msg, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, sig)


def verify_alipay_sig(params: dict, sign: str, secret: str) -> bool:
    """Alipay notify signature (HMAC-SHA256 over sorted k=v pairs, no sign param).
    Production Alipay uses RSA2 (SHA256withRSA) with the platform public cert; this
    HMAC path mirrors the signing scheme and is the testable stdlib fallback."""
    if not secret or not sign:
        return False
    parts = []
    for k in sorted(params.keys()):
        v = params.get(k)
        if k == "sign" or k == "sign_type" or v in (None, ""):
            continue
        parts.append(f"{k}={v}")
    raw = "&".join(parts)
    expected = hmac.new(secret.encode("utf-8"), raw.encode("utf-8"), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, sign)


def fulfill_order(uid, kit_id):
    """Flip a pending order to paid so the kit unlocks."""
    c = db()
    c.execute("UPDATE orders SET status='paid' WHERE user_id=? AND kit_id=? AND status='pending'", (uid, kit_id))
    c.commit(); c.close()


# ---- Subscriber / Pro tier ----
# Free users get core features. Pro (¥29/mo or ¥199/yr) unlocks premium "skills":
# all Kits included, Pro-only checklist items, mentor booking discount, priority Q&A, no ads.
PLANS = {
    "pro_month": {"name_en": "Landing Pack Pro (monthly)", "name_zh": "PRO 会员（月）", "price": 29, "period": "month"},
    "pro_year":  {"name_en": "Landing Pack Pro (yearly)",  "name_zh": "PRO 会员（年）",  "price": 199, "period": "year"},
}

def is_pro(uid):
    """True if uid has an active, non-expired subscription."""
    if not uid:
        return False
    c = db()
    row = c.execute("SELECT expires_at FROM subscribers WHERE user_id=? AND status='active'", (uid,)).fetchone()
    c.close()
    if not row:
        return False
    try:
        exp = datetime.strptime(row["expires_at"], "%Y-%m-%d %H:%M:%S")
        return exp > datetime.now()
    except Exception:
        return False  # corrupted date => not pro (fail safe)

def create_pending_sub(uid, plan):
    months = 12 if plan == "pro_year" else 1
    exp = (datetime.now() + timedelta(days=months * 30)).strftime("%Y-%m-%d %H:%M:%S")
    c = db()
    c.execute("INSERT INTO subscribers(user_id,plan,status,expires_at) VALUES(?,?,?,?)", (uid, plan, "pending", exp))
    c.commit(); c.close()

def activate_sub(uid, plan):
    """Flip pending sub to active (called by payment webhook)."""
    c = db()
    c.execute("UPDATE subscribers SET status='active' WHERE user_id=? AND plan=? AND status='pending'", (uid, plan))
    c.commit(); c.close()


def is_admin(uid):
    """True only if the account behind `uid` matches ADMIN_EMAIL."""
    if not uid:
        return False
    c = db(); u = c.execute("SELECT email FROM users WHERE id=?", (uid,)).fetchone(); c.close()
    return bool(u) and u["email"] == ADMIN_EMAIL

def admin_ok(uid, token):
    """is_admin AND presents the server-issued ADMIN_TOKEN. Required for /api/admin/*."""
    return is_admin(uid) and token == ADMIN_TOKEN


def init():
    c = db()
    c.executescript("""
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, email TEXT UNIQUE, password TEXT, name TEXT, lang TEXT DEFAULT 'zh');
    CREATE TABLE IF NOT EXISTS checklist(id INTEGER PRIMARY KEY AUTOINCREMENT, cat_en TEXT, cat_zh TEXT, task_en TEXT, task_zh TEXT);
    CREATE TABLE IF NOT EXISTS user_checks(user_id TEXT, task_id INTEGER, done INTEGER DEFAULT 0, PRIMARY KEY(user_id, task_id));
    CREATE TABLE IF NOT EXISTS cities(id INTEGER PRIMARY KEY AUTOINCREMENT, name_en TEXT, name_zh TEXT);
    CREATE TABLE IF NOT EXISTS wiki(id INTEGER PRIMARY KEY AUTOINCREMENT, city_id INTEGER, cat_en TEXT, cat_zh TEXT, title_en TEXT, title_zh TEXT, body_en TEXT, body_zh TEXT);
    CREATE TABLE IF NOT EXISTS questions(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, name TEXT, lang TEXT, title TEXT, body TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS answers(id INTEGER PRIMARY KEY AUTOINCREMENT, q_id INTEGER, name TEXT, lang TEXT, text TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY AUTOINCREMENT, cat TEXT, name_en TEXT, name_zh TEXT, desc_en TEXT, desc_zh TEXT, price TEXT, commission TEXT, url TEXT);
    CREATE TABLE IF NOT EXISTS clicks(id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER, user_id TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS kits(id INTEGER PRIMARY KEY AUTOINCREMENT, name_en TEXT, name_zh TEXT, desc_en TEXT, desc_zh TEXT, price INTEGER, content_en TEXT, content_zh TEXT);
    CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, kit_id INTEGER, status TEXT DEFAULT 'paid', created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS mentors(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, school_en TEXT, school_zh TEXT, bio_en TEXT, bio_zh TEXT, expertise TEXT, price INTEGER);
    CREATE TABLE IF NOT EXISTS bookings(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, mentor_id INTEGER, slot TEXT, topic TEXT, status TEXT DEFAULT 'pending', created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS schools(id INTEGER PRIMARY KEY AUTOINCREMENT, name_en TEXT, name_zh TEXT, city_id INTEGER, country_en TEXT, country_zh TEXT);
    CREATE TABLE IF NOT EXISTS school_tasks(id INTEGER PRIMARY KEY AUTOINCREMENT, school_id INTEGER, cat_en TEXT, cat_zh TEXT, task_en TEXT, task_zh TEXT);
    CREATE TABLE IF NOT EXISTS user_school_checks(user_id TEXT, school_task_id INTEGER, done INTEGER DEFAULT 0, PRIMARY KEY(user_id, school_task_id));
    CREATE TABLE IF NOT EXISTS school_notes(id INTEGER PRIMARY KEY AUTOINCREMENT, school_id INTEGER, note_en TEXT, note_zh TEXT);
    CREATE TABLE IF NOT EXISTS subscribers(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, plan TEXT DEFAULT 'pro', status TEXT DEFAULT 'active', expires_at TEXT, created_at TEXT DEFAULT (datetime('now')));
    -- Community: buddy matcher + local board. status='pending' until admin approves (China UGC 备案 compliance).
    CREATE TABLE IF NOT EXISTS buddies(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, name TEXT, school TEXT, city_id INTEGER, arrive TEXT, wechat TEXT, note TEXT, status TEXT DEFAULT 'pending', created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS posts(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, name TEXT, kind TEXT DEFAULT 'info', city_id INTEGER, title TEXT, body TEXT, contact TEXT, status TEXT DEFAULT 'pending', created_at TEXT DEFAULT (datetime('now')));

    """)
    if c.execute("SELECT COUNT(*) FROM checklist").fetchone()[0] == 0:
        c.executemany("INSERT INTO checklist(cat_en,cat_zh,task_en,task_zh) VALUES(?,?,?,?)", CHECKLIST)
    if c.execute("SELECT COUNT(*) FROM cities").fetchone()[0] == 0:
        c.executemany("INSERT INTO cities(name_en,name_zh) VALUES(?,?)", CITIES)
        for en, zh in CITIES:
            cid = c.execute("SELECT id FROM cities WHERE name_en=?", (en,)).fetchone()[0]
            for cat_en, cat_zh, t_en, t_zh, b_en, b_zh in WIKI[en]:
                c.execute("INSERT INTO wiki(city_id,cat_en,cat_zh,title_en,title_zh,body_en,body_zh) VALUES(?,?,?,?,?,?,?)",
                          (cid, cat_en, cat_zh, t_en, t_zh, b_en, b_zh))
    if c.execute("SELECT COUNT(*) FROM products").fetchone()[0] == 0:
        c.executemany("INSERT INTO products(cat,name_en,name_zh,desc_en,desc_zh,price,commission,url) VALUES(?,?,?,?,?,?,?,?)", PRODUCTS)
    if c.execute("SELECT COUNT(*) FROM kits").fetchone()[0] == 0:
        c.executemany("INSERT INTO kits(name_en,name_zh,desc_en,desc_zh,price,content_en,content_zh) VALUES(?,?,?,?,?,?,?)", KITS)
    if c.execute("SELECT COUNT(*) FROM mentors").fetchone()[0] == 0:
        c.executemany("INSERT INTO mentors(name,school_en,school_zh,bio_en,bio_zh,expertise,price) VALUES(?,?,?,?,?,?,?)", MENTORS)
    if c.execute("SELECT COUNT(*) FROM questions").fetchone()[0] == 0:
        for i, (lang, title, body) in enumerate(QUESTIONS):
            cur = c.execute("INSERT INTO questions(user_id,name,lang,title,body) VALUES(?,?,?,?,?)", ("seed", "匿名", lang, title, body))
            qid = cur.lastrowid
            for alang, atext, aname in ANSWERS.get(i, []):
                c.execute("INSERT INTO answers(q_id,name,lang,text) VALUES(?,?,?,?)", (qid, aname, alang, atext))
    try:
        c.execute("ALTER TABLE users ADD COLUMN school_id INTEGER")
    except Exception:
        pass
    try:
        c.execute("ALTER TABLE users ADD COLUMN arrival TEXT")
    except Exception:
        pass
    if c.execute("SELECT COUNT(*) FROM schools").fetchone()[0] == 0:
        c.executemany("INSERT INTO schools(name_en,name_zh,city_id,country_en,country_zh) VALUES(?,?,?,?,?)", SCHOOLS)
    if c.execute("SELECT COUNT(*) FROM school_tasks").fetchone()[0] == 0:
        c.executemany("INSERT INTO school_tasks(school_id,cat_en,cat_zh,task_en,task_zh) VALUES(?,?,?,?,?)", SCHOOL_TASKS)
    if c.execute("SELECT COUNT(*) FROM school_notes").fetchone()[0] == 0:
        c.executemany("INSERT INTO school_notes(school_id,note_en,note_zh) VALUES(?,?,?)", SCHOOL_NOTES)
    if not c.execute("SELECT 1 FROM users WHERE email=?", ("demo@landing.pack",)).fetchone():
        c.execute("INSERT INTO users(id,email,password,name,lang) VALUES(?,?,?,?,?)",
                  ("u_demo", "demo@landing.pack", hash_pw("demo1234"), "Demo同学", "zh"))
    if ADMIN_EMAIL and not c.execute("SELECT 1 FROM users WHERE email=?", (ADMIN_EMAIL,)).fetchone():
        c.execute("INSERT INTO users(id,email,password,name,lang) VALUES(?,?,?,?,?)",
                  ("u_admin", ADMIN_EMAIL, hash_pw("admin1234"), "Admin", "zh"))
    c.commit()
    c.close()


class H(http.server.BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        # Security headers (launch hardening): stop MIME sniffing + clickjacking
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        super().end_headers()
    def _j(self, obj):
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(obj, ensure_ascii=False).encode("utf-8"))

    def _static(self, fp, ext):
        ct = {".css": "text/css", ".js": "application/javascript", ".html": "text/html"}.get(ext, "application/octet-stream")
        self.send_response(200)
        self.send_header("Content-Type", ct)
        # Never cache static assets: guarantees users always load the latest build
        # (prevents the "button still broken after a fix" stale-cache problem).
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.end_headers()
        self.wfile.write(open(fp, encoding="utf-8").read().encode("utf-8"))

    def do_GET(self):
        p = urlparse(self.path)
        if p.path in ("/", "/index.html"):
            self._static(os.path.join(os.path.dirname(__file__), "static", "index.html"), ".html")
            return
        if p.path.startswith("/static/"):
            # Prevent path traversal: only serve files inside ./static, no ".."
            rel = p.path[len("/static/"):]
            if ".." in rel or rel.startswith("/"):
                self._j({"error": "nf"}); return
            fp = os.path.join(os.path.dirname(__file__), "static", rel)
            if os.path.isfile(fp) and os.path.abspath(fp).startswith(os.path.abspath(os.path.join(os.path.dirname(__file__), "static"))):
                self._static(fp, os.path.splitext(fp)[1].lower())
            else:
                self._j({"error": "nf"})
            return
        qs = parse_qs(p.query)
        uid = qs.get("uid", [""])[0]
        if p.path == "/api/profile":
            c = db(); u = c.execute("SELECT name,lang,school_id,arrival FROM users WHERE id=?", (uid,)).fetchone(); c.close()
            self._j({"name": u["name"] if u else None, "lang": u["lang"] if u else "zh", "school_id": u["school_id"] if u else None, "arrival": u["arrival"] if u else None}); return
        if p.path == "/api/checklist":
            c = db(); rows = c.execute("SELECT id,cat_en,cat_zh,task_en,task_zh FROM checklist ORDER BY id").fetchall(); c.close()
            self._j([dict(r) for r in rows]); return
        if p.path == "/api/checks":
            c = db(); rows = c.execute("SELECT task_id,done FROM user_checks WHERE user_id=?", (uid,)).fetchall(); c.close()
            self._j({r["task_id"]: r["done"] for r in rows}); return
        if p.path == "/api/cities":
            c = db(); rows = c.execute("SELECT id,name_en,name_zh FROM cities ORDER BY id").fetchall(); c.close()
            self._j([dict(r) for r in rows]); return
        if p.path == "/api/wiki":
            cid = qs.get("city_id", [""])[0]
            c = db(); rows = c.execute("SELECT cat_en,cat_zh,title_en,title_zh,body_en,body_zh FROM wiki WHERE city_id=?", (cid,)).fetchall(); c.close()
            self._j([dict(r) for r in rows]); return
        if p.path == "/api/questions":
            lang = qs.get("lang", [""])[0]
            c = db()
            if lang in ("en", "zh"):
                rows = c.execute("SELECT id,name,lang,title,body,created_at FROM questions WHERE lang=? ORDER BY id DESC", (lang,)).fetchall()
            else:
                rows = c.execute("SELECT id,name,lang,title,body,created_at FROM questions ORDER BY id DESC").fetchall()
            c.close(); self._j([dict(r) for r in rows]); return
        if p.path == "/api/answers":
            qid = qs.get("q_id", [""])[0]
            c = db(); rows = c.execute("SELECT name,lang,text,created_at FROM answers WHERE q_id=? ORDER BY id", (qid,)).fetchall(); c.close()
            self._j([dict(r) for r in rows]); return
        if p.path == "/api/products":
            cat = qs.get("cat", [""])[0]
            c = db()
            if cat:
                rows = c.execute("SELECT id,cat,name_en,name_zh,desc_en,desc_zh,price,commission,url FROM products WHERE cat=? ORDER BY id", (cat,)).fetchall()
            else:
                rows = c.execute("SELECT id,cat,name_en,name_zh,desc_en,desc_zh,price,commission,url FROM products ORDER BY cat,id").fetchall()
            c.close(); self._j([dict(r) for r in rows]); return
        if p.path == "/api/kits":
            c = db(); rows = c.execute("SELECT id,name_en,name_zh,desc_en,desc_zh,price FROM kits ORDER BY id").fetchall(); c.close()
            self._j([dict(r) for r in rows]); return
        if p.path == "/api/my_kits":
            c = db()
            pro = is_pro(uid)
            if pro:
                # Pro members own every kit
                rows = c.execute("SELECT k.id,k.name_en,k.name_zh,k.desc_en,k.desc_zh,k.price,'paid' AS status FROM kits k").fetchall()
            else:
                rows = c.execute("SELECT k.id,k.name_en,k.name_zh,k.desc_en,k.desc_zh,k.price,o.status FROM orders o JOIN kits k ON k.id=o.kit_id WHERE o.user_id=? AND o.status='paid'", (uid,)).fetchall()
            c.close(); self._j([dict(r) for r in rows]); return
        if p.path == "/api/me":
            c = db(); row = c.execute("SELECT plan,status,expires_at FROM subscribers WHERE user_id=? AND status='active' ORDER BY id DESC LIMIT 1", (uid,)).fetchone(); c.close()
            self._j({"uid": uid, "is_pro": is_pro(uid), "plan": row["plan"] if row else None, "expires_at": row["expires_at"] if row else None, "plans": PLANS}); return
        if p.path == "/api/kit_content":
            kid = qs.get("kit_id", [""])[0]
            c = db()
            owned = c.execute("SELECT 1 FROM orders WHERE user_id=? AND kit_id=? AND status='paid'", (uid, kid)).fetchone()
            if not owned:
                c.close(); self._j({"error": "no_access"}); return
            r = c.execute("SELECT content_en,content_zh FROM kits WHERE id=?", (kid,)).fetchone(); c.close()
            self._j({"content_en": r["content_en"], "content_zh": r["content_zh"]}); return
        if p.path == "/api/mentors":
            c = db(); rows = c.execute("SELECT id,name,school_en,school_zh,bio_en,bio_zh,expertise,price FROM mentors ORDER BY id").fetchall(); c.close()
            out = [dict(r) for r in rows]
            for o in out:
                o["fee_pct"] = MENTOR_FEE_PCT
                o["platform_fee"] = round(o["price"] * MENTOR_FEE_PCT / 100)
            self._j(out); return
        if p.path == "/api/my_bookings":
            c = db(); rows = c.execute("SELECT b.id,m.name,m.school_en,m.school_zh,b.slot,b.topic,b.status FROM bookings b JOIN mentors m ON m.id=b.mentor_id WHERE b.user_id=?", (uid,)).fetchall(); c.close()
            self._j([dict(r) for r in rows]); return
        if p.path == "/api/schools":
            c = db(); rows = c.execute("SELECT s.id,s.name_en,s.name_zh,s.city_id,c.name_en AS city_en,c.name_zh AS city_zh,s.country_en,s.country_zh FROM schools s JOIN cities c ON c.id=s.city_id ORDER BY s.id").fetchall(); c.close()
            self._j([dict(r) for r in rows]); return
        if p.path == "/api/school_tasks":
            sid = qs.get("school_id", [""])[0]
            c = db(); rows = c.execute("SELECT id,school_id,cat_en,cat_zh,task_en,task_zh FROM school_tasks WHERE school_id=? ORDER BY id", (sid,)).fetchall(); c.close()
            self._j([dict(r) for r in rows]); return
        if p.path == "/api/school_checklist":
            sid = qs.get("school_id", [""])[0]
            c = db(); rows = c.execute("SELECT school_task_id,done FROM user_school_checks WHERE user_id=?", (uid,)).fetchall(); c.close()
            self._j({str(r["school_task_id"]): r["done"] for r in rows}); return
        if p.path == "/api/school_note":
            sid = qs.get("school_id", [""])[0]
            c = db(); row = c.execute("SELECT note_en,note_zh FROM school_notes WHERE school_id=?", (sid,)).fetchone(); c.close()
            self._j({"note_en": row["note_en"] if row else "", "note_zh": row["note_zh"] if row else ""}); return
        # ---- Community (public = only approved items) ----
        if p.path == "/api/buddies":
            cid = qs.get("city_id", [""])[0]
            c = db()
            q = "SELECT id,name,school,city_id,arrive,note FROM buddies WHERE status='approved'"
            params = []
            if cid:
                q += " AND city_id=?"; params.append(cid)
            q += " ORDER BY id DESC"
            rows = c.execute(q, params).fetchall(); c.close()
            self._j([dict(r) for r in rows]); return
        if p.path == "/api/posts":
            cid = qs.get("city_id", [""])[0]
            kind = qs.get("kind", [""])[0]
            c = db()
            q = "SELECT id,name,kind,city_id,title,body FROM posts WHERE status='approved'"
            params = []
            if cid:
                q += " AND city_id=?"; params.append(cid)
            if kind:
                q += " AND kind=?"; params.append(kind)
            q += " ORDER BY id DESC"
            rows = c.execute(q, params).fetchall(); c.close()
            self._j([dict(r) for r in rows]); return
        if p.path == "/api/health":
            self._j({"status": "ok", "provider": PAYMENT_PROVIDER, "stripe": bool(STRIPE_SECRET_KEY), "webhook": bool(STRIPE_WEBHOOK_SECRET), "wechat": bool(WECHAT_MCH_ID and WECHAT_APIV3_KEY), "alipay": bool(ALIPAY_APP_ID and ALIPAY_APP_SECRET)}); return
        # ---- Admin console (gated: only ADMIN_EMAIL) ----
        if p.path.startswith("/api/admin/"):
            if not admin_ok(uid, qs.get("admin_token", [""])[0]):
                self.send_response(403); self.send_header("Content-Type", "application/json"); self.end_headers()
                self.wfile.write(json.dumps({"error": "forbidden"}).encode()); return
            if p.path == "/api/admin/check":
                self._j({"admin": True}); return
            if p.path == "/api/admin/overview":
                c = db()
                o = {}
                for t in ("users", "products", "kits", "orders", "mentors", "bookings", "questions", "answers"):
                    o[t] = c.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
                o["kits_sold"] = c.execute("SELECT COUNT(*) FROM orders WHERE status='paid'").fetchone()[0]
                o["clicks"] = c.execute("SELECT COUNT(*) FROM clicks").fetchone()[0]
                o["subscribers"] = c.execute("SELECT COUNT(*) FROM subscribers WHERE status='active'").fetchone()[0]
                o["sub_revenue"] = c.execute("SELECT COALESCE(SUM(CASE WHEN plan='pro_year' THEN 199 ELSE 29 END),0) FROM subscribers WHERE status='active'").fetchone()[0]
                # mentor revenue = sum(platform_fee) over confirmed/paid bookings (20% of price)
                o["mentor_revenue"] = round(c.execute("SELECT COALESCE(SUM(m.price),0) FROM bookings b JOIN mentors m ON m.id=b.mentor_id").fetchone()[0] * MENTOR_FEE_PCT / 100)
                # kit revenue (rough, using listed prices of paid orders)
                o["kit_revenue"] = c.execute("SELECT COALESCE(SUM(k.price),0) FROM orders o2 JOIN kits k ON k.id=o2.kit_id WHERE o2.status='paid'").fetchone()[0]
                c.close(); self._j(o); return
            if p.path == "/api/admin/products":
                c = db(); rows = c.execute("SELECT id,cat,name_en,name_zh,price,commission,url,(SELECT COUNT(*) FROM clicks cl WHERE cl.product_id=products.id) AS clicks FROM products ORDER BY cat,id").fetchall(); c.close()
                self._j([dict(r) for r in rows]); return
            if p.path == "/api/admin/qa":
                c = db()
                qs = c.execute("SELECT id,user_id,name,lang,title,body,created_at FROM questions ORDER BY id DESC").fetchall()
                out = []
                for q in qs:
                    ans = c.execute("SELECT id,name,lang,text FROM answers WHERE q_id=?", (q["id"],)).fetchall()
                    d = dict(q); d["answers"] = [dict(a) for a in ans]; out.append(d)
                c.close(); self._j(out); return
            # ---- Community moderation ----
            if p.path == "/api/admin/community":
                c = db()
                bud = c.execute("SELECT id,name,school,city_id,arrive,note,status FROM buddies ORDER BY id DESC").fetchall()
                pos = c.execute("SELECT id,name,kind,city_id,title,body,status FROM posts ORDER BY id DESC").fetchall()
                c.close()
                self._j({"buddies": [dict(r) for r in bud], "posts": [dict(r) for r in pos]}); return
            self._j({"error": "unknown_admin"}); return
        self._j({"error": "unknown"})

    def do_POST(self):
        p = urlparse(self.path)
        # Stripe webhook: needs the RAW body + signature header (no JSON pre-parse)
        if p.path == "/api/stripe_webhook":
            n = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(n) or b"{}"
            sig = self.headers.get("Stripe-Signature", "")
            if not STRIPE_WEBHOOK_SECRET:
                self.send_response(200); self.send_header("Content-Type", "application/json"); self.end_headers()
                self.wfile.write(json.dumps({"received": True, "note": "webhook secret not set"}).encode()); return
            try:
                event = verify_stripe_sig(raw, sig, STRIPE_WEBHOOK_SECRET)
            except ValueError as e:
                self.send_response(400); self.send_header("Content-Type", "application/json"); self.end_headers()
                self.wfile.write(json.dumps({"error": "bad_signature", "detail": str(e)}).encode()); return
            if event.get("type") == "checkout.session.completed":
                sess = event["data"]["object"]
                ref = sess.get("client_reference_id") or ""
                if ":" in ref:
                    parts = ref.split(":", 2)
                    if parts[0] == "sub" and len(parts) == 3:
                        activate_sub(parts[1], parts[2])
                    else:
                        uid, kit_id = ref.split(":", 1)
                        try:
                            fulfill_order(uid, int(kit_id))
                        except Exception:
                            pass
            self.send_response(200); self.send_header("Content-Type", "application/json"); self.end_headers()
            self.wfile.write(json.dumps({"received": True}).encode()); return
        # ---- WeChat Pay notify ----
        if p.path == "/api/wechat_notify":
            raw = self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}"
            ts = self.headers.get("Wechatpay-Timestamp", "")
            nonce = self.headers.get("Wechatpay-Nonce", "")
            sig = self.headers.get("Wechatpay-Signature", "")
            if not WECHAT_APIV3_KEY:
                self.send_response(200); self.send_header("Content-Type", "application/json"); self.end_headers()
                self.wfile.write(json.dumps({"code": "SUCCESS", "note": "wechat key not set"}).encode()); return
            if not verify_wechat_sig(ts, nonce, raw, sig, WECHAT_APIV3_KEY):
                self.send_response(401); self.send_header("Content-Type", "application/json"); self.end_headers()
                self.wfile.write(json.dumps({"code": "FAIL", "message": "bad_signature"}).encode()); return
            try:
                evt = json.loads(raw.decode("utf-8"))
                ref = evt.get("out_trade_no") or (evt.get("resource", {}) or {}).get("out_trade_no") or ""
                kind, uid, kid = parse_ref(ref)
                if kind == "sub" and uid:
                    activate_sub(uid, kid)
                elif kind == "kit" and uid and kid:
                    fulfill_order(uid, int(kid))
            except Exception:
                pass
            self.send_response(200); self.send_header("Content-Type", "application/json"); self.end_headers()
            self.wfile.write(json.dumps({"code": "SUCCESS", "message": "OK"}).encode()); return
        # ---- Alipay notify ----
        if p.path == "/api/alipay_notify":
            raw = self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}"
            try:
                form = dict(parse_qs(raw.decode("utf-8")))
                params = {k: (v[0] if isinstance(v, list) else v) for k, v in form.items()}
                sign = params.get("sign", "")
                if not ALIPAY_APP_SECRET:
                    self.send_response(200); self.end_headers(); self.wfile.write(b"success"); return
                if not verify_alipay_sig(params, sign, ALIPAY_APP_SECRET):
                    self.send_response(400); self.end_headers(); self.wfile.write(b"failure"); return
                ref = params.get("out_trade_no", "")
                kind, uid, kid = parse_ref(ref)
                if params.get("trade_status") in ("TRADE_SUCCESS", "TRADE_FINISHED", None):
                    if kind == "sub" and uid:
                        activate_sub(uid, kid)
                    elif kind == "kit" and uid and kid:
                        fulfill_order(uid, int(kid))
            except Exception:
                pass
            self.send_response(200); self.end_headers(); self.wfile.write(b"success"); return
        n = int(self.headers.get("Content-Length", 0))
        b = json.loads(self.rfile.read(n) or b"{}")
        if p.path == "/api/register":
            email = (b.get("email") or "").strip().lower()
            pw = b.get("password") or ""
            name = (b.get("name") or "同学").strip()
            lang = b.get("lang", "zh")
            # Accept phone (CN mobile: +86 + 11 digits, or 11 digits) OR email (contains @)
            is_phone = bool(re.fullmatch(r"(\+?86)?1[3-9]\d{9}", email))
            is_email = "@" in email and "." in email.split("@")[-1]
            if (not (is_phone or is_email)) or len(pw) < 6:
                self._j({"error": "invalid"}); return
            c = db()
            if c.execute("SELECT 1 FROM users WHERE email=?", (email,)).fetchone():
                c.close(); self._j({"error": "exists"}); return
            uid = "u" + secrets.token_hex(6)
            c.execute("INSERT INTO users(id,email,password,name,lang) VALUES(?,?,?,?,?)", (uid, email, hash_pw(pw), name, lang))
            c.commit(); c.close()
            self._j({"uid": uid, "name": name, "lang": lang}); return
        if p.path == "/api/login":
            ip = self.client_address[0]
            if _login_blocked(ip):
                self._j({"error": "too_many"}); return
            email = (b.get("email") or "").strip().lower()
            pw = b.get("password") or ""
            c = db(); u = c.execute("SELECT id,email,name,lang,password FROM users WHERE email=?", (email,)).fetchone(); c.close()
            if not u or not verify_pw(pw, u["password"]):
                _login_fail(ip)
                self._j({"error": "bad"}); return
            _login_ok(ip)
            resp = {"uid": u["id"], "name": u["name"], "lang": u["lang"], "is_pro": is_pro(u["id"])}
            if u["email"] == ADMIN_EMAIL:
                resp["admin_token"] = ADMIN_TOKEN
            self._j(resp); return
        if p.path == "/api/profile":
            uid = b.get("uid"); name = b.get("name", ""); lang = b.get("lang", "zh")
            c = db(); c.execute("UPDATE users SET name=?, lang=? WHERE id=?", (name, lang, uid))
            if c.rowcount == 0:
                c.execute("INSERT INTO users(id,name,lang) VALUES(?,?,?)", (uid, name, lang))
            c.commit(); c.close(); self._j({"ok": True}); return
        if p.path == "/api/check":
            c = db(); c.execute("INSERT OR REPLACE INTO user_checks(user_id,task_id,done) VALUES(?,?,?)", (b["uid"], b["task_id"], b.get("done", 1))); c.commit(); c.close()
            self._j({"ok": True}); return
        if p.path == "/api/question":
            c = db(); c.execute("INSERT INTO questions(user_id,name,lang,title,body) VALUES(?,?,?,?,?)", (b.get("uid"), b.get("name", "匿名"), b.get("lang", "zh"), b.get("title"), b.get("body", ""))); c.commit(); c.close()
            self._j({"ok": True}); return
        if p.path == "/api/answer":
            c = db(); c.execute("INSERT INTO answers(q_id,name,lang,text) VALUES(?,?,?,?)", (b["q_id"], b.get("name", "匿名"), b.get("lang", "zh"), b.get("text", ""))); c.commit(); c.close()
            self._j({"ok": True}); return
        if p.path == "/api/product_click":
            c = db(); c.execute("INSERT INTO clicks(product_id,user_id) VALUES(?,?)", (b.get("product_id"), b.get("uid"))); c.commit(); c.close()
            self._j({"ok": True}); return
        if p.path == "/api/buy_kit":
            if not PAYMENTS_ENABLED:
                self._j({"error": "coming_soon"}); return
            uid = b.get("uid"); kit_id = b.get("kit_id")
            c = db(); kit = c.execute("SELECT id,name_en,price FROM kits WHERE id=?", (kit_id,)).fetchone(); c.close()
            if not kit: self._j({"error": "no_kit"}); return
            if PAYMENT_PROVIDER == "stripe" and STRIPE_SECRET_KEY:
                try:
                    import stripe
                    stripe.api_key = STRIPE_SECRET_KEY
                    session = stripe.checkout.Session.create(
                        payment_method_types=["card"],
                        line_items=[{"price_data": {"currency": "cny", "product_data": {"name": kit["name_en"]}, "unit_amount": int(kit["price"]) * 100}, "quantity": 1}],
                        mode="payment",
                        success_url=APP_BASE_URL + "/?paid=1",
                        cancel_url=APP_BASE_URL + "/?paid=0",
                        client_reference_id=f"{uid}:{kit_id}",
                    )
                    create_pending_order(uid, kit_id)
                    self._j({"checkout_url": session.url}); return
                except Exception as e:
                    self._j({"error": "stripe_failed", "detail": str(e)}); return
            if PAYMENT_PROVIDER == "wechat" and WECHAT_MCH_ID and WECHAT_APIV3_KEY:
                # Native QR pay: in production call WeChat's /pay/transactions/native with
                # client_reference_id embedded; here we return a pay_url + the pending order.
                create_pending_order(uid, kit_id)
                pay_url = f"{APP_BASE_URL}/pay/wechat?uid={uid}&kit={kit_id}"
                self._j({"pay_url": pay_url, "provider": "wechat"}); return
            if PAYMENT_PROVIDER == "alipay" and ALIPAY_APP_ID and ALIPAY_APP_SECRET:
                create_pending_order(uid, kit_id)
                pay_url = f"{APP_BASE_URL}/pay/alipay?uid={uid}&kit={kit_id}"
                self._j({"pay_url": pay_url, "provider": "alipay"}); return
            # mock: instant unlock (dev / no provider configured)
            c = db(); cur = c.execute("INSERT INTO orders(user_id,kit_id,status) VALUES(?,?,?)", (uid, kit_id, "paid"))
            oid = cur.lastrowid; c.commit(); c.close(); self._j({"ok": True, "order_id": oid, "mock": True}); return
        if p.path == "/api/subscribe":
            if not PAYMENTS_ENABLED:
                self._j({"error": "coming_soon"}); return
            uid = b.get("uid"); plan = b.get("plan", "pro_month")
            if plan not in PLANS: self._j({"error": "bad_plan"}); return
            price = PLANS[plan]["price"]
            if PAYMENT_PROVIDER == "stripe" and STRIPE_SECRET_KEY:
                try:
                    import stripe
                    stripe.api_key = STRIPE_SECRET_KEY
                    session = stripe.checkout.Session.create(
                        payment_method_types=["card"],
                        line_items=[{"price_data": {"currency": "cny", "product_data": {"name": PLANS[plan]["name_en"]}, "unit_amount": int(price) * 100}, "quantity": 1}],
                        mode="payment",
                        success_url=APP_BASE_URL + "/?sub=1",
                        cancel_url=APP_BASE_URL + "/?sub=0",
                        client_reference_id=f"sub:{uid}:{plan}",
                    )
                    create_pending_sub(uid, plan)
                    self._j({"checkout_url": session.url}); return
                except Exception as e:
                    self._j({"error": "stripe_failed", "detail": str(e)}); return
            if PAYMENT_PROVIDER in ("wechat", "alipay") and ((PAYMENT_PROVIDER == "wechat" and WECHAT_MCH_ID and WECHAT_APIV3_KEY) or (PAYMENT_PROVIDER == "alipay" and ALIPAY_APP_ID and ALIPAY_APP_SECRET)):
                create_pending_sub(uid, plan)
                pay_url = f"{APP_BASE_URL}/pay/{PAYMENT_PROVIDER}?uid={uid}&plan={plan}&sub=1"
                self._j({"pay_url": pay_url, "provider": PAYMENT_PROVIDER}); return
            # mock: instant pro (dev / no provider configured)
            c = db(); c.execute("INSERT INTO subscribers(user_id,plan,status,expires_at) VALUES(?,?,?,?)",
                                (uid, plan, "active", (datetime.now() + timedelta(days=(365 if plan == "pro_year" else 30))).strftime("%Y-%m-%d %H:%M:%S")))
            c.commit(); c.close(); self._j({"ok": True, "mock": True, "is_pro": True}); return
        if p.path == "/api/book":
            c = db(); c.execute("INSERT INTO bookings(user_id,mentor_id,slot,topic,status) VALUES(?,?,?,?,?)", (b.get("uid"), b.get("mentor_id"), b.get("slot"), b.get("topic"), "pending")); c.commit(); c.close()
            self._j({"ok": True}); return
        if p.path == "/api/set_school":
            c = db(); c.execute("UPDATE users SET school_id=? WHERE id=?", (b.get("school_id"), b.get("uid"))); c.commit(); c.close()
            self._j({"ok": True}); return
        if p.path == "/api/set_arrival":
            c = db(); c.execute("UPDATE users SET arrival=? WHERE id=?", ((b.get("arrival") or "")[:20], b.get("uid"))); c.commit(); c.close()
            self._j({"ok": True}); return
        if p.path == "/api/school_check":
            c = db(); c.execute("INSERT OR REPLACE INTO user_school_checks(user_id,school_task_id,done) VALUES(?,?,?)", (b.get("uid"), b.get("task_id"), b.get("done", 1))); c.commit(); c.close()
            self._j({"ok": True}); return
        # ---- Community submit (status='pending' until admin approves) ----
        if p.path == "/api/buddy_add":
            if not b.get("uid"):
                self._j({"error": "login"}); return
            c = db()
            c.execute("INSERT INTO buddies(user_id,name,school,city_id,arrive,wechat,note,status) VALUES(?,?,?,?,?,?,?,'pending')",
                      (b.get("uid"), (b.get("name") or "同学").strip(), (b.get("school") or "").strip(),
                       int(b.get("city_id") or 0), (b.get("arrive") or "").strip(), (b.get("wechat") or "").strip(), (b.get("note") or "").strip()))
            c.commit(); c.close()
            self._j({"ok": True, "pending": True}); return
        if p.path == "/api/post_add":
            if not b.get("uid"):
                self._j({"error": "login"}); return
            c = db()
            c.execute("INSERT INTO posts(user_id,name,kind,city_id,title,body,contact,status) VALUES(?,?,?,?,?,?,?,'pending')",
                      (b.get("uid"), (b.get("name") or "同学").strip(), (b.get("kind") or "info"), int(b.get("city_id") or 0),
                       (b.get("title") or "").strip(), (b.get("body") or "").strip(), (b.get("contact") or "").strip()))
            c.commit(); c.close()
            self._j({"ok": True, "pending": True}); return
        # ---- Admin console POST (gated: only ADMIN_EMAIL) ----
        if p.path.startswith("/api/admin/"):
            uid = b.get("uid")
            if not admin_ok(uid, b.get("admin_token")):
                self.send_response(403); self.send_header("Content-Type", "application/json"); self.end_headers()
                self.wfile.write(json.dumps({"error": "forbidden"}).encode()); return
            if p.path == "/api/admin/product_save":
                c = db(); c.execute("UPDATE products SET url=?, commission=?, price=? WHERE id=?",
                                    (b.get("url", ""), b.get("commission", ""), b.get("price", ""), b.get("id")))
                c.commit(); c.close(); self._j({"ok": True}); return
            if p.path == "/api/admin/qa_delete":
                c = db()
                if b.get("answer_id"):
                    c.execute("DELETE FROM answers WHERE id=?", (b["answer_id"],))
                else:
                    c.execute("DELETE FROM answers WHERE q_id=?", (b["q_id"],))
                    c.execute("DELETE FROM questions WHERE id=?", (b["q_id"],))
                c.commit(); c.close(); self._j({"ok": True}); return
            if p.path == "/api/admin/mod":
                if b.get("what") == "buddy":
                    c = db(); c.execute("UPDATE buddies SET status=? WHERE id=?", (b.get("status"), b.get("id"))); c.commit(); c.close()
                elif b.get("what") == "post":
                    c = db(); c.execute("UPDATE posts SET status=? WHERE id=?", (b.get("status"), b.get("id"))); c.commit(); c.close()
                self._j({"ok": True}); return
        self._j({"error": "unknown"})


if __name__ == "__main__":
    init()
    HOST = os.environ.get("HOST", "0.0.0.0")
    PORT = int(os.environ.get("PORT", "8000"))
    socketserver.TCPServer.allow_reuse_address = True
    with http.server.ThreadingHTTPServer((HOST, PORT), H) as httpd:
        print(f"留学生落地包 · Landing Pack  serving on http://{HOST}:{PORT}")
        print(f"  payment_provider={PAYMENT_PROVIDER}  stripe={'on' if STRIPE_SECRET_KEY else 'off'}")
        print(f"  db={DB}")
        httpd.serve_forever()
