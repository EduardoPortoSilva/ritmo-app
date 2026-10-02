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
    assertEquals("1 de 2 tomados hoje", partial.progress)
    assertEquals("○ Whey · 0 dias", partial.rows[0])
    assertEquals("✓ Creatina · 3 dias", partial.rows[1])
    assertTrue(supplementWidgetStatus(listOf(doneA, b.copy(takenOn = setOf("2026-09-17"))), time(17), zone).allDone)
    assertFalse(supplementWidgetStatus(listOf(a, b), time(17), zone).allDone)
  }

  @Test fun emptyAndLongListsHaveClearNavigation() {
    val empty = supplementWidgetStatus(emptyList(), time(17), zone)
    assertEquals("Seu hábito começa aqui", empty.title)
    assertFalse(empty.allDone)
    val many = supplementWidgetStatus(List(5) { a.copy(id = "$it") }, time(17), zone)
    assertEquals(3, many.rows.size)
    assertTrue(many.footer.startsWith("+2 no app"))
  }
}
