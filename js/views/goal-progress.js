/* ============================================================================
   views/goals.js — GOAL PROGRESS BARS AND THE GOAL FORMS
   ============================================================================
   Owns three things:

     1. The list of goal progress bars on the home screen.
     2. The "add a goal" form (used from Home and from Settings).
     3. The "update my progress" form for manual goals.

   The maths all lives in js/goal-tracker.js — this file only draws things.
   ========================================================================== */

MM.goalProgress = (function () {
  var ui = MM.ui;

  /* ==========================================================================
     THE PROGRESS BARS
     ======================================================================== */
  function renderHomeGoals() {
    var host = ui.$('#home-goals');
    if (!host) return;

    ui.$('#goals-title').textContent = MM.store.get().mode === 'grind'
      ? 'THE TARGETS'
      : 'Your goals';

    var goals = MM.goalTracker.all();

    if (goals.length === 0) {
      host.innerHTML = '<div class="empty-state">No goals yet. Add one and it ' +
        'will show up here with a progress bar.</div>';
      return;
    }

    host.innerHTML = '<div class="goal-list">' +
      goals.map(goalRowHTML).join('') + '</div>';
  }

  /* options.asLink = true when the row is itself inside a link to the goal's
     own page. The Update button is left out then, because a button inside a
     button is invalid HTML and the goal page has its own. */
  function goalRowHTML(p, options) {
    var goal = p.goal;
    var asLink = options && options.asLink;

    // Manual goals get an Update button; automatic ones fill themselves in.
    var action = asLink
      ? '<span class="goal-auto">' +
          (p.metric.auto ? ui.esc(p.metric.short) : 'tap to update') + '</span>'
      : (p.metric.auto
          ? '<span class="goal-auto">' + ui.esc(p.metric.short) + '</span>'
          : '<button type="button" class="btn btn-ghost goal-update" data-update-goal="' +
              ui.esc(goal.id) + '">Update</button>');

    return '' +
      '<div class="goal-item' + (p.done ? ' is-done' : '') +
        '" data-goal-id="' + ui.esc(goal.id) + '">' +
        '<div class="goal-head">' +
          '<span class="goal-name">' +
            (goal.category ? ui.esc(MM.getGoal(goal.category).icon) + ' ' : '🎯 ') +
            ui.esc(goal.name) +
          '</span>' +
          '<span class="goal-figure">' + ui.esc(p.summary) + '</span>' +
        '</div>' +

        '<div class="progress-track" role="progressbar" aria-valuenow="' + p.percent +
          '" aria-valuemin="0" aria-valuemax="100" aria-label="' +
          ui.esc(goal.name + ': ' + p.summary) + '">' +
          '<div class="progress-fill" style="width:' + p.percent + '%"></div>' +
        '</div>' +

        '<div class="goal-foot">' +
          '<span class="goal-percent">' + p.percent + '%' +
            (p.done ? ' · ' + (MM.store.get().mode === 'grind' ? 'DONE' : 'reached!') : '') +
          '</span>' +
          deadlineHTML(p) +
          action +
        '</div>' +
      '</div>';
  }

  /* ---- The countdown, or "however long it takes" ------------------------- */
  function deadlineHTML(p) {
    var due = MM.goalTracker.deadlineInfo(p.goal);

    // No deadline is a choice, not a blank. Say so, quietly.
    if (!due) {
      return '<span class="goal-due is-open">' +
        ui.esc(MM.NO_DEADLINE_LABEL.toLowerCase()) + '</span>';
    }

    // Once a goal is reached the countdown stops mattering.
    var classes = ['goal-due'];
    if (!p.done && due.overdue) classes.push('is-over');
    else if (!p.done && due.soon) classes.push('is-soon');

    return '<span class="' + classes.join(' ') + '" title="Target date: ' +
      ui.esc(due.dateLabel) + '">' +
      (p.done ? '✓ by ' + ui.esc(due.dateLabel) : ui.esc(due.label)) +
      '</span>';
  }

  /* ==========================================================================
     ADD A GOAL
     ======================================================================== */
  function openAddForm() {
    ui.$('#entry-modal-title').textContent = 'Add a goal';

    // Build the metric dropdown straight from the catalog, so adding a metric
    // in goal-tracker.js makes it appear here with no extra work.
    var metricOptions = Object.keys(MM.GOAL_METRICS).map(function (key) {
      var selected = key === 'manual' ? ' selected' : '';
      return '<option value="' + key + '"' + selected + '>' +
        ui.esc(MM.GOAL_METRICS[key].label) + '</option>';
    }).join('');

    ui.$('#entry-modal-body').innerHTML = '' +
      '<form id="goal-form">' +
        '<div class="field">' +
          '<label for="goal-name">What is the goal?</label>' +
          '<input type="text" id="goal-name" maxlength="60" required ' +
            'placeholder="Bench press 185, run a 5k, 10,000 steps…">' +
        '</div>' +

        '<div class="field">' +
          '<label for="goal-metric">How should we measure it?</label>' +
          '<select id="goal-metric">' + metricOptions + '</select>' +
          '<p class="field-hint" id="goal-metric-hint"></p>' +
        '</div>' +

        // Only manual goals need a starting number.
        '<div id="goal-manual-fields">' +
          '<div class="field-row">' +
            '<div class="field">' +
              '<label for="goal-start">Starting at</label>' +
              '<input type="number" id="goal-start" value="0" step="any" inputmode="decimal">' +
            '</div>' +
            '<div class="field">' +
              '<label for="goal-unit">Unit</label>' +
              '<input type="text" id="goal-unit" maxlength="14" placeholder="lbs, miles, reps">' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="field">' +
          '<label for="goal-target">Target</label>' +
          '<input type="number" id="goal-target" value="0" step="any" inputmode="decimal" required>' +
          '<p class="field-hint">Your target can be lower than your starting number — ' +
            'for a mile time or a body weight, the bar fills as the number comes down.</p>' +
        '</div>' +

        // How long they're giving themselves. Optional on purpose — plenty
        // of goals are better off without a date hanging over them.
        '<div class="field">' +
          '<label for="goal-timeframe">By when?</label>' +
          '<select id="goal-timeframe">' +
            MM.GOAL_TIMEFRAMES.map(function (frame) {
              return '<option value="' + ui.esc(frame.id) + '">' +
                ui.esc(frame.label) + '</option>';
            }).join('') +
          '</select>' +
          '<p class="field-hint">Not every goal needs a date. ' +
            '"However long it takes" is a real answer — wanting to do 100 ' +
            'push-ups eventually is a perfectly good goal. You can change ' +
            'this later either way.</p>' +
        '</div>' +

        '<div class="field" id="goal-custom-date-field" style="display:none">' +
          '<label for="goal-custom-date">Pick a date</label>' +
          '<input type="date" id="goal-custom-date" min="' + MM.dates.today() + '">' +
        '</div>' +

        '<button type="submit" class="btn btn-primary btn-big btn-block">Add this goal</button>' +
      '</form>';

    ui.openModal('entry-modal');

    var metricSelect = ui.$('#goal-metric');
    var manualFields = ui.$('#goal-manual-fields');
    var hint = ui.$('#goal-metric-hint');
    var targetInput = ui.$('#goal-target');
    var unitInput = ui.$('#goal-unit');

    // Show the right fields and sensible defaults for the chosen metric.
    function syncMetric() {
      var metric = MM.GOAL_METRICS[metricSelect.value];
      var isManual = !metric.auto;

      manualFields.style.display = isManual ? '' : 'none';
      targetInput.value = metric.suggestedTarget;
      targetInput.max = metric.maxTarget;

      if (!isManual) unitInput.value = metric.unit;

      hint.textContent = isManual
        ? 'You type the current number in yourself whenever it changes.'
        : 'This fills in automatically from what you log — nothing to update by hand.';
    }

    metricSelect.addEventListener('change', syncMetric);
    syncMetric();

    // "Pick a date…" reveals the date box.
    var timeframeSelect = ui.$('#goal-timeframe');
    timeframeSelect.addEventListener('change', function () {
      ui.$('#goal-custom-date-field').style.display =
        timeframeSelect.value === 'custom' ? '' : 'none';
    });

    ui.$('#goal-form').addEventListener('submit', function (event) {
      event.preventDefault();

      var name = ui.$('#goal-name').value.trim();
      if (!name) return;

      var metric = MM.GOAL_METRICS[metricSelect.value];

      MM.goalTracker.add({
        name: name,
        metric: metricSelect.value,
        target: Number(targetInput.value),
        unit: unitInput.value.trim() || metric.unit,
        start: metric.auto ? 0 : Number(ui.$('#goal-start').value),
        deadline: MM.goalTracker.dateFromTimeframe(
          timeframeSelect.value, ui.$('#goal-custom-date').value),
      });

      ui.closeModal('entry-modal');
      ui.toast('Goal added.');
    });
  }

  /* ==========================================================================
     UPDATE PROGRESS (manual goals)
     ======================================================================== */
  function openUpdateForm(goalId) {
    var goal = MM.goalTracker.find(goalId);
    if (!goal) return;

    var p = MM.goalTracker.progress(goal);
    var unit = goal.unit ? ' ' + goal.unit : '';

    ui.$('#entry-modal-title').textContent = 'Update progress';

    ui.$('#entry-modal-body').innerHTML = '' +
      '<form id="progress-form">' +
        '<p class="muted">' + ui.esc(goal.name) + '</p>' +

        '<div class="field">' +
          '<label for="progress-value">Where are you now?</label>' +
          '<input type="number" id="progress-value" step="any" inputmode="decimal" ' +
            'value="' + ui.esc(goal.current) + '" required>' +
          '<p class="field-hint">Started at ' + ui.esc(goal.start) + unit +
            ' · aiming for ' + ui.esc(goal.target) + unit + '</p>' +
        '</div>' +

        '<div class="field">' +
          '<label for="progress-target">Change the target (optional)</label>' +
          '<input type="number" id="progress-target" step="any" inputmode="decimal" ' +
            'value="' + ui.esc(goal.target) + '">' +
        '</div>' +

        // The deadline is editable here, because almost nobody guesses the
        // timing right the first time.
        '<div class="field">' +
          '<label for="progress-deadline">By when? (optional)</label>' +
          '<input type="date" id="progress-deadline" ' +
            'value="' + ui.esc(goal.deadline || '') + '">' +
          '<button type="button" class="btn btn-ghost mt-1" id="progress-no-deadline">' +
            ui.esc(MM.NO_DEADLINE_LABEL) +
          '</button>' +
          '<p class="field-hint">' +
            (goal.deadline
              ? 'Currently ' + ui.esc(MM.goalTracker.deadlineInfo(goal).label) + '.'
              : 'No clock on this one.') +
            ' Taking the pressure off is always allowed.' +
          '</p>' +
        '</div>' +

        '<button type="submit" class="btn btn-primary btn-big btn-block">Save progress</button>' +
        '<button type="button" class="btn btn-ghost btn-block mt-1" data-close-modal>Cancel</button>' +
      '</form>';

    ui.openModal('entry-modal');

    // One tap to take the deadline off again.
    ui.$('#progress-no-deadline').addEventListener('click', function () {
      ui.$('#progress-deadline').value = '';
      ui.toast('No clock on this one.');
    });

    ui.$('#progress-form').addEventListener('submit', function (event) {
      event.preventDefault();

      var value = Number(ui.$('#progress-value').value);
      var target = Number(ui.$('#progress-target').value);

      // Goes through recordProgress so the update is added to the goal's
      // history and shows up on the graph.
      MM.goalTracker.recordProgress(goalId, {
        current: value,
        target: target,
        deadline: ui.$('#progress-deadline').value || null,
      });

      ui.closeModal('entry-modal');

      var after = MM.goalTracker.progress(MM.goalTracker.find(goalId));
      if (after.done && !p.done) {
        ui.toast(MM.store.get().mode === 'grind'
          ? 'TARGET HIT. SET A BIGGER ONE.'
          : 'Goal reached! That is a big deal.');
      } else {
        ui.toast('Progress saved.');
      }
    });
  }

  /* ==========================================================================
     THE GOAL LIST IN SETTINGS (edit targets, delete, add)
     ======================================================================== */
  function settingsGoalsHTML() {
    var data = MM.store.get();
    var goals = MM.goalTracker.all();
    var categoryCount = data.profile.goals.length;

    var rows = goals.map(function (p) {
      var goal = p.goal;
      // Never let someone delete their last category goal — the plan needs
      // at least one category to build from.
      var canDelete = !goal.category || categoryCount > 1;

      return '' +
        '<div class="goal-row">' +
          '<div class="goal-row-main">' +
            '<div class="goal-name">' + ui.esc(goal.name) + '</div>' +
            '<div class="goal-meta">' + ui.esc(p.metric.label) +
              (goal.category ? ' · from your goal categories' : ' · your own goal') +
            '</div>' +
          '</div>' +
          '<div class="goal-row-target">' +
            '<label class="sr-only" for="target-' + ui.esc(goal.id) + '">Target for ' +
              ui.esc(goal.name) + '</label>' +
            '<input type="number" id="target-' + ui.esc(goal.id) + '" step="any" ' +
              'value="' + ui.esc(goal.target) + '" data-goal-target="' + ui.esc(goal.id) + '">' +
            // The deadline is editable here too, not just in the progress form.
            '<label class="sr-only" for="due-' + ui.esc(goal.id) + '">Deadline for ' +
              ui.esc(goal.name) + '</label>' +
            '<input type="date" class="goal-row-date" id="due-' + ui.esc(goal.id) + '" ' +
              'value="' + ui.esc(goal.deadline || '') + '" ' +
              'data-goal-deadline="' + ui.esc(goal.id) + '">' +
            (canDelete
              ? '<button type="button" class="log-remove" data-delete-goal="' + ui.esc(goal.id) +
                  '" aria-label="Delete ' + ui.esc(goal.name) + '">×</button>'
              : '<span class="log-remove" style="opacity:.25" title="Keep at least one goal category">×</span>') +
          '</div>' +
        '</div>';
    }).join('');

    return '' +
      '<div class="section-title">' +
        '<h2>Goals and targets</h2>' +
        '<span class="section-hint">Shown on Home</span>' +
      '</div>' +
      '<div class="card">' +
        (rows || '<p class="small muted">No goals yet.</p>') +
        '<p class="small faint mt-1">Edit a target by typing a new number, and ' +
          'a deadline by picking a date — leave the date empty and the goal ' +
          'takes however long it takes. Goals from your categories update ' +
          'automatically from your log; your own goals are updated from the ' +
          'Home screen.</p>' +
        '<button type="button" class="btn btn-outline btn-block mt-1" id="settings-add-goal">' +
          '+ Add a goal' +
        '</button>' +
      '</div>';
  }

  /* ==========================================================================
     INIT — listeners attached once (see the note in views/plan.js).
     ======================================================================== */
  function init() {
    ui.$('#btn-add-goal').addEventListener('click', openAddForm);

    // The Update buttons are redrawn constantly, so delegate.
    ui.$('#home-goals').addEventListener('click', function (event) {
      var btn = event.target.closest('[data-update-goal]');
      if (btn) {
        openUpdateForm(btn.dataset.updateGoal);
        return;
      }

      // Tapping the goal itself opens its page over on My Goals. The Update
      // button above is handled first so it still does its own thing.
      var row = event.target.closest('[data-goal-id]');
      if (row) {
        MM.myGoalsView.openGoal(row.dataset.goalId);
        MM.app.showView('goals');
      }
    });
  }

  return {
    init: init,
    renderHomeGoals: renderHomeGoals,
    // Shared with the My Goals page so both draw progress bars identically.
    goalRowHTML: goalRowHTML,
    openAddForm: openAddForm,
    openUpdateForm: openUpdateForm,
    settingsGoalsHTML: settingsGoalsHTML,
  };
})();
