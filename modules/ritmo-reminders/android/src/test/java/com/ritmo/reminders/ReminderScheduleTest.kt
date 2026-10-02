package com.ritmo.reminders

import org.junit.Assert.*
import org.junit.Test
import java.util.Calendar
import java.util.TimeZone

class ReminderScheduleTest {
  private val zone = TimeZone.getTimeZone("America/Sao_Paulo")
  private fun time(day: Int, hour: Int, minute: Int = 0) = Calendar.getInstance(zone).apply {
    clear(); set(2026, Calendar.SEPTEMBER, day, hour, minute)
  }.timeInMillis
  private val creatine = SupplementReminder("a", "Creatina", "08:30", emptySet())
  private val whey = SupplementReminder("b", "Whey", "18:00", emptySet())

  @Test fun eachSupplementHasIndependentTimeAndNextDayAfterDue() {
    assertEquals(time(17, 8, 30), nextReminderAt(creatine, time(17, 7), zone))
    assertEquals(time(17, 18), nextReminderAt(whey, time(17, 7), zone))
    assertEquals(time(18, 8, 30), nextReminderAt(creatine, time(17, 8, 30), zone))
    assertEquals(time(18, 8, 30), nextReminderAt(creatine, time(17, 12), zone))
  }

  @Test fun markingTodaySkipsTodayAndUndoRestoresItBeforeDueTime() {
    val taken = creatine.copy(takenOn = setOf("2026-09-17"))
    assertEquals(time(18, 8, 30), nextReminderAt(taken, time(17, 7), zone))
    assertFalse(shouldNotify(taken, null, time(17, 9), zone))
    assertTrue(shouldNotify(taken, null, time(18, 9), zone))
    assertEquals(time(17, 8, 30), nextReminderAt(creatine, time(17, 7), zone))
    assertTrue(shouldNotify(creatine, null, time(17, 9), zone))
  }

  @Test fun noDuplicateNotificationAndNoYesterdayReminderEarlyTomorrow() {
    assertFalse(shouldNotify(creatine, "2026-09-17", time(17, 10), zone))
    assertFalse(shouldNotify(creatine, null, time(18, 6), zone))
    assertTrue(shouldNotify(creatine, "2026-09-17", time(18, 10), zone))
    assertEquals("2026-09-17", localDay(time(17, 23, 59), zone))
  }

  @Test fun timezoneAndDstUseLocalClockInsteadOfFixedDuration() {
    val utc = TimeZone.getTimeZone("UTC")
    assertEquals(time(17, 8, 30) - 3 * 3600000, nextReminderAt(creatine, time(17, 3), utc))
    val ny = TimeZone.getTimeZone("America/New_York")
    val before = Calendar.getInstance(ny).apply { clear(); set(2026, Calendar.MARCH, 7, 9, 0) }.timeInMillis
    val next = Calendar.getInstance(ny).apply { clear(); set(2026, Calendar.MARCH, 8, 8, 30) }.timeInMillis
    assertEquals(next, nextReminderAt(creatine, before, ny))
  }
}
