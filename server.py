#!/usr/bin/env python3
"""留学生落地包 (Landing Pack) — bilingual hub for international Chinese students.
Stdlib-only backend with hardened auth: pbkdf2 hashing, httpOnly session cookies,
login lockout, email verification + password reset (dev link mode)."""
import http.server
import socketserver
import json
import os
import sqlite3
import hashlib
import hmac
import secrets
import time
from urllib.parse import urlparse, parse_qs

DB = os.path.join(os.path.dirname(__file__), "app.db")
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
    ],
}

TEMPLATES = [
    ("Visa", "签证", "签证邀请信 / 录取信清单", "Visa invitation letter checklist",
     "1. 学校正式录取信（带签名/印章）\n2. CAS / I-20 / COE 等签证函\n3. 资金证明（银行存款/奖学金）\n4. 护照首页复印件\n5. 肺结核体检报告（部分国家）",
     "1. Official offer letter (signed/stamped)\n2. CAS / I-20 / COE visa document\n3. Proof of funds (bank/scholarship)\n4. Passport photo page copy\n5. TB test report (some countries)"),
    ("Housing", "住宿", "租房合同检查清单", "Rental contract checklist",
     "1. 房东/中介身份与合同主体\n2. 租期与起止日期\n3. 押金金额与退还条件\n4. 是否含账单（水电网气）\n5. 提前退租/转租条款",
     "1. Landlord/agent identity & parties\n2. Tenancy term & dates\n3. Deposit amount & return terms\n4. Bills included (water/electric/gas)\n5. Early exit/sublet clauses"),
    ("Arrival", "抵达", "落地必备清单", "Arrival essentials",
     "1. 护照 + 签证 + 录取信（纸质+电子版）\n2. 现金 + 国际信用卡\n3. 驾照翻译/国际驾照\n4. 常用药 + 处方\n5. 转换插头 + 当地手机卡",
     "1. Passport + visa + offer (paper + digital)\n2. Cash + intl credit card\n3. Driving licence translation/IDP\n4. Meds + prescriptions\n5. Adapter + local SIM"),
]

PRESETS = {
    "London": [
        ("Visa", "签证", "申请 BRP / eVisa 注册", "Register BRP / eVisa"),
        ("Insurance", "保险", "注册 NHS 全科医生(GP)", "Register with an NHS GP"),
        ("Bank", "银行卡", "预约银行开户(带 BRP)", "Book bank appointment (with BRP)"),
    ],
    "New York": [
        ("Visa", "签证", "激活 SEVIS / 入境", "Activate SEVIS / enter US"),
        ("Bank", "银行卡", "办 SSN 后开美国银行卡", "Open US bank after SSN"),
        ("Phone", "手机", "办美国运营商套餐", "Get a US carrier plan"),
    ],
    "Sydney": [
        ("Visa", "签证", "激活 COE / 入境", "Activate CoE / enter AU"),
        ("Bank", "银行卡", "开澳洲银行账户", "Open AU bank account"),
        ("Insurance", "保险", "买 OSHC 保险", "Get OSHC insurance"),
    ],
    "Toronto": [
        ("Visa", "签证", "激活学签 / 入境", "Activate study permit / enter CA"),
        ("Bank", "银行卡", "开加拿大银行账户", "Open CA bank account"),
        ("Phone", "手机", "办加拿大手机套餐", "Get CA phone plan"),
    ],
    "Tokyo": [
        ("Visa", "签证", "在留卡换发 + 住民票", "Residence card + address"),
        ("Bank", "银行卡", "开日本银行账户", "Open JP bank account"),
        ("Phone", "手机", "办日本手机/格安SIM", "Get JP phone / budget SIM"),
    ],
}

def db():
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row
    return c


def hash_pw(pw, salt=None):
    salt = salt or secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 100000)
    return salt, dk.hex()


def verify_pw(pw, salt, h):
    _, d = hash_pw(pw, salt)
    return hmac.compare_digest(d, h)


def new_token():
    return secrets.token_hex(16)


def init():
    c = db()
    c.executescript("""
    CREATE TABLE IF NOT EXISTS accounts(id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, email TEXT, pw_salt TEXT, pw_hash TEXT, lang TEXT DEFAULT 'zh', verified INTEGER DEFAULT 0, verify_token TEXT, reset_token TEXT, fail_count INTEGER DEFAULT 0, lock_until TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS checklist(id INTEGER PRIMARY KEY AUTOINCREMENT, cat_en TEXT, cat_zh TEXT, task_en TEXT, task_zh TEXT);
    CREATE TABLE IF NOT EXISTS user_checks(user_id TEXT, task_id INTEGER, done INTEGER DEFAULT 0, PRIMARY KEY(user_id, task_id));
    CREATE TABLE IF NOT EXISTS cities(id INTEGER PRIMARY KEY AUTOINCREMENT, name_en TEXT, name_zh TEXT);
    CREATE TABLE IF NOT EXISTS wiki(id INTEGER PRIMARY KEY AUTOINCREMENT, city_id INTEGER, cat_en TEXT, cat_zh TEXT, title_en TEXT, title_zh TEXT, body_en TEXT, body_zh TEXT);
    CREATE TABLE IF NOT EXISTS questions(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, name TEXT, lang TEXT, title TEXT, body TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS answers(id INTEGER PRIMARY KEY AUTOINCREMENT, q_id INTEGER, name TEXT, lang TEXT, text TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS templates(id INTEGER PRIMARY KEY AUTOINCREMENT, cat_en TEXT, cat_zh TEXT, title_en TEXT, title_zh TEXT, body_en TEXT, body_zh TEXT);
    CREATE TABLE IF NOT EXISTS presets(id INTEGER PRIMARY KEY AUTOINCREMENT, city_id INTEGER, cat_en TEXT, cat_zh TEXT, task_en TEXT, task_zh TEXT);
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
    if c.execute("SELECT COUNT(*) FROM templates").fetchone()[0] == 0:
        c.executemany("INSERT INTO templates(cat_en,cat_zh,title_en,title_zh,body_en,body_zh) VALUES(?,?,?,?,?,?)", TEMPLATES)
    if c.execute("SELECT COUNT(*) FROM presets").fetchone()[0] == 0:
        for en, zh in CITIES:
            cid = c.execute("SELECT id FROM cities WHERE name_en=?", (en,)).fetchone()[0]
            for cat_en, cat_zh, t_en, t_zh in PRESETS[en]:
                c.execute("INSERT INTO presets(city_id,cat_en,cat_zh,task_en,task_zh) VALUES(?,?,?,?,?)",
                          (cid, cat_en, cat_zh, t_en, t_zh))
    c.commit()
    c.close()


class H(http.server.BaseHTTPRequestHandler):
    def _j(self, obj, code=200, cookie=None):
        self.send_response(code)
        if cookie is not None:
            self.send_header("Set-Cookie", cookie)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(obj, ensure_ascii=False).encode("utf-8"))

    def _cookie(self, token="", clear=False):
        ma = 0 if clear else 60 * 60 * 24 * 30
        v = "" if clear else token
        s = f"lp_token={v}; Path=/; HttpOnly; SameSite=Lax; Max-Age={ma}"
        if os.environ.get("LP_HTTPS") == "1":
            s += "; Secure"
        return s

    def _static(self, fp, ext):
        ct = {".css": "text/css", ".js": "application/javascript", ".html": "text/html"}.get(ext, "application/octet-stream")
        self.send_response(200)
        self.send_header("Content-Type", ct)
        self.end_headers()
        self.wfile.write(open(fp, encoding="utf-8").read().encode("utf-8"))

    def _cookie_token(self):
        raw = self.headers.get("Cookie", "")
        for part in raw.split(";"):
            k, _, v = part.strip().partition("=")
            if k == "lp_token":
                return v
        return ""

    def _token(self, p, qs):
        ck = self._cookie_token()
        if ck:
            c = db(); r = c.execute("SELECT user_id FROM sessions WHERE token=?", (ck,)).fetchone(); c.close()
            return ck if r else None
        t = qs.get("token", [""])[0]
        if not t and self.headers.get("Authorization", "").startswith("Bearer "):
            t = self.headers["Authorization"][7:]
        if not t:
            return None
        c = db(); r = c.execute("SELECT user_id FROM sessions WHERE token=?", (t,)).fetchone(); c.close()
        return t if r else None

    def do_GET(self):
        p = urlparse(self.path)
        if p.path in ("/", "/index.html"):
            self._static(os.path.join(os.path.dirname(__file__), "static", "index.html"), ".html")
            return
        if p.path == "/app.html":
            self._static(os.path.join(os.path.dirname(__file__), "static", "app.html"), ".html")
            return
        if p.path.startswith("/static/"):
            fp = os.path.join(os.path.dirname(__file__), p.path.lstrip("/"))
            if os.path.exists(fp):
                self._static(fp, os.path.splitext(fp)[1].lower())
            else:
                self._j({"error": "nf"}, 404)
            return
        qs = parse_qs(p.query)
        if p.path.startswith("/api/") and p.path not in ("/api/register", "/api/login", "/api/verify"):
            if not self._token(p, qs):
                self._j({"error": "unauth"}, 401)
                return
        if p.path == "/api/verify":
            vt = qs.get("token", [""])[0]
            c = db(); r = c.execute("SELECT id FROM accounts WHERE verify_token=?", (vt,)).fetchone()
            if not r:
                c.close(); return self._j({"error": "invalid or used link"}, 400)
            c.execute("UPDATE accounts SET verified=1, verify_token=NULL WHERE id=?", (r["id"],))
            c.commit(); c.close()
            self._j({"ok": True, "verified": True}); return
        if p.path == "/api/me":
            tok = self._token(p, qs)
            if not tok: return self._j({"error": "unauth"}, 401)
            c = db(); a = c.execute("SELECT username, lang, verified FROM accounts WHERE id=(SELECT user_id FROM sessions WHERE token=?)", (tok,)).fetchone(); c.close()
            self._j({"username": a["username"], "lang": a["lang"], "verified": a["verified"] == 1}); return
        if p.path == "/api/checklist":
            c = db(); rows = c.execute("SELECT id,cat_en,cat_zh,task_en,task_zh FROM checklist ORDER BY id").fetchall(); c.close()
            self._j([dict(r) for r in rows]); return
        if p.path == "/api/templates":
            c = db(); rows = c.execute("SELECT cat_en,cat_zh,title_en,title_zh,body_en,body_zh FROM templates ORDER BY id").fetchall(); c.close()
            self._j([dict(r) for r in rows]); return
        if p.path == "/api/presets":
            cid = qs.get("city_id", [""])[0]
            c = db(); rows = c.execute("SELECT id,cat_en,cat_zh,task_en,task_zh FROM presets WHERE city_id=?", (cid,)).fetchall(); c.close()
            self._j([dict(r) for r in rows]); return
        if p.path == "/api/checks":
            uid = self._token(p, qs)
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
            c.close()
            self._j([dict(r) for r in rows]); return
        if p.path == "/api/answers":
            qid = qs.get("q_id", [""])[0]
            c = db(); rows = c.execute("SELECT name,lang,text,created_at FROM answers WHERE q_id=? ORDER BY id", (qid,)).fetchall(); c.close()
            self._j([dict(r) for r in rows]); return
        self._j({"error": "unknown"}, 404)

    def do_POST(self):
        p = urlparse(self.path)
        n = int(self.headers.get("Content-Length", 0))
        b = json.loads(self.rfile.read(n) or b"{}")
        qs = parse_qs(p.query)
        if p.path.startswith("/api/") and p.path not in ("/api/register", "/api/login", "/api/forgot", "/api/reset", "/api/verify", "/api/resend"):
            if not self._token(p, qs):
                self._j({"error": "unauth"}, 401)
                return
        if p.path == "/api/register":
            un = (b.get("username") or "").strip()
            em = (b.get("email") or "").strip()
            pw = b.get("password", "")
            if len(un) < 2: return self._j({"error": "用户名至少 2 个字符 / username too short"}, 400)
            if len(pw) < 6: return self._j({"error": "密码至少 6 位 / password too short"}, 400)
            c = db()
            if c.execute("SELECT id FROM accounts WHERE username=?", (un,)).fetchone():
                c.close(); return self._j({"error": "用户名已存在 / username taken"}, 409)
            if em and c.execute("SELECT id FROM accounts WHERE email=?", (em,)).fetchone():
                c.close(); return self._j({"error": "邮箱已注册 / email taken"}, 409)
            salt, h = hash_pw(pw)
            vt = secrets.token_hex(16)
            c.execute("INSERT INTO accounts(username,email,pw_salt,pw_hash,lang,verify_token) VALUES(?,?,?,?,?,?)", (un, em, salt, h, b.get("lang", "zh"), vt))
            uid = c.execute("SELECT last_insert_rowid()").fetchone()[0]
            tok = new_token()
            c.execute("INSERT INTO sessions(token,user_id) VALUES(?,?)", (tok, uid))
            c.commit(); c.close()
            self._j({"username": un, "verify_url": "/api/verify?token=" + vt}, 200, self._cookie(tok))
            return
        if p.path == "/api/login":
            ident = (b.get("username") or "").strip()
            pw = b.get("password", "")
            c = db()
            a = c.execute("SELECT id,pw_salt,pw_hash,username,verified,fail_count,lock_until FROM accounts WHERE username=? OR email=?", (ident, ident)).fetchone()
            if not a:
                c.close(); return self._j({"error": "用户名或密码错误 / invalid credentials"}, 401)
            if a["lock_until"] and int(time.time()) < int(a["lock_until"]):
                c.close(); return self._j({"error": "账户已锁定，请 5 分钟后再试 / account locked"}, 423)
            if not verify_pw(pw, a["pw_salt"], a["pw_hash"]):
                fc = a["fail_count"] + 1
                if fc >= 5:
                    c.execute("UPDATE accounts SET fail_count=?, lock_until=? WHERE id=?", (fc, int(time.time()) + 300, a["id"]))
                else:
                    c.execute("UPDATE accounts SET fail_count=? WHERE id=?", (fc, a["id"]))
                c.commit(); c.close()
                return self._j({"error": "用户名或密码错误 / invalid credentials"}, 401)
            c.execute("UPDATE accounts SET fail_count=0, lock_until=NULL WHERE id=?", (a["id"],))
            tok = new_token()
            c.execute("INSERT INTO sessions(token,user_id) VALUES(?,?)", (tok, a["id"]))
            c.commit(); c.close()
            self._j({"username": a["username"], "verified": a["verified"] == 1}, 200, self._cookie(tok))
            return
        if p.path == "/api/resend":
            ident = (b.get("username") or "").strip()
            c = db(); a = c.execute("SELECT id,verify_token FROM accounts WHERE username=? OR email=?", (ident, ident)).fetchone()
            if not a: c.close(); return self._j({"error": "账户不存在 / account not found"}, 404)
            vt = secrets.token_hex(16)
            c.execute("UPDATE accounts SET verify_token=? WHERE id=?", (vt, a["id"])); c.commit(); c.close()
            self._j({"verify_url": "/api/verify?token=" + vt}); return
        if p.path == "/api/forgot":
            ident = (b.get("username") or "").strip()
            c = db(); a = c.execute("SELECT id,reset_token FROM accounts WHERE username=? OR email=?", (ident, ident)).fetchone()
            if not a: c.close(); return self._j({"error": "账户不存在 / account not found"}, 404)
            rt = secrets.token_hex(16)
            c.execute("UPDATE accounts SET reset_token=? WHERE id=?", (rt, a["id"])); c.commit(); c.close()
            self._j({"reset_url": "/api/reset?token=" + rt + "&username=" + ident}); return
        if p.path == "/api/reset":
            rt = b.get("token", "")
            un = (b.get("username") or "").strip()
            pw = b.get("password", "")
            if len(pw) < 6: return self._j({"error": "密码至少 6 位 / password too short"}, 400)
            c = db(); a = c.execute("SELECT id,pw_salt FROM accounts WHERE username=? AND reset_token=?", (un, rt)).fetchone()
            if not a: c.close(); return self._j({"error": "链接无效 / invalid link"}, 400)
            salt, h = hash_pw(pw)
            c.execute("UPDATE accounts SET pw_salt=?, pw_hash=?, reset_token=NULL, fail_count=0, lock_until=NULL WHERE id=?", (salt, h, a["id"]))
            c.commit(); c.close()
            self._j({"ok": True}); return
        if p.path == "/api/logout":
            tok = self._token(p, qs)
            c = db(); c.execute("DELETE FROM sessions WHERE token=?", (tok,)); c.commit(); c.close()
            self._j({"ok": True}, 200, self._cookie(clear=True)); return
        if p.path == "/api/me":
            tok = self._token(p, qs)
            if not tok: return self._j({"error": "unauth"}, 401)
            c = db(); u = c.execute("SELECT user_id FROM sessions WHERE token=?", (tok,)).fetchone()
            if not u: c.close(); return self._j({"error": "unauth"}, 401)
            c.execute("UPDATE accounts SET lang=? WHERE id=?", (b.get("lang", "zh"), u["user_id"]))
            c.commit(); c.close()
            self._j({"ok": True}); return
        uid = self._token(p, qs)
        if not uid:
            return self._j({"error": "unauth"}, 401)
        if p.path == "/api/check":
            c = db(); c.execute("INSERT OR REPLACE INTO user_checks(user_id,task_id,done) VALUES(?,?,?)", (uid, b["task_id"], b.get("done", 1))); c.commit(); c.close()
            self._j({"ok": True}); return
        if p.path == "/api/question":
            c = db(); name = c.execute("SELECT username FROM accounts WHERE id=(SELECT user_id FROM sessions WHERE token=?)", (uid,)).fetchone()["username"]
            c.execute("INSERT INTO questions(user_id,name,lang,title,body) VALUES(?,?,?,?,?)", (uid, name, b.get("lang", "zh"), b.get("title"), b.get("body", ""))); c.commit(); c.close()
            self._j({"ok": True}); return
        if p.path == "/api/answer":
            c = db(); name = c.execute("SELECT username FROM accounts WHERE id=(SELECT user_id FROM sessions WHERE token=?)", (uid,)).fetchone()["username"]
            c.execute("INSERT INTO answers(q_id,name,lang,text) VALUES(?,?,?,?)", (b["q_id"], name, b.get("lang", "zh"), b.get("text", ""))); c.commit(); c.close()
            self._j({"ok": True}); return
        self._j({"error": "unknown"}, 404)


if __name__ == "__main__":
    init()
    PORT = int(os.environ.get("PORT", 8000))
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("0.0.0.0", PORT), H) as s:
        print(f"留学生落地包 serving on http://localhost:{PORT}")
        s.serve_forever()
