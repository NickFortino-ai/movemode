/* ============================================================================
   views/quick.js — THE QUICK WORKOUT SCREEN
   ============================================================================
   Pick a muscle group, get a list of exercises you can do for it right now.

   The flow is:
     1. Say what equipment you have (defaults to what you told us in setup).
     2. Tap a muscle group — Chest, Back, Legs, Core, and so on.
     3. Get every exercise in the library that trains it, with a suggested
        number of sets and reps and a short how-to.

   From there you can log it as a workout, or start a timed circuit built
   from the exercises on screen.

   The muscle groups come from MM.MUSCLE_GROUPS in js/data/exercises.js, so
   adding a group there makes a new button appear here automatically.
   ========================================================================== */

MM.quickView = (function () {
  var ui = MM.ui;

  var selectedGroup = null;    // which muscle group is showing
  var listedExercises = [];    // the exercises currently on screen
  var timer = null;            // the circuit timer, once one is started
  var schedule = null;
  var alreadyLogged = false;

  // Until the user picks equipment here themselves, this screen follows
  // whatever they told us in onboarding.
  var equipmentTouched = false;

  // Which mode the exercise list on screen was drawn for. render() runs on
  // every save — logging a workout, ticking a goal, anything — and rebuilding
  // the list each time would wipe out a running timer and the "Logged ✓"
  // button underneath it. So the list is only redrawn when the mode changes,
  // since that's the only thing render() can change about it.
  var renderedForMode = null;

  /* ==========================================================================
     SUGGESTED SETS AND REPS
     Based on experience level, nudged up in Grind mode. This is advice shown
     next to each exercise, not a generated program — the real programming
     lives in the plan.
     ======================================================================== */
  function suggestDose(exercise) {
    var experience = MM.getExperience(MM.store.get().profile.experience);
    var grind = MM.store.get().mode === 'grind';

    var sets = 2 + experience.setBonus + (grind ? 1 : 0);
    sets = Math.max(2, Math.min(5, sets));

    if (exercise.timed) {
      var seconds = exercise.muscles.indexOf('cardio') !== -1 ? 120 : 40;
      if (grind) seconds = Math.round(seconds * 1.25);
      return sets + ' × ' + MM.formatLength(seconds);
    }

    var reps = exercise.difficulty >= 3 ? '6–10' : (grind ? '10–15' : '8–12');
    return sets + ' × ' + reps + ' reps';
  }

  /* ==========================================================================
     RENDER — the wording and the muscle group buttons.
     Safe to call any time; it leaves the exercise list alone unless the
     chosen group is no longer available.
     ======================================================================== */
  function render() {
    ui.$('#quick-heading').textContent = MM.copy('quickTitle');
    ui.$('#quick-intro').textContent = MM.copy('quickIntro');
    ui.$('#muscle-label').textContent = MM.copy('quickPickMuscle');

    if (!equipmentTouched) {
      ui.setSegmentedValue(ui.$('#quick-equipment'), MM.store.get().profile.equipment);
    }

    renderMuscleButtons();

    // Only redraw the list when the mode changed — the suggested sets and
    // reps depend on it. See the note on renderedForMode above.
    if (selectedGroup && renderedForMode !== MM.store.get().mode) {
      stopTimer();              // the mode change invalidates the circuit
      renderExerciseList();
    }
  }

  function renderMuscleButtons() {
    var equipment = currentEquipment();

    ui.$('#muscle-groups').innerHTML = MM.MUSCLE_GROUPS.map(function (group) {
      var count = MM.exercisesForMuscleGroup(group.id, equipment).length;
      var pressed = group.id === selectedGroup ? 'true' : 'false';

      return '' +
        '<button type="button" class="muscle-card" data-muscle="' + ui.esc(group.id) + '"' +
          ' aria-pressed="' + pressed + '"' + (count === 0 ? ' disabled' : '') + '>' +
          '<span class="muscle-icon" aria-hidden="true">' + ui.esc(group.icon) + '</span>' +
          '<span class="muscle-label">' + ui.esc(group.label) + '</span>' +
          '<span class="muscle-count">' + count + ' exercise' + (count === 1 ? '' : 's') + '</span>' +
        '</button>';
    }).join('');
  }

  function currentEquipment() {
    return ui.getSegmentedValue(ui.$('#quick-equipment')) || 'none';
  }

  /* ==========================================================================
     THE EXERCISE LIST
     ======================================================================== */
  function selectGroup(groupId) {
    selectedGroup = groupId;
    alreadyLogged = false;
    stopTimer();

    renderMuscleButtons();
    renderExerciseList();

    ui.$('#quick-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderExerciseList() {
    var group = MM.getMuscleGroup(selectedGroup);
    var host = ui.$('#quick-result');
    if (!group) { host.innerHTML = ''; return; }

    var equipment = currentEquipment();
    renderedForMode = MM.store.get().mode;

    // Easiest first, so a beginner starts at the top of the list and an
    // experienced person scrolls down to the harder stuff.
    listedExercises = MM.exercisesForMuscleGroup(group.id, equipment)
      .slice()
      .sort(function (a, b) { return a.difficulty - b.difficulty; });

    if (listedExercises.length === 0) {
      host.innerHTML = '<div class="empty-state">Nothing in the library trains ' +
        ui.esc(group.label) + ' with that equipment. Try another group, or ' +
        'switch the equipment above.</div>';
      return;
    }

    host.innerHTML = '' +
      '<div class="card">' +
        '<div class="chip-row mb-1">' +
          '<span class="chip chip-accent">' + ui.esc(group.icon) + ' ' + ui.esc(group.label) + '</span>' +
          '<span class="chip">' + listedExercises.length + ' exercises</span>' +
          '<span class="chip">' + ui.esc(equipmentLabel(equipment)) + '</span>' +
        '</div>' +
        '<h2 class="card-title">' + ui.esc(group.blurb) + '</h2>' +
        '<p class="small muted">' + ui.esc(MM.copy('quickListIntro')) +
          ' Easiest first — pick three or four and do them in order.</p>' +
      '</div>' +

      '<div class="card">' +
        listedExercises.map(exerciseRowHTML).join('') +
      '</div>' +

      '<div class="btn-row mt-1">' +
        '<button type="button" class="btn btn-outline" id="quick-timer">Start a timer</button>' +
        // Keep the "already logged" state if the list gets redrawn.
        '<button type="button" class="btn ' +
          (alreadyLogged ? 'btn-done' : 'btn-gradient') + '" id="quick-log">' +
          ui.esc(alreadyLogged ? 'Logged ✓' : MM.copy('quickDone')) +
        '</button>' +
      '</div>' +

      '<div id="quick-timer-slot"></div>';
  }

  function equipmentLabel(id) {
    var found = MM.EQUIPMENT_OPTIONS.find(function (e) { return e.id === id; });
    return found ? found.label : id;
  }

  function exerciseRowHTML(exercise, index) {
    return '' +
      '<div class="exercise-row">' +
        '<span class="exercise-index" aria-hidden="true">' + (index + 1) + '</span>' +
        '<div class="exercise-main">' +
          '<div class="exercise-name">' + ui.esc(exercise.name) + '</div>' +
          '<div class="exercise-dose">' + ui.esc(suggestDose(exercise)) + '</div>' +
          '<p class="exercise-how">' + ui.esc(exercise.howTo) + '</p>' +
          '<div class="chip-row exercise-tags">' +
            '<span class="chip">' + ui.esc(difficultyLabel(exercise.difficulty)) + '</span>' +
            (exercise.equipment !== 'none'
              ? '<span class="chip chip-accent">' + ui.esc(exercise.equipment) + '</span>'
              : '<span class="chip">no equipment</span>') +
            '<span class="chip">' + ui.esc(exercise.intensity) + ' intensity</span>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function difficultyLabel(level) {
    if (level === 1) return 'beginner';
    if (level === 2) return 'intermediate';
    return 'advanced';
  }

  /* ==========================================================================
     THE OPTIONAL TIMER
     Builds a circuit out of the first few exercises on screen and counts
     through it. Everything here reuses js/quick-workout.js and js/timer.js.
     ======================================================================== */
  function startCircuit() {
    var workout = MM.quickWorkout.circuitFromExercises(listedExercises, 10);
    if (!workout) return;

    schedule = MM.quickWorkout.buildSchedule(workout);
    var total = schedule.reduce(function (sum, item) { return sum + item.seconds; }, 0);

    ui.$('#quick-timer-slot').innerHTML = '' +
      '<div class="timer-card mt-1" id="timer-card">' +
        '<div class="timer-phase" id="timer-phase">Ready</div>' +
        '<div class="timer-clock" id="timer-clock">' + MM.formatClock(total) + '</div>' +
        '<div class="timer-now" id="timer-now">' + ui.esc(schedule[0].name) + '</div>' +
        '<div class="timer-next" id="timer-next">' + workout.rounds + ' rounds of ' +
          workout.blocks.length + ' exercises</div>' +
        '<div class="timer-bar"><div class="timer-bar-fill" id="timer-fill"></div></div>' +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-primary btn-big" id="timer-toggle">Start</button>' +
          '<button type="button" class="btn btn-outline" id="timer-reset">Reset</button>' +
        '</div>' +
      '</div>';

    if (timer) timer.destroy();

    timer = new MM.Timer({
      totalSeconds: total,
      onTick: function (elapsed) {
        var card = ui.$('#timer-card');
        if (!card) return;          // user navigated away mid-tick

        ui.$('#timer-fill').style.width = Math.min(100, (elapsed / total) * 100) + '%';

        var position = MM.quickWorkout.positionAt(schedule, elapsed);
        if (!position) {
          ui.$('#timer-phase').textContent = 'Finished';
          ui.$('#timer-clock').textContent = '0:00';
          return;
        }

        var item = position.item;
        card.classList.toggle('is-work', item.phase === 'work');
        card.classList.toggle('is-rest', item.phase === 'rest');

        ui.$('#timer-phase').textContent = item.phase === 'work' ? 'Work' : 'Rest';
        ui.$('#timer-clock').textContent = MM.formatClock(position.remainingInItem);
        ui.$('#timer-now').textContent = item.name;
        ui.$('#timer-next').textContent = position.next
          ? 'Round ' + item.round + ' of ' + workout.rounds + ' · next: ' + position.next.name
          : 'Last one — finish strong';
      },
      onFinish: function () {
        var toggle = ui.$('#timer-toggle');
        if (toggle) toggle.textContent = 'Done';
        ui.toast(MM.store.get().mode === 'grind' ? 'WORK DONE. LOG IT.' : 'Nice work. Log it below.');
      },
    });

    ui.$('#quick-timer-slot').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function stopTimer() {
    if (timer) {
      timer.destroy();
      timer = null;
    }
    var slot = ui.$('#quick-timer-slot');
    if (slot) slot.innerHTML = '';
  }

  /* ==========================================================================
     LOGGING — counts toward the streak like any other workout.
     ======================================================================== */
  function logWorkout() {
    if (!selectedGroup) return;

    if (alreadyLogged) {
      ui.toast('Already logged this one.');
      return;
    }

    var group = MM.getMuscleGroup(selectedGroup);
    var isCardio = selectedGroup === 'cardio';
    var isStretch = selectedGroup === 'mobility';

    MM.store.addActivity({
      type: isCardio ? 'Run' : (isStretch ? 'Stretching / yoga' : 'Lifting'),
      minutes: isStretch ? 10 : 20,
      source: 'quick',
      notes: group.label + ' workout',
    });

    alreadyLogged = true;
    var btn = ui.$('#quick-log');
    if (btn) {
      btn.classList.remove('btn-gradient');
      btn.classList.add('btn-done');
      btn.textContent = 'Logged ✓';
    }
    ui.toast(MM.copy('todayDoneMsg'));
  }

  /* --------------------------------------------------------------------------
     Pause a running timer when the user leaves the screen.
     -------------------------------------------------------------------------- */
  function onLeave() {
    if (timer && timer.running) {
      timer.pause();
      var toggle = ui.$('#timer-toggle');
      if (toggle) toggle.textContent = 'Resume';
    }
  }

  /* ==========================================================================
     INIT — listeners attached once, delegated where the HTML is redrawn.
     ======================================================================== */
  function init() {
    // Choosing equipment here takes over from the onboarding answer, and
    // re-filters whatever is on screen.
    ui.initSegmented(ui.$('#quick-equipment'), function () {
      equipmentTouched = true;
      renderMuscleButtons();
      if (selectedGroup) renderExerciseList();
    });

    ui.$('#muscle-groups').addEventListener('click', function (event) {
      var btn = event.target.closest('[data-muscle]');
      if (btn && !btn.disabled) selectGroup(btn.dataset.muscle);
    });

    ui.$('#quick-result').addEventListener('click', function (event) {
      if (event.target.closest('#quick-log')) {
        logWorkout();
        return;
      }

      if (event.target.closest('#quick-timer')) {
        startCircuit();
        return;
      }

      if (event.target.closest('#timer-toggle')) {
        if (!timer) return;
        timer.toggle();
        ui.$('#timer-toggle').textContent = timer.running
          ? 'Pause'
          : (timer.finished ? 'Done' : 'Resume');
        return;
      }

      if (event.target.closest('#timer-reset')) {
        if (timer) startCircuit();   // rebuild from scratch
      }
    });
  }

  return {
    init: init,
    render: render,
    onLeave: onLeave,
    suggestDose: suggestDose,
  };
})();
