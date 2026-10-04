package com.ritmo.reminders

import java.util.Calendar
import java.util.TimeZone

data class DailySupplement(val id: String, val name: String, val takenOn: Set<String>)
data class SupplementWidgetStatus(val count: String, val summary: String, val narrowSummary: String = summary, val extra: String = "", val narrowExtra: String = extra, val allDone: Boolean, val portraitSummary: String = summary)

fun supplementStreak(item: DailySupplement, now: Long, zone: TimeZone = TimeZone.getDefault()): Int {
  val day = Calendar.getInstance(zone).apply { timeInMillis = now; set(Calendar.HOUR_OF_DAY, 12) }
  if (localDay(day.timeInMillis, zone) !in item.takenOn) day.add(Calendar.DAY_OF_MONTH, -1)
  var count = 0
  while (localDay(day.timeInMillis, zone) in item.takenOn) {
    count++
    day.add(Calendar.DAY_OF_MONTH, -1)
  }
  return count
}

private fun shortName(name: String, limit: Int): String =
  if (name.length > limit) name.take(limit).trimEnd() + "\u2026" else name

fun supplementWidgetStatus(items: List<DailySupplement>, now: Long, zone: TimeZone = TimeZone.getDefault()): SupplementWidgetStatus {
  if (items.isEmpty()) return SupplementWidgetStatus("\u2014", "Cadastre suplementos", allDone = false, portraitSummary = "Sem cadastro")
  val today = localDay(now, zone)
  val pending = items.filter { today !in it.takenOn }.map { it.name }
  val count = "${items.size - pending.size}/${items.size}"
  if (pending.isEmpty()) return SupplementWidgetStatus(count, "Tudo em dia!", allDone = true, portraitSummary = "Em dia!")
  val showBoth = pending.size == 2 && pending.sumOf { it.length } <= 24
  val summary = if (showBoth) "Faltam: ${pending[0]} e ${pending[1]}" else "Faltam: ${shortName(pending.first(), 18)}"
  return SupplementWidgetStatus(
    count, summary, "Faltam: ${shortName(pending.first(), 10)}",
    if (pending.size > 1 && !showBoth) "+${pending.size - 1}" else "",
    if (pending.size > 1) "+${pending.size - 1}" else "", false, shortName(pending.first(), 16)
  )
}
