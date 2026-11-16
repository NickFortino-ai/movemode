/* ============================================================================
   movement-facts.js — WHY MOVEMENT MATTERS
   ============================================================================
   This is the heart of what the site is actually about. It is not a fitness
   app — the internet has plenty of those. It is about the fact that moving
   your body is one of the best things you can do for your physical AND your
   mental health, whoever you are and whatever shape you're in.

   Each fact is deliberately written as a small chain: something that happens
   when you move, and what that leads to. Plain language, no jargon, nothing
   you need a science class to follow.

   HOW TO ADD ONE
     { fact: 'what happens', why: 'why that is good for you', tag: 'body' }
   tag is 'body' or 'mind' — it just decides the little label on screen.

   PLEASE KEEP THESE HONEST. It is easy to find wild claims about exercise
   online. Everything here is the boring, well-established stuff, and it is
   written carefully: "helps", "supports", and "is linked to" are doing real
   work in these sentences. If you add a fact, prefer under-claiming.
   ========================================================================== */

MM.MOVEMENT_FACTS = [
  /* ---------- BODY ------------------------------------------------------- */
  {
    fact: 'Movement increases blood flow throughout your body.',
    why: 'Better blood flow helps your immune system get where it needs to go.',
    tag: 'body',
  },
  {
    fact: 'Your heart is a muscle, and movement is how you train it.',
    why: 'A stronger heart pushes more blood with every beat, so it works less hard all day.',
    tag: 'body',
  },
  {
    fact: 'Working muscles pull sugar out of your blood for fuel.',
    why: 'That helps keep your blood sugar steady instead of spiking and crashing.',
    tag: 'body',
  },
  {
    fact: 'Bones respond to being loaded by getting denser.',
    why: 'Walking, running, and lifting all tell your skeleton to stay strong.',
    tag: 'body',
  },
  {
    fact: 'Moving a joint spreads the fluid that keeps its cartilage healthy.',
    why: 'This is why stiff joints often feel better after you move, not worse.',
    tag: 'body',
  },
  {
    fact: 'Being active during the day makes it easier to fall asleep at night.',
    why: 'And good sleep is what lets your body repair everything else.',
    tag: 'body',
  },
  {
    fact: 'Movement helps food move through your digestive system.',
    why: 'A short walk after eating is one of the simplest things you can do for it.',
    tag: 'body',
  },
  {
    fact: 'Your lungs and heart get better at delivering oxygen when you use them.',
    why: 'Stairs, hills, and long days stop feeling like such a big deal.',
    tag: 'body',
  },
  {
    fact: 'Muscle you build now is muscle you keep drawing on for decades.',
    why: 'Strength built young is what keeps people independent much later in life.',
    tag: 'body',
  },

  /* ---------- MIND ------------------------------------------------------- */
  {
    fact: 'Movement releases endorphins, your body\'s own feel-good chemicals.',
    why: 'It is why a hard walk can take the edge off a bad mood in minutes.',
    tag: 'mind',
  },
  {
    fact: 'Regular movement helps your body handle stress hormones better.',
    why: 'The same stressful day lands lighter on someone who moves.',
    tag: 'mind',
  },
  {
    fact: 'More blood flow reaches your brain when you move.',
    why: 'Focus and memory tend to be sharper on days you have been active.',
    tag: 'mind',
  },
  {
    fact: 'Aerobic movement raises a protein called BDNF in your brain.',
    why: 'BDNF helps brain cells grow and form new connections — literally learning.',
    tag: 'mind',
  },
  {
    fact: 'Ten minutes of walking is enough to measurably lift mood.',
    why: 'You do not need an hour, a gym, or a plan to feel the difference.',
    tag: 'mind',
  },
  {
    fact: 'Moving outside gets you daylight as well as exercise.',
    why: 'Daylight helps set the body clock that decides when you feel awake and sleepy.',
    tag: 'mind',
  },
  {
    fact: 'Movement gives a spinning mind something physical to do.',
    why: 'Plenty of people solve their stuck problem somewhere in the middle of a walk.',
    tag: 'mind',
  },
  {
    fact: 'Doing something you said you would do builds trust in yourself.',
    why: 'That is a real part of why streaks feel good — it is not just the number.',
    tag: 'mind',
  },
];

/* ----------------------------------------------------------------------------
   Shown underneath the facts. Movement genuinely helps mental health, but it
   is not a substitute for real support, and this site should never pretend
   otherwise to someone having a hard time. Please keep this.
   -------------------------------------------------------------------------- */
MM.MOVEMENT_MIND_NOTE =
  'Moving helps, but it is not a replacement for real help. If you are ' +
  'struggling with your head, please talk to someone you trust — a parent, ' +
  'a friend, a coach, a counsellor, or a doctor.';

// A fact at random. Used on the home screen.
MM.randomMovementFact = function (avoidFact) {
  var pool = MM.MOVEMENT_FACTS;

  // Don't show the same one twice in a row when the user taps for another.
  if (avoidFact && pool.length > 1) {
    pool = pool.filter(function (f) { return f.fact !== avoidFact; });
  }
  return pool[Math.floor(Math.random() * pool.length)];
};
