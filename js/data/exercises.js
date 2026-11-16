/* ============================================================================
   exercises.js — THE EXERCISE LIBRARY
   ============================================================================
   Every workout in the app (plan workouts AND quick workouts) is built from
   this list. Adding a new exercise here makes it instantly available
   everywhere. Nothing else needs to change.

   HOW TO ADD AN EXERCISE
   ----------------------
   Copy an existing entry and edit it. Fields:

     id          unique lowercase slug, no spaces (used internally)
     name        what the user sees
     muscles     array of tags. Used to pick exercises for a day's focus.
                 Valid tags: quads, hamstrings, glutes, calves, chest, back,
                 shoulders, biceps, triceps, core, cardio, fullbody,
                 mobility, power, speed
     equipment   'none' | 'dumbbells' | 'gym'
                 'none'      = nothing needed (always available)
                 'dumbbells' = needs dumbbells (available to dumbbells + gym)
                 'gym'       = needs barbells/machines (gym only)
     difficulty  1 = anyone can do it, 2 = some experience, 3 = experienced
     intensity   'low' | 'medium' | 'high'  (how gassed you get)
     timed       true  = measured in seconds (app shows "40 sec")
                 false = measured in sets x reps
     howTo       one or two short sentences. Keep it plain and friendly.
   ========================================================================== */

MM.EXERCISES = [
  /* ---------- BODYWEIGHT: LOWER BODY ------------------------------------- */
  {
    id: 'bodyweight-squat',
    name: 'Bodyweight Squat',
    muscles: ['quads', 'glutes'],
    equipment: 'none',
    difficulty: 1,
    intensity: 'medium',
    timed: false,
    howTo: 'Stand with feet about shoulder-width apart. Sit your hips back and down like you are reaching for a chair, then stand back up. Keep your chest tall and your heels down.',
  },
  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    muscles: ['glutes', 'hamstrings'],
    equipment: 'none',
    difficulty: 1,
    intensity: 'low',
    timed: false,
    howTo: 'Lie on your back, knees bent, feet flat. Push through your heels to lift your hips until your body makes a straight line from knees to shoulders. Squeeze your glutes at the top.',
  },
  {
    id: 'single-leg-glute-bridge',
    name: 'Single-Leg Glute Bridge',
    muscles: ['glutes', 'hamstrings', 'core'],
    equipment: 'none',
    difficulty: 2,
    intensity: 'medium',
    timed: false,
    howTo: 'Same as a glute bridge, but with one foot planted and the other knee pulled toward your chest. Keep your hips level — do not let one side dip.',
  },
  {
    id: 'reverse-lunge',
    name: 'Reverse Lunge',
    muscles: ['quads', 'glutes'],
    equipment: 'none',
    difficulty: 2,
    intensity: 'medium',
    timed: false,
    howTo: 'Step one foot straight back and lower until both knees are bent about 90 degrees. Push through the front foot to stand. Alternate legs. Count reps per leg.',
  },
  {
    id: 'wall-sit',
    name: 'Wall Sit',
    muscles: ['quads', 'glutes'],
    equipment: 'none',
    difficulty: 1,
    intensity: 'medium',
    timed: true,
    howTo: 'Slide your back down a wall until your thighs are parallel to the floor, knees over ankles. Hold. It burns — that is the point.',
  },
  {
    id: 'calf-raise',
    name: 'Calf Raise',
    muscles: ['calves'],
    equipment: 'none',
    difficulty: 1,
    intensity: 'low',
    timed: false,
    howTo: 'Stand tall, push up onto the balls of your feet, pause for a second at the top, then lower slowly. Hold a wall for balance if you need it.',
  },

  /* ---------- BODYWEIGHT: UPPER BODY ------------------------------------- */
  {
    id: 'incline-pushup',
    name: 'Incline Push-Up',
    muscles: ['chest', 'triceps', 'shoulders'],
    equipment: 'none',
    difficulty: 1,
    intensity: 'low',
    timed: false,
    howTo: 'Put your hands on a bench, couch, or stair instead of the floor. Lower your chest to your hands and press back up. The higher the surface, the easier it is.',
  },
  {
    id: 'pushup',
    name: 'Push-Up',
    muscles: ['chest', 'triceps', 'shoulders', 'core'],
    equipment: 'none',
    difficulty: 2,
    intensity: 'medium',
    timed: false,
    howTo: 'Hands a bit wider than your shoulders, body in one straight line. Lower your chest toward the floor with your elbows at about 45 degrees, then press back up.',
  },
  {
    id: 'pike-pushup',
    name: 'Pike Push-Up',
    muscles: ['shoulders', 'triceps'],
    equipment: 'none',
    difficulty: 3,
    intensity: 'medium',
    timed: false,
    howTo: 'Start in a push-up position, then walk your feet in so your hips point up like an upside-down V. Lower the top of your head toward the floor and press back up.',
  },
  {
    id: 'inverted-row',
    name: 'Inverted Row',
    muscles: ['back', 'biceps'],
    equipment: 'none',
    difficulty: 2,
    intensity: 'medium',
    timed: false,
    howTo: 'Lie under a sturdy table or a low bar and grab the edge. Keep your body straight and pull your chest up to your hands. Bend your knees to make it easier.',
  },
  {
    id: 'backpack-curl',
    name: 'Backpack Curl',
    muscles: ['biceps'],
    equipment: 'none',
    difficulty: 1,
    intensity: 'low',
    timed: false,
    howTo: 'Load a backpack with books and hold the straps in both hands. Curl it up to your chest and lower it slowly. No weights needed to train your arms.',
  },
  {
    id: 'superman',
    name: 'Superman Hold',
    muscles: ['back', 'glutes'],
    equipment: 'none',
    difficulty: 1,
    intensity: 'low',
    timed: true,
    howTo: 'Lie face down with arms stretched overhead. Lift your arms, chest, and legs a few inches off the floor and hold. Breathe the whole time.',
  },

  /* ---------- BODYWEIGHT: CORE ------------------------------------------- */
  {
    id: 'plank',
    name: 'Plank',
    muscles: ['core', 'shoulders'],
    equipment: 'none',
    difficulty: 1,
    intensity: 'low',
    timed: true,
    howTo: 'Rest on your forearms and toes with your body in one straight line. Squeeze your stomach and glutes so your hips do not sag or spike up.',
  },
  {
    id: 'side-plank',
    name: 'Side Plank',
    muscles: ['core'],
    equipment: 'none',
    difficulty: 2,
    intensity: 'low',
    timed: true,
    howTo: 'Lie on one side, prop yourself up on your forearm, and lift your hips so your body is a straight diagonal line. Hold, then switch sides.',
  },
  {
    id: 'dead-bug',
    name: 'Dead Bug',
    muscles: ['core'],
    equipment: 'none',
    difficulty: 1,
    intensity: 'low',
    timed: false,
    howTo: 'Lie on your back with arms up and knees bent over your hips. Slowly lower one arm and the opposite leg toward the floor, then return. Keep your lower back flat.',
  },
  {
    id: 'bird-dog',
    name: 'Bird Dog',
    muscles: ['core', 'back'],
    equipment: 'none',
    difficulty: 1,
    intensity: 'low',
    timed: false,
    howTo: 'On hands and knees, reach one arm forward and the opposite leg back at the same time. Pause, then switch. Move slow and do not let your hips twist.',
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain Climbers',
    muscles: ['core', 'cardio'],
    equipment: 'none',
    difficulty: 2,
    intensity: 'high',
    timed: true,
    howTo: 'In a push-up position, drive one knee toward your chest, then switch quickly like you are running in place. Keep your hips low and steady.',
  },
  {
    id: 'bear-crawl',
    name: 'Bear Crawl',
    muscles: ['core', 'shoulders', 'fullbody'],
    equipment: 'none',
    difficulty: 2,
    intensity: 'high',
    timed: true,
    howTo: 'Hands and feet on the floor, knees hovering just off the ground. Crawl forward and back moving the opposite hand and foot together. Keep your hips low.',
  },

  /* ---------- BODYWEIGHT: CARDIO & POWER --------------------------------- */
  {
    id: 'brisk-walk',
    name: 'Brisk Walk',
    muscles: ['cardio'],
    equipment: 'none',
    difficulty: 1,
    intensity: 'low',
    timed: true,
    howTo: 'Walk at a pace where you could talk but not sing. Outside, on a treadmill, around the block — it all counts.',
  },
  {
    id: 'easy-jog',
    name: 'Easy Jog',
    muscles: ['cardio'],
    equipment: 'none',
    difficulty: 2,
    intensity: 'medium',
    timed: true,
    howTo: 'Run at a relaxed, conversational pace. If you are breathing too hard to talk, slow down. Walk breaks are completely fine.',
  },
  {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    muscles: ['cardio', 'fullbody'],
    equipment: 'none',
    difficulty: 1,
    intensity: 'medium',
    timed: true,
    howTo: 'Jump your feet out wide while your arms swing overhead, then jump back in. Land softly through your whole foot.',
  },
  {
    id: 'high-knees',
    name: 'High Knees',
    muscles: ['cardio', 'speed'],
    equipment: 'none',
    difficulty: 2,
    intensity: 'high',
    timed: true,
    howTo: 'Run in place driving each knee up to hip height. Stay on the balls of your feet and pump your arms.',
  },
  {
    id: 'burpee',
    name: 'Burpee',
    muscles: ['fullbody', 'cardio'],
    equipment: 'none',
    difficulty: 3,
    intensity: 'high',
    timed: false,
    howTo: 'From standing, drop your hands down, kick your feet back to a plank, hop them back in, and jump up. Scale it by stepping instead of jumping.',
  },
  {
    id: 'squat-jump',
    name: 'Squat Jump',
    muscles: ['quads', 'glutes', 'power'],
    equipment: 'none',
    difficulty: 3,
    intensity: 'high',
    timed: false,
    howTo: 'Squat down about halfway, then jump straight up as high as you can. Land soft with bent knees and reset before the next one.',
  },
  {
    id: 'skater-hops',
    name: 'Skater Hops',
    muscles: ['glutes', 'power'],
    equipment: 'none',
    difficulty: 2,
    intensity: 'high',
    timed: false,
    howTo: 'Hop sideways from one foot to the other, landing on a single leg and holding your balance for a beat. Count each landing as a rep.',
  },
  {
    id: 'sprint-intervals',
    name: 'Sprint Intervals',
    muscles: ['speed', 'cardio', 'power'],
    equipment: 'none',
    difficulty: 3,
    intensity: 'high',
    timed: true,
    howTo: 'Run hard for about 15 seconds, then walk for 45 to recover. Repeat for the listed time. Warm up first — sprinting cold is how you pull something.',
  },
  {
    id: 'a-skip',
    name: 'A-Skip',
    muscles: ['speed', 'cardio'],
    equipment: 'none',
    difficulty: 2,
    intensity: 'medium',
    timed: true,
    howTo: 'Skip forward driving one knee up while staying tall and bouncy on the balls of your feet. A classic sprinter warm-up drill.',
  },

  /* ---------- MOBILITY & RECOVERY ---------------------------------------- */
  {
    id: 'cat-cow',
    name: 'Cat-Cow',
    muscles: ['mobility', 'back'],
    equipment: 'none',
    difficulty: 1,
    intensity: 'low',
    timed: true,
    howTo: 'On hands and knees, slowly round your back up toward the ceiling, then let it sag as you look forward. Match the movement to your breathing.',
  },
  {
    id: 'hip-flexor-stretch',
    name: 'Kneeling Hip Flexor Stretch',
    muscles: ['mobility'],
    equipment: 'none',
    difficulty: 1,
    intensity: 'low',
    timed: true,
    howTo: 'Kneel on one knee with the other foot in front. Squeeze the glute on the kneeling side and gently push your hips forward. Switch sides halfway.',
  },
  {
    id: 'hamstring-stretch',
    name: 'Standing Hamstring Stretch',
    muscles: ['mobility', 'hamstrings'],
    equipment: 'none',
    difficulty: 1,
    intensity: 'low',
    timed: true,
    howTo: 'Put one heel slightly in front of you, keep that leg mostly straight, and hinge at your hips until you feel a stretch behind the knee. Switch sides halfway.',
  },
  {
    id: 'arm-circles',
    name: 'Arm Circles',
    muscles: ['mobility', 'shoulders'],
    equipment: 'none',
    difficulty: 1,
    intensity: 'low',
    timed: true,
    howTo: 'Make big slow circles with both arms, forward for half the time and backward for the other half. Great before any upper body work.',
  },
  {
    id: 'worlds-greatest-stretch',
    name: "World's Greatest Stretch",
    muscles: ['mobility', 'fullbody'],
    equipment: 'none',
    difficulty: 2,
    intensity: 'low',
    timed: true,
    howTo: 'Step into a deep lunge, put one hand on the floor, and rotate the other arm up toward the ceiling. Hold, then switch sides. Hits hips, back, and shoulders at once.',
  },

  /* ---------- DUMBBELLS -------------------------------------------------- */
  {
    id: 'db-goblet-squat',
    name: 'Goblet Squat',
    muscles: ['quads', 'glutes', 'core'],
    equipment: 'dumbbells',
    difficulty: 2,
    intensity: 'medium',
    timed: false,
    howTo: 'Hold one dumbbell against your chest with both hands. Squat down between your knees and drive back up. The weight in front helps you stay upright.',
  },
  {
    id: 'db-floor-press',
    name: 'Dumbbell Floor Press',
    muscles: ['chest', 'triceps'],
    equipment: 'dumbbells',
    difficulty: 2,
    intensity: 'medium',
    timed: false,
    howTo: 'Lie on your back holding dumbbells over your chest. Lower until your upper arms touch the floor, then press back up. Safe to do alone with no bench.',
  },
  {
    id: 'db-row',
    name: 'Dumbbell Row',
    muscles: ['back', 'biceps'],
    equipment: 'dumbbells',
    difficulty: 2,
    intensity: 'medium',
    timed: false,
    howTo: 'Hinge forward with a flat back, one hand braced on a bench or your knee. Pull the dumbbell to your ribs, leading with your elbow. Count reps per arm.',
  },
  {
    id: 'db-shoulder-press',
    name: 'Dumbbell Shoulder Press',
    muscles: ['shoulders', 'triceps'],
    equipment: 'dumbbells',
    difficulty: 2,
    intensity: 'medium',
    timed: false,
    howTo: 'Hold dumbbells at shoulder height, palms forward. Press straight overhead without leaning back, then lower under control.',
  },
  {
    id: 'db-lateral-raise',
    name: 'Lateral Raise',
    muscles: ['shoulders'],
    equipment: 'dumbbells',
    difficulty: 1,
    intensity: 'low',
    timed: false,
    howTo: 'With a light dumbbell in each hand, raise your arms out to the sides up to shoulder height with a slight bend in the elbows. Lower slowly.',
  },
  {
    id: 'db-romanian-deadlift',
    name: 'Dumbbell Romanian Deadlift',
    muscles: ['hamstrings', 'glutes', 'back'],
    equipment: 'dumbbells',
    difficulty: 2,
    intensity: 'medium',
    timed: false,
    howTo: 'Hold dumbbells in front of your thighs. Push your hips back and slide the weights down your legs with a flat back until you feel your hamstrings stretch, then stand up.',
  },
  {
    id: 'db-lunge',
    name: 'Dumbbell Lunge',
    muscles: ['quads', 'glutes'],
    equipment: 'dumbbells',
    difficulty: 2,
    intensity: 'medium',
    timed: false,
    howTo: 'Hold a dumbbell in each hand at your sides. Step forward or backward into a lunge, then push back to standing. Count reps per leg.',
  },
  {
    id: 'db-curl',
    name: 'Dumbbell Curl',
    muscles: ['biceps'],
    equipment: 'dumbbells',
    difficulty: 1,
    intensity: 'low',
    timed: false,
    howTo: 'Arms at your sides, palms forward. Curl the dumbbells to your shoulders without swinging your elbows forward, then lower slowly.',
  },
  {
    id: 'db-triceps-extension',
    name: 'Overhead Triceps Extension',
    muscles: ['triceps'],
    equipment: 'dumbbells',
    difficulty: 1,
    intensity: 'low',
    timed: false,
    howTo: 'Hold one dumbbell with both hands overhead. Bend your elbows to lower it behind your head, then straighten your arms. Keep your elbows pointed up.',
  },
  {
    id: 'db-thruster',
    name: 'Dumbbell Thruster',
    muscles: ['fullbody', 'cardio', 'shoulders'],
    equipment: 'dumbbells',
    difficulty: 3,
    intensity: 'high',
    timed: false,
    howTo: 'Hold dumbbells at your shoulders, squat down, then stand up and press the weights overhead in one smooth motion. A full-body gut check.',
  },
  {
    id: 'db-farmer-carry',
    name: 'Farmer Carry',
    muscles: ['core', 'fullbody'],
    equipment: 'dumbbells',
    difficulty: 1,
    intensity: 'medium',
    timed: true,
    howTo: 'Hold a heavy dumbbell in each hand and walk tall with your shoulders back. Do not let yourself lean to one side.',
  },

  /* ---------- FULL GYM --------------------------------------------------- */
  {
    id: 'barbell-back-squat',
    name: 'Barbell Back Squat',
    muscles: ['quads', 'glutes', 'core'],
    equipment: 'gym',
    difficulty: 3,
    intensity: 'high',
    timed: false,
    howTo: 'Bar on your upper back inside a rack. Squat down until your thighs are at least parallel, then drive up. Use the safety bars and start lighter than you think.',
  },
  {
    id: 'barbell-deadlift',
    name: 'Barbell Deadlift',
    muscles: ['hamstrings', 'glutes', 'back', 'fullbody'],
    equipment: 'gym',
    difficulty: 3,
    intensity: 'high',
    timed: false,
    howTo: 'Bar over your mid-foot. Grip just outside your knees, flatten your back, and stand up pushing the floor away. Form first, weight second — always.',
  },
  {
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    muscles: ['chest', 'triceps', 'shoulders'],
    equipment: 'gym',
    difficulty: 3,
    intensity: 'high',
    timed: false,
    howTo: 'Lie on the bench, grip a bit wider than your shoulders, lower the bar to your mid-chest, then press up. Use a spotter or safety arms when going heavy.',
  },
  {
    id: 'barbell-overhead-press',
    name: 'Barbell Overhead Press',
    muscles: ['shoulders', 'triceps', 'core'],
    equipment: 'gym',
    difficulty: 3,
    intensity: 'high',
    timed: false,
    howTo: 'Bar at your collarbone, standing tall. Press overhead, moving your head slightly back out of the way, and finish with the bar over your ears.',
  },
  {
    id: 'barbell-hip-thrust',
    name: 'Barbell Hip Thrust',
    muscles: ['glutes', 'hamstrings'],
    equipment: 'gym',
    difficulty: 2,
    intensity: 'medium',
    timed: false,
    howTo: 'Upper back on a bench, padded bar across your hips. Drive your hips up until your body is level, squeeze hard, and lower under control.',
  },
  {
    id: 'pullup',
    name: 'Pull-Up',
    muscles: ['back', 'biceps'],
    equipment: 'gym',
    difficulty: 3,
    intensity: 'high',
    timed: false,
    howTo: 'Hang from a bar with palms facing away. Pull your chest toward the bar, leading with your elbows. Use a band or the assisted machine if you need to.',
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    muscles: ['back', 'biceps'],
    equipment: 'gym',
    difficulty: 1,
    intensity: 'medium',
    timed: false,
    howTo: 'Sit tall, grip the bar wide, and pull it to your upper chest while squeezing your shoulder blades down. Control it back up slowly.',
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    muscles: ['back', 'biceps'],
    equipment: 'gym',
    difficulty: 1,
    intensity: 'medium',
    timed: false,
    howTo: 'Sit with a slight forward lean, pull the handle to your stomach, and squeeze your shoulder blades together. Do not rock back and forth.',
  },
  {
    id: 'cable-face-pull',
    name: 'Face Pull',
    muscles: ['shoulders', 'back'],
    equipment: 'gym',
    difficulty: 1,
    intensity: 'low',
    timed: false,
    howTo: 'Set a cable at face height with a rope. Pull it toward your forehead with your elbows high and hands splitting apart. Great for posture and shoulder health.',
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    muscles: ['quads', 'glutes'],
    equipment: 'gym',
    difficulty: 1,
    intensity: 'medium',
    timed: false,
    howTo: 'Feet shoulder-width on the platform. Lower until your knees reach about 90 degrees, then press back without locking your knees hard at the top.',
  },
  {
    id: 'leg-curl',
    name: 'Leg Curl',
    muscles: ['hamstrings'],
    equipment: 'gym',
    difficulty: 1,
    intensity: 'low',
    timed: false,
    howTo: 'On the machine, curl your heels toward your glutes, pause for a second, and lower slowly. Keep your hips pressed down the whole time.',
  },
  {
    id: 'rowing-machine',
    name: 'Rowing Machine',
    muscles: ['cardio', 'fullbody', 'back'],
    equipment: 'gym',
    difficulty: 2,
    intensity: 'high',
    timed: true,
    howTo: 'Drive with your legs first, then lean back slightly, then pull the handle to your ribs. Reverse that order on the way back. Legs do most of the work.',
  },
  {
    id: 'stationary-bike',
    name: 'Stationary Bike',
    muscles: ['cardio', 'quads'],
    equipment: 'gym',
    difficulty: 1,
    intensity: 'medium',
    timed: true,
    howTo: 'Set the seat so your knee stays slightly bent at the bottom. Ride at a steady effort, or alternate 30 seconds hard with 90 seconds easy.',
  },
];

/* ----------------------------------------------------------------------------
   MUSCLE GROUPS — the buttons on the Quick Workout screen.

   These are the friendly, plain-English groupings a person actually thinks
   in ("Arms") rather than the finer tags the library uses internally
   ("biceps", "triceps"). Each group lists the tags that belong to it.

   Add a group by adding an entry here — the Quick Workout screen builds its
   buttons from this list, so it shows up with no other changes.
   -------------------------------------------------------------------------- */
MM.MUSCLE_GROUPS = [
  {
    id: 'chest',
    label: 'Chest',
    icon: '🫁',
    blurb: 'Pushing strength',
    tags: ['chest'],
  },
  {
    id: 'back',
    label: 'Back',
    icon: '🧗',
    blurb: 'Pulling strength and posture',
    tags: ['back'],
  },
  {
    id: 'shoulders',
    label: 'Shoulders',
    icon: '🤸',
    blurb: 'Overhead strength',
    tags: ['shoulders'],
  },
  {
    id: 'arms',
    label: 'Arms',
    icon: '💪',
    blurb: 'Biceps and triceps',
    tags: ['biceps', 'triceps'],
  },
  {
    id: 'legs',
    label: 'Legs',
    icon: '🦵',
    blurb: 'Quads, hamstrings, glutes, calves',
    tags: ['quads', 'hamstrings', 'glutes', 'calves'],
  },
  {
    id: 'core',
    label: 'Core',
    icon: '🎯',
    blurb: 'Abs and lower back',
    tags: ['core'],
  },
  {
    id: 'cardio',
    label: 'Cardio',
    icon: '🏃',
    blurb: 'Get your heart rate up',
    tags: ['cardio'],
  },
  {
    id: 'fullbody',
    label: 'Full Body',
    icon: '⚡',
    blurb: 'Everything at once',
    tags: ['fullbody', 'power', 'speed'],
  },
  {
    id: 'mobility',
    label: 'Stretching',
    icon: '🧘',
    blurb: 'Loosen up and recover',
    tags: ['mobility'],
  },
];

MM.getMuscleGroup = function (id) {
  return MM.MUSCLE_GROUPS.find(function (g) { return g.id === id; });
};

/* ----------------------------------------------------------------------------
   Small helpers for looking things up in the library.
   -------------------------------------------------------------------------- */

// Equipment is a ladder: if you have a full gym you can also do dumbbell and
// bodyweight moves. This maps "what I have" to "what I'm allowed to use".
MM.EQUIPMENT_ACCESS = {
  none: ['none'],
  dumbbells: ['none', 'dumbbells'],
  gym: ['none', 'dumbbells', 'gym'],
};

// Find one exercise by its id. Returns undefined if the id doesn't exist.
MM.getExercise = function (id) {
  return MM.EXERCISES.find(function (ex) { return ex.id === id; });
};

// Return every exercise a person can actually do with their equipment.
MM.exercisesForEquipment = function (equipment) {
  var allowed = MM.EQUIPMENT_ACCESS[equipment] || MM.EQUIPMENT_ACCESS.none;
  return MM.EXERCISES.filter(function (ex) {
    return allowed.indexOf(ex.equipment) !== -1;
  });
};

// Every exercise that trains a given muscle group, optionally limited to the
// equipment someone has. Used by the Quick Workout screen.
MM.exercisesForMuscleGroup = function (groupId, equipment) {
  var group = MM.getMuscleGroup(groupId);
  if (!group) return [];

  var pool = equipment ? MM.exercisesForEquipment(equipment) : MM.EXERCISES;

  return pool.filter(function (ex) {
    return group.tags.some(function (tag) { return ex.muscles.indexOf(tag) !== -1; });
  });
};
