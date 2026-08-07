const I18N = {
  zh: {
    nav_enter: "进入 / Enter", badge: "为留学生打造的落地指南",
    hero_1: "一个人出发，", hero_2: "不一个人落地。",
    hero_lede: "行前清单、城市生存指南、同校前辈问答 —— 中英双语，专为出海留学的你准备。",
    cta_start: "免费开始", cta_tour: "看看功能",
    stat_cities: "留学城市", stat_tasks: "落地事项", stat_langs: "语言",
    f1_t: "行前落地清单", f1_d: "签证、住宿、银行、保险，逐项勾选，出发前不漏项。",
    f2_t: "城市生存指南", f2_d: "伦敦、纽约、悉尼、多伦多、东京的住宿 / 交通 / 银行攻略。",
    f3_t: "同校前辈问答", f3_d: "真实问题，真实回答。中文 / English 自由切换。",
    foot_txt: "留学生出海第一步",
    tab_login: "登录", tab_reg: "注册",
    lbl_user: "用户名或邮箱", lbl_email: "邮箱（可选）", lbl_pw: "密码（至少 6 位）",
    btn_login: "登录", btn_reg: "创建账户", forgot: "忘记密码？", btn_reset: "发送重置链接",
    lbl_newpw: "新密码（至少 6 位）", btn_setpw: "设置新密码",
    ok_reg: "注册成功！", ok_reset: "密码已重置，请登录。",
    verify_link: "验证邮箱（开发模式）", reset_link: "重置链接（开发模式）",
    step_t: "三步落地",
    s1_t: "注册账户", s1_d: "30 秒创建，免费、无需邮箱即可体验。",
    s2_t: "勾选清单", s2_d: "签证、住宿、银行、保险逐项勾选，进度一目了然。",
    s3_t: "看指南 · 问前辈", s3_d: "五大城市攻略 + 同校前辈真实问答。",
    q_t: "他们在海外落地了",
    q1: "\"落地包把我到伦敦前三周的焦虑全清空了，清单一条条打钩特别踏实。\"",
    q1a: "— 伦敦 · 硕士",
    q2: "\"前辈问答里有人说 BRP 还没到也能先开账户，省了我一周。\"",
    q2a: "— 纽约 · 本科",
    q3: "\"中英双语太友好了，我妈也能帮我看清单。\"",
    q3a: "— 悉尼 · 预科",
    ctaf_t: "准备好落地了吗？", ctaf_d: "加入上千名出海留学生，让第一步更稳。", ctaf_btn: "免费开始",
  },
  en: {
    nav_enter: "Enter", badge: "A landing guide built for study-abroad students",
    hero_1: "Go alone, ", hero_2: "land together.",
    hero_lede: "Pre-arrival checklist, city survival guide, peer Q&A — bilingual, made for students going abroad.",
    cta_start: "Get started", cta_tour: "See features",
    stat_cities: "Cities", stat_tasks: "Checklist items", stat_langs: "Languages",
    f1_t: "Pre-arrival Checklist", f1_d: "Visa, housing, bank, insurance — tick them off, miss nothing.",
    f2_t: "City Survival Guide", f2_d: "London, New York, Sydney, Toronto, Tokyo: housing / transit / bank tips.",
    f3_t: "Peer Q&A", f3_d: "Real questions, real answers. Switch 中文 / English freely.",
    foot_txt: "First step abroad",
    tab_login: "Login", tab_reg: "Register",
    lbl_user: "Username or email", lbl_email: "Email (optional)", lbl_pw: "Password (min 6 chars)",
    btn_login: "Login", btn_reg: "Create account", forgot: "Forgot password?", btn_reset: "Send reset link",
    lbl_newpw: "New password (min 6)", btn_setpw: "Set new password",
    ok_reg: "Registered!", ok_reset: "Password reset — please log in.",
    verify_link: "Verify email (dev)", reset_link: "Reset link (dev)",
    step_t: "Three steps to land",
    s1_t: "Create account", s1_d: "30 seconds, free, no email required to try.",
    s2_t: "Tick the checklist", s2_d: "Visa, housing, bank, insurance — track progress at a glance.",
    s3_t: "Read guide & ask peers", s3_d: "Survival guides for 5 cities + real peer Q&A.",
    q_t: "They've landed abroad",
    q1: "\"Landing Pack killed my pre-London anxiety — ticking items off felt so reassuring.\"",
    q1a: "— London · Masters",
    q2: "\"A Q&A tip said I could open a bank account before my BRP arrived — saved me a week.\"",
    q2a: "— New York · Undergrad",
    q3: "\"Bilingual is a lifesaver — my mom could help check the list too.\"",
    q3a: "— Sydney · Foundation",
    ctaf_t: "Ready to land?", ctaf_d: "Join thousands of study-abroad students. Make step one steady.",
    ctaf_btn: "Get started",
  },
};

let lang = localStorage.getItem("lp_lang") || "zh";
const $ = (s) => document.querySelector(s);
function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const k = el.getAttribute("data-i18n");
    if (I18N[lang][k]) el.textContent = I18N[lang][k];
  });
  $("#langZh").classList.toggle("active", lang === "zh");
  $("#langEn").classList.toggle("active", lang === "en");
}
$("#langZh").onclick = () => { lang = "zh"; localStorage.setItem("lp_lang", "zh"); applyLang(); };
$("#langEn").onclick = () => { lang = "en"; localStorage.setItem("lp_lang", "en"); applyLang(); };

// already logged in? (cookie is sent automatically)
(async () => {
  const r = await fetch("/api/me");
  if (r.ok) location.href = "/app.html";
  applyLang();
})();

const modal = $("#authModal");
function hideForms() { ["loginForm", "regForm", "forgotForm", "resetForm", "authOk"].forEach((id) => $("#" + id).classList.add("hidden")); }
function openModal(tab) { modal.classList.remove("hidden"); tab === "reg" ? showReg() : showLogin(); }
function showLogin() { hideForms(); $("#loginForm").classList.remove("hidden"); $("#tabLogin").classList.add("active"); $("#tabReg").classList.remove("active"); }
function showReg() { hideForms(); $("#regForm").classList.remove("hidden"); $("#tabReg").classList.add("active"); $("#tabLogin").classList.remove("active"); }
function showForgot() { hideForms(); $("#forgotForm").classList.remove("hidden"); }
function showReset() { hideForms(); $("#resetForm").classList.remove("hidden"); $("#rsMsg").textContent = ""; }
function showAuthOk(msg, linkHtml, onGo) {
  hideForms();
  $("#authOk").classList.remove("hidden");
  $("#authOkMsg").textContent = msg;
  $("#authOkLink").innerHTML = linkHtml || "";
  $("#authOkGo").onclick = onGo || (() => (location.href = "/app.html"));
}
$("#openAuth").onclick = () => openModal("login");
$("#ctaStart").onclick = () => openModal("reg");
$("#ctaStart2").onclick = () => openModal("reg");
$("#closeAuth").onclick = () => modal.classList.add("hidden");
modal.onclick = (e) => { if (e.target === modal) modal.classList.add("hidden"); };
$("#tabLogin").onclick = showLogin;
$("#tabReg").onclick = showReg;
$("#toForgot").onclick = (e) => { e.preventDefault(); showForgot(); };
$("#ctaTour").onclick = () => $("features").scrollIntoView({ behavior: "smooth" });

let resetTok = "", resetUser = "";
const jpost = (path, body) => fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

// register
$("#regForm").onsubmit = async (e) => {
  e.preventDefault();
  $("#rgErr").textContent = "";
  const r = await jpost("/api/register", { username: $("#rgUser").value.trim(), email: $("#rgEmail").value.trim(), password: $("#rgPw").value, lang });
  const d = await r.json();
  if (!r.ok) { $("#rgErr").textContent = d.error || "注册失败"; return; }
  const link = d.verify_url ? `<a href="${d.verify_url}" target="_blank" rel="noopener">${I18N[lang].verify_link}</a>` : "";
  showAuthOk(I18N[lang].ok_reg, link);
};
// login
$("#loginForm").onsubmit = async (e) => {
  e.preventDefault();
  $("#liErr").textContent = "";
  const r = await jpost("/api/login", { username: $("#liIdent").value.trim(), password: $("#liPw").value });
  const d = await r.json();
  if (!r.ok) { $("#liErr").textContent = d.error || "登录失败"; return; }
  location.href = "/app.html";
};
// forgot -> get reset link (dev), then show reset form
$("#forgotForm").onsubmit = async (e) => {
  e.preventDefault();
  const r = await jpost("/api/forgot", { username: $("#foIdent").value.trim() });
  const d = await r.json();
  if (!r.ok) { showForgot(); $("#foIdent").value = ""; alert(d.error || "未找到账户"); return; }
  const u = new URL("http://x" + d.reset_url);
  resetTok = u.searchParams.get("token");
  resetUser = u.searchParams.get("username");
  showReset();
};
// reset password
$("#resetForm").onsubmit = async (e) => {
  e.preventDefault();
  const r = await jpost("/api/reset", { token: resetTok, username: resetUser, password: $("#rsPw").value });
  const d = await r.json();
  if (!r.ok) { $("#rsMsg").textContent = d.error || "重置失败"; return; }
  showAuthOk(I18N[lang].ok_reset, "", () => openModal("login"));
};
