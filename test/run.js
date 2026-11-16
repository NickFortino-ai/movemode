/* ============================================================================
   MoveMode test suite
   ============================================================================
   RUN IT WITH:   npm test      (the first time, run `npm install` first)

   This loads the real index.html in a fake browser (jsdom) and then clicks
   around it the way a person would — signs in, logs a workout, switches
   modes — checking that the right things happen.

   IMPORTANT: npm is only needed for these TESTS. The site itself still has
   no build step and no dependencies. You can always just open index.html.

   Each check prints a line. At the bottom you get a pass/fail count, and the
   command exits non-zero if anything failed. When you change something, run
   this first — it catches the things that are easy to break by accident,
   like the streak maths or a form that stops saving.

   ADDING A TEST
     check('what you are testing', theValueYouGot, theValueYouExpected);
     ok('something that should be true', someCondition);
   Put related checks under a group('name') so the output stays readable.
   ========================================================================== */
const fs = require('fs');
const path = require('path');
const { JSDOM, requestInterceptor, VirtualConsole } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

let pass = 0, fail = 0;
function check(name, actual, expected) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       expected ${e}\n       got      ${a}`); }
}
const ok = (name, cond) => check(name, !!cond, true);
const group = (n) => console.log('\n' + n);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const localInterceptor = requestInterceptor((request) => {
  const url = request.url;
  const type = url.endsWith('.css') ? 'text/css' : 'application/javascript';
  if (!url.startsWith('https://movemode.local/')) {
    return new Response('', { headers: { 'Content-Type': type } });
  }
  const rel = url.replace('https://movemode.local/', '').split('?')[0];
  try {
    return new Response(fs.readFileSync(path.join(ROOT, rel), 'utf8'),
                        { headers: { 'Content-Type': type } });
  } catch (e) {
    console.log('  !! could not load ' + rel);
    fail++;
    return new Response('', { headers: { 'Content-Type': type } });
  }
});

const vc = new VirtualConsole();
vc.on('jsdomError', (e) => {
  if (/Not implemented/.test(e.message)) return;
  console.log('  !! PAGE ERROR: ' + e.message);
  fail++;
});
vc.on('error', (m) => { console.log('  !! console.error: ' + m); fail++; });

async function boot(presetStorage) {
  const dom = new JSDOM(html, {
    url: 'https://movemode.local/index.html',
    runScripts: 'dangerously',
    resources: { interceptors: [localInterceptor] },
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      window.HTMLElement.prototype.scrollIntoView = function () {};
      window.scrollTo = function () {};
      if (presetStorage) {
        Object.keys(presetStorage).forEach((k) =>
          window.localStorage.setItem(k, presetStorage[k]));
      }
    },
  });
  await new Promise((r) => dom.window.addEventListener('load', r));
  await sleep(80);
  return dom;
}

const ui_text = (el) => (el ? el.textContent : '');
const pad = (n) => (n < 10 ? '0' + n : '' + n);
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return keyOf(d); }
const TODAY = keyOf(new Date());

function craft(extra) {
  return JSON.stringify(Object.assign({
    version: 1, mode: 'chill', onboarded: true,
    profile: { goals: ['general'], goal: 'general', experience: 'some',
               daysPerWeek: 3, equipment: 'none', sport: '' },
    trackedGoals: [], plan: null, activities: [], meals: [],
    restDays: [], planCompletions: {},
    streak: { best: 0, lastSeen: 0, celebrated: [], restartNotice: null },
  }, extra));
}

function signedIn(dataJson, profile) {
  const account = Object.assign({
    id: 'p_test', name: 'Tester', avatar: '💪', pin: null, createdAt: TODAY,
  }, profile || {});
  const store = {
    'movemode.v1.accounts': JSON.stringify({
      version: 1, profiles: [account], activeId: account.id }),
  };
  if (dataJson) store['movemode.v1.' + account.id] = dataJson;
  return store;
}

(async function run() {

  // =========================================================================
  group('movement facts — the point of the site');
  {
    const d = await boot(signedIn(craft({})));
    const W = d.window;
    const facts = W.MM.MOVEMENT_FACTS;

    ok('there are a decent number of facts', facts.length >= 12);
    check('every fact has all three fields',
          facts.filter((f) => !f.fact || !f.why || !f.tag).length, 0);
    check('tags are only body or mind',
          facts.filter((f) => !['body', 'mind'].includes(f.tag)).map((f) => f.tag), []);
    ok('both body and mind are covered',
       facts.some((f) => f.tag === 'body') && facts.some((f) => f.tag === 'mind'));
    ok('a decent number are about mental health',
       facts.filter((f) => f.tag === 'mind').length >= 5);
    check('facts are unique', new Set(facts.map((f) => f.fact)).size, facts.length);
    ok('every fact is a full sentence',
       facts.every((f) => f.fact.trim().endsWith('.') && f.why.trim().endsWith('.')));

    // The user's example shape: a thing that happens, then why it's good.
    ok('the blood-flow/immunity fact is in there',
       facts.some((f) => /blood flow/i.test(f.fact) && /immune/i.test(f.why)));

    // Guard against overclaiming — this is a teen audience.
    const allText = JSON.stringify(facts).toLowerCase();
    const overclaims = ['cures', 'cure ', 'guaranteed', 'instantly fixes',
                        'replaces therapy', 'treats depression', 'treats anxiety'];
    check('no medical overclaiming', overclaims.filter((w) => allText.includes(w)), []);

    ok('the mental-health note points elsewhere for real help',
       /talk to someone/i.test(W.MM.MOVEMENT_MIND_NOTE));

    // The random picker avoids repeating the fact it was given.
    const first = facts[0].fact;
    const picks = Array.from({ length: 40 }, () => W.MM.randomMovementFact(first).fact);
    check('randomMovementFact never repeats the one to avoid',
          picks.filter((p) => p === first).length, 0);
    ok('and it does return varied facts', new Set(picks).size > 3);
    d.window.close();
  }

  // =========================================================================
  group('home screen is calm: goals and progress only');
  {
    const d = await boot(signedIn(craft({
      activities: [{ id: 'a', date: TODAY, type: 'Walk', minutes: 30,
                     source: 'manual', notes: '' }],
    })));
    const W = d.window;
    const q = (s) => W.document.querySelector(s);
    const qq = (s) => [...W.document.querySelectorAll(s)];

    check('lands on home', q('.view.is-active').id, 'view-home');

    // --- What SHOULD be here ---
    ok('the streak is here', !!q('#streak-number'));
    check('and it reads correctly', q('#streak-number').textContent, '1');
    ok('the "I moved today" button is here', !!q('#btn-moved'));
    ok('the rest day button is here', !!q('#btn-rest'));
    ok('goal progress bars are here', !!q('#home-goals .goal-item'));
    ok('you can add a goal from here', !!q('#btn-add-goal'));
    ok('the why-movement-matters banner is here', !!q('#why-card'));

    // --- What should have MOVED OFF ---
    ok('no 30-day grid on home', !q('#view-home .heatmap'));
    ok('no stats row on home', !q('#view-home .stat-row'));
    ok('no hub cards on home', !q('#view-home .hub-card'));
    ok('no next-milestone line on home', !q('#streak-next'));

    // Counting the top-level blocks is a rough but useful "is it busy?" check.
    const homeBlocks = qq('#view-home .home-col > *').filter((el) => el.innerHTML.trim());
    ok(`home has few top-level blocks (${homeBlocks.length})`, homeBlocks.length <= 9);

    // --- The why banner works ---
    // It runs across the top of the screen, above the two columns.
    const banner = q('#home-why');
    ok('the banner is above the columns, not inside a column',
       banner.parentElement.id === 'view-home');
    ok('it comes before the goals and streak',
       banner.compareDocumentPosition(q('.home-grid')) & 4);  // 4 = FOLLOWING

    const factBefore = q('.why-fact').textContent;
    ok('the fact is real text', factBefore.length > 20);
    ok('it explains why', q('.why-because').textContent.length > 20);
    ok('it is labelled body or mind',
       /your body|your mind/i.test(q('.why-tag').textContent));

    q('#why-card').click();
    await sleep(40);
    check('tapping shows a different fact',
          q('.why-fact').textContent !== factBefore, true);

    // Re-rendering (logging something) must NOT shuffle the card underneath.
    const factNow = q('.why-fact').textContent;
    W.MM.store.addActivity({ type: 'Walk', minutes: 10, source: 'manual' });
    await sleep(60);
    check('logging does not shuffle the fact', q('.why-fact').textContent, factNow);
    d.window.close();
  }

  // =========================================================================
  group('the detail moved to the Log screen');
  {
    const d = await boot(signedIn(craft({
      activities: [0, 1, 3].map((n, i) => ({
        id: 'a' + i, date: daysAgo(n), type: 'Walk', minutes: 30,
        source: 'manual', notes: '' })),
      streak: { best: 9, lastSeen: 2, celebrated: [3], restartNotice: null },
    })));
    const W = d.window;
    const q = (s) => W.document.querySelector(s);

    q('.nav-btn[data-view="log"]').click();
    check('log view active', q('.view.is-active').id, 'view-log');

    check('the 30-day grid is here now',
          W.document.querySelectorAll('#view-log .heat-cell').length, 30);
    check('the stats row is here now',
          W.document.querySelectorAll('#log-stats .stat').length, 3);
    ok('best streak shown in the stats', q('#log-stats').textContent.includes('9'));
    ok('the grid has a heading', q('#heatmap-title').textContent.length > 3);
    ok('today is marked in the grid', !!q('#view-log .heat-cell.is-today'));
    ok('the log entries are still here', !!q('#log-content .log-entry'));
    d.window.close();
  }

  // =========================================================================
  group('the voice is about movement, not just fitness');
  {
    const d = await boot(signedIn(craft({})));
    const W = d.window;

    // Both modes must still define exactly the same keys.
    check('chill and grind define the same copy keys',
          Object.keys(W.MM.COPY.chill).sort(), Object.keys(W.MM.COPY.grind).sort());

    ['chill', 'grind'].forEach((mode) => {
      const voice = W.MM.COPY[mode];
      ok(`${mode}: tagline mentions movement or the mind`,
         /move|movement|head|mind/i.test(voice.tagline));
      ok(`${mode}: at least one hype line is about the mind`,
         voice.hype.some((line) => /head|mind|mood|clears|day/i.test(line)));
      check(`${mode}: no dead hub copy left behind`,
            Object.keys(voice).filter((k) => k.startsWith('hub')), []);
    });

    ok('the site tagline is movement-first',
       /move/i.test(W.MM.SITE.tagline) && /head|mind/i.test(W.MM.SITE.tagline));
    ok('the page description mentions the mind',
       /mind/i.test(W.document.querySelector('meta[name=description]').content));
    d.window.close();
  }

  // =========================================================================
  group('streak logic still holds');
  {
    const cases = [
      { name: 'moved today', days: [0], rest: [], expect: 1 },
      { name: 'three in a row', days: [0, 1, 2], rest: [], expect: 3 },
      { name: 'today empty keeps it alive', days: [1, 2, 3], rest: [], expect: 3 },
      { name: 'a real miss breaks it', days: [2, 3], rest: [], expect: 0 },
      { name: 'a rest day bridges', days: [0, 2, 3], rest: [daysAgo(1)], expect: 3 },
      { name: 'nothing logged', days: [], rest: [], expect: 0 },
    ];

    for (const c of cases) {
      const d = await boot(signedIn(craft({
        restDays: c.rest,
        activities: c.days.map((n, i) => ({
          id: 'x' + i, date: daysAgo(n), type: 'Walk', minutes: 20,
          source: 'manual', notes: '' })),
      })));
      check(c.name, d.window.document.querySelector('#streak-number').textContent,
            String(c.expect));
      d.window.close();
    }
  }

  // =========================================================================
  group('the rest of the app still works');
  {
    const d = await boot(signedIn(craft({})));
    const W = d.window;
    const q = (s) => W.document.querySelector(s);

    // Logging from the home screen
    q('#btn-moved').click();
    ok('the log form opens', !!q('#activity-form'));

    // Submitting with an empty box must not log anything.
    q('#activity-form').dispatchEvent(new W.Event('submit', { bubbles: true, cancelable: true }));
    await sleep(40);
    check('an empty entry is refused', W.MM.store.get().activities.length, 0);

    q('#activity-type').value = 'Walked to school';
    q('#activity-minutes').value = '25';
    q('#activity-form').dispatchEvent(new W.Event('submit', { bubbles: true, cancelable: true }));
    await sleep(60);
    check('activity saved', W.MM.store.get().activities.length, 1);
    check('streak moved', q('#streak-number').textContent, '1');

    // Goals
    check('a goal bar per tracked goal',
          W.document.querySelectorAll('#home-goals .goal-item').length,
          W.MM.store.get().trackedGoals.length);

    // My Goals page — goals show even before a plan exists.
    q('.nav-btn[data-view="goals"]').click();
    check('my goals opens', q('.view.is-active').id, 'view-goals');
    ok('goal bars show with no plan yet', !!q('#goals-content .goal-item'));
    ok('and it offers to build one', !!q('#plan-setup'));

    // Now build a plan and check the two halves appear.
    W.MM.store.update((dd) => { dd.plan = W.MM.planBuilder.build(dd.profile, dd.mode); });
    await sleep(60);
    ok('goal bars still at the top', !!q('#goals-content .goal-item'));
    ok('the exercise plan is there',
       q('#goals-content').textContent.includes(W.MM.copy('goalsPlanHeading')));
    ok('the diet plan is there',
       q('#goals-content').textContent.includes(W.MM.copy('goalsDietHeading')));
    check('a week of day cards',
          W.document.querySelectorAll('#goals-content .day-card').length, 7);

    // Quick workout
    q('.nav-btn[data-view="quick"]').click();
    check('a button per muscle group',
          W.document.querySelectorAll('#muscle-groups .muscle-card').length,
          W.MM.MUSCLE_GROUPS.length);
    q('[data-muscle="legs"]').click();
    await sleep(60);
    ok('exercises listed for legs',
       W.document.querySelectorAll('#quick-result .exercise-row').length >= 3);

    // Profile
    q('#header-avatar').click();
    check('profile opens from the avatar', q('.view.is-active').id, 'view-profile');
    ok('it names the profile', q('#profile-content').textContent.includes('Tester'));

    // Mode switch
    q('.mode-opt[data-mode="grind"]').click();
    await sleep(60);
    check('mode flipped', W.document.documentElement.dataset.mode, 'grind');
    check('copy followed', W.MM.store.get().mode, 'grind');
    d.window.close();
  }

  // =========================================================================
  group('logging: type what you actually did');
  {
    const d = await boot(signedIn(craft({})));
    const W = d.window;
    const q = (s) => W.document.querySelector(s);

    q('#btn-moved').click();
    ok('the form opens', !!q('#activity-form'));

    // It must be a TEXT BOX, not a dropdown of gym activities.
    const box = q('#activity-type');
    check('what you did is a text box', box.tagName, 'INPUT');
    check('of type text', box.type, 'text');
    ok('it is required', box.required);
    ok('it asks what you did',
       W.document.querySelector('label[for="activity-type"]').textContent
        .toLowerCase().includes('what did you do'));
    ok('the placeholder suggests everyday movement',
       /walk|danc|yard|dog/i.test(box.placeholder));
    ok('the hint says everyday things count',
       /rak|dog|danc/i.test(q('#activity-form .field-hint').textContent));

    // Shortcuts fill the box rather than limiting it.
    const chips = [...W.document.querySelectorAll('[data-suggest]')];
    check('shortcuts offered', chips.length, W.MM.ACTIVITY_SUGGESTIONS.length);
    ok('the shortcuts include everyday movement, not just gym words',
       W.MM.ACTIVITY_SUGGESTIONS.some((s) => /dog|housework|yard|danc|outside|stairs/i.test(s)));
    chips.find((c) => c.dataset.suggest === 'Walked the dog').click();
    check('tapping a shortcut fills the box', box.value, 'Walked the dog');

    // But you can type anything at all.
    box.value = 'Raked the whole yard with my grandpa';
    q('#activity-minutes').value = '45';
    q('#activity-form').dispatchEvent(new W.Event('submit', { bubbles: true, cancelable: true }));
    await sleep(60);

    const logged = W.MM.store.get().activities[0];
    check('whatever you typed is saved', logged.type, 'Raked the whole yard with my grandpa');
    check('minutes saved too', logged.minutes, 45);
    check('it counts toward the streak', q('#streak-number').textContent, '1');

    // And it shows up in the log, with an icon worked out from the words.
    q('.nav-btn[data-view="log"]').click();
    ok('it appears in the log',
       q('#log-content').textContent.includes('Raked the whole yard'));
    check('a sensible icon was picked from the text',
          W.MM.ui.activityIcon('Raked the whole yard with my grandpa'), '🍂');

    // Typed text must be escaped, not treated as markup.
    W.MM.store.addActivity({ type: 'Walked <b>far</b>', minutes: 10, source: 'manual' });
    await sleep(60);
    ok('typed text is escaped', q('#log-content').innerHTML.includes('&lt;b&gt;'));

    // A few more icon guesses from free text.
    const guesses = [
      ['walked the dog', '🐕'], ['Went for a long walk', '🚶'],
      ['morning jog', '🏃'], ['bike ride to school', '🚴'],
      ['danced around my room', '💃'], ['shovelled snow', '❄️'],
      ['vacuumed the house', '🧹'], ['swim practice', '🏊'],
      ['something nobody listed', '✅'],
    ];
    guesses.forEach(function (pair) {
      check('icon for "' + pair[0] + '"', W.MM.ui.activityIcon(pair[0]), pair[1]);
    });
    d.window.close();
  }

  // =========================================================================
  group('looking back: what you typed is kept');
  {
    // Type three different things on three different days.
    const entries = [
      { date: TODAY,      text: 'Walked to school and back',        mins: 35 },
      { date: daysAgo(1), text: 'Raked the whole yard with grandpa', mins: 50 },
      { date: daysAgo(2), text: 'Danced around my room to one song', mins: 5 },
    ];

    let d = await boot(signedIn(craft({
      activities: entries.map((e, i) => ({
        id: 'e' + i, date: e.date, type: e.text, minutes: e.mins,
        source: 'manual', notes: '' })),
    })));
    let W = d.window;
    let q = (s) => W.document.querySelector(s);

    q('.nav-btn[data-view="log"]').click();
    const logText = () => q('#log-content').textContent;

    entries.forEach((e) => {
      ok(`"${e.text}" is in the log`, logText().includes(e.text));
      ok(`and its minutes are shown`, logText().includes(e.mins + ' min'));
    });

    check('one entry row per thing logged',
          W.document.querySelectorAll('#log-content .log-entry').length, 3);
    check('grouped by day', W.document.querySelectorAll('#log-content .log-day').length, 3);
    ok('days are labelled readably',
       logText().includes('Today') && logText().includes('Yesterday'));

    // Newest first, so looking back starts with what you just did.
    const firstShown = W.document.querySelector('#log-content .log-name').textContent;
    ok('newest day first', firstShown.includes('Walked to school'));

    // Grab the whole of localStorage, then close the page entirely.
    const saved = {};
    for (let i = 0; i < W.localStorage.length; i++) {
      const k = W.localStorage.key(i);
      saved[k] = W.localStorage.getItem(k);
    }
    d.window.close();

    // --- Come back later: it should all still be there, word for word ---
    d = await boot(saved);
    W = d.window;
    q = (s) => W.document.querySelector(s);

    q('.nav-btn[data-view="log"]').click();
    entries.forEach((e) => {
      ok(`"${e.text}" survived the reload`,
         q('#log-content').textContent.includes(e.text));
    });
    check('stored exactly as typed, not reworded',
          W.MM.store.get().activities.map((a) => a.type),
          entries.map((e) => e.text));
    check('still three entries after reload',
          W.document.querySelectorAll('#log-content .log-entry').length, 3);

    // You can also remove one you got wrong.
    W.document.querySelector('[data-remove-activity]').click();
    await sleep(60);
    check('an entry can be deleted', W.MM.store.get().activities.length, 2);
    ok('and it is gone from the list',
       !q('#log-content').textContent.includes('Walked to school'));
    d.window.close();
  }

  // =========================================================================
  group('goal deadlines: set them, and change your mind later');
  {
    const d = await boot(signedIn(craft({})));
    const W = d.window;
    const q = (s) => W.document.querySelector(s);
    const T = W.MM.goalTracker;

    // --- Setting one when the goal is created ---
    q('#btn-add-goal').click();
    ok('the form asks when by', !!q('#goal-timeframe'));
    check('timeframe choices offered',
          W.document.querySelectorAll('#goal-timeframe option').length,
          W.MM.GOAL_TIMEFRAMES.length);
    // "However long it takes" has to be a real, inviting option — and the
    // default — not a blank you forgot to fill in.
    const openEnded = W.MM.GOAL_TIMEFRAMES.find((f) => f.days === null);
    ok('an open-ended option exists', !!openEnded);
    check('worded as a real answer', openEnded.label, 'However long it takes');
    check('and it is the first choice', W.MM.GOAL_TIMEFRAMES[0].id, openEnded.id);
    check('so it is what the form defaults to', q('#goal-timeframe').value, openEnded.id);
    ok('the hint tells you that is allowed',
       /however long it takes/i.test(q('#goal-form .field-hint').textContent) ||
       /real answer/i.test(ui_text(q('#goal-form'))));
    ok('the custom date box is hidden until asked for',
       q('#goal-custom-date-field').style.display === 'none');

    q('#goal-timeframe').value = 'custom';
    q('#goal-timeframe').dispatchEvent(new W.Event('change', { bubbles: true }));
    ok('picking a date reveals the date box',
       q('#goal-custom-date-field').style.display !== 'none');

    q('#goal-timeframe').value = '1m';
    q('#goal-name').value = 'Bench press';
    q('#goal-metric').value = 'manual';
    q('#goal-metric').dispatchEvent(new W.Event('change', { bubbles: true }));
    q('#goal-start').value = '155';
    q('#goal-target').value = '185';
    q('#goal-form').dispatchEvent(new W.Event('submit', { bubbles: true, cancelable: true }));
    await sleep(60);

    const bench = W.MM.store.get().trackedGoals.find((g) => g.name === 'Bench press');
    ok('the goal was created', !!bench);
    check('a deadline 30 days out was worked out',
          bench.deadline, W.MM.dates.addDays(TODAY, 30));

    // --- The countdown ---
    const due = T.deadlineInfo(bench);
    check('days left计算ed', due.daysLeft, 30);
    ok('shown in weeks once it is far off', /weeks left/.test(due.label));
    ok('not overdue', !due.overdue);
    ok('the countdown shows on the goal', q('#home-goals .goal-due') !== null);

    // Wording across the range.
    const label = (date) => T.deadlineInfo({ deadline: date }).label;
    check('today reads as due today', label(TODAY), 'Due today');
    check('tomorrow reads as one day', label(W.MM.dates.addDays(TODAY, 1)), '1 day left');
    check('a few days reads in days', label(W.MM.dates.addDays(TODAY, 5)), '5 days left');
    check('yesterday reads as past', label(W.MM.dates.addDays(TODAY, -1)), '1 day past');
    ok('overdue is flagged', T.deadlineInfo({ deadline: daysAgo(3) }).overdue);
    check('no deadline means no countdown', T.deadlineInfo({ deadline: null }), null);

    // --- Changing it afterwards, because nobody guesses right first time ---
    q('[data-update-goal]').click();
    ok('the update form has a deadline box', !!q('#progress-deadline'));
    check('pre-filled with the current deadline', q('#progress-deadline').value, bench.deadline);

    const later = W.MM.dates.addDays(TODAY, 90);
    q('#progress-deadline').value = later;
    q('#progress-value').value = '165';
    q('#progress-form').dispatchEvent(new W.Event('submit', { bubbles: true, cancelable: true }));
    await sleep(60);
    check('the deadline was moved', T.find(bench.id).deadline, later);
    check('and the progress saved at the same time', T.find(bench.id).current, 165);

    // Clearing the box drops the deadline entirely.
    q('[data-update-goal]').click();
    q('#progress-deadline').value = '';
    q('#progress-form').dispatchEvent(new W.Event('submit', { bubbles: true, cancelable: true }));
    await sleep(60);
    check('an empty box removes the deadline', T.find(bench.id).deadline, null);

    // It is editable from Settings too.
    T.setDeadline(bench.id, later);
    q('.nav-btn[data-view="settings"]').click();
    check('settings has a date box for every goal',
          W.document.querySelectorAll('[data-goal-deadline]').length,
          W.MM.store.get().trackedGoals.length);
    const dateBox = q('[data-goal-deadline="' + bench.id + '"]');
    ok('including this one', !!dateBox);
    check('showing the current deadline', dateBox.value, later);
    dateBox.value = W.MM.dates.addDays(TODAY, 14);
    dateBox.dispatchEvent(new W.Event('change', { bubbles: true }));
    await sleep(60);
    check('editing it there saves too',
          T.find(bench.id).deadline, W.MM.dates.addDays(TODAY, 14));
    d.window.close();
  }

  // =========================================================================
  group('a goal with no clock on it: "100 push-ups, however long it takes"');
  {
    const d = await boot(signedIn(craft({})));
    const W = d.window;
    const q = (s) => W.document.querySelector(s);
    const T = W.MM.goalTracker;

    q('#btn-add-goal').click();
    q('#goal-name').value = 'Do 100 push-ups';
    q('#goal-metric').value = 'manual';
    q('#goal-metric').dispatchEvent(new W.Event('change', { bubbles: true }));
    q('#goal-start').value = '0';
    q('#goal-unit').value = 'push-ups';
    q('#goal-target').value = '100';
    // Leaving the timeframe on its default — no date picked at all.
    q('#goal-form').dispatchEvent(new W.Event('submit', { bubbles: true, cancelable: true }));
    await sleep(60);

    const pushups = W.MM.store.get().trackedGoals.find((g) => g.name === 'Do 100 push-ups');
    ok('the goal was created', !!pushups);
    check('with no deadline at all', pushups.deadline, null);
    check('and it still tracks properly', T.progress(pushups).summary, '0 / 100 push-ups');

    // It must read as a choice, not an omission, everywhere it appears.
    check('the label is a real phrase', T.deadlineLabel(pushups), 'However long it takes');
    ok('the card says so rather than showing nothing',
       /however long it takes/i.test(q('#home-goals .goal-due').textContent));

    W.MM.myGoalsView.openGoal(pushups.id);
    W.MM.app.showView('goals');
    await sleep(60);
    ok('the goal page says so too',
       /however long it takes/i.test(q('#goals-content').textContent));
    ok('and no overdue warning is possible', !q('.goal-due.is-over'));

    // Progress still works exactly as it would with a deadline.
    T.recordProgress(pushups.id, { current: 40 });
    await sleep(60);
    check('progress still counts', T.progress(T.find(pushups.id)).percent, 40);

    // You can add a deadline later if you change your mind...
    q('[data-update-goal]').click();
    q('#progress-deadline').value = W.MM.dates.addDays(TODAY, 30);
    q('#progress-form').dispatchEvent(new W.Event('submit', { bubbles: true, cancelable: true }));
    await sleep(60);
    ok('a deadline can be added later', !!T.find(pushups.id).deadline);

    // ...and take it off again with one tap.
    q('[data-update-goal]').click();
    ok('there is a one-tap way back to open-ended', !!q('#progress-no-deadline'));
    q('#progress-no-deadline').click();
    check('tapping it clears the date box', q('#progress-deadline').value, '');
    q('#progress-form').dispatchEvent(new W.Event('submit', { bubbles: true, cancelable: true }));
    await sleep(60);
    check('and saving keeps it open-ended', T.find(pushups.id).deadline, null);
    d.window.close();
  }

  // =========================================================================
  group('progress graphs');
  {
    const d = await boot(signedIn(craft({
      // Four weeks of activity, so the weekly graphs have real shape.
      activities: [0, 1, 3, 8, 9, 15, 16, 17, 22].map((n, i) => ({
        id: 'g' + i, date: daysAgo(n), type: 'Walk', minutes: 20 + i,
        source: 'manual', notes: '' })),
    })));
    const W = d.window;
    const q = (s) => W.document.querySelector(s);
    const T = W.MM.goalTracker;

    // --- An automatic weekly goal builds its history from the log ---
    const autoGoal = W.MM.store.get().trackedGoals[0];     // 'general' -> activeDays
    const autoSeries = T.series(autoGoal);
    check('eight weeks of points', autoSeries.length, 8);
    ok('oldest first', autoSeries[0].date < autoSeries[7].date);
    ok('every point has a date and a number',
       autoSeries.every((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.date) && typeof p.value === 'number'));
    ok('this week matches what the bar says',
       autoSeries[7].value === T.progress(autoGoal).current);

    // --- A manual goal records each update as a point ---
    T.add({ name: 'Mile time', metric: 'manual', target: 7, unit: 'min', start: 9 });
    const mile = W.MM.store.get().trackedGoals.find((g) => g.name === 'Mile time');
    check('it starts with just the starting point', T.series(mile).length, 1);
    check('and that point is where they began', T.series(mile)[0].value, 9);

    // The graph wants one point per day, so updating twice today replaces
    // rather than stacking up.
    T.recordProgress(mile.id, { current: 8.5 });
    await sleep(40);
    check('updating today does not add a second point for today',
          T.series(T.find(mile.id)).length, 1);
    check('it just moves today to the new value',
          T.series(T.find(mile.id))[0].value, 8.5);

    T.recordProgress(mile.id, { current: 8.2 });
    await sleep(40);
    check('and again keeps one point', T.series(T.find(mile.id)).length, 1);
    check('with the newest value', T.series(T.find(mile.id))[0].value, 8.2);

    // Updates on different days each get their own point.
    W.MM.store.update((dd) => {
      const g = dd.trackedGoals.find((x) => x.id === mile.id);
      g.history.unshift({ date: daysAgo(6), value: 9.4 });
      g.history.splice(1, 0, { date: daysAgo(3), value: 9 });
    });
    await sleep(40);
    const series = T.series(T.find(mile.id));
    check('three days means three points', series.length, 3);
    check('oldest first', series.map((p) => p.value), [9.4, 9, 8.2]);

    // --- The graph itself ---
    const svg = W.MM.chart.line(T.series(T.find(mile.id)), { target: 7, unit: 'min' });
    ok('an svg is produced', /^<svg/.test(svg));
    ok('it draws a line', svg.includes('class="chart-line"'));
    ok('it shades underneath', svg.includes('class="chart-area"'));
    ok('it marks the target', svg.includes('class="chart-target"'));
    ok('it dots each point', (svg.match(/class="chart-dot/g) || []).length >= 2);
    ok('it is labelled for screen readers', /aria-label="Progress graph/.test(svg));
    ok('it names the dates on the axis', svg.includes('class="chart-axis"'));

    // One point is not a line.
    ok('a single point says so instead of drawing nonsense',
       W.MM.chart.line([{ date: TODAY, value: 1 }], {}).includes('Not enough yet'));
    ok('no points at all is handled', !!W.MM.chart.line([], {}));

    // A flat line must not divide by zero.
    const flat = W.MM.chart.line(
      [{ date: daysAgo(2), value: 5 }, { date: TODAY, value: 5 }], { target: 5 });
    ok('a flat line still draws', /^<svg/.test(flat));
    ok('with no NaN in the path', !/NaN/.test(flat));

    // --- Graphs live on each goal's own page, not in the list ---
    q('.nav-btn[data-view="goals"]').click();
    await sleep(60);
    check('the list shows goals as links',
          W.document.querySelectorAll('#goals-content [data-open-goal]').length,
          W.MM.store.get().trackedGoals.length);
    ok('no graphs crowding the list', !q('#goals-content .chart'));

    // Home stays uncluttered — bars only, no graphs.
    q('.nav-btn[data-view="home"]').click();
    await sleep(60);
    ok('home keeps just the bars', !q('#home-goals .chart'));
    ok('but still shows the bars', !!q('#home-goals .goal-item'));
    d.window.close();
  }

  // =========================================================================
  group("each goal's own page");
  {
    const d = await boot(signedIn(craft({
      profile: { goals: ['muscle', 'lose_weight'], goal: 'muscle', experience: 'some',
                 daysPerWeek: 4, equipment: 'gym', sport: '' },
      activities: [0, 1, 3, 8].map((n, i) => ({
        id: 'p' + i, date: daysAgo(n), type: 'Lifting', minutes: 40,
        source: 'manual', notes: '' })),
    })));
    const W = d.window;
    const q = (s) => W.document.querySelector(s);
    W.MM.store.update((dd) => { dd.plan = W.MM.planBuilder.build(dd.profile, dd.mode); });
    await sleep(80);

    // --- Open a category goal from the list ---
    q('.nav-btn[data-view="goals"]').click();
    await sleep(40);
    const firstGoal = q('#goals-content [data-open-goal]');
    const goalId = firstGoal.dataset.openGoal;
    firstGoal.click();
    await sleep(60);

    check('still on the My Goals tab', q('.view.is-active').id, 'view-goals');
    const page = () => q('#goals-content').textContent;
    check('the heading becomes the goal name',
          q('#goals-heading').textContent, W.MM.goalTracker.find(goalId).name);
    ok('there is a way back', !!q('#goal-back'));

    // The three things asked for: progress, the graph, relevant info.
    ok('the progress bar is here', !!q('#goals-content .progress-track'));
    ok('the big figure is here', !!q('.goal-big-figure'));
    ok('the graph is here', !!q('#goals-content .chart'));
    ok('it says what the graph shows', page().includes('Progress over time'));
    ok('the plan for this goal is here', page().includes('Your plan for this'));
    ok('with real day cards', !!q('#goals-content .day-card'));
    ok('eating for this goal is here', page().includes('Eating for this goal'));
    ok('and the safety note travels with the food advice',
       page().includes('parent, coach'));

    // Only the days that actually serve this goal.
    const category = W.MM.getGoal(W.MM.goalTracker.find(goalId).category);
    const shownTypes = [...W.document.querySelectorAll('#goals-content .day-card')]
      .map((el) => el.querySelector('.day-title').textContent);
    ok('the days shown belong to this goal',
       shownTypes.every((title) =>
         category.rotation.some((t) => W.MM.DAY_TYPES[t].title === title)));

    // --- Back to the list ---
    q('#goal-back').click();
    await sleep(60);
    ok('back shows the list again', !!q('#goals-content [data-open-goal]'));
    ok('and the heading resets', q('#goals-heading').textContent === W.MM.copy('goalsPageTitle'));

    // --- A goal you wrote yourself gets a different page ---
    W.MM.goalTracker.add({ name: 'Bench press', metric: 'manual', target: 185,
                           unit: 'lbs', start: 155 });
    await sleep(60);
    const custom = W.MM.store.get().trackedGoals.find((g) => g.name === 'Bench press');
    W.MM.goalTracker.recordProgress(custom.id, { current: 165 });
    // Backdate a couple of points so there is a real history to list — one
    // update on one day is not a history.
    W.MM.store.update((dd) => {
      const g = dd.trackedGoals.find((x) => x.id === custom.id);
      g.history.unshift({ date: daysAgo(10), value: 155 });
      g.history.splice(1, 0, { date: daysAgo(4), value: 160 });
    });
    await sleep(60);

    W.MM.myGoalsView.openGoal(custom.id);
    await sleep(60);
    ok('it has an update button', !!q('#goals-content [data-update-goal]'));
    ok('it lists every update', page().includes('Every update'));
    check('one history row per point',
          W.document.querySelectorAll('.history-row').length,
          W.MM.goalTracker.series(custom).length);
    ok('it shows the change between updates', !!q('.history-change'));
    ok('no automatic plan is claimed for it',
       page().includes('goal you wrote yourself'));
    ok('it points at Quick Workout instead', !!q('#goal-to-quick'));

    // --- Tapping a goal on Home jumps to its page ---
    q('.nav-btn[data-view="home"]').click();
    await sleep(40);
    q('#home-goals .goal-item').click();
    await sleep(60);
    check('home takes you to the goal page', q('.view.is-active').id, 'view-goals');
    ok('showing one goal, not the list', !!q('#goal-back'));

    // But the Update button on Home must still just update.
    q('.nav-btn[data-view="goals"]').click();   // resets to the list
    await sleep(40);
    ok('the tab resets to the list', !q('#goal-back'));

    // --- A deleted goal must not leave you on a blank page ---
    W.MM.myGoalsView.openGoal(custom.id);
    await sleep(40);
    W.MM.goalTracker.remove(custom.id);
    await sleep(60);
    ok('deleting the open goal falls back to the list',
       !q('#goal-back') && !!q('#goals-content [data-open-goal]'));
    d.window.close();
  }

  // =========================================================================
  group('workouts are editable');
  {
    const d = await boot(signedIn(craft({
      profile: { goals: ['muscle'], goal: 'muscle', experience: 'some',
                 daysPerWeek: 7, equipment: 'gym', sport: '' },
    })));
    const W = d.window;
    const q = (s) => W.document.querySelector(s);
    const qq = (s) => [...W.document.querySelectorAll(s)];
    W.MM.store.update((dd) => { dd.plan = W.MM.planBuilder.build(dd.profile, dd.mode, dd.customDays); });
    await sleep(80);

    q('.nav-btn[data-view="goals"]').click();
    await sleep(40);

    // --- Option 1: leave the generated workout alone ---
    check('every day offers an edit', qq('#goals-content [data-edit-day]').length, 7);
    check('nothing is custom to begin with',
          Object.keys(W.MM.store.get().customDays).length, 0);

    // --- Option 2: edit the generated template ---
    const mondayBefore = JSON.parse(JSON.stringify(W.MM.store.get().plan.days[0]));
    q('[data-edit-day="0"]').click();
    await sleep(60);
    ok('the editor opens', W.MM.workoutEditor.isOpen());
    check('it names the day', q('#editor-title').textContent, 'Monday');
    check('it lists the exercises',
          qq('#editor-body .editor-row').length, mondayBefore.blocks.length);

    // Rename it, change the sets, remove one, reorder.
    q('#editor-name').value = 'My Monday';
    q('#editor-name').dispatchEvent(new W.Event('input', { bubbles: true }));
    const setsBox = q('[data-field="sets"]');
    setsBox.value = '7';
    setsBox.dispatchEvent(new W.Event('input', { bubbles: true }));

    const secondName = qq('#editor-body .editor-name')[1].textContent;
    q('[data-move="up"][data-index="1"]').click();
    await sleep(40);
    check('moving an exercise up reorders it',
          q('#editor-body .editor-name').textContent, secondName);

    const countBefore = qq('#editor-body .editor-row').length;
    q('[data-remove="0"]').click();
    await sleep(40);
    check('removing one takes it out', qq('#editor-body .editor-row').length, countBefore - 1);

    // Add one from the picker.
    q('#editor-add').click();
    await sleep(40);
    ok('the exercise picker opens', !!q('.editor-picker'));
    check('a button per muscle group',
          qq('#editor-groups .muscle-card').length, W.MM.MUSCLE_GROUPS.length);
    q('[data-pick-group="core"]').click();
    await sleep(40);
    const choice = q('[data-add-exercise]:not([disabled])');
    const addedId = choice.dataset.addExercise;
    choice.click();
    await sleep(40);
    check('adding one puts it in the workout',
          qq('#editor-body .editor-row').length, countBefore);

    q('#editor-save').click();
    await sleep(80);

    ok('the editor closes on save', !W.MM.workoutEditor.isOpen());
    const monday = W.MM.store.get().plan.days[0];
    check('the new name stuck', monday.title, 'My Monday');
    check('it is marked as yours', monday.custom, true);
    check('the sets change stuck', monday.blocks[0].sets, 7);
    ok('the added exercise is in there',
       monday.blocks.some((b) => b.exerciseId === addedId));
    check('and it was saved outside the plan so it survives rebuilds',
          Object.keys(W.MM.store.get().customDays), ['0']);
    ok('the card shows it as yours',
       q('#goals-content .day-card').textContent.includes('yours'));

    // --- THE IMPORTANT BIT: edits must survive the plan being rebuilt ---
    q('#plan-shuffle').click();
    await sleep(80);
    check('shuffling exercises does not touch your day',
          W.MM.store.get().plan.days[0].title, 'My Monday');

    q('.mode-opt[data-mode="grind"]').click();
    await sleep(80);
    check('switching mode does not touch your day',
          W.MM.store.get().plan.days[0].title, 'My Monday');
    check('your sets survived the mode change',
          W.MM.store.get().plan.days[0].blocks[0].sets, 7);
    ok('but the other days did get re-tuned',
       W.MM.store.get().plan.days.some((day) => day.kind === 'workout' && !day.custom));

    q('.nav-btn[data-view="settings"]').click();
    q('#settings-goals [data-toggle-goal="speed"]').click();
    await sleep(80);
    check('changing goals does not touch your day',
          W.MM.store.get().plan.days[0].title, 'My Monday');

    // --- Option 3: build one from scratch on a rest day ---
    W.MM.store.update((dd) => {
      dd.profile.daysPerWeek = 3;
      dd.plan = W.MM.planBuilder.build(dd.profile, dd.mode, dd.customDays);
    });
    await sleep(80);
    q('.nav-btn[data-view="goals"]').click();
    await sleep(40);

    const restIndex = W.MM.store.get().plan.days
      .findIndex((day) => day.kind === 'rest');
    ok('there is a rest day to build on', restIndex > -1);
    ok('rest days offer to take a workout',
       !!q('[data-edit-day="' + restIndex + '"]'));

    q('[data-edit-day="' + restIndex + '"]').click();
    await sleep(40);
    ok('the editor offers to add a workout', !!q('#editor-make-workout'));
    q('#editor-make-workout').click();
    await sleep(40);
    ok('and opens the picker ready to go', !!q('.editor-picker'));

    // Saving an empty workout is refused.
    q('#editor-save').click();
    await sleep(40);
    ok('an empty workout is not saved', W.MM.workoutEditor.isOpen());

    q('[data-pick-group="legs"]').click();
    await sleep(40);
    q('[data-add-exercise]:not([disabled])').click();
    await sleep(40);
    q('#editor-name').value = 'Saturday session';
    q('#editor-name').dispatchEvent(new W.Event('input', { bubbles: true }));
    q('#editor-save').click();
    await sleep(80);

    const built = W.MM.store.get().plan.days[restIndex];
    check('the rest day became a workout', built.kind, 'workout');
    check('with the name given', built.title, 'Saturday session');
    check('and the exercise chosen', built.blocks.length, 1);

    // --- Going back to the generated version ---
    W.confirm = () => true;
    q('[data-edit-day="0"]').click();
    await sleep(40);
    ok('an edited day offers a reset', !!q('#editor-reset'));
    q('#editor-reset').click();
    await sleep(80);
    ok('resetting drops the custom day',
       Object.keys(W.MM.store.get().customDays).indexOf('0') === -1);
    ok('and the generated workout comes back',
       W.MM.store.get().plan.days[0].title !== 'My Monday');
    ok('the other custom day is untouched',
       W.MM.store.get().plan.days[restIndex].title === 'Saturday session');

    // --- Cancel really does change nothing ---
    const before = JSON.stringify(W.MM.store.get().plan.days[restIndex]);
    q('[data-edit-day="' + restIndex + '"]').click();
    await sleep(40);
    q('#editor-name').value = 'Should not be saved';
    q('[data-remove="0"]').click();
    await sleep(40);
    q('#editor-cancel').click();
    await sleep(60);
    check('cancelling leaves the day exactly as it was',
          JSON.stringify(W.MM.store.get().plan.days[restIndex]), before);

    // --- A custom day survives a reload ---
    const saved = {};
    for (let i = 0; i < W.localStorage.length; i++) {
      const k = W.localStorage.key(i);
      saved[k] = W.localStorage.getItem(k);
    }
    d.window.close();

    const d2 = await boot(saved);
    check('your workout is still there after a reload',
          d2.window.MM.store.get().plan.days[restIndex].title, 'Saturday session');
    d2.window.close();
  }

  // =========================================================================
  group('profile icons suit a movement site');
  {
    const d = await boot(signedIn(craft({})));
    const W = d.window;
    const avatars = W.MM.accounts.AVATARS;

    ok('there is a reasonable choice', avatars.length >= 12);
    check('no duplicates', new Set(avatars).size, avatars.length);
    check('the default is walking — the most inclusive movement there is',
          avatars[0], '🚶');

    // The old set read as "this is for athletes". None of these should return.
    const gymBro = ['💪', '🦾', '🥊', '🐺', '🦅', '🚀', '🏈', '🏀', '⚽', '🔥'];
    check('no gym-bro icons left', avatars.filter((a) => gymBro.includes(a)), []);

    // A good spread of ways to move, plus calmer options.
    const waysToMove = ['🚶', '🏃', '🚴', '🏊', '🧘', '🤸', '🥾', '🛹', '🐕'];
    ok('several different ways to move are offered',
       avatars.filter((a) => waysToMove.includes(a)).length >= 6);
    ok('and some calm non-exercise options too',
       avatars.filter((a) => ['🌱', '🌲', '🌊', '🏔️', '🌞', '🌙', '⭐'].includes(a)).length >= 4);

    // They have to actually render as choices on the profile page.
    // This test profile still carries the retired 💪, like a real user who
    // picked one of the old icons would — it should be kept as an option
    // and shown as selected, not silently dropped.
    W.document.querySelector('#header-avatar').click();
    check('the retired icon is kept as an extra option',
          W.document.querySelectorAll('#profile-avatars .avatar-opt').length, avatars.length + 1);
    check('and it is marked as the current one',
          W.document.querySelectorAll('#profile-avatars .avatar-opt[aria-pressed="true"]').length, 1);
    check('their icon is untouched in storage', W.MM.accounts.active().avatar, '💪');

    // Someone on a current icon just sees the normal list.
    W.MM.accounts.update(W.MM.accounts.activeId(), { avatar: '🚴' });
    W.MM.profileView.render();
    check('a current icon shows the plain list',
          W.document.querySelectorAll('#profile-avatars .avatar-opt').length, avatars.length);
    check('still exactly one selected',
          W.document.querySelectorAll('#profile-avatars .avatar-opt[aria-pressed="true"]').length, 1);
    d.window.close();
  }

  // =========================================================================
  group('stacked text actually stacks');
  {
    // These span pairs are built by joining strings with no whitespace
    // between them, so if they are left as inline spans the two lines run
    // straight together: "Build muscleGet bigger and stronger".
    // jsdom has no layout engine, so the CSS rule is checked directly.
    const d = await boot(signedIn(craft({})));
    const doc = d.window.document;

    const sheet = [...doc.styleSheets]
      .find((s) => (s.href || '').endsWith('components.css'));
    const declaredDisplay = (selector) => {
      const rule = [...sheet.cssRules].find((r) => r.selectorText === selector);
      return rule ? rule.style.display : '(no rule)';
    };

    [
      ['.option-label', '.option-blurb'],   // onboarding + settings cards
      ['.hub-title', '.hub-blurb'],         // the settings profile link
      ['.day-title', '.day-sub'],           // plan day cards
      ['.why-fact', '.why-because'],        // the movement fact banner
    ].forEach(function (pair) {
      check(pair[0] + " stacks", declaredDisplay(pair[0]), "block");
      check(pair[1] + " stacks", declaredDisplay(pair[1]), "block");
    });

    // And the markup really does put them back to back with no gap, which is
    // why the display rule matters.
    const onboardCard = doc.querySelector('#onboard-goals .option-card');
    if (onboardCard) {
      const label = onboardCard.querySelector('.option-label');
      ok('nothing separates the label and blurb in the HTML',
         label.nextSibling === onboardCard.querySelector('.option-blurb'));
    }

    /* ------------------------------------------------------------------
       A sweep of every screen for the same bug anywhere else.

       It walks the rendered page looking for two inline elements sitting
       next to each other with no whitespace between them in the HTML —
       which is exactly how "Build muscle" ended up glued to "Get bigger
       and stronger". A flex or grid parent is fine, because that forces
       its children onto their own lines.
       ------------------------------------------------------------------ */
    const rules = [];
    [...doc.styleSheets]
      .filter((s) => (s.href || '').startsWith('https://movemode.local/css/'))
      .forEach((sh) => [...sh.cssRules].forEach((r) => {
        if (r.selectorText && r.style && r.style.display) {
          r.selectorText.split(',').forEach((sel) =>
            rules.push({ sel: sel.trim(), display: r.style.display }));
        }
      }));

    const BLOCKISH = ['block', 'flex', 'grid', 'list-item', 'table'];
    const CONTAINER = ['flex', 'grid', 'inline-flex', 'inline-grid'];
    const NATURALLY_BLOCK = ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'UL', 'OL', 'LI',
                             'SECTION', 'HEADER', 'NAV', 'FORM', 'MAIN', 'ARTICLE'];

    function displayOf(el) {
      let found = null;
      rules.forEach((r) => { try { if (el.matches(r.sel)) found = r.display; } catch (e) {} });
      if (found) return found;
      if (el.tagName === 'BUTTON') return 'inline-block';
      return NATURALLY_BLOCK.includes(el.tagName) ? 'block' : 'inline';
    }

    const smashed = [];
    const nameOf = (el) => el.getAttribute('class') || el.tagName;

    function sweep(root, where) {
      if (!root) return;
      [...root.querySelectorAll('*')].forEach((parent) => {
        if (CONTAINER.includes(displayOf(parent))) return;
        // <option>s inside a <select> are drawn as a dropdown, not inline text.
        if (parent.tagName === 'SELECT') return;
        // Inside an <svg>, elements are placed by x/y coordinates rather than
        // flowing as text, so they cannot run into each other.
        if (parent.closest('svg')) return;

        const kids = [...parent.children];
        for (let i = 0; i < kids.length - 1; i++) {
          const a = kids[i], b = kids[i + 1];
          let between = '', n = a.nextSibling;
          while (n && n !== b) { between += n.textContent || ''; n = n.nextSibling; }
          if (/\s/.test(between)) continue;
          if (BLOCKISH.includes(displayOf(a)) || BLOCKISH.includes(displayOf(b))) continue;
          if (!a.textContent.trim() || !b.textContent.trim()) continue;
          smashed.push(where + ': .' + nameOf(a) + ' + .' + nameOf(b));
        }
      });
    }

    // Fill the app with real content so every screen has something to check.
    d.window.MM.store.update((dd) => {
      dd.profile.goals = ['muscle', 'lose_weight'];
      dd.plan = d.window.MM.planBuilder.build(dd.profile, dd.mode);
      dd.activities.push({ id: 'sw', date: TODAY, type: 'Walked the dog',
                           minutes: 30, source: 'manual', notes: 'felt good' });
      dd.meals.push({ id: 'sm', date: TODAY, slot: 'Lunch', name: 'Sandwich', notes: '' });
    });
    await sleep(80);

    for (const screen of ['home', 'goals', 'quick', 'log', 'settings', 'profile']) {
      d.window.MM.app.showView(screen);
      await sleep(40);
      sweep(doc.querySelector('#view-' + screen), screen);
    }

    d.window.MM.onboarding.open();
    await sleep(40);
    sweep(doc.querySelector('#onboarding'), 'onboarding');
    d.window.MM.onboarding.close();

    d.window.MM.logView.openActivityForm();
    await sleep(40);
    sweep(doc.querySelector('#entry-modal'), 'log form');

    check('no smashed-together text anywhere in the app',
          [...new Set(smashed)], []);
    d.window.close();
  }

  // =========================================================================
  group('structure and accessibility');
  {
    const d = await boot(signedIn(craft({})));
    const doc = d.window.document;

    check('five nav tabs', doc.querySelectorAll('.nav-btn').length, 5);
    check('six views (five tabs plus Profile)', doc.querySelectorAll('.view').length, 6);
    ok('viewport meta present',
       doc.querySelector('meta[name=viewport]').content.includes('width=device-width'));
    ok('modals are aria-modal',
       [...doc.querySelectorAll('.modal')].every((m) => m.getAttribute('aria-modal') === 'true'));
    ok('grid cells carry labels',
       [...doc.querySelectorAll('.heat-cell')].every((c) => !!c.getAttribute('aria-label')));

    // All four stylesheets parse.
    const sheets = [...doc.styleSheets]
      .filter((s) => (s.href || '').startsWith('https://movemode.local/css/'));
    check('four stylesheets parsed', sheets.length, 4);
    ok('all have rules', sheets.every((s) => s.cssRules.length > 0));
    d.window.close();
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((err) => {
  console.error('\nTEST HARNESS CRASHED:\n', err);
  process.exit(1);
});
