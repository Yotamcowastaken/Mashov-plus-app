package expo.modules.mashovlistener

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

// מאזין להתראות של אפליקציית משוב הרשמית ושולח במקומן התראה של משוב פלוס
class MashovNotificationService : NotificationListenerService() {
  companion object {
    const val PREFS = "mashov_listener"
    const val CHANNEL = "mashov_forward"

    fun ensureChannel(ctx: Context) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.createNotificationChannel(
          NotificationChannel(CHANNEL, "הודעות ממשוב", NotificationManager.IMPORTANCE_HIGH)
        )
      }
    }

    // האם התראות של משוב פלוס באמת יכולות להופיע
    fun canPost(ctx: Context): Boolean {
      val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      if (!nm.areNotificationsEnabled()) return false
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        ensureChannel(ctx)
        val ch = nm.getNotificationChannel(CHANNEL)
        if (ch != null && ch.importance == NotificationManager.IMPORTANCE_NONE) return false
      }
      return true
    }

    fun post(ctx: Context, id: Int, title: String, text: String) {
      ensureChannel(ctx)
      val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      var icon = ctx.resources.getIdentifier("notification_icon", "drawable", ctx.packageName)
      if (icon == 0) icon = ctx.applicationInfo.icon
      val launch = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)
      val pi = launch?.let {
        PendingIntent.getActivity(ctx, 0, it, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
      }
      val b = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
        Notification.Builder(ctx, CHANNEL) else Notification.Builder(ctx)
      b.setSmallIcon(icon)
        .setContentTitle(title)
        .setContentText(text)
        .setStyle(Notification.BigTextStyle().bigText(text))
        .setAutoCancel(true)
        .setCategory(Notification.CATEGORY_MESSAGE)
      if (pi != null) b.setContentIntent(pi)
      nm.notify(id, b.build())
    }

    fun log(ctx: Context, msg: String) {
      val p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      val time = java.text.SimpleDateFormat("dd/MM HH:mm", java.util.Locale.US).format(java.util.Date())
      val lines = (p.getString("log", "") ?: "").split("\n").filter { it.isNotBlank() }.take(9)
      p.edit().putString("log", (listOf("$time  $msg") + lines).joinToString("\n")).apply()
    }
  }

  private val labelCache = HashMap<String, Boolean>()

  private fun isMashov(pkg: String): Boolean {
    if (pkg == packageName) return false
    labelCache[pkg]?.let { return it }
    var yes = pkg.contains("mashov", ignoreCase = true)
    if (!yes) {
      try {
        val ai = packageManager.getApplicationInfo(pkg, 0)
        val label = packageManager.getApplicationLabel(ai).toString()
        yes = label.contains("משוב") || label.contains("משו\"ב") || label.contains("משו״ב") ||
          label.contains("mashov", ignoreCase = true)
      } catch (e: PackageManager.NameNotFoundException) {
      }
    }
    labelCache[pkg] = yes
    return yes
  }

  private fun funnify(s: String, prefs: android.content.SharedPreferences): String {
    if (!prefs.getBoolean("funny", true)) return s
    var out = s
    for (line in (prefs.getString("funnyList", "") ?: "").split("\n")) {
      val parts = line.split("=>")
      if (parts.size != 2) continue
      val from = parts[0].trim()
      val to = parts[1].trim()
      if (from.isNotEmpty() && to.isNotEmpty()) out = out.replace(from, to)
    }
    return out
  }

  override fun onListenerConnected() {
    log(this, "המאזין להתראות פעיל")
  }

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    try {
      handle(sbn)
    } catch (e: Exception) {
      log(this, "שגיאה: " + e.javaClass.simpleName)
    }
  }

  private fun handle(sbn: StatusBarNotification) {
    if (!isMashov(sbn.packageName)) return
    val prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    if (!prefs.getBoolean("enabled", true)) return
    val hide = prefs.getBoolean("hide", true)
    val n = sbn.notification

    // התראת סיכום של קבוצה: לא נוגעים (ביטול שלה עלול למחוק גם את ההתראות שבתוכה)
    if (n.flags and Notification.FLAG_GROUP_SUMMARY != 0) return
    // התראה קבועה (למשל סנכרון ברקע): לא נוגעים
    if (n.flags and Notification.FLAG_ONGOING_EVENT != 0) return

    val ex = n.extras
    val title = ex.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: "משוב"
    val text = (ex.getCharSequence(Notification.EXTRA_BIG_TEXT)
      ?: ex.getCharSequence(Notification.EXTRA_TEXT))?.toString() ?: ""
    if (title.isBlank() && text.isBlank()) return

    val ft = funnify(title, prefs)
    val fx = funnify(text, prefs)
    if (!canPost(this)) {
      // ההתראות של משוב פלוס כבויות: משאירים את המקורית כדי שלא יאבד כלום
      log(this, "ממשוב: \"$title\" - לא הועבר, ההתראות של משוב פלוס כבויות")
      return
    }
    post(this, sbn.key.hashCode(), ft, fx)
    log(this, "ממשוב (${sbn.packageName}): \"$title\" - הועבר" + if (hide) " והמקור הוסתר" else "")
    if (hide) cancelNotification(sbn.key)
  }
}
