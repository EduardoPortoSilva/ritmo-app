package com.ritmo.widget

import java.util.Calendar
import java.util.TimeZone

data class ScheduledRoutine(val id: String, val name: String, val weekdays: List<Int>)
data class Completion(val routineId: String, val finishedAt: Long)
data class WidgetStatus(val mood: String, val title: String, val detail: String, val progress: String)

// Pure domain code: no Android context, database, or fixed UTC day boundaries.
fun widgetStatus(
  routines: List<ScheduledRoutine>,
  completions: List<Completion>,
  now: Long = System.currentTimeMillis(),
  zone: TimeZone = TimeZone.getDefault()
): WidgetStatus {
  if (routines.none { it.weekdays.isNotEmpty() }) {
    return WidgetStatus("rest", "Vamos combinar?", "Escolha os dias das suas rotinas no app.", "Seu próximo passo começa aqui")
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
  if (today.isEmpty()) {
    return WidgetStatus("rest", "Hoje é descanso", "Nenhum treino programado para hoje.", "Recuperar também faz parte")
  }
  val completedIds = completions.filter {
    it.finishedAt >= start.timeInMillis && it.finishedAt < end.timeInMillis
  }.map { it.routineId }.toSet()
  val pending = today.filter { it.id !in completedIds }
  val completed = today.size - pending.size
  val progress = "$completed de ${today.size} " + if (today.size == 1) "treino feito" else "treinos feitos"
  return if (pending.isEmpty()) {
    WidgetStatus("happy", "Dia concluído!", today.joinToString(" · ") { it.name }, "$progress. Boa!")
  } else {
    WidgetStatus("sad", "Bora treinar?", pending.joinToString(" · ") { it.name }, "$progress hoje")
  }
}
