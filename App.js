import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
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
import * as Notifications from "expo-notifications";
import MashovListener from "./modules/mashov-listener";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { SCRIPT, DEFAULTS, FUNNY_TEXT, ESS_TEXT, PACKS } from "./mp";
import BUILD_INFO from "./build-info.json";

const STORE_KEY = "mp-store";
const SCRIPT_KEY = "mp-remote-script";
const REPO = "Yotamcowastaken/Mashov-plus-app";
const SCRIPT_URL = `https://raw.githubusercontent.com/${REPO}/main/remote/mp-script.js`;
const RELEASES_URL = `https://api.github.com/repos/${REPO}/releases/latest`;
const BUILD = (BUILD_INFO && BUILD_INFO.build) || 0;
const validScript = (t) => typeof t === "string" && t.length > 1000 && t.startsWith("(function () {") && t.includes("__mpBooted");

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
    shouldShowAlert: true,
  }),
});
const START_URL = "https://web.mashov.info/students/login";
const THEMES = [
  ["none", "ללא", null],
  ["space", "🌌 חלל", "#7c4dff"],
  ["neon", "💜 ניאון", "#ff2bd6"],
  ["winter", "❄️ חורף", "#4fc3f7"],
];
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
  const [ioText, setIoText] = useState("");
  const [ioMsg, setIoMsg] = useState("");
  const web = useRef(null);
  const canGoBack = useRef(false);

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
          const asset = rel && (rel.assets || []).find((a) => a.name.endsWith(".apk"));
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
      if (canGoBack.current && web.current) { web.current.goBack(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [open]);

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
  // שינוי שהגיע מתוך הדף (כוכבים ועריכה ב-Essentials): שומרים בלי לשלוח בחזרה
  const onMessage = useCallback((ev) => {
    let m;
    try { m = JSON.parse(ev.nativeEvent.data); } catch (e) { return; }
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
    <View style={[s.root, { paddingTop: top, paddingBottom: bottom }]}>
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
        onNavigationStateChange={(n) => { canGoBack.current = n.canGoBack; }}
        allowsBackForwardNavigationGestures
      />

      <TouchableOpacity style={s.gear} onPress={() => setOpen(true)} accessibilityLabel="הגדרות">
        <Text style={s.gearText}>⚙️</Text>
      </TouchableOpacity>
      </View>

      <Modal onShow={checkListen} visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={[s.modal, { paddingTop: top + 8 }]}>
          <View style={s.head}>
            <TouchableOpacity onPress={() => setOpen(false)}><Text style={s.done}>סגור</Text></TouchableOpacity>
            <Text style={s.title}>משוב פלוס</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 + bottom }} keyboardShouldPersistTaps="handled">
            <View style={[s.row, { flexDirection: "column", alignItems: "flex-end" }]}>
              <Text style={s.label}>גרסת אפליקציה: build {BUILD || "פיתוח"}</Text>
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
                onBlur={() => setHex("")} autoCapitalize="none" autoCorrect={false}
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
                    onPress={() => { update({ funnyList: p.text }); setListKey((k) => k + 1); }}>
                    <Text style={s.btnT}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={s.sub}>כל שורה: הטקסט באתר =&gt; הטקסט המצחיק</Text>
              <TextInput key={listKey} style={[s.input, s.list]} multiline defaultValue={cfg.funnyList}
                onEndEditing={(e) => update({ funnyList: e.nativeEvent.text })} autoCorrect={false} textAlign="right" />
            </Section>

            <Section open={sec === "nav"} onToggle={() => setSec(sec === "nav" ? "" : "nav")} title="⭐ ניווט וגישה מהירה">
              <Row label="ניווט מהיר (☰)">
                <Switch value={cfg.nav} onValueChange={(v) => update({ nav: v })} />
              </Row>
              <Text style={s.sub}>גישה מהירה: כל שורה היא אייקון ושם הפריט המקורי בתפריט. אפשר גם ללחוץ ☆ ליד פריט בטאב "הכל".</Text>
              <TextInput key={"ess" + essKey} style={[s.input, s.list, { minHeight: 120 }]} multiline defaultValue={cfg.essList}
                onEndEditing={(e) => update({ essList: e.nativeEvent.text })} autoCorrect={false} textAlign="right" />
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
                <Text style={s.sub}>האזנה להתראות לא זמינה בגרסה הזו</Text>
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

            <Section open={sec === "backup"} onToggle={() => setSec(sec === "backup" ? "" : "backup")} title="💾 גיבוי ושיתוף">
              <Text style={s.sub}>"ייצוא" שולח את כל ההגדרות כטקסט (וואטסאפ, מייל...). חבר מדביק אותו כאן ולוחץ "ייבוא".</Text>
              <TouchableOpacity style={s.btn} onPress={() => {
                Share.share({ message: JSON.stringify({ mashovPlus: 1, settings: store }) }).catch(() => {});
              }}>
                <Text style={s.btnT}>📤 ייצוא ושיתוף</Text>
              </TouchableOpacity>
              <TextInput style={[s.input, { minHeight: 70, textAlign: "left" }]} multiline value={ioText} onChangeText={setIoText}
                placeholder="הדביקו כאן גיבוי" placeholderTextColor="#777" autoCorrect={false} autoCapitalize="none" />
              <TouchableOpacity style={s.btn} onPress={() => {
                let d;
                try { d = JSON.parse(ioText); } catch (e) { setIoMsg("הטקסט לא תקין"); return; }
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
  updBar: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: "#1d6fa8", paddingHorizontal: 12, paddingVertical: 8 },
  updText: { color: "#fff", fontSize: 14, textAlign: "right" },
  updX: { color: "#fff", fontSize: 18, paddingHorizontal: 8 },
});
