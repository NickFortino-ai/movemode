/* ============================================================================
   views/settings.js — THE SETTINGS SCREEN
   ============================================================================
   Switch modes, change your goal, redo onboarding, and clear your data.
   Also explains where the data lives, since there are no accounts.
   ========================================================================== */

MM.settingsView = (function () {
  var ui = MM.ui;

  function render() {
    var data = MM.store.get();

    ui.$('#settings-heading').textContent = MM.copy('settingsTitle');
    ui.$('#settings-content').innerHTML =
      profileLinkHTML() +
      modeSectionHTML(data) +
      goalSectionHTML(data) +
      MM.goalProgress.settingsGoalsHTML() +
      planSectionHTML(data) +
      dataSectionHTML(data) +
      aboutSectionHTML();
  }

  /* ---- A way through to the Profile page --------------------------------
     The Profile page isn't a tab (five is plenty on a phone), so it's
     reachable from the header avatar and from here. */
  function profileLinkHTML() {
    var account = MM.accounts.active();
    if (!account) return '';

    return '' +
      '<button type="button" class="hub-card" id="settings-profile-link">' +
        '<span class="profile-avatar" aria-hidden="true">' +
          ui.esc(account.avatar) + '</span>' +
        '<span class="hub-text">' +
          '<span class="hub-title">' + ui.esc(account.name) + '</span>' +
          '<span class="hub-blurb">Name, icon, PIN, and training setup</span>' +
        '</span>' +
        '<svg class="hub-arrow" viewBox="0 0 24 24" aria-hidden="true">' +
          '<use href="#icon-chevron"></use></svg>' +
      '</button>';
  }

  /* ---- Mode ------------------------------------------------------------- */
  function modeSectionHTML(data) {
    var modes = [
      { id: 'chill', label: MM.copy('modeName', 'chill'), blurb: MM.copy('modeBlurb', 'chill'), icon: '🌿' },
      { id: 'grind', label: MM.copy('modeName', 'grind'), blurb: MM.copy('modeBlurb', 'grind'), icon: '🔥' },
    ];

    return '' +
      '<div class="section-title"><h2>Mode</h2></div>' +
      '<div class="option-grid" id="settings-modes">' +
        modes.map(function (m) {
          return '' +
            '<button type="button" class="option-card" data-set-mode="' + m.id + '"' +
              ' aria-pressed="' + (data.mode === m.id ? 'true' : 'false') + '">' +
              '<span class="option-icon" aria-hidden="true">' + m.icon + '</span>' +
              '<span class="option-text">' +
                '<span class="option-label">' + ui.esc(m.label) + '</span>' +
                '<span class="option-blurb">' + ui.esc(m.blurb) + '</span>' +
              '</span>' +
            '</button>';
        }).join('') +
      '</div>' +
      '<p class="small faint mt-1">You can also flip modes any time with the toggle in the ' +
        'header. Switching rebuilds your plan at the new difficulty — your streak and log ' +
        'are never affected.</p>';
  }

  /* ---- Goal categories (several can be on at once) ---------------------- */
  function goalSectionHTML(data) {
    var chosen = data.profile.goals;

    return '' +
      '<div class="section-title">' +
        '<h2>Your goals</h2>' +
        '<span class="section-hint">Pick as many as you like</span>' +
      '</div>' +
      '<div class="option-grid" id="settings-goals">' +
        MM.GOALS.map(function (g) {
          var isOn = chosen.indexOf(g.id) !== -1;
          var badge = (chosen[0] === g.id && chosen.length > 1)
            ? '<span class="chip chip-accent option-badge">Main</span>' : '';

          return '' +
            // data-value matches the onboarding cards so shared helpers can
            // read the selection; data-toggle-goal is what the click
            // handler below looks for.
            '<button type="button" class="option-card" data-toggle-goal="' + g.id + '"' +
              ' data-value="' + g.id + '"' +
              ' aria-pressed="' + (isOn ? 'true' : 'false') + '">' +
              '<span class="option-icon" aria-hidden="true">' + g.icon + '</span>' +
              '<span class="option-text">' +
                '<span class="option-label">' + ui.esc(g.label) + badge + '</span>' +
                '<span class="option-blurb">' + ui.esc(g.blurb) + '</span>' +
              '</span>' +
            '</button>';
        }).join('') +
      '</div>' +
      '<p class="small faint mt-1">Your first goal is the main one — it sets the ' +
        'sets and reps and the nutrition guidance you see. Changing this rebuilds ' +
        'your plan, and every goal gets a progress bar on the Home screen.</p>';
  }

  /* ---- Plan details ----------------------------------------------------- */
  function planSectionHTML(data) {
    var profile = data.profile;
    var experience = MM.getExperience(profile.experience);
    var equipment = MM.EQUIPMENT_OPTIONS.find(function (e) { return e.id === profile.equipment; });

    return '' +
      '<div class="section-title"><h2>Your plan</h2></div>' +
      '<div class="card">' +
        '<div class="chip-row mb-1">' +
          '<span class="chip">' + ui.esc(experience.label) + '</span>' +
          '<span class="chip">' + profile.daysPerWeek + ' days / week</span>' +
          '<span class="chip">' + ui.esc(equipment ? equipment.label : profile.equipment) + '</span>' +
          (profile.sport ? '<span class="chip chip-accent">' + ui.esc(profile.sport) + '</span>' : '') +
        '</div>' +
        '<p class="small muted">Redo the questions to change your experience level, how many ' +
          'days you train, your equipment, or your sport.</p>' +
        '<button type="button" class="btn btn-outline btn-block mt-1" id="settings-redo">' +
          'Redo the questions' +
        '</button>' +
      '</div>';
  }

  /* ---- Data ------------------------------------------------------------- */
  function dataSectionHTML(data) {
    return '' +
      '<div class="section-title"><h2>Your data</h2></div>' +
      '<div class="card">' +
        '<div class="stat-row" style="margin-top:0">' +
          '<div class="stat">' +
            '<div class="stat-value">' + data.activities.length + '</div>' +
            '<div class="stat-name">Workouts</div>' +
          '</div>' +
          '<div class="stat">' +
            '<div class="stat-value">' + data.meals.length + '</div>' +
            '<div class="stat-name">Meals</div>' +
          '</div>' +
          '<div class="stat">' +
            '<div class="stat-value">' + data.streak.best + '</div>' +
            '<div class="stat-name">Best streak</div>' +
          '</div>' +
        '</div>' +
        '<p class="small muted mt-1">Everything is saved in this browser only, under the ' +
          'key <code>' + ui.esc(MM.store.storageKey()) + '</code>. There are no accounts and ' +
          'nothing is sent anywhere. Clearing your browser data will clear this too.</p>' +
      '</div>' +

      '<div class="card">' +
        '<h3 class="card-title">Reset everything</h3>' +
        '<p class="small muted">' + ui.esc(MM.copy('resetWarn')) + '</p>' +
        '<button type="button" class="btn btn-danger btn-block mt-1" id="settings-reset">' +
          'Delete all my data' +
        '</button>' +
      '</div>';
  }

  /* ---- About ------------------------------------------------------------ */
  function aboutSectionHTML() {
    return '' +
      '<div class="section-title"><h2>About</h2></div>' +
      '<div class="card card-dim">' +
        '<p class="small muted">' + ui.esc(MM.SITE.name) + ' · version ' + MM.SITE.dataVersion + '<br>' +
          ui.esc(MM.SITE.tagline) + '</p>' +
        '<p class="small faint">Built to get people moving at every level — first-timers ' +
          'and lifelong athletes alike.</p>' +
      '</div>' +
      ui.disclaimerHTML();
  }

  /* ==========================================================================
     INIT — one delegated listener, attached once.
     ======================================================================== */
  function init() {
    // Typing a new target number. 'change' fires when the box loses focus,
    // which is why this is a separate listener from the click one below.
    ui.$('#settings-content').addEventListener('change', function (event) {
      var input = event.target.closest('[data-goal-target]');
      if (input) {
        MM.goalTracker.setTarget(input.dataset.goalTarget, input.value);
        ui.toast('Target updated.');
      }
    });

    ui.$('#settings-content').addEventListener('click', function (event) {
      // --- Through to the Profile page ---
      if (event.target.closest('#settings-profile-link')) {
        MM.app.showView('profile');
        return;
      }

      // --- Switch mode ---
      var modeBtn = event.target.closest('[data-set-mode]');
      if (modeBtn) {
        MM.app.setMode(modeBtn.dataset.setMode);
        return;
      }

      // --- Toggle a goal category on or off, then rebuild the plan ---
      var goalBtn = event.target.closest('[data-toggle-goal]');
      if (goalBtn) {
        var goalId = goalBtn.dataset.toggleGoal;
        var current = MM.store.get().profile.goals;
        var turningOff = current.indexOf(goalId) !== -1;

        // There always has to be at least one goal category, because the
        // plan is built from it.
        if (turningOff && current.length === 1) {
          ui.toast('Keep at least one goal — your plan is built from it.');
          return;
        }

        MM.store.update(function (d) {
          d.profile.goals = turningOff
            ? d.profile.goals.filter(function (id) { return id !== goalId; })
            : d.profile.goals.concat([goalId]);
          d.plan = MM.planBuilder.build(d.profile, d.mode);
          d.onboarded = true;
          // save() adds or removes the matching progress-bar goal.
        });

        ui.toast(turningOff
          ? 'Goal removed — your plan was rebuilt.'
          : 'Goal added — your plan now covers it too.');
        return;
      }

      // --- Delete a goal from the progress list ---
      var deleteBtn = event.target.closest('[data-delete-goal]');
      if (deleteBtn) {
        MM.goalTracker.remove(deleteBtn.dataset.deleteGoal);
        ui.toast('Goal deleted.');
        return;
      }

      // --- Add a goal of your own ---
      if (event.target.closest('#settings-add-goal')) {
        MM.goalProgress.openAddForm();
        return;
      }

      // --- Redo onboarding ---
      if (event.target.closest('#settings-redo')) {
        MM.onboarding.open();
        return;
      }

      // --- Wipe everything ---
      if (event.target.closest('#settings-reset')) {
        var ok = window.confirm(MM.copy('resetWarn') + '\n\nDelete all data?');
        if (!ok) return;

        MM.store.resetAll();
        MM.app.applyMode(MM.store.get().mode);
        MM.app.showView('home');
        ui.toast('All data cleared.');
        MM.onboarding.open();
      }
    });
  }

  return {
    init: init,
    render: render,
  };
})();
