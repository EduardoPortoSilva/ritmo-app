package com.ritmo.rest

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.os.SystemClock
import android.util.Log

/** Keeps a user-started rest cue alive while React Native is paused behind another app. */
class RestCueService : Service() {
  companion object {
    private const val CHANNEL = "ritmo_rest_timer"
    private const val NOTIFICATION_ID = 4201
    private const val EXTRA_DURATION_MS = "durationMs"

    fun start(context: Context, durationMs: Int) {
      val intent = Intent(context, RestCueService::class.java).putExtra(EXTRA_DURATION_MS, durationMs)
      if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(intent)
      else context.startService(intent)
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, RestCueService::class.java))
    }
  }

  private val handler = Handler(Looper.getMainLooper())
  private var finishTask: Runnable? = null
  private var wakeLock: PowerManager.WakeLock? = null
  private var player: MediaPlayer? = null
  private var focusRequest: AudioFocusRequest? = null
  private var legacyFocus = false

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val durationMs = intent?.getIntExtra(EXTRA_DURATION_MS, 0) ?: 0
    if (durationMs !in 1..3_600_000) {
      stopSelf(startId)
      return START_NOT_STICKY
    }
    clearCurrent()
    createChannel()
    val notification = notification(durationMs)
    try {
      if (Build.VERSION.SDK_INT >= 29) {
        startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
      } else {
        startForeground(NOTIFICATION_ID, notification)
      }
    } catch (error: Exception) {
      Log.e("RitmoRestCue", "Could not start foreground rest timer", error)
      stopSelf(startId)
      return START_NOT_STICKY
    }
    val power = getSystemService(Context.POWER_SERVICE) as PowerManager
    wakeLock = power.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Ritmo:restCue").apply {
      setReferenceCounted(false)
      acquire(durationMs.toLong() + 5_000L)
    }
    Log.i("RitmoRestCue", "Rest timer started: ${durationMs}ms")
    val deadline = SystemClock.elapsedRealtime() + durationMs
    val task = Runnable {
      if (SystemClock.elapsedRealtime() >= deadline) playCue()
      else handler.postDelayed(finishTask ?: return@Runnable, deadline - SystemClock.elapsedRealtime())
    }
    finishTask = task
    handler.postDelayed(task, durationMs.toLong())
    return START_NOT_STICKY
  }

  private fun createChannel() {
    if (Build.VERSION.SDK_INT >= 26) {
      val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      manager.createNotificationChannel(NotificationChannel(CHANNEL, "Descanso do treino", NotificationManager.IMPORTANCE_LOW).apply {
        description = "Mantem o aviso sonoro do descanso ativo quando outro app estiver aberto."
        setSound(null, null)
      })
    }
  }

  private fun notification(durationMs: Int): Notification {
    val launch = packageManager.getLaunchIntentForPackage(packageName)
    val openApp = launch?.let {
      PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }
    val builder = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, CHANNEL) else Notification.Builder(this)
    return builder
      .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setContentTitle("Descanso em andamento")
      .setContentText("O Ritmo vai avisar quando terminar.")
      .setContentIntent(openApp)
      .setOngoing(true)
      .setWhen(System.currentTimeMillis() + durationMs)
      .setUsesChronometer(true)
      .setChronometerCountDown(true)
      .setCategory(Notification.CATEGORY_SERVICE)
      .build()
  }

  private fun playCue() {
    finishTask = null
    Log.i("RitmoRestCue", "Rest timer finished; playing cue")
    val manager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
    val attributes = AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_MEDIA)
      .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
      .build()
    try {
      if (Build.VERSION.SDK_INT >= 26) {
        focusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
          .setAudioAttributes(attributes)
          .setOnAudioFocusChangeListener { }
          .build()
        manager.requestAudioFocus(focusRequest!!)
      } else {
        @Suppress("DEPRECATION")
        val result = manager.requestAudioFocus(null, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
        legacyFocus = result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
      }
    } catch (error: Exception) {
      Log.w("RitmoRestCue", "Audio focus unavailable; playing cue without ducking", error)
      focusRequest = null
      legacyFocus = false
    }
    try {
      val sound = MediaPlayer()
      player = sound
      sound.setAudioAttributes(attributes)
      val source = resources.openRawResourceFd(R.raw.ritmo_rest_cue)
      try {
        sound.setDataSource(source.fileDescriptor, source.startOffset, source.length)
      } finally {
        source.close()
      }
      sound.setOnCompletionListener { stopSelf() }
      sound.setOnErrorListener { _, _, _ -> stopSelf(); true }
      sound.prepare()
      sound.start()
    } catch (_: Exception) {
      stopSelf()
    }
  }

  private fun clearCurrent() {
    finishTask?.let(handler::removeCallbacks)
    finishTask = null
    player?.runCatching { stop() }
    player?.release()
    player = null
    val manager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
    if (Build.VERSION.SDK_INT >= 26) {
      focusRequest?.let(manager::abandonAudioFocusRequest)
    } else if (legacyFocus) {
      @Suppress("DEPRECATION")
      manager.abandonAudioFocus(null)
    }
    focusRequest = null
    legacyFocus = false
    wakeLock?.let { if (it.isHeld) it.release() }
    wakeLock = null
  }

  override fun onDestroy() {
    Log.i("RitmoRestCue", "Rest timer stopped")
    clearCurrent()
    super.onDestroy()
  }
}
