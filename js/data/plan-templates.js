/* ============================================================================
   plan-templates.js — THE RULES FOR BUILDING A WEEKLY PLAN
   ============================================================================
   This file holds the "recipe" side of plan generation: what the goals are,
   what kinds of workout days exist, and how many sets and reps to prescribe.
   The actual assembling happens in js/plan-builder.js.

   Separating them means you can tweak the programming (more sets, different
   day types, a new goal) without touching the logic that picks exercises.
   ========================================================================== */

/* ----------------------------------------------------------------------------
   GOAL CATEGORIES — the options in onboarding. The user can pick SEVERAL.

   rotation = the order of workout day types used for this goal. The builder
   walks this list and loops back to the start if there are more workout days
   than entries. When several categories are picked, plan-builder.js
   interleaves their rotations so the week covers all of them.

   tracker  = the automatic goal created when this category is chosen, which
   becomes a progress bar on the home screen. `metric` must be a key in
   MM.GOAL_METRICS (js/goal-tracker.js). Tune these targets freely.
   -------------------------------------------------------------------------- */
MM.GOALS = [
  {
    id: 'muscle',
    label: 'Build muscle',
    blurb: 'Get bigger and stronger.',
    icon: '💪',
    rotation: ['upper_push', 'lower', 'upper_pull', 'fullbody_strength', 'upper_push', 'lower', 'core_conditioning'],
    tracker: { metric: 'sessions', target: 4 },
  },
  {
    id: 'gain_weight',
    label: 'Gain weight for a sport',
    blurb: 'Add size and strength for football, wrestling, and more.',
    icon: '🏈',
    rotation: ['lower', 'upper_push', 'fullbody_strength', 'upper_pull', 'lower', 'upper_push', 'core_conditioning'],
    tracker: { metric: 'sessions', target: 4 },
  },
  {
    id: 'lose_weight',
    label: 'Lose weight',
    blurb: 'Move daily and build habits that stick.',
    icon: '🔥',
    rotation: ['fullbody_strength', 'cardio_intervals', 'fullbody_strength', 'steady_cardio', 'core_conditioning', 'cardio_intervals', 'steady_cardio'],
    tracker: { metric: 'activeDays', target: 5 },
  },
  {
    id: 'speed',
    label: 'Get faster / sport performance',
    blurb: 'Speed, power, and athleticism.',
    icon: '⚡',
    rotation: ['speed_power', 'lower', 'core_conditioning', 'speed_power', 'upper_push', 'cardio_intervals', 'mobility_recovery'],
    tracker: { metric: 'sessions', target: 3 },
  },
  {
    id: 'general',
    label: 'General fitness',
    blurb: 'A bit of everything — strong, fit, and healthy.',
    icon: '🎯',
    rotation: ['fullbody_strength', 'steady_cardio', 'upper_push', 'core_conditioning', 'lower', 'cardio_intervals', 'mobility_recovery'],
    tracker: { metric: 'activeDays', target: 4 },
  },
  {
    id: 'just_move',
    label: 'Just get moving',
    blurb: 'Short, easy sessions. No gym required.',
    icon: '🌱',
    rotation: ['easy_movement', 'mobility_recovery', 'easy_movement', 'fullbody_strength', 'easy_movement', 'mobility_recovery', 'steady_cardio'],
    tracker: { metric: 'minutes', target: 90 },
  },
];

MM.getGoal = function (id) {
  return MM.GOALS.find(function (g) { return g.id === id; }) || MM.GOALS[4];
};

/* ----------------------------------------------------------------------------
   EXPERIENCE LEVELS
   maxDifficulty = the hardest exercise difficulty this person gets shown.
   setBonus      = added to the base number of sets.
   -------------------------------------------------------------------------- */
MM.EXPERIENCE_LEVELS = [
  {
    id: 'never',
    label: 'Never really worked out',
    blurb: 'We will start simple and build up.',
    maxDifficulty: 1,
    setBonus: 0,
    exerciseCount: 4,
  },
  {
    id: 'some',
    label: 'Some experience',
    blurb: 'You know the basics.',
    maxDifficulty: 2,
    setBonus: 1,
    exerciseCount: 5,
  },
  {
    id: 'experienced',
    label: 'Experienced',
    blurb: 'You have been training a while.',
    maxDifficulty: 3,
    setBonus: 2,
    exerciseCount: 6,
  },
];

MM.getExperience = function (id) {
  return MM.EXPERIENCE_LEVELS.find(function (e) { return e.id === id; }) ||
    MM.EXPERIENCE_LEVELS[0];
};

/* ----------------------------------------------------------------------------
   EQUIPMENT OPTIONS (for onboarding + quick workout)
   -------------------------------------------------------------------------- */
MM.EQUIPMENT_OPTIONS = [
  { id: 'none', label: 'Nothing', blurb: 'Bodyweight only. Works anywhere.', icon: '🙌' },
  { id: 'dumbbells', label: 'Dumbbells', blurb: 'A pair of dumbbells at home.', icon: '🏋️' },
  { id: 'gym', label: 'Full gym', blurb: 'Barbells, machines, the works.', icon: '🏟️' },
];

/* ----------------------------------------------------------------------------
   DAY TYPES — the different flavors of workout day.

   title    shown as the day's name
   focus    an ordered list of "slots". The builder fills each slot with one
            exercise whose muscles include one of the listed tags.
            Earlier slots get picked first, so put the main lifts first.
   kind     'strength' | 'cardio' | 'mobility' — controls set/rep scheme
   note     a short line explaining the point of the day
   -------------------------------------------------------------------------- */
MM.DAY_TYPES = {
  upper_push: {
    title: 'Upper Body — Push',
    kind: 'strength',
    note: 'Chest, shoulders, and triceps. Press hard, control the way down.',
    focus: [['chest'], ['shoulders'], ['chest', 'shoulders'], ['triceps'], ['core'], ['triceps', 'shoulders']],
  },
  upper_pull: {
    title: 'Upper Body — Pull',
    kind: 'strength',
    note: 'Back and biceps. Pull with your elbows, not your hands.',
    focus: [['back'], ['back'], ['biceps'], ['back', 'shoulders'], ['core'], ['biceps']],
  },
  lower: {
    title: 'Lower Body',
    kind: 'strength',
    note: 'Legs and glutes. This is where real strength comes from.',
    focus: [['quads'], ['hamstrings'], ['glutes'], ['quads', 'glutes'], ['calves'], ['core']],
  },
  fullbody_strength: {
    title: 'Full Body Strength',
    kind: 'strength',
    note: 'One session, everything covered. Great when you only have a few days.',
    focus: [['quads', 'glutes'], ['chest'], ['back'], ['hamstrings'], ['shoulders'], ['core']],
  },
  core_conditioning: {
    title: 'Core & Conditioning',
    kind: 'mixed',
    note: 'A strong middle holds everything else together. Keep rest short.',
    focus: [['core'], ['core'], ['cardio'], ['core'], ['cardio', 'fullbody'], ['mobility']],
  },
  cardio_intervals: {
    title: 'Intervals',
    kind: 'cardio',
    note: 'Hard bursts with real recovery between them. Quality over quantity.',
    focus: [['cardio'], ['cardio', 'fullbody'], ['cardio'], ['core'], ['mobility']],
  },
  steady_cardio: {
    title: 'Steady Cardio',
    kind: 'cardio',
    note: 'Easy, conversational pace. This builds the engine underneath everything.',
    focus: [['cardio'], ['core'], ['mobility'], ['mobility']],
  },
  speed_power: {
    title: 'Speed & Power',
    kind: 'power',
    note: 'Explosive and fast. Rest fully between sets — tired reps are slow reps.',
    focus: [['mobility'], ['speed'], ['power'], ['power', 'speed'], ['core'], ['cardio']],
  },
  mobility_recovery: {
    title: 'Mobility & Recovery',
    kind: 'mobility',
    note: 'Loosen up, breathe, and let your body catch up. Easy on purpose.',
    focus: [['mobility'], ['mobility'], ['mobility'], ['core'], ['cardio']],
  },
  easy_movement: {
    title: 'Easy Movement',
    kind: 'mobility',
    note: 'Short and very doable. The only goal is to move a little today.',
    focus: [['cardio'], ['mobility'], ['glutes', 'core'], ['mobility']],
  },
};

/* ----------------------------------------------------------------------------
   SET AND REP SCHEMES
   Looked up by [day kind][goal]. Falls back to the 'default' entry.

   sets     base number of sets (experience setBonus is added on top)
   reps     for rep-based exercises
   seconds  for timed exercises
   rest     seconds of rest between sets, shown as a hint
   -------------------------------------------------------------------------- */
MM.SET_SCHEMES = {
  strength: {
    default:      { sets: 3, reps: '10–12', seconds: 40, rest: 60 },
    muscle:       { sets: 3, reps: '8–12',  seconds: 45, rest: 75 },
    gain_weight:  { sets: 3, reps: '6–10',  seconds: 45, rest: 90 },
    lose_weight:  { sets: 3, reps: '12–15', seconds: 40, rest: 45 },
    speed:        { sets: 3, reps: '5–8',   seconds: 30, rest: 90 },
    just_move:    { sets: 2, reps: '8–10',  seconds: 25, rest: 60 },
  },
  mixed: {
    default:      { sets: 3, reps: '12–15', seconds: 40, rest: 45 },
    just_move:    { sets: 2, reps: '10',    seconds: 25, rest: 45 },
  },
  cardio: {
    default:      { sets: 1, reps: '—',     seconds: 240, rest: 60 },
    lose_weight:  { sets: 1, reps: '—',     seconds: 300, rest: 60 },
    just_move:    { sets: 1, reps: '—',     seconds: 180, rest: 60 },
  },
  power: {
    default:      { sets: 4, reps: '4–6',   seconds: 30, rest: 120 },
    just_move:    { sets: 2, reps: '6',     seconds: 20, rest: 90 },
  },
  mobility: {
    default:      { sets: 1, reps: '8–10',  seconds: 45, rest: 15 },
  },
};

/* ----------------------------------------------------------------------------
   MODE TUNING — this is what makes Grind mode harder than Chill mode.
   Applied on top of the scheme above when the plan is generated.
   -------------------------------------------------------------------------- */
MM.MODE_TUNING = {
  chill: {
    setDelta: 0,           // keep sets as-is
    exerciseDelta: -1,     // one fewer exercise per day
    secondsFactor: 0.8,    // shorter holds and cardio
    maxDifficultyCap: 2,   // never prescribe the hardest stuff by default
    extraRestDay: true,    // give an extra rest day when days/week is high
  },
  grind: {
    setDelta: 1,           // an extra set on everything
    exerciseDelta: 1,      // one more exercise per day
    secondsFactor: 1.2,    // longer holds and cardio
    maxDifficultyCap: 3,   // anything in the library is fair game
    extraRestDay: false,
  },
};

// Day-of-week labels. Plans always run Monday through Sunday.
MM.WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
MM.WEEKDAYS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/* ----------------------------------------------------------------------------
   ACTIVITY TYPES — the options in the "I moved today" form and manual logs.
   -------------------------------------------------------------------------- */
/* ----------------------------------------------------------------------------
   ACTIVITY SUGGESTIONS

   When you log something you TYPE what you did — it is a plain text box, not
   a dropdown. These are just one-tap shortcuts that fill the box for you.

   Keep the everyday ones in here. Walking the dog, raking leaves and dancing
   around your room are all movement, and a list made only of gym words
   quietly tells people that what they did does not count. That is the exact
   opposite of the point of this site.
   -------------------------------------------------------------------------- */
MM.ACTIVITY_SUGGESTIONS = [
  'Walk',
  'Walked the dog',
  'Run',
  'Bike ride',
  'Swim',
  'Stretching',
  'Danced around',
  'Sport practice',
  'Lifting',
  'Played outside',
  'Housework',
  'Yard work',
  'Took the stairs',
  'Hike',
];

// Meal slots for the food log.
MM.MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
