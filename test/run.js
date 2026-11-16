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
