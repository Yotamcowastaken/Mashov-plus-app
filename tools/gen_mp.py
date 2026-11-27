# יוצר את mp.js (לאפליקציה), remote/mp-script.js (עדכון אוטומטי) ו-remote/mashov-plus.user.js (אייפון)
# מתוך הקוד של התוסף בתיקייה extension/. מריצים: python3 tools/gen_mp.py
import json,subprocess,os
REPO=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ext=os.path.join(REPO,'extension')+'/'
defaults=open(ext+'defaults.js',encoding='utf-8').read()
content=open(ext+'content.js',encoding='utf-8').read()
css=open(ext+'content.css',encoding='utf-8').read()
shim='''
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
'''
body=f'''(function () {{
  if (window.__mpBooted) return;
  window.__mpBooted = true;
  function main() {{
{shim}
{defaults}
    var st = document.createElement("style");
    st.textContent = {json.dumps(css, ensure_ascii=False)};
    document.documentElement.appendChild(st);
{content}
  }}
  (function boot() {{
    if (!document.documentElement) {{ setTimeout(boot, 5); return; }}
    main();
  }})();
}})();
'''
out=subprocess.check_output(['node','-e',defaults+'\nconsole.log(JSON.stringify({d:MP_DEFAULTS,t:MP_FUNNY_TEXT,e:MP_ESS_TEXT,p:MP_PACKS}))'],encoding='utf-8')
j=json.loads(out)
mp=f'''// נוצר אוטומטית מהתוסף. אל תערוך ידנית.
export const SCRIPT = {json.dumps(body, ensure_ascii=False)};
export const DEFAULTS = {json.dumps(j['d'], ensure_ascii=False, indent=2)};
export const FUNNY_TEXT = {json.dumps(j['t'], ensure_ascii=False)};
export const ESS_TEXT = {json.dumps(j['e'], ensure_ascii=False)};
export const PACKS = {json.dumps(j['p'], ensure_ascii=False)};
'''
open(os.path.join(REPO,'mp.js'),'w',encoding='utf-8').write(mp)

import os
os.makedirs(os.path.join(REPO,'remote'), exist_ok=True)
open(os.path.join(REPO,'remote','mp-script.js'),'w',encoding='utf-8').write(body)

# ---------- גרסת אייפון (Safari + Userscripts) ----------
import time
shim_ios = '''
  window.__MP_INPAGE_SETTINGS = true;
  var IKEY = "mp-ios-settings";
  var store = {};
  try { store = JSON.parse(localStorage.getItem(IKEY) || "{}"); } catch (e) {}
  var listeners = [];
  function persist() { try { localStorage.setItem(IKEY, JSON.stringify(store)); } catch (e) {} }
  window.chrome = { runtime: { id: "mashov-plus-ios", lastError: undefined, sendMessage: function () {} },
    storage: {
      local: {
        get: function (defs, cb) { var out = Object.assign({}, defs, store); setTimeout(function () { cb(out); }, 0); },
        set: function (o, cb) { Object.assign(store, o); persist(); if (cb) cb(); },
        remove: function (k, cb) { [].concat(k).forEach(function (x) { delete store[x]; }); persist(); if (cb) cb(); }
      },
      onChanged: { addListener: function (f) { listeners.push(f); } }
    } };
'''
ver = time.strftime("%Y.%m.%d.%H%M")
raw = "https://raw.githubusercontent.com/Yotamcowastaken/Mashov-plus-app/main/remote/mashov-plus.user.js"
ios = f'''// ==UserScript==
// @name         משוב פלוס
// @description  מצב כהה, ערכות נושא, ממוצע ציונים, שמות מצחיקים וגישה מהירה במשוב
// @version      {ver}
// @match        https://web.mashov.info/*
// @run-at       document-start
// @inject-into  content
// @updateURL    {raw}
// @downloadURL  {raw}
// ==/UserScript==
(function () {{
  if (window.__mpBooted) return;
  window.__mpBooted = true;
  function main() {{
{shim_ios}
{defaults}
    var st = document.createElement("style");
    st.textContent = {json.dumps(css, ensure_ascii=False)};
    document.documentElement.appendChild(st);
{content}
  }}
  (function boot() {{
    if (!document.documentElement) {{ setTimeout(boot, 5); return; }}
    main();
  }})();
}})();
'''
open(os.path.join(REPO,'remote','mashov-plus.user.js'),'w',encoding='utf-8').write(ios)
