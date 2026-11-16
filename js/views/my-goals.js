/* ============================================================================
   views/plan.js — THE "MY PLAN" SCREEN
   ============================================================================
   Shows the generated week: one card per day, tappable to expand into the
   exercise list. Today's card starts open. Below the week is the nutrition
   guidance for the user's goal.

   Also owns completeToday(), which is what actually checks off a workout and
   logs it toward the streak. The home screen calls that too.
   ========================================================================== */

MM.myGoalsView = (function () {
  var ui = MM.ui;

  /* --------------------------------------------------------------------------
     Rough guess at how long a workout takes, so the day card can show it.
     Every set is the work itself plus the rest after it.
     -------------------------------------------------------------------------- */
  function estimateMinutes(day) {
    var seconds = day.blocks.reduce(function (total, block) {
      // A set of reps takes roughly 40 seconds of actual work.
      var workPerSet = block.timed ? block.seconds : 40;
      return total + block.sets * (workPerSet + (block.rest || 0));
    }, 0);

    var minutes = Math.round(seconds / 60 / 5) * 5;   // nearest 5 minutes
    return Math.max(10, Math.min(90, minutes));
  }

  /* --------------------------------------------------------------------------
     Pick a sensible activity type for the log when a plan day is checked off.
     -------------------------------------------------------------------------- */
  function activityTypeForDay(day) {
    var dayType = MM.DAY_TYPES[day.dayType];
    if (!dayType) return 'Home workout';

    if (dayType.kind === 'cardio') return 'Run';
    if (dayType.kind === 'mobility') return 'Stretching / yoga';
    if (dayType.kind === 'strength' || dayType.kind === 'power') return 'Lifting';
    return 'Home workout';
  }

  /* --------------------------------------------------------------------------
     THE CHECK-OFF. This is what makes a plan workout count for the streak.
     -------------------------------------------------------------------------- */
  function completeToday() {
    var today = MM.dates.today();
    var day = MM.planBuilder.dayForDate(today);

    if (!day || day.kind === 'rest') {
      ui.toast('Today is a rest day in your plan.');
      return;
    }

    if (MM.store.get().planCompletions[today]) {
      ui.toast('Already checked off today.');
      return;
    }

    // One update so the app only re-renders once.
    MM.store.update(function (d) {
      d.activities.push({
        id: MM.store.newId(),
        date: today,
        type: activityTypeForDay(day),
        minutes: estimateMinutes(day),
        source: 'plan',
        notes: day.title,
      });
      d.planCompletions[today] = day.id;
      d.streak.restartNotice = null;
    });

    ui.toast(MM.copy('todayDoneMsg'));
  }

  /* --------------------------------------------------------------------------
     RENDER

     This screen has two states: the list of everything, and the detail page
     for one goal. `openGoalId` decides which. It is kept here rather than in
     the URL because the whole app is one page with no router — tapping the
     My Goals tab always takes you back to the list.
     -------------------------------------------------------------------------- */
  var openGoalId = null;

  function openGoal(goalId) {
    openGoalId = goalId;
    render();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function backToList() {
    openGoalId = null;
    render();
  }

  function render() {
    // A goal can disappear underneath us (deleted, or its category turned
    // off), so fall back to the list rather than showing a blank page.
    if (openGoalId && !MM.goalTracker.find(openGoalId)) openGoalId = null;

    if (openGoalId) {
      renderGoalDetail(MM.goalTracker.find(openGoalId));
      return;
    }
    renderList();
  }

  function renderList() {
    var data = MM.store.get();
    var host = ui.$('#goals-content');

    ui.$('#goals-heading').textContent = MM.copy('goalsPageTitle');
    ui.$('#goals-intro').textContent = MM.copy('goalsPageIntro');

    // ---- No plan yet -----------------------------------------------------
    // The goals still show above the prompt: someone can have goals without
    // a built plan, and hiding what they're working toward would be odd on a
    // page called My Goals.
    if (!data.plan) {
      host.innerHTML = '' +
        goalProgressHTML() +
        '<div class="card card-accent mt-2">' +
          '<h3 class="card-title">' + ui.esc(MM.copy('noPlan')) + '</h3>' +
          '<p class="small muted">Five quick questions: your goal, your experience, ' +
            'how many days you have, your equipment, and your sport.</p>' +
          '<button type="button" class="btn btn-gradient btn-big btn-block mt-1" id="plan-setup">' +
            ui.esc(MM.copy('planSetupButton')) +
          '</button>' +
        '</div>';
      return;   // #plan-setup is handled by the delegated listener in init()
    }

    // The page runs in the order the user thinks about it:
    //   your goals -> the exercise plan that gets you there -> how to eat.
    host.innerHTML =
      goalProgressHTML() +
      planSummaryHTML(data) +
      weekHTML(data) +
      nutritionHTML(data);
  }

  /* ---- The goals themselves, each one tappable --------------------------- */
  function goalProgressHTML() {
    var goals = MM.goalTracker.all();

    // Each goal is a button leading to its own page. The graph and the
    // detail live there rather than crowding this list.
    var bars = goals.length
      ? '<div class="goal-list">' +
          goals.map(function (p) {
            return '<button type="button" class="goal-open" data-open-goal="' +
              ui.esc(p.goal.id) + '">' +
              MM.goalProgress.goalRowHTML(p, { asLink: true }) +
            '</button>';
          }).join('') +
        '</div>'
      : '<div class="empty-state">No goals yet.</div>';

    return '' +
      '<div class="section-title">' +
        '<h2>' + ui.esc(MM.copy('goalsPageTitle')) + '</h2>' +
        '<button type="button" class="btn btn-ghost" id="goals-add">+ Add goal</button>' +
      '</div>' +
      bars;
  }

  /* ==========================================================================
     ONE GOAL'S OWN PAGE
     Reached by tapping a goal in the list. Shows that goal's progress, its
     graph, the part of the plan that serves it, and how to eat for it.
     ======================================================================== */
  function renderGoalDetail(goal) {
    var data = MM.store.get();
    var p = MM.goalTracker.progress(goal);
    var due = MM.goalTracker.deadlineInfo(goal);
    var category = goal.category ? MM.getGoal(goal.category) : null;

    ui.$('#goals-heading').textContent = goal.name;
    ui.$('#goals-intro').textContent = category
      ? category.blurb
      : 'A goal you set yourself.';

    ui.$('#goals-content').innerHTML = '' +
      '<button type="button" class="btn btn-ghost back-link" id="goal-back">' +
        '← All goals' +
      '</button>' +

      // ---- Where this goal stands ----
      '<div class="card">' +
        '<div class="chip-row mb-1">' +
          '<span class="chip chip-accent">' +
            (category ? ui.esc(category.icon) + ' ' + ui.esc(category.label) : '🎯 Your own goal') +
          '</span>' +
          '<span class="chip">' + ui.esc(p.metric.label) + '</span>' +
          (due
            ? '<span class="chip' + (due.overdue && !p.done ? '' : ' chip-accent') + '">' +
                ui.esc(due.label) + ' · ' + ui.esc(due.dateLabel) + '</span>'
            : '<span class="chip">⏳ ' + ui.esc(MM.NO_DEADLINE_LABEL) + '</span>') +
        '</div>' +

        '<div class="goal-big-figure">' + ui.esc(p.summary) + '</div>' +
        '<div class="progress-track" role="progressbar" aria-valuenow="' + p.percent +
          '" aria-valuemin="0" aria-valuemax="100">' +
          '<div class="progress-fill" style="width:' + p.percent + '%"></div>' +
        '</div>' +
        '<p class="small faint mt-1">' + p.percent + '% there · started ' +
          ui.esc(MM.dates.shortLabel(goal.createdAt)) +
          (p.done ? ' · reached 🎉' : '') + '</p>' +

        (p.metric.auto
          ? '<p class="small muted mt-1">This one keeps itself up to date from ' +
              'what you log — there is nothing to fill in.</p>'
          : '<button type="button" class="btn btn-primary btn-block mt-1" ' +
              'data-update-goal="' + ui.esc(goal.id) + '">Update my progress</button>') +
      '</div>' +

      // ---- The graph ----
      '<div class="section-title"><h2>Progress over time</h2></div>' +
      '<div class="card">' +
        '<p class="small faint mb-1">' + ui.esc(chartCaption(p)) + '</p>' +
        MM.chart.line(MM.goalTracker.series(goal), { target: p.target, unit: p.unit }) +
      '</div>' +

      historyHTML(goal, p) +
      goalPlanHTML(data, category) +
      goalNutritionHTML(category);
  }

  function chartCaption(p) {
    if (!p.metric.auto) return 'Every update you have logged, against your target.';
    if (p.goal.metric === 'streak') return 'Your streak over the last 30 days.';
    return p.metric.label + ', week by week, against your target.';
  }

  /* ---- Every update, listed, for a goal you update yourself -------------- */
  function historyHTML(goal, p) {
    if (p.metric.auto) return '';

    var points = MM.goalTracker.series(goal).slice().reverse();   // newest first
    if (points.length <= 1) return '';

    return '' +
      '<div class="section-title"><h2>Every update</h2></div>' +
      '<div class="card">' +
        points.map(function (point, i) {
          var previous = points[i + 1];
          var change = previous ? point.value - previous.value : null;
          var changeText = '';

          if (change !== null && change !== 0) {
            changeText = '<span class="history-change">' +
              (change > 0 ? '+' : '') + Math.round(change * 10) / 10 + '</span>';
          }

          return '' +
            '<div class="history-row">' +
              '<span class="history-date">' +
                ui.esc(MM.dates.friendlyLabel(point.date)) + '</span>' +
              '<span class="history-value">' +
                ui.esc(point.value + (goal.unit ? ' ' + goal.unit : '')) + '</span>' +
              changeText +
            '</div>';
        }).join('') +
      '</div>';
  }

  /* ---- The days of the plan that serve this particular goal -------------- */
  function goalPlanHTML(data, category) {
    if (!category) {
      return '' +
        '<div class="section-title"><h2>Working toward it</h2></div>' +
        '<div class="card card-dim">' +
          '<p class="small muted">This is a goal you wrote yourself, so there ' +
            'is no automatic plan for it. Your weekly plan is built from your ' +
            'goal categories — and Quick Workout is good for picking something ' +
            'that targets it directly.</p>' +
          '<button type="button" class="btn btn-outline btn-block mt-1" id="goal-to-quick">' +
            'Open Quick Workout' +
          '</button>' +
        '</div>';
    }

    if (!data.plan) return '';

    // Which day types come from this goal's rotation?
    var rotation = category.rotation;
    var days = data.plan.days.filter(function (day) {
      return day.kind === 'workout' && rotation.indexOf(day.dayType) !== -1;
    });

    if (days.length === 0) {
      return '' +
        '<div class="section-title"><h2>Your plan for this</h2></div>' +
        '<div class="card card-dim">' +
          '<p class="small muted">Your week is currently built around your other ' +
            'goals. Make this one your main goal in Settings to give it more days.</p>' +
        '</div>';
    }

    return '' +
      '<div class="section-title">' +
        '<h2>Your plan for this</h2>' +
        '<span class="section-hint">' + days.length +
          (days.length === 1 ? ' day' : ' days') + ' a week</span>' +
      '</div>' +
      '<div class="day-grid">' +
        days.map(function (day) {
          return workoutDayHTML(day, false, false, null);
        }).join('') +
      '</div>';
  }

  /* ---- How to eat for this particular goal ------------------------------- */
  function goalNutritionHTML(category) {
    if (!category) return '';

    var guide = MM.nutritionForGoal(category.id);

    return '' +
      '<div class="section-title"><h2>Eating for this goal</h2></div>' +
      '<div class="card">' +
        '<h3 class="card-title">' + ui.esc(guide.headline) + '</h3>' +
        '<p class="small">' + ui.esc(guide.summary) + '</p>' +
        '<ul class="habit-list mt-1">' +
          guide.priorities.map(function (item) {
            return '<li>' + ui.esc(item) + '</li>';
          }).join('') +
        '</ul>' +
      '</div>' +
      ui.disclaimerHTML();
  }

  /* ---- The chips at the top describing the plan -------------------------- */
  function planSummaryHTML(data) {
    var plan = data.plan;
    var experience = MM.getExperience(plan.experience);
    var equipment = MM.EQUIPMENT_OPTIONS.find(function (e) { return e.id === plan.equipment; });

    // Let the user know if Chill mode gave back a rest day.
    var trimmedNote = '';
    if (plan.daysPerWeek < plan.requestedDaysPerWeek) {
      trimmedNote = '<p class="small faint mt-1">Chill mode trimmed this to ' +
        plan.daysPerWeek + ' training days so you have real recovery. ' +
        'Switch to Grind in the header for the full ' + plan.requestedDaysPerWeek + '.</p>';
    }

    // One chip per goal, so a multi-goal week is obvious at a glance.
    var goalChips = (plan.goalLabels || [plan.goalLabel]).map(function (label, i) {
      return '<span class="chip chip-accent">' + ui.esc(label) +
        (i === 0 && plan.goalLabels && plan.goalLabels.length > 1 ? ' · main' : '') +
        '</span>';
    }).join('');

    return '' +
      '<div class="card">' +
        '<div class="chip-row">' +
          goalChips +
          '<span class="chip">' + plan.daysPerWeek + ' days / week</span>' +
          '<span class="chip">' + ui.esc(experience.label) + '</span>' +
          '<span class="chip">' + ui.esc(equipment ? equipment.label : plan.equipment) + '</span>' +
          (plan.sport ? '<span class="chip">' + ui.esc(plan.sport) + '</span>' : '') +
          '<span class="chip">' + ui.esc(MM.copy('modeName', plan.mode)) + ' difficulty</span>' +
        '</div>' +
        trimmedNote +
        '<div class="btn-row mt-1">' +
          '<button type="button" class="btn btn-outline btn-ghost" id="plan-shuffle">Shuffle exercises</button>' +
          '<button type="button" class="btn btn-outline btn-ghost" id="plan-change-goal">Change goal</button>' +
        '</div>' +
      '</div>';
  }

  /* ---- The seven day cards ---------------------------------------------- */
  function weekHTML(data) {
    var todayIndex = MM.dates.weekdayIndex(MM.dates.today());
    var weekStart = MM.dates.weekStart(MM.dates.today());

    var cards = data.plan.days.map(function (day, index) {
      // The real date this plan day falls on in the current week — that's how
      // we know whether it has been checked off.
      var dateKey = MM.dates.addDays(weekStart, index);
      var isToday = index === todayIndex;
      var isDone = data.planCompletions[dateKey] === day.id;

      // The index is passed through so each card knows which day it can edit.
      return day.kind === 'rest'
        ? restDayHTML(day, isToday, index)
        : workoutDayHTML(day, isToday, isDone, dateKey, index);
    }).join('');

    // .day-grid becomes two columns on a desktop (css/desktop.css).
    return '<div class="section-title"><h2>' + ui.esc(MM.copy('goalsPlanHeading')) + '</h2>' +
      '<span class="section-hint">Mon – Sun</span></div>' +
      '<p class="view-intro mb-1">' + ui.esc(MM.copy('planIntro')) +
        ' Every workout here can be changed — tap Edit on any day.</p>' +
      '<div class="day-grid">' + cards + '</div>';
  }

  function restDayHTML(day, isToday, dayIndex) {
    return '' +
      '<div class="day-card is-rest' + (isToday ? ' is-today' : '') + '">' +
        '<div class="day-head" style="cursor:default">' +
          '<span class="day-weekday">' + ui.esc(day.weekday) + '</span>' +
          '<span class="day-info">' +
            '<span class="day-title">' + ui.esc(MM.copy('planRestLabel')) + '</span>' +
            '<span class="day-sub">' + ui.esc(MM.copy('planRestNote')) + '</span>' +
          '</span>' +
          (isToday ? '<span class="chip chip-accent">' + ui.esc(MM.copy('planTodayLabel')) + '</span>' : '') +
          // A rest day can become a workout if you want one here.
          (dayIndex === null || dayIndex === undefined ? '' :
            '<button type="button" class="btn btn-ghost day-edit" data-edit-day="' +
              dayIndex + '">+ Add</button>') +
        '</div>' +
      '</div>';
  }

  function workoutDayHTML(day, isToday, isDone, dateKey, dayIndex) {
    var minutes = estimateMinutes(day);
    var isMine = day.custom;

    var checkButton = isToday
      ? '<button type="button" class="btn btn-block mt-1 ' +
          (isDone ? 'btn-done' : 'btn-primary') + '" data-complete-day="' + ui.esc(dateKey) + '"' +
          (isDone ? ' disabled' : '') + '>' +
          ui.esc(isDone ? MM.copy('planCheckedButton') : MM.copy('planCheckButton')) +
        '</button>'
      : '';

    // The edit button is left off the goal detail page, where days are shown
    // for reference rather than to be worked on.
    var editButton = (dayIndex === null || dayIndex === undefined) ? '' :
      '<button type="button" class="btn btn-outline btn-block mt-1" data-edit-day="' +
        dayIndex + '">' +
        (isMine ? 'Edit my workout' : 'Edit this workout') +
      '</button>';

    return '' +
      '<div class="day-card' + (isToday ? ' is-today is-open' : '') + '">' +
        '<button type="button" class="day-head" data-toggle-day>' +
          '<span class="day-weekday">' + ui.esc(day.weekday) + '</span>' +
          '<span class="day-info">' +
            '<span class="day-title">' + ui.esc(day.title) + '</span>' +
            '<span class="day-sub">' + day.blocks.length + ' exercises · about ' + minutes + ' min' +
              (isDone ? ' · done ✓' : '') + (isMine ? ' · yours' : '') + '</span>' +
          '</span>' +
          (isMine ? '<span class="chip">✎ yours</span>' : '') +
          (isToday ? '<span class="chip chip-accent">' + ui.esc(MM.copy('planTodayLabel')) + '</span>' : '') +
          '<svg class="day-chevron" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-chevron"></use></svg>' +
        '</button>' +
        '<div class="day-body">' +
          (day.note ? '<p class="day-note">' + ui.esc(day.note) + '</p>' : '') +
          day.blocks.map(function (block, i) {
            return ui.exerciseRowHTML(block, i);
          }).join('') +
          checkButton +
          editButton +
        '</div>' +
      '</div>';
  }

  /* ---- Nutrition ---------------------------------------------------------
     The MAIN goal (the first one picked) drives the guidance, since trying to
     merge "eat enough to gain" with "lose weight" would produce nonsense.
     Any other goals get their key points listed underneath. */
  function nutritionHTML(data) {
    var goalIds = data.profile.goals;
    var guide = MM.nutritionForGoal(goalIds[0]);

    // Key points from the user's other goals, if they picked more than one.
    var secondary = goalIds.slice(1).map(function (id) {
      var other = MM.nutritionForGoal(id);
      return '' +
        '<div class="meal-group">' +
          '<h4>' + ui.esc(MM.getGoal(id).label) + '</h4>' +
          '<ul class="bullet-list">' +
            other.priorities.slice(0, 2).map(function (p) {
              return '<li>' + ui.esc(p) + '</li>';
            }).join('') +
          '</ul>' +
        '</div>';
    }).join('');

    var secondaryCard = secondary
      ? '<div class="card">' +
          '<h3 class="card-title">Your other goals</h3>' +
          '<p class="small muted">Your main goal sets the guidance above. ' +
            'Here is what matters most for the rest.</p>' +
          secondary +
        '</div>'
      : '';

    var mealGroups = Object.keys(guide.meals).map(function (slot) {
      return '' +
        '<div class="meal-group">' +
          '<h4>' + ui.esc(slot) + '</h4>' +
          '<ul class="bullet-list">' +
            guide.meals[slot].map(function (idea) {
              return '<li>' + ui.esc(idea) + '</li>';
            }).join('') +
          '</ul>' +
        '</div>';
    }).join('');

    // .nutrition-grid becomes 2 columns on a desktop, 3 on a big monitor.
    // .span-all keeps the summary and the disclaimer full width.
    return '' +
      '<div class="section-title">' +
        '<h2>' + ui.esc(MM.copy('goalsDietHeading')) + '</h2>' +
        '<span class="section-hint">' + ui.esc(MM.copy('nutritionTitle')) + '</span>' +
      '</div>' +

      '<div class="nutrition-grid">' +

      '<div class="card span-all">' +
        '<h3 class="card-title">' + ui.esc(guide.headline) + '</h3>' +
        '<p class="small">' + ui.esc(guide.summary) + '</p>' +
        '<p class="small faint">' + ui.esc(guide.roughRange) + '</p>' +
      '</div>' +

      '<div class="card">' +
        '<h3 class="card-title">What matters most for your goal</h3>' +
        '<ul class="habit-list">' +
          guide.priorities.map(function (p) {
            return '<li>' + ui.esc(p) + '</li>';
          }).join('') +
        '</ul>' +
      '</div>' +

      '<div class="card">' +
        '<h3 class="card-title">Daily habits for everyone</h3>' +
        '<ul class="habit-list">' +
          MM.NUTRITION_BASE_HABITS.map(function (h) {
            return '<li>' + ui.esc(h) + '</li>';
          }).join('') +
        '</ul>' +
      '</div>' +

      '<div class="card">' +
        '<h3 class="card-title">Meal and snack ideas</h3>' +
        '<p class="small muted">' + ui.esc(MM.copy('nutritionIntro')) + '</p>' +
        mealGroups +
      '</div>' +

      '<div class="card">' +
        '<h3 class="card-title">Simple tips</h3>' +
        '<ul class="bullet-list">' +
          guide.tips.map(function (t) { return '<li>' + ui.esc(t) + '</li>'; }).join('') +
        '</ul>' +
      '</div>' +

      secondaryCard +

      '<div class="span-all">' + ui.disclaimerHTML() + '</div>' +

      '</div>';   // .nutrition-grid
  }

  /* --------------------------------------------------------------------------
     CLICK HANDLING
     One delegated listener attached once at startup. render() rewrites the
     HTML inside #goals-content constantly, so attaching listeners during
     render would pile up duplicates every time the screen redraws.
     -------------------------------------------------------------------------- */
  function init() {
    ui.$('#goals-content').addEventListener('click', function (event) {
      // Expand / collapse a day card
      var head = event.target.closest('[data-toggle-day]');
      if (head) {
        head.closest('.day-card').classList.toggle('is-open');
        return;
      }

      // Check off today's workout
      if (event.target.closest('[data-complete-day]')) {
        completeToday();
        return;
      }

      // Edit a day's workout, or put one on a rest day.
      var editBtn = event.target.closest('[data-edit-day]');
      if (editBtn) {
        MM.workoutEditor.open(editBtn.dataset.editDay);
        return;
      }

      // Rebuild the plan with different exercise picks
      if (event.target.closest('#plan-shuffle')) {
        MM.planBuilder.regenerate();
        ui.toast('Fresh exercises loaded.');
        return;
      }

      if (event.target.closest('#plan-change-goal')) {
        MM.app.showView('settings');
        return;
      }

      if (event.target.closest('#plan-setup')) {
        MM.onboarding.open();
        return;
      }

      // The goal section at the top of this page reuses the same buttons as
      // the Home screen.
      if (event.target.closest('#goals-add')) {
        MM.goalProgress.openAddForm();
        return;
      }

      // --- Into and out of a single goal's page ---
      var openBtn = event.target.closest('[data-open-goal]');
      if (openBtn) {
        openGoal(openBtn.dataset.openGoal);
        return;
      }

      if (event.target.closest('#goal-back')) {
        backToList();
        return;
      }

      if (event.target.closest('#goal-to-quick')) {
        MM.app.showView('quick');
        return;
      }

      var updateBtn = event.target.closest('[data-update-goal]');
      if (updateBtn) {
        MM.goalProgress.openUpdateForm(updateBtn.dataset.updateGoal);
      }
    });
  }

  return {
    init: init,
    render: render,
    openGoal: openGoal,
    backToList: backToList,
    completeToday: completeToday,
    estimateMinutes: estimateMinutes,
  };
})();
