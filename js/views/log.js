/* ============================================================================
   views/log.js — THE TRACKER / LOG SCREEN
   ============================================================================
   Two tabs: Workouts and Meals. Workouts show up here automatically when you
   check off a plan day or finish a quick workout, and you can add anything
   manually.

   This file also owns the "log an activity" form, because the home screen's
   "I moved today" button opens the same form.
   ========================================================================== */

MM.logView = (function () {
  var ui = MM.ui;

  var currentTab = 'workouts';     // 'workouts' or 'meals'

  /* ==========================================================================
     THE ENTRY FORMS (shown in the shared modal)
     ======================================================================== */

  /* ---- Log an activity -------------------------------------------------- */
  function openActivityForm() {
    var today = MM.dates.today();

    ui.$('#entry-modal-title').textContent =
      MM.store.get().mode === 'grind' ? 'LOG THE WORK' : 'What did you do?';

    ui.$('#entry-modal-body').innerHTML = '' +
      '<form id="activity-form">' +
        // A plain text box, not a dropdown. Whatever you did counts, and a
        // fixed list of gym activities would quietly say otherwise.
        '<div class="field">' +
          '<label for="activity-type">What did you do?</label>' +
          '<input type="text" id="activity-type" maxlength="60" required ' +
            'autocomplete="off" placeholder="' +
            ui.esc(MM.copy('logWhatPlaceholder')) + '">' +
          '<p class="field-hint">Anything that got you moving. Walking the dog, ' +
            'raking leaves and dancing around your room all count.</p>' +
        '</div>' +

        // One-tap shortcuts that just fill the box in.
        '<div class="chip-row suggestion-row" id="activity-suggestions">' +
          MM.ACTIVITY_SUGGESTIONS.map(function (type) {
            return '<button type="button" class="chip chip-tap" data-suggest="' +
              ui.esc(type) + '">' + ui.esc(type) + '</button>';
          }).join('') +
        '</div>' +

        '<div class="field-row">' +
          '<div class="field">' +
            '<label for="activity-minutes">Minutes</label>' +
            '<input type="number" id="activity-minutes" value="20" min="1" max="600" inputmode="numeric">' +
          '</div>' +
          '<div class="field">' +
            '<label for="activity-date">Date</label>' +
            '<input type="date" id="activity-date" value="' + today + '" max="' + today + '">' +
          '</div>' +
        '</div>' +

        '<div class="field">' +
          '<label for="activity-notes">Notes (optional)</label>' +
          '<input type="text" id="activity-notes" placeholder="Felt good, went farther than last time…" maxlength="140">' +
        '</div>' +

        '<button type="submit" class="btn btn-primary btn-big btn-block">' +
          (MM.store.get().mode === 'grind' ? 'LOG IT' : 'Save it') +
        '</button>' +
      '</form>';

    ui.openModal('entry-modal');
    ui.$('#activity-type').focus();

    // Tapping a suggestion fills the box, leaving it editable.
    ui.$('#activity-suggestions').addEventListener('click', function (event) {
      var chip = event.target.closest('[data-suggest]');
      if (!chip) return;

      var box = ui.$('#activity-type');
      box.value = chip.dataset.suggest;
      box.focus();
    });

    // The form element is brand new each time, so this listener can't pile up.
    ui.$('#activity-form').addEventListener('submit', function (event) {
      event.preventDefault();

      var what = ui.$('#activity-type').value.trim();
      if (!what) return;            // the box is required, but be safe

      var minutes = Number(ui.$('#activity-minutes').value);
      if (!minutes || minutes < 1) minutes = 1;

      MM.store.addActivity({
        type: what,
        minutes: Math.min(600, minutes),
        date: ui.$('#activity-date').value || today,
        notes: ui.$('#activity-notes').value.trim(),
        source: 'manual',
      });

      ui.closeModal('entry-modal');
      ui.toast(MM.copy('todayDoneMsg'));
    });
  }

  /* ---- Log a meal -------------------------------------------------------- */
  function openMealForm() {
    var today = MM.dates.today();

    ui.$('#entry-modal-title').textContent = 'Log a meal';

    ui.$('#entry-modal-body').innerHTML = '' +
      '<form id="meal-form">' +
        '<div class="field">' +
          '<label for="meal-name">What did you eat?</label>' +
          '<input type="text" id="meal-name" placeholder="Chicken, rice, and broccoli" maxlength="80" required>' +
        '</div>' +

        '<div class="field-row">' +
          '<div class="field">' +
            '<label for="meal-slot">Which meal</label>' +
            '<select id="meal-slot">' +
              MM.MEAL_SLOTS.map(function (slot) {
                return '<option value="' + ui.esc(slot) + '">' + ui.esc(slot) + '</option>';
              }).join('') +
            '</select>' +
          '</div>' +
          '<div class="field">' +
            '<label for="meal-date">Date</label>' +
            '<input type="date" id="meal-date" value="' + today + '" max="' + today + '">' +
          '</div>' +
        '</div>' +

        '<div class="field">' +
          '<label for="meal-notes">Notes (optional)</label>' +
          '<input type="text" id="meal-notes" placeholder="Anything you want to remember" maxlength="140">' +
        '</div>' +

        '<p class="small faint">No calorie counting here — just a record if you find it useful.</p>' +

        '<button type="submit" class="btn btn-primary btn-big btn-block mt-1">Save meal</button>' +
      '</form>';

    ui.openModal('entry-modal');

    ui.$('#meal-form').addEventListener('submit', function (event) {
      event.preventDefault();

      var name = ui.$('#meal-name').value.trim();
      if (!name) return;

      MM.store.addMeal({
        name: name,
        slot: ui.$('#meal-slot').value,
        date: ui.$('#meal-date').value || today,
        notes: ui.$('#meal-notes').value.trim(),
      });

      ui.closeModal('entry-modal');
      ui.toast('Meal logged.');
    });
  }

  /* ==========================================================================
     THE HISTORY LIST
     ======================================================================== */

  /* Group a list of entries into [{ date, items }], newest date first. */
  function groupByDate(entries) {
    var groups = {};

    entries.forEach(function (entry) {
      if (!groups[entry.date]) groups[entry.date] = [];
      groups[entry.date].push(entry);
    });

    return Object.keys(groups)
      .sort()            // ISO day keys sort correctly as plain strings
      .reverse()         // newest first
      .map(function (date) {
        return { date: date, items: groups[date] };
      });
  }

  function render() {
    ui.$('#log-heading').textContent = MM.copy('logTitle');
    ui.$('#log-intro').textContent = MM.copy('logIntro');
    ui.$('#btn-add-log').textContent = currentTab === 'workouts' ? 'Add workout' : 'Add meal';

    renderStats();
    renderHeatmap();

    ui.$('#log-content').innerHTML = currentTab === 'workouts'
      ? workoutsHTML()
      : mealsHTML();
  }

  /* --------------------------------------------------------------------------
     The totals and the 30-day grid. These used to sit on the home screen,
     but Home is meant to answer "how am I doing and what am I working
     toward" — the detail belongs here.
     -------------------------------------------------------------------------- */
  function renderStats() {
    var best = MM.store.get().streak.best;

    var stats = [
      { value: best, name: MM.copy('bestStreakLabel') },
      { value: MM.streak.activeDaysInLast(30), name: 'Days / 30' },
      { value: MM.streak.minutesInLast(7), name: 'Min / week' },
    ];

    ui.$('#log-stats').innerHTML = stats.map(function (s) {
      return '' +
        '<div class="stat">' +
          '<div class="stat-value">' + ui.esc(s.value) + '</div>' +
          '<div class="stat-name">' + ui.esc(s.name) + '</div>' +
        '</div>';
    }).join('');
  }

  function renderHeatmap() {
    ui.$('#heatmap-title').textContent = MM.copy('heatmapTitle');
    ui.$('#heatmap-hint').textContent = MM.copy('heatmapHint');

    ui.$('#heatmap').innerHTML = MM.streak.heatmap(30).map(function (cell) {
      var classes = ['heat-cell'];
      if (cell.rest && !cell.active) classes.push('is-rest');
      if (cell.isToday) classes.push('is-today');

      // The title attribute gives a tooltip on desktop and reads out to
      // screen readers.
      var label = MM.dates.shortLabel(cell.date) + ': ';
      if (cell.active) label += cell.minutes + ' min';
      else if (cell.rest) label += 'rest day';
      else label += 'nothing logged';

      return '<div class="' + classes.join(' ') + '" data-level="' + cell.level +
        '" title="' + ui.esc(label) + '" aria-label="' + ui.esc(label) + '"></div>';
    }).join('');
  }

  function workoutsHTML() {
    var activities = MM.store.get().activities.slice();

    if (activities.length === 0) {
      return '<div class="empty-state">' + ui.esc(MM.copy('logEmpty')) + '</div>';
    }

    // Show the most recent 80 entries — plenty of history without a huge page.
    var groups = groupByDate(activities).slice(0, 80);

    return groups.map(function (group) {
      var totalMinutes = group.items.reduce(function (sum, a) {
        return sum + (a.minutes || 0);
      }, 0);

      return '' +
        '<div class="log-day">' +
          '<div class="log-day-head">' +
            '<span class="log-day-name">' + ui.esc(MM.dates.friendlyLabel(group.date)) + '</span>' +
            '<span class="log-day-total">' + totalMinutes + ' min · ' +
              ui.esc(MM.dates.weekdayName(group.date)) + '</span>' +
          '</div>' +
          group.items.map(function (a) {
            var where = a.source === 'plan' ? 'from your plan'
                      : a.source === 'quick' ? 'quick workout'
                      : 'added by you';
            return '' +
              '<div class="log-entry">' +
                '<span class="log-icon" aria-hidden="true">' + ui.activityIcon(a.type) + '</span>' +
                '<div class="log-body">' +
                  '<div class="log-name">' + ui.esc(a.type) +
                    (a.minutes ? ' · ' + a.minutes + ' min' : '') + '</div>' +
                  '<div class="log-meta">' + ui.esc(a.notes || where) + '</div>' +
                '</div>' +
                '<button type="button" class="log-remove" data-remove-activity="' + ui.esc(a.id) +
                  '" aria-label="Delete this entry">×</button>' +
              '</div>';
          }).join('') +
        '</div>';
    }).join('');
  }

  function mealsHTML() {
    var meals = MM.store.get().meals.slice();

    if (meals.length === 0) {
      return '<div class="empty-state">' + ui.esc(MM.copy('mealsEmpty')) + '</div>';
    }

    var groups = groupByDate(meals).slice(0, 80);

    return groups.map(function (group) {
      return '' +
        '<div class="log-day">' +
          '<div class="log-day-head">' +
            '<span class="log-day-name">' + ui.esc(MM.dates.friendlyLabel(group.date)) + '</span>' +
            '<span class="log-day-total">' + group.items.length + ' logged</span>' +
          '</div>' +
          group.items.map(function (m) {
            return '' +
              '<div class="log-entry">' +
                '<span class="log-icon" aria-hidden="true">' + ui.mealIcon(m.slot) + '</span>' +
                '<div class="log-body">' +
                  '<div class="log-name">' + ui.esc(m.name) + '</div>' +
                  '<div class="log-meta">' + ui.esc(m.slot) +
                    (m.notes ? ' · ' + ui.esc(m.notes) : '') + '</div>' +
                '</div>' +
                '<button type="button" class="log-remove" data-remove-meal="' + ui.esc(m.id) +
                  '" aria-label="Delete this entry">×</button>' +
              '</div>';
          }).join('') +
        '</div>';
    }).join('');
  }

  /* ==========================================================================
     INIT
     ======================================================================== */
  function init() {
    ui.initSegmented(ui.$('#log-tabs'), function (value) {
      currentTab = value;
      render();
    });

    ui.$('#btn-add-log').addEventListener('click', function () {
      if (currentTab === 'workouts') openActivityForm();
      else openMealForm();
    });

    // One delegated listener for every delete button, now and in the future.
    ui.$('#log-content').addEventListener('click', function (event) {
      var activityBtn = event.target.closest('[data-remove-activity]');
      if (activityBtn) {
        MM.store.removeActivity(activityBtn.dataset.removeActivity);
        ui.toast('Entry deleted.');
        return;
      }

      var mealBtn = event.target.closest('[data-remove-meal]');
      if (mealBtn) {
        MM.store.removeMeal(mealBtn.dataset.removeMeal);
        ui.toast('Meal deleted.');
      }
    });
  }

  return {
    init: init,
    render: render,
    openActivityForm: openActivityForm,
    openMealForm: openMealForm,
  };
})();
