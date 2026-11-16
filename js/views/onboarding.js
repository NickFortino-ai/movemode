/* ============================================================================
   views/onboarding.js — THE SETUP QUESTIONS
   ============================================================================
   A five-step overlay that asks:
     1. goal          2. experience      3. days per week
     4. equipment     5. sport (optional)

   It writes the answers into the saved profile, generates the plan, and
   closes. Settings can reopen it at any time to redo everything.
   ========================================================================== */

MM.onboarding = (function () {
  var ui = MM.ui;

  var TOTAL_STEPS = 5;
  var step = 0;
  var draft = null;        // a working copy of the profile while answering

  /* ---- Icons for the experience options (the data file has no icons) ---- */
  var EXPERIENCE_ICONS = { never: '🌱', some: '📈', experienced: '🔥' };

  /* --------------------------------------------------------------------------
     Open the overlay. Pre-selects whatever is already saved, so redoing
     onboarding starts from your current answers rather than blank.
     -------------------------------------------------------------------------- */
  function open() {
    var data = MM.store.get();
    var profile = data.profile;

    // Shallow copy so hitting Escape doesn't half-change the real profile.
    // goals is sliced because it's an array — copying the reference would
    // let the questions edit the saved profile directly.
    //
    // A first-time visitor starts with NOTHING selected: the saved profile
    // has a placeholder goal in it so the rest of the app works before
    // onboarding, but showing it pre-ticked would look like we chose for
    // them. Someone redoing the questions does see their real answers.
    draft = {
      goals: data.onboarded ? (profile.goals || [profile.goal]).slice() : [],
      experience: profile.experience,
      daysPerWeek: profile.daysPerWeek,
      equipment: profile.equipment,
      sport: profile.sport,
    };

    step = 0;
    renderCopy();
    renderOptions();
    showStep();

    ui.$('#onboarding').classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    ui.$('#onboarding').classList.remove('is-open');
    document.body.style.overflow = '';
  }

  /* ---- Text that depends on the current mode ---------------------------- */
  function renderCopy() {
    ui.$('#onboard-welcome').textContent = MM.copy('onboardWelcome');
    ui.$('#onboard-intro').textContent = MM.copy('onboardIntro');
    ui.$('#onboard-disclaimer').textContent = MM.NUTRITION_DISCLAIMER;
  }

  /* ---- Build the choice lists ------------------------------------------- */

  // The goal step allows SEVERAL picks, and the first one chosen is the main
  // goal. Because that badge moves around as you tap, the cards get redrawn
  // on every tap rather than just toggling a class.
  function renderGoalCards() {
    ui.renderOptionCards(ui.$('#onboard-goals'), MM.GOALS.map(function (g) {
      return {
        id: g.id,
        label: g.label,
        blurb: g.blurb,
        icon: g.icon,
        badge: draft.goals[0] === g.id && draft.goals.length > 1 ? 'Main' : '',
      };
    }), draft.goals);

    // The Next button is only useful once at least one goal is picked.
    var nextBtn = ui.$('#onboard-next');
    if (step === 0) nextBtn.disabled = draft.goals.length === 0;
  }

  function renderOptions() {
    renderGoalCards();

    ui.renderOptionCards(ui.$('#onboard-experience'), MM.EXPERIENCE_LEVELS.map(function (e) {
      return { id: e.id, label: e.label, blurb: e.blurb, icon: EXPERIENCE_ICONS[e.id] };
    }), draft.experience);

    ui.renderOptionCards(ui.$('#onboard-equipment'), MM.EQUIPMENT_OPTIONS, draft.equipment);

    ui.setSegmentedValue(ui.$('#onboard-days'), draft.daysPerWeek);
    ui.$('#onboard-sport').value = draft.sport || '';
  }

  /* ---- Show the current step and update the progress dots ---------------- */
  function showStep() {
    ui.$$('.onboard-step').forEach(function (el) {
      el.classList.toggle('is-active', Number(el.dataset.step) === step);
    });

    // Progress dots
    var dots = '';
    for (var i = 0; i < TOTAL_STEPS; i++) {
      dots += '<span class="step-dot' + (i <= step ? ' is-done' : '') + '"></span>';
    }
    ui.$('#onboard-steps').innerHTML = dots;

    // Buttons
    var backBtn = ui.$('#onboard-back');
    var nextBtn = ui.$('#onboard-next');
    var isLast = step === TOTAL_STEPS - 1;

    backBtn.style.visibility = step === 0 ? 'hidden' : 'visible';
    nextBtn.textContent = isLast ? MM.copy('onboardFinish') : 'Next';
    // Step 0 needs at least one goal picked; every other step has a default.
    nextBtn.disabled = step === 0 && draft.goals.length === 0;

    // Scroll back to the top of the overlay for the new question.
    ui.$('#onboarding').scrollTop = 0;
  }

  function next() {
    if (step < TOTAL_STEPS - 1) {
      step++;
      showStep();
    } else {
      finish();
    }
  }

  function back() {
    if (step > 0) {
      step--;
      showStep();
    }
  }

  /* --------------------------------------------------------------------------
     Save everything and build the plan.
     -------------------------------------------------------------------------- */
  function finish() {
    draft.sport = ui.$('#onboard-sport').value.trim().slice(0, 40);
    if (draft.goals.length === 0) draft.goals = ['general'];
    draft.goal = draft.goals[0];      // the mirror storage.js keeps in sync

    MM.store.update(function (d) {
      d.profile = draft;
      d.onboarded = true;
      d.plan = MM.planBuilder.build(draft, d.mode, d.customDays);
      // save() syncs the progress-bar goals to the chosen categories.
    });

    close();
    MM.app.showView('goals');
    ui.toast(MM.copy('onboardDone'));
  }

  /* --------------------------------------------------------------------------
     Hook up the buttons once, at startup.
     -------------------------------------------------------------------------- */
  function init() {
    // MULTI-select: tapping toggles a goal on or off, so you can chase more
    // than one thing at once. No auto-advance here — you need a moment to
    // pick several, so you move on with the Next button.
    ui.initOptionCards(ui.$('#onboard-goals'), function (value, isPressed) {
      if (isPressed) {
        if (draft.goals.indexOf(value) === -1) draft.goals.push(value);
      } else {
        draft.goals = draft.goals.filter(function (id) { return id !== value; });
      }
      renderGoalCards();     // redraw so the "Main" badge lands correctly
    }, true);

    ui.initOptionCards(ui.$('#onboard-experience'), function (value) {
      draft.experience = value;
      window.setTimeout(next, 180);
    });

    ui.initOptionCards(ui.$('#onboard-equipment'), function (value) {
      draft.equipment = value;
      window.setTimeout(next, 180);
    });

    ui.initSegmented(ui.$('#onboard-days'), function (value) {
      draft.daysPerWeek = Number(value);
    });

    ui.$('#onboard-next').addEventListener('click', next);
    ui.$('#onboard-back').addEventListener('click', back);
  }

  return {
    init: init,
    open: open,
    close: close,
    renderCopy: renderCopy,
  };
})();
