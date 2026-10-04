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
    val finished = widgetStatus(listOf(a), listOf(Completion("a", now)), now, zone)
    assertEquals("happy", finished.mood)
    assertEquals("1/1", finished.count)
    assertEquals("Treino conclu\u00eddo", finished.summary)
    assertEquals("Conclu\u00eddo", finished.portraitSummary)
    // Removing a saved workout returns to pending.
    assertEquals("sad", widgetStatus(listOf(a), emptyList(), now, zone).mood)
  }

  @Test fun multipleRoutinesRequireAllAndRepeatedSessionsCountOnce() {
    val now = time(14)
    val done = listOf(Completion("a", now), Completion("a", now + 1000))
    val partial = widgetStatus(listOf(a, b), done, now, zone)
    assertEquals("sad", partial.mood)
    assertEquals("Treino B", partial.summary)
    assertEquals("1/2", partial.count)
    assertEquals("happy", widgetStatus(listOf(a, b), done + Completion("b", now), now, zone).mood)
    val pending = widgetStatus(listOf(a, b), emptyList(), now, zone)
    assertEquals("Treino A", pending.summary)
    assertEquals("+1", pending.extra)
    assertEquals("Treino A", pending.portraitSummary)
    assertEquals("0/2", pending.count)
  }

  @Test fun longNamesKeepRemainingCountVisibleWhenNarrow() {
    val long = a.copy(name = "Treino extremamente detalhado de sexta")
    val status = widgetStatus(listOf(long, b), emptyList(), time(14), zone)
    assertEquals("Treino extremamente deta\u2026", status.summary)
    assertEquals(status.summary, status.narrowSummary)
    assertEquals("+1", status.extra)
    assertEquals("Treino extremame\u2026", status.portraitSummary)
  }

  @Test fun localMidnightAndNextWeekDoNotReuseCompletion() {
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
    assertEquals("Programe seus treinos", widgetStatus(emptyList(), emptyList(), time(14), zone).summary)
    assertEquals("Hoje \u00e9 descanso", widgetStatus(listOf(a), emptyList(), time(15), zone).summary)
    assertEquals("Descanso", widgetStatus(listOf(a), emptyList(), time(15), zone).portraitSummary)
    val sunday = a.copy(weekdays = listOf(0))
    assertEquals("sad", widgetStatus(listOf(sunday), emptyList(), time(20), zone).mood)
    assertEquals("rest", widgetStatus(listOf(sunday), emptyList(), time(14), zone).mood)
  }
}
