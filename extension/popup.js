const DEFAULTS = MP_DEFAULTS;
const ids = Object.keys(DEFAULTS).filter((k) => k !== "funnyList" && k !== "essList");
const el = Object.fromEntries(ids.map((k) => [k, document.getElementById(k)]));

chrome.storage.local.get(DEFAULTS, (s) => {
  ids.forEach((k) => {
    if (typeof DEFAULTS[k] === "boolean") el[k].checked = s[k];
    else el[k].value = s[k];
  });
});

ids.forEach((k) => {
  el[k].addEventListener("input", () => {
    let v;
    if (typeof DEFAULTS[k] === "boolean") v = el[k].checked;
    else if (k === "glowMin") v = Math.max(0, Math.min(100, Number(el[k].value) || 85));
    else v = el[k].value;
    const patch = { [k]: v };
    // ערכת נושא בוחרת גם צבע אקסנט מתאים
    const TA = { space: "#7c4dff", neon: "#ff2bd6", winter: "#4fc3f7" };
    if (k === "theme" && TA[v]) { patch.accent = TA[v]; el.accent.value = TA[v]; }
    chrome.storage.local.set(patch);
  });
});

document.getElementById("editFunny").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
document.getElementById("resetFunny").addEventListener("click", () => {
  chrome.storage.local.remove("funnyList");
  const b = document.getElementById("resetFunny");
  b.textContent = "✓ אופס";
  setTimeout(() => (b.textContent = "↩︎ אפס שמות לברירת מחדל"), 1500);
});
