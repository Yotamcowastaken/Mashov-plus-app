package expo.modules.mashovlistener

import android.content.Context
import android.content.Intent
import android.provider.Settings
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
