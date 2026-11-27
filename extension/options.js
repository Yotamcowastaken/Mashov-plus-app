const rowsEl = document.getElementById("rows");
const statusEl = document.getElementById("status");
const funnyEl = document.getElementById("funny");
const filterEl = document.getElementById("filter");

function parse(text) {
  return String(text || "")
    .split("\n")
    .map((l) => l.split("=>").map((x) => x.trim()))
    .filter((p) => p.length === 2);
}

function addRow(from = "", to = "", focus = false) {
  const row = document.createElement("div");
  row.className = "row";
  const a = document.createElement("input");
  a.placeholder = "הטקסט במשוב";
  a.value = from;
  const arrow = document.createElement("span");
  arrow.className = "arrow";
  arrow.textContent = "←";
  const b = document.createElement("input");
  b.placeholder = "הטקסט המצחיק";
  b.value = to;
  const del = document.createElement("button");
  del.className = "del";
  del.textContent = "✕";
  del.title = "מחיקה";
  del.addEventListener("click", () => { row.remove(); save(); });
  a.addEventListener("input", save);
  b.addEventListener("input", save);
  row.append(a, arrow, b, del);
  rowsEl.append(row);
  if (focus) a.focus();
}

function render(text) {
  rowsEl.textContent = "";
  parse(text).forEach(([a, b]) => addRow(a, b));
}

let timer;
function save() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const pairs = [...rowsEl.querySelectorAll(".row")]
      .map((r) => [...r.querySelectorAll("input")].map((i) => i.value.trim()))
      .filter(([a, b]) => a && b);
    const text = pairs.map((p) => p.join(" => ")).join("\n");
    if (text === MP_FUNNY_TEXT) chrome.storage.local.remove("funnyList");
    else chrome.storage.local.set({ funnyList: text });
    statusEl.textContent = "✓ נשמר";
    setTimeout(() => (statusEl.textContent = ""), 1200);
  }, 250);
}

filterEl.addEventListener("input", () => {
  const q = filterEl.value.trim();
  rowsEl.querySelectorAll(".row").forEach((r) => {
    const t = [...r.querySelectorAll("input")].map((i) => i.value).join(" ");
    r.style.display = !q || t.includes(q) ? "" : "none";
  });
});
document.getElementById("add").addEventListener("click", () => addRow("", "", true));
document.getElementById("reset").addEventListener("click", () => {
  if (!confirm("לאפס את כל הרשימה לברירת המחדל? שינויים שעשית יימחקו.")) return;
  chrome.storage.local.remove("funnyList");
  render(MP_FUNNY_TEXT);
});
funnyEl.addEventListener("input", () => chrome.storage.local.set({ funny: funnyEl.checked }));

chrome.storage.local.get({ funnyList: MP_FUNNY_TEXT, funny: true }, (s) => {
  funnyEl.checked = s.funny;
  render(s.funnyList);
});

/* ---------- חבילות שמות ---------- */
const packsEl = document.getElementById("packs");
Object.entries(MP_PACKS).forEach(([k, p]) => {
  const b = document.createElement("button");
  b.textContent = p.name;
  b.addEventListener("click", () => {
    if (!confirm(`להחליף את הרשימה בחבילה "${p.name}"? הרשימה הנוכחית תימחק.`)) return;
    if (p.text === MP_FUNNY_TEXT) chrome.storage.local.remove("funnyList");
    else chrome.storage.local.set({ funnyList: p.text });
    render(p.text);
  });
  packsEl.append(b);
});

/* ---------- ייצוא / ייבוא ---------- */
const io = document.getElementById("io"), ioStatus = document.getElementById("ioStatus");
const say = (t) => { ioStatus.textContent = t; setTimeout(() => (ioStatus.textContent = ""), 2500); };
document.getElementById("exp").addEventListener("click", () => {
  chrome.storage.local.get(MP_DEFAULTS, (s) => {
    io.value = JSON.stringify({ mashovPlus: 1, settings: s });
    io.select();
    navigator.clipboard.writeText(io.value).then(() => say("✓ הועתק"), () => say("✓ סמנו והעתיקו"));
  });
});
document.getElementById("imp").addEventListener("click", () => {
  let data;
  try { data = JSON.parse(io.value.slice(io.value.indexOf("{"), io.value.lastIndexOf("}") + 1)); } catch (e) { return say("לא נמצא קוד הגדרות בטקסט"); }
  if (!data || !data.mashovPlus || typeof data.settings !== "object") return say("זה לא גיבוי של משוב פלוס");
  const clean = {};
  for (const k of Object.keys(MP_DEFAULTS)) {
    if (k in data.settings && typeof data.settings[k] === typeof MP_DEFAULTS[k]) clean[k] = data.settings[k];
  }
  chrome.storage.local.set(clean, () => {
    say("✓ יובא");
    funnyEl.checked = clean.funny !== undefined ? clean.funny : funnyEl.checked;
    if (clean.funnyList) render(clean.funnyList);
  });
});
