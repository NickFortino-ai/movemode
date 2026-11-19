# MoveMode

**This is not a fitness site.** The internet is saturated with those.

It's a site about **movement** — and about the fact that moving your body is
one of the best things you can do for your physical *and* your mental health.
That's the whole point, and it should stay the point if you keep building on
it. Someone who never works out and someone who trains daily should both come
away feeling like this was written for them.

The facts that carry that message live in `js/data/movement-facts.js`, and one
of them is always on the home screen.

The whole idea is **two modes you can switch between at any time**:

- **Chill** — light, calm, rounded, soft greens and blues. Gentle language,
  easier plans. For someone just trying to get some activity in.
- **Grind** — dark, sharp, condensed caps, electric orange. Locker-room
  language, harder plans. For someone chasing a number.

Nobody gets locked into one. The toggle is in the header on every screen, and
switching instantly changes the colors, the fonts, the wording, and the
difficulty of your plan.

---

## Running it

**Easiest way:** double-click `index.html`. That's it. No build step, no
install, no server.

**Slightly better way** (recommended while you're editing — some browsers are
picky about local files):

```bash
cd movemode
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

There's no build step on purpose. The scripts are plain `<script>` tags, not ES
modules, specifically so that opening the file directly works. (ES modules
require a server because of browser security rules.)

### Where the data lives

Everything is saved in your browser's **localStorage**:

- `movemode.v1.accounts` — the list of profiles on this device
- `movemode.v1.<profileId>` — one profile's streak, plan, goals, and log

There is no server, so nothing you log ever leaves your device. Clearing your
browser data clears your streak too, and your data doesn't follow you to
another device or another browser.

### About the "log in"

⚠️ **The sign-in is not real security, and the code says so out loud.**

Profiles let several people share one device — a sibling, a teammate, a family
laptop — each with their own streak and log. That part works properly. But:

- Profiles live in **this browser only**. They don't exist on your phone, and
  a friend signing in on their own laptop sees nothing.
- The optional **PIN is a speed bump**. It stops a sibling poking at your log.
  It does not stop anyone who opens developer tools, because everything is
  sitting right there in localStorage.
- That's why it's a 4–8 digit **PIN and not a password** — the input refuses
  letters on purpose, so nobody is tempted to reuse a real password here.

The app tells the user all of this on the sign-in screen and again on the
Profile page. Please keep those notes if you edit the wording. Quietly letting
someone believe their data is protected would be worse than having no PIN at
all.

**To make it real**, you need a backend: a server that stores accounts, hashes
passwords with something like bcrypt or Argon2, and holds the data. The
browser would then ask that server to log in rather than checking for itself.
`js/accounts.js` is the only file that would need rewriting — everything else
just asks it which profile is active. That's in the ideas list at the bottom.

---

## What each file does

```
movemode/
├── index.html              The whole page: the shell, all the screens, the
│                           modals, and the icon sprite.
├── README.md               This file.
├── package.json            Only for the tests — the site needs nothing.
├── test/
│   └── run.js              The test suite. `npm test`.
│
├── css/
│   ├── theme.css           ⭐ All colors, fonts, and shapes for BOTH modes,
│   │                       as CSS variables. The mode transition lives here.
│   ├── layout.css          Page structure: reset, header, content area,
│   │                       and the navigation.
│   ├── components.css      Reusable pieces: buttons, cards, the streak ring,
│   │                       progress bars, the heatmap, forms, modals.
│   └── desktop.css         ⭐ The big-screen layout. Everything else is the
│                           phone layout; this widens it out.
│
└── js/
    ├── config.js           ⭐ THE ONE PLACE to rename the site and change
    │                       global settings.
    ├── app.js              Startup, navigation, and mode switching.
    ├── ui.js               Shared helpers: escaping text, toasts, modals,
    │                       the segmented pickers, exercise rows.
    ├── dates.js            Every date calculation. Streaks live or die on
    │                       these, so they're all in one place.
    ├── accounts.js         ⭐ Profiles, signing in, and the PIN. Read the
    │                       warning at the top before trusting it.
    ├── storage.js          Reading and writing localStorage, per profile.
    ├── streak.js           ⭐ The streak rules (see below).
    ├── goal-tracker.js     ⭐ Goals and how their progress is measured.
    ├── plan-builder.js     Turns onboarding answers into a weekly plan.
    ├── quick-workout.js    Builds the short "right now" circuits.
    ├── timer.js            The interval timer.
    ├── chart.js            The little progress graphs, as hand-drawn SVG.
    │
    ├── data/
    │   ├── exercises.js    ⭐ The exercise library (56 exercises).
    │   ├── movement-facts.js  ⭐ Why movement matters, for body and mind.
    │   │                      The message the whole site exists to carry.
    │   ├── copy.js         ⭐ Every word that changes between modes.
    │   ├── nutrition.js    Nutrition guidance per goal.
    │   └── plan-templates.js  Goal categories, day types, set/rep schemes.
    │
    └── views/              One file per screen. Each has init() for
        ├── home.js         listeners (runs once) and render() for drawing.
        │                   Home is a hub: streak, goals, and two big cards
        │                   leading into the pages below.
        ├── my-goals.js     The My Goals page: goal progress, the exercise
        │                   plan, and the diet plan, in that order.
        ├── quick.js        Quick Workout: pick a muscle group, get exercises.
        ├── log.js
        ├── settings.js
        ├── goal-progress.js  Progress bars and goal forms, shared by Home,
        │                     My Goals, and Settings.
        ├── signin.js       The sign-in screen and the new-profile form.
        ├── profile.js      The Profile page: name, icon, PIN, training setup.
        ├── workout-editor.js  Editing a day's workout, or building your own.
        └── onboarding.js
```

### The five screens

| Screen | What it's for |
|---|---|
| **Home** | Deliberately the quietest screen. A fact about why movement matters banners the top (tap it for another), then two things: **how you're doing** (streak, one button to log) and **what you're working toward** (goal progress bars). Detail lives elsewhere on purpose. |
| **My Goals** | Everything tied to your goals in one place: the goals themselves with progress bars, the weekly **exercise plan** built from them (every day editable), and the **diet plan** that matches. Tapping a goal opens its own page with a progress graph, its deadline, the part of the plan that serves it, and how to eat for it. |
| **Quick Workout** | Pick a muscle group — Chest, Back, Legs, Core… — and get every exercise in the library that trains it, filtered to the equipment you have. Optionally start a timed circuit from the list. |
| **Log** | Workout and meal history, plus the totals and the 30-day grid. These moved off Home to keep it calm — this is the screen you come to for detail. |
| **Settings** | Mode, goals and targets, redo the questions, clear data. |
| **Profile** | Not a tab — reached from the avatar in the header or from Settings. Name, icon, PIN, training setup (experience, days/week, equipment, sport), switch profile, sign out, delete profile. |

### Phone vs. computer

The app is mobile-first: the base styles in the other three stylesheets *are*
the phone layout, and `css/desktop.css` widens things out at three
breakpoints. The two biggest changes:

- **At 1024px the bottom tab bar becomes a tall nav column** down the
  left-hand side, sitting beside the day streak, with big 60px-tall rows and
  the icon next to the label instead of above it. It's the same
  `<nav class="main-nav">` element either way — only its CSS changes. That's
  why the class is `main-nav` and not `bottom-nav`. Widen it by changing
  `--sidebar-w` in `css/desktop.css`.
- **Screens go from one tall column to two or three.** Home puts the streak
  on the left and goals plus the heatmap on the right; the plan week and the
  nutrition cards flow into columns.

The multi-column layouts need wrapper elements to hang a CSS grid on:
`.home-grid` / `.home-col` and `.quick-grid` are in `index.html`, while
`.day-grid` and `.nutrition-grid` are generated by `js/views/plan.js`. If you
add a new screen and want it to use columns on a desktop, wrap its sections
the same way.

The files marked ⭐ are the ones you'll probably want to edit first.

### How the code is organized

Everything hangs off a single global object called `MM` (for MoveMode), so
there are no loose variables floating around. `MM.store` is the saved data,
`MM.streak` does the streak math, `MM.ui` has the shared helpers, and so on.

The pattern for every screen is the same:

- **`init()`** runs once at startup and attaches event listeners.
- **`render()`** redraws the screen from the saved data, and can be called
  as often as needed.

Whenever anything is saved, `app.js` re-renders every screen. That's simple
and plenty fast here, and it means no screen can ever show a stale number.

> **One gotcha if you add to a view:** attach listeners in `init()`, not in
> `render()`. `render()` runs many times, so a listener added there gets added
> again every single time and your click handler will fire 5x. For buttons
> that `render()` creates fresh each time, use one delegated listener on the
> container — see `init()` in `views/plan.js` for the pattern.

---

## How to rename the site

Open `js/config.js` and change one line:

```js
MM.SITE = {
  name: 'MoveMode',   // <-- change this
```

That's the only place the name is written. It updates the header, the browser
tab title, the Settings page, and the onboarding welcome screen automatically.

Note that the name is also used to build the localStorage key, so renaming the
site gives it a fresh save slot — your old data isn't deleted, it's just not
loaded anymore. If you want to rename the site *and* keep existing data, also
set `storageKey` manually at the bottom of `config.js`.

While you're in `config.js` you can also change:

| Setting | What it does |
|---|---|
| `tagline` | The neutral one-liner (each mode also has its own in `copy.js`) |
| `defaultMode` | Which mode a brand-new visitor starts in |
| `restDaysPerWeek` | How many rest days don't break the streak |
| `milestones` | Which streak lengths trigger a celebration |

---

## How to add a new exercise

Open `js/data/exercises.js`, copy an existing entry, and edit it. Adding it to
that list is all you need to do — it immediately becomes available to plan
workouts *and* quick workouts.

```js
{
  id: 'jump-rope',                  // unique, lowercase, no spaces
  name: 'Jump Rope',                // what the user sees
  muscles: ['cardio', 'calves'],    // tags — see the valid list below
  equipment: 'none',                // 'none' | 'dumbbells' | 'gym'
  difficulty: 2,                    // 1 = anyone, 2 = some experience, 3 = experienced
  intensity: 'high',                // 'low' | 'medium' | 'high'
  timed: true,                      // true = measured in seconds, false = sets x reps
  howTo: 'Keep your elbows in and turn the rope with your wrists, not your ' +
         'whole arms. Small hops — you only need an inch of air.',
},
```

**Valid `muscles` tags:** `quads`, `hamstrings`, `glutes`, `calves`, `chest`,
`back`, `shoulders`, `biceps`, `triceps`, `core`, `cardio`, `fullbody`,
`mobility`, `power`, `speed`

Tagging it correctly is what makes it show up on the **Quick Workout** screen:
those buttons come from `MM.MUSCLE_GROUPS` at the bottom of the same file,
and each group lists the tags that belong to it (`Arms` collects `biceps` and
`triceps`, `Legs` collects `quads`, `hamstrings`, `glutes`, and `calves`).
Adding a group there makes a new button appear with no other changes.

A few things worth knowing:

- **Equipment is a ladder.** Someone with a full gym also gets dumbbell and
  bodyweight exercises. Someone with nothing only gets `equipment: 'none'`.
- **The tags are how exercises get picked.** Each workout day has a list of
  "slots" (see `MM.DAY_TYPES` in `plan-templates.js`), and each slot is filled
  with an exercise matching one of its tags. If you tag something `chest`, it
  can show up on push days.
- **Write a real `howTo`.** It's the only coaching a beginner gets, so one or
  two plain sentences about form beats a list of jargon.
- For exercises done one side at a time, say so in the `howTo`
  ("count reps per leg") — look at `db-row` for an example.

### Changing the programming instead

If you want to change *how* exercises get prescribed rather than which ones
exist, everything is in `js/data/plan-templates.js`:

- **`MM.GOALS`** — the goal options and the rotation of day types each one uses
- **`MM.DAY_TYPES`** — what a "Lower Body" day actually consists of
- **`MM.SET_SCHEMES`** — sets, reps, and rest by day type and goal
- **`MM.MODE_TUNING`** — the one spot that makes Grind harder than Chill
  (extra set, extra exercise, longer holds, harder exercises allowed)

---

## How the streak works

This is the most important logic in the app, so it's worth spelling out. It all
lives in `js/streak.js`.

1. **A day counts if you logged any activity on it** — from the "I moved today"
   button, from checking off a plan workout, or from finishing a quick workout.
2. **The streak is the unbroken chain of counting days ending today** — or
   ending yesterday if today is still empty. Today isn't a miss until the day
   is actually over, so your streak never looks broken just because it's 9am.
3. **A planned rest day doesn't break the chain.** You get one per calendar
   week (Monday–Sunday), set by `restDaysPerWeek` in `config.js`. Rest is part
   of training.
4. **Rest days keep the chain alive but don't add to the number**, because the
   number counts days you moved. So a perfect week with one rest day reads as
   "6 day streak", not 7.
5. **A missed day resets the streak to 0** and shows a restart message written
   in the current mode's voice (Chill is encouraging; Grind tells you to get
   back to work). **Your best streak ever is kept** — breaking a streak never
   lowers it. (Deleting all your data in Settings does clear it, since that
   wipes everything.)
6. **Milestones at 3, 7, 14, 30, and 100 days** pop a celebration, also in the
   current mode's voice. Each milestone only fires once per streak — if your
   streak breaks, they're up for grabs again.

Worked example:

| Day | What happened | Streak |
|---|---|---|
| Mon | Walked | 1 |
| Tue | Lifted | 2 |
| Wed | Marked a rest day | 2 — chain alive, rest doesn't count |
| Thu | Ran | 3 |
| Fri | Nothing | 3 — today isn't over yet |
| Sat | Nothing again | 0 — Friday was missed; restart message appears |

---

## Logging what you did

Tapping **I moved today** opens a box that asks "What did you do?" — and it's
a plain **text box**, not a dropdown. You type whatever it was: *walked to
school*, *raked the whole yard*, *danced around my room*. Underneath are
one-tap shortcuts (from `MM.ACTIVITY_SUGGESTIONS` in
`js/data/plan-templates.js`) that just fill the box in for you.

This matters more than it looks. A fixed dropdown of gym activities quietly
tells someone that what they did doesn't count, which is the opposite of the
point of this site. If you edit the suggestions, keep the everyday ones in
there.

Because the text is free-form, the little icon in the log is worked out by
looking for a keyword in what you wrote — "walked the dog on the trail" finds
*dog* and shows 🐕. That list is `ACTIVITY_ICONS` in `js/ui.js`; first match
wins, so put more specific words first. Anything unrecognised still gets a
tick, because it still counts.

## How to add a "why movement matters" fact

Open `js/data/movement-facts.js` and add an entry. Each one is a small chain —
something that happens when you move, then why that's good for you:

```js
{
  fact: 'Movement increases blood flow throughout your body.',
  why: 'Better blood flow helps your immune system get where it needs to go.',
  tag: 'body',     // 'body' or 'mind' — decides the label on screen
},
```

One fact shows on the home screen at a time, and tapping the card brings up
another. Keep roughly a even split between `body` and `mind` — the mental
health half is the part most fitness sites leave out, and it's half the
reason this site exists.

**Please keep these honest.** Everything in there is the boring,
well-established stuff, and the wording is careful on purpose: "helps",
"supports", and "is linked to" are doing real work in those sentences. If
you're unsure about a claim, either under-claim it or leave it out. There's
also `MM.MOVEMENT_MIND_NOTE`, shown under any mind fact, pointing people
toward real help — movement helps mental health, but it isn't a substitute
for talking to someone, and the site shouldn't imply otherwise.

## Editing workouts

The generated plan is a starting point, not a rule. On **My Goals**, every day
has an Edit button, and from there you can:

- **keep the generated workout** — do nothing
- **change it** — rename it, add or remove exercises, reorder them, set your
  own sets and reps, or turn it into a rest day
- **build one from scratch** — a rest day offers "+ Add", which gives you an
  empty workout and the exercise picker

### How edits survive

This is the part worth understanding before you change anything here. A day
you've touched is saved into **`data.customDays`**, keyed by weekday
(`0` = Monday) — **not** into the plan itself.

The plan gets rebuilt often: when the mode changes, when a goal changes, when
you tap Shuffle, when the training setup changes. Every one of those calls
`MM.planBuilder.build(profile, mode, customDays)`, and the builder lays your
custom days back over the generated ones at the end. So a rebuild can never
throw away a workout you wrote.

> If you add a new place that rebuilds the plan, **you must pass
> `d.customDays` as the third argument.** Forgetting it silently deletes the
> user's own workouts — that exact bug happened once already with the Shuffle
> button, and there's now a test for it.

"Reset to generated" just deletes that entry from `customDays`, and the
generated version comes straight back.

## How goals and progress bars work

A user can have **as many goals as they want**, and each one gets a progress
bar on the home screen. There are two kinds:

**Automatic goals** measure themselves from what you've already logged — there
is nothing to update by hand. Picking a goal category in onboarding creates
one of these for you, using the `tracker` defined on that category in
`js/data/plan-templates.js`. The available measurements live in
`MM.GOAL_METRICS` in `js/goal-tracker.js`:

| Metric | Measures | Resets |
|---|---|---|
| `activeDays` | Days you moved | Every Monday |
| `sessions` | Number of workouts | Every Monday |
| `minutes` | Minutes logged | Every Monday |
| `streak` | Your current streak | Never |

### Deadlines are optional on purpose

When you create a goal you choose how long to give yourself, and the **first
option — and the default — is "However long it takes."** That's deliberate.
Wanting to do 100 push-ups *eventually* is a perfectly good goal, and forcing
someone to commit to a date can put them off starting at all.

It's worded as a real answer rather than "no deadline" for the same reason:
it should read as a choice, not as a field you forgot to fill in. The goal
card and the goal's page both say "however long it takes" rather than showing
a blank. A deadline can be added later, and removed again in one tap, from
the update form or from Settings.

**Manual goals** are ones only the user knows the number for — a bench press
max, a mile time, a body weight. They tap **Update** on the home screen and
type the new number. These work in both directions: if the target is *lower*
than the starting number (a mile time going from 9:00 down to 7:00), the bar
fills as the number comes down.

To add a new kind of automatic measurement, add an entry to `MM.GOAL_METRICS`
with a `measure()` function. The "add a goal" form builds its dropdown from
that object, so it appears in the UI with no other changes.

### Goal categories vs. tracked goals

These are two related but separate things, and it's worth keeping them
straight:

- **`profile.goals`** is the list of goal *categories* ("Build muscle",
  "Lose weight"). These drive the weekly plan. When several are picked,
  `plan-builder.js` takes turns pulling days from each category's rotation,
  so a muscle + weight-loss week gets both lifting and cardio days. The
  **first** category is the primary one: it sets the sets-and-reps scheme and
  decides which nutrition guidance is shown, because merging "eat enough to
  gain weight" with "lose weight" would produce nonsense.
- **`trackedGoals`** is the list of things with progress bars. Category goals
  are kept in sync with `profile.goals` automatically, and goals the user
  wrote themselves are never touched by that syncing.

There always has to be at least one category selected, since the plan is
built from it — the UI blocks removing the last one.

## How to change the wording or add a third mode

All the text whose *tone* depends on the mode is in `js/data/copy.js`, split
into a `chill` block and a `grind` block with identical keys. Rewriting the
personality of the whole site means editing that one file.

```js
MM.copy('streakLabel')       // reads the line for whichever mode is active
MM.copy('milestones.7.body') // nested lines use dots
MM.randomHype()              // a random encouragement line
```

If a key is missing, the app displays the key path itself instead of
`undefined` — so a typo is obvious on screen instead of silently blank.

**To add a third mode** (say, "Focus"):

1. Copy the `[data-mode='grind']` block in `css/theme.css`, rename it, and
   change the colors and fonts.
2. Copy the `grind` block in `js/data/copy.js` and rewrite the lines. Keep
   every key — missing keys show up as raw text.
3. Add an entry to `MM.MODE_TUNING` in `js/data/plan-templates.js` to set its
   difficulty.
4. Add a `<button class="mode-opt" data-mode="focus">` to the toggle in
   `index.html`. You'll need to widen `.mode-thumb` in `components.css`, since
   it's currently sized for exactly two options.

---

## Nutrition guardrails

`js/data/nutrition.js` deliberately has rules, and they're worth keeping if you
edit it. This is a site teenagers will use while they're still growing, where
under-eating is a far bigger risk than over-eating:

- No extreme diets, no cutting out food groups, no detoxes, no fasting plans.
- **No calorie targets.** Any numbers are wide ranges, always labeled as rough.
- Weight-loss guidance is about *adding* habits (protein, vegetables, water,
  walking), never about restricting or "earning" food.
- Muscle and weight-gain guidance emphasizes eating *enough*.
- Every goal shows the "check with a parent, coach, or doctor" note.

---

## "I pushed a change but the site looks the same"

Browsers hang on to CSS and JavaScript for a while, so after a push you can
end up staring at the old version wondering why nothing happened. GitHub
Pages tells browsers to cache for 10 minutes.

**Quick check:** hard-refresh — `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R`
(Windows). That forces one browser to re-fetch everything.

**Proper fix:** every CSS and JS file in `index.html` has a `?v=` number on
the end. Bump it and *every* browser treats the files as new:

```bash
perl -i -pe 's/\?v=\d+/?v=3/g' index.html    # then 4, 5, …
```

The number itself means nothing — it only has to differ from last time. Do
this whenever you push something people need to see straight away. There's a
test that every file carries the same version, so one can't get left behind.

## Running the tests

There's an automated test suite. Once, to set it up:

```bash
npm install
```

Then any time you change something:

```bash
npm test
```

It loads the real `index.html` in a fake browser and clicks around it the way
a person would — signs in, logs a workout, switches modes, checks the streak
maths — then prints a pass/fail count.

> **npm is only for the tests.** The site itself still has no build step and
> no dependencies. You can always just open `index.html`. Nothing in
> `node_modules/` ever ships.

Run it before and after a change. It catches the things that are easy to
break by accident: streak logic, a form that quietly stops saving, data not
surviving a reload. Adding your own check is two lines — see the comment at
the top of `test/run.js`.

## Testing it yourself

Some things still need a human eye. After you change something:

- **Does data survive a reload?** Log a workout, press refresh. The streak,
  plan, and log should all still be there.
- **Does the streak handle a missed day?** The easiest way to test this is to
  use the date field in the "I moved today" form to backdate entries, then
  reload. You can also edit `movemode.v1` directly in DevTools →
  Application → Local Storage.
- **Do both modes look right on a phone?** In Chrome or Firefox DevTools, turn
  on device toolbar (Cmd+Shift+M) and pick iPhone SE — that's the narrowest
  screen worth supporting. Check every tab in both modes.
- **Does the desktop layout hold up?** Drag the window from narrow to wide and
  watch the three breakpoints (640px, 1024px, 1400px). At 1024px the tab bar
  should become a sidebar with nothing overlapping it.
- **Do the progress bars add up?** Log a workout and check the weekly goals
  move. Add a manual goal with a target *below* its starting number and make
  sure the bar fills as the number comes down.
- **Check the console.** Any red error means something is broken, even if the
  page looks fine.

---

## Ideas for future features

Roughly easiest to hardest:

**Polish and small wins**
- Badges and achievements for milestones, total workouts, and total minutes
- A history chart for a manual goal, so you can see the climb over time
- Reordering goals by dragging, to change which one is primary
- Goal deadlines ("bench 185 by June") with a pace indicator
- Personal records per exercise (weight, reps, time) with a little chart
- A "why I'm doing this" note the user writes during onboarding, shown on the
  home screen on hard days
- Dark Chill / light Grind variants, so theme and tone aren't tied together
- Exercise demo images or short looping clips
- Swap a single exercise in a plan day without rebuilding the week
- Rearrange which weekdays your workouts land on
- Export and import your data as a JSON file, so it can move between devices
- Sound or vibration cues on the quick-workout timer
- Weekly recap: "here's what you did this week"

**Bigger builds**
- **Real accounts and sync** so a streak follows you across devices. The
  profile system is already in place; what's missing is a server to hold the
  accounts and the data, with passwords hashed server-side (bcrypt/Argon2).
  `js/accounts.js` is the seam — everything else just asks it who's active.
  This is the single biggest item on the list, and the only way the sign-in
  becomes real security rather than a speed bump.
- **An AI coach chat** that answers form questions, adapts the week when you're
  sore or traveling, and explains *why* a plan looks the way it does. Would
  need a backend to hold the API key — never put a key in frontend code.
- **Friends and challenges** — shared streaks, weekly leaderboards, "nudge a
  friend who hasn't moved today"
- **Share your streak** as an image for stories
- **A "coach" or "team" view** so a coach can build a plan once and assign it
  to a whole roster
- **Progressive overload tracking** that bumps your prescribed weights over
  time based on logged lifts
- **Install as an app** (PWA) with a service worker, an icon on the home
  screen, and full offline support
- **Push notifications** for a daily reminder, or a warning when your streak
  is about to break

---

Built to inspire people at every level to be more physically active — from
their very first walk to their thousandth workout.
