/* ============================================================================
   views/home.js — THE HOME / STREAK SCREEN
   ============================================================================
   The big streak counter, the "I moved today" and rest day buttons, a few
   quick stats, today's plan workout, and the 30-day heatmap.

   The streak numbers themselves come from js/streak.js — this file only
   decides how to show them.
   ========================================================================== */

MM.homeView = (function () {
  var ui = MM.ui;

  /* --------------------------------------------------------------------------
     Draw the whole screen. `info` is the object returned by
     MM.streak.refresh() — app.js computes it once and hands it to us.
     -------------------------------------------------------------------------- */
  function render(info) {
    var streakInfo = info || MM.streak.refresh();
    var today = MM.dates.today();
    var movedToday = MM.store.isActiveDay(today);
    var restingToday = MM.store.isRestDay(today);

    renderRestartBanner(streakInfo);
    renderStreak(streakInfo, movedToday, restingToday);
    renderButtons(movedToday, restingToday);
    MM.goalProgress.renderHomeGoals();   // the goal progress bars
    renderTodaysPlan(today);
    renderWhy();

    ui.$('#hype-line').textContent = MM.randomHype();
  }

  /* --------------------------------------------------------------------------
     "WHY MOVEMENT MATTERS" — one fact at a time.

     This is the point of the whole site, so it gets a spot on the home
     screen. One fact rather than a wall of them keeps the screen calm, and
     tapping shows another. The facts themselves are in
     js/data/movement-facts.js.
     -------------------------------------------------------------------------- */
  var shownFact = null;

  function renderWhy(nextOne) {
    var host = ui.$('#home-why');
    if (!host) return;

    // Keep the same fact across re-renders (logging a workout shouldn't
    // shuffle the card under you); only change it when asked.
    if (!shownFact || nextOne) {
      shownFact = MM.randomMovementFact(shownFact ? shownFact.fact : null);
    }

    var isMind = shownFact.tag === 'mind';

    // Laid out as a banner across the top of the home screen: the label on
    // the left, the fact in the middle, the hint to tap on the right. On a
    // phone these wrap into a stack.
    host.innerHTML = '' +
      '<div class="why-card" id="why-card">' +
        '<span class="chip ' + (isMind ? 'chip-accent' : '') + ' why-tag">' +
          (isMind ? '🧠 Your mind' : '🫀 Your body') +
        '</span>' +
        '<span class="why-text">' +
          '<span class="why-fact">' + ui.esc(shownFact.fact) + '</span>' +
          '<span class="why-because">' + ui.esc(shownFact.why) + '</span>' +
        '</span>' +
        '<span class="why-more">Tap for another</span>' +
      '</div>' +
      (isMind
        ? '<p class="small faint why-note">' + ui.esc(MM.MOVEMENT_MIND_NOTE) + '</p>'
        : '');
  }

  /* ---- "Your streak broke" message -------------------------------------- */
  function renderRestartBanner(streakInfo) {
    var host = ui.$('#restart-banner');

    if (!streakInfo.restartNotice) {
      host.innerHTML = '';
      return;
    }

    var body = MM.copy('restartBody').replace('{n}', streakInfo.restartNotice);

    host.innerHTML = '' +
      '<div class="banner">' +
        '<h3>' + ui.esc(MM.copy('restartTitle')) + '</h3>' +
        '<p>' + ui.esc(body) + '</p>' +
        '<div class="banner-actions">' +
          '<button type="button" class="btn btn-primary" id="restart-log">' +
            ui.esc(MM.copy('restartButton')) +
          '</button>' +
          '<button type="button" class="btn btn-ghost" id="restart-dismiss">Dismiss</button>' +
        '</div>' +
      '</div>';

    ui.$('#restart-log').addEventListener('click', function () {
      MM.logView.openActivityForm();
    });

    ui.$('#restart-dismiss').addEventListener('click', function () {
      MM.store.update(function (d) { d.streak.restartNotice = null; });
    });
  }

  /* ---- The big number, the ring, and the message under it ---------------- */
  function renderStreak(streakInfo, movedToday, restingToday) {
    var length = streakInfo.length;

    ui.$('#streak-number').textContent = length;
    ui.$('#streak-label').textContent = MM.copy('streakLabel');

    // The ring fills up as you approach the next milestone.
    var nextMilestone = MM.SITE.milestones.find(function (m) { return m > length; });
    var progress = nextMilestone ? Math.round((length / nextMilestone) * 100) : 100;
    ui.$('#streak-ring').style.setProperty('--progress', progress);

    // What to say underneath
    var message;
    if (restingToday && !movedToday) message = MM.copy('todayRestMsg');
    else if (movedToday) message = MM.copy('todayDoneMsg');
    else if (length === 0) message = MM.copy('streakZero');
    else message = MM.copy('streakGoing');

    ui.$('#streak-message').textContent = message;
  }

  /* ---- The two action buttons ------------------------------------------- */
  function renderButtons(movedToday, restingToday) {
    var movedBtn = ui.$('#btn-moved');
    var restBtn = ui.$('#btn-rest');

    // "I moved today" stays tappable even after logging, so you can add a
    // second activity on the same day.
    movedBtn.textContent = movedToday ? MM.copy('logButtonDone') : MM.copy('logButton');
    movedBtn.classList.toggle('btn-done', movedToday);
    movedBtn.classList.toggle('btn-primary', !movedToday);

    restBtn.textContent = restingToday ? MM.copy('restButtonDone') : MM.copy('restButton');
    restBtn.classList.toggle('btn-done', restingToday);

    // How many rest days are left this week?
    var used = MM.streak.restDaysUsedThisWeek();
    var allowed = MM.SITE.restDaysPerWeek;
    var canRest = MM.streak.canRestToday();

    restBtn.disabled = !canRest && !restingToday;

    var hint;
    if (restingToday) {
      hint = 'Rest day marked — your streak is protected.';
    } else if (!canRest) {
      hint = MM.copy('restUsed');
    } else {
      var left = allowed - used;
      hint = left + ' planned rest ' + (left === 1 ? 'day' : 'days') + ' left this week.';
    }
    ui.$('#rest-hint').textContent = hint;
  }

  /* ---- Today's session from the plan ------------------------------------ */
  function renderTodaysPlan(today) {
    var host = ui.$('#home-today');
    var data = MM.store.get();

    // No plan yet? Nudge them into onboarding.
    if (!data.plan) {
      host.innerHTML = '' +
        '<div class="card card-accent mt-2">' +
          '<h3 class="card-title">' + ui.esc(MM.copy('noPlan')) + '</h3>' +
          '<button type="button" class="btn btn-primary btn-block mt-1" id="home-make-plan">' +
            ui.esc(MM.copy('planSetupButton')) +
          '</button>' +
        '</div>';
      ui.$('#home-make-plan').addEventListener('click', MM.onboarding.open);
      return;
    }

    var day = MM.planBuilder.dayForDate(today);
    var doneToday = !!data.planCompletions[today];

    if (!day || day.kind === 'rest') {
      host.innerHTML = '' +
        '<div class="card card-dim mt-2">' +
          '<h3 class="card-title">' + ui.esc(MM.copy('planTodayLabel')) + ': ' +
            ui.esc(MM.copy('planRestLabel')) + '</h3>' +
          '<p class="small muted">' + ui.esc(MM.copy('planRestNote')) + '</p>' +
        '</div>';
      return;
    }

    host.innerHTML = '' +
      '<div class="card card-accent mt-2">' +
        '<div class="chip-row mb-1">' +
          '<span class="chip chip-accent">' + ui.esc(MM.copy('planTodayLabel')) + '</span>' +
          '<span class="chip">' + day.blocks.length + ' exercises</span>' +
        '</div>' +
        '<h3 class="card-title">' + ui.esc(day.title) + '</h3>' +
        '<p class="small muted">' + ui.esc(day.note) + '</p>' +
        '<div class="btn-row mt-1">' +
          '<button type="button" class="btn ' + (doneToday ? 'btn-done' : 'btn-primary') + '" id="home-complete"' +
            (doneToday ? ' disabled' : '') + '>' +
            ui.esc(doneToday ? MM.copy('planCheckedButton') : MM.copy('planCheckButton')) +
          '</button>' +
          '<button type="button" class="btn btn-outline" id="home-see-plan">See it</button>' +
        '</div>' +
      '</div>';

    if (!doneToday) {
      ui.$('#home-complete').addEventListener('click', function () {
        MM.myGoalsView.completeToday();
      });
    }

    ui.$('#home-see-plan').addEventListener('click', function () {
      MM.app.showView('goals');
    });
  }

  /* --------------------------------------------------------------------------
     Wire up the buttons that are always in the HTML (the ones built by
     render() get their listeners attached in there instead).
     -------------------------------------------------------------------------- */
  function init() {
    // Tapping the "why movement matters" card shows a different fact.
    ui.$('#home-why').addEventListener('click', function (event) {
      if (event.target.closest('#why-card')) renderWhy(true);
    });

    ui.$('#btn-moved').addEventListener('click', function () {
      MM.logView.openActivityForm();
    });

    ui.$('#btn-rest').addEventListener('click', function () {
      var today = MM.dates.today();

      if (MM.store.isRestDay(today)) {
        // Tapping again un-marks it.
        MM.store.setRestDay(today, false);
        ui.toast('Rest day removed.');
        return;
      }

      if (!MM.streak.canRestToday()) {
        ui.toast(MM.copy('restUsed'));
        return;
      }

      MM.store.setRestDay(today, true);
      ui.toast(MM.copy('todayRestMsg'));
    });
  }

  return {
    init: init,
    render: render,
  };
})();
