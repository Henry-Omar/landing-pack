const I18N = {
  zh: {
    check_title: "行前落地清单", check_sub: "勾选你已完成的事项，出发前不漏项。",
    guide_title: "城市生存指南", qa_title: "同校前辈问答",
    qa_all: "全部", qa_ask: "我要提问", qa_submit: "发布", logout: "退出", unverified: "未验证 · 去验证",
    tab_check: "清单", tab_guide: "指南", tab_qa: "问答", tab_tpl: "模板",
    tpl_title: "文档模板", tpl_sub: "中英双语，点击复制。", tpl_copy: "复制", dest_label: "目的地",
  },
  en: {
    check_title: "Pre-arrival Checklist", check_sub: "Tick what you've done so nothing is missed before departure.",
    guide_title: "City Survival Guide", qa_title: "Peer Q&A",
    qa_all: "All", qa_ask: "Ask", qa_submit: "Post", logout: "Logout", unverified: "Unverified · verify",
    tab_check: "Checklist", tab_guide: "Guide", tab_qa: "Q&A", tab_tpl: "Templates",
    tpl_title: "Document Templates", tpl_sub: "Bilingual, click to copy.", tpl_copy: "Copy", dest_label: "Destination",
  },
};

let lang = localStorage.getItem("lp_lang") || "zh";
let myName = "同学";
let curCity = null;

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const A = (p) => "/api/" + p; // cookie is sent automatically for same-origin

function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => { const k = el.getAttribute("data-i18n"); if (I18N[lang][k]) el.textContent = I18N[lang][k]; });
  $("#langZh").classList.toggle("active", lang === "zh");
  $("#langEn").classList.toggle("active", lang === "en");
  if ($("#view-check").classList.contains("active")) renderChecklist();
  if ($("#view-guide").classList.contains("active")) renderCities();
  if ($("#view-qa").classList.contains("active")) renderQA();
  if ($("#view-tpl").classList.contains("active")) renderTemplates();
}
function setLang(l) {
  lang = l; localStorage.setItem("lp_lang", l);
  fetch(A("me"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang: l }) });
  applyLang();
}
$("#langZh").onclick = () => setLang("zh");
$("#langEn").onclick = () => setLang("en");
$("#logout").onclick = async () => {
  await fetch(A("logout"), { method: "POST" });
  location.href = "/";
};
$("#verifyTag").onclick = async () => {
  const d = await (await fetch(A("resend"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: myName }) })).json();
  if (d.verify_url) window.open(d.verify_url, "_blank");
};
document.querySelectorAll(".tab").forEach((t) => {
  t.onclick = () => {
    document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
    document.querySelectorAll(".view").forEach((x) => x.classList.remove("active"));
    t.classList.add("active");
    $("#view-" + t.dataset.view).classList.add("active");
    applyLang();
  };
});

(async () => {
  const r = await fetch(A("me"));
  if (!r.ok) { location.href = "/"; return; }
  const me = await r.json();
  myName = me.username || "同学";
  lang = me.lang || lang; localStorage.setItem("lp_lang", lang);
  $("#who").textContent = "@" + myName;
  if (!me.verified) $("#verifyTag").classList.remove("hidden");
  applyLang();
  populateDest();
})();

async function renderChecklist() {
  const tasks = await (await fetch(A("checklist"))).json();
  const checks = await (await fetch(A("checks"))).json();
  const groups = {};
  const add = (id, cat, task) => { (groups[cat] = groups[cat] || []).push({ id, cat, task }); };
  tasks.forEach((t) => add(t.id, t["cat_" + lang], t["task_" + lang]));
  const dest = localStorage.getItem("lp_dest") || "";
  if (dest) {
    const pres = await (await fetch(A("presets?city_id=" + dest))).json();
    if (pres.length) {
      const g = lang === "zh" ? "目的地专属" : "Destination-specific";
      pres.forEach((p) => add(p.id, g, p["task_" + lang]));
    }
  }
  let done = 0;
  const html = Object.keys(groups).map((cat) => {
    const items = groups[cat].map((t) => {
      const isDone = checks[t.id] ? 1 : 0; if (isDone) done++;
      return `<label class="item ${isDone ? "done" : ""}"><input type="checkbox" data-id="${t.id}" ${isDone ? "checked" : ""}><span class="t">${esc(t.task)}</span></label>`;
    }).join("");
    return `<div class="grp"><div class="cat">${esc(cat)}</div>${items}</div>`;
  }).join("");
  $("#checkList").innerHTML = html;
  const total = tasks.length + (dest ? (await (await fetch(A("presets?city_id=" + dest))).json()).length : 0);
  $("#checkProgress").textContent = (lang === "zh" ? "已完成 " : "Done ") + done + "/" + total;
  $("#checkList").querySelectorAll("input").forEach((cb) => {
    cb.onchange = async () => {
      await fetch(A("check"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task_id: +cb.dataset.id, done: cb.checked ? 1 : 0 }) });
      renderChecklist();
    };
  });
}
async function populateDest() {
  const cities = await (await fetch(A("cities"))).json();
  const cur = localStorage.getItem("lp_dest") || (cities[0] ? cities[0].id : "");
  $("#destSel").innerHTML = cities.map((c) => `<option value="${c.id}">${esc(c["name_" + lang])}</option>`).join("");
  $("#destSel").value = cur;
  localStorage.setItem("lp_dest", String(cur));
  $("#destSel").onchange = () => { localStorage.setItem("lp_dest", $("#destSel").value); if ($("#view-check").classList.contains("active")) renderChecklist(); };
  if ($("#view-check").classList.contains("active")) renderChecklist();
}
async function renderCities() {
  const cities = await (await fetch(A("cities"))).json();
  if (!curCity && cities.length) curCity = cities[0].id;
  $("#cityTabs").innerHTML = cities.map((c) => `<div class="ct ${c.id === curCity ? "active" : ""}" data-id="${c.id}">${esc(c["name_" + lang])}</div>`).join("");
  $("#cityTabs").querySelectorAll(".ct").forEach((el) => { el.onclick = () => { curCity = +el.dataset.id; renderCities(); renderWiki(); }; });
  renderWiki();
}
async function renderWiki() {
  if (!curCity) return;
  const rows = await (await fetch(A("wiki?city_id=" + curCity))).json();
  $("#wikiList").innerHTML = rows.map((w) => `<div class="w"><span class="wc">${esc(w["cat_" + lang])}</span><h3>${esc(w["title_" + lang])}</h3><p>${esc(w["body_" + lang])}</p></div>`).join("");
}
async function renderTemplates() {
  const rows = await (await fetch(A("templates"))).json();
  $("#tplList").innerHTML = rows.map((w) => `<div class="tpl">
    <span class="wc">${esc(w["cat_" + lang])}</span>
    <h3>${esc(w["title_" + lang])}</h3>
    <pre class="tplbody">${esc(w["body_" + lang])}</pre>
    <button class="copy" data-text="${esc(w["body_" + lang])}">${I18N[lang].tpl_copy}</button>
  </div>`).join("");
}
$("#tplList").addEventListener("click", (e) => {
  const b = e.target.closest(".copy"); if (!b) return;
  navigator.clipboard.writeText(b.dataset.text);
  const orig = I18N[lang].tpl_copy;
  b.textContent = lang === "zh" ? "已复制 ✓" : "Copied ✓";
  setTimeout(() => (b.textContent = orig), 1500);
});
async function renderQA() {
  const l = $("#qaLang").value;
  const qs = await (await fetch(A("questions?lang=" + l))).json();
  $("#qaList").innerHTML = qs.map((q) => `<div class="q" data-id="${q.id}">
    <div class="qh">${esc(q.title)}</div>
    <div class="qm">${esc(q.name)} · ${q.lang === "zh" ? "中文" : "EN"}</div>
    <div class="qb">${esc(q.body)}</div>
    <div class="ans" id="ans-${q.id}"></div>
    <div class="ansbox"><input placeholder="${lang === "zh" ? "回复…" : "Reply…"}" id="ain-${q.id}"><button data-id="${q.id}">${lang === "zh" ? "回复" : "Reply"}</button></div>
  </div>`).join("");
  qs.forEach(async (q) => {
    const ans = await (await fetch(A("answers?q_id=" + q.id))).json();
    $("#ans-" + q.id).innerHTML = ans.map((a) => `💬 <b>${esc(a.name)}</b> (${a.lang === "zh" ? "中文" : "EN"}): ${esc(a.text)}`).join("<br>");
  });
  $("#qaList").querySelectorAll(".ansbox button").forEach((b) => {
    b.onclick = async () => {
      const id = b.dataset.id; const txt = $("#ain-" + id).value.trim(); if (!txt) return;
      await fetch(A("answer"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q_id: +id, lang, text: txt }) });
      renderQA();
    };
  });
}
$("#qaLang").onchange = renderQA;
$("#qaNew").onclick = () => $("#qaForm").classList.toggle("hidden");
$("#qaFormSubmit").onclick = async () => {
  const title = $("#qaFormTitle").value.trim(); const body = $("#qaFormBody").value.trim(); if (!title) return;
  await fetch(A("question"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang: $("#qaFormLang").value, title, body }) });
  $("#qaFormTitle").value = ""; $("#qaFormBody").value = ""; $("#qaForm").classList.add("hidden");
  renderQA();
};
