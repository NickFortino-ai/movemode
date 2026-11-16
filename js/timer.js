/* ============================================================================
   timer.js — A SIMPLE COUNT-UP / COUNT-DOWN TIMER
   ============================================================================
   Used by the Quick Workout screen. It counts elapsed seconds and calls you
   back every tick so the view can redraw.

   Why it tracks a start timestamp instead of just adding 1 every second:
   browsers slow down timers on background tabs, so adding 1 per tick drifts.
   Comparing against the clock stays accurate.

   USAGE
     var t = new MM.Timer({
       totalSeconds: 600,
       onTick: function (elapsed, remaining) { ... },
       onFinish: function () { ... }
     });
     t.start(); t.pause(); t.reset();
   ========================================================================== */

MM.Timer = function (options) {
  var self = this;

  self.totalSeconds = options.totalSeconds || 0;
  self.onTick = options.onTick || function () {};
  self.onFinish = options.onFinish || function () {};

  var intervalId = null;
  var startedAt = null;       // ms timestamp when the current run began
  var accumulated = 0;        // seconds banked from before the last pause

  self.running = false;
  self.finished = false;

  // Seconds elapsed so far, including time before any pauses.
  self.elapsed = function () {
    var live = startedAt ? (Date.now() - startedAt) / 1000 : 0;
    return Math.min(self.totalSeconds, accumulated + live);
  };

  self.remaining = function () {
    return Math.max(0, self.totalSeconds - self.elapsed());
  };

  function tick() {
    var elapsed = self.elapsed();
    self.onTick(elapsed, self.totalSeconds - elapsed);

    if (elapsed >= self.totalSeconds) {
      self.pause();
      self.finished = true;
      self.onFinish();
    }
  }

  self.start = function () {
    if (self.running || self.finished) return;
    self.running = true;
    startedAt = Date.now();
    tick();
    // Four ticks a second keeps the countdown from looking like it skips.
    intervalId = window.setInterval(tick, 250);
  };

  self.pause = function () {
    if (!self.running) return;
    accumulated = self.elapsed();
    startedAt = null;
    self.running = false;
    window.clearInterval(intervalId);
    intervalId = null;
  };

  self.toggle = function () {
    if (self.running) self.pause();
    else self.start();
  };

  self.reset = function () {
    self.pause();
    accumulated = 0;
    startedAt = null;
    self.finished = false;
    self.onTick(0, self.totalSeconds);
  };

  // Call this when leaving the screen so the interval doesn't keep running.
  self.destroy = function () {
    self.pause();
    self.onTick = function () {};
    self.onFinish = function () {};
  };
};

/* ----------------------------------------------------------------------------
   Format seconds for display.
   formatClock(95)  -> "1:35"   (timer display)
   formatLength(95) -> "1 min 35 sec"  (workout descriptions)
   -------------------------------------------------------------------------- */
MM.formatClock = function (totalSeconds) {
  var s = Math.max(0, Math.ceil(totalSeconds));
  var minutes = Math.floor(s / 60);
  var seconds = s % 60;
  return minutes + ':' + (seconds < 10 ? '0' + seconds : seconds);
};

MM.formatLength = function (totalSeconds) {
  var s = Math.round(totalSeconds);
  if (s < 60) return s + ' sec';
  var minutes = Math.floor(s / 60);
  var seconds = s % 60;
  if (seconds === 0) return minutes + ' min';
  return minutes + ' min ' + seconds + ' sec';
};
