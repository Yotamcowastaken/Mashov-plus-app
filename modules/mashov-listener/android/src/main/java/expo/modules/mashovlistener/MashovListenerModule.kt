package expo.modules.mashovlistener

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings
import java.io.File
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MashovListenerModule : Module() {
  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "No React context" }

  override fun definition() = ModuleDefinition {
    Name("MashovListener")

    // האם המשתמש נתן "גישה להתראות" לאפליקציה
    Function("isEnabled") {
      val list = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners") ?: ""
      list.split(":").any { it.startsWith(context.packageName + "/") }
    }

    // פותח את מסך ההגדרות של "גישה להתראות"
    Function("openSettings") {
      val i = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
      i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(i)
    }

    Function("canPost") { MashovNotificationService.canPost(context) }

    // פותח את הגדרות ההתראות של משוב פלוס
    Function("openAppNotificationSettings") {
      val i = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
      i.putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
      i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(i)
    }

    // התראת בדיקה דרך אותו מסלול שבו עוברות ההתראות ממשוב
    Function("sendTest") {
      MashovNotificationService.post(context, 4242, "משוב פלוס", "זו התראת בדיקה. אם רואים אותה, הכול עובד ✅")
      MashovNotificationService.canPost(context)
    }

    // מוריד APK חדש ופותח את מסך ההתקנה של אנדרואיד
    Function("installApk") { url: String ->
      val ctx = context
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !ctx.packageManager.canRequestPackageInstalls()) {
        val i = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + ctx.packageName))
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        ctx.startActivity(i)
        "need-permission"
      } else {
        File(ctx.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "mashov-plus.apk").delete()
        val dm = ctx.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        val req = DownloadManager.Request(Uri.parse(url))
          .setTitle("משוב פלוס")
          .setDescription("מוריד עדכון")
          .setMimeType("application/vnd.android.package-archive")
          .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
          .setDestinationInExternalFilesDir(ctx, Environment.DIRECTORY_DOWNLOADS, "mashov-plus.apk")
        val id = dm.enqueue(req)
        val receiver = object : BroadcastReceiver() {
          override fun onReceive(c: Context, intent: Intent) {
            if (intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L) != id) return
            try { c.unregisterReceiver(this) } catch (e: Exception) {}
            val uri = dm.getUriForDownloadedFile(id) ?: return
            val inst = Intent(Intent.ACTION_VIEW)
            inst.setDataAndType(uri, "application/vnd.android.package-archive")
            inst.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
            c.startActivity(inst)
          }
        }
        val filter = IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
        if (Build.VERSION.SDK_INT >= 33) {
          ctx.registerReceiver(receiver, filter, Context.RECEIVER_EXPORTED)
        } else {
          ctx.registerReceiver(receiver, filter)
        }
        "downloading"
      }
    }

    Function("getLog") {
      context.getSharedPreferences(MashovNotificationService.PREFS, Context.MODE_PRIVATE).getString("log", "") ?: ""
    }

    // ההגדרות מהאפליקציה נשמרות כדי שהשירות יקרא אותן גם כשהאפליקציה סגורה
    Function("setConfig") { enabled: Boolean, hide: Boolean, funny: Boolean, funnyList: String ->
      context.getSharedPreferences(MashovNotificationService.PREFS, Context.MODE_PRIVATE).edit()
        .putBoolean("enabled", enabled)
        .putBoolean("hide", hide)
        .putBoolean("funny", funny)
        .putString("funnyList", funnyList)
        .apply()
    }
  }
}
