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

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    try {
      handle(sbn)
    } catch (e: Exception) {
    }
  }

  private fun handle(sbn: StatusBarNotification) {
    if (!isMashov(sbn.packageName)) return
    val prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    if (!prefs.getBoolean("enabled", true)) return
    val hide = prefs.getBoolean("hide", true)
    val n = sbn.notification

    // התראת סיכום של קבוצה: לא מעבירים, רק מסתירים
    if (n.flags and Notification.FLAG_GROUP_SUMMARY != 0) {
      if (hide) cancelNotification(sbn.key)
      return
    }
    // התראה קבועה (למשל סנכרון ברקע): לא נוגעים
    if (n.flags and Notification.FLAG_ONGOING_EVENT != 0) return

    val ex = n.extras
    val title = ex.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: "משוב"
    val text = (ex.getCharSequence(Notification.EXTRA_BIG_TEXT)
      ?: ex.getCharSequence(Notification.EXTRA_TEXT))?.toString() ?: ""
    if (title.isBlank() && text.isBlank()) return

    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      nm.createNotificationChannel(
        NotificationChannel(CHANNEL, "הודעות ממשוב", NotificationManager.IMPORTANCE_HIGH)
      )
    }

    var icon = resources.getIdentifier("notification_icon", "drawable", packageName)
    if (icon == 0) icon = applicationInfo.icon

    val launch = packageManager.getLaunchIntentForPackage(packageName)
    val pi = launch?.let {
      PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
    }

    val ft = funnify(title, prefs)
    val fx = funnify(text, prefs)
    val b = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
      Notification.Builder(this, CHANNEL) else Notification.Builder(this)
    b.setSmallIcon(icon)
      .setContentTitle(ft)
      .setContentText(fx)
      .setStyle(Notification.BigTextStyle().bigText(fx))
      .setAutoCancel(true)
      .setCategory(Notification.CATEGORY_MESSAGE)
    if (pi != null) b.setContentIntent(pi)

    nm.notify(sbn.key.hashCode(), b.build())
    if (hide) cancelNotification(sbn.key)
  }
}
