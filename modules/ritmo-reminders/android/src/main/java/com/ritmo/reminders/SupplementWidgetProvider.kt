package com.ritmo.reminders

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.view.View
import android.widget.RemoteViews
import org.json.JSONArray
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class SupplementWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) = refresh(context)
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
        SupplementWidgetStatus("Abra o Ritmo", "Vamos atualizar seus suplementos", emptyList(), "Toque para continuar →", false)
      }
      val views = RemoteViews(context.packageName, R.layout.ritmo_supplements_widget).apply {
        setTextViewText(R.id.supplement_widget_date, SimpleDateFormat("dd/MM", Locale.forLanguageTag("pt-BR")).format(Date()))
        setTextViewText(R.id.supplement_widget_title, status.title)
        setTextViewText(R.id.supplement_widget_progress, status.progress)
        setTextViewText(R.id.supplement_widget_footer, status.footer)
        val rowIds = listOf(R.id.supplement_widget_row1, R.id.supplement_widget_row2, R.id.supplement_widget_row3)
        rowIds.forEachIndexed { index, id ->
          setViewVisibility(id, if (index < status.rows.size) View.VISIBLE else View.GONE)
          setTextViewText(id, status.rows.getOrElse(index) { "" })
        }
        setTextViewText(R.id.supplement_widget_badge, if (status.allDone) "✓" else "○")
        setContentDescription(R.id.supplement_widget_badge, if (status.allDone) "Todos os suplementos tomados hoje" else "Suplementos pendentes")
        val open = Intent(Intent.ACTION_VIEW, Uri.parse("ritmo://suplementos")).setPackage(context.packageName).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        setOnClickPendingIntent(R.id.supplement_widget_root, PendingIntent.getActivity(context, 201, open, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))
      }
      manager.updateAppWidget(ids, views)
      val midnight = Calendar.getInstance().apply {
        add(Calendar.DAY_OF_MONTH, 1); set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
      }
      (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).set(AlarmManager.RTC, midnight.timeInMillis, dayIntent(context))
    }
  }
}
