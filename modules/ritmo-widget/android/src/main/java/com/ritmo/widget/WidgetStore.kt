package com.ritmo.widget

import org.json.JSONObject

object WidgetStore {
  const val PREFS = "ritmo_widget"
  const val KEY = "snapshot"

  fun parse(raw: String): Pair<List<ScheduledRoutine>, List<Completion>> {
    val data = JSONObject(raw)
    val routines = data.getJSONArray("routines")
    val completions = data.getJSONArray("completions")
    return List(routines.length()) { index ->
      val routine = routines.getJSONObject(index)
      val days = routine.getJSONArray("weekdays")
      ScheduledRoutine(routine.getString("id"), routine.getString("name"), List(days.length()) { days.getInt(it) })
    } to List(completions.length()) { index ->
      val completion = completions.getJSONObject(index)
      Completion(completion.getString("routineId"), completion.getLong("finishedAt"))
    }
  }
}
