(function () {
  if (window.__mpBooted) return;
  window.__mpBooted = true;
  function main() {

  var store = Object.assign({}, window.__MP_INITIAL || {});
  var listeners = [];
  function post(m) { try { window.ReactNativeWebView.postMessage(JSON.stringify(m)); } catch (e) {} }
  window.chrome = window.chrome || {};
  window.chrome.runtime = { id: "mashov-plus-app", lastError: undefined, sendMessage: function (m) { post(m); } };
  window.chrome.storage = {
    local: {
      get: function (defs, cb) { var out = Object.assign({}, defs, store); setTimeout(function () { cb(out); }, 0); },
      set: function (o, cb) { Object.assign(store, o); post({ type: "set", patch: o }); if (cb) cb(); },
      remove: function (k, cb) { [].concat(k).forEach(function (x) { delete store[x]; }); post({ type: "remove", keys: [].concat(k) }); if (cb) cb(); }
    },
    onChanged: { addListener: function (f) { listeners.push(f); } }
  };
  window.__mpApply = function (next) {
    var changes = {}, keys = {};
    Object.keys(store).concat(Object.keys(next)).forEach(function (k) { keys[k] = 1; });
    Object.keys(keys).forEach(function (k) {
      if (JSON.stringify(store[k]) !== JSON.stringify(next[k])) changes[k] = { oldValue: store[k], newValue: next[k] };
    });
    store = Object.assign({}, next);
    if (Object.keys(changes).length) listeners.forEach(function (f) { f(changes, "local"); });
  };

// ברירות מחדל משותפות לתוסף, לחלון ההגדרות ולדף העריכה
const MP_FUNNY_DEFAULT = [
  ["לוח מידע", "חדר הבקרה"],
  ["קוד לזיהוי", "מי אני בכלל?"],
  ["שחרורית", "כרטיס בריחה"],
  ["דואר ומסרונים", "תיבת הבשורות הרעות"],
  ["דואר שלא נקרא", "הודעות שמתעלמים מהן"],
  ["ציונים שוטפים", "רגע האמת"],
  ["ציונים תקופתיים", "יום הדין"],
  ["משוב ההצלחה שלי", "מה באמת הצלחתי?"],
  ["תעודות", "מסמכי הגורל"],
  ["קול התלמיד", "הזכות להתלונן"],
  ["התנהגות בשיעור", "הילד שוב לא התנהג יפה?"],
  ["מבט על", "עין הנשר"],
  ["מרחב קבצים", "המחסן הדיגיטלי"],
  ["בקשות הצדקה", "מפעל התירוצים"],
  ["אירועי התנהגות יומיים", "הדרמות של היום"],
  ["התנהגות מחוץ לשיעור", "מה קרה בהפסקה?"],
  ["מונה אירועים", "מונה החטאים"],
  ["שעות פרטניות", "טיפול VIP"],
  ["הערות מעקב", "המחברת השחורה"],
  ["מערכת שעות", "לוח הסבל השבועי"],
  ["המערכת להיום", "הסבל להיום"],
  ["חומרי לימוד", "אוצר הידע שאף אחד לא קורא"],
  ["שיעורי בית אחרונים", "העבודות האחרונות בלי שכר"],
  ["שיעורי בית", "עבודה בלי שכר"],
  ["טפסים מקוונים", "ניירת בלי נייר"],
  ["אישורי הורים לפעילות", "חתימת אמא להצלה"],
  ["התאמות", "טיפול מיוחד"],
  ["לוח מודעות", "קיר הרכילות"],
  ["כיתה מקוונת", "זום הייסורים"],
  ["הקלטות", "ארכיון ההרצאות שלא ראיתי"],
  ["משימות Moodle", "המשימות של מודל (שוב)"],
  ["פרופיל אישי", "הפרצוף שלי"],
  ["אתר בית הספר", "הבית השני"],
  ["כניסה ל-Moodle", "הבור השחור של מודל"],
  ["לוח מבחנים ואירועים", "לוח הפחדים והחגיגות"]
];
const MP_FUNNY_TEXT = MP_FUNNY_DEFAULT.map((p) => p.join(" => ")).join("\n");
const MP_ESS_TEXT = ["📊 ציונים שוטפים", "⚠️ התנהגות בשיעור", "📝 שיעורי בית", "✉️ דואר ומסרונים"].join("\n");
const MP_PACKS = {
  default: { name: "😂 ברירת מחדל", text: MP_FUNNY_TEXT },
  gamer: { name: "🎮 גיימר", text: "לוח מידע => הלובי\nציונים שוטפים => לוח התוצאות\nציונים תקופתיים => הבוס של סוף העונה\nהתנהגות בשיעור => דוח הבאנים\nאירועי התנהגות יומיים => קילפיד יומי\nמונה אירועים => מונה הדת'ים\nשיעורי בית => קווסטים צדדיים\nשיעורי בית אחרונים => הקווסטים האחרונים\nמערכת שעות => לו\"ז הרייד\nהמערכת להיום => הרייד של היום\nדואר ומסרונים => צ'אט הגילדה\nדואר שלא נקרא => הודעות מהגילדה\nלוח מודעות => פאץ' נוטס\nכיתה מקוונת => מולטיפלייר\nחומרי לימוד => מדריכי משחק\nתעודות => הישגים פתוחים\nפרופיל אישי => הדמות שלי\nלוח מבחנים ואירועים => לוח הבוסים\nכניסה ל-Moodle => שרת משני\nבקשות הצדקה => בקשת ריספון" },
  pirates: { name: "🏴‍☠️ פיראטים", text: "לוח מידע => סיפון האונייה\nציונים שוטפים => שלל המטמון\nציונים תקופתיים => מפת האוצר\nהתנהגות בשיעור => מי שוב התמרד?\nאירועי התנהגות יומיים => יומן הקפטן\nמונה אירועים => מונה ההליכות על הקרש\nשיעורי בית => עבודות על הסיפון\nשיעורי בית אחרונים => קרצוף הסיפון האחרון\nמערכת שעות => לוח המשמרות\nהמערכת להיום => המשמרת של היום\nדואר ומסרונים => בקבוקים בים\nדואר שלא נקרא => בקבוקים שלא נפתחו\nלוח מודעות => מודעות מבוקשים\nכיתה מקוונת => הגשר\nחומרי לימוד => מפות ישנות\nתעודות => מכתבי החסינות\nפרופיל אישי => הקפטן\nלוח מבחנים ואירועים => לוח הסערות\nכניסה ל-Moodle => האי המסתורי\nבקשות הצדקה => תירוצים לקפטן" },
  army: { name: "🪖 צבא", text: "לוח מידע => חמ\"ל\nציונים שוטפים => דוח מצב\nציונים תקופתיים => מבחן כשירות\nהתנהגות בשיעור => שפיטה\nאירועי התנהגות יומיים => דוח משמעת יומי\nמונה אירועים => מונה ריתוקים\nשיעורי בית => תורנויות\nשיעורי בית אחרונים => התורנויות האחרונות\nמערכת שעות => לו\"ז פלוגתי\nהמערכת להיום => פקודת יום\nדואר ומסרונים => קשר\nדואר שלא נקרא => הודעות קשר שלא נקראו\nלוח מודעות => פקודות מטכ\"ל\nכיתה מקוונת => תדריך\nחומרי לימוד => תיק שטח\nתעודות => תעודת שחרור\nפרופיל אישי => הדיסקית שלי\nלוח מבחנים ואירועים => לוח מבצעים\nכניסה ל-Moodle => בסיס משני\nבקשות הצדקה => בקשת יציאה" },
};
const MP_DEFAULTS = {
  dark: "on",          // "auto" | "on" | "off"
  nav: true,
  accent: "#4da3ff",
  useAccent: true,
  glow: true,
  glowMin: 85,
  funny: true,
  funnyList: MP_FUNNY_TEXT,
  notify: true,
  avg: true,             // ממוצע בעמוד הציונים
  hideGrades: false,     // "אל תראה לי"
  theme: "none",         // none | space | neon | winter          // התראה על הודעות חדשות
  essList: MP_ESS_TEXT,  // כל שורה: אייקון ואז שם הפריט המקורי בתפריט
};

    var st = document.createElement("style");
    st.textContent = "/* =====================================================================\n   מצב כהה\n   הפילטר (invert + hue-rotate) לא מסוגל להציג צבעים רוויים, לכן אלמנטים\n   שצבועים באקסנט (.mp-tint) נשארים מחוץ לפילטר, והפילטר מוחל רק על\n   האזורים שסביבם. אם אין אלמנט כזה, הפילטר מוחל על כל ה-body.\n   ===================================================================== */\nhtml.mp-dark { background: #1a1a1a; color-scheme: dark; }\n\nhtml.mp-dark body:not(:has(.mp-tint)) {\n  background: #fff;\n  filter: invert(0.9) hue-rotate(180deg);\n}\nhtml.mp-dark body:has(.mp-tint) {\n  background: #1a1a1a !important;\n  color: #e5e5e5;\n}\n/* אבות של אלמנט האקסנט: רקע כהה ישיר, בלי פילטר */\nhtml.mp-dark :has(.mp-tint):not(.mp-tint):not(html):not(body) {\n  background-color: #1a1a1a !important;\n  color: #e5e5e5;\n}\n/* האזורים שסביב: מסוננים בנפרד */\nhtml.mp-dark :has(.mp-tint) > :not(:has(.mp-tint)):not(.mp-tint):not(#mp-fab):not(#mp-panel):not(body) {\n  filter: invert(0.9) hue-rotate(180deg);\n}\n\n/* תמונות ווידאו חוזרים לצבעים רגילים (רק בתוך אזורים מסוננים) */\nhtml.mp-dark body:not(:has(.mp-tint)) :is(img, video, canvas, picture, iframe, [style*=\"background-image\"]),\nhtml.mp-dark :has(.mp-tint) > :not(:has(.mp-tint)):not(.mp-tint):not(#mp-fab):not(#mp-panel):not(body) :is(img, video, canvas, picture, iframe, [style*=\"background-image\"]) {\n  filter: invert(1) hue-rotate(180deg);\n}\n\n/* =====================================================================\n   אקסנט\n   --mp-accent        = הצבע המדויק (לאלמנטים שמחוץ לפילטר)\n   --mp-accent-f      = הצבע אחרי תיקון לפילטר (לקישורים וטאבים)\n   ===================================================================== */\nhtml.mp-accent .mp-tint {\n  background-color: var(--mp-accent) !important;\n  color: var(--mp-on-accent) !important;\n}\nhtml.mp-accent .mp-tint * {\n  color: var(--mp-on-accent) !important;\n}\n\nhtml.mp-accent a:not(.mp-item),\nhtml.mp-accent .mat-tab-label-active,\nhtml.mp-accent .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label {\n  color: var(--mp-accent-f) !important;\n}\nhtml.mp-accent .mat-ink-bar,\nhtml.mp-accent .mdc-tab-indicator__content--underline {\n  background-color: var(--mp-accent-f) !important;\n  border-color: var(--mp-accent-f) !important;\n}\n\n/* =====================================================================\n   ציונים מעל הסף: זוהר\n   ===================================================================== */\n.mp-glow {\n  color: var(--mp-glow, #ffb300) !important;\n  font-weight: 700 !important;\n  text-shadow: 0 0 6px var(--mp-glow, #ffb300), 0 0 14px var(--mp-glow, #ffb300);\n  animation: mp-pulse 2.2s ease-in-out infinite;\n}\n@keyframes mp-pulse {\n  50% {\n    text-shadow: 0 0 12px var(--mp-glow, #ffb300), 0 0 28px var(--mp-glow, #ffb300);\n  }\n}\n\n/* =====================================================================\n   ניווט מהיר (נמצא מחוץ ל-body ולכן אף פעם לא מסונן)\n   ===================================================================== */\n#mp-fab {\n  position: fixed; left: 16px; bottom: 16px; z-index: 2147483000;\n  width: 48px; height: 48px; border-radius: 50%; border: 0; cursor: pointer;\n  background: var(--mp-accent, #1565c0); color: var(--mp-on-accent, #fff); font-size: 22px;\n  box-shadow: 0 2px 8px rgba(0,0,0,.35);\n}\n#mp-panel {\n  position: fixed; left: 16px; bottom: 72px; z-index: 2147483000;\n  width: 300px; max-height: 70vh; overflow: auto; direction: rtl;\n  background: #fff; color: #222; border-radius: 12px; padding: 10px;\n  border: 1px solid #999;\n  box-shadow: 0 4px 18px rgba(0,0,0,.35); font: 14px/1.4 Arial, sans-serif;\n  display: none;\n}\n#mp-panel.open { display: block; }\n#mp-tabs { display: flex; gap: 6px; margin-bottom: 8px; }\n#mp-tabs button {\n  flex: 1; padding: 7px; border: 1px solid #bbb; border-radius: 8px; cursor: pointer;\n  background: #f3f6fb; color: #222; font: inherit; font-weight: bold;\n}\n#mp-tabs button.on {\n  background: var(--mp-accent, #1565c0); color: var(--mp-on-accent, #fff);\n  border-color: transparent;\n}\n#mp-search {\n  width: 100%; box-sizing: border-box; padding: 8px 10px; margin-bottom: 8px;\n  border: 1px solid #bbb; border-radius: 8px; font-size: 14px;\n  background: #fff; color: #222;\n}\n#mp-panel details { margin-bottom: 4px; border-radius: 8px; background: #f3f6fb; }\n#mp-panel summary { cursor: pointer; padding: 8px 10px; font-weight: bold; }\n#mp-panel .mp-item {\n  display: block; width: 100%; text-align: right; box-sizing: border-box;\n  padding: 7px 18px; border: 0; background: transparent; cursor: pointer;\n  font: inherit; color: #0d47a1;\n}\n#mp-panel .mp-item:hover { background: #dce8f8; }\n#mp-panel .mp-big {\n  padding: 12px 14px; margin-bottom: 6px; border-radius: 10px; font-size: 16px;\n  font-weight: bold; background: #f3f6fb; border: 1px solid #d5deec;\n}\n#mp-panel .mp-empty { padding: 8px; color: #666; }\n\n/* החלונית במצב כהה */\nhtml.mp-dark #mp-panel { background: #262626; color: #eee; border-color: #555; }\nhtml.mp-dark #mp-tabs button { background: #333; color: #eee; border-color: #555; }\nhtml.mp-dark #mp-tabs button.on { background: var(--mp-accent); color: var(--mp-on-accent); }\nhtml.mp-dark #mp-search { background: #1a1a1a; color: #eee; border-color: #555; }\nhtml.mp-dark #mp-panel details { background: #303030; }\nhtml.mp-dark #mp-panel .mp-item { color: #9ec5ff; }\nhtml.mp-dark #mp-panel .mp-item:hover { background: #3a3a3a; }\nhtml.mp-dark #mp-panel .mp-big { background: #303030; border-color: #444; }\nhtml.mp-dark #mp-panel .mp-empty { color: #aaa; }\n\n/* Essentials: כוכבים ועריכה */\n#mp-panel .mp-row { display: flex; align-items: center; }\n#mp-panel .mp-row .mp-item { flex: 1; }\n#mp-panel .mp-star { border: 0; background: transparent; cursor: pointer; font-size: 18px; padding: 4px 10px; color: #999; }\n#mp-panel .mp-star.on { color: #f5b301; }\n#mp-panel .mp-edit { display: flex; align-items: center; gap: 6px; padding: 6px; margin-bottom: 6px; border-radius: 10px; background: #f3f6fb; }\n#mp-panel .mp-edit span { flex: 1; font-weight: bold; }\n#mp-panel .mp-edit .mp-icon { width: 42px; text-align: center; font-size: 16px; padding: 4px; border: 1px solid #bbb; border-radius: 6px; }\n#mp-panel .mp-edit button, #mp-panel .mp-tools button { border: 1px solid #bbb; background: #fff; border-radius: 6px; cursor: pointer; padding: 4px 8px; font: inherit; color: inherit; }\n#mp-panel .mp-tools { display: flex; gap: 6px; margin-top: 4px; }\n#mp-panel .mp-tools button { flex: 1; padding: 7px; }\nhtml.mp-dark #mp-panel .mp-edit { background: #303030; }\nhtml.mp-dark #mp-panel .mp-edit .mp-icon, html.mp-dark #mp-panel .mp-edit button, html.mp-dark #mp-panel .mp-tools button { background: #1a1a1a; color: #eee; border-color: #555; }\n\n/* ---------- \"אל תראה לי\" ---------- */\nhtml.mp-hide-grades .mp-gr:not(.mp-reveal) {\n  filter: blur(7px) !important;\n  cursor: pointer;\n  user-select: none;\n}\n\n/* ---------- ממוצע ציונים ---------- */\n#mp-avg {\n  direction: rtl; margin: 8px 0 14px; padding: 12px 14px; border-radius: 12px;\n  background: #eef3fb; color: #1b2230; font: 14px/1.4 Arial, sans-serif;\n  border: 1px solid #d5deec;\n}\n#mp-avg .mp-avg-head { display: flex; align-items: center; justify-content: space-between; font-size: 17px; font-weight: bold; margin-bottom: 8px; }\n#mp-avg .mp-avg-chips { display: flex; flex-wrap: wrap; gap: 6px; }\n#mp-avg .mp-avg-chip { display: flex; gap: 8px; align-items: center; background: #fff; border: 1px solid #d5deec; border-radius: 20px; padding: 4px 10px; }\n#mp-avg .mp-avg-n { display: inline-flex; gap: 4px; align-items: center; font-variant-numeric: tabular-nums; }\n#mp-avg i { font-style: normal; font-size: 12px; }\n#mp-avg i.up { color: #1a8a3a; }\n#mp-avg i.down { color: #c62828; }\n#mp-avg i.same { color: #888; }\n\n/* ---------- ערכות נושא ---------- */\n#mp-fx { position: fixed; inset: 0; pointer-events: none; z-index: 2147482000; overflow: hidden; }\n#mp-fx span { position: absolute; }\nhtml.mp-theme-space #mp-fx span {\n  width: 2px; height: 2px; border-radius: 50%; background: #fff; opacity: .5;\n  box-shadow: 0 0 4px #fff; animation: mp-twinkle ease-in-out infinite;\n}\n@keyframes mp-twinkle { 50% { opacity: .05; } }\nhtml.mp-theme-winter #mp-fx span { color: #dff3ff; opacity: .55; animation: mp-snow linear infinite; }\n@keyframes mp-snow { to { transform: translate(30px, 110vh) rotate(180deg); } }\nhtml.mp-theme-neon .mp-tint { box-shadow: 0 0 14px var(--mp-accent), 0 0 30px var(--mp-accent) !important; }\nhtml.mp-theme-neon #mp-fab, html.mp-theme-neon #mp-tabs button.on { box-shadow: 0 0 14px var(--mp-accent), 0 0 28px var(--mp-accent); }\nhtml.mp-theme-neon #mp-panel { border-color: var(--mp-accent); box-shadow: 0 0 18px var(--mp-accent); }\nhtml.mp-theme-neon .mp-tint * { text-shadow: 0 0 6px var(--mp-on-accent); }\n@media (prefers-reduced-motion: reduce) { #mp-fx span { animation: none !important; } }\n\n/* הגדרות בתוך הדף (אייפון) */\n#mp-panel .mp-set-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 6px; border-bottom: 1px solid #ddd; }\n#mp-panel .mp-set-row select { font: inherit; padding: 4px; border-radius: 6px; }\n#mp-panel .mp-set-row input[type=checkbox] { width: 22px; height: 22px; }\n#mp-panel .mp-set-row input[type=color] { width: 44px; height: 30px; border: 0; padding: 0; background: none; }\nhtml.mp-dark #mp-panel .mp-set-row { border-color: #444; }\nhtml.mp-dark #mp-panel .mp-set-row select { background: #1a1a1a; color: #eee; border: 1px solid #555; }\n";
    document.documentElement.appendChild(st);
(() => {
  const DEFAULTS = MP_DEFAULTS;
  let settings = { ...DEFAULTS };

  /* ניסיון קודם לשמור את החיבור (גיבוי sessionStorage) שבר את ההתחברות של משרד החינוך.
     בוטל: מוחקים את הגיבוי שנשאר בטלפון. */
  try { localStorage.removeItem("mp-ss-backup"); } catch (e) {}
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };
  try { Object.assign(settings, JSON.parse(ls.get("mp-settings") || "{}")); } catch (e) {}

  /* ---------- צבעים: תיקון לפילטר של המצב הכהה ---------- */
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const hex2rgb = (h) => {
    const n = parseInt(h.replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  // הפילטר הוא invert(0.9) ואז hue-rotate(180). כאן מחשבים את הצבע שצריך
  // לכתוב כדי שאחרי הפילטר ייראה בדיוק (בקירוב) הצבע הרצוי.
  function preDark([r, g, b]) {
    const h = [
      r * -0.574 + g * 1.43 + b * 0.144,
      r * 0.426 + g * 0.43 + b * 0.144,
      r * 0.426 + g * 1.43 + b * -0.856,
    ];
    return h.map((u) => clamp((229.5 - u) / 0.8));
  }
  const css = (rgb) => `rgb(${rgb.join(",")})`;

  /* ---------- ערכת נושא ---------- */
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  function applyBase() {
    const root = document.documentElement;
    const dark = settings.dark === "on" || (settings.dark === "auto" && mq.matches);
    root.classList.toggle("mp-dark", dark);
    root.classList.toggle("mp-accent", !!settings.useAccent);

    const fix = (rgb) => (dark ? preDark(rgb) : rgb);
    const accent = hex2rgb(settings.accent);
    const lum = 0.299 * accent[0] + 0.587 * accent[1] + 0.114 * accent[2];
    const onAccent = lum > 150 ? [0, 0, 0] : [255, 255, 255];
    const setVar = (k, v) => {
      if (root.style.getPropertyValue(k) !== v) root.style.setProperty(k, v);
    };
    // הצבע המדויק (לאלמנטים שמחוץ לפילטר) והצבע המתוקן (לאלמנטים בתוכו)
    setVar("--mp-accent", css(accent));
    setVar("--mp-on-accent", css(onAccent));
    setVar("--mp-accent-f", css(fix(accent)));
    setVar("--mp-on-accent-f", css(fix(onAccent)));
    setVar("--mp-glow", css(fix([255, 193, 7])));
  }
  function applyTheme() {
    applyBase();
    try { applyThemeFx(); } catch (e) {}
    applyFunny();
    markGrades();
    tintPrimary();
  }
  mq.addEventListener("change", applyTheme);

  /* ---------- צבע ראשי של האתר (סרגל עליון, פריט תפריט פעיל) ---------- */
  let primaryBg = ls.get("mp-primary");
  const checked = new WeakSet();
  function parseRgb(s) {
    const m = s && s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(",").map((x) => parseFloat(x));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  const MAX_TINT_HEIGHT = 140; // סרגל או פריט בודד, לא מכל שלם של כמה פריטים
  function isPrimary(el) {
    if (getComputedStyle(el).backgroundColor !== primaryBg) return false;
    return el.getBoundingClientRect().height <= MAX_TINT_HEIGHT;
  }
  // אלמנט שהיה פעיל ואינו עוד (או שהאתר השתמש בו מחדש) מאבד את הצבע
  function revalidateTint() {
    document.querySelectorAll(".mp-tint").forEach((el) => {
      el.classList.remove("mp-tint");
      if (primaryBg && isPrimary(el)) el.classList.add("mp-tint");
    });
  }
  function tintPrimary(full = true) {
    if (!document.body) return;
    if (!settings.useAccent) {
      document.querySelectorAll(".mp-tint").forEach((e) => e.classList.remove("mp-tint"));
      return;
    }
    if (!primaryBg) {
      const cands = document.querySelectorAll(
        "mat-toolbar, header, [role=banner], [class*=toolbar], [class*=header]"
      );
      for (const el of cands) {
        const r = el.getBoundingClientRect();
        if (r.top > 2 || r.width < innerWidth * 0.9 || r.height < 40 || r.height > 130) continue;
        const bg = getComputedStyle(el).backgroundColor;
        const c = parseRgb(bg);
        // מתעלמים משקוף ומלבן/אפור (למשל עמוד ההתחברות)
        if (!c || c.a < 0.5 || Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b) < 25) continue;
        primaryBg = bg;
        ls.set("mp-primary", bg);
        break;
      }
    }
    if (!primaryBg) return;
    if (full) revalidateTint();
    document.querySelectorAll("body *").forEach((el) => {
      if (el.classList.contains("mp-tint")) return;
      if (!full && checked.has(el)) return;
      checked.add(el);
      if (isPrimary(el)) el.classList.add("mp-tint");
    });
  }

  /* ---------- שמות מצחיקים ---------- */
  const origMap = new WeakMap(); // textNode -> {orig, shown}
  let funnyTouched = false;
  function rules() {
    return String(settings.funnyList || "")
      .split("\n")
      .map((l) => l.split("=>").map((x) => x.trim()))
      .filter((p) => p.length === 2 && p[0] && p[1])
      .sort((a, b) => b[0].length - a[0].length); // כלל ארוך קודם, כדי ש"שיעורי בית אחרונים" לא ייתפס כ"שיעורי בית"
  }
  function funnify(text) {
    if (!settings.funny) return text;
    let t = text;
    for (const [from, to] of rules()) t = t.split(from).join(to);
    return t;
  }
  function tipTarget(n) {
    const p = n.parentElement;
    return p && (p.closest("a, button, [role=menuitem], mat-list-item") || p);
  }
  function setTip(n, orig) {
    const t = tipTarget(n);
    if (!t) return;
    if (t.hasAttribute("title") && !t.dataset.mpTip) return; // לא דורסים tooltip של האתר
    const text = "במקור: " + orig.trim();
    if (t.getAttribute("title") !== text) t.setAttribute("title", text);
    t.dataset.mpTip = "1";
  }
  function clearTip(n) {
    const t = tipTarget(n);
    if (t && t.dataset.mpTip) {
      t.removeAttribute("title");
      delete t.dataset.mpTip;
    }
  }
  function applyFunny() {
    if (!document.body) return;
    if (!settings.funny && !funnyTouched) return;
    const r = rules();
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const p = n.parentElement;
        if (!p || /^(SCRIPT|STYLE|TEXTAREA|INPUT|NOSCRIPT)$/.test(p.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let n;
    while ((n = w.nextNode())) {
      const m = origMap.get(n);
      const orig = m && n.data === m.shown ? m.orig : n.data; // האתר עדכן את הטקסט? זה המקור החדש
      let out = orig;
      if (settings.funny) for (const [from, to] of r) out = out.split(from).join(to);
      if (out !== n.data) {
        n.data = out;
        funnyTouched = true;
      }
      if (out !== orig) {
        origMap.set(n, { orig, shown: out });
        setTip(n, orig);
      } else if (m) {
        origMap.delete(n);
        clearTip(n);
      }
    }
  }
  function origText(el) {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let t = "", n;
    while ((n = w.nextNode())) {
      const m = origMap.get(n);
      t += m && n.data === m.shown ? m.orig : n.data;
    }
    return t;
  }

  /* ---------- התראה על הודעות חדשות ---------- */
  // מספר ההודעות שלא נקראו: התג ליד "דואר" בתפריט, או האריח "הודעות חדשות"
  function leafNumber(root) {
    for (const el of root.querySelectorAll("*")) {
      if (el.children.length) continue;
      const t = el.textContent.trim();
      if (/^\d{1,3}$/.test(t)) return parseInt(t, 10);
    }
    return null;
  }
  function origLeafText(el) {
    const n = el.firstChild;
    const m = n && origMap.get(n);
    return (m && n.data === m.shown ? m.orig : el.textContent).trim();
  }
  function unreadCount() {
    let best = null;
    for (const it of items) {
      if (/דואר/.test(it.text)) {
        const n = leafNumber(it.el.closest("li, mat-list-item, a, [role=menuitem]") || it.el);
        if (n !== null) best = n;
        break;
      }
    }
    if (best !== null) return best;
    for (const el of document.querySelectorAll("body *")) {
      if (el.children.length || el.closest("#mp-panel")) continue;
      if (origLeafText(el) !== "הודעות חדשות") continue;
      let p = el.parentElement;
      for (let k = 0; p && k < 4; k++, p = p.parentElement) {
        const n = leafNumber(p);
        if (n !== null) return n;
      }
    }
    return null;
  }
  let lastMail = (() => { const v = ls.get("mp-lastMail"); return v === null ? null : +v; })();
  function checkMail() {
    if (!settings.notify) return;
    const n = unreadCount();
    if (n === null) return;
    if (lastMail !== null && n > lastMail) {
      const d = n - lastMail;
      try {
        chrome.runtime.sendMessage({
          type: "mp-notify",
          title: "משוב פלוס",
          body: d === 1 ? "הגיעה הודעה חדשה במשוב" : `הגיעו ${d} הודעות חדשות במשוב`,
        });
      } catch (e) {}
    }
    lastMail = n;
    ls.set("mp-lastMail", String(n));
  }
  // רענון אוטומטי כשהדף ברקע, כדי לקבל את מספר ההודעות העדכני
  let hiddenSince = document.hidden ? Date.now() : 0;
  document.addEventListener("visibilitychange", () => {
    hiddenSince = document.hidden ? Date.now() : 0;
  });
  setInterval(() => {
    if (!settings.notify || !hiddenSince) return;
    if (Date.now() - hiddenSince < 5 * 60 * 1000) return;
    if (!/\/main\//.test(location.pathname)) return; // רק כשמחוברים, לא בעמוד ההתחברות
    hiddenSince = Date.now();
    location.reload();
  }, 30 * 1000);

  /* ---------- ציונים: זוהר, "אל תראה לי", ממוצע ---------- */
  const GRADE_PATH = /grade|mark|score|ציון/i;
  function markGrades() {
    if (!document.body) return;
    const pathOk = GRADE_PATH.test(decodeURIComponent(location.pathname));
    document
      .querySelectorAll(
        "mat-cell, td, span, div, p, b, strong, mat-chip, [class*=grade], [class*=mark], [class*=score]"
      )
      .forEach((el) => {
        if (el.children.length || el.closest("#mp-panel")) return;
        const t = el.textContent.trim();
        if (!/^\d{2,3}(\.\d+)?$/.test(t)) {
          el.classList.remove("mp-glow", "mp-gr");
          return;
        }
        const v = parseFloat(t);
        // לא ציון: סרגל עליון, תפריט, כפתורים, תגיות של התראות
        const notGrade = el.closest(
          "mat-toolbar, header, [role=banner], nav, [role=navigation], mat-sidenav, mat-drawer, " +
          "button, [role=button], mat-icon, [class*=badge], [class*=toolbar], [class*=header], [class*=notif], #mp-panel, #mp-fab"
        );
        const inGradeCtx = !notGrade && !!(pathOk || el.closest("[class*=grade],[class*=mark],[class*=score],#mp-avg"));
        const isGrade = inGradeCtx && v >= 0 && v <= 100;
        el.classList.toggle("mp-gr", isGrade);
        el.classList.toggle("mp-glow", isGrade && settings.glow && v >= settings.glowMin);
      });
    document.documentElement.classList.toggle("mp-hide-grades", !!settings.hideGrades);
    try { renderAverage(); } catch (e) {}
  }
  // "אל תראה לי": נגיעה בציון חושפת אותו
  document.addEventListener("click", (e) => {
    if (!settings.hideGrades) return;
    const g = e.target.closest && e.target.closest(".mp-gr");
    if (g && !g.classList.contains("mp-reveal")) {
      g.classList.add("mp-reveal");
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  function parseDate(t) {
    const m = String(t).match(/(\d{1,2})[\/.](\d{1,2})[\/.](\d{2,4})/);
    if (!m) return null;
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    return new Date(y, m[2] - 1, m[1]).getTime();
  }
  // טבלת הציונים: לפי כותרות העמודות "מקצוע" ו"ציון"
  function readGrades() {
    const heads = [...document.querySelectorAll("th, mat-header-cell, [role=columnheader]")];
    const gH = heads.find((h) => /^ציון$/.test(h.textContent.trim()));
    const sH = heads.find((h) => /מקצוע/.test(h.textContent));
    if (!gH || !sH || gH.parentElement !== sH.parentElement) return null;
    const headRow = gH.parentElement;
    const cols = [...headRow.children];
    const gi = cols.indexOf(gH), si = cols.indexOf(sH);
    const di = cols.findIndex((c) => /תאריך/.test(c.textContent));
    const table = headRow.closest("table, mat-table, [role=table], [role=grid]") || headRow.parentElement;
    const rows = [...table.querySelectorAll("tr, mat-row, [role=row]")].filter(
      (r) => r !== headRow && r.children.length === cols.length
    );
    const data = rows
      .map((r, i) => {
        const c = [...r.children];
        return {
          subj: origText(c[si]).trim(),
          g: parseFloat(c[gi].textContent.trim()),
          date: di >= 0 ? parseDate(c[di].textContent) : null,
          i,
        };
      })
      .filter((x) => x.subj && !isNaN(x.g) && x.g >= 0 && x.g <= 100);
    return { table, data };
  }
  const mean = (a) => a.reduce((s, x) => s + x.g, 0) / a.length;
  function trend(list) {
    // הממוצע עכשיו לעומת הממוצע בלי הציון האחרון
    if (list.length < 2) return { v: mean(list), arrow: "" };
    const sorted = list[0].date !== null
      ? [...list].sort((a, b) => a.date - b.date)
      : [...list].sort((a, b) => b.i - a.i); // בלי תאריכים: מניחים שהחדש למעלה
    const now = mean(sorted), before = mean(sorted.slice(0, -1));
    const d = now - before;
    return { v: now, arrow: d > 0.05 ? "▲" : d < -0.05 ? "▼" : "•", d };
  }
  let avgSig = "";
  function renderAverage() {
    const old = document.getElementById("mp-avg");
    if (!settings.avg) { if (old) old.remove(); avgSig = ""; return; }
    const r = readGrades();
    if (!r || r.data.length < 1) { if (old) old.remove(); avgSig = ""; return; }
    const sig = JSON.stringify(r.data.map((x) => [x.subj, x.g, x.date]));
    if (old && sig === avgSig && old.nextElementSibling === r.table) return;
    avgSig = sig;
    const bySubj = new Map();
    r.data.forEach((x) => { if (!bySubj.has(x.subj)) bySubj.set(x.subj, []); bySubj.get(x.subj).push(x); });
    const box = old || document.createElement("div");
    box.id = "mp-avg";
    box.textContent = "";
    const fmt = (t) => {
      const span = document.createElement("span");
      span.className = "mp-avg-n";
      const n = document.createElement("b");
      n.textContent = t.v.toFixed(1);
      span.append(n);
      if (t.arrow) {
        const a = document.createElement("i");
        a.className = t.arrow === "▲" ? "up" : t.arrow === "▼" ? "down" : "same";
        a.textContent = t.arrow;
        a.title = t.d ? (t.d > 0 ? "+" : "") + t.d.toFixed(1) + " מאז הציון האחרון" : "";
        span.append(a);
      }
      return span;
    };
    const head = document.createElement("div");
    head.className = "mp-avg-head";
    const hl = document.createElement("span");
    hl.textContent = "📊 ממוצע כללי";
    head.append(hl, fmt(trend(r.data)));
    const chips = document.createElement("div");
    chips.className = "mp-avg-chips";
    [...bySubj].sort((a, b) => a[0].localeCompare(b[0], "he")).forEach(([subj, list]) => {
      const c = document.createElement("div");
      c.className = "mp-avg-chip";
      const nm = document.createElement("span");
      nm.textContent = subj + (list.length > 1 ? ` (${list.length})` : "");
      c.append(nm, fmt(trend(list)));
      chips.append(c);
    });
    box.append(head, chips);
    if (box.parentElement !== r.table.parentElement || box.nextElementSibling !== r.table) {
      r.table.parentElement.insertBefore(box, r.table);
    }
  }

  /* ---------- ערכות נושא ---------- */
  function applyThemeFx() {
    const root = document.documentElement;
    ["space", "neon", "winter"].forEach((t) => root.classList.toggle("mp-theme-" + t, settings.theme === t));
    let fx = document.getElementById("mp-fx");
    if (settings.theme !== "space" && settings.theme !== "winter") { if (fx) fx.remove(); return; }
    if (fx && fx.dataset.t === settings.theme) return;
    if (fx) fx.remove();
    fx = document.createElement("div");
    fx.id = "mp-fx";
    fx.dataset.t = settings.theme;
    const n = settings.theme === "winter" ? 28 : 60;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("span");
      p.textContent = settings.theme === "winter" ? "❄" : "";
      p.style.left = (Math.random() * 100).toFixed(1) + "%";
      p.style.top = settings.theme === "space" ? (Math.random() * 100).toFixed(1) + "%" : "-5%";
      p.style.animationDelay = (-Math.random() * 12).toFixed(1) + "s";
      p.style.animationDuration = (settings.theme === "winter" ? 8 + Math.random() * 8 : 2 + Math.random() * 4).toFixed(1) + "s";
      p.style.fontSize = (8 + Math.random() * 10).toFixed(0) + "px";
      fx.append(p);
    }
    root.append(fx);
  }


  /* ---------- קטגוריות ---------- */
  const CATEGORIES = [
    ["📚 לימודים", /ציון|מבחן|בחינ|שיעורי|מערכת|מקצוע|תעודה|מתכונת|בגרות|חומר|משימ|עבודות/],
    ["🕒 נוכחות והתנהגות", /נוכחות|היעדר|איחור|התנהגות|אירוע|אישור|חיסור/],
    ["✉️ תקשורת", /דואר|הודעות|הודעה|מודעות|פגישה|פגישות|קשר|סקר|משוב/],
    ["👤 פרטים וניהול", /פרטי|פרופיל|תלמיד|טפס|תשלום|הגדרות|סיסמ|חשבון/],
  ];
  const OTHER = "📌 אחר";
  const IGNORE = /^(התנתק|עזרה|התראות|תפריט ראשי|עברית|English|العربية|Українська|Русский|דילוג.*)/;

  // הדברים הכי חשובים, לפי הסדר
  const ESSENTIALS = [
    ["📊", /ציון/],
    ["⚠️", /התנהגות|אירוע/],
    ["📝", /שיעורי/],
    ["✉️", /דואר/],
  ];

  const categoryOf = (text) => {
    for (const [name, re] of CATEGORIES) if (re.test(text)) return name;
    return OTHER;
  };

  /* ---------- איסוף פריטי התפריט ---------- */
  let items = []; // {text, el}

  function scan() {
    const roots = document.querySelectorAll(
      "mat-sidenav, mat-drawer, mat-nav-list, nav, [role=navigation], [role=menu], mat-list"
    );
    const seen = new Map();
    roots.forEach((root) => {
      if (root.closest("#mp-panel")) return;
      root
        .querySelectorAll("a, mat-list-item, [role=menuitem], [routerlink], button")
        .forEach((el) => {
          if (el.closest("#mp-panel") || el.closest("mat-toolbar, header")) return;
          const text = (el.getAttribute("aria-label") || origText(el) || "")
            .replace(/\s+/g, " ").trim();
          if (!text || text.length > 40 || IGNORE.test(text) || seen.has(text)) return;
          seen.set(text, el);
        });
    });
    items = [...seen].map(([text, el]) => ({ text, el }));
    return items.length;
  }

  let triedOpen = false;
  function ensureMenuRendered() {
    if (triedOpen || scan() > 0) return;
    const btn = document.querySelector('button[aria-label="תפריט ראשי"]');
    if (!btn) return;
    triedOpen = true;
    btn.click();
    setTimeout(() => {
      scan();
      btn.click();
      render();
    }, 700);
  }

  /* ---------- ממשק ---------- */
  let fab, panel, search, list, tabEss, tabAll, tabSet;
  let tab = ls.get("mp-tab") === "all" ? "all" : "ess";

  function build() {
    if (fab || !document.body) return;
    fab = document.createElement("button");
    fab.id = "mp-fab";
    fab.title = "ניווט מהיר (Alt+M)";
    fab.textContent = "☰";

    panel = document.createElement("div");
    panel.id = "mp-panel";

    const tabs = document.createElement("div");
    tabs.id = "mp-tabs";
    tabEss = document.createElement("button");
    tabEss.textContent = "⭐ גישה מהירה";
    tabAll = document.createElement("button");
    tabAll.textContent = "הכל";
    tabs.append(tabEss, tabAll);
    // טאב הגדרות בתוך הדף: רק כשאין מסך הגדרות חיצוני (אייפון / Safari)
    if (window.__MP_INPAGE_SETTINGS) {
      tabSet = document.createElement("button");
      tabSet.textContent = "⚙️";
      tabSet.style.flex = "0 0 44px";
      tabSet.addEventListener("click", () => { tab = "set"; ls.set("mp-tab", tab); render(); });
      tabs.append(tabSet);
    }

    search = document.createElement("input");
    search.id = "mp-search";
    search.placeholder = "חיפוש בתפריט…";
    list = document.createElement("div");
    panel.append(tabs, search, list);
    document.documentElement.append(fab, panel); // מחוץ ל-body, כדי שלא יסונן

    fab.addEventListener("click", () => toggle());
    tabEss.addEventListener("click", () => { tab = "ess"; ls.set("mp-tab", tab); render(); });
    tabAll.addEventListener("click", () => { tab = "all"; ls.set("mp-tab", tab); render(); });
    search.addEventListener("input", render);
    search.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const first = list.querySelector(".mp-item");
        if (first) first.click();
      }
      if (e.key === "Escape") toggle(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.altKey && e.key.toLowerCase() === "m") { e.preventDefault(); toggle(undefined, true); }
    });
  }

  function toggle(force, viaKey) {
    const open = typeof force === "boolean" ? force : !panel.classList.contains("open");
    panel.classList.toggle("open", open);
    ls.set("mp-open", open ? "1" : "0");
    if (open) {
      ensureMenuRendered();
      scan();
      render();
      if (viaKey) search.focus(); // מקלדת רק כשפותחים מהמקלדת (Alt+M), לא בנגיעה
    }
  }

  /* ---------- Essentials לפי בחירת המשתמש ---------- */
  function essEntries() {
    return String(settings.essList || "")
      .split("\n").map((l) => l.trim()).filter(Boolean)
      .map((l) => {
        const sp = l.indexOf(" ");
        const first = sp > 0 ? l.slice(0, sp) : "";
        // אם המילה הראשונה היא אייקון (בלי אותיות), היא האייקון
        return first && !/[\p{L}\p{N}]/u.test(first)
          ? { icon: first, name: l.slice(sp + 1).trim() }
          : { icon: "⭐", name: l };
      });
  }
  function findItem(name) {
    return items.find((i) => i.text === name) || items.find((i) => i.text.includes(name));
  }
  const isEss = (text) => essEntries().some((e) => e.name === text);
  function saveEss(entries) {
    const text = entries.map((e) => e.icon + " " + e.name).join("\n");
    settings.essList = text;
    try { chrome.storage.local.set({ essList: text }); } catch (e) {}
    render();
  }
  function toggleEss(text) {
    const list = essEntries();
    const i = list.findIndex((e) => e.name === text);
    if (i >= 0) list.splice(i, 1); else list.push({ icon: "⭐", name: text });
    saveEss(list);
  }
  function moveEss(idx, d) {
    const list = essEntries(), j = idx + d;
    if (j < 0 || j >= list.length) return;
    [list[idx], list[j]] = [list[j], list[idx]];
    saveEss(list);
  }
  let essEdit = false;

  function itemButton(i, big, icon, withStar) {
    const b = document.createElement("button");
    b.className = "mp-item" + (big ? " mp-big" : "");
    b.textContent = (icon ? icon + "  " : "") + funnify(i.text);
    b.addEventListener("click", () => {
      i.el.click();
      toggle(false);
    });
    if (!withStar) return b;
    const row = document.createElement("div");
    row.className = "mp-row";
    const star = document.createElement("button");
    star.className = "mp-star" + (isEss(i.text) ? " on" : "");
    star.textContent = isEss(i.text) ? "★" : "☆";
    star.title = isEss(i.text) ? "הסר מגישה מהירה" : "הוסף לגישה מהירה";
    star.addEventListener("click", (e) => { e.stopPropagation(); toggleEss(i.text); });
    row.append(b, star);
    return row;
  }

  /* ---------- הגדרות בתוך הדף (אייפון) ---------- */
  function renderSettings() {
    const save = (patch) => {
      Object.assign(settings, patch);
      try { chrome.storage.local.set(patch); } catch (e) {}
      applyTheme();
    };
    const row = (label, ctl) => {
      const r = document.createElement("label");
      r.className = "mp-set-row";
      const t = document.createElement("span");
      t.textContent = label;
      r.append(t, ctl);
      list.append(r);
    };
    const check = (key) => {
      const c = document.createElement("input");
      c.type = "checkbox";
      c.checked = key === "dark" ? settings.dark !== "off" : !!settings[key];
      c.addEventListener("change", () => save({ [key]: key === "dark" ? (c.checked ? "on" : "off") : c.checked }));
      return c;
    };
    const select = (opts, val, fn) => {
      const sel = document.createElement("select");
      opts.forEach(([v, n]) => { const o = document.createElement("option"); o.value = v; o.textContent = n; sel.append(o); });
      sel.value = val;
      sel.addEventListener("change", () => fn(sel.value));
      return sel;
    };
    row("🌙 מצב כהה", check("dark"));
    const TA = { space: "#7c4dff", neon: "#ff2bd6", winter: "#4fc3f7" };
    row("🎨 ערכת נושא", select([["none", "ללא"], ["space", "🌌 חלל"], ["neon", "💜 ניאון"], ["winter", "❄️ חורף"]], settings.theme,
      (v) => save(TA[v] ? { theme: v, accent: TA[v] } : { theme: v })));
    const col = document.createElement("input");
    col.type = "color"; col.value = settings.accent;
    col.addEventListener("input", () => save({ accent: col.value }));
    row("צבע אקסנט", col);
    row("📊 ממוצע ציונים", check("avg"));
    row("🙈 אל תראה לי", check("hideGrades"));
    row("✨ זוהר לציונים מעל 85", check("glow"));
    row("😂 שמות מצחיקים", check("funny"));
    const cur = Object.entries(MP_PACKS).find(([, p]) => p.text === settings.funnyList);
    row("חבילת שמות", select(
      [...Object.entries(MP_PACKS).map(([k, p]) => [k, p.name]), ...(cur ? [] : [["custom", "מותאם אישית"]])],
      cur ? cur[0] : "custom",
      (v) => { if (MP_PACKS[v]) { save({ funnyList: MP_PACKS[v].text }); render(); } }));
  }

  function render() {
    if (!list) return;
    tabEss.classList.toggle("on", tab === "ess");
    tabAll.classList.toggle("on", tab === "all");
    if (tabSet) tabSet.classList.toggle("on", tab === "set");
    search.style.display = tab === "set" ? "none" : "";
    const q = search.value.trim();
    list.textContent = "";
    if (tab === "set") { if (tabSet) renderSettings(); else tab = "ess"; if (tabSet) return; }

    const empty = (msg) => {
      const d = document.createElement("div");
      d.className = "mp-empty";
      d.textContent = msg;
      list.append(d);
    };
    if (!items.length) {
      return empty("לא נמצאו פריטי תפריט. התחבר/י ופתח/י את התפריט הראשי.");
    }

    // Essentials: הפריטים שהמשתמש בחר, בלי חיפוש
    if (tab === "ess" && !q) {
      const ents = essEntries();
      ents.forEach((e, idx) => {
        const it = findItem(e.name);
        if (!essEdit) {
          if (it) list.append(itemButton(it, true, e.icon));
          return;
        }
        const row = document.createElement("div");
        row.className = "mp-edit";
        const ic = document.createElement("input");
        ic.className = "mp-icon"; ic.value = e.icon; ic.maxLength = 4; ic.title = "אייקון";
        ic.addEventListener("change", () => {
          const l = essEntries(); l[idx].icon = ic.value.trim() || "⭐"; saveEss(l);
        });
        const name = document.createElement("span");
        name.textContent = it ? funnify(it.text) : e.name + " (לא נמצא)";
        const mk = (t, title, fn) => {
          const b = document.createElement("button");
          b.textContent = t; b.title = title; b.addEventListener("click", fn); return b;
        };
        row.append(ic, name,
          mk("▲", "למעלה", () => moveEss(idx, -1)),
          mk("▼", "למטה", () => moveEss(idx, 1)),
          mk("✕", "הסרה", () => { const l = essEntries(); l.splice(idx, 1); saveEss(l); }));
        list.append(row);
      });
      if (!ents.length) empty("אין פריטים. לחצו על ☆ ליד פריט בטאב \"הכל\" כדי להוסיף.");
      const tools = document.createElement("div");
      tools.className = "mp-tools";
      const ed = document.createElement("button");
      ed.textContent = essEdit ? "✓ סיום" : "✏️ עריכה";
      ed.addEventListener("click", () => { essEdit = !essEdit; render(); });
      tools.append(ed);
      if (essEdit) {
        const rs = document.createElement("button");
        rs.textContent = "↩︎ ברירת מחדל";
        rs.addEventListener("click", () => {
          settings.essList = DEFAULTS.essList;
          try { chrome.storage.local.remove("essList"); } catch (e) {}
          render();
        });
        tools.append(rs);
      }
      list.append(tools);
      return;
    }

    // הכל (או תוצאות חיפוש) מחולק לקטגוריות
    const groups = new Map();
    items
      .filter((i) => !q || i.text.includes(q) || funnify(i.text).includes(q))
      .forEach((i) => {
        const c = categoryOf(i.text);
        if (!groups.has(c)) groups.set(c, []);
        groups.get(c).push(i);
      });
    if (!groups.size) return empty("לא נמצאו תוצאות");
    [...CATEGORIES.map((c) => c[0]), OTHER]
      .filter((c) => groups.has(c))
      .forEach((c) => {
        const det = document.createElement("details");
        det.open = true;
        const sum = document.createElement("summary");
        sum.textContent = c;
        det.append(sum);
        groups.get(c).forEach((i) => det.append(itemButton(i, false, "", true)));
        list.append(det);
      });
  }

  document.addEventListener("focusin", (e) => {
    const t = e.target;
    if (!t || !/^(INPUT|TEXTAREA)$/.test(t.tagName)) return;
    setTimeout(() => { try { t.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (x) {} }, 350);
  });

  /* ---------- אתחול ---------- */
  let observer, timer;
  function onMutate() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (settings.nav && !fab && document.body) build();
      try { scan(); } catch (e) {}
      try { applyFunny(); } catch (e) {}
      try { checkMail(); } catch (e) {}
      markGrades();
      tintPrimary();
    }, 300);
  }

  function start() {
    if (settings.nav) {
      build();
      if (ls.get("mp-open") === "1") setTimeout(() => toggle(true), 1200);
    } else if (fab) { fab.remove(); panel.remove(); fab = panel = null; }
    scan();
    markGrades();
    tintPrimary();
    if (!observer && document.body) {
      observer = new MutationObserver(onMutate);
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  // החלה מיידית (לפני שהעמוד נצבע), ומעקב מהיר אחרי הופעת הסרגל
  applyTheme();
  new MutationObserver(() => applyBase()).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style"],
  });
  let raf = 0;
  new MutationObserver(() => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      try { applyFunny(); } catch (e) {}
      tintPrimary(false);
    });
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  chrome.storage.local.get(DEFAULTS, (s) => {
    settings = { ...DEFAULTS, ...s };
    ls.set("mp-settings", JSON.stringify(settings));
    applyTheme();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start);
    } else start();
  });

  // גיבוי: בדיקה תקופתית של ההגדרות, וזיהוי של תוסף שעודכן בזמן שהעמוד פתוח
  function resync() {
    if (!chrome.runtime || !chrome.runtime.id) {
      if (!document.getElementById("mp-stale")) {
        const n = document.createElement("div");
        n.id = "mp-stale";
        n.textContent = "התוסף עודכן. רענן/י את העמוד (F5) כדי שהשינויים יופיעו";
        n.style.cssText =
          "position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:2147483647;" +
          "background:#333;color:#fff;padding:8px 14px;border-radius:8px;font:14px Arial;direction:rtl";
        document.documentElement.append(n);
      }
      return;
    }
    applyBase();
    try { applyFunny(); } catch (e) {}
    try { checkMail(); } catch (e) {}
    if (settings.useAccent && primaryBg && document.body) revalidateTint();
    if (settings.useAccent && document.body && !document.querySelector(".mp-tint")) {
      tintPrimary(true);
    }
    chrome.storage.local.get(DEFAULTS, (s) => {
      if (chrome.runtime.lastError) return;
      const next = { ...DEFAULTS, ...s };
      if (JSON.stringify(next) === JSON.stringify(settings)) return;
      const navChanged = next.nav !== settings.nav;
      settings = next;
      ls.set("mp-settings", JSON.stringify(settings));
      applyTheme();
      if (navChanged) start();
    });
  }
  setInterval(resync, 1000);
  window.addEventListener("focus", resync);
  // אחרי לחיצה (מעבר בין עמודים, פתיחה וסגירה של קבוצה בתפריט) בודקים מחדש מי הפריט הפעיל
  document.addEventListener("click", () => {
    setTimeout(() => tintPrimary(true), 250);
    setTimeout(() => tintPrimary(true), 900);
  }, true);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    for (const k in changes) {
      settings[k] = changes[k].newValue !== undefined ? changes[k].newValue : DEFAULTS[k];
    }
    ls.set("mp-settings", JSON.stringify(settings));
    applyTheme();
    if ("essList" in changes || "funnyList" in changes) render();
    if ("nav" in changes) start();
  });
})();

  }
  (function boot() {
    if (!document.documentElement) { setTimeout(boot, 5); return; }
    main();
  })();
})();
