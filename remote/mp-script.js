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
const MP_DEFAULTS = {
  dark: "on",          // "auto" | "on" | "off"
  nav: true,
  accent: "#4da3ff",
  useAccent: true,
  glow: true,
  glowMin: 85,
  funny: true,
  funnyList: MP_FUNNY_TEXT,
  notify: true,          // התראה על הודעות חדשות
  essList: MP_ESS_TEXT,  // כל שורה: אייקון ואז שם הפריט המקורי בתפריט
};

    var st = document.createElement("style");
    st.textContent = "/* =====================================================================\n   מצב כהה\n   הפילטר (invert + hue-rotate) לא מסוגל להציג צבעים רוויים, לכן אלמנטים\n   שצבועים באקסנט (.mp-tint) נשארים מחוץ לפילטר, והפילטר מוחל רק על\n   האזורים שסביבם. אם אין אלמנט כזה, הפילטר מוחל על כל ה-body.\n   ===================================================================== */\nhtml.mp-dark { background: #1a1a1a; color-scheme: dark; }\n\nhtml.mp-dark body:not(:has(.mp-tint)) {\n  background: #fff;\n  filter: invert(0.9) hue-rotate(180deg);\n}\nhtml.mp-dark body:has(.mp-tint) {\n  background: #1a1a1a !important;\n  color: #e5e5e5;\n}\n/* אבות של אלמנט האקסנט: רקע כהה ישיר, בלי פילטר */\nhtml.mp-dark :has(.mp-tint):not(.mp-tint):not(html):not(body) {\n  background-color: #1a1a1a !important;\n  color: #e5e5e5;\n}\n/* האזורים שסביב: מסוננים בנפרד */\nhtml.mp-dark :has(.mp-tint) > :not(:has(.mp-tint)):not(.mp-tint):not(#mp-fab):not(#mp-panel):not(body) {\n  filter: invert(0.9) hue-rotate(180deg);\n}\n\n/* תמונות ווידאו חוזרים לצבעים רגילים (רק בתוך אזורים מסוננים) */\nhtml.mp-dark body:not(:has(.mp-tint)) :is(img, video, canvas, picture, iframe, [style*=\"background-image\"]),\nhtml.mp-dark :has(.mp-tint) > :not(:has(.mp-tint)):not(.mp-tint):not(#mp-fab):not(#mp-panel):not(body) :is(img, video, canvas, picture, iframe, [style*=\"background-image\"]) {\n  filter: invert(1) hue-rotate(180deg);\n}\n\n/* =====================================================================\n   אקסנט\n   --mp-accent        = הצבע המדויק (לאלמנטים שמחוץ לפילטר)\n   --mp-accent-f      = הצבע אחרי תיקון לפילטר (לקישורים וטאבים)\n   ===================================================================== */\nhtml.mp-accent .mp-tint {\n  background-color: var(--mp-accent) !important;\n  color: var(--mp-on-accent) !important;\n}\nhtml.mp-accent .mp-tint * {\n  color: var(--mp-on-accent) !important;\n}\n\nhtml.mp-accent a:not(.mp-item),\nhtml.mp-accent .mat-tab-label-active,\nhtml.mp-accent .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label {\n  color: var(--mp-accent-f) !important;\n}\nhtml.mp-accent .mat-ink-bar,\nhtml.mp-accent .mdc-tab-indicator__content--underline {\n  background-color: var(--mp-accent-f) !important;\n  border-color: var(--mp-accent-f) !important;\n}\n\n/* =====================================================================\n   ציונים מעל הסף: זוהר\n   ===================================================================== */\n.mp-glow {\n  color: var(--mp-glow, #ffb300) !important;\n  font-weight: 700 !important;\n  text-shadow: 0 0 6px var(--mp-glow, #ffb300), 0 0 14px var(--mp-glow, #ffb300);\n  animation: mp-pulse 2.2s ease-in-out infinite;\n}\n@keyframes mp-pulse {\n  50% {\n    text-shadow: 0 0 12px var(--mp-glow, #ffb300), 0 0 28px var(--mp-glow, #ffb300);\n  }\n}\n\n/* =====================================================================\n   ניווט מהיר (נמצא מחוץ ל-body ולכן אף פעם לא מסונן)\n   ===================================================================== */\n#mp-fab {\n  position: fixed; left: 16px; bottom: 16px; z-index: 2147483000;\n  width: 48px; height: 48px; border-radius: 50%; border: 0; cursor: pointer;\n  background: var(--mp-accent, #1565c0); color: var(--mp-on-accent, #fff); font-size: 22px;\n  box-shadow: 0 2px 8px rgba(0,0,0,.35);\n}\n#mp-panel {\n  position: fixed; left: 16px; bottom: 72px; z-index: 2147483000;\n  width: 300px; max-height: 70vh; overflow: auto; direction: rtl;\n  background: #fff; color: #222; border-radius: 12px; padding: 10px;\n  border: 1px solid #999;\n  box-shadow: 0 4px 18px rgba(0,0,0,.35); font: 14px/1.4 Arial, sans-serif;\n  display: none;\n}\n#mp-panel.open { display: block; }\n#mp-tabs { display: flex; gap: 6px; margin-bottom: 8px; }\n#mp-tabs button {\n  flex: 1; padding: 7px; border: 1px solid #bbb; border-radius: 8px; cursor: pointer;\n  background: #f3f6fb; color: #222; font: inherit; font-weight: bold;\n}\n#mp-tabs button.on {\n  background: var(--mp-accent, #1565c0); color: var(--mp-on-accent, #fff);\n  border-color: transparent;\n}\n#mp-search {\n  width: 100%; box-sizing: border-box; padding: 8px 10px; margin-bottom: 8px;\n  border: 1px solid #bbb; border-radius: 8px; font-size: 14px;\n  background: #fff; color: #222;\n}\n#mp-panel details { margin-bottom: 4px; border-radius: 8px; background: #f3f6fb; }\n#mp-panel summary { cursor: pointer; padding: 8px 10px; font-weight: bold; }\n#mp-panel .mp-item {\n  display: block; width: 100%; text-align: right; box-sizing: border-box;\n  padding: 7px 18px; border: 0; background: transparent; cursor: pointer;\n  font: inherit; color: #0d47a1;\n}\n#mp-panel .mp-item:hover { background: #dce8f8; }\n#mp-panel .mp-big {\n  padding: 12px 14px; margin-bottom: 6px; border-radius: 10px; font-size: 16px;\n  font-weight: bold; background: #f3f6fb; border: 1px solid #d5deec;\n}\n#mp-panel .mp-empty { padding: 8px; color: #666; }\n\n/* החלונית במצב כהה */\nhtml.mp-dark #mp-panel { background: #262626; color: #eee; border-color: #555; }\nhtml.mp-dark #mp-tabs button { background: #333; color: #eee; border-color: #555; }\nhtml.mp-dark #mp-tabs button.on { background: var(--mp-accent); color: var(--mp-on-accent); }\nhtml.mp-dark #mp-search { background: #1a1a1a; color: #eee; border-color: #555; }\nhtml.mp-dark #mp-panel details { background: #303030; }\nhtml.mp-dark #mp-panel .mp-item { color: #9ec5ff; }\nhtml.mp-dark #mp-panel .mp-item:hover { background: #3a3a3a; }\nhtml.mp-dark #mp-panel .mp-big { background: #303030; border-color: #444; }\nhtml.mp-dark #mp-panel .mp-empty { color: #aaa; }\n\n/* Essentials: כוכבים ועריכה */\n#mp-panel .mp-row { display: flex; align-items: center; }\n#mp-panel .mp-row .mp-item { flex: 1; }\n#mp-panel .mp-star { border: 0; background: transparent; cursor: pointer; font-size: 18px; padding: 4px 10px; color: #999; }\n#mp-panel .mp-star.on { color: #f5b301; }\n#mp-panel .mp-edit { display: flex; align-items: center; gap: 6px; padding: 6px; margin-bottom: 6px; border-radius: 10px; background: #f3f6fb; }\n#mp-panel .mp-edit span { flex: 1; font-weight: bold; }\n#mp-panel .mp-edit .mp-icon { width: 42px; text-align: center; font-size: 16px; padding: 4px; border: 1px solid #bbb; border-radius: 6px; }\n#mp-panel .mp-edit button, #mp-panel .mp-tools button { border: 1px solid #bbb; background: #fff; border-radius: 6px; cursor: pointer; padding: 4px 8px; font: inherit; color: inherit; }\n#mp-panel .mp-tools { display: flex; gap: 6px; margin-top: 4px; }\n#mp-panel .mp-tools button { flex: 1; padding: 7px; }\nhtml.mp-dark #mp-panel .mp-edit { background: #303030; }\nhtml.mp-dark #mp-panel .mp-edit .mp-icon, html.mp-dark #mp-panel .mp-edit button, html.mp-dark #mp-panel .mp-tools button { background: #1a1a1a; color: #eee; border-color: #555; }\n";
    document.documentElement.appendChild(st);
(() => {
  const DEFAULTS = MP_DEFAULTS;
  let settings = { ...DEFAULTS };
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
      .filter((p) => p.length === 2 && p[0] && p[1]);
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

  /* ---------- זוהר לציונים ---------- */
  const GRADE_PATH = /grade|mark|score|ציון/i;
  function markGrades() {
    document.querySelectorAll(".mp-glow").forEach((e) => {
      if (!settings.glow) e.classList.remove("mp-glow");
    });
    if (!settings.glow || !document.body) return;
    const pathOk = GRADE_PATH.test(decodeURIComponent(location.pathname));
    document
      .querySelectorAll(
        "mat-cell, td, span, div, p, b, strong, mat-chip, [class*=grade], [class*=mark], [class*=score]"
      )
      .forEach((el) => {
        if (el.children.length || el.closest("#mp-panel")) return;
        const t = el.textContent.trim();
        if (!/^\d{2,3}(\.\d+)?$/.test(t)) return;
        const v = parseFloat(t);
        const ok = v >= settings.glowMin && v <= 100;
        const inGradeCtx =
          pathOk || el.closest("[class*=grade],[class*=mark],[class*=score]");
        el.classList.toggle("mp-glow", ok && !!inGradeCtx);
      });
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
  let fab, panel, search, list, tabEss, tabAll;
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
      if (e.altKey && e.key.toLowerCase() === "m") { e.preventDefault(); toggle(); }
    });
  }

  function toggle(force) {
    const open = typeof force === "boolean" ? force : !panel.classList.contains("open");
    panel.classList.toggle("open", open);
    ls.set("mp-open", open ? "1" : "0");
    if (open) {
      ensureMenuRendered();
      scan();
      render();
      search.focus();
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

  function render() {
    if (!list) return;
    tabEss.classList.toggle("on", tab === "ess");
    tabAll.classList.toggle("on", tab === "all");
    const q = search.value.trim();
    list.textContent = "";

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
