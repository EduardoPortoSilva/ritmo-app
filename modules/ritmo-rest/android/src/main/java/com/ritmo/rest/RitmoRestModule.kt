package com.ritmo.rest

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray

class RitmoRestModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("RitmoRest")
    Function("start") { durationMs: Int ->
      require(durationMs in 1..3_600_000) { "Duracao de descanso invalida." }
      RestCueService.start(requireNotNull(appContext.reactContext), durationMs)
    }
    Function("stop") { RestCueService.stop(requireNotNull(appContext.reactContext)) }
    Function("startCardio") { delaysJson: String, durationMs: Int ->
      require(durationMs in 1..14_400_000) { "Duracao de cardio invalida." }
      val json = JSONArray(delaysJson)
      require(json.length() <= 49) { "Muitos avisos de cardio." }
      val delays = IntArray(json.length()) { index ->
        json.getInt(index).also { require(it in 1..durationMs) { "Aviso de cardio invalido." } }
      }
      CardioCueService.start(requireNotNull(appContext.reactContext), delays, durationMs)
    }
    Function("stopCardio") { CardioCueService.stop(requireNotNull(appContext.reactContext)) }
  }
}
