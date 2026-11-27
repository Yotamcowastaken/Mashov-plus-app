# משוב פלוס (Mashov Plus)

**Always reply to the user in Hebrew.** The user (Yotamco) builds this as a personal project and shares it with friends/students.

Mashov Plus improves the Israeli school portal **Mashov** (https://web.mashov.info, student/parent site).
It never stores Mashov data on any server and does not call Mashov's API: it only changes how the site looks and behaves in the browser / WebView.

## Three deliverables, one shared page script

| Folder / file | What it is |
|---|---|
| `extension/` | Chrome/Vivaldi extension (MV3). `content.js` + `content.css` run on web.mashov.info. `defaults.js` holds defaults, funny-name packs, quick-access defaults. `popup.*` = small settings window, `options.*` = funny-names editor + packs + settings export/import, `background.js` = desktop notifications. |
| `App.js`, `mp.js`, `app.json`, `modules/`, `assets/` | Android app (Expo / React Native). A WebView opens Mashov and injects the same page script. `modules/mashov-listener/` = native Kotlin Expo module (NotificationListenerService, test notification, APK download+install, moveToBack). |
| `remote/mp-script.js` | The page script the **app downloads on every launch** (auto-update without a new APK). |
| `remote/mashov-plus.user.js` | iPhone version: userscript for the **Userscripts** Safari extension (with `@updateURL`). Adds an in-page ⚙️ settings tab (`window.__MP_INPAGE_SETTINGS`). |
| `tools/gen_mp.py` | **Run after every change in `extension/content.js|css|defaults.js`:** `python3 tools/gen_mp.py` regenerates `mp.js`, `remote/mp-script.js`, `remote/mashov-plus.user.js`. |
| `docs/demo.html` | The public demo/install-guide artifact page (Android/iPhone tabs, video, fake-data demo). Published at https://claude.ai/artifact/4euwz8rCmJozTskFFgHYhc |

The page script is written once (extension `content.js`) and wrapped with a small `chrome.storage` shim per platform (RN postMessage in the app, localStorage on iPhone).

## Build & release (GitHub Actions)
- `.github/workflows/build-apk.yml`: on push to `main` (ignores `remote/**` and `extension/**`), matrix builds **full** and **lite** APKs, then one release `build-N` with `mashov-plus-build-N.apk` and `mashov-plus-lite-build-N.apk`.
- Lite = separate package `com.yotamco.mashovplus.lite`, no notification-listener module (stubbed), so Google Play Protect does not block it.
- `build-info.json` is written by CI (`{build, variant}`); the app compares with `releases/latest` to show the "⬆️ גרסה חדשה זמינה" bar.
- Gradle sometimes fails on transient network errors; the workflow retries with `--refresh-dependencies`.
- A change that only touches `remote/` reaches users without a new APK.

## Features (current)
Dark mode (`#1a1a1a`, invert filter with accent elements kept outside the filter), accent color (auto-detects the site's primary toolbar color), themes (space / neon / winter), grade glow ≥ threshold, "אל תראה לי" blur, grade averages (table layout **and** Mashov's card-list layout: date line followed by "subject + class" line), funny menu names with packs (default/gamer/pirates/army; rules applied longest-first), quick-nav panel ☰ with "גישה מהירה" tab (stars, reorder, icons) and categories + search, new-message detection, settings export/import, Android: notification forwarding from the official Mashov app, auto-login (credentials in expo-secure-store, Ministry of Education SSO `lgn.edu.gov.il` or Mashov login, max 2 tries / 3 min), back button never returns to login (moves app to background), in-app updates.

## Lessons / don'ts
- **Do not restore/backup `sessionStorage`** to keep the login: it broke the Ministry of Education SSO (NIDP error). Reverted.
- Mashov's web login has no "מכשיר אישי" option (that exists only in the official app).
- Notification access on Android 13+ needs "Allow restricted settings" (App info → ⋮) for sideloaded apps.
- Numbers in toolbars/badges/buttons are not grades (excluded in `markGrades`).
- Never type or store the user's real password anywhere except the on-device secure store; don't log grades or names from screenshots.
- The demo artifact is **public**; republishing it needs the user's explicit OK and `shared_live: "public"`.

## Not possible / declined
iOS app (no sideloading, no notification access) → Safari userscript instead. PWA/server polling Mashov with stored passwords → declined (security, unofficial API).
