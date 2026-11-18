import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Modal,
  Platform,
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
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { SCRIPT, DEFAULTS, FUNNY_TEXT, ESS_TEXT } from "./mp";

const STORE_KEY = "mp-store";
const START_URL = "https://web.mashov.info/students/login";
const SWATCHES = ["#1d8fa8", "#e53935", "#8e24aa", "#43a047", "#fb8c00", "#3f51b5", "#00897b", "#f06292"];

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
  const web = useRef(null);
  const canGoBack = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY)
      .then((v) => setStore(v ? JSON.parse(v) : {}))
      .catch(() => setStore({}));
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (open) { setOpen(false); return true; }
      if (canGoBack.current && web.current) { web.current.goBack(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [open]);

  const cfg = { ...DEFAULTS, ...(store || {}) };

  const storeRef = useRef(null);
  storeRef.current = store;
  // שינוי שהגיע מתוך הדף (כוכבים ועריכה ב-Essentials): שומרים בלי לשלוח בחזרה
  const onMessage = useCallback((ev) => {
    let m;
    try { m = JSON.parse(ev.nativeEvent.data); } catch (e) { return; }
    const next = { ...(storeRef.current || {}) };
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

  const injected = `window.__MP_INITIAL = ${JSON.stringify(store)};\n${SCRIPT}\ntrue;`;
  const top = insets.top || (Platform.OS === "android" ? RNStatusBar.currentHeight || 0 : 40);
  const bottom = insets.bottom;

  const Row = ({ label, children }) => (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      {children}
    </View>
  );

  return (
    <View style={[s.root, { paddingTop: top, paddingBottom: bottom }]}>
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

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={[s.modal, { paddingTop: top + 8 }]}>
          <View style={s.head}>
            <TouchableOpacity onPress={() => setOpen(false)}><Text style={s.done}>סגור</Text></TouchableOpacity>
            <Text style={s.title}>משו״ב פלוס</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 + bottom }} keyboardShouldPersistTaps="handled">
            <Row label="מצב כהה">
              <Switch value={cfg.dark !== "off"} onValueChange={(v) => update({ dark: v ? "on" : "off" })} />
            </Row>

            <Row label="אקסנט על האתר">
              <Switch value={cfg.useAccent} onValueChange={(v) => update({ useAccent: v })} />
            </Row>
            <Text style={s.sub}>צבע אקסנט</Text>
            <View style={s.swatches}>
              {SWATCHES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => update({ accent: c })}
                  style={[s.swatch, { backgroundColor: c }, cfg.accent === c && s.swatchOn]}
                />
              ))}
            </View>
            <TextInput
              style={s.input}
              value={hex || cfg.accent}
              onChangeText={(t) => {
                setHex(t);
                if (/^#[0-9a-fA-F]{6}$/.test(t)) update({ accent: t });
              }}
              onBlur={() => setHex("")}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="#1d8fa8"
              placeholderTextColor="#777"
            />

            <Row label="זוהר לציונים">
              <Switch value={cfg.glow} onValueChange={(v) => update({ glow: v })} />
            </Row>
            <View style={s.stepper}>
              <TouchableOpacity style={s.step} onPress={() => update({ glowMin: Math.min(100, cfg.glowMin + 1) })}><Text style={s.stepT}>+</Text></TouchableOpacity>
              <Text style={s.stepVal}>מעל {cfg.glowMin}</Text>
              <TouchableOpacity style={s.step} onPress={() => update({ glowMin: Math.max(0, cfg.glowMin - 1) })}><Text style={s.stepT}>−</Text></TouchableOpacity>
            </View>

            <Row label="ניווט מהיר (☰)">
              <Switch value={cfg.nav} onValueChange={(v) => update({ nav: v })} />
            </Row>

            <Text style={s.sub}>Essentials: כל שורה היא אייקון ושם הפריט המקורי בתפריט. אפשר גם ללחוץ ☆ ליד פריט בטאב "הכל".</Text>
            <TextInput
              key={"ess" + essKey}
              style={[s.input, s.list, { minHeight: 120 }]}
              multiline
              defaultValue={cfg.essList}
              onEndEditing={(e) => update({ essList: e.nativeEvent.text })}
              autoCorrect={false}
              textAlign="right"
            />
            <TouchableOpacity style={s.btn} onPress={() => { update({ essList: ESS_TEXT }); setEssKey((k) => k + 1); }}>
              <Text style={s.btnT}>↩︎ אפס Essentials לברירת מחדל</Text>
            </TouchableOpacity>

            <Row label="שמות מצחיקים">
              <Switch value={cfg.funny} onValueChange={(v) => update({ funny: v })} />
            </Row>
            <Text style={s.sub}>כל שורה: הטקסט באתר =&gt; הטקסט המצחיק</Text>
            <TextInput
              key={listKey}
              style={[s.input, s.list]}
              multiline
              defaultValue={cfg.funnyList}
              onEndEditing={(e) => update({ funnyList: e.nativeEvent.text })}
              autoCorrect={false}
              textAlign="right"
            />
            <TouchableOpacity
              style={s.btn}
              onPress={() => { update({ funnyList: FUNNY_TEXT }); setListKey((k) => k + 1); }}
            >
              <Text style={s.btnT}>↩︎ אפס שמות לברירת מחדל</Text>
            </TouchableOpacity>
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
});
