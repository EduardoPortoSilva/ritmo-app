package com.ritmo.reminders

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

data class SupplementReminder(val id: String, val name: String, val time: String, val takenOn: Set<String>)

fun localDay(now: Long, zone: TimeZone = TimeZone.getDefault()): String =
  SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).apply { timeZone = zone }.format(Date(now))

private fun timeToday(reminder: SupplementReminder, now: Long, zone: TimeZone) =
  Calendar.getInstance(zone).apply {
    timeInMillis = now
    set(Calendar.HOUR_OF_DAY, reminder.time.substring(0, 2).toInt())
    set(Calendar.MINUTE, reminder.time.substring(3, 5).toInt())
    set(Calendar.SECOND, 0)
    set(Calendar.MILLISECOND, 0)
  }

fun nextReminderAt(reminder: SupplementReminder, now: Long, zone: TimeZone = TimeZone.getDefault()): Long {
  val candidate = timeToday(reminder, now, zone)
  if (candidate.timeInMillis <= now || localDay(now, zone) in reminder.takenOn) {
    candidate.add(Calendar.DAY_OF_MONTH, 1)
    // Reapply wall-clock time: do not add a fixed 24-hour duration across DST.
    candidate.set(Calendar.HOUR_OF_DAY, reminder.time.substring(0, 2).toInt())
    candidate.set(Calendar.MINUTE, reminder.time.substring(3, 5).toInt())
  }
  return candidate.timeInMillis
}

fun shouldNotify(reminder: SupplementReminder, lastNotifiedDay: String?, now: Long, zone: TimeZone = TimeZone.getDefault()): Boolean {
  val today = localDay(now, zone)
  return today !in reminder.takenOn && today != lastNotifiedDay && timeToday(reminder, now, zone).timeInMillis <= now
}
