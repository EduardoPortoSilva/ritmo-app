package com.ritmo.reminders

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import org.json.JSONArray

object SupplementReminders {
  private const val PREFS = "ritmo_supplement_reminders"
  private const val SNAPSHOT = "snapshot"
  private const val CHANNEL = "daily_supplements"
  const val ACTION = "com.ritmo.reminders.SUPPLEMENT_DUE"
  private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
  private fun notifications(context: Context) = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

  fun prepare(context: Context) {
    if (Build.VERSION.SDK_INT >= 26) {
      notifications(context).createNotificationChannel(NotificationChannel(CHANNEL, "Suplementos diários", NotificationManager.IMPORTANCE_DEFAULT).apply {
        description = "Um lembrete por suplemento no horário escolhido."
      })
    }
  }

  fun enabled(context: Context): Boolean {
    val manager = notifications(context)
    return manager.areNotificationsEnabled() && (Build.VERSION.SDK_INT < 26 || manager.getNotificationChannel(CHANNEL)?.importance != NotificationManager.IMPORTANCE_NONE)
  }

  fun parse(raw: String): List<SupplementReminder> {
    val data = JSONArray(raw)
    return List(data.length()) { index ->
      val item = data.getJSONObject(index)
      val time = item.getString("time")
      require(Regex("(?:[01]\\d|2[0-3]):[0-5]\\d").matches(time))
      val days = item.getJSONArray("takenOn")
      SupplementReminder(item.getString("id"), item.getString("name"), time, List(days.length()) { days.getString(it) }.toSet())
    }
  }

  private fun alarmIntent(context: Context, id: String) = PendingIntent.getBroadcast(
    context, 0, Intent(context, SupplementReminderReceiver::class.java).apply {
      action = ACTION
      data = Uri.Builder().scheme("ritmo").authority("supplement-reminder").appendPath(id).build()
      putExtra("supplementId", id)
    }, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
  )

  private fun schedule(context: Context, reminder: SupplementReminder, now: Long) {
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, nextReminderAt(reminder, now), alarmIntent(context, reminder.id))
  }

  @Synchronized fun sync(context: Context, raw: String, force: Boolean) {
    val reminders = parse(raw)
    val preferences = prefs(context)
    val previous = preferences.getString(SNAPSHOT, "[]")!!
    if (!force && previous == raw && !preferences.getBoolean("needsRefresh", false)) return
    val old = runCatching { parse(previous) }.getOrDefault(emptyList())
    check(preferences.edit().putString(SNAPSHOT, raw).putBoolean("needsRefresh", true).commit()) { "Não foi possível salvar os lembretes." }
    prepare(context)
    val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    old.filter { item -> reminders.none { it.id == item.id } }.forEach {
      manager.cancel(alarmIntent(context, it.id))
      notifications(context).cancel(it.id, 1)
      preferences.edit().remove("notified:${it.id}").apply()
    }
    val now = System.currentTimeMillis()
    reminders.forEach { item ->
      if (localDay(now) in item.takenOn || old.any { it.id == item.id && (it.time != item.time || it.name != item.name) }) {
        notifications(context).cancel(item.id, 1)
      }
      schedule(context, item, now)
    }
    preferences.edit().putBoolean("needsRefresh", false).apply()
  }

  @Synchronized fun refresh(context: Context) {
    sync(context, prefs(context).getString(SNAPSHOT, "[]")!!, true)
  }

  @Synchronized fun deliver(context: Context, id: String) {
    val preferences = prefs(context)
    val reminder = parse(preferences.getString(SNAPSHOT, "[]")!!).find { it.id == id } ?: return
    val now = System.currentTimeMillis()
    // Always schedule the next local occurrence, even if permission was revoked.
    schedule(context, reminder, now)
    if (!enabled(context) || !shouldNotify(reminder, preferences.getString("notified:$id", null), now)) return
    prepare(context)
    val open = PendingIntent.getActivity(context, 0,
      Intent(Intent.ACTION_VIEW, Uri.parse("ritmo://suplementos")).setPackage(context.packageName)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val builder = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(context, CHANNEL) else Notification.Builder(context)
    val notification = builder
      .setSmallIcon(R.drawable.ritmo_supplement_notification)
      .setContentTitle("Hora de ${reminder.name}")
      .setContentText("Já tomou hoje? Abra o Ritmo e registre para manter sua sequência.")
      .setStyle(Notification.BigTextStyle().bigText("Já tomou hoje? Abra o Ritmo e registre para manter sua sequência."))
      .setContentIntent(open).setAutoCancel(true).setCategory(Notification.CATEGORY_REMINDER)
      .setVisibility(Notification.VISIBILITY_PRIVATE).build()
    try {
      notifications(context).notify(id, 1, notification)
      preferences.edit().putString("notified:$id", localDay(now)).commit()
    } catch (_: SecurityException) {
      // Permission may change between the check and delivery. Keep tomorrow's alarm.
    }
  }
}
