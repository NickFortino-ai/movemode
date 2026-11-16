/* ============================================================================
   plan-builder.js — TURNS ONBOARDING ANSWERS INTO A WEEKLY PLAN
   ============================================================================
   Takes the user's profile (goal, experience, days per week, equipment) plus
   the current mode, and builds a 7-day plan out of the exercise library.

   The recipe pieces (goals, day types, set/rep schemes, mode tuning) all live
   in js/data/plan-templates.js. This file is the machinery that puts them
   together, so most tweaks you want to make are probably over there.

   SHAPE OF A GENERATED PLAN
   -------------------------
   {
     createdAt: '2026-03-14',
     goal: 'muscle',
     mode: 'grind',               // which mode it was tuned for
     daysPerWeek: 4,
     sport: 'Football',
     days: [                      // always 7, Monday first
       {
         id: 'day-0',
         weekday: 'Mon',
         kind: 'workout',         // or 'rest'
         title: 'Lower Body',
         note: 'Legs and glutes...',
         blocks: [
           { exerciseId, sets, reps, seconds, rest, timed, label }
         ]
       }
     ]
   }
   ========================================================================== */

MM.planBuilder = (function () {

  // Higher number = needs more equipment. Used to prefer "real" lifts for
  // people who have a gym, instead of giving everyone push-ups.
  var EQUIPMENT_RANK = { none: 0, dumbbells: 1, gym: 2 };

  /* --------------------------------------------------------------------------
     Which weekday indexes (0 = Monday) get a workout, spread as evenly as
     possible across the week. 3 days/week -> Mon, Wed, Sat.
     -------------------------------------------------------------------------- */
  function spreadWorkoutDays(daysPerWeek) {
    var days = Math.max(1, Math.min(7, daysPerWeek));
    var picked = [];
    for (var i = 0; i < days; i++) {
      var index = Math.round(i * 7 / days);
      if (index > 6) index = 6;
      if (picked.indexOf(index) === -1) picked.push(index);
    }
    // If rounding collapsed two slots into one, fill from the first free day.
    for (var day = 0; day < 7 && picked.length < days; day++) {
      if (picked.indexOf(day) === -1) picked.push(day);
    }
    return picked.sort(function (a, b) { return a - b; });
  }

  /* --------------------------------------------------------------------------
     Pick one exercise for a slot.

     slotTags     e.g. ['quads'] — the exercise must hit at least one of these
     pool         exercises this person is allowed to do
     usedToday    ids already in today's workout (never repeat within a day)
     weekUseCount { exerciseId: timesUsedThisWeek } — spreads variety around
     preferHard   true for strength/power days, false for easy/mobility days
     -------------------------------------------------------------------------- */
  function pickExercise(slotTags, pool, usedToday, weekUseCount, preferHard) {
    var candidates = pool.filter(function (ex) {
      if (usedToday.indexOf(ex.id) !== -1) return false;
      return slotTags.some(function (tag) { return ex.muscles.indexOf(tag) !== -1; });
    });

    if (candidates.length === 0) return null;

    // Score each candidate, highest wins.
    candidates.forEach(function (ex) {
      var equipScore = EQUIPMENT_RANK[ex.equipment] * 3;
      var hardScore = preferHard ? ex.difficulty : (4 - ex.difficulty);
      var repeatPenalty = (weekUseCount[ex.id] || 0) * 4;
      var jitter = Math.random() * 2;   // keeps plans from being identical

      ex._score = equipScore + hardScore - repeatPenalty + jitter;
    });

    candidates.sort(function (a, b) { return b._score - a._score; });
    return candidates[0];
  }

  /* --------------------------------------------------------------------------
     Build the sets/reps prescription for one exercise on one day.
     -------------------------------------------------------------------------- */
  function prescribe(exercise, dayKind, goal, experience, tuning) {
    var kindSchemes = MM.SET_SCHEMES[dayKind] || MM.SET_SCHEMES.strength;
    var scheme = kindSchemes[goal] || kindSchemes.default;

    // Cardio is one continuous effort, so sets stay at 1 no matter what.
    var sets;
    if (dayKind === 'cardio' || dayKind === 'mobility') {
      sets = scheme.sets;
    } else {
      sets = scheme.sets + experience.setBonus + tuning.setDelta;
      sets = Math.max(1, Math.min(6, sets));
    }

    // Round timed work to the nearest 5 seconds so it reads nicely.
    var seconds = Math.round(scheme.seconds * tuning.secondsFactor / 5) * 5;

    return {
      exerciseId: exercise.id,
      sets: sets,
      reps: scheme.reps,
      seconds: seconds,
      rest: scheme.rest,
      timed: exercise.timed,
    };
  }

  /* --------------------------------------------------------------------------
     Build one workout day.
     -------------------------------------------------------------------------- */
  function buildWorkoutDay(dayTypeKey, weekdayIndex, ctx) {
    var dayType = MM.DAY_TYPES[dayTypeKey] || MM.DAY_TYPES.fullbody_strength;
    var preferHard = dayType.kind === 'strength' || dayType.kind === 'power';

    // How many exercises today?
    var count = ctx.experience.exerciseCount + ctx.tuning.exerciseDelta;
    if (ctx.goal === 'just_move') count = Math.min(count, 4);
    count = Math.max(3, Math.min(count, dayType.focus.length));

    var blocks = [];
    var usedToday = [];

    for (var i = 0; i < count; i++) {
      var exercise = pickExercise(
        dayType.focus[i],
        ctx.pool,
        usedToday,
        ctx.weekUseCount,
        preferHard
      );
      if (!exercise) continue;         // nothing in the library fits, skip it

      usedToday.push(exercise.id);
      ctx.weekUseCount[exercise.id] = (ctx.weekUseCount[exercise.id] || 0) + 1;
      blocks.push(prescribe(exercise, dayType.kind, ctx.goal, ctx.experience, ctx.tuning));
    }

    // Mode flavor: Grind adds a finisher, Chill adds a cooldown stretch.
    var bonus = buildBonusBlock(ctx, usedToday);
    if (bonus) blocks.push(bonus);

    return {
      id: 'day-' + weekdayIndex,
      weekday: MM.WEEKDAYS[weekdayIndex],
      weekdayLong: MM.WEEKDAYS_LONG[weekdayIndex],
      kind: 'workout',
      dayType: dayTypeKey,
      title: dayType.title,
      note: dayType.note,
      blocks: blocks,
    };
  }

  /* --------------------------------------------------------------------------
     The last block of a workout depends on the mode:
       Grind -> a short, nasty finisher
       Chill -> an easy stretch to end on
     -------------------------------------------------------------------------- */
  function buildBonusBlock(ctx, usedToday) {
    var wantTags = ctx.mode === 'grind'
      ? ['cardio', 'fullbody', 'power']
      : ['mobility'];

    var exercise = pickExercise(wantTags, ctx.pool, usedToday, ctx.weekUseCount, ctx.mode === 'grind');
    if (!exercise) return null;

    ctx.weekUseCount[exercise.id] = (ctx.weekUseCount[exercise.id] || 0) + 1;

    if (ctx.mode === 'grind') {
      return {
        exerciseId: exercise.id,
        sets: 2,
        reps: 'max effort',
        seconds: 45,
        rest: 45,
        timed: exercise.timed,
        label: 'FINISHER',
      };
    }
    return {
      exerciseId: exercise.id,
      sets: 1,
      reps: 'easy',
      seconds: 60,
      rest: 0,
      timed: exercise.timed,
      label: 'Cool down',
    };
  }

  function buildRestDay(weekdayIndex) {
    return {
      id: 'day-' + weekdayIndex,
      weekday: MM.WEEKDAYS[weekdayIndex],
      weekdayLong: MM.WEEKDAYS_LONG[weekdayIndex],
      kind: 'rest',
      title: null,     // the view fills this in using the current mode's words
      note: null,
      blocks: [],
    };
  }

  /* --------------------------------------------------------------------------
     When someone picks more than one goal, take turns pulling day types from
     each goal's rotation so the week serves all of them.

     Two goals -> goal A's first day, goal B's first day, goal A's second,
     goal B's second, and so on. We only ever need seven.
     -------------------------------------------------------------------------- */
  function blendRotations(goalIds) {
    var rotations = goalIds.map(function (id) { return MM.getGoal(id).rotation; });
    var blended = [];

    for (var i = 0; i < 7; i++) {
      var rotation = rotations[i % rotations.length];
      var step = Math.floor(i / rotations.length);
      blended.push(rotation[step % rotation.length]);
    }
    return blended;
  }

  /* --------------------------------------------------------------------------
     THE MAIN ENTRY POINT
     MM.planBuilder.build(profile, mode) -> plan object
     -------------------------------------------------------------------------- */
  function build(profile, mode, customDays) {
    var activeMode = mode || MM.SITE.defaultMode;
    var tuning = MM.MODE_TUNING[activeMode] || MM.MODE_TUNING.chill;

    // One or more goal categories. The first is "primary": it decides the
    // sets-and-reps scheme and which nutrition guidance is shown.
    var goalIds = (profile.goals && profile.goals.length)
      ? profile.goals
      : [profile.goal || 'general'];
    var primaryGoal = MM.getGoal(goalIds[0]);
    var rotation = blendRotations(goalIds);

    var experience = MM.getExperience(profile.experience);

    // Chill mode quietly gives back a rest day to anyone training 6–7 days.
    var daysPerWeek = profile.daysPerWeek;
    if (tuning.extraRestDay && daysPerWeek >= 6) daysPerWeek = daysPerWeek - 1;

    // Which exercises is this person allowed to see?
    var maxDifficulty = Math.min(experience.maxDifficulty, tuning.maxDifficultyCap);
    var pool = MM.exercisesForEquipment(profile.equipment).filter(function (ex) {
      return ex.difficulty <= maxDifficulty;
    });

    // Safety net: if the filters left us with almost nothing (for example a
    // brand-new lifter with no equipment), loosen the difficulty cap.
    if (pool.length < 12) {
      pool = MM.exercisesForEquipment(profile.equipment).filter(function (ex) {
        return ex.difficulty <= maxDifficulty + 1;
      });
    }

    var ctx = {
      pool: pool,
      goal: goalIds[0],
      experience: experience,
      tuning: tuning,
      mode: activeMode,
      weekUseCount: {},
    };

    var workoutDays = spreadWorkoutDays(daysPerWeek);
    var days = [];
    var rotationStep = 0;

    for (var i = 0; i < 7; i++) {
      if (workoutDays.indexOf(i) !== -1) {
        var dayTypeKey = rotation[rotationStep % rotation.length];
        days.push(buildWorkoutDay(dayTypeKey, i, ctx));
        rotationStep++;
      } else {
        days.push(buildRestDay(i));
      }
    }

    // Lay the user's own days over the generated ones. Because their edits
    // are stored separately (data.customDays), regenerating the plan — when
    // the mode changes, a goal changes, or they shuffle the exercises — can
    // never throw away a workout they wrote themselves.
    var overrides = customDays || {};
    Object.keys(overrides).forEach(function (index) {
      var i = Number(index);
      if (i >= 0 && i < 7 && overrides[index]) {
        days[i] = overrides[index];
      }
    });

    return {
      createdAt: MM.dates.today(),
      goal: goalIds[0],
      goals: goalIds.slice(),
      goalLabel: primaryGoal.label,
      goalLabels: goalIds.map(function (id) { return MM.getGoal(id).label; }),
      mode: activeMode,
      daysPerWeek: daysPerWeek,
      requestedDaysPerWeek: profile.daysPerWeek,
      experience: profile.experience,
      equipment: profile.equipment,
      sport: profile.sport || '',
      days: days,
    };
  }

  /* --------------------------------------------------------------------------
     Rebuild the saved plan using the current profile and mode. Called after
     onboarding, after changing the goal in Settings, and when the user
     switches modes (since mode changes the default difficulty).

     Plan check-offs are kept — they are stored by date, not by plan, so
     history survives a rebuild.
     -------------------------------------------------------------------------- */
  function regenerate() {
    MM.store.update(function (d) {
      // customDays must be passed in, or shuffling would quietly wipe out
      // any workout the user wrote themselves.
      d.plan = build(d.profile, d.mode, d.customDays);
    });
  }

  // The plan day that lines up with a given date (defaults to today).
  function dayForDate(dateKey) {
    var d = MM.store.get();
    if (!d.plan) return null;
    var index = MM.dates.weekdayIndex(dateKey || MM.dates.today());
    return d.plan.days[index] || null;
  }

  return {
    build: build,
    regenerate: regenerate,
    dayForDate: dayForDate,
    spreadWorkoutDays: spreadWorkoutDays,
    // Shared with quick-workout.js so both build workouts the same way.
    pickExercise: pickExercise,
  };
})();
