package com.ritmo.reminders

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.RemoteViews
import org.json.JSONArray
import java.util.Calendar

class SupplementWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) = refresh(context)
  override fun onAppWidgetOptionsChanged(context: Context, manager: AppWidgetManager, id: Int, newOptions: Bundle?) {
    super.onAppWidgetOptionsChanged(context, manager, id, newOptions)
    refresh(context)
  }
  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    if (intent.action in setOf(DAY_CHANGED, Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_DATE_CHANGED, Intent.ACTION_TIME_CHANGED, Intent.ACTION_TIMEZONE_CHANGED, Intent.ACTION_MY_PACKAGE_REPLACED)) refresh(context)
  }
  override fun onDisabled(context: Context) {
    (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).cancel(dayIntent(context))
  }
  companion object {
    private const val PREFS = "ritmo_supplement_widget"
    private const val DAY_CHANGED = "com.ritmo.reminders.WIDGET_DAY_CHANGED"
    private fun dayIntent(context: Context) = PendingIntent.getBroadcast(context, 200,
      Intent(context, SupplementWidgetProvider::class.java).setAction(DAY_CHANGED), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

    private fun parse(raw: String): List<DailySupplement> {
      val data = JSONArray(raw)
      return List(data.length()) { index ->
        val item = data.getJSONObject(index)
        val days = item.getJSONArray("takenOn")
        DailySupplement(item.getString("id"), item.getString("name"), List(days.length()) { days.getString(it) }.toSet())
      }
    }

    fun sync(context: Context, raw: String) {
      parse(raw)
      val prefs = context.getSharedPreferences(PREFS, 0)
      if (prefs.getString("snapshot", null) != raw) check(prefs.edit().putString("snapshot", raw).commit())
      refresh(context)
    }

    fun refresh(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      val ids = manager.getAppWidgetIds(ComponentName(context, SupplementWidgetProvider::class.java))
      if (ids.isEmpty()) return
      val status = try {
        val raw = context.getSharedPreferences(PREFS, 0).getString("snapshot", "[]")!!
        supplementWidgetStatus(parse(raw), System.currentTimeMillis())
      } catch (_: Exception) {
        SupplementWidgetStatus("\u2014", "Abra o Ritmo", allDone = false)
      }
      ids.forEach { id ->
        val options = manager.getAppWidgetOptions(id)
        val width = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 250)
        val portrait = width < 180
        val short = portrait && options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 54) < 120
        val layout = if (portrait) R.layout.ritmo_supplements_widget_portrait else R.layout.ritmo_supplements_widget
        val views = RemoteViews(context.packageName, layout).apply {
          setTextViewText(R.id.supplement_widget_count, status.count)
          setTextViewText(R.id.supplement_widget_summary, if (portrait) status.portraitSummary else if (width < 300) status.narrowSummary else status.summary)
          setViewVisibility(R.id.supplement_widget_summary, if (short) View.GONE else View.VISIBLE)
          val extra = if (portrait || width < 300) status.narrowExtra else status.extra
          setTextViewText(R.id.supplement_widget_extra, extra)
          setViewVisibility(R.id.supplement_widget_extra, if (short || extra.isEmpty()) View.GONE else View.VISIBLE)
          setContentDescription(R.id.supplement_widget_root, "Suplementos: ${status.count}. ${status.summary}. Toque para abrir suplementos no Ritmo.")
          val open = Intent(Intent.ACTION_VIEW, Uri.parse("ritmo://suplementos")).setPackage(context.packageName).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
          setOnClickPendingIntent(R.id.supplement_widget_root, PendingIntent.getActivity(context, 201, open, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))
        }
        manager.updateAppWidget(id, views)
      }
      val midnight = Calendar.getInstance().apply {
        add(Calendar.DAY_OF_MONTH, 1); set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
      }
      (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).set(AlarmManager.RTC, midnight.timeInMillis, dayIntent(context))
    }
  }
}
