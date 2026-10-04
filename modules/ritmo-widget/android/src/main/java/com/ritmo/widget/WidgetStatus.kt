package com.ritmo.widget

import java.util.Calendar
import java.util.TimeZone

data class ScheduledRoutine(val id: String, val name: String, val weekdays: List<Int>)
data class Completion(val routineId: String, val finishedAt: Long)
data class WidgetStatus(val mood: String, val count: String, val summary: String, val narrowSummary: String = summary, val extra: String = "", val portraitSummary: String = summary)

private fun pendingName(name: String, limit: Int): String =
  if (name.length > limit) name.take(limit).trimEnd() + "\u2026" else name

// Pure domain code: no Android context, database, or fixed UTC day boundaries.
fun widgetStatus(
  routines: List<ScheduledRoutine>,
  completions: List<Completion>,
  now: Long = System.currentTimeMillis(),
  zone: TimeZone = TimeZone.getDefault()
): WidgetStatus {
  if (routines.none { it.weekdays.isNotEmpty() }) {
    return WidgetStatus("rest", "\u2014", "Programe seus treinos", portraitSummary = "Sem treinos")
  }
  val start = Calendar.getInstance(zone).apply {
    timeInMillis = now
    set(Calendar.HOUR_OF_DAY, 0)
    set(Calendar.MINUTE, 0)
    set(Calendar.SECOND, 0)
    set(Calendar.MILLISECOND, 0)
  }
  val weekday = start.get(Calendar.DAY_OF_WEEK) - 1
  val end = (start.clone() as Calendar).apply { add(Calendar.DAY_OF_MONTH, 1) }
  val today = routines.filter { weekday in it.weekdays }.distinctBy { it.id }
  if (today.isEmpty()) return WidgetStatus("rest", "0/0", "Hoje \u00e9 descanso", portraitSummary = "Descanso")
  val completedIds = completions.filter {
    it.finishedAt >= start.timeInMillis && it.finishedAt < end.timeInMillis
  }.map { it.routineId }.toSet()
  val pending = today.filter { it.id !in completedIds }
  val count = "${today.size - pending.size}/${today.size}"
  if (pending.isEmpty()) return WidgetStatus("happy", count, if (today.size == 1) "Treino conclu\u00eddo" else "Treinos conclu\u00eddos", portraitSummary = "Conclu\u00eddo")
  val rest = pending.size - 1
  return WidgetStatus("sad", count, pendingName(pending.first().name, 24), extra = if (rest > 0) "+$rest" else "", portraitSummary = pendingName(pending.first().name, 16))
}
