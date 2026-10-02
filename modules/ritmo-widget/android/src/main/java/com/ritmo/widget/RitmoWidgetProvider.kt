package com.ritmo.widget

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class RitmoWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) = refresh(context)

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
        if (raw == null) WidgetStatus("rest", "Olá, vamos treinar?", "Abra o Ritmo para carregar suas rotinas.", "Seu treino, um dia de cada vez")
        else WidgetStore.parse(raw).let { (routines, completions) -> widgetStatus(routines, completions) }
      } catch (_: Exception) {
        WidgetStatus("rest", "Abra o Ritmo", "Vamos atualizar seus treinos por aqui.", "Toque para continuar")
      }
      val views = RemoteViews(context.packageName, R.layout.ritmo_widget).apply {
        setTextViewText(R.id.widget_date, SimpleDateFormat("EEE, dd/MM", Locale.forLanguageTag("pt-BR")).format(Date()))
        setTextViewText(R.id.widget_title, status.title)
        setTextViewText(R.id.widget_detail, status.detail)
        setTextViewText(R.id.widget_progress, status.progress)
        setImageViewResource(R.id.widget_face, when (status.mood) {
          "happy" -> R.drawable.ritmo_face_happy
          "sad" -> R.drawable.ritmo_face_sad
          else -> R.drawable.ritmo_face_rest
        })
        setContentDescription(R.id.widget_face, when (status.mood) {
          "happy" -> "Carinha feliz: treinos de hoje concluídos"
          "sad" -> "Carinha triste: esperando os treinos de hoje"
          else -> "Carinha tranquila"
        })
        context.packageManager.getLaunchIntentForPackage(context.packageName)?.let { intent ->
          setOnClickPendingIntent(R.id.widget_root, PendingIntent.getActivity(
            context, 101, intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
          ))
        }
      }
      manager.updateAppWidget(ids, views)
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
