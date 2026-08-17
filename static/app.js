// Native bridge: route /api/* calls to the configured backend (window.API_BASE),
// so the bundled app talks to YOUR server, not the local file origin.
(function () {
  const BASE = (typeof window !== "undefined" && window.API_BASE) || "";
  const _orig = window.fetch ? window.fetch.bind(window) : null;
  if (_orig) {
    window.fetch = function (input, init) {
      if (typeof input === "string" && input.indexOf("/api/") === 0) {
        return _orig(BASE + input, init);
      }
      return _orig(input, init);
    };
  }
})();
const I18N = {
  zh: {
    badge: "✈ 留学落地 · Study Abroad", hero_title: "你的留学落地第一站",
    hero_sub: "行前清单 · 城市生存指南 · 同校前辈问答。全程中文 / English 双语。",
    f_check: "落地清单", f_guide: "城市指南", f_qa: "前辈问答",
    login: "登录", register: "注册", logout: "退出",
    demo_hint: "演示账号 demo@landing.pack / demo1234",
    email_ph: "邮箱 Email", name_ph: "昵称 Nickname", pw_ph: "密码 Password (≥6位)",
    check_title: "行前落地清单", check_sub: "勾选你已完成的事项，出发前不漏项。",
    guide_title: "城市生存指南", qa_title: "同校前辈问答",
    qa_all: "全部", qa_ask: "我要提问", qa_submit: "发布",
    tab_check: "清单", tab_guide: "指南", tab_qa: "问答",
    tab_shop: "商城", tab_kit: "落地包", tab_mentor: "前辈",
    shop_title: "好物商城", shop_sub: "落地刚需好物，专属优惠链接，你买我们返佣（不加价）。",
    cat_all: "全部", cat_sim: "通讯", cat_insurance: "保险", cat_flight: "机票", cat_bank: "银行", cat_essentials: "生活好物",
    buy_aff: "前往购买",
    kit_title: "落地包", kit_sub: "中英双语数字产品，一次购买永久查看下载。",
    kit_mine: "我的落地包", kit_buy: "购买", kit_owned: "已拥有 · 查看", kit_view: "查看", kit_download: "下载", kit_pay_hint: "模拟支付（部署时接入 Stripe / 微信支付）",
    mentor_title: "前辈预约", mentor_sub: "向同校学长学姐预约 1 对 1 咨询。",
    mentor_mine: "我的预约", mentor_book: "预约", mentor_cancel: "取消", mentor_confirm: "确认", mentor_topic_ph: "想咨询的问题", school_title: "你的学校专属清单", school_sub: "选择你的学校，查看该校同学独有的行前任务。", school_select_ph: "选择你的学校…", school_none: "选择学校后显示专属清单", dl_pack: "下载打包清单",
 admin_title: "管理后台", admin_sub: "仅管理员可见 · 合作管理 / 内容审核 / 数据总览", admin_partners: "合作方管理（用户不可见）", admin_partners_sub: "填入你的专属返佣链接，保存即生效，用户端不变。", admin_mod: "内容审核 · 问答", admin_community: "社区审核 · 找同伴/本地信息", admin_save: "保存", admin_del: "删除", admin_overview: "数据总览", tab_admin: "管理", tab_sub: "会员",
 sub_title: "会员订阅", sub_sub: "升级 PRO，解锁全部技能", sub_month: "月付 ¥29", sub_year: "年付 ¥199（省 72）", sub_upgrade: "升级 PRO", sub_current: "当前会员", sub_free: "免费用户", sub_pro_badge: "PRO", sub_perks: "PRO 专属：全部落地包免费、专属清单、前辈预约 9 折、问答优先、无广告", sub_cancel: "会员到期", sub_manage: "管理订阅",
 pro_only: "PRO 专属", pro_unlock: "升级 PRO 解锁", coming_soon: "即将上线",
    tools_title: "实用工具", tools_sub: "落地生活小助手 · 免费",
    t_conv: "尺码/单位换算", t_conv_sub: "衣服尺码、温度、重量、距离一键换算",
    t_tip: "小费/税费计算", t_tip_sub: "输入账单，算小费与含税价（美加澳适用）",
    t_tz: "时区/倒计时", t_tz_sub: "上海 ↔ 留学城市时间，开学/签证倒计时",
    t_emg: "紧急联系卡", t_emg_sub: "当地报警/急救/中国领事保护，截图保存",
    t_phr: "常用语速查", t_phr_sub: "租房/银行/医院/日常中英短语，离线可用",
    conv_in: "输入", conv_out: "换算结果", conv_cat: "类型",
    tip_bill: "账单金额", tip_rate: "小费率", tip_total: "合计(含小费)", tip_tip: "小费金额",
    tz_home: "上海时间", tz_target: "留学城市", tz_now: "当地现在", tz_event: "倒计时事件", tz_date: "目标日期", tz_left: "剩余",
    emg_title: "紧急联系卡", emg_police: "当地报警", emg_amb: "急救", emg_china: "中国领事保护 12308", emg_emb: "中国大使馆", emg_save: "截图保存此卡",
    phr_cat: "场景", phr_zh: "中文", phr_en: "英文",
    done: "完成", cancel: "取消", save: "保存", close: "关闭"
  },
  en: {
    badge: "✈ Study Abroad · Landing", hero_title: "Your first stop abroad",
    hero_sub: "Pre-arrival checklist · city survival guide · peer Q&A. Fully bilingual 中文 / English.",
    f_check: "Checklist", f_guide: "City Guide", f_qa: "Peer Q&A",
    login: "Login", register: "Register", logout: "Logout",
    demo_hint: "Demo: demo@landing.pack / demo1234",
    email_ph: "Email", name_ph: "Nickname", pw_ph: "Password (≥6 chars)",
    check_title: "Pre-arrival Checklist", check_sub: "Tick what you've done so nothing is missed before departure.",
    guide_title: "City Survival Guide", qa_title: "Peer Q&A",
    qa_all: "All", qa_ask: "Ask", qa_submit: "Post",
    tab_check: "Check", tab_guide: "Guide", tab_qa: "Q&A",
    tab_shop: "Shop", tab_kit: "Kits", tab_mentor: "Mentor",
    shop_title: "Essentials Shop", shop_sub: "Landing must-haves via our partner links — we earn a commission, no extra cost to you.",
    cat_all: "All", cat_sim: "Connectivity", cat_insurance: "Insurance", cat_flight: "Flights", cat_bank: "Banking", cat_essentials: "Essentials",
    buy_aff: "Shop now",
    kit_title: "Landing Kits", kit_sub: "Bilingual digital products. Buy once, view & download forever.",
    kit_mine: "My Kits", kit_buy: "Buy", kit_owned: "Owned · View", kit_view: "View", kit_download: "Download", kit_pay_hint: "Mock payment (wire Stripe / WeChat Pay on deploy)",
    mentor_title: "Mentor Booking", mentor_sub: "Book a 1:1 with a senior student at your school.",
    mentor_mine: "My Bookings", mentor_book: "Book", mentor_cancel: "Cancel", mentor_confirm: "Confirm", mentor_topic_ph: "What to ask", school_title: "Your school's checklist", school_sub: "Pick your school to see tasks unique to its students.", school_select_ph: "Select your school…", school_none: "Select a school to see its checklist", dl_pack: "Download packing list",
 admin_title: "Admin Console", admin_sub: "Admin only · partnerships / moderation / overview", admin_partners: "Partner management (hidden from users)", admin_partners_sub: "Paste your affiliate tracking links; saved instantly, user shop unchanged.", admin_mod: "Moderation · Q&A", admin_community: "Community moderation", admin_save: "Save", admin_del: "Delete", admin_overview: "Overview", tab_admin: "Admin", tab_sub: "Pro",
 sub_title: "Membership", sub_sub: "Upgrade to PRO, unlock all skills", sub_month: "Monthly ¥29", sub_year: "Yearly ¥199 (save 72)", sub_upgrade: "Upgrade to PRO", sub_current: "Current plan", sub_free: "Free user", sub_pro_badge: "PRO", sub_perks: "PRO perks: all Kits free, exclusive checklists, mentor booking 10% off, priority Q&A, no ads", sub_cancel: "Expires", sub_manage: "Manage",
 pro_only: "PRO only", pro_unlock: "Unlock with PRO", coming_soon: "Coming soon",
 tools_title: "Tools", tools_sub: "Everyday landing helpers · free",
 t_conv: "Size / Unit converter", t_conv_sub: "Clothes sizes, temp, weight, distance",
 t_tip: "Tip & tax calculator", t_tip_sub: "Bill in → tip & tax-inclusive total (US/CA/AU)",
 t_tz: "Timezone / countdown", t_tz_sub: "Shanghai ↔ study city, term/visa countdown",
 t_emg: "Emergency card", t_emg_sub: "Local police/ambulance + China 12308, screenshot it",
 t_phr: "Phrasebook", t_phr_sub: "Renting/bank/hospital/daily CN-EN phrases, offline",
 conv_in: "Input", conv_out: "Result", conv_cat: "Type",
 tip_bill: "Bill amount", tip_rate: "Tip %", tip_total: "Total (with tip)", tip_tip: "Tip amount",
 tz_home: "Shanghai time", tz_target: "Study city", tz_now: "Local now", tz_event: "Countdown to", tz_date: "Target date", tz_left: "Left",
 emg_title: "Emergency card", emg_police: "Local police", emg_amb: "Ambulance", emg_china: "China consular 12308", emg_emb: "Chinese embassy", emg_save: "Screenshot this card",
 phr_cat: "Scene", phr_zh: "Chinese", phr_en: "English",
 done: "Done", cancel: "Cancel", save: "Save", close: "Close"
  },
};
const PLAN_I18N = {
  zh: {
    plan_title: "我的计划", plan_sub: "智能清单 + 落地前7天 + 我的收藏",
    plan_smart: "智能落地清单", plan_uni: "大学新生", plan_lang: "语言/预科", plan_grad: "研究生",
    plan_gen: "生成", plan_7: "落地前 7 天", plan_arrive: "到达日期", plan_7go: "生成日程",
    plan_fav: "我的收藏", plan_empty: "还没有收藏。在问答/指南点 ⭐ 收藏。",
    plan_pick: "选择城市与身份，生成专属清单", plan_done: "已生成", plan_save_arr: "保存落地日", cd_days: "天到落地", cd_arr: "天前落地", cd_today: "今天落地！", cd_task: "今日任务", cd_set: "设置你的落地日，开启倒计时",
    d1: "抵达：办本地手机卡 / eSIM，换钱或绑卡", d2: "学校报到：带录取信、护照、照片",
    d3: "开银行卡：预约，备齐材料", d4: "办交通卡（地铁/公交）", d5: "买日用品 + 食材（电饭煲！）",
    d6: "体检/疫苗（按学校要求）", d7: "熟悉校园 + 加同校群",
    fav_qa: "问答", fav_guide: "指南", fav_tool: "工具", unfav: "取消收藏",
  },
  en: {
    plan_title: "My Plan", plan_sub: "Smart checklist + first 7 days + favorites",
    plan_smart: "Smart arrival checklist", plan_uni: "University freshman", plan_lang: "Language/prep", plan_grad: "Graduate",
    plan_gen: "Generate", plan_7: "First 7 days", plan_arrive: "Arrival date", plan_7go: "Make plan",
    plan_fav: "My favorites", plan_empty: "No favorites yet. Tap ⭐ on Q&A / guides.",
    plan_pick: "Pick city & status to build your checklist", plan_done: "Generated", plan_save_arr: "Save arrival", cd_days: "days to landing", cd_arr: "days since landing", cd_today: "Landing day!", cd_task: "Today's task", cd_set: "Set your landing date to start the countdown",
    d1: "Arrive: get local SIM/eSIM, exchange/bind card", d2: "Register at school: offer letter, passport, photos",
    d3: "Open bank account: book + prep docs", d4: "Get transit card (metro/bus)", d5: "Buy daily stuff + food (rice cooker!)",
    d6: "Medical check / vaccines (per school)", d7: "Explore campus + join school group",
    fav_qa: "Q&A", fav_guide: "Guide", fav_tool: "Tool", unfav: "Remove",
  },
};
const COMM_I18N = {
  zh: {
    comm_title: "社区", comm_sub: "找同伴 · 本地信息 · 二手", comm_buddy: "找同伴", comm_info: "本地信息", comm_second: "二手", comm_senior: "学长学姐说",
    comm_post: "发布", comm_mod: "内容需管理员审核后显示。", comm_city: "全部城市",
    b_name: "昵称", b_school: "学校", b_arrive: "到达时间", b_wechat: "微信(选填)", b_note: "留言(选填)", b_publish: "发布找同伴",
    p_title: "标题", p_body: "内容", p_contact: "联系方式(选填)", p_publish: "发布", p_kind_info: "本地信息", p_kind_second: "二手",
    pending: "已提交，审核通过后显示", b_empty: "暂无同伴，快来发布第一个！", p_empty: "暂无内容，发布第一条吧！",
    city_label: "城市",
  },
  en: {
    comm_title: "Community", comm_sub: "Find buddies · Local info · Second-hand", comm_buddy: "Buddies", comm_info: "Local info", comm_second: "Second-hand", comm_senior: "Senior tips",
    comm_post: "Post", comm_mod: "Posts are shown after admin review.", comm_city: "All cities",
    b_name: "Nickname", b_school: "School", b_arrive: "Arrival", b_wechat: "WeChat (opt)", b_note: "Note (opt)", b_publish: "Post buddy request",
    p_title: "Title", p_body: "Content", p_contact: "Contact (opt)", p_publish: "Publish", p_kind_info: "Local info", p_kind_second: "Second-hand",
    pending: "Submitted; shown after review", b_empty: "No buddies yet — be the first!", p_empty: "Nothing here yet — post first!",
    city_label: "City",
  },
};
const CATS = ["all", "sim", "insurance", "flight", "bank", "essentials"];
// Monetization toggle. Free-launch = false (buttons show "coming soon", no dead payment flow).
// Flip to true (after you register the company + connect 微信/支付宝/Stripe) to enable sales.
const PAYMENTS_ENABLED = false;

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let uid = localStorage.getItem("lp_uid") || "";
let myName = localStorage.getItem("lp_name") || "同学";
let lang = localStorage.getItem("lp_lang") || "zh";
let authMode = "login";
let curShopCat = "all";
let mySchool = "";

function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const k = el.getAttribute("data-i18n");
    if (I18N[lang][k]) el.textContent = I18N[lang][k];
  });
  $("#langZh").classList.toggle("active", lang === "zh");
  $("#langEn").classList.toggle("active", lang === "en");
  updateAuthUI();
  if (!$("#home").classList.contains("hidden")) return;
  if ($("#view-check").classList.contains("active")) { renderChecklist(); loadSchools(); }
  if ($("#view-guide").classList.contains("active")) renderCities();
  if ($("#view-qa").classList.contains("active")) renderQA();
  if ($("#view-shop").classList.contains("active")) renderShop();
  if ($("#view-kit").classList.contains("active")) renderKit();
  if ($("#view-mentors").classList.contains("active")) renderMentors();
  if ($("#view-sub").classList.contains("active")) renderSub();
  if ($("#view-tools").classList.contains("active")) renderTools();
  if ($("#view-plan").classList.contains("active")) renderPlan();
  if ($("#view-comm").classList.contains("active")) renderComm();
  if ($("#view-admin").classList.contains("active") && !$("#tabAdmin").classList.contains("hidden")) renderAdmin();
}
function setLang(l) {
  lang = l;
  localStorage.setItem("lp_lang", l);
  if (uid) fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid, name: myName, lang: l }) });
  applyLang();
}
$("#langZh").onclick = () => setLang("zh");
$("#langEn").onclick = () => setLang("en");
// Delegated favorite toggle for any ⭐ button (guide/wiki/qa)
document.addEventListener("click", (e) => {
  const b = e.target.closest(".favbtn");
  if (!b) return;
  if (b.dataset.idx != null) return; // remove-button handled in renderPlan
  toggleFav(b.dataset.t, b.dataset.i, b.dataset.title, b.dataset.body);
  if (b.dataset.t === "guide" || b.dataset.t === "qa") {
    // re-render the current list to reflect star state
    if ($("#view-guide").classList.contains("active")) renderCities();
    if ($("#view-qa").classList.contains("active")) renderQA();
  }
});

document.querySelectorAll(".tab").forEach((t) => {
  t.onclick = () => {
    document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
    document.querySelectorAll(".view").forEach((x) => x.classList.remove("active"));
    t.classList.add("active");
    $("#view-" + t.dataset.view).classList.add("active");
    applyLang();
  };
});
// Programmatic tab switch (used by nudges / deep links)
function switchTab(view) {
  const t = document.querySelector('.tab[data-view="' + view + '"]');
  if (t) t.click();
}

// ---- auth ----
function showHome() {
  $("#home").classList.remove("hidden");
  $(".tabbar").classList.add("hidden");
  $("#logoutBtn").classList.add("hidden");
  document.querySelectorAll(".view").forEach((x) => x.classList.remove("active"));
}
function enterApp() {
  $("#home").classList.add("hidden");
  $(".tabbar").classList.remove("hidden");
  $("#logoutBtn").classList.remove("hidden");
  // Pro badge
  const pro = localStorage.getItem("lp_pro") === "1";
  $("#proBadge").classList.toggle("hidden", !pro);
  document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
  document.querySelector('.tab[data-view="check"]').classList.add("active");
  document.querySelectorAll(".view").forEach((x) => x.classList.remove("active"));
  $("#view-check").classList.add("active");
  applyLang();
  // Load arrival date + render countdown hero
  fetch("/api/profile?uid=" + uid).then((x) => x.json()).then((j) => {
    if (j.arrival) { myArrival = j.arrival; }
    renderCountdown();
  }).catch(() => {});
  // Reveal admin tab only for the owner account (server also enforces via admin_token).
  const at = localStorage.getItem("lp_admin");
  fetch("/api/admin/check?uid=" + uid + (at ? "&admin_token=" + encodeURIComponent(at) : "")).then((x) => x.json()).then((j) => {
    if (j.admin) { $("#tabAdmin").classList.remove("hidden"); } else { $("#tabAdmin").classList.add("hidden"); }
  }).catch(() => $("#tabAdmin").classList.add("hidden"));
}
let myArrival = localStorage.getItem("lp_arrival") || "";
function renderCountdown() {
  const el = $("#countdown");
  if (!myArrival) { el.classList.add("hidden"); return; }
  const arr = new Date(myArrival + "T00:00:00");
  const now = new Date();
  const days = Math.round((arr - now) / 86400000);
  const P = PLAN_I18N[lang];
  let num, label;
  if (days > 0) { num = days; label = P.cd_days; }
  else if (days === 0) { num = "🎉"; label = P.cd_today; }
  else { num = Math.abs(days); label = P.cd_arr; }
  $("#cdNum").textContent = num;
  $("#cdLabel").textContent = label;
  // today's task from the 7-day plan if within range
  let task = "";
  if (days > 0 && days <= 7) { const d = P["d" + days]; if (d) task = P.cd_task + "：" + d; }
  else if (days > 7) task = P.cd_task + "：" + P.d1;
  $("#cdTask").textContent = task;
  el.classList.remove("hidden");
}
function saveArrival(date) {
  myArrival = date; localStorage.setItem("lp_arrival", date);
  fetch("/api/set_arrival", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid, arrival: date }) });
  renderCountdown();
}
function updateAuthUI() {
  const L = I18N[lang];
  $("#authEmail").placeholder = L.email_ph;
  $("#authName").placeholder = L.name_ph;
  $("#authPw").placeholder = L.pw_ph;
  $("#authSubmit").textContent = authMode === "login" ? L.login : L.register;
  $("#authName").classList.toggle("hidden", authMode !== "register");
  $("#tabLogin").classList.toggle("active", authMode === "login");
  $("#tabReg").classList.toggle("active", authMode === "register");
  $("#authMsg").textContent = "";
}
$("#tabLogin").onclick = () => { authMode = "login"; updateAuthUI(); };
$("#tabReg").onclick = () => { authMode = "register"; updateAuthUI(); };

$("#authForm").onsubmit = async (e) => {
  e.preventDefault();
  const email = $("#authEmail").value.trim();
  const pw = $("#authPw").value;
  const name = $("#authName").value.trim() || "同学";
  const msg = $("#authMsg");
  if (!email || pw.length < 6) { msg.className = "msg err"; msg.textContent = lang === "zh" ? "请输入手机号/邮箱，密码至少6位" : "Enter phone/email; password ≥6"; return; }
  const isPhone = /^(\+?86)?1[3-9]\d{9}$/.test(email);
  const isEmail = email.includes("@") && email.includes(".");
  if (!isPhone && !isEmail) { msg.className = "msg err"; msg.textContent = lang === "zh" ? "手机号或邮箱格式不正确" : "Enter a valid phone or email"; return; }
  const url = authMode === "login" ? "/api/login" : "/api/register";
  const body = authMode === "login" ? { email, password: pw } : { email, password: pw, name, lang };
  const r = await (await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json();
  if (r.error === "exists") { msg.className = "msg err"; msg.textContent = lang === "zh" ? "该邮箱已注册，请登录" : "Email already registered"; return; }
  if (r.error === "bad") { msg.className = "msg err"; msg.textContent = lang === "zh" ? "邮箱或密码错误" : "Wrong email or password"; return; }
  if (r.error === "invalid") { msg.className = "msg err"; msg.textContent = lang === "zh" ? "请输入有效邮箱和密码" : "Enter a valid email and password"; return; }
  uid = r.uid; myName = r.name; lang = r.lang || "zh";
  localStorage.setItem("lp_uid", uid); localStorage.setItem("lp_name", myName); localStorage.setItem("lp_lang", lang);
  if ("is_pro" in r) localStorage.setItem("lp_pro", r.is_pro ? "1" : "0");
  if ("admin_token" in r) localStorage.setItem("lp_admin", r.admin_token); else localStorage.removeItem("lp_admin");
  enterApp();
};
$("#logoutBtn").onclick = () => {
  localStorage.removeItem("lp_uid"); localStorage.removeItem("lp_name"); localStorage.removeItem("lp_lang"); localStorage.removeItem("lp_pro");
  uid = ""; showHome();
};

// ---- checklist ----
async function renderChecklist() {
  const tasks = await (await fetch("/api/checklist")).json();
  const checks = await (await fetch("/api/checks?uid=" + uid)).json();
  const groups = {};
  tasks.forEach((t) => { (groups[t["cat_" + lang]] = groups[t["cat_" + lang]] || []).push(t); });
  let done = 0;
  const html = Object.keys(groups).map((cat) => {
    const items = groups[cat].map((t) => {
      const isDone = checks[t.id] ? 1 : 0; if (isDone) done++;
      return `<label class="item ${isDone ? "done" : ""}"><input type="checkbox" data-id="${t.id}" ${isDone ? "checked" : ""}><span class="t">${esc(t["task_" + lang])}</span></label>`;
    }).join("");
    return `<div class="grp"><div class="cat">${esc(cat)}</div>${items}</div>`;
  }).join("");
  $("#checkList").innerHTML = html;
  $("#checkProgress").textContent = (lang === "zh" ? "已完成 " : "Done ") + done + "/" + tasks.length;
  // Conversion nudge: engaged user (>=3 done) who hasn't bought a Kit -> suggest tripwire
  const nudge = $("#kitNudge");
  if (nudge && done >= 3 && uid) {
    fetch("/api/my_kits?uid=" + uid).then((x) => x.json()).then((mine) => {
      if (!mine.length) {
        nudge.classList.remove("hidden");
        nudge.innerHTML = lang === "zh"
          ? "进度不错！怕漏签证材料？<b>签证不慌包 ¥9</b> 一键照着打勾 → <button class=\"btn-sm\" onclick=\"switchTab('kit')\">去看看</button>"
          : "Good progress! Scared of missing visa docs? <b>Visa-No-Panic Kit ¥9</b> → <button class=\"btn-sm\" onclick=\"switchTab('kit')\">view</button>";
      } else {
        nudge.classList.add("hidden");
      }
    }).catch(() => nudge.classList.add("hidden"));
  } else if (nudge) {
    nudge.classList.add("hidden");
  }
  $("#checkList").querySelectorAll("input").forEach((cb) => {
    cb.onchange = async () => {
      await fetch("/api/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid, task_id: +cb.dataset.id, done: cb.checked ? 1 : 0 }) });
      renderChecklist();
    };
  });
}

async function renderSchoolChecklist() {
  $("#schoolNote").innerHTML = "";
  if (!mySchool) { $("#schoolCheckList").innerHTML = `<p class="muted">${I18N[lang].school_none}</p>`; $("#schoolProgress").textContent = ""; return; }
  const tasks = await (await fetch("/api/school_tasks?school_id=" + mySchool)).json();
  if (!tasks.length) { $("#schoolCheckList").innerHTML = `<p class="muted">${I18N[lang].school_none}</p>`; $("#schoolProgress").textContent = ""; return; }
  const checks = await (await fetch("/api/school_checklist?uid=" + uid + "&school_id=" + mySchool)).json();
  const note = await (await fetch("/api/school_note?school_id=" + mySchool)).json();
  $("#schoolNote").innerHTML = note["note_" + lang] ? `<b>${lang === "zh" ? "到校贴士" : "Arrival tips"}</b><br>${esc(note["note_" + lang])}` : "";
  const groups = {};
  tasks.forEach((t) => { (groups[t["cat_" + lang]] = groups[t["cat_" + lang]] || []).push(t); });
  let done = 0;
  const html = Object.keys(groups).map((cat) => {
    const items = groups[cat].map((t) => {
      const isDone = checks[t.id] ? 1 : 0; if (isDone) done++;
      return `<label class="item ${isDone ? "done" : ""}"><input type="checkbox" data-id="${t.id}" ${isDone ? "checked" : ""}><span class="t">${esc(t["task_" + lang])}</span></label>`;
    }).join("");
    return `<div class="grp"><div class="cat">${esc(cat)}</div>${items}</div>`;
  }).join("");
  $("#schoolCheckList").innerHTML = html;
  $("#schoolProgress").textContent = (lang === "zh" ? "已完成 " : "Done ") + done + "/" + tasks.length;
  $("#schoolCheckList").querySelectorAll("input").forEach((cb) => {
    cb.onchange = async () => {
      await fetch("/api/school_check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid, task_id: +cb.dataset.id, done: cb.checked ? 1 : 0 }) });
      renderSchoolChecklist();
    };
  });
}

async function loadSchools() {
  const schools = await (await fetch("/api/schools")).json();
  const sel = $("#schoolSel");
  sel.innerHTML = `<option value="">${I18N[lang].school_select_ph}</option>` + schools.map((s) => `<option value="${s.id}" ${String(s.id) === String(mySchool) ? "selected" : ""}>${esc(s["name_" + lang])} · ${esc(s.city_zh || s.city_en)}</option>`).join("");
  sel.onchange = async () => {
    mySchool = sel.value;
    await fetch("/api/set_school", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid, school_id: mySchool }) });
    renderSchoolChecklist();
  };
  renderSchoolChecklist();
}
$("#dlPack").onclick = () => {
  const a = document.createElement("a"); a.href = "/static/templates/packing-" + lang + ".md"; a.download = "packing-" + lang + ".md"; a.click();
};

// ---- guide ----
let curCity = null;
async function renderCities() {
  const cities = await (await fetch("/api/cities")).json();
  if (!curCity && cities.length) curCity = cities[0].id;
  $("#cityTabs").innerHTML = cities.map((c) => `<div class="ct ${c.id === curCity ? "active" : ""}" data-id="${c.id}">${esc(c["name_" + lang])}</div>`).join("");
  $("#cityTabs").querySelectorAll(".ct").forEach((el) => { el.onclick = () => { curCity = +el.dataset.id; renderCities(); renderWiki(); }; });
  renderWiki();
}
async function renderWiki() {
  if (!curCity) return;
  const rows = await (await fetch("/api/wiki?city_id=" + curCity)).json();
  $("#wikiList").innerHTML = rows.map((w) => `<div class="w"><span class="wc">${esc(w["cat_" + lang])}</span><h3>${esc(w["title_" + lang])}</h3><p>${esc(w["body_" + lang])}</p>${favStar("guide", w.id, w["title_" + lang], w["body_" + lang])}</div>`).join("");
}

// ---- qa ----
async function renderQA() {
  const l = $("#qaLang").value;
  const qs = await (await fetch("/api/questions?lang=" + l)).json();
  const list = $("#qaList");
  list.innerHTML = qs.map((q) => `<div class="q" data-id="${q.id}">
    <div class="qh">${esc(q.title)}</div>
    <div class="qm">${esc(q.name)} · ${q.lang === "zh" ? "中文" : "EN"}</div>
    <div class="qb">${esc(q.body)}</div>
    <div class="ans" id="ans-${q.id}"></div>
    <div class="ansbox"><input placeholder="${lang === "zh" ? "回复…" : "Reply…"}" id="ain-${q.id}"><button data-id="${q.id}">${lang === "zh" ? "回复" : "Reply"}</button></div>
  </div>`).join("");
  qs.forEach(async (q) => {
    const ans = await (await fetch("/api/answers?q_id=" + q.id)).json();
    $("#ans-" + q.id).innerHTML = ans.map((a) => `💬 <b>${esc(a.name)}</b> (${a.lang === "zh" ? "中文" : "EN"}): ${esc(a.text)}`).join("<br>");
  });
  list.querySelectorAll(".ansbox button").forEach((b) => {
    b.onclick = async () => {
      const id = b.dataset.id; const txt = $("#ain-" + id).value.trim(); if (!txt) return;
      await fetch("/api/answer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q_id: +id, name: myName, lang, text: txt }) });
      renderQA();
    };
  });
}
$("#qaLang").onchange = renderQA;
$("#qaNew").onclick = () => $("#qaForm").classList.toggle("hidden");
$("#qaFormSubmit").onclick = async () => {
  const title = $("#qaFormTitle").value.trim(); const body = $("#qaFormBody").value.trim();
  if (!title) return;
  await fetch("/api/question", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid, name: myName, lang: $("#qaFormLang").value, title, body }) });
  $("#qaFormTitle").value = ""; $("#qaFormBody").value = ""; $("#qaForm").classList.add("hidden");
  renderQA();
};

// ---- shop (affiliate) ----
async function renderShop() {
  const products = await (await fetch("/api/products?cat=" + (curShopCat === "all" ? "" : curShopCat))).json();
  $("#shopCats").innerHTML = CATS.map((c) => `<div class="chip ${c === curShopCat ? "active" : ""}" data-cat="${c}">${I18N[lang]["cat_" + c]}</div>`).join("");
  $("#shopCats").querySelectorAll(".chip").forEach((el) => { el.onclick = () => { curShopCat = el.dataset.cat; renderShop(); }; });
  $("#shopList").innerHTML = products.map((p) => `<div class="p">
    <div class="pn">${esc(p["name_" + lang])}</div>
    <div class="pd">${esc(p["desc_" + lang])}</div>
    <div class="pm"><span class="pp">${esc(p.price)}</span><span class="pc">${esc(p.commission)}</span><button class="btn-sm" data-id="${p.id}" data-url="${esc(p.url)}">${I18N[lang].buy_aff}</button></div>
  </div>`).join("");
  $("#shopList").querySelectorAll("button").forEach((b) => {
    b.onclick = async () => {
      await fetch("/api/product_click", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid, product_id: +b.dataset.id }) });
      window.open(b.dataset.url, "_blank");
    };
  });
}

// ---- landing kits (paid) ----
async function renderKit() {
  const kits = await (await fetch("/api/kits")).json();
  $("#kitList").innerHTML = kits.map((k) => `<div class="k">
    <div class="kn">${esc(k["name_" + lang])}</div>
    <div class="kd">${esc(k["desc_" + lang])}</div>
    <div class="row"><span class="kp">¥${k.price}</span>${PAYMENTS_ENABLED ? `<button class="btn-sm" data-id="${k.id}">${I18N[lang].kit_buy}</button>` : `<button class="btn-sm" disabled style="background:#e9edf1;color:#9aa7b2;cursor:not-allowed">${I18N[lang].coming_soon}</button>`}</div>
  </div>`).join("");
  $("#kitList").querySelectorAll("button[data-id]").forEach((b) => { if (PAYMENTS_ENABLED) b.onclick = () => buyKit(kits.find((x) => x.id == b.dataset.id)); });
  const mine = await (await fetch("/api/my_kits?uid=" + uid)).json();
  $("#myKits").innerHTML = mine.length ? mine.map((k) => `<div class="k">
    <div class="kn">${esc(k["name_" + lang])}</div>
    <div class="kd">${esc(k["desc_" + lang])}</div>
    <div class="row"><button class="btn-sm" data-id="${k.id}">${I18N[lang].kit_view}</button><button class="btn-sm" data-dl="${k.id}" style="background:#eef2f6;color:#2b5876">${I18N[lang].kit_download}</button></div>
  </div>`).join("") : `<p class="muted">${lang === "zh" ? "尚未购买" : "Nothing yet"}</p>`;
  $("#myKits").querySelectorAll("button[data-id]").forEach((b) => { b.onclick = () => viewKit(+b.dataset.id); });
  $("#myKits").querySelectorAll("button[data-dl]").forEach((b) => { b.onclick = () => downloadKit(+b.dataset.dl); });
}
function buyKit(k) {
  modal(I18N[lang].kit_buy + " · " + (lang === "zh" ? k.name_zh : k.name_en),
    `<div style="font-size:13px;color:#55636f;margin-bottom:8px">${I18N[lang].kit_pay_hint}</div>
     <input id="cardNo" placeholder="4242 4242 4242 4242" style="width:100%;padding:10px;border-radius:10px;border:1px solid #dce3ea;margin-bottom:8px">
     <div style="font-weight:700;color:#e0682b">¥${k.price}</div>`,
    () => {
      fetch("/api/buy_kit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid, kit_id: k.id }) })
        .then((r) => r.json()).then((r) => {
          if (r.checkout_url) { window.location.href = r.checkout_url; return; }
          if (r.ok) { alert(lang === "zh" ? "购买成功，已解锁！" : "Purchased & unlocked!"); renderKit(); }
          else { alert(lang === "zh" ? "支付失败：" + (r.error || "") : "Payment failed: " + (r.error || "")); }
        });
    });
}
async function viewKit(id) {
  const r = await (await fetch("/api/kit_content?kit_id=" + id + "&uid=" + uid)).json();
  if (r.error) return;
  let v = document.getElementById("kitViewer");
  if (!v) { v = document.createElement("div"); v.id = "kitViewer"; v.className = "kit-content"; $("#view-kit").appendChild(v); }
  const content = lang === "zh" ? r.content_zh : r.content_en;
  v.innerHTML = esc(content).replace(/\n/g, "<br>") + `<br><br><button class="btn-sm" id="dlBtn">${I18N[lang].kit_download}</button>`;
  v.classList.remove("hidden");
  $("#dlBtn").onclick = () => downloadKit(id);
  v.scrollIntoView({ behavior: "smooth" });
}
function downloadKit(id) {
  fetch("/api/kit_content?kit_id=" + id + "&uid=" + uid).then((x) => x.json()).then((r) => {
    const txt = lang === "zh" ? r.content_zh : r.content_en;
    const blob = new Blob([txt], { type: "text/markdown" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "landing-kit-" + id + ".md"; a.click();
  });
}

// ---- mentors (booking) ----
async function renderMentors() {
  const ms = await (await fetch("/api/mentors")).json();
  $("#mentorList").innerHTML = ms.map((m) => `<div class="m">
    <span class="mp">¥${m.price}/次</span>
    <div class="mn">${esc(m.name)}</div>
    <div class="ms">${esc(m["school_" + lang])}</div>
    <div class="me">${esc(m.expertise)}</div>
    <div class="mb">${esc(m["bio_" + lang])}</div>
    <div class="mfee">${lang === "zh" ? "平台抽成 " + m.fee_pct + "%（¥" + m.platform_fee + "）· 学长得 ¥" + (m.price - m.platform_fee) : "Platform fee " + m.fee_pct + "% (¥" + m.platform_fee + ") · mentor gets ¥" + (m.price - m.platform_fee)}</div>
    <button class="btn-sm" data-id="${m.id}">${I18N[lang].mentor_book}</button>
  </div>`).join("");
  $("#mentorList").querySelectorAll("button").forEach((b) => { b.onclick = () => bookMentor(ms.find((x) => x.id == b.dataset.id)); });
  renderMyBookings();
}
async function renderMyBookings() {
  const bs = await (await fetch("/api/my_bookings?uid=" + uid)).json();
  $("#myBookings").innerHTML = bs.length ? bs.map((b) => `<div class="b">
    <div class="bn">${esc(b.name)} · ${esc(b["school_" + lang])}</div>
    <div class="bs">${esc(b.slot)} — ${esc(b.topic)}</div>
    <span class="st ${b.status === "pending" ? "pending" : "confirmed"}">${b.status === "pending" ? (lang === "zh" ? "待确认" : "Pending") : (lang === "zh" ? "已确认" : "Confirmed")}</span>
  </div>`).join("") : `<p class="muted">${lang === "zh" ? "暂无预约" : "No bookings"}</p>`;
}
function bookMentor(m) {
  const slots = lang === "zh" ? ["本周六 10:00", "本周日 15:00", "下周一 20:00", "下周三 19:00"] : ["Sat 10:00", "Sun 15:00", "Mon 20:00", "Wed 19:00"];
  modal(I18N[lang].mentor_book + " · " + m.name,
    `<select id="bSlot" style="width:100%;padding:10px;border-radius:10px;border:1px solid #dce3ea;margin-bottom:8px">${slots.map((s) => `<option>${s}</option>`).join("")}</select>
     <textarea id="bTopic" placeholder="${I18N[lang].mentor_topic_ph}" style="width:100%;min-height:60px;padding:10px;border-radius:10px;border:1px solid #dce3ea"></textarea>`,
    () => {
      const slot = $("#bSlot").value; const topic = $("#bTopic").value.trim();
      fetch("/api/book", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid, mentor_id: m.id, slot, topic }) })
        .then(() => { renderMentors(); });
    });
}
async function renderSub() {
  if (!uid) { location.hash = "check"; return; }
  const me = await (await fetch("/api/me?uid=" + uid)).json();
  const pro = me.is_pro;
  const plans = me.plans || { pro_month: { price: 29 }, pro_year: { price: 199 } };
  let html = `<div class="sub-card ${pro ? "is-pro" : ""}">
    <div class="sub-badge">${pro ? I18N[lang].sub_pro_badge : I18N[lang].sub_free}</div>`;
  if (pro) {
    html += `<p>${I18N[lang].sub_current}: <b>${me.plan === "pro_year" ? I18N[lang].sub_year : I18N[lang].sub_month}</b></p>
      <p class="muted">${I18N[lang].sub_cancel}: ${esc(me.expires_at || "-")}</p>`;
  } else {
    html += `<p class="muted">${I18N[lang].sub_perks}</p>
      <div class="sub-plans">
        ${PAYMENTS_ENABLED ? `<button class="sub-btn" data-plan="pro_month"><b>${I18N[lang].sub_month}</b></button>
        <button class="sub-btn" data-plan="pro_year"><b>${I18N[lang].sub_year}</b></button>` : `<button class="sub-btn" disabled style="opacity:.6;cursor:not-allowed"><b>${I18N[lang].coming_soon}</b></button>`}
      </div>`;
  }
  html += `</div>`;
  $("#subBox").innerHTML = html;
  $("#subBox").querySelectorAll(".sub-btn").forEach((b) => { b.onclick = () => subscribe(b.dataset.plan); });
}
// ---- Tools tab: free, pure-frontend helpers (no backend needed) ----
const TOOL_DEFS = [
  { id: "conv", icon: "📐" }, { id: "tip", icon: "💱" }, { id: "tz", icon: "🕐" }, { id: "emg", icon: "🆘" }, { id: "phr", icon: "🌐" },
];
async function renderTools() {
  const L = I18N[lang];
  const grid = TOOL_DEFS.map((t) => `<button class="tool-card" data-tool="${t.id}">
    <div class="tool-ic">${t.icon}</div>
    <div class="tool-n">${L["t_" + t.id]}</div>
    <div class="tool-s">${L["t_" + t.id + "_sub"]}</div>
  </button>`).join("");
  $("#toolsGrid").innerHTML = grid;
  $("#toolsGrid").querySelectorAll(".tool-card").forEach((b) => { b.onclick = () => openTool(b.dataset.tool); });
}
function openTool(id) {
  const L = I18N[lang];
  const ov = document.createElement("div"); ov.className = "ov";
  let body = "";
  if (id === "conv") body = toolConv(L);
  else if (id === "tip") body = toolTip(L);
  else if (id === "tz") body = toolTz(L);
  else if (id === "emg") body = toolEmg(L);
  else if (id === "phr") body = toolPhr(L);
  ov.innerHTML = `<div class="ovbox"><div class="ovhead"><b>${L["t_" + id]}</b><button id="mClose">✕</button></div><div class="ovbody">${body}</div></div>`;
  document.body.appendChild(ov);
  ov.querySelector("#mClose").onclick = () => ov.remove();
  bindTool(id, ov, L);
}
function toolConv(L) {
  const cats = { cloth: "衣服尺码 CN↔EU/US", temp: "温度 °C↔°F", weight: "重量 斤↔kg", dist: "距离 km↔mile" };
  const opts = Object.keys(cats).map((k) => `<option value="${k}">${cats[k]}</option>`).join("");
  return `<select id="cCat" class="fld">${opts}</select>
    <input id="cIn" class="fld" type="number" placeholder="${L.conv_in}">
    <div id="cOut" class="res">-</div>
    <button class="primary" id="cGo">${L.done}</button>`;
}
function toolTip(L) {
  return `<input id="tBill" class="fld" type="number" placeholder="${L.tip_bill}">
    <input id="tRate" class="fld" type="number" value="15" placeholder="${L.tip_rate}">
    <div id="tOut" class="res">-</div>
    <button class="primary" id="tGo">${L.done}</button>`;
}
function toolTz(L) {
  const cities = { "伦敦": 0, "纽约": -4, "多伦多": -4, "悉尼": 10, "东京": 1 };
  const opts = Object.keys(cities).map((c) => `<option value="${c}">${c}</option>`).join("");
  return `<label>${L.tz_home}</label><div id="tzSh" class="res">-</div>
    <label>${L.tz_target}</label><select id="tzCity" class="fld">${opts}</select>
    <div id="tzLocal" class="res">-</div>
    <label>${L.tz_event}</label><input id="tzEvt" class="fld" placeholder="e.g. 开学/签证">
    <label>${L.tz_date}</label><input id="tzDate" class="fld" type="date">
    <div id="tzLeft" class="res">-</div>`;
}
function toolEmg(L) {
  return `<div class="emgcard">
    <h3>${L.emg_title}</h3>
    <p>🚓 ${L.emg_police}: <b>112 / 999 / 911</b>（按当地）</p>
    <p>🚑 ${L.emg_amb}: <b>112 / 999 / 911</b></p>
    <p>🇨🇳 ${L.emg_china}: <b>+86-10-12308</b></p>
    <p>🏛 ${L.emg_emb}: <b>（填你大使馆电话）</b></p>
    <p class="muted">${L.emg_save}</p>
  </div>`;
}
const PHRASES = {
  rent: [["我想租一间房", "I'd like to rent a room"], ["押金多少？", "How much is the deposit?"], ["包含水电吗？", "Are utilities included?"]],
  bank: [["我要开户", "I want to open an account"], ["需要什么材料？", "What documents do I need?"], ["怎么转账？", "How do I transfer money?"]],
  hosp: [["我不舒服", "I don't feel well"], ["在哪里挂号？", "Where do I register?"], ["我会说中文", "I speak Chinese"]],
  daily: [["请问洗手间在哪？", "Where is the bathroom?"], ["多少钱？", "How much is it?"], ["谢谢", "Thank you"]],
};
function toolPhr(L) {
  const cats = { rent: "租房", bank: "银行", hosp: "医院", daily: "日常" };
  const opts = Object.keys(cats).map((k) => `<option value="${k}">${cats[k]}</option>`).join("");
  return `<select id="pCat" class="fld">${opts}</select><div id="pList" class="phr"></div>`;
}
function bindTool(id, ov, L) {
  if (id === "conv") {
    const calc = () => {
      const v = parseFloat(ov.querySelector("#cIn").value), cat = ov.querySelector("#cCat").value;
      let o = "-";
      if (!isNaN(v)) {
        if (cat === "temp") o = (v * 9 / 5 + 32).toFixed(1) + " °F";
        else if (cat === "weight") o = (v / 2).toFixed(2) + " kg";
        else if (cat === "dist") o = (v * 0.621371).toFixed(2) + " mile";
        else if (cat === "cloth") o = "EU " + Math.max(0, Math.round(v + 30)) + " / US " + Math.max(0, Math.round(v - 2));
      }
      ov.querySelector("#cOut").textContent = o;
    };
    ov.querySelector("#cGo").onclick = calc; ov.querySelector("#cIn").oninput = calc; ov.querySelector("#cCat").onchange = calc;
  } else if (id === "tip") {
    const calc = () => {
      const b = parseFloat(ov.querySelector("#tBill").value), r = parseFloat(ov.querySelector("#tRate").value) || 0;
      if (isNaN(b)) { ov.querySelector("#tOut").textContent = "-"; return; }
      const tip = b * r / 100;
      ov.querySelector("#tOut").textContent = `${L.tip_tip}: ${tip.toFixed(2)}  |  ${L.tip_total}: ${(b + tip).toFixed(2)}`;
    };
    ov.querySelector("#tGo").onclick = calc; ov.querySelector("#tBill").oninput = calc; ov.querySelector("#tRate").oninput = calc;
  } else if (id === "tz") {
    const tick = () => {
      const sh = new Date();
      ov.querySelector("#tzSh").textContent = sh.toLocaleString("zh-CN");
      const city = ov.querySelector("#tzCity").value;
      const offs = { "伦敦": 0, "纽约": -4, "多伦多": -4, "悉尼": 10, "东京": 1 };
      const d = new Date(Date.now() + (offs[city] - 8) * 3600000);
      ov.querySelector("#tzLocal").textContent = city + ": " + d.toLocaleString("zh-CN");
      const dt = ov.querySelector("#tzDate").value;
      if (dt) {
        const days = Math.ceil((new Date(dt).getTime() - Date.now()) / 86400000);
        ov.querySelector("#tzLeft").textContent = (ov.querySelector("#tzEvt").value || L.tz_left) + ": " + (days >= 0 ? days + " 天" : "已过期");
      }
    };
    ov.querySelector("#tzCity").onchange = tick;
    ov.querySelector("#tzDate").onchange = tick;
    ov.querySelector("#tzEvt").oninput = tick;
    tick();
    setInterval(tick, 60000);
  } else if (id === "phr") {
    const render = () => {
      const c = ov.querySelector("#pCat").value;
      ov.querySelector("#pList").innerHTML = PHRASES[c].map((p) => `<div class="phr-row"><span>${p[0]}</span><b>${p[1]}</b></div>`).join("");
    };
    ov.querySelector("#pCat").onchange = render; render();
  }
}
// ---- Plan tab: smart checklist + first-7-days + favorites (all localStorage, no backend) ----
function getFavs() { try { return JSON.parse(localStorage.getItem("lp_favs") || "[]"); } catch (e) { return []; } }
function setFavs(a) { localStorage.setItem("lp_favs", JSON.stringify(a)); }
function isFav(type, id) { return getFavs().some((f) => f.type === type && f.id === id); }
function toggleFav(type, id, title, body) {
  let a = getFavs();
  if (isFav(type, id)) a = a.filter((f) => !(f.type === type && f.id === id));
  else a.push({ type, id, title, body });
  setFavs(a);
  if ($("#view-plan").classList.contains("active")) renderPlan();
}
// star button HTML for a savable item
function favStar(type, id, title, body) {
  const on = isFav(type, id);
  return `<button class="favbtn" data-t="${type}" data-i="${id}" data-title="${esc(title)}" data-body="${esc(body)}" style="background:${on ? "#ffe08a" : "#eef2f6"}">${on ? "★" : "☆"}</button>`;
}
async function renderPlan() {
  const P = PLAN_I18N[lang];
  // arrival date (drives the countdown hero)
  $("#planArrival").value = myArrival || "";
  $("#planArrivalSave").onclick = () => { const d = $("#planArrival").value; if (d) saveArrival(d); };
  // cities for smart checklist
  const cities = await (await fetch("/api/cities")).json();
  $("#planCity").innerHTML = `<option value="">${P.plan_pick}</option>` + cities.map((c) => `<option value="${c.id}">${esc(c["name_" + lang])}</option>`).join("");
  $("#planGen").onclick = async () => {
    const cityId = $("#planCity").value, school = $("#planSchool").value;
    const tasks = await (await fetch("/api/checklist")).json();
    let html = tasks.map((t, i) => {
      const key = "plan_" + school + "_" + t.cat;
      const done = localStorage.getItem("plan_task_" + school + "_" + i) === "1";
      return `<label class="pli"><input type="checkbox" data-k="plan_task_${school}_${i}" ${done ? "checked" : ""}> <b>${esc(t["name_" + lang])}</b> <span class="muted">${esc(t["desc_" + lang])}</span></label>`;
    }).join("");
    if (cityId) {
      const w = await (await fetch("/api/wiki?city_id=" + cityId)).json();
      if (w.length) html += `<div class="note">📍 ${esc(cities.find((c) => c.id == cityId)["name_" + lang])}：${esc(w[0]["body_" + lang])}</div>`;
    }
    $("#planChecklist").innerHTML = html;
    $("#planChecklist").querySelectorAll("input[type=checkbox]").forEach((cb) => { cb.onchange = () => localStorage.setItem(cb.dataset.k, cb.checked ? "1" : "0"); });
  };
  // first 7 days
  $("#plan7").onclick = () => {
    const d = $("#planArrive").value;
    if (!d) { $("#plan7days").innerHTML = `<p class="muted">${P.plan_arrive}</p>`; return; }
    const arr = new Date(d);
    let html = "";
    for (let i = 1; i <= 7; i++) {
      const day = new Date(arr.getTime() + (i - 1) * 86400000);
      html += `<div class="pli"><b>D${i} · ${day.getMonth() + 1}/${day.getDate()}</b> <span>${esc(P["d" + i])}</span></div>`;
    }
    $("#plan7days").innerHTML = html;
  };
  // favorites
  const favs = getFavs();
  $("#planFavs").innerHTML = favs.length ? favs.map((f, idx) => `<div class="pli"><div><b>${esc(f.title)}</b> <span class="muted">[${P["fav_" + f.type] || f.type}]</span></div><div class="muted">${esc(f.body)}</div><button class="favbtn" data-idx="${idx}">${P.unfav}</button></div>`).join("")
    : `<p class="muted">${P.plan_empty}</p>`;
  $("#planFavs").querySelectorAll(".favbtn").forEach((b) => { b.onclick = () => { const a = getFavs(); a.splice(+b.dataset.idx, 1); setFavs(a); renderPlan(); }; });
}
// ---- Community tab: buddy matcher + local board + submit (moderated) ----
let commKind = "buddy";
async function renderComm() {
  const C = COMM_I18N[lang];
  const cities = await (await fetch("/api/cities")).json();
  $("#commCity").innerHTML = `<option value="">${C.comm_city}</option>` + cities.map((c) => `<option value="${c.id}">${esc(c["name_" + lang])}</option>`).join("");
  // segment buttons
  $("#commSeg").querySelectorAll(".seg-btn").forEach((b) => { b.onclick = () => { commKind = b.dataset.k; $("#commSeg").querySelectorAll(".seg-btn").forEach((x) => x.classList.remove("active")); b.classList.add("active"); renderCommList(); renderCommForm(); }; });
  renderCommList();
  renderCommForm();
}
async function renderCommList() {
  const C = COMM_I18N[lang];
  const cid = $("#commCity").value;
  if (commKind === "buddy") {
    const list = await (await fetch("/api/buddies" + (cid ? "?city_id=" + cid : ""))).json();
    // Co-pilot hero: how many peers are landing (same city / this week)
    const all = await (await fetch("/api/buddies")).json();
    const now = Date.now();
    const sameCity = all.filter((b) => cid && b.city_id == cid).length;
    const thisWeek = all.filter((b) => { const d = new Date(b.arrive); return d >= now - 86400000 && d <= now + 7 * 86400000; }).length;
    const hero = $("#commHero");
    if (all.length) {
      hero.innerHTML = `👋 已有 <b>${all.length}</b> 位小伙伴在落地 · 同城 <b>${sameCity}</b> 人 · 本周落地 <b>${thisWeek}</b> 人`;
      hero.classList.remove("hidden");
    } else { hero.classList.add("hidden"); }
    $("#commList").innerHTML = list.length ? list.map((b) => `<div class="pli"><div><b>${esc(b.name)}</b> <span class="muted">· ${esc(b.school)}</span></div><div class="muted">🛬 ${esc(b.arrive)}</div>${b.note ? `<div>${esc(b.note)}</div>` : ""}</div>`).join("") : `<p class="muted">${C.b_empty}</p>`;
  } else if (commKind === "senior") {
    const list = await (await fetch("/api/senior_tips" + (cid ? "?city_id=" + cid : ""))).json();
    $("#commList").innerHTML = list.length ? list.map((t) => `<div class="pli"><div><b>${esc(t.school)}</b> <span class="muted">· ${esc(t.name)}</span></div><div>${esc(t["body_" + lang])}</div></div>`).join("") : `<p class="muted">${C.p_empty}</p>`;
  } else {
    const kind = commKind === "info" ? "info" : "second";
    const list = await (await fetch("/api/posts" + (cid ? "?city_id=" + cid + "&" : "?") + "kind=" + kind)).json();
    $("#commList").innerHTML = list.length ? list.map((p) => `<div class="pli"><div><b>${esc(p.title)}</b> <span class="muted">· ${esc(p.name)}</span></div><div>${esc(p.body)}</div></div>`).join("") : `<p class="muted">${C.p_empty}</p>`;
  }
}
function renderCommForm() {
  const C = COMM_I18N[lang];
  if (commKind === "buddy") {
    $("#commForm").innerHTML = `<div class="plan-row"><input id="cbName" class="fld" placeholder="${C.b_name}"><input id="cbSchool" class="fld" placeholder="${C.b_school}"></div>
      <div class="plan-row"><input id="cbArrive" class="fld" placeholder="${C.b_arrive}"><input id="cbWechat" class="fld" placeholder="${C.b_wechat}"></div>
      <input id="cbNote" class="fld" placeholder="${C.b_note}" style="width:100%;margin-bottom:8px">
      <button class="primary small" id="cbPub">${C.b_publish}</button>`;
    $("#cbPub").onclick = async () => {
      const d = await (await fetch("/api/buddy_add", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid, name: $("#cbName").value, school: $("#cbSchool").value, arrive: $("#cbArrive").value, wechat: $("#cbWechat").value, note: $("#cbNote").value }) })).json();
      alert(d.pending ? C.pending : (d.error || "err"));
    };
  } else {
    const kind = commKind === "info" ? "info" : "second";
    $("#commForm").innerHTML = `<input id="cpTitle" class="fld" placeholder="${C.p_title}" style="width:100%;margin-bottom:8px">
      <textarea id="cpBody" class="fld" placeholder="${C.p_body}" style="width:100%;height:64px;margin-bottom:8px"></textarea>
      <div class="plan-row"><input id="cpContact" class="fld" placeholder="${C.p_contact}"><button class="primary small" id="cpPub">${C.p_publish}</button></div>`;
    $("#cpPub").onclick = async () => {
      const d = await (await fetch("/api/post_add", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid, kind, title: $("#cpTitle").value, body: $("#cpBody").value, contact: $("#cpContact").value }) })).json();
      alert(d.pending ? C.pending : (d.error || "err"));
    };
  }
  $("#commCity").onchange = renderCommList;
}
function subscribe(plan) {
  fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid, plan }) })
    .then((r) => r.json()).then((d) => {
      if (d.checkout_url) { window.open(d.checkout_url, "_blank"); }
      else if (d.pay_url) { window.open(d.pay_url, "_blank"); }
      else if (d.ok) { renderSub(); applyLang(); }  // mock: instant pro
    });
}
// ---- admin console (owner only) ----
async function renderAdmin() {
  // guard: only the admin account can see this (server also enforces via admin_token)
  const at = localStorage.getItem("lp_admin") || "";
  const q = (p) => p + (p.indexOf("?") >= 0 ? "&" : "?") + "admin_token=" + encodeURIComponent(at);
  const chk = await (await fetch(q("/api/admin/check?uid=" + uid))).json().catch(() => ({}));
  if (!chk.admin) { $("#view-admin").innerHTML = `<p class="muted">${lang === "zh" ? "无权限" : "No access"}</p>`; return; }
  const ov = await (await fetch(q("/api/admin/overview?uid=" + uid))).json();
  $("#adminOverview").innerHTML = `<div class="ovgrid">` + [
    ["users", ov.users], ["kits_sold", ov.kits_sold], ["clicks", ov.clicks], ["bookings", ov.bookings],
    ["kit_revenue ¥", ov.kit_revenue], ["mentor_revenue ¥", ov.mentor_revenue], ["subscribers", ov.subscribers], ["sub_revenue ¥", ov.sub_revenue],
  ].map(([k, v]) => `<div class="ovcell"><b>${v}</b><span>${k}</span></div>`).join("") + `</div>`;
  // partnerships (editable)
  const ps = await (await fetch(q("/api/admin/products?uid=" + uid))).json();
  $("#adminProducts").innerHTML = ps.map((p) => `<div class="ap">
    <div class="apn">${esc(p.name_zh)} · ${esc(p.name_en)} <span class="apc">${esc(p.cat)}</span> ${p.url.indexOf("YOUR_") >= 0 ? '<span class="apwarn">待填链接</span>' : '<span class="apok">已上线</span>'}</div>
    <label>${lang === "zh" ? "价格" : "Price"}<input data-f="price" data-id="${p.id}" value="${esc(p.price)}"></label>
    <label>${lang === "zh" ? "返佣" : "Commission"}<input data-f="commission" data-id="${p.id}" value="${esc(p.commission)}"></label>
    <label class="apurl">${lang === "zh" ? "追踪链接" : "Tracking URL"}<input data-f="url" data-id="${p.id}" value="${esc(p.url)}"></label>
    <div class="apmeta">${lang === "zh" ? "点击量" : "Clicks"}: <b>${p.clicks || 0}</b></div>
    <button class="btn-sm apsave" data-id="${p.id}">${I18N[lang].admin_save}</button>
  </div>`).join("");
  $("#adminProducts").querySelectorAll(".apsave").forEach((b) => {
    b.onclick = async () => {
      const id = b.dataset.id;
      const row = $("#adminProducts").querySelector(`input[data-id="${id}"]`);
      const price = $(`#adminProducts input[data-f="price"][data-id="${id}"]`).value;
      const commission = $(`#adminProducts input[data-f="commission"][data-id="${id}"]`).value;
      const url = $(`#adminProducts input[data-f="url"][data-id="${id}"]`).value;
      await fetch("/api/admin/product_save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid, admin_token: at, id: +id, price, commission, url }) });
      b.textContent = "✓";
    };
  });
  // moderation: questions + answers
  const qs = await (await fetch(q("/api/admin/qa?uid=" + uid))).json();
  $("#adminQA").innerHTML = qs.length ? qs.map((q) => `<div class="aq">
    <div class="aqh">${esc(q.name)} · ${q.lang === "zh" ? "中文" : "EN"} <span class="aqt">${esc(q.title)}</span></div>
    ${esc(q.body)}
    <div class="aqans">${(q.answers || []).map((a) => `<div class="aa">💬 ${esc(a.name)}: ${esc(a.text)} <button class="btn-sm adel" data-aid="${a.id}">${I18N[lang].admin_del}</button></div>`).join("")}</div>
    <button class="btn-sm adelq" data-qid="${q.id}">${lang === "zh" ? "删除整个问题" : "Delete question"}</button>
  </div>`).join("") : `<p class="muted">${lang === "zh" ? "暂无问答" : "No Q&A"}</p>`;
  $("#adminQA").querySelectorAll(".adel").forEach((b) => { b.onclick = () => delQA(b.dataset.aid, null); });
  $("#adminQA").querySelectorAll(".adelq").forEach((b) => { b.onclick = () => delQA(null, b.dataset.qid); });
  // moderation: community (buddies + posts)
  const cm = await (await fetch(q("/api/admin/community?uid=" + uid))).json();
  const modBtn = (what, id, label) => `<button class="btn-sm apsave" data-w="${what}" data-id="${id}">${label}</button>`;
  $("#adminCommunity").innerHTML =
    `<div class="sec" data-i18n="admin_comm_b">找同伴审核</div>` +
    (cm.buddies.length ? cm.buddies.map((b) => `<div class="aq">${esc(b.name)} · ${esc(b.school)} · ${esc(b.arrive)} ${b.status !== "approved" ? modBtn("buddy", b.id, lang === "zh" ? "通过" : "Approve") + modBtn2("buddy", b.id, lang === "zh" ? "拒绝" : "Reject") : '<span class="apok">✓</span>'}</div>`).join("") : `<p class="muted">${lang === "zh" ? "暂无" : "None"}</p>`) +
    `<div class="sec" data-i18n="admin_comm_p">本地信息/二手审核</div>` +
    (cm.posts.length ? cm.posts.map((p) => `<div class="aq">[${esc(p.kind)}] ${esc(p.title)} · ${esc(p.name)} ${p.status !== "approved" ? modBtn("post", p.id, lang === "zh" ? "通过" : "Approve") + modBtn2("post", p.id, lang === "zh" ? "拒绝" : "Reject") : '<span class="apok">✓</span>'}</div>`).join("") : `<p class="muted">${lang === "zh" ? "暂无" : "None"}</p>`);
  const allMod = $("#adminCommunity").querySelectorAll(".apsave");
  allMod.forEach((b) => { b.onclick = async () => { await fetch("/api/admin/mod", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid, admin_token: at, what: b.dataset.w, id: +b.dataset.id, status: b.textContent.indexOf("通过") >= 0 || b.textContent.indexOf("Approve") >= 0 ? "approved" : "rejected" }) }); renderAdmin(); }; });
}
function modBtn2(what, id, label) { return `<button class="btn-sm adelq" data-w="${what}" data-id="${id}">${label}</button>`; }
async function delQA(answer_id, q_id) {
  await fetch("/api/admin/qa_delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid, admin_token: localStorage.getItem("lp_admin") || "", answer_id: answer_id ? +answer_id : null, q_id: q_id ? +q_id : null }) });
  renderAdmin();
}

// ---- modal helper ----
function modal(title, bodyHtml, onConfirm) {
  const ov = document.createElement("div");
  ov.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:50;";
  const box = document.createElement("div");
  box.style.cssText = "background:#fff;border-radius:16px;padding:18px;width:88%;max-width:360px;";
  box.innerHTML = `<h3 style="margin-bottom:10px;font-size:16px">${title}</h3>${bodyHtml}
    <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end">
      <button id="mCancel" style="padding:9px 14px;border:none;border-radius:10px;background:#eef2f6;cursor:pointer">${I18N[lang].mentor_cancel}</button>
      <button id="mOk" style="padding:9px 14px;border:none;border-radius:10px;background:#2b5876;color:#fff;cursor:pointer">${I18N[lang].mentor_confirm}</button>
    </div>`;
  ov.appendChild(box); document.body.appendChild(ov);
  box.querySelector("#mCancel").onclick = () => ov.remove();
  box.querySelector("#mOk").onclick = () => { ov.remove(); onConfirm(box); };
}

// ---- init ----
(async () => {
  applyLang();
  if (uid) {
    const p = await (await fetch("/api/profile?uid=" + uid)).json();
    if (p.name) { myName = p.name; lang = p.lang || "zh"; mySchool = p.school_id || ""; enterApp(); return; }
  }
  showHome();
})();
