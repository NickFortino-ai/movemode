/* ============================================================================
   views/workout-editor.js — EDITING A DAY'S WORKOUT
   ============================================================================
   The generated plan is a starting point, not a rule. From here you can:

     - keep the generated workout exactly as it is (do nothing)
     - change it: rename it, add or remove exercises, reorder them, and set
       your own sets and reps
     - build a day from scratch, including turning a rest day into a workout

   HOW EDITS SURVIVE
   A day you have touched is saved into data.customDays, keyed by weekday
   (0 = Monday), NOT into the plan itself. The plan gets rebuilt whenever the
   mode changes, a goal changes, or the exercises get shuffled — and
   plan-builder.js lays your custom days back over the top every time. So an
   edit can never be thrown away by something else regenerating the week.

   "Reset this day" simply deletes it from customDays, and the generated
   version comes straight back.
   ========================================================================== */

MM.workoutEditor = (function () {
  var ui = MM.ui;

  var dayIndex = null;      // 0 = Monday
  var draft = null;         // the day being edited; nothing is saved until Save
  var pickerOpen = false;
  var pickerGroup = 'chest';

  /* ==========================================================================
     OPENING AND CLOSING
     ======================================================================== */
  function open(index) {
    var data = MM.store.get();
    if (!data.plan) return;

    dayIndex = Number(index);

    // Work on a deep copy, so hitting Cancel really does change nothing.
    draft = JSON.parse(JSON.stringify(data.plan.days[dayIndex]));
    pickerOpen = false;

    render();
    ui.$('#workout-editor').classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    ui.$('#workout-editor').classList.remove('is-open');
    document.body.style.overflow = '';
    draft = null;
    dayIndex = null;
  }

  function isOpen() {
    return ui.$('#workout-editor').classList.contains('is-open');
  }

  /* ==========================================================================
     RENDER
     ======================================================================== */
  function render() {
    if (!draft) return;

    var isCustom = !!MM.store.get().customDays[dayIndex];

    ui.$('#editor-title').textContent =
      (MM.WEEKDAYS_LONG[dayIndex] || 'This day');
    ui.$('#editor-sub').textContent = isCustom
      ? 'You have made this one your own.'
      : 'Change anything you like — it is only a suggestion.';

    ui.$('#editor-body').innerHTML =
      draft.kind === 'rest' ? restDayHTML() : workoutHTML(isCustom);
  }

  /* ---- A rest day, with the option to make it a workout ------------------ */
  function restDayHTML() {
    return '' +
      '<div class="card">' +
        '<h3 class="card-title">' + ui.esc(MM.copy('planRestLabel')) + '</h3>' +
        '<p class="small muted">' + ui.esc(MM.copy('planRestNote')) + '</p>' +
        '<button type="button" class="btn btn-primary btn-block mt-1" id="editor-make-workout">' +
          'Put a workout here instead' +
        '</button>' +
      '</div>';
  }

  /* ---- The workout being edited ------------------------------------------ */
  function workoutHTML(isCustom) {
    return '' +
      '<div class="card">' +
        '<div class="field">' +
          '<label for="editor-name">What do you call this workout?</label>' +
          '<input type="text" id="editor-name" maxlength="40" ' +
            'value="' + ui.esc(draft.title || '') + '" autocomplete="off">' +
        '</div>' +
      '</div>' +

      '<div class="section-title">' +
        '<h2>Exercises</h2>' +
        '<span class="section-hint">' + draft.blocks.length + ' in this workout</span>' +
      '</div>' +

      (draft.blocks.length
        ? '<div class="editor-list">' + draft.blocks.map(blockRowHTML).join('') + '</div>'
        : '<div class="empty-state">Nothing in here yet. Add your first exercise ' +
          'below — or turn it back into a rest day.</div>') +

      '<button type="button" class="btn btn-outline btn-block mt-1" id="editor-add">' +
        (pickerOpen ? 'Close the exercise list' : '+ Add an exercise') +
      '</button>' +

      (pickerOpen ? pickerHTML() : '') +

      '<div class="btn-row mt-2">' +
        '<button type="button" class="btn btn-ghost" id="editor-make-rest">' +
          'Make it a rest day' +
        '</button>' +
        (isCustom
          ? '<button type="button" class="btn btn-ghost" id="editor-reset">' +
              'Reset to generated' +
            '</button>'
          : '') +
      '</div>';
  }

  /* ---- One exercise, with its sets and reps ------------------------------ */
  function blockRowHTML(block, index) {
    var exercise = MM.getExercise(block.exerciseId);
    if (!exercise) return '';

    // Timed exercises are measured in seconds, everything else in reps.
    var amountField = block.timed
      ? '<label class="sr-only" for="secs-' + index + '">Seconds</label>' +
        '<input type="number" id="secs-' + index + '" class="editor-num" min="5" max="3600" ' +
          'value="' + ui.esc(block.seconds) + '" data-field="seconds" data-index="' + index + '">' +
        '<span class="editor-unit">sec</span>'
      : '<label class="sr-only" for="reps-' + index + '">Reps</label>' +
        '<input type="text" id="reps-' + index + '" class="editor-reps" maxlength="12" ' +
          'value="' + ui.esc(block.reps) + '" data-field="reps" data-index="' + index + '">' +
        '<span class="editor-unit">reps</span>';

    return '' +
      '<div class="editor-row">' +
        '<div class="editor-row-main">' +
          '<div class="editor-name">' + ui.esc(exercise.name) + '</div>' +
          '<div class="chip-row">' +
            exercise.muscles.slice(0, 2).map(function (m) {
              return '<span class="chip">' + ui.esc(m) + '</span>';
            }).join('') +
          '</div>' +
        '</div>' +

        '<div class="editor-amounts">' +
          '<label class="sr-only" for="sets-' + index + '">Sets</label>' +
          '<input type="number" id="sets-' + index + '" class="editor-num" min="1" max="20" ' +
            'value="' + ui.esc(block.sets) + '" data-field="sets" data-index="' + index + '">' +
          '<span class="editor-unit">sets</span>' +
          amountField +
        '</div>' +

        '<div class="editor-actions">' +
          '<button type="button" class="editor-icon" data-move="up" data-index="' + index + '"' +
            (index === 0 ? ' disabled' : '') + ' aria-label="Move up">↑</button>' +
          '<button type="button" class="editor-icon" data-move="down" data-index="' + index + '"' +
            (index === draft.blocks.length - 1 ? ' disabled' : '') +
            ' aria-label="Move down">↓</button>' +
          '<button type="button" class="editor-icon is-remove" data-remove="' + index + '" ' +
            'aria-label="Remove ' + ui.esc(exercise.name) + '">×</button>' +
        '</div>' +
      '</div>';
  }

  /* ---- Picking an exercise to add ---------------------------------------- */
  function pickerHTML() {
    var equipment = MM.store.get().profile.equipment;
    var choices = MM.exercisesForMuscleGroup(pickerGroup, equipment);
    var alreadyIn = draft.blocks.map(function (b) { return b.exerciseId; });

    return '' +
      '<div class="card editor-picker">' +
        '<div class="control-group">' +
          '<span class="control-label">Which part of the body?</span>' +
          '<div class="muscle-grid" id="editor-groups">' +
            MM.MUSCLE_GROUPS.map(function (group) {
              return '<button type="button" class="muscle-card" data-pick-group="' +
                ui.esc(group.id) + '" aria-pressed="' +
                (group.id === pickerGroup ? 'true' : 'false') + '">' +
                '<span class="muscle-icon" aria-hidden="true">' + ui.esc(group.icon) + '</span>' +
                '<span class="muscle-label">' + ui.esc(group.label) + '</span>' +
              '</button>';
            }).join('') +
          '</div>' +
        '</div>' +

        '<div class="editor-choices">' +
          (choices.length === 0
            ? '<p class="small faint">Nothing here for the equipment you have. ' +
              'Try another part of the body.</p>'
            : choices.map(function (exercise) {
                var inAlready = alreadyIn.indexOf(exercise.id) !== -1;
                return '' +
                  '<button type="button" class="editor-choice" data-add-exercise="' +
                    ui.esc(exercise.id) + '"' + (inAlready ? ' disabled' : '') + '>' +
                    '<span class="editor-choice-main">' +
                      '<span class="editor-choice-name">' + ui.esc(exercise.name) + '</span>' +
                      '<span class="editor-choice-meta">' +
                        ui.esc(exercise.equipment === 'none' ? 'no equipment' : exercise.equipment) +
                        ' · ' + ui.esc(exercise.intensity) + ' intensity' +
                      '</span>' +
                    '</span>' +
                    '<span class="editor-choice-add">' + (inAlready ? 'added' : '+') + '</span>' +
                  '</button>';
              }).join('')) +
        '</div>' +
      '</div>';
  }

  /* ==========================================================================
     EDITING THE DRAFT
     Nothing here touches saved data — that only happens in save().
     ======================================================================== */

  function addExercise(exerciseId) {
    var exercise = MM.getExercise(exerciseId);
    if (!exercise) return;

    // Match whatever the rest of the workout is doing, so a hand-added
    // exercise doesn't look out of place next to the generated ones.
    var example = draft.blocks[0];

    draft.blocks.push({
      exerciseId: exercise.id,
      sets: example ? example.sets : 3,
      reps: exercise.timed ? '—' : (example && !example.timed ? example.reps : '8–12'),
      seconds: exercise.timed ? (example && example.timed ? example.seconds : 40) : 40,
      rest: example ? example.rest : 60,
      timed: exercise.timed,
    });
    render();
  }

  function removeBlock(index) {
    draft.blocks.splice(index, 1);
    render();
  }

  function moveBlock(index, direction) {
    var to = direction === 'up' ? index - 1 : index + 1;
    if (to < 0 || to >= draft.blocks.length) return;

    var moved = draft.blocks.splice(index, 1)[0];
    draft.blocks.splice(to, 0, moved);
    render();
  }

  // Typing in one of the number or reps boxes.
  function updateField(index, field, value) {
    var block = draft.blocks[index];
    if (!block) return;

    if (field === 'sets') block.sets = Math.max(1, Math.min(20, Number(value) || 1));
    else if (field === 'seconds') block.seconds = Math.max(5, Math.min(3600, Number(value) || 5));
    else if (field === 'reps') block.reps = String(value).slice(0, 12) || '8–12';
  }

  function becomeWorkout() {
    draft.kind = 'workout';
    draft.title = draft.title || 'My workout';
    draft.note = 'A workout you put together yourself.';
    draft.dayType = draft.dayType || 'fullbody_strength';
    if (!Array.isArray(draft.blocks)) draft.blocks = [];
    pickerOpen = true;        // they'll want to add something straight away
    render();
  }

  function becomeRest() {
    draft.kind = 'rest';
    draft.blocks = [];
    draft.title = null;
    draft.note = null;
    pickerOpen = false;
    render();
  }

  /* ==========================================================================
     SAVING
     ======================================================================== */
  function save() {
    // Pick up whatever is currently typed in the name box.
    var nameBox = ui.$('#editor-name');
    if (nameBox) draft.title = nameBox.value.trim().slice(0, 40) || 'My workout';

    if (draft.kind === 'workout' && draft.blocks.length === 0) {
      ui.toast('Add at least one exercise, or make it a rest day.');
      return;
    }

    draft.custom = true;

    MM.store.update(function (d) {
      d.customDays[dayIndex] = draft;
      // Rebuild so the plan on screen matches, custom days laid back on top.
      d.plan = MM.planBuilder.build(d.profile, d.mode, d.customDays);
    });

    close();
    ui.toast('Saved. This day is yours now.');
  }

  // Throw the edit away and go back to the generated workout.
  function resetDay() {
    var ok = window.confirm(
      'Go back to the generated workout for ' + MM.WEEKDAYS_LONG[dayIndex] + '?\n\n' +
      'Your version of this day will be lost.');
    if (!ok) return;

    MM.store.update(function (d) {
      delete d.customDays[dayIndex];
      d.plan = MM.planBuilder.build(d.profile, d.mode, d.customDays);
    });

    close();
    ui.toast('Back to the generated workout.');
  }

  /* ==========================================================================
     INIT — one delegated listener for the whole editor.
     ======================================================================== */
  function init() {
    var host = ui.$('#workout-editor');

    host.addEventListener('click', function (event) {
      if (!draft) return;

      if (event.target.closest('#editor-cancel') || event.target.closest('#editor-close')) {
        close();
        return;
      }
      if (event.target.closest('#editor-save')) { save(); return; }
      if (event.target.closest('#editor-reset')) { resetDay(); return; }
      if (event.target.closest('#editor-make-workout')) { becomeWorkout(); return; }
      if (event.target.closest('#editor-make-rest')) { becomeRest(); return; }

      if (event.target.closest('#editor-add')) {
        pickerOpen = !pickerOpen;
        render();
        return;
      }

      var groupBtn = event.target.closest('[data-pick-group]');
      if (groupBtn) {
        pickerGroup = groupBtn.dataset.pickGroup;
        render();
        return;
      }

      var addBtn = event.target.closest('[data-add-exercise]');
      if (addBtn && !addBtn.disabled) {
        addExercise(addBtn.dataset.addExercise);
        return;
      }

      var removeBtn = event.target.closest('[data-remove]');
      if (removeBtn) {
        removeBlock(Number(removeBtn.dataset.remove));
        return;
      }

      var moveBtn = event.target.closest('[data-move]');
      if (moveBtn && !moveBtn.disabled) {
        moveBlock(Number(moveBtn.dataset.index), moveBtn.dataset.move);
      }
    });

    // Sets, reps and seconds as they're typed. 'input' rather than 'change'
    // so the draft is always current, even if they hit Save straight away.
    host.addEventListener('input', function (event) {
      if (!draft) return;

      // The name has to be captured as it is typed too. Adding or removing
      // an exercise redraws this whole panel, and without this the name box
      // would be rebuilt from the old title and the typing would vanish.
      if (event.target.id === 'editor-name') {
        draft.title = event.target.value;
        return;
      }

      var field = event.target.dataset ? event.target.dataset.field : null;
      if (!field) return;
      updateField(Number(event.target.dataset.index), field, event.target.value);
    });
  }

  return {
    init: init,
    open: open,
    close: close,
    isOpen: isOpen,
  };
})();
