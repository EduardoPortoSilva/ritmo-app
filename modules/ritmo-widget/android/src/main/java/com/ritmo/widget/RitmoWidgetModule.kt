package com.ritmo.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class RitmoWidgetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("RitmoWidget")
    Function("sync") { snapshot: String ->
      val context = requireNotNull(appContext.reactContext)
      // Validate before replacing the last useful snapshot.
      WidgetStore.parse(snapshot)
      val prefs = context.getSharedPreferences(WidgetStore.PREFS, 0)
      if (prefs.getString(WidgetStore.KEY, null) != snapshot) {
        check(prefs.edit().putString(WidgetStore.KEY, snapshot).commit()) {
          "Não foi possível salvar os dados do widget."
        }
      }
      RitmoWidgetProvider.refresh(context)
    }
    AsyncFunction("requestPin") {
      val context = requireNotNull(appContext.reactContext)
      val manager = AppWidgetManager.getInstance(context)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && manager.isRequestPinAppWidgetSupported) {
        manager.requestPinAppWidget(ComponentName(context, RitmoWidgetProvider::class.java), null, null)
      } else false
    }
  }
}
