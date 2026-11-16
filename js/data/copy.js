/* ============================================================================
   copy.js — ALL THE WORDS THAT CHANGE BETWEEN MODES
   ============================================================================
   This is the "voice" file. Every piece of text whose TONE depends on the
   mode lives here, so you can rewrite the personality of the whole site
   without touching any logic.

   Two modes:
     chill  — calm, kind, low pressure. For someone just trying to move.
     grind  — loud, intense, locker-room energy. For someone chasing a number.

   Rules of thumb when you write new lines:
     - Chill should never shame anyone or imply they are behind.
     - Grind should be hype, not mean. Push people, never insult them.

   Use MM.copy('path.to.line') to read a line in the current mode.
   ========================================================================== */

MM.COPY = {

  /* ======================= CHILL MODE ==================================== */
  chill: {
    modeName: 'Chill',
    modeBlurb: 'Gentle, doable, no pressure.',
    tagline: 'Small moves, every day. Your body and your head both feel it.',

    // Home screen
    streakLabel: 'day streak',
    streakZero: 'Today is a great day to start.',
    streakGoing: 'Nice work keeping this going.',
    logButton: 'I moved today',
    logButtonDone: 'Moved today ✓',
    restButton: 'Taking a rest day',
    restButtonDone: 'Resting today ✓',
    restUsed: 'You already used this week\'s rest day — any movement at all keeps things rolling.',
    bestStreakLabel: 'Best so far',
    todayDoneMsg: 'You moved today. That is the whole goal.',
    todayRestMsg: 'Rest day logged. Recovery is part of it — your streak is safe.',
    heatmapTitle: 'Your last 30 days',
    heatmapHint: 'Every square you fill in is a day you showed up.',

    // Encouragement shown on the home screen, picked at random.
    // This is a movement site, not a fitness site — these lines should sound
    // like they are about your whole life, not about the gym.
    hype: [
      'Five minutes counts. Honestly.',
      'You do not have to feel like it. You just have to start.',
      'A ten minute walk can change a whole afternoon.',
      'Stuck on something? Go move. Come back to it.',
      'Movement is one of the best things you can do for your head.',
      'Consistency beats intensity every single time.',
      'Your body was built to move. It does not care how fast.',
      'Bad day? Moving will not fix it, but it usually helps.',
      'A short walk is a real workout.',
      'Movement is a gift to your body, not a punishment.',
    ],

    // Milestone celebrations, keyed by streak length
    milestones: {
      3: { title: 'Three days!', body: 'You have officially started something. The hardest part is behind you.' },
      7: { title: 'A full week', body: 'Seven days of showing up. This is turning into a habit, and habits are powerful.' },
      14: { title: 'Two weeks strong', body: 'You have proven this is not a fluke. Be proud of this one.' },
      30: { title: 'Thirty days', body: 'A whole month of movement. This is who you are now — someone who moves.' },
      100: { title: 'One hundred days', body: 'A hundred days. That is extraordinary, and it started with one small decision.' },
    },

    // Shown after a missed day resets the streak
    restartTitle: 'Streak reset — and that is okay',
    restartBody: 'You had a {n} day streak going, and life happened. Nothing is ruined. Log anything today and you are back at day one, which is a perfectly good place to be.',
    restartButton: 'Start again today',

    // My Plan
    planTitle: 'Your week',
    planIntro: 'Here is a gentle plan built around your goal. Swap days around if you need to — it should fit your life, not the other way around.',
    planTodayLabel: 'Today',
    planRestLabel: 'Rest day',
    planRestNote: 'Stretch, walk, sleep well. This day matters too.',
    planCheckButton: 'Mark this workout done',
    planCheckedButton: 'Done today ✓',
    noPlan: 'You have not set up a plan yet. It takes about a minute.',
    planSets: 'sets',
    planSetupButton: 'Build my plan',

    // Quick Workout
    quickTitle: 'What should I do right now?',
    quickIntro: 'Pick the part of your body you want to work, and I will show you what you can do.',
    quickPickMuscle: 'What do you want to work?',
    quickListIntro: 'Here is everything you can do for that, with what you have got.',
    quickButton: 'Build my workout',
    quickAgain: 'Give me another',
    quickDone: 'Log this as done',
    energyLabels: { low: 'Low — take it easy on me', medium: 'Medium — normal day', high: 'High — I have energy' },

    // My Goals page
    goalsPageTitle: 'My Goals',
    goalsPageIntro: 'Your goals, the workouts that get you there, and how to eat for them.',
    goalsPlanHeading: 'Your exercise plan',
    goalsDietHeading: 'Your diet plan',

    // Log
    logTitle: 'Your log',
    logIntro: 'A record of what you have done. No calorie counting, no judgment.',
    logWhatPlaceholder: 'Walked to school, danced around, raked the yard…',
    logEmpty: 'Nothing logged yet. Your first entry can be a 10 minute walk.',
    mealsEmpty: 'No meals logged yet. Jotting down what you eat is just useful information, nothing more.',

    // Nutrition
    nutritionTitle: 'Eating to support this',
    nutritionIntro: 'Nothing extreme here — just steady habits that make you feel better.',

    // Settings
    settingsTitle: 'Settings',
    resetWarn: 'This erases your streak, plan, and log for good. There is no undo.',

    // Profile
    profileTitle: 'Profile',
    profileIntro: 'Your name, your icon, and how you like to train.',

    // Onboarding
    onboardWelcome: 'Welcome to ' + MM.SITE.name,
    onboardIntro: 'A few quick questions and we will put together a plan that actually fits you.',
    onboardFinish: 'Build my plan',
    onboardDone: 'All set. Here is your week.',
  },

  /* ======================= GRIND MODE ==================================== */
  grind: {
    modeName: 'Grind',
    modeBlurb: 'Hard work. No excuses.',
    tagline: 'Movement clears the head and builds the body. Go get some.',

    // Home screen
    streakLabel: 'DAY STREAK',
    streakZero: 'ZERO. Fix that today.',
    streakGoing: 'KEEP THE CHAIN ALIVE.',
    logButton: 'I PUT IN WORK',
    logButtonDone: 'WORK DONE ✓',
    restButton: 'PLANNED REST DAY',
    restButtonDone: 'RECOVERING ✓',
    restUsed: 'REST DAY ALREADY SPENT THIS WEEK. GO MOVE.',
    bestStreakLabel: 'RECORD',
    todayDoneMsg: 'LOGGED. That is one more day the competition took off.',
    todayRestMsg: 'REST LOGGED. Recovery is training. Come back hungry.',
    heatmapTitle: 'LAST 30 DAYS',
    heatmapHint: 'Every gap is a day you gave away.',

    // Encouragement shown on the home screen, picked at random.
    // Loud, but still about movement doing something for your whole self —
    // not just about lifting numbers.
    hype: [
      'DISCIPLINE OVER MOTIVATION. ALWAYS.',
      'MOVEMENT CLEARS YOUR HEAD. GO GET SOME.',
      'YOU DO NOT NEGOTIATE WITH YOURSELF.',
      'THE WORK FIXES MORE THAN YOUR BODY.',
      'BAD DAY? MOVE ANYWAY. IT HELPS.',
      'NOBODY EVER REGRETTED MOVING.',
      'HARD NOW OR HARD LATER. PICK ONE.',
      'TIRED IS NOT AN INJURY.',
      'EARN IT TODAY.',
    ],

    // Milestone celebrations, keyed by streak length
    milestones: {
      3: { title: 'THREE STRAIGHT', body: 'Three days in. Most people quit before this. You did not. Now stack three more.' },
      7: { title: 'SEVEN DAYS. NO MISSES.', body: 'A full week of putting in work. This is what separating yourself looks like.' },
      14: { title: 'TWO WEEKS DEEP', body: 'Fourteen days. You are not experimenting anymore — you are building something.' },
      30: { title: '30 DAYS. UNBROKEN.', body: 'A month straight. Look at what you have become in thirty days. Do not stop now.' },
      100: { title: '100 DAYS',  body: 'ONE HUNDRED DAYS. That is not motivation, that is identity. You are built different now.' },
    },

    // Shown after a missed day resets the streak
    restartTitle: 'STREAK BROKEN',
    restartBody: 'You had {n} days and you let it go. That stings — good. Remember it. The record still stands. Get back to work today and start a bigger one.',
    restartButton: 'BACK TO WORK',

    // My Plan
    planTitle: 'THE PROGRAM',
    planIntro: 'This is the work. Follow it, log it, and do not skip the hard days — those are the ones that change you.',
    planTodayLabel: 'TODAY',
    planRestLabel: 'REST',
    planRestNote: 'Eat. Sleep. Recover. You grow on rest days — but only if you earned them.',
    planCheckButton: 'MARK IT DONE',
    planCheckedButton: 'DONE ✓',
    noPlan: 'NO PROGRAM YET. Set it up and get to work.',
    planSets: 'SETS',
    planSetupButton: 'BUILD MY PROGRAM',

    // Quick Workout
    quickTitle: 'NO TIME? NO EXCUSE.',
    quickIntro: 'Pick what you are training today. I will show you how to punish it.',
    quickPickMuscle: 'WHAT ARE WE HITTING?',
    quickListIntro: 'Everything you can hit it with, using what you have got.',
    quickButton: 'GIVE ME WORK',
    quickAgain: 'AGAIN. HARDER.',
    quickDone: 'LOG IT',
    energyLabels: { low: 'LOW — beat up today', medium: 'MEDIUM — normal', high: 'HIGH — let me cook' },

    // My Goals page
    goalsPageTitle: 'THE MISSION',
    goalsPageIntro: 'What you are chasing, the work that gets you there, and the fuel it takes.',
    goalsPlanHeading: 'THE TRAINING',
    goalsDietHeading: 'THE FUEL',

    // Log
    logTitle: 'THE RECEIPTS',
    logIntro: 'Numbers do not lie. This is the proof of what you actually did.',
    logWhatPlaceholder: 'Sprints, leg day, walked the dog…',
    logEmpty: 'EMPTY. Nothing to show yet. Change that.',
    mealsEmpty: 'NO MEALS LOGGED. You cannot build on an empty tank.',

    // Nutrition
    nutritionTitle: 'FUEL',
    nutritionIntro: 'You cannot out-train bad fueling. Eat like you are serious about this.',

    // Settings
    settingsTitle: 'SETTINGS',
    resetWarn: 'THIS WIPES EVERYTHING — streak, record, program, log. No undo.',

    // Profile
    profileTitle: 'YOUR PROFILE',
    profileIntro: 'Who you are and how you train.',

    // Onboarding
    onboardWelcome: MM.SITE.name.toUpperCase(),
    onboardIntro: 'Answer five questions. Get your program. Start today.',
    onboardFinish: 'BUILD MY PROGRAM',
    onboardDone: 'PROGRAM READY. LET\'S GO.',
  },
};

/* ----------------------------------------------------------------------------
   MM.copy('streakLabel') or MM.copy('milestones.7.title')
   Reads a line of copy for whichever mode is active right now.
   Returns the path itself if the line is missing, which makes typos obvious
   on screen instead of showing "undefined".
   -------------------------------------------------------------------------- */
MM.copy = function (path, mode) {
  var activeMode = mode || (MM.store && MM.store.get().mode) || MM.SITE.defaultMode;
  var node = MM.COPY[activeMode];
  var parts = path.split('.');

  for (var i = 0; i < parts.length; i++) {
    if (node == null) return path;
    node = node[parts[i]];
  }
  return node == null ? path : node;
};

// Pick a random hype/encouragement line for the current mode.
MM.randomHype = function () {
  var lines = MM.copy('hype');
  if (!Array.isArray(lines)) return '';
  return lines[Math.floor(Math.random() * lines.length)];
};
