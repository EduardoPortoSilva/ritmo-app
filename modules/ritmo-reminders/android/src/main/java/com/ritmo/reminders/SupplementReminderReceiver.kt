package com.ritmo.reminders

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class SupplementReminderReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    try {
      if (intent.action == SupplementReminders.ACTION) {
        intent.getStringExtra("supplementId")?.let { SupplementReminders.deliver(context, it) }
      } else SupplementReminders.refresh(context)
    } catch (error: Exception) {
      Log.e("RitmoReminders", "Não foi possível atualizar os lembretes.", error)
    }
  }
}
