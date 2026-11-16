/* ============================================================================
   quick-workout.js — "WHAT SHOULD I DO RIGHT NOW?"
   ============================================================================
   Builds a short circuit that fits exactly the time the user has. The format
   is always the same so the timer stays simple:

     Do `rounds` rounds of `count` exercises.
     Each exercise = `work` seconds of effort, then `rest` seconds off.

   The math is arranged so rounds x exercises x (work + rest) lands on the
   requested time exactly — if you ask for 10 minutes, you get 10 minutes.
   ========================================================================== */

MM.quickWorkout = (function () {

  // Shape of the circuit for each time option.
  var SHAPES = {
    5:  { rounds: 2, count: 3 },
    10: { rounds: 3, count: 4 },
    20: { rounds: 4, count: 5 },
  };

  // Seconds of rest between exercises, by how much energy the user has.
  // Less rest = harder.
  var REST_BY_ENERGY = { low: 20, medium: 15, high: 10 };

  // Which muscle groups to hit, in order, so every circuit is well-rounded.
  var SLOT_TAGS = [
    ['cardio', 'fullbody'],
    ['quads', 'glutes'],
    ['chest', 'shoulders'],
    ['core'],
    ['back', 'biceps'],
    ['hamstrings', 'glutes'],
  ];

  /* --------------------------------------------------------------------------
     Build a workout.
       minutes   5 | 10 | 20
       equipment 'none' | 'dumbbells' | 'gym'
       energy    'low' | 'medium' | 'high'
     -------------------------------------------------------------------------- */
  function generate(minutes, equipment, energy) {
    var shape = SHAPES[minutes] || SHAPES[10];
    var mode = MM.store.get().mode;
    var experience = MM.getExperience(MM.store.get().profile.experience);

    // --- How hard should the exercises be? --------------------------------
    var maxDifficulty = experience.maxDifficulty;
    if (energy === 'high') maxDifficulty = Math.min(3, maxDifficulty + 1);
    if (energy === 'low') maxDifficulty = Math.min(2, maxDifficulty);
    // Grind mode is allowed one step harder than Chill mode.
    if (mode === 'grind') maxDifficulty = Math.min(3, maxDifficulty + 1);

    var pool = MM.exercisesForEquipment(equipment).filter(function (ex) {
      if (ex.difficulty > maxDifficulty) return false;
      // Low energy days skip the brutal stuff entirely.
      if (energy === 'low' && ex.intensity === 'high') return false;
      // Stretching alone isn't a workout — keep pure mobility moves out
      // unless the user is low energy.
      if (energy !== 'low' && ex.muscles.length === 1 && ex.muscles[0] === 'mobility') return false;
      return true;
    });

    // Fallback if the filters were too strict for the equipment available.
    if (pool.length < shape.count) {
      pool = MM.exercisesForEquipment(equipment);
    }

    // --- Timing -----------------------------------------------------------
    var totalSeconds = minutes * 60;
    var slotSeconds = Math.floor(totalSeconds / (shape.rounds * shape.count));
    var rest = REST_BY_ENERGY[energy] || 15;
    var work = slotSeconds - rest;

    // Never prescribe a work interval shorter than 20 seconds.
    if (work < 20) {
      work = 20;
      rest = Math.max(5, slotSeconds - work);
    }

    // --- Pick the exercises ------------------------------------------------
    var preferHard = energy === 'high' || mode === 'grind';
    var usedIds = [];
    var weekUseCount = {};
    var blocks = [];

    for (var i = 0; i < shape.count; i++) {
      var tags = SLOT_TAGS[i % SLOT_TAGS.length];
      var exercise = MM.planBuilder.pickExercise(tags, pool, usedIds, weekUseCount, preferHard);

      // If nothing matched that slot, grab anything unused so the circuit
      // still has the right number of exercises.
      if (!exercise) {
        exercise = pool.find(function (ex) { return usedIds.indexOf(ex.id) === -1; });
      }
      if (!exercise) break;

      usedIds.push(exercise.id);
      blocks.push({ exerciseId: exercise.id, work: work, rest: rest });
    }

    return {
      minutes: minutes,
      equipment: equipment,
      energy: energy,
      mode: mode,
      rounds: shape.rounds,
      work: work,
      rest: rest,
      blocks: blocks,
      totalSeconds: blocks.length * shape.rounds * (work + rest),
      title: titleFor(minutes, energy, mode),
    };
  }

  // A little flavor text so repeated workouts don't feel identical.
  function titleFor(minutes, energy, mode) {
    if (mode === 'grind') {
      if (minutes === 5) return '5 MINUTE BLITZ';
      if (minutes === 20) return '20 MINUTE GRINDER';
      return '10 MINUTE WORK SET';
    }
    if (minutes === 5) return '5 minute reset';
    if (minutes === 20) return '20 minute session';
    return '10 minute mover';
  }

  /* --------------------------------------------------------------------------
     Build a timed circuit out of an exercise list the user is already
     looking at — used by the "Start a timer" button on the Quick Workout
     screen, once they've picked a muscle group.

     Takes the first few exercises (a circuit of eight is unwieldy) and
     splits the requested minutes evenly between them.
     -------------------------------------------------------------------------- */
  function circuitFromExercises(exercises, minutes) {
    if (!exercises || exercises.length === 0) return null;

    var count = Math.min(5, exercises.length);
    var chosen = exercises.slice(0, count);
    var totalMinutes = minutes || 10;

    // Aim for 3 rounds, or fewer if there are a lot of exercises.
    var rounds = count <= 3 ? 4 : 3;

    var slotSeconds = Math.floor((totalMinutes * 60) / (rounds * count));
    var rest = 15;
    var work = slotSeconds - rest;

    if (work < 20) {
      work = 20;
      rest = Math.max(5, slotSeconds - work);
    }

    var blocks = chosen.map(function (ex) {
      return { exerciseId: ex.id, work: work, rest: rest };
    });

    return {
      minutes: totalMinutes,
      rounds: rounds,
      work: work,
      rest: rest,
      blocks: blocks,
      totalSeconds: blocks.length * rounds * (work + rest),
      title: totalMinutes + ' minute circuit',
    };
  }

  /* --------------------------------------------------------------------------
     Flatten a workout into the exact list of intervals the timer runs
     through: work, rest, work, rest... across every round.
     Used to show "up next" while the timer is counting.

     Every interval is included, trailing rest and all, so the intervals add
     up to exactly the time the user asked for. The very last rest is labelled
     "Cool down" since there's nothing left to rest for.
     -------------------------------------------------------------------------- */
  function buildSchedule(workout) {
    var schedule = [];

    for (var round = 1; round <= workout.rounds; round++) {
      workout.blocks.forEach(function (block, index) {
        var exercise = MM.getExercise(block.exerciseId);
        var isVeryLastSlot = (round === workout.rounds) && (index === workout.blocks.length - 1);

        schedule.push({
          phase: 'work',
          seconds: block.work,
          round: round,
          name: exercise ? exercise.name : 'Exercise',
          exerciseId: block.exerciseId,
        });

        schedule.push({
          phase: 'rest',
          seconds: block.rest,
          round: round,
          name: isVeryLastSlot ? 'Cool down' : 'Rest',
          exerciseId: null,
        });
      });
    }
    return schedule;
  }

  // Given seconds elapsed, which interval are we in and how long is left?
  function positionAt(schedule, elapsedSeconds) {
    var passed = 0;
    for (var i = 0; i < schedule.length; i++) {
      if (elapsedSeconds < passed + schedule[i].seconds) {
        return {
          index: i,
          item: schedule[i],
          next: schedule[i + 1] || null,
          remainingInItem: (passed + schedule[i].seconds) - elapsedSeconds,
        };
      }
      passed += schedule[i].seconds;
    }
    return null;   // the whole workout is finished
  }

  return {
    generate: generate,
    circuitFromExercises: circuitFromExercises,
    buildSchedule: buildSchedule,
    positionAt: positionAt,
  };
})();
