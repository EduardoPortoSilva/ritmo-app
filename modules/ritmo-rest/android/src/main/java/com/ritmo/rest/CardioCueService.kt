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

/** Plays speed-change warnings even when the cardio screen and React Native are paused. */
class CardioCueService : Service() {
  companion object {
    private const val CHANNEL = "ritmo_cardio_cue"
    private const val NOTIFICATION_ID = 4202
    private const val EXTRA_DELAYS = "delaysMs"
    private const val EXTRA_DURATION = "durationMs"

    fun start(context: Context, delaysMs: IntArray, durationMs: Int) {
      val intent = Intent(context, CardioCueService::class.java)
        .putExtra(EXTRA_DELAYS, delaysMs)
        .putExtra(EXTRA_DURATION, durationMs)
      if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(intent)
      else context.startService(intent)
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, CardioCueService::class.java))
    }
  }

  private val handler = Handler(Looper.getMainLooper())
  private val tasks = mutableListOf<Runnable>()
  private var wakeLock: PowerManager.WakeLock? = null
  private var player: MediaPlayer? = null
  private var focusRequest: AudioFocusRequest? = null
  private var legacyFocus = false

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val durationMs = intent?.getIntExtra(EXTRA_DURATION, 0) ?: 0
    val delays = intent?.getIntArrayExtra(EXTRA_DELAYS) ?: intArrayOf()
    if (durationMs !in 1..14_400_000 || delays.size > 49 || delays.any { it !in 1..durationMs }) {
      stopSelf(startId)
      return START_NOT_STICKY
    }
    clearCurrent()
    createChannel()
    try {
      if (Build.VERSION.SDK_INT >= 29) {
        startForeground(NOTIFICATION_ID, notification(durationMs), ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
      } else {
        startForeground(NOTIFICATION_ID, notification(durationMs))
      }
    } catch (error: Exception) {
      Log.e("RitmoCardioCue", "Could not start foreground cardio timer", error)
      stopSelf(startId)
      return START_NOT_STICKY
    }
    val power = getSystemService(Context.POWER_SERVICE) as PowerManager
    wakeLock = power.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Ritmo:cardioCue").apply {
      setReferenceCounted(false)
      acquire(durationMs.toLong() + 5_000L)
    }
    val startedAt = SystemClock.elapsedRealtime()
    delays.forEach { delay ->
      val deadline = startedAt + delay
      val task = Runnable {
        if (SystemClock.elapsedRealtime() >= deadline) playCue()
      }
      tasks.add(task)
      handler.postDelayed(task, delay.toLong())
    }
    val finish = Runnable { stopSelf(startId) }
    tasks.add(finish)
    handler.postDelayed(finish, durationMs.toLong() + 1_000L)
    Log.i("RitmoCardioCue", "Cardio timer started: ${durationMs}ms, ${delays.size} warnings")
    return START_NOT_STICKY
  }

  private fun createChannel() {
    if (Build.VERSION.SDK_INT >= 26) {
      val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      manager.createNotificationChannel(NotificationChannel(CHANNEL, "Cardio em andamento", NotificationManager.IMPORTANCE_LOW).apply {
        description = "Mantém os avisos de mudança de velocidade ativos em segundo plano."
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
      .setContentTitle("Cardio em andamento")
      .setContentText("O Ritmo vai avisar antes de mudar a velocidade.")
      .setContentIntent(openApp)
      .setOngoing(true)
      .setWhen(System.currentTimeMillis() + durationMs)
      .setUsesChronometer(true)
      .setChronometerCountDown(true)
      .setCategory(Notification.CATEGORY_SERVICE)
      .build()
  }

  private fun playCue() {
    releaseAudio()
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
      Log.w("RitmoCardioCue", "Audio focus unavailable; playing without ducking", error)
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
      sound.setOnCompletionListener { releaseAudio() }
      sound.setOnErrorListener { _, _, _ -> releaseAudio(); true }
      sound.prepare()
      sound.start()
      Log.i("RitmoCardioCue", "Speed-change warning played")
    } catch (error: Exception) {
      Log.e("RitmoCardioCue", "Could not play speed-change warning", error)
      releaseAudio()
    }
  }

  private fun releaseAudio() {
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
  }

  private fun clearCurrent() {
    tasks.forEach(handler::removeCallbacks)
    tasks.clear()
    releaseAudio()
    wakeLock?.let { if (it.isHeld) it.release() }
    wakeLock = null
  }

  override fun onDestroy() {
    clearCurrent()
    super.onDestroy()
  }
}