/* ============================================================================
   goal-tracker.js — GOALS AND THEIR PROGRESS
   ============================================================================
   A user can have as many goals as they want, and each one shows a progress
   bar on the home screen.

   There are two kinds of goal:

   1. AUTOMATIC goals measure themselves from what you've already logged.
      "Move 5 days this week" fills itself in as you log activity — there is
      nothing to update by hand.

   2. MANUAL goals are ones only you know the number for: a bench press max,
      a mile time, a body weight. You tap "Update" and type the new number.
      These can go UP (bench 155 -> 185) or DOWN (mile 8:30 -> 7:30), and the
      progress bar understands both.

   SHAPE OF A GOAL
   ---------------
   {
     id:       'g_abc123',
     name:     'Build muscle',
     category: 'muscle' | null,   // set when it came from a goal category,
                                  // null for a goal the user wrote themselves
     metric:   'sessions',        // a key in MM.GOAL_METRICS
     target:   4,                 // the number they're aiming for
     unit:     'workouts',        // shown next to the numbers
     start:    155,               // manual goals only: where they began
     current:  170,               // manual goals only: where they are now
     deadline: '2026-12-25',      // when they want to hit it by, or null
     createdAt:'2026-11-09'
   }
   ========================================================================== */

/* ----------------------------------------------------------------------------
   HOW LONG SOMEONE GIVES THEMSELVES

   Offered when a goal is created. Each one is turned into an actual date so
   the countdown keeps working as time passes.

   "However long it takes" is deliberately FIRST and the default. Plenty of
   goals are better without a clock on them — wanting to do 100 push-ups
   eventually is a perfectly good goal, and being made to pick a date can put
   people off starting at all. It is written as a real answer rather than
   "no deadline", because it is a choice, not a thing you forgot to fill in.
   -------------------------------------------------------------------------- */
MM.GOAL_TIMEFRAMES = [
  { id: 'none', label: 'However long it takes', days: null },
  { id: '1w', label: '1 week', days: 7 },
  { id: '2w', label: '2 weeks', days: 14 },
  { id: '1m', label: '1 month', days: 30 },
  { id: '3m', label: '3 months', days: 90 },
  { id: '6m', label: '6 months', days: 180 },
  { id: '1y', label: '1 year', days: 365 },
  { id: 'custom', label: 'Pick a date…', days: 'custom' },
];

/* ----------------------------------------------------------------------------
   THE METRICS
   Each one knows how to measure itself. Weekly metrics reset every Monday.

   To add a metric, add an entry here — the goal form in views/goals.js builds
   its dropdown from this object, so it shows up automatically.
   -------------------------------------------------------------------------- */
MM.GOAL_METRICS = {
  activeDays: {
    label: 'Days moved per week',
    short: 'this week',
    unit: 'days',
    auto: true,
    suggestedTarget: 5,
    maxTarget: 7,
    // How many days this calendar week had any activity?
    measure: function () {
      return MM.goalTracker.thisWeek().filter(function (day) {
        return MM.store.isActiveDay(day);
      }).length;
    },
  },

  sessions: {
    label: 'Workouts per week',
    short: 'this week',
    unit: 'workouts',
    auto: true,
    suggestedTarget: 4,
    maxTarget: 21,
    // Every logged activity counts, so two workouts in one day count twice.
    measure: function () {
      var week = MM.goalTracker.thisWeek();
      return MM.store.get().activities.filter(function (a) {
        return week.indexOf(a.date) !== -1;
      }).length;
    },
  },

  minutes: {
    label: 'Minutes per week',
    short: 'this week',
    unit: 'min',
    auto: true,
    suggestedTarget: 150,
    maxTarget: 2000,
    measure: function () {
      var week = MM.goalTracker.thisWeek();
      return MM.store.get().activities.reduce(function (sum, a) {
        return week.indexOf(a.date) !== -1 ? sum + (a.minutes || 0) : sum;
      }, 0);
    },
  },

  streak: {
    label: 'Streak length',
    short: 'current streak',
    unit: 'days',
    auto: true,
    suggestedTarget: 30,
    maxTarget: 1000,
    measure: function () {
      return MM.streak.compute().length;
    },
  },

  manual: {
    label: 'A number I update myself',
    short: 'updated by you',
    unit: '',
    auto: false,
    suggestedTarget: 0,
    maxTarget: 100000,
    measure: function (goal) {
      return Number(goal.current) || 0;
    },
  },
};

MM.goalTracker = (function () {

  /* ---- The current Monday-to-Sunday week, as day keys ------------------- */
  function thisWeek() {
    var monday = MM.dates.weekStart(MM.dates.today());
    var days = [];
    for (var i = 0; i < 7; i++) days.push(MM.dates.addDays(monday, i));
    return days;
  }

  function metricFor(goal) {
    return MM.GOAL_METRICS[goal.metric] || MM.GOAL_METRICS.manual;
  }

  /* --------------------------------------------------------------------------
     Work out how far along a goal is.
     Returns everything the progress bar needs to draw itself.
     -------------------------------------------------------------------------- */
  function progress(goal) {
    var metric = metricFor(goal);
    var current = metric.measure(goal);
    var target = Number(goal.target) || 0;
    var start = Number(goal.start) || 0;

    // Which way is "better"? For a manual goal with a target below where you
    // started (losing weight, dropping a mile time), smaller is better.
    var goingDown = !metric.auto && target < start;

    var percent;
    if (goingDown) {
      var totalDrop = start - target;
      percent = totalDrop > 0 ? ((start - current) / totalDrop) * 100 : 100;
    } else if (target > 0) {
      // Automatic goals always climb from zero.
      var from = metric.auto ? 0 : start;
      var span = target - from;
      percent = span > 0 ? ((current - from) / span) * 100 : 100;
    } else {
      percent = 0;
    }

    percent = Math.max(0, Math.min(100, Math.round(percent)));

    return {
      goal: goal,
      metric: metric,
      current: current,
      target: target,
      percent: percent,
      done: percent >= 100,
      goingDown: goingDown,
      unit: goal.unit || metric.unit,
      // "3 / 4 workouts" or "170 → 185 lbs"
      summary: goingDown
        ? current + ' → ' + target + (goal.unit ? ' ' + goal.unit : '')
        : current + ' / ' + target + (goal.unit || metric.unit ? ' ' + (goal.unit || metric.unit) : ''),
    };
  }

  /* --------------------------------------------------------------------------
     DEADLINES — how long someone gave themselves.

     Entirely optional: plenty of goals are better off without a date on
     them. Returns null when there isn't one, otherwise everything the UI
     needs to show a countdown.
     -------------------------------------------------------------------------- */
  function deadlineInfo(goal) {
    if (!goal || !goal.deadline) return null;

    var daysLeft = MM.dates.daysBetween(MM.dates.today(), goal.deadline);
    var label;

    if (daysLeft === 0) label = 'Due today';
    else if (daysLeft === 1) label = '1 day left';
    else if (daysLeft > 0 && daysLeft < 14) label = daysLeft + ' days left';
    else if (daysLeft >= 14) label = Math.round(daysLeft / 7) + ' weeks left';
    else if (daysLeft === -1) label = '1 day past';
    else label = Math.abs(daysLeft) + ' days past';

    return {
      date: goal.deadline,
      dateLabel: MM.dates.shortLabel(goal.deadline),
      daysLeft: daysLeft,
      overdue: daysLeft < 0,
      soon: daysLeft >= 0 && daysLeft <= 7,
      label: label,
    };
  }

  /* What to call this goal's timing on screen. A goal with no deadline is
     not blank — it is "however long it takes", and saying so out loud keeps
     it feeling like a decision rather than an omission. */
  MM.NO_DEADLINE_LABEL = 'However long it takes';

  function deadlineLabel(goal) {
    var due = deadlineInfo(goal);
    return due ? due.label : MM.NO_DEADLINE_LABEL;
  }

  // Turn a timeframe choice from MM.GOAL_TIMEFRAMES into a real date.
  function dateFromTimeframe(timeframeId, customDate) {
    var frame = MM.GOAL_TIMEFRAMES.find(function (f) { return f.id === timeframeId; });
    if (!frame || frame.days === null) return null;
    if (frame.days === 'custom') return customDate || null;
    return MM.dates.addDays(MM.dates.today(), frame.days);
  }

  /* ---- Every goal, with its progress worked out ------------------------- */
  function all() {
    return MM.store.get().trackedGoals.map(progress);
  }

  function find(id) {
    return MM.store.get().trackedGoals.find(function (g) { return g.id === id; });
  }

  /* --------------------------------------------------------------------------
     Build the automatic goal that comes with a goal category. The targets
     live in MM.GOALS (js/data/plan-templates.js) so they're easy to tune.
     -------------------------------------------------------------------------- */
  function forCategory(categoryId) {
    var category = MM.getGoal(categoryId);
    var tracker = category.tracker || { metric: 'activeDays', target: 4 };
    var metric = MM.GOAL_METRICS[tracker.metric] || MM.GOAL_METRICS.activeDays;

    return {
      id: 'g_' + categoryId,
      name: category.label,
      category: categoryId,
      metric: tracker.metric,
      target: tracker.target,
      unit: metric.unit,
      start: 0,
      current: 0,
      createdAt: MM.dates.today(),
    };
  }

  /* --------------------------------------------------------------------------
     Keep the automatic category goals in step with the categories the user
     picked in onboarding: add goals for new categories, drop goals for ones
     they deselected. Goals the user wrote themselves are never touched.
     -------------------------------------------------------------------------- */
  function syncWithCategories(data) {
    var chosen = data.profile.goals || [];

    // Drop category goals for categories that are no longer selected.
    data.trackedGoals = data.trackedGoals.filter(function (g) {
      return !g.category || chosen.indexOf(g.category) !== -1;
    });

    // Add one for any newly selected category.
    chosen.forEach(function (categoryId) {
      var exists = data.trackedGoals.some(function (g) { return g.category === categoryId; });
      if (!exists) data.trackedGoals.push(forCategory(categoryId));
    });

    // Keep them in the same order the categories are listed in.
    data.trackedGoals.sort(function (a, b) {
      var ai = a.category ? chosen.indexOf(a.category) : 100;
      var bi = b.category ? chosen.indexOf(b.category) : 100;
      return ai - bi;
    });
  }

  /* ---- Adding, editing, and removing ------------------------------------ */

  // Add a goal the user wrote themselves.
  function add(goal) {
    MM.store.update(function (d) {
      d.trackedGoals.push({
        id: 'g_' + MM.store.newId(),
        name: (goal.name || 'My goal').slice(0, 60),
        category: null,
        metric: goal.metric || 'manual',
        target: Number(goal.target) || 0,
        unit: (goal.unit || '').slice(0, 14),
        start: Number(goal.start) || 0,
        current: Number(goal.start) || 0,
        deadline: goal.deadline || null,
        // The graph starts from where they began, so the first update has
        // something to be measured against.
        history: [{ date: MM.dates.today(), value: Number(goal.start) || 0 }],
        createdAt: MM.dates.today(),
      });
    });
  }

  // Change when someone wants to hit a goal by — people rarely guess the
  // timing right first go. Pass null to drop the deadline entirely.
  function setDeadline(id, date) {
    MM.store.update(function (d) {
      var goal = d.trackedGoals.find(function (g) { return g.id === id; });
      if (goal) goal.deadline = date || null;
    });
  }

  function remove(id) {
    MM.store.update(function (d) {
      d.trackedGoals = d.trackedGoals.filter(function (g) { return g.id !== id; });
      // If it was a category goal, deselect that category too so it doesn't
      // get re-added the next time things sync.
      var gone = (d.profile.goals || []).filter(function (categoryId) {
        return 'g_' + categoryId !== id;
      });
      if (gone.length > 0) d.profile.goals = gone;
    });
  }

  // Change the number someone is aiming for.
  function setTarget(id, target) {
    MM.store.update(function (d) {
      var goal = d.trackedGoals.find(function (g) { return g.id === id; });
      if (goal) goal.target = Number(target) || 0;
    });
  }

  // THE "UPDATE MY PROGRESS" ACTION for manual goals.
  function setCurrent(id, value) {
    recordProgress(id, { current: value });
  }

  /* --------------------------------------------------------------------------
     Save an update to a manual goal, keeping a dated history point so the
     progress graph has something to draw.

     Everything that changes a manual goal's number goes through here, so
     history can never quietly stop being recorded. Two updates on the same
     day replace each other rather than stacking up — the graph wants one
     point per day, not one per button press.
     -------------------------------------------------------------------------- */
  function recordProgress(id, changes) {
    MM.store.update(function (d) {
      var goal = d.trackedGoals.find(function (g) { return g.id === id; });
      if (!goal) return;

      if (changes.target !== undefined) goal.target = Number(changes.target) || 0;
      if (changes.deadline !== undefined) goal.deadline = changes.deadline || null;
      if (changes.current === undefined) return;

      goal.current = Number(changes.current) || 0;

      if (!Array.isArray(goal.history)) goal.history = [];
      var today = MM.dates.today();
      var todaysPoint = goal.history.find(function (h) { return h.date === today; });

      if (todaysPoint) todaysPoint.value = goal.current;
      else goal.history.push({ date: today, value: goal.current });

      // Oldest first, so the graph reads left to right.
      goal.history.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    });
  }

  /* --------------------------------------------------------------------------
     THE DATA BEHIND THE PROGRESS GRAPH
     Returns [{ date, value }] oldest first, for any kind of goal.

     Manual goals use the history recorded above. Automatic goals don't need
     a stored history — their numbers can be worked out from the log at any
     time, so we just recompute them for each past week (or each past day,
     for a streak).
     -------------------------------------------------------------------------- */
  function series(goal) {
    if (!goal) return [];
    var metric = metricFor(goal);

    // ---- Manual: whatever they typed in, when they typed it ----
    if (!metric.auto) {
      var points = (goal.history || []).slice();

      // Goals made before histories existed have none, so fall back to the
      // two numbers we do know: where they started and where they are.
      if (points.length === 0) {
        points.push({ date: goal.createdAt, value: Number(goal.start) || 0 });
        if (goal.current !== goal.start) {
          points.push({ date: MM.dates.today(), value: Number(goal.current) || 0 });
        }
      }
      return points;
    }

    // ---- A streak: its length on each of the last 30 days ----
    if (goal.metric === 'streak') {
      return MM.dates.lastNDays(30).map(function (day) {
        return { date: day, value: MM.streak.compute(day).length };
      });
    }

    // ---- Weekly metrics: the total for each of the last 8 weeks ----
    var thisMonday = MM.dates.weekStart(MM.dates.today());
    var weeks = [];
    for (var back = 7; back >= 0; back--) {
      var monday = MM.dates.addDays(thisMonday, -7 * back);
      weeks.push({ date: monday, value: weeklyValue(goal.metric, monday) });
    }
    return weeks;
  }

  // What a weekly metric came to in the week beginning on `monday`.
  function weeklyValue(metricId, monday) {
    var days = [];
    for (var i = 0; i < 7; i++) days.push(MM.dates.addDays(monday, i));

    var inWeek = MM.store.get().activities.filter(function (a) {
      return days.indexOf(a.date) !== -1;
    });

    if (metricId === 'sessions') return inWeek.length;
    if (metricId === 'minutes') {
      return inWeek.reduce(function (sum, a) { return sum + (a.minutes || 0); }, 0);
    }
    // activeDays — count distinct days, not entries
    var seen = {};
    inWeek.forEach(function (a) { seen[a.date] = true; });
    return Object.keys(seen).length;
  }

  return {
    thisWeek: thisWeek,
    progress: progress,
    deadlineInfo: deadlineInfo,
    deadlineLabel: deadlineLabel,
    dateFromTimeframe: dateFromTimeframe,
    setDeadline: setDeadline,
    all: all,
    find: find,
    forCategory: forCategory,
    syncWithCategories: syncWithCategories,
    add: add,
    remove: remove,
    setTarget: setTarget,
    setCurrent: setCurrent,
    recordProgress: recordProgress,
    series: series,
    weeklyValue: weeklyValue,
  };
})();
