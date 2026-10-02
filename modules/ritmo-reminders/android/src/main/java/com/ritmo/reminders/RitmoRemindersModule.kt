package com.ritmo.reminders

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class RitmoRemindersModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("RitmoReminders")
    Function("sync") { snapshot: String, force: Boolean ->
      SupplementReminders.sync(requireNotNull(appContext.reactContext), snapshot, force)
    }
    Function("prepare") { SupplementReminders.prepare(requireNotNull(appContext.reactContext)) }
    Function("notificationsEnabled") { SupplementReminders.enabled(requireNotNull(appContext.reactContext)) }
    Function("syncWidget") { snapshot: String -> SupplementWidgetProvider.sync(requireNotNull(appContext.reactContext), snapshot) }
    AsyncFunction("requestPinWidget") {
      val context = requireNotNull(appContext.reactContext)
      val manager = AppWidgetManager.getInstance(context)
      if (Build.VERSION.SDK_INT >= 26 && manager.isRequestPinAppWidgetSupported) {
        manager.requestPinAppWidget(ComponentName(context, SupplementWidgetProvider::class.java), null, null)
      } else false
    }
  }
}
