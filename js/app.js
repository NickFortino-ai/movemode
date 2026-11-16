/* ============================================================================
   app.js — STARTUP, NAVIGATION, AND MODE SWITCHING
   ============================================================================
   This is the conductor. It:
     - stamps the site name from config.js into the page
     - applies the saved mode to the <html> element
     - wires up the bottom tab bar and the header mode toggle
     - re-renders every screen whenever saved data changes
     - pops the milestone celebration when a streak hits a milestone

   Load order matters — this file runs last (see the bottom of index.html).
   ========================================================================== */

MM.app = (function () {
  var ui = MM.ui;

  var currentView = 'home';
  var lastRenderedDay = null;   // used to notice the date rolling over

  /* ==========================================================================
     THE SITE NAME (from MM.SITE.name — the single place to rename it)
     ======================================================================== */
  function applySiteName() {
    document.title = MM.SITE.name;
    var nameEl = ui.$('#site-name');
    if (nameEl) nameEl.textContent = MM.SITE.name;
  }

  /* ==========================================================================
     MODE
     ======================================================================== */

  // Put the mode on <html> so every CSS variable swaps, and sync the toggle.
  function applyMode(mode) {
    document.documentElement.setAttribute('data-mode', mode);

    ui.$$('.mode-opt').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.dataset.mode === mode ? 'true' : 'false');
    });

    // Match the phone's browser chrome to the theme.
    // Reading the computed background means we never hard-code the color twice.
    var themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      var bg = window.getComputedStyle(document.body).backgroundColor;
      if (bg) themeMeta.setAttribute('content', bg);
    }
  }

  /* --------------------------------------------------------------------------
     Switching modes changes the look, the wording, AND the default
     difficulty — so the plan gets rebuilt for the new mode.
     The streak, the log, and the profile are untouched.
     -------------------------------------------------------------------------- */
  function setMode(mode) {
    var data = MM.store.get();
    if (data.mode === mode) return;

    var hadPlan = !!data.plan;

    // The flash overlay makes the switch feel deliberate (see theme.css).
    document.body.classList.add('mode-switching');
    window.setTimeout(function () {
      document.body.classList.remove('mode-switching');
    }, 560);

    MM.store.update(function (d) {
      d.mode = mode;
      if (d.plan) d.plan = MM.planBuilder.build(d.profile, mode, d.customDays);
    });

    applyMode(mode);
    MM.onboarding.renderCopy();

    ui.toast(hadPlan
      ? MM.copy('modeName') + ' mode on — plan re-tuned.'
      : MM.copy('modeName') + ' mode on.');
  }

  /* ==========================================================================
     NAVIGATION
     ======================================================================== */
  function showView(name) {
    // Let the screen we're leaving clean up (the quick workout pauses its
    // timer so it isn't ticking away out of sight).
    if (currentView === 'quick' && name !== 'quick' && MM.quickView.onLeave) {
      MM.quickView.onLeave();
    }

    currentView = name;

    ui.$$('.view').forEach(function (view) {
      view.classList.toggle('is-active', view.id === 'view-' + name);
    });

    ui.$$('.nav-btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.dataset.view === name);
    });

    // Starting each screen at the top is what people expect from an app.
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ==========================================================================
     RENDERING
     Every screen redraws whenever the saved data changes. That's simple and
     fast enough here, and it means no screen can ever show stale numbers.
     ======================================================================== */
  function render() {
    // Compute the streak once and hand it to the home screen.
    var streakInfo = MM.streak.refresh();
    lastRenderedDay = MM.dates.today();

    MM.homeView.render(streakInfo);
    MM.myGoalsView.render();
    MM.quickView.render();
    MM.logView.render();
    MM.profileView.render();
    MM.settingsView.render();
    refreshAvatar();

    if (streakInfo.celebrate) {
      showCelebration(streakInfo.celebrate);
    }
  }

  /* ---- Milestone popup, written in the current mode's voice -------------- */
  function showCelebration(milestone) {
    var messages = MM.copy('milestones') || {};
    var message = messages[milestone];
    if (!message) return;

    ui.$('#celebrate-badge').textContent = milestone;
    ui.$('#celebrate-title').textContent = message.title;
    ui.$('#celebrate-body').textContent = message.body;
    ui.openModal('celebrate-modal');
  }

  /* ==========================================================================
     SIGNING IN AND OUT
     ======================================================================== */

  // Keep the little avatar in the header showing whoever is signed in.
  function refreshAvatar() {
    var account = MM.accounts.active();
    var emoji = ui.$('#header-avatar-emoji');
    var button = ui.$('#header-avatar');
    if (!emoji || !button) return;

    emoji.textContent = account ? account.avatar : '👤';
    button.setAttribute('aria-label',
      account ? 'Profile: ' + account.name : 'Your profile');
  }

  // Called by the sign-in screen once a profile is chosen. The store has
  // already been pointed at that profile's data by then.
  function afterSignIn() {
    var data = MM.store.get();

    applyMode(data.mode);
    MM.store.save();          // runs the goal tidy-up for this profile
    showView('home');
    render();

    // A brand-new profile hasn't answered the questions yet.
    if (!data.onboarded) MM.onboarding.open();
  }

  function signOut() {
    MM.accounts.signOut();
    MM.store.reloadFromStorage();
    MM.onboarding.close();
    ui.closeModal();
    MM.signinView.open();
    refreshAvatar();
  }

  /* ==========================================================================
     STARTUP
     ======================================================================== */
  function init() {
    applySiteName();

    // Load the profile list first — everything else depends on knowing whose
    // data to read. This also moves pre-profile saves into a profile.
    MM.accounts.load();

    var data = MM.store.get();
    applyMode(data.mode);

    // Saving once at startup runs the goal tidy-up in storage.js, which makes
    // sure every chosen goal category has a matching progress-bar goal. This
    // matters on a first visit and after an upgrade from the one-goal format.
    MM.store.save();

    // ---- Shared UI ----
    ui.initModals();

    // ---- Header mode toggle ----
    ui.$$('.mode-opt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setMode(btn.dataset.mode);
      });
    });

    // ---- Bottom tab bar ----
    ui.$$('.nav-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        // Tapping the My Goals tab always lands on the list, even if you
        // were last looking at one goal's own page.
        if (btn.dataset.view === 'goals') MM.myGoalsView.backToList();
        showView(btn.dataset.view);
      });
    });

    // ---- The avatar in the header opens the Profile page ----
    ui.$('#header-avatar').addEventListener('click', function () {
      showView('profile');
    });

    // ---- Screens ----
    MM.signinView.init();
    MM.profileView.init();
    MM.onboarding.init();
    MM.goalProgress.init();
    MM.homeView.init();
    MM.workoutEditor.init();
    MM.myGoalsView.init();
    MM.quickView.init();
    MM.logView.init();
    MM.settingsView.init();

    // ---- Redraw on every save ----
    MM.store.onChange(render);

    // ---- If the day rolls over while the app is open, redraw ----
    // (Otherwise someone who leaves the tab open overnight sees yesterday's
    // streak and buttons.)
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && lastRenderedDay !== MM.dates.today()) render();
    });
    window.addEventListener('focus', function () {
      if (lastRenderedDay !== MM.dates.today()) render();
    });

    render();

    // ---- Nobody signed in? Show the sign-in screen first ----
    // A profile with a PIN has to be unlocked on every load, so sign-in also
    // appears when the last person left a locked profile active.
    var account = MM.accounts.active();
    if (!account || account.pin) {
      if (account && account.pin) MM.accounts.signOut();
      MM.signinView.open();
      return;
    }

    // ---- Signed in already, but hasn't answered the questions ----
    if (!data.onboarded) {
      MM.onboarding.open();
    }
  }

  return {
    init: init,
    render: render,
    showView: showView,
    setMode: setMode,
    applyMode: applyMode,
    afterSignIn: afterSignIn,
    signOut: signOut,
    refreshAvatar: refreshAvatar,
  };
})();

// Wait for the DOM before touching it. Because this script sits at the very
// bottom of <body>, the document is usually ready already — but this makes it
// safe if you ever move the script tag into <head>.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', MM.app.init);
} else {
  MM.app.init();
}
