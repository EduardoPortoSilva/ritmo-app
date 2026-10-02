package com.ritmo.rest

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class RitmoRestModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("RitmoRest")
    Function("start") { durationMs: Int ->
      require(durationMs in 1..3_600_000) { "Duracao de descanso invalida." }
      RestCueService.start(requireNotNull(appContext.reactContext), durationMs)
    }
    Function("stop") { RestCueService.stop(requireNotNull(appContext.reactContext)) }
  }
}
