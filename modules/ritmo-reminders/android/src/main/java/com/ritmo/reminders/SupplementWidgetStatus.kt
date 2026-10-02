package com.ritmo.reminders

import java.util.Calendar
import java.util.TimeZone

data class DailySupplement(val id: String, val name: String, val takenOn: Set<String>)
data class SupplementWidgetStatus(val title: String, val progress: String, val rows: List<String>, val footer: String, val allDone: Boolean)

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

fun supplementWidgetStatus(items: List<DailySupplement>, now: Long, zone: TimeZone = TimeZone.getDefault()): SupplementWidgetStatus {
  if (items.isEmpty()) return SupplementWidgetStatus("Seu hábito começa aqui", "Nenhum suplemento cadastrado", listOf("Cadastre seus suplementos no Ritmo."), "Toque para começar →", false)
  val today = localDay(now, zone)
  val done = items.count { today in it.takenOn }
  val ordered = items.sortedBy { today in it.takenOn }
  val rows = ordered.take(3).map {
    val streak = supplementStreak(it, now, zone)
    "${if (today in it.takenOn) "✓" else "○"} ${it.name} · $streak ${if (streak == 1) "dia" else "dias"}"
  }
  return SupplementWidgetStatus(
    if (done == items.size) "Tudo em dia!" else "Seus hábitos de hoje",
    "$done de ${items.size} tomados hoje", rows,
    if (items.size > 3) "+${items.size - 3} no app · toque para registrar →" else "Toque para registrar no Ritmo →",
    done == items.size
  )
}
