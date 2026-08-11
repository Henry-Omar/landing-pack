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
 admin_title: "管理后台", admin_sub: "仅管理员可见 · 合作管理 / 内容审核 / 数据总览", admin_partners: "合作方管理（用户不可见）", admin_partners_sub: "填入你的专属返佣链接，保存即生效，用户端不变。", admin_mod: "内容审核 · 问答", admin_save: "保存", admin_del: "删除", admin_overview: "数据总览", tab_admin: "管理",
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
 admin_title: "Admin Console", admin_sub: "Admin only · partnerships / moderation / overview", admin_partners: "Partner management (hidden from users)", admin_partners_sub: "Paste your affiliate tracking links; saved instantly, user shop unchanged.", admin_mod: "Moderation · Q&A", admin_save: "Save", admin_del: "Delete", admin_overview: "Overview", tab_admin: "Admin",
  },
};
const CATS = ["all", "sim", "insurance", "flight", "bank", "essentials"];

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

document.querySelectorAll(".tab").forEach((t) => {
  t.onclick = () => {
    document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
    document.querySelectorAll(".view").forEach((x) => x.classList.remove("active"));
    t.classList.add("active");
    $("#view-" + t.dataset.view).classList.add("active");
    applyLang();
  };
});

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
  document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
  document.querySelector('.tab[data-view="check"]').classList.add("active");
  document.querySelectorAll(".view").forEach((x) => x.classList.remove("active"));
  $("#view-check").classList.add("active");
  applyLang();
  // Reveal admin tab only for the owner account (server also enforces).
  fetch("/api/admin/check?uid=" + uid).then((x) => x.json()).then((j) => {
    if (j.admin) { $("#tabAdmin").classList.remove("hidden"); } else { $("#tabAdmin").classList.add("hidden"); }
  }).catch(() => $("#tabAdmin").classList.add("hidden"));
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
  if (!email || pw.length < 6) { msg.className = "msg err"; msg.textContent = lang === "zh" ? "邮箱无效或密码至少6位" : "Invalid email or password (≥6)"; return; }
  const url = authMode === "login" ? "/api/login" : "/api/register";
  const body = authMode === "login" ? { email, password: pw } : { email, password: pw, name, lang };
  const r = await (await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json();
  if (r.error === "exists") { msg.className = "msg err"; msg.textContent = lang === "zh" ? "该邮箱已注册，请登录" : "Email already registered"; return; }
  if (r.error === "bad") { msg.className = "msg err"; msg.textContent = lang === "zh" ? "邮箱或密码错误" : "Wrong email or password"; return; }
  if (r.error === "invalid") { msg.className = "msg err"; msg.textContent = lang === "zh" ? "请输入有效邮箱和密码" : "Enter a valid email and password"; return; }
  uid = r.uid; myName = r.name; lang = r.lang || "zh";
  localStorage.setItem("lp_uid", uid); localStorage.setItem("lp_name", myName); localStorage.setItem("lp_lang", lang);
  enterApp();
};
$("#logoutBtn").onclick = () => {
  localStorage.removeItem("lp_uid"); localStorage.removeItem("lp_name"); localStorage.removeItem("lp_lang");
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
          ? "进度不错！怕漏签证材料？<b>签证不慌包 ¥9</b> 一键照着打勾 → <button class=\"btn-sm\" onclick=\"location.hash='kit'\">去看看</button>"
          : "Good progress! Scared of missing visa docs? <b>Visa-No-Panic Kit ¥9</b> → <button class=\"btn-sm\" onclick=\"location.hash='kit'\">view</button>";
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
  $("#wikiList").innerHTML = rows.map((w) => `<div class="w"><span class="wc">${esc(w["cat_" + lang])}</span><h3>${esc(w["title_" + lang])}</h3><p>${esc(w["body_" + lang])}</p></div>`).join("");
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
    <div class="row"><span class="kp">¥${k.price}</span><button class="btn-sm" data-id="${k.id}">${I18N[lang].kit_buy}</button></div>
  </div>`).join("");
  $("#kitList").querySelectorAll("button").forEach((b) => { b.onclick = () => buyKit(kits.find((x) => x.id == b.dataset.id)); });
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
// ---- admin console (owner only) ----
async function renderAdmin() {
  // guard: only the admin account can see this (server also enforces)
  const chk = await (await fetch("/api/admin/check?uid=" + uid)).json().catch(() => ({}));
  if (!chk.admin) { $("#view-admin").innerHTML = `<p class="muted">${lang === "zh" ? "无权限" : "No access"}</p>`; return; }
  const ov = await (await fetch("/api/admin/overview?uid=" + uid)).json();
  $("#adminOverview").innerHTML = `<div class="ovgrid">` + [
    ["users", ov.users], ["kits", ov.kits], ["kits_sold", ov.kits_sold], ["bookings", ov.bookings],
    ["products", ov.products], ["questions", ov.questions], ["answers", ov.answers],
  ].map(([k, v]) => `<div class="ovcell"><b>${v}</b><span>${k}</span></div>`).join("") + `</div>`;
  // partnerships (editable)
  const ps = await (await fetch("/api/admin/products?uid=" + uid)).json();
  $("#adminProducts").innerHTML = ps.map((p) => `<div class="ap">
    <div class="apn">${esc(p.name_zh)} · ${esc(p.name_en)} <span class="apc">${esc(p.cat)}</span></div>
    <label>${lang === "zh" ? "价格" : "Price"}<input data-f="price" data-id="${p.id}" value="${esc(p.price)}"></label>
    <label>${lang === "zh" ? "返佣" : "Commission"}<input data-f="commission" data-id="${p.id}" value="${esc(p.commission)}"></label>
    <label class="apurl">${lang === "zh" ? "追踪链接" : "Tracking URL"}<input data-f="url" data-id="${p.id}" value="${esc(p.url)}"></label>
    <button class="btn-sm apsave" data-id="${p.id}">${I18N[lang].admin_save}</button>
  </div>`).join("");
  $("#adminProducts").querySelectorAll(".apsave").forEach((b) => {
    b.onclick = async () => {
      const id = b.dataset.id;
      const row = $("#adminProducts").querySelector(`input[data-id="${id}"]`);
      const price = $(`#adminProducts input[data-f="price"][data-id="${id}"]`).value;
      const commission = $(`#adminProducts input[data-f="commission"][data-id="${id}"]`).value;
      const url = $(`#adminProducts input[data-f="url"][data-id="${id}"]`).value;
      await fetch("/api/admin/product_save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid, id: +id, price, commission, url }) });
      b.textContent = "✓";
    };
  });
  // moderation: questions + answers
  const qs = await (await fetch("/api/admin/qa?uid=" + uid)).json();
  $("#adminQA").innerHTML = qs.length ? qs.map((q) => `<div class="aq">
    <div class="aqh">${esc(q.name)} · ${q.lang === "zh" ? "中文" : "EN"} <span class="aqt">${esc(q.title)}</span></div>
    ${esc(q.body)}
    <div class="aqans">${(q.answers || []).map((a) => `<div class="aa">💬 ${esc(a.name)}: ${esc(a.text)} <button class="btn-sm adel" data-aid="${a.id}">${I18N[lang].admin_del}</button></div>`).join("")}</div>
    <button class="btn-sm adelq" data-qid="${q.id}">${lang === "zh" ? "删除整个问题" : "Delete question"}</button>
  </div>`).join("") : `<p class="muted">${lang === "zh" ? "暂无问答" : "No Q&A"}</p>`;
  $("#adminQA").querySelectorAll(".adel").forEach((b) => { b.onclick = () => delQA(b.dataset.aid, null); });
  $("#adminQA").querySelectorAll(".adelq").forEach((b) => { b.onclick = () => delQA(null, b.dataset.qid); });
}
async function delQA(answer_id, q_id) {
  await fetch("/api/admin/qa_delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid, answer_id: answer_id ? +answer_id : null, q_id: q_id ? +q_id : null }) });
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
