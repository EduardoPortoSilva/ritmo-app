package com.ritmo.widget

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.RemoteViews
import java.util.Calendar

class RitmoWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) = refresh(context)

  override fun onAppWidgetOptionsChanged(context: Context, manager: AppWidgetManager, id: Int, newOptions: Bundle?) {
    super.onAppWidgetOptionsChanged(context, manager, id, newOptions)
    refresh(context)
  }

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    if (intent.action in setOf(
        DAY_CHANGED, Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_DATE_CHANGED,
        Intent.ACTION_TIME_CHANGED, Intent.ACTION_TIMEZONE_CHANGED, Intent.ACTION_MY_PACKAGE_REPLACED
      )) refresh(context)
  }

  override fun onDisabled(context: Context) {
    (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).cancel(dayIntent(context))
  }

  companion object {
    private const val DAY_CHANGED = "com.ritmo.widget.DAY_CHANGED"

    private fun dayIntent(context: Context) = PendingIntent.getBroadcast(
      context, 100, Intent(context, RitmoWidgetProvider::class.java).setAction(DAY_CHANGED),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    fun refresh(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      val ids = manager.getAppWidgetIds(ComponentName(context, RitmoWidgetProvider::class.java))
      if (ids.isEmpty()) return
      val raw = context.getSharedPreferences(WidgetStore.PREFS, 0).getString(WidgetStore.KEY, null)
      val status = try {
        if (raw == null) WidgetStatus("rest", "\u2014", "Abra o Ritmo")
        else WidgetStore.parse(raw).let { (routines, completions) -> widgetStatus(routines, completions) }
      } catch (_: Exception) {
        WidgetStatus("rest", "\u2014", "Abra o Ritmo")
      }
      ids.forEach { id ->
        val options = manager.getAppWidgetOptions(id)
        val width = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 250)
        val portrait = width < 180
        val short = portrait && options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 54) < 120
        val summary = if (portrait) status.portraitSummary else if (width < 300) status.narrowSummary else status.summary
        val layout = if (portrait) R.layout.ritmo_widget_portrait else R.layout.ritmo_widget
        val views = RemoteViews(context.packageName, layout).apply {
          setTextViewText(R.id.widget_count, status.count)
          setTextViewText(R.id.widget_summary, summary)
          setViewVisibility(R.id.widget_summary, if (short) View.GONE else View.VISIBLE)
          setTextViewText(R.id.widget_extra, status.extra)
          setViewVisibility(R.id.widget_extra, if (short || status.extra.isEmpty()) View.GONE else View.VISIBLE)
          setImageViewResource(R.id.widget_status_dot, when (status.mood) {
            "happy" -> R.drawable.ritmo_dot_done
            "sad" -> R.drawable.ritmo_dot_pending
            else -> R.drawable.ritmo_dot_rest
          })
          setContentDescription(R.id.widget_root, "Treinos: ${status.count}. ${status.summary}${if (status.extra.isEmpty()) "" else " ${status.extra}"}. Toque para abrir o Ritmo.")
          context.packageManager.getLaunchIntentForPackage(context.packageName)?.let { intent ->
            setOnClickPendingIntent(R.id.widget_root, PendingIntent.getActivity(
              context, 101, intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
              PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            ))
          }
        }
        manager.updateAppWidget(id, views)
      }
      // No exact-alarm permission or background JS. Android may defer this in
      // power saving; periodic app-widget updates also recompute the local day.
      val midnight = Calendar.getInstance().apply {
        add(Calendar.DAY_OF_MONTH, 1)
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
      }
      (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager)
        .set(AlarmManager.RTC, midnight.timeInMillis, dayIntent(context))
    }
  }
}
