package com.ritmo.widget

import org.junit.Assert.*
import org.junit.Test
import java.util.Calendar
import java.util.TimeZone

class WidgetStatusTest {
  private val zone = TimeZone.getTimeZone("America/Sao_Paulo")
  private fun time(day: Int, hour: Int = 12, minute: Int = 0) = Calendar.getInstance(zone).apply {
    clear()
    set(2026, Calendar.SEPTEMBER, day, hour, minute)
  }.timeInMillis
  private val a = ScheduledRoutine("a", "Treino A", listOf(1, 3))
  private val b = ScheduledRoutine("b", "Treino B", listOf(1))

  @Test fun pendingBecomesHappyOnlyAfterScheduledRoutineFinishesToday() {
    val now = time(14)
    assertEquals("sad", widgetStatus(listOf(a), emptyList(), now, zone).mood)
    assertEquals("sad", widgetStatus(listOf(a), listOf(Completion("b", now)), now, zone).mood)
    assertEquals("sad", widgetStatus(listOf(a), listOf(Completion("a", time(13, 23, 59))), now, zone).mood)
    assertEquals("happy", widgetStatus(listOf(a), listOf(Completion("a", now)), now, zone).mood)
    // Removing a saved workout returns to pending.
    assertEquals("sad", widgetStatus(listOf(a), emptyList(), now, zone).mood)
  }

  @Test fun multipleRoutinesRequireAllAndRepeatedSessionsCountOnce() {
    val now = time(14)
    val done = listOf(Completion("a", now), Completion("a", now + 1000))
    val partial = widgetStatus(listOf(a, b), done, now, zone)
    assertEquals("sad", partial.mood)
    assertEquals("Treino B", partial.detail)
    assertEquals("1 de 2 treinos feitos hoje", partial.progress)
    assertEquals("happy", widgetStatus(listOf(a, b), done + Completion("b", now), now, zone).mood)
  }

  @Test fun localMidnightAndNextWeekDoNotReuseCompletion() {
    // 23:59 in Brazil is already tomorrow in UTC.
    val lateMonday = time(14, 23, 59)
    assertEquals("happy", widgetStatus(listOf(a), listOf(Completion("a", lateMonday)), lateMonday, zone).mood)
    assertEquals("sad", widgetStatus(listOf(a), listOf(Completion("a", time(15, 0))), lateMonday, zone).mood)
    assertEquals("happy", widgetStatus(listOf(a), listOf(Completion("a", time(14, 0))), time(14, 0), zone).mood)
    assertEquals("rest", widgetStatus(listOf(a), listOf(Completion("a", lateMonday)), time(15, 0), zone).mood)
    assertEquals("sad", widgetStatus(listOf(a), listOf(Completion("a", lateMonday)), time(21), zone).mood)
  }

  @Test fun timezoneChangeUsesCurrentLocalDay() {
    val now = time(14, 23, 59)
    val done = listOf(Completion("a", now))
    assertEquals("happy", widgetStatus(listOf(a), done, now, zone).mood)
    assertEquals("rest", widgetStatus(listOf(a), done, now, TimeZone.getTimeZone("UTC")).mood)
  }

  @Test fun restSetupSundayAndScheduleEdits() {
    assertEquals("Vamos combinar?", widgetStatus(emptyList(), emptyList(), time(14), zone).title)
    assertEquals("Hoje é descanso", widgetStatus(listOf(a), emptyList(), time(15), zone).title)
    val sunday = a.copy(weekdays = listOf(0))
    assertEquals("sad", widgetStatus(listOf(sunday), emptyList(), time(20), zone).mood)
    assertEquals("rest", widgetStatus(listOf(sunday), emptyList(), time(14), zone).mood)
  }
}
