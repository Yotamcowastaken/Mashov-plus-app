import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Dimensions,
  Keyboard,
  Linking,
  BackHandler,
  Modal,
  Platform,
  Share,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import MashovListener from "./modules/mashov-listener";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { SCRIPT, DEFAULTS, FUNNY_TEXT, ESS_TEXT, PACKS } from "./mp";
import BUILD_INFO from "./build-info.json";

const STORE_KEY = "mp-store";
const CRED_KEY = "mp-login";

// סקריפט הכניסה האוטומטית: רץ רק בעמודי ההתחברות של משוב ומשרד החינוך
function loginScript(c) {
  return `(function () {
  var C = ${JSON.stringify(c)};
  var host = location.hostname;
  if (host !== "web.mashov.info" && host !== "lgn.edu.gov.il") return;
  function setVal(el, v) {
    var proto = Object.getPrototypeOf(el);
    var d = Object.getOwnPropertyDescriptor(proto, "value");
    if (d && d.set) d.set.call(el, v); else el.value = v;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
  }
  // רץ פעם אחת בכל דף (גם אם מזריקים שוב אחרי מעבר בתוך האתר)
  if (window.__mpLoginRunning) return;
  window.__mpLoginRunning = true;
  var stopped = false;
  function done() { window.__mpLoginRunning = false; }
  function post(o) { try { window.ReactNativeWebView.postMessage(JSON.stringify(o)); } catch (e) {} }
  // המשתמש נגע במסך או הקליד: עוצרים מיד ונותנים לו להתחבר ידנית (והאפליקציה לא תנסה שוב 10 דקות)
  function onUser(e) {
    if (!e.isTrusted || stopped || !window.__mpLoginRunning) return;
    if (host === "web.mashov.info" && !/login/i.test(location.pathname)) return; // נגיעה בדשבורד לא קשורה לכניסה
    stopped = true; done(); post({ type: "mp-login-step", step: "user" });
  }
  ["touchstart", "mousedown", "keydown"].forEach(function (t) { document.addEventListener(t, onUser, true); });
  function vis(el) { return el && el.offsetParent !== null && el; }
  // מחכה שהאלמנט יופיע ויישאר אותו אלמנט בלי שינוי לזמן "stable" (האתר בונה את הדף בהדרגה)
  function waitStable(fn, ms, stable, cb, fail) {
    var t0 = Date.now(), last = null, since = 0;
    (function loop() {
      if (stopped) return;
      var r = fn();
      if (r && r === last) { if (Date.now() - since >= stable) return cb(r); }
      else { last = r; since = Date.now(); }
      if (Date.now() - t0 < ms) setTimeout(loop, 200); else if (fail) fail();
    })();
  }
  function later(ms, f) { setTimeout(function () { if (!stopped) f(); }, ms); }
  function byText(sel, re) {
    return [].slice.call(document.querySelectorAll(sel)).filter(function (b) {
      return vis(b) && re.test(b.textContent.trim());
    })[0];
  }
  // ממלא שדה, מחכה, ובודק שהאתר לא מחק את הערך (Angular מאפס לפעמים טופס שנטען מאוחר)
  function fill(id, v, cb) {
    var el = document.getElementById(id);
    if (!el) return cb(false);
    el.focus(); setVal(el, v);
    later(700, function () {
      var e2 = document.getElementById(id);
      if (e2 && e2.value !== v) { e2.focus(); setVal(e2, v); }
      cb(true);
    });
  }
  // אחרי הלחיצה: אם עדיין באותו דף אחרי 8 שניות, הכניסה לא עברה. מדווחים לאפליקציה מה רואים בדף
  function checkResult() {
    var href = location.href;
    setTimeout(function () {
      if (location.href !== href && !/login/i.test(location.href)) return;
      var err = [].slice.call(document.querySelectorAll("[class*=message], [class*=error], [role=alert], mat-error"))
        .filter(function (x) { return vis(x) && x.textContent.trim().length > 2; })
        .map(function (x) { return x.textContent.trim(); }).join(" | ").slice(0, 200);
      var captcha = [].slice.call(document.querySelectorAll("iframe[src*='recaptcha'][src*='bframe']")).some(function (f) {
        var r = f.getBoundingClientRect(), c = f.closest("div[style*='visibility']");
        return r.width > 100 && r.height > 100 && (!c || getComputedStyle(c).visibility !== "hidden");
      });
      post({ type: "mp-login-result", err: err, captcha: captcha });
      done();
    }, 8000);
  }
  function submit(b) {
    // מחכה שהכפתור יהיה פעיל (לא disabled) ורק אז לוחץ, פעם אחת בלבד
    waitStable(function () { return b && !b.disabled && !b.classList.contains("mat-button-disabled") && b; }, 6000, 300,
      function (x) { post({ type: "mp-login-step", step: "submit" }); x.click(); checkResult(); }, done);
  }
  if (host === "web.mashov.info") {
    // משוב מעביר להתחברות בתוך האתר, לפעמים אחרי שהדף כבר "נטען", אז מחכים לעמוד ההתחברות
    waitStable(function () { return /login/i.test(location.pathname) && (C.mode === "edu"
      ? vis(document.getElementById("mat-tab-group-0-label-1")) || byText("[role=tab]", /משרד החינוך/)
      : vis(document.getElementById("passwordInput"))); }, 20000, 1000, function (el) {
      if (C.mode === "edu") {
        el.click();
        waitStable(function () { return byText("button", /^הזדהות משרד החינוך$/); }, 8000, 600,
          function (b) { post({ type: "mp-login-step", step: "mashov" }); b.click(); later(8000, done); }, done); // רק מעבר לדף משרד החינוך, לא נשלחת סיסמה
        return;
      }
      var school = document.getElementById("schoolSelector");
      function rest() {
        later(800, function () {
          fill("usernameInput", C.user, function () {
            fill("passwordInput", C.pass, function () {
              later(500, function () { submit(document.getElementById("submitButton")); });
            });
          });
        });
      }
      if (school && C.school && !school.value) {
        school.focus(); setVal(school, C.school);
        // מחכה שרשימת בתי הספר תסתנן ותתייצב, ובוחר את בית הספר המתאים
        waitStable(function () {
          var opts = [].slice.call(document.querySelectorAll("mat-option")).filter(vis);
          return opts.filter(function (o) { return o.textContent.indexOf(C.school) >= 0; })[0] || (opts.length === 1 && opts[0]);
        }, 8000, 700, function (o) { o.click(); rest(); }, rest);
      } else rest();
    }, done);
  } else {
    // הזדהות אחידה של משרד החינוך
    if (C.mode !== "edu" || location.pathname.indexOf("/nidp/") < 0) return done();
    // שימו לב: הלשוניות (tab-1/tab-2) הן כפתורי submit, ולחיצה עליהן טוענת את הדף מחדש.
    // בדרך כלל tab-2 ("קוד משתמש וסיסמה") כבר פעילה והשדות מוצגים, אז ממלאים ישר.
    waitStable(function () { return vis(document.getElementById("password")); }, 6000, 800, function (p) {
      fill("userName", C.user, function () {
        fill("password", C.pass, function () {
          var f = p.closest("form");
          var b = f && [].slice.call(f.querySelectorAll("button, input[type=submit]")).filter(function (x) {
            return vis(x) && !/^tab-/.test(x.id);
          })[0];
          later(500, function () { if (b) submit(b); else done(); });
        });
      });
    }, function () {
      // השדות לא הופיעו. לא לוחצים על הלשוניות (הן טוענות את הדף מחדש), רק מדווחים
      post({ type: "mp-login-result", err: "לא נמצאו השדות של קוד משתמש וסיסמה בדף משרד החינוך" });
      done();
    });
  }
})(); true;`;
}
const SCRIPT_KEY = "mp-remote-script";
const REPO = "Yotamcowastaken/Mashov-plus-app";
const SCRIPT_URL = `https://raw.githubusercontent.com/${REPO}/main/remote/mp-script.js`;
const RELEASES_URL = `https://api.github.com/repos/${REPO}/releases/latest`;
const BUILD = (BUILD_INFO && BUILD_INFO.build) || 0;
const LITE = !!(BUILD_INFO && BUILD_INFO.variant === "lite");
const validScript = (t) => typeof t === "string" && t.length > 1000 && t.startsWith("(function () {") && t.includes("__mpBooted");

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
    shouldShowAlert: true,
  }),
});
const START_URL = "https://web.mashov.info/students/main/dashboard"; // אם לא מחוברים, משוב מעביר לבד להתחברות
const THEMES = [
  ["none", "ללא", null],
  ["space", "🌌 חלל", "#7c4dff"],
  ["neon", "💜 ניאון", "#ff2bd6"],
  ["winter", "❄️ חורף", "#4fc3f7"],
];
// רשימת המקורות הידועים (קבועה, אי אפשר לערוך אותה)
const parseFunny = (t) => {
  const m = new Map();
  String(t || "").split("\n").forEach((l) => {
    const p = l.split("=>");
    if (p.length === 2 && p[0].trim()) m.set(p[0].trim(), p[1].trim());
  });
  return m;
};
const KNOWN = (() => {
  const set = [];
  Object.values(PACKS).forEach((p) => parseFunny(p.text).forEach((_, k) => { if (!set.includes(k)) set.push(k); }));
  return set;
})();
const SWATCHES = ["#1d8fa8", "#e53935", "#8e24aa", "#43a047", "#fb8c00", "#3f51b5", "#00897b", "#f06292"];

// מחוץ לקומפוננטה, כדי ששדות טקסט לא יאבדו פוקוס בכל הקלדה
function Section({ open, onToggle, title, children }) {
  return (
    <View style={s.section}>
      <TouchableOpacity style={s.secHead} onPress={onToggle}>
        <Text style={s.secTitle}>{title}</Text>
        <Text style={s.secArrow}>{open ? "▾" : "◂"}</Text>
      </TouchableOpacity>
      {open ? <View style={{ paddingBottom: 10 }}>{children}</View> : null}
    </View>
  );
}

function Row({ label, children }) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      {children}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

function Main() {
  const insets = useSafeAreaInsets();
  const [store, setStore] = useState(null); // רק מה שהמשתמש שינה
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState("");
  const [listKey, setListKey] = useState(0);
  const [essKey, setEssKey] = useState(0);
  const [sec, setSec] = useState("look");
  const [draft, setDraft] = useState(null); // Map: מקור -> שם מצחיק (עד ששומרים)
  const [kb, setKb] = useState(0);
  const [cred, setCred] = useState(null); // { mode, user, pass, school, auto }
  const [credForm, setCredForm] = useState({ mode: "edu", user: "", pass: "", school: "" });
  const [credMsg, setCredMsg] = useState("");
  const flow = useRef({ at: 0, step: "" });
  const injects = useRef([]);
  const scrollRef = useRef(null);
  const [ioText, setIoText] = useState("");
  const [ioMsg, setIoMsg] = useState("");
  const web = useRef(null);
  const canGoBack = useRef(false);
  const urlsRef = useRef([]);

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("mail", {
            name: "הודעות חדשות", importance: Notifications.AndroidImportance.HIGH,
          });
        }
        await Notifications.requestPermissionsAsync();
      } catch (e) {}
    })();
  }, []);

  const [script, setScript] = useState(SCRIPT);
  const [scriptDate, setScriptDate] = useState("");
  const [newApk, setNewApk] = useState(null); // { build, url }
  const [updState, setUpdState] = useState("");
  const [hideBar, setHideBar] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(CRED_KEY).then((v) => {
      if (!v) return;
      try { const c = JSON.parse(v); setCred(c); setCredForm({ mode: c.mode, user: c.user, pass: "", school: c.school || "" }); } catch (e) {}
    }).catch(() => {});
    Promise.all([
      AsyncStorage.getItem(STORE_KEY).catch(() => null),
      AsyncStorage.getItem(SCRIPT_KEY).catch(() => null),
    ]).then(([v, sc]) => {
      try {
        const saved = sc ? JSON.parse(sc) : null;
        if (saved && validScript(saved.code)) { setScript(saved.code); setScriptDate(saved.date || ""); }
      } catch (e) {}
      try { setStore(v ? JSON.parse(v) : {}); } catch (e) { setStore({}); }
    });

    // 1. הקוד שרץ בדף משוב: הגרסה האחרונה מ-GitHub, נכנסת לתוקף בטעינה הבאה של הדף
    fetch(SCRIPT_URL + "?t=" + Date.now(), { cache: "no-store" })
      .then((r) => (r.ok ? r.text() : null))
      .then((code) => {
        if (!validScript(code)) return;
        AsyncStorage.getItem(SCRIPT_KEY).then((old) => {
          let prev = null;
          try { prev = old ? JSON.parse(old).code : null; } catch (e) {}
          if (prev === code) return;
          const date = new Date().toLocaleDateString("he-IL");
          AsyncStorage.setItem(SCRIPT_KEY, JSON.stringify({ code, date })).catch(() => {});
          setScript(code); setScriptDate(date);
        });
      })
      .catch(() => {});

    // 2. בדיקה אם יצאה גרסת APK חדשה
    if (BUILD > 0) {
      fetch(RELEASES_URL)
        .then((r) => (r.ok ? r.json() : null))
        .then((rel) => {
          const n = rel && parseInt(String(rel.tag_name || "").replace("build-", ""), 10);
          const asset = rel && (rel.assets || []).find((a) => a.name.endsWith(".apk") && a.name.includes("-lite-") === LITE);
          if (n > BUILD && asset) setNewApk({ build: n, url: asset.browser_download_url });
        })
        .catch(() => {});
    }
  }, []);

  const installUpdate = useCallback(() => {
    if (!newApk) return;
    if (!MashovListener || !MashovListener.installApk) { Linking.openURL(newApk.url); return; }
    try {
      const r = MashovListener.installApk(newApk.url);
      setUpdState(r === "need-permission"
        ? "אשרו \"התקנת אפליקציות לא ידועות\" למשוב פלוס, חזרו ולחצו שוב"
        : "מוריד... מסך ההתקנה ייפתח בסיום");
    } catch (e) { Linking.openURL(newApk.url); }
  }, [newApk]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (open) { setOpen(false); return true; }
      const st = urlsRef.current;
      const cur = st[st.length - 1] || "", prev = st[st.length - 2] || "";
      // חזרה לעמוד ההתחברות מנתקת מהחשבון: במקום זה, מעבירים את האפליקציה לרקע
      if (canGoBack.current && web.current && !/login/i.test(prev) && !/\/main\/dashboard/i.test(cur)) {
        web.current.goBack();
        st.pop();
        return true;
      }
      try { if (MashovListener && MashovListener.moveToBack) { MashovListener.moveToBack(); return true; } } catch (e) {}
      return false;
    });
    return () => sub.remove();
  }, [open]);

  // מקלדת: אם המסך לא מתכווץ לבד (edge-to-edge), מוסיפים ריווח בגובה המקלדת
  useEffect(() => {
    const full = Dimensions.get("window").height;
    const a = Keyboard.addListener("keyboardDidShow", (e) => {
      const shrunk = full - Dimensions.get("window").height > 50;
      setKb(shrunk ? 0 : e.endCoordinates.height);
    });
    const b = Keyboard.addListener("keyboardDidHide", () => setKb(0));
    return () => { a.remove(); b.remove(); };
  }, []);
  const focusScroll = (e) => {
    const h = e && e.target;
    setTimeout(() => {
      try { scrollRef.current && scrollRef.current.scrollResponderScrollNativeHandleToKeyboard(h, 140, true); } catch (x) {}
    }, 300);
  };

  const cfg = { ...DEFAULTS, listen: true, hideOrig: true, ...(store || {}) };

  // מאזין להתראות של אפליקציית משוב (קוד אנדרואיד מקורי)
  const [listenOk, setListenOk] = useState(false);
  const [postOk, setPostOk] = useState(true);
  const [log, setLog] = useState("");
  const listenRef = useRef(false);
  const checkListen = useCallback(() => {
    try {
      const ok = !!(MashovListener && MashovListener.isEnabled()); setListenOk(ok); listenRef.current = ok;
      if (MashovListener) { setPostOk(!!MashovListener.canPost()); setLog(MashovListener.getLog() || ""); }
    } catch (e) {}
  }, []);
  useEffect(() => {
    checkListen();
    const sub = AppState.addEventListener("change", (st) => { if (st === "active") checkListen(); });
    return () => sub.remove();
  }, [checkListen]);
  useEffect(() => {
    if (!MashovListener || store === null) return;
    try { MashovListener.setConfig(!!cfg.listen, !!cfg.hideOrig, !!cfg.funny, String(cfg.funnyList || "")); } catch (e) {}
  }, [store]);

  const storeRef = useRef(null);
  storeRef.current = store;
  const credRef = useRef(null);
  credRef.current = cred;
  // מזריק את סקריפט הכניסה. ניסיון אחד בלבד, ואז הפסקה של 10 דקות (גם כדי שאפשר יהיה להתחבר ידנית):
  // flow.step: "" -> "mashov" (נלחץ "הזדהות משרד החינוך") -> "submit" (נלחץ "כניסה") / "user" (המשתמש נגע במסך)
  const tryLogin = useCallback((delay, url) => {
    const c = credRef.current;
    if (!c || c.auto === false || !web.current) return;
    const now = Date.now();
    const f = flow.current;
    const fresh = !f.at || now - f.at > 600000;
    // בדף משרד החינוך ממשיכים רק את הניסיון שהתחיל עכשיו במשוב
    const midFlow = f.step === "mashov" && now - f.at < 90000;
    const ministry = /^https:\/\/lgn\.edu\.gov\.il\//i.test(url || "");
    // משרד החינוך קיבל את הפרטים, אבל משוב החזיר אותנו לדף ההתחברות
    if (!ministry && f.step === "submit" && now - f.at < 90000 && /login/i.test(url || "")) {
      flow.current = { at: now, step: "failed" };
      Alert.alert("הכניסה האוטומטית לא הצליחה", "הפרטים נשלחו, אבל משוב החזיר לדף ההתחברות.\n\nאפשר להתחבר ידנית. לא ננסה שוב ב-10 הדקות הקרובות.");
      return;
    }
    if (ministry ? !midFlow : !fresh) return;
    // מגן נוסף מלולאת טעינות: לכל היותר 4 הזרקות ב-10 דקות
    injects.current = injects.current.filter((t) => now - t < 600000);
    if (injects.current.length >= 4) return;
    injects.current.push(now);
    setTimeout(() => web.current && web.current.injectJavaScript(loginScript(c)), delay);
  }, []);
  // שינוי שהגיע מתוך הדף (כוכבים ועריכה ב-Essentials): שומרים בלי לשלוח בחזרה
  const onMessage = useCallback((ev) => {
    let m;
    try { m = JSON.parse(ev.nativeEvent.data); } catch (e) { return; }
    if (m.type === "mp-login-step") { flow.current = { at: Date.now(), step: String(m.step || "") }; return; }
    if (m.type === "mp-login-result") {
      flow.current = { at: Date.now(), step: "failed" };
      const why = m.captcha ? "האתר ביקש אימות \"אני לא רובוט\". צריך להשלים אותו ידנית."
        : m.err ? "האתר כתב: " + String(m.err).slice(0, 200) : "האתר לא העביר אותנו הלאה, בלי הודעת שגיאה.";
      Alert.alert("הכניסה האוטומטית לא הצליחה", why + "\n\nאפשר להתחבר ידנית. לא ננסה שוב ב-10 הדקות הקרובות.");
      return;
    }
    const next = { ...(storeRef.current || {}) };
    if (m.type === "mp-notify") {
      if (listenRef.current && (storeRef.current || {}).listen !== false) return;
      Notifications.scheduleNotificationAsync({
        content: { title: m.title, body: m.body },
        trigger: Platform.OS === "android" ? { channelId: "mail" } : null,
      }).catch(() => {});
      return;
    }
    if (m.type === "set") Object.assign(next, m.patch);
    else if (m.type === "remove") m.keys.forEach((k) => delete next[k]);
    else return;
    if (next.essList === ESS_TEXT) delete next.essList;
    setStore(next);
    setEssKey((k) => k + 1);
    AsyncStorage.setItem(STORE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const update = useCallback(
    (patch) => {
      const next = { ...(store || {}), ...patch };
      if (next.funnyList === FUNNY_TEXT) delete next.funnyList; // ברירת המחדל מתעדכנת לבד
      if (next.essList === ESS_TEXT) delete next.essList;
      setStore(next);
      AsyncStorage.setItem(STORE_KEY, JSON.stringify(next)).catch(() => {});
      if (web.current) web.current.injectJavaScript(`window.__mpApply && window.__mpApply(${JSON.stringify(next)}); true;`);
    },
    [store]
  );

  if (store === null) return <View style={s.root} />;

  const injected = `window.__MP_INITIAL = ${JSON.stringify(store)};\n${script}\ntrue;`;
  const top = insets.top || (Platform.OS === "android" ? RNStatusBar.currentHeight || 0 : 40);
  const bottom = insets.bottom;


  return (
    <View style={[s.root, { paddingTop: top, paddingBottom: open ? bottom : Math.max(bottom, kb) }]}>
      {newApk && !hideBar ? (
        <View style={s.updBar}>
          <TouchableOpacity style={{ flex: 1 }} onPress={installUpdate}>
            <Text style={s.updText}>{updState || `⬆️ גרסה חדשה זמינה (build ${newApk.build}). לחצו לעדכון`}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setHideBar(true)}><Text style={s.updX}>✕</Text></TouchableOpacity>
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
      <StatusBar style="light" backgroundColor="#1a1a1a" />
      <WebView
        ref={web}
        source={{ uri: START_URL }}
        style={s.web}
        injectedJavaScriptBeforeContentLoaded={injected}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        setSupportMultipleWindows={false}
        onMessage={onMessage}
        onLoadEnd={(e) => {
          const url = (e && e.nativeEvent && e.nativeEvent.url) || "";
          // גם בדשבורד: משוב עובר להתחברות בתוך האתר אחרי הטעינה, והסקריפט מחכה לזה
          if (/^https:\/\/(web\.mashov\.info|lgn\.edu\.gov\.il)\//i.test(url)) tryLogin(1500, url);
        }}
        onNavigationStateChange={(n) => {
          if (n.url && /^https:\/\/web\.mashov\.info\/[^?#]*login/i.test(n.url)) tryLogin(800, n.url);
          canGoBack.current = n.canGoBack;
          const st = urlsRef.current;
          if (n.url && st[st.length - 1] !== n.url) { st.push(n.url); if (st.length > 30) st.shift(); }
        }}
        allowsBackForwardNavigationGestures
      />

      <TouchableOpacity style={s.gear} onPress={() => setOpen(true)} accessibilityLabel="הגדרות">
        <Text style={s.gearText}>⚙️</Text>
      </TouchableOpacity>
      </View>

      <Modal onShow={checkListen} visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={[s.modal, { paddingTop: top + 8, paddingBottom: kb }]}>
          <View style={s.head}>
            <TouchableOpacity onPress={() => setOpen(false)}><Text style={s.done}>סגור</Text></TouchableOpacity>
            <Text style={s.title}>משוב פלוס</Text>
          </View>
          <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, paddingBottom: 60 + bottom }} keyboardShouldPersistTaps="handled">
            <View style={[s.row, { flexDirection: "column", alignItems: "flex-end" }]}>
              <Text style={s.label}>גרסת אפליקציה: build {BUILD || "פיתוח"}{LITE ? " (לייט)" : ""}</Text>
              <Text style={[s.sub, { marginTop: 4 }]}>{scriptDate ? `התכונות עודכנו אוטומטית ב-${scriptDate}` : "התכונות מגרסת ההתקנה"}</Text>
              {newApk ? (
                <TouchableOpacity style={[s.btn, { alignSelf: "stretch", backgroundColor: "#1d6fa8" }]} onPress={installUpdate}>
                  <Text style={s.btnT}>{updState || `⬆️ עדכן ל-build ${newApk.build}`}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={[s.sub, { marginTop: 4 }]}>✅ זו הגרסה האחרונה</Text>
              )}
            </View>

            <Section open={sec === "look"} onToggle={() => setSec(sec === "look" ? "" : "look")} title="🎨 מראה">
              <Row label="מצב כהה">
                <Switch value={cfg.dark !== "off"} onValueChange={(v) => update({ dark: v ? "on" : "off" })} />
              </Row>
              <Text style={s.sub}>ערכת נושא</Text>
              <View style={s.chips}>
                {THEMES.map(([id, name, color]) => (
                  <TouchableOpacity key={id} style={[s.chip, cfg.theme === id && s.chipOn]}
                    onPress={() => update(color ? { theme: id, accent: color } : { theme: id })}>
                    <Text style={s.btnT}>{name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Row label="אקסנט על האתר">
                <Switch value={cfg.useAccent} onValueChange={(v) => update({ useAccent: v })} />
              </Row>
              <Text style={s.sub}>צבע אקסנט</Text>
              <View style={s.swatches}>
                {SWATCHES.map((c) => (
                  <TouchableOpacity key={c} onPress={() => update({ accent: c })}
                    style={[s.swatch, { backgroundColor: c }, cfg.accent === c && s.swatchOn]} />
                ))}
              </View>
              <TextInput style={s.input} value={hex || cfg.accent}
                onChangeText={(t) => { setHex(t); if (/^#[0-9a-fA-F]{6}$/.test(t)) update({ accent: t }); }}
                onFocus={focusScroll} onBlur={() => setHex("")} autoCapitalize="none" autoCorrect={false}
                placeholder="#1d8fa8" placeholderTextColor="#777" />
            </Section>

            <Section open={sec === "grades"} onToggle={() => setSec(sec === "grades" ? "" : "grades")} title="📊 ציונים">
              <Row label="ממוצע בעמוד הציונים">
                <Switch value={cfg.avg} onValueChange={(v) => update({ avg: v })} />
              </Row>
              <Row label="🙈 אל תראה לי (טשטוש)">
                <Switch value={cfg.hideGrades} onValueChange={(v) => update({ hideGrades: v })} />
              </Row>
              <Text style={s.sub}>הציונים מטושטשים עד שנוגעים בהם</Text>
              <Row label="זוהר לציונים">
                <Switch value={cfg.glow} onValueChange={(v) => update({ glow: v })} />
              </Row>
              <View style={s.stepper}>
                <TouchableOpacity style={s.step} onPress={() => update({ glowMin: Math.min(100, cfg.glowMin + 1) })}><Text style={s.stepT}>+</Text></TouchableOpacity>
                <Text style={s.stepVal}>מעל {cfg.glowMin}</Text>
                <TouchableOpacity style={s.step} onPress={() => update({ glowMin: Math.max(0, cfg.glowMin - 1) })}><Text style={s.stepT}>−</Text></TouchableOpacity>
              </View>
            </Section>

            <Section open={sec === "fun"} onToggle={() => setSec(sec === "fun" ? "" : "fun")} title="😂 שמות מצחיקים">
              <Row label="שמות מצחיקים">
                <Switch value={cfg.funny} onValueChange={(v) => update({ funny: v })} />
              </Row>
              <Text style={s.sub}>חבילות (מחליפות את הרשימה)</Text>
              <View style={s.chips}>
                {Object.entries(PACKS).map(([id, p]) => (
                  <TouchableOpacity key={id} style={[s.chip, cfg.funnyList === p.text && s.chipOn]}
                    onPress={() => { update({ funnyList: p.text }); setDraft(null); setListKey((k) => k + 1); }}>
                    <Text style={s.btnT}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {(() => {
                const saved = parseFunny(cfg.funnyList);
                const cur = draft || saved;
                const keys = [...KNOWN, ...[...saved.keys()].filter((k) => !KNOWN.includes(k))];
                const dirty = draft !== null;
                const save = () => {
                  const text = keys.filter((k) => (cur.get(k) || "").trim()).map((k) => `${k} => ${cur.get(k).trim()}`).join("\n");
                  update({ funnyList: text });
                  setDraft(null);
                  Keyboard.dismiss();
                };
                return (
                  <View>
                    <Text style={s.sub}>מימין השם במשוב (קבוע). משמאל השם המצחיק. שדה ריק = בלי החלפה.</Text>
                    {keys.map((k) => (
                      <View key={k} style={s.fRow}>
                        <Text style={s.fOrig} numberOfLines={2}>{k}</Text>
                        <TextInput
                          style={s.fInput}
                          value={cur.get(k) || ""}
                          placeholder="—"
                          placeholderTextColor="#666"
                          onFocus={focusScroll}
                          onChangeText={(t) => { const m = new Map(cur); m.set(k, t); setDraft(m); }}
                          autoCorrect={false}
                          textAlign="right"
                        />
                      </View>
                    ))}
                    <View style={s.saveBar}>
                      <TouchableOpacity style={[s.btn, s.saveBtn, !dirty && { opacity: 0.5 }]} disabled={!dirty} onPress={save}>
                        <Text style={s.btnT}>{dirty ? "💾 שמור שינויים" : "✓ נשמר"}</Text>
                      </TouchableOpacity>
                      {dirty ? (
                        <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={() => { setDraft(null); Keyboard.dismiss(); }}>
                          <Text style={s.btnT}>בטל</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                );
              })()}
            </Section>

            <Section open={sec === "nav"} onToggle={() => setSec(sec === "nav" ? "" : "nav")} title="⭐ ניווט וגישה מהירה">
              <Row label="ניווט מהיר (☰)">
                <Switch value={cfg.nav} onValueChange={(v) => update({ nav: v })} />
              </Row>
              <Text style={s.sub}>גישה מהירה: כל שורה היא אייקון ושם הפריט המקורי בתפריט. אפשר גם ללחוץ ☆ ליד פריט בטאב "הכל".</Text>
              <TextInput key={"ess" + essKey} style={[s.input, s.list, { minHeight: 120 }]} multiline defaultValue={cfg.essList}
                onFocus={focusScroll} onEndEditing={(e) => update({ essList: e.nativeEvent.text })} autoCorrect={false} textAlign="right" />
              <TouchableOpacity style={s.btn} onPress={() => { update({ essList: ESS_TEXT }); setEssKey((k) => k + 1); }}>
                <Text style={s.btnT}>↩︎ אפס גישה מהירה לברירת מחדל</Text>
              </TouchableOpacity>
            </Section>

            <Section open={sec === "notif"} onToggle={() => setSec(sec === "notif" ? "" : "notif")} title="🔔 התראות">
              <Row label="התראות מאפליקציית משוב">
                <Switch value={cfg.listen} onValueChange={(v) => update({ listen: v })} />
              </Row>
              <Row label="הסתר את ההתראה המקורית">
                <Switch value={cfg.hideOrig} onValueChange={(v) => update({ hideOrig: v })} />
              </Row>
              {MashovListener ? (
                listenOk ? (
                  <Text style={s.sub}>✅ יש גישה להתראות. כל התראה ממשוב תגיע ממשוב פלוס.</Text>
                ) : (
                  <TouchableOpacity style={[s.btn, { backgroundColor: "#8a5a00" }]} onPress={() => { try { MashovListener.openSettings(); } catch (e) {} }}>
                    <Text style={s.btnT}>⚠️ צריך לאשר "גישה להתראות". לחצו כאן ובחרו משוב פלוס</Text>
                  </TouchableOpacity>
                )
              ) : (
                <Text style={s.sub}>{LITE ? "בגרסת הלייט אין האזנה להתראות של משוב (כדי ש-Play Protect לא יחסום). התראות מגיעות רק כשהאפליקציה פתוחה." : "האזנה להתראות לא זמינה בגרסה הזו"}</Text>
              )}
              {MashovListener && !postOk ? (
                <TouchableOpacity style={[s.btn, { backgroundColor: "#8a2a2a" }]} onPress={() => { try { MashovListener.openAppNotificationSettings(); } catch (e) {} }}>
                  <Text style={s.btnT}>🔕 ההתראות של משוב פלוס כבויות. לחצו כאן והפעילו אותן</Text>
                </TouchableOpacity>
              ) : null}
              {MashovListener ? (
                <TouchableOpacity style={s.btn} onPress={async () => {
                  try { await Notifications.requestPermissionsAsync(); MashovListener.sendTest(); } catch (e) {}
                  setTimeout(checkListen, 500);
                }}>
                  <Text style={s.btnT}>🔔 שלח התראת בדיקה</Text>
                </TouchableOpacity>
              ) : null}
              <Row label="בדיקת הודעות כשמשוב פתוח">
                <Switch value={cfg.notify} onValueChange={(v) => update({ notify: v })} />
              </Row>
              {MashovListener && log ? (
                <Text style={[s.sub, { fontSize: 12 }]}>יומן התראות:{"\n"}{log}</Text>
              ) : null}
            </Section>

            <Section open={sec === "login"} onToggle={() => setSec(sec === "login" ? "" : "login")} title="🔐 כניסה אוטומטית">
              <Text style={s.sub}>הפרטים נשמרים רק בטלפון הזה, מוצפנים (Android Keystore). כשמשוב מבקש להתחבר, האפליקציה ממלאת ונכנסת לבד.</Text>
              {cred ? (
                <Row label="כניסה אוטומטית פעילה">
                  <Switch value={cred.auto !== false} onValueChange={(v) => {
                    const c = { ...cred, auto: v }; setCred(c); SecureStore.setItemAsync(CRED_KEY, JSON.stringify(c)).catch(() => {});
                  }} />
                </Row>
              ) : null}
              <Text style={s.sub}>דרך ההתחברות</Text>
              <View style={s.chips}>
                {[["edu", "🏛️ משרד החינוך"], ["mashov", "משו\"ב"]].map(([id, nm]) => (
                  <TouchableOpacity key={id} style={[s.chip, credForm.mode === id && s.chipOn]} onPress={() => setCredForm({ ...credForm, mode: id })}>
                    <Text style={s.btnT}>{nm}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {credForm.mode === "mashov" ? (
                <TextInput style={s.input} value={credForm.school} onChangeText={(t) => setCredForm({ ...credForm, school: t })}
                  onFocus={focusScroll} placeholder="שם בית הספר (כמו שמופיע במשוב)" placeholderTextColor="#777" autoCorrect={false} />
              ) : null}
              <TextInput style={s.input} value={credForm.user} onChangeText={(t) => setCredForm({ ...credForm, user: t })}
                onFocus={focusScroll} placeholder={credForm.mode === "edu" ? "קוד משתמש / ת.ז. של משרד החינוך" : "שם משתמש / ת.ז."}
                placeholderTextColor="#777" autoCorrect={false} autoCapitalize="none" />
              <TextInput style={s.input} value={credForm.pass} onChangeText={(t) => setCredForm({ ...credForm, pass: t })}
                onFocus={focusScroll} placeholder={cred ? "סיסמה (ריק = להשאיר את השמורה)" : "סיסמה"} placeholderTextColor="#777"
                secureTextEntry autoCorrect={false} autoCapitalize="none" />
              <View style={s.saveBar}>
                <TouchableOpacity style={[s.btn, s.saveBtn]} onPress={async () => {
                  const pass = credForm.pass || (cred && cred.pass) || "";
                  if (!credForm.user.trim() || !pass) { setCredMsg("צריך שם משתמש וסיסמה"); return; }
                  const c = { mode: credForm.mode, user: credForm.user.trim(), pass, school: credForm.school.trim(), auto: true };
                  try { await SecureStore.setItemAsync(CRED_KEY, JSON.stringify(c)); setCred(c); setCredForm({ ...credForm, pass: "" }); flow.current = { at: 0, step: "" }; injects.current = []; setCredMsg("✓ נשמר. בפעם הבאה שמשוב יבקש להתחבר, זה יקרה לבד"); Keyboard.dismiss(); }
                  catch (e) { setCredMsg("השמירה נכשלה"); }
                }}>
                  <Text style={s.btnT}>💾 שמור</Text>
                </TouchableOpacity>
                {cred ? (
                  <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: "#8a2a2a" }]} onPress={async () => {
                    try { await SecureStore.deleteItemAsync(CRED_KEY); } catch (e) {}
                    setCred(null); setCredForm({ mode: "edu", user: "", pass: "", school: "" }); setCredMsg("הסיסמה נמחקה מהטלפון");
                  }}>
                    <Text style={s.btnT}>🗑️ מחק</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {credMsg ? <Text style={s.sub}>{credMsg}</Text> : null}
              <Text style={[s.sub, { fontSize: 12 }]}>אם הסיסמה שגויה, האפליקציה מפסיקה לנסות אחרי 2 ניסיונות כדי לא לנעול את החשבון.</Text>
            </Section>

            <Section open={sec === "backup"} onToggle={() => setSec(sec === "backup" ? "" : "backup")} title="💾 גיבוי ושיתוף">
              <Text style={s.sub}>"ייצוא" שולח את כל ההגדרות כטקסט (וואטסאפ, מייל...). חבר מדביק אותו כאן ולוחץ "ייבוא".</Text>
              <TouchableOpacity style={s.btn} onPress={() => {
                const names = [];
                const pk = Object.values(PACKS).find((p) => p.text === cfg.funnyList);
                if (pk) names.push("חבילת " + pk.name);
                else if (store.funnyList) names.push("שמות מצחיקים משלי");
                const th = THEMES.find((t) => t[0] === cfg.theme && t[0] !== "none");
                if (th) names.push("ערכת " + th[1]);
                if (cfg.hideGrades) names.push("🙈 אל תראה לי");
                const msg =
                  "⚙️ ההגדרות שלי במשוב פלוס" + (names.length ? ": " + names.join(", ") : "") + "\n" +
                  "להעתיק את כל ההודעה ולהדביק באפליקציה: ⚙️ ← 💾 גיבוי ושיתוף ← 📥 ייבוא\n\n" +
                  JSON.stringify({ mashovPlus: 1, settings: store });
                Share.share({ message: msg }).catch(() => {});
              }}>
                <Text style={s.btnT}>📤 ייצוא ושיתוף</Text>
              </TouchableOpacity>
              <TextInput style={[s.input, { minHeight: 70, textAlign: "left" }]} multiline value={ioText} onChangeText={setIoText}
                onFocus={focusScroll} placeholder="הדביקו כאן גיבוי" placeholderTextColor="#777" autoCorrect={false} autoCapitalize="none" />
              <TouchableOpacity style={s.btn} onPress={() => {
                let d;
                try { d = JSON.parse(ioText.slice(ioText.indexOf("{"), ioText.lastIndexOf("}") + 1)); } catch (e) { setIoMsg("לא נמצא קוד הגדרות בטקסט"); return; }
                if (!d || !d.mashovPlus || typeof d.settings !== "object") { setIoMsg("זה לא גיבוי של משוב פלוס"); return; }
                const known = { ...DEFAULTS, listen: true, hideOrig: true };
                const clean = {};
                for (const k of Object.keys(known)) {
                  if (k in d.settings && typeof d.settings[k] === typeof known[k]) clean[k] = d.settings[k];
                }
                update(clean); setListKey((k) => k + 1); setEssKey((k) => k + 1); setIoText(""); setIoMsg("✓ ההגדרות יובאו");
              }}>
                <Text style={s.btnT}>📥 ייבוא</Text>
              </TouchableOpacity>
              {ioMsg ? <Text style={s.sub}>{ioMsg}</Text> : null}
            </Section>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1a1a1a" },
  web: { flex: 1, backgroundColor: "#1a1a1a" },
  gear: {
    position: "absolute", right: 14, bottom: 14, width: 46, height: 46, borderRadius: 23,
    backgroundColor: "rgba(40,40,40,0.85)", alignItems: "center", justifyContent: "center",
  },
  gearText: { fontSize: 22 },
  modal: { flex: 1, backgroundColor: "#1a1a1a" },
  head: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 8 },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },
  done: { color: "#6cb8ff", fontSize: 16 },
  row: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", backgroundColor: "#262626", borderRadius: 12, padding: 12, marginTop: 10 },
  label: { color: "#eee", fontSize: 16 },
  sub: { color: "#a0a0a0", marginTop: 14, marginBottom: 6, textAlign: "right" },
  swatches: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 10 },
  swatch: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: "transparent" },
  swatchOn: { borderColor: "#fff" },
  input: { backgroundColor: "#262626", color: "#eee", borderRadius: 10, padding: 10, marginTop: 10, textAlign: "right" },
  list: { minHeight: 200, textAlignVertical: "top" },
  stepper: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 18, marginTop: 8 },
  step: { width: 46, height: 40, borderRadius: 10, backgroundColor: "#333", alignItems: "center", justifyContent: "center" },
  stepT: { color: "#fff", fontSize: 22 },
  stepVal: { color: "#eee", fontSize: 16, minWidth: 90, textAlign: "center" },
  btn: { backgroundColor: "#333", borderRadius: 10, padding: 12, marginTop: 12, alignItems: "center" },
  btnT: { color: "#eee", fontSize: 15 },
  section: { backgroundColor: "#202020", borderRadius: 14, marginTop: 12, paddingHorizontal: 10 },
  secHead: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", paddingVertical: 14 },
  secTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  secArrow: { color: "#aaa", fontSize: 16 },
  chips: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: "#333", borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 2, borderColor: "transparent" },
  chipOn: { borderColor: "#6cb8ff" },
  fRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8, marginTop: 6 },
  fOrig: { width: "40%", color: "#9a9aa2", fontSize: 14, textAlign: "right" },
  fInput: { flex: 1, backgroundColor: "#262626", color: "#eee", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  saveBar: { flexDirection: "row-reverse", gap: 8, marginTop: 10 },
  saveBtn: { flex: 2, backgroundColor: "#1d6fa8", marginTop: 12 },
  updBar: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: "#1d6fa8", paddingHorizontal: 12, paddingVertical: 8 },
  updText: { color: "#fff", fontSize: 14, textAlign: "right" },
  updX: { color: "#fff", fontSize: 18, paddingHorizontal: 8 },
});
