משו״ב פלוס לאנדרואיד (OnePlus)
================================

מה זה: אפליקציה שפותחת את web.mashov.info בתוך דפדפן פנימי, ומריצה עליו את אותו קוד של התוסף
(מצב כהה, אקסנט, זוהר לציונים, שמות מצחיקים, ניווט מהיר). כפתור ⚙️ בפינה פותח את ההגדרות.
האפליקציה לא שומרת סיסמה ולא ניגשת לנתונים. את ההתחברות עושים באתר עצמו כרגיל.

שלב א: הכנה (פעם אחת, במחשב)
1. מתקינים Node.js (גרסת LTS) מ-nodejs.org
2. בטרמינל:
     npx create-expo-app@latest mashov-plus --template blank
     cd mashov-plus
     npx expo install react-native-webview @react-native-async-storage/async-storage
3. מעתיקים את הקבצים App.js, mp.js, app.json ו-eas.json מהתיקייה הזאת לתוך התיקייה mashov-plus
   (מחליפים את הקיימים).

שלב ב: בדיקה מהירה בלי להתקין (אופציונלי)
1. מתקינים בטלפון את האפליקציה Expo Go מחנות Google Play.
2. במחשב: npx expo start
3. סורקים את קוד ה-QR מתוך Expo Go. (הטלפון והמחשב באותה רשת Wi-Fi.)

שלב ג: קובץ APK להתקנה קבועה
1. פותחים חשבון חינמי ב-expo.dev
2. בטרמינל, בתוך mashov-plus:
     npm install -g eas-cli
     eas login
     eas build:configure        (אם שואל על פלטפורמה, בוחרים Android)
     eas build -p android --profile preview
3. כשהבנייה נגמרת (כמה דקות) מקבלים קישור. פותחים אותו בטלפון, מורידים את ה-APK
   ומתקינים. אם הטלפון חוסם, מאשרים "התקנה ממקורות לא ידועים" לדפדפן.

אם משהו נכשל, שולחים לי את הודעת השגיאה.
