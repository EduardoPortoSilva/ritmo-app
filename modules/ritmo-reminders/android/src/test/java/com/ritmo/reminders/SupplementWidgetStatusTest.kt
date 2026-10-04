package com.ritmo.reminders

import org.junit.Assert.*
import org.junit.Test
import java.util.Calendar
import java.util.TimeZone

class SupplementWidgetStatusTest {
  private val zone = TimeZone.getTimeZone("America/Sao_Paulo")
  private fun time(day: Int) = Calendar.getInstance(zone).apply { clear(); set(2026, Calendar.SEPTEMBER, day, 12, 0) }.timeInMillis
  private val a = DailySupplement("a", "Creatina", setOf("2026-09-15", "2026-09-16"))
  private val b = DailySupplement("b", "Whey", emptySet())

  @Test fun eachStreakKeepsYesterdayUntilTodayEnds() {
    assertEquals(2, supplementStreak(a, time(17), zone))
    assertEquals(0, supplementStreak(a, time(18), zone))
    val done = a.copy(takenOn = a.takenOn + "2026-09-17")
    assertEquals(3, supplementStreak(done, time(17), zone))
    assertEquals(3, supplementStreak(done, time(18), zone))
    assertEquals(0, supplementStreak(done, time(19), zone))
  }

  @Test fun widgetShowsPendingFirstAndOnlyAllDoneCompletesDay() {
    val doneA = a.copy(takenOn = a.takenOn + "2026-09-17")
    val partial = supplementWidgetStatus(listOf(doneA, b), time(17), zone)
    assertFalse(partial.allDone)
    assertEquals("1/2", partial.count)
    assertEquals("Faltam: Whey", partial.summary)
    assertEquals("Whey", partial.portraitSummary)
    val finished = supplementWidgetStatus(listOf(doneA, b.copy(takenOn = setOf("2026-09-17"))), time(17), zone)
    assertTrue(finished.allDone)
    assertEquals("2/2", finished.count)
    assertEquals("Tudo em dia!", finished.summary)
    assertEquals("Em dia!", finished.portraitSummary)
    assertFalse(supplementWidgetStatus(listOf(a, b), time(17), zone).allDone)
  }

  @Test fun multiplePendingNamesStayReadable() {
    val two = supplementWidgetStatus(listOf(a, b), time(17), zone)
    assertEquals("Faltam: Creatina e Whey", two.summary)
    assertEquals("Faltam: Creatina", two.narrowSummary)
    assertEquals("", two.extra)
    assertEquals("+1", two.narrowExtra)
    assertEquals("Creatina", two.portraitSummary)
    val many = supplementWidgetStatus(List(5) { a.copy(id = "$it", name = "Suplemento com nome extremamente comprido") }, time(17), zone)
    assertEquals("Faltam: Suplemento com nom\u2026", many.summary)
    assertEquals("Faltam: Suplemento\u2026", many.narrowSummary)
    assertEquals("+4", many.extra)
    assertEquals("+4", many.narrowExtra)
    assertEquals("Suplemento com n\u2026", many.portraitSummary)
  }

  @Test fun emptyListHasClearNavigation() {
    val empty = supplementWidgetStatus(emptyList(), time(17), zone)
    assertEquals("Cadastre suplementos", empty.summary)
    assertEquals("Sem cadastro", empty.portraitSummary)
    assertFalse(empty.allDone)
  }
}
