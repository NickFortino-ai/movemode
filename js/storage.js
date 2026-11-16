/* ============================================================================
   storage.js — SAVING AND LOADING EVERYTHING
   ============================================================================
   Each profile's data lives in its own localStorage entry, named after the
   profile id (see js/accounts.js). There is no server — everything stays in
   this browser.

   Everything the app knows about the user is in a single object:

   {
     version:   number,        // matches MM.SITE.dataVersion
     mode:      'chill'|'grind',
     onboarded: boolean,       // have they finished the questions?
     profile: {               // answers from onboarding
       goals: ['muscle', ...], // one OR MORE goal categories; the first one
                               // is the "primary" and drives nutrition
       goal,                   // kept in sync with goals[0] for convenience
       experience, daysPerWeek, equipment, sport
     },
     trackedGoals: [          // goals with progress bars on the home screen
       { id, name, category, metric, target, unit, start, current, createdAt }
     ],
     plan: { ... },            // generated weekly plan (see plan-builder.js)
     customDays: {             // days the user edited or built themselves,
       '0': { ...day... }      // keyed by weekday (0 = Monday). Kept OUTSIDE
     },                        // the plan so regenerating never wipes them.
     activities: [             // every logged workout / movement
       { id, date:'2026-03-14', type, minutes, source, notes }
     ],
     meals: [                  // every logged meal
       { id, date, slot, name, notes }
     ],
     restDays: ['2026-03-14'], // days marked as a planned rest day
     planCompletions: {        // which plan day was checked off on which date
       '2026-03-14': 'day-3'
     },
     streak: {
       best: number,           // best streak ever, never goes down
       lastSeen: number,       // streak the last time the app loaded
       celebrated: [3, 7],     // milestones already celebrated this run
       restartNotice: number|null  // streak length that was just lost
     }
   }
   ========================================================================== */

MM.store = (function () {
  var listeners = [];
  var data = null;

  // Each profile has its own slot in localStorage, so switching profiles
  // swaps the whole save file. js/accounts.js decides which one is active.
  function currentKey() {
    return MM.accounts.activeDataKey();
  }

  // A brand-new, empty save file.
  function blank() {
    return {
      version: MM.SITE.dataVersion,
      mode: MM.SITE.defaultMode,
      onboarded: false,
      profile: {
        goals: ['general'],
        goal: 'general',        // mirrors goals[0]
        experience: 'never',
        daysPerWeek: 3,
        equipment: 'none',
        sport: '',
      },
      trackedGoals: [],
      plan: null,
      customDays: {},
      activities: [],
      meals: [],
      restDays: [],
      planCompletions: {},
      streak: {
        best: 0,
        lastSeen: 0,
        celebrated: [],
        restartNotice: null,
      },
    };
  }

  // Make sure a loaded object has every field we expect. This keeps the app
  // from crashing if you add a new field later and someone has old data.
  function fillInMissing(loaded) {
    var base = blank();

    Object.keys(base).forEach(function (field) {
      if (loaded[field] === undefined || loaded[field] === null) {
        // `plan` is allowed to legitimately be null, so don't overwrite it
        // with the blank value in a way that loses meaning.
        loaded[field] = base[field];
      }
    });

    // --- Upgrade a save from when there was only ONE goal -----------------
    // Older saves had profile.goal (a string) and no profile.goals (a list).
    // Rather than wipe someone's data, turn their single goal into a list
    // of one. Copy this pattern if you ever change the saved shape again.
    //
    // IMPORTANT: this has to run BEFORE the per-field fill below. That loop
    // would see goals missing, drop in the default ['general'], and the old
    // goal would be silently lost.
    if (!Array.isArray(loaded.profile.goals) || loaded.profile.goals.length === 0) {
      loaded.profile.goals = [loaded.profile.goal || base.profile.goal];
    }

    // Nested objects need the same treatment one level down.
    Object.keys(base.profile).forEach(function (field) {
      if (loaded.profile[field] === undefined) {
        loaded.profile[field] = base.profile[field];
      }
    });
    Object.keys(base.streak).forEach(function (field) {
      if (loaded.streak[field] === undefined) {
        loaded.streak[field] = base.streak[field];
      }
    });

    // Keep the convenience mirror in step with the real list.
    loaded.profile.goal = loaded.profile.goals[0];

    return loaded;
  }

  /* Normalize the goal list: no blanks, no duplicates, at least one entry,
     and profile.goal always mirroring the first one. Called on every save. */
  function tidyGoals(d) {
    var seen = {};
    var clean = (d.profile.goals || []).filter(function (id) {
      if (!id || seen[id] || !MM.GOALS.some(function (g) { return g.id === id; })) return false;
      seen[id] = true;
      return true;
    });

    if (clean.length === 0) clean = ['general'];

    d.profile.goals = clean;
    d.profile.goal = clean[0];
  }

  // Read from localStorage. Called once on startup.
  function load() {
    var raw;
    try {
      raw = window.localStorage.getItem(currentKey());
    } catch (err) {
      // Private browsing or storage disabled — run in memory for this session.
      console.warn(MM.SITE.name + ': localStorage is unavailable, data will not be saved.', err);
      data = blank();
      return data;
    }

    if (!raw) {
      data = blank();
      return data;
    }

    try {
      var parsed = JSON.parse(raw);
      // If the save format changed, start fresh rather than crash.
      if (parsed.version !== MM.SITE.dataVersion) {
        console.warn(MM.SITE.name + ': saved data is from an older version, starting fresh.');
        data = blank();
      } else {
        data = fillInMissing(parsed);
      }
    } catch (err) {
      console.warn(MM.SITE.name + ': saved data was corrupted, starting fresh.', err);
      data = blank();
    }
    return data;
  }

  // Write to localStorage and tell the app to re-render.
  function save() {
    // Tidy the goal list and make sure every chosen category has a matching
    // progress-bar goal before anything is written or drawn.
    tidyGoals(data);
    if (MM.goalTracker) MM.goalTracker.syncWithCategories(data);

    try {
      window.localStorage.setItem(currentKey(), JSON.stringify(data));
    } catch (err) {
      console.warn(MM.SITE.name + ': could not save data.', err);
    }
    listeners.forEach(function (fn) { fn(data); });
  }

  // The current data object. Read freely; call save() after changing it.
  function get() {
    if (!data) load();
    return data;
  }

  // Change data and save in one step:
  //   MM.store.update(function (d) { d.mode = 'grind'; });
  function update(changer) {
    changer(get());
    save();
  }

  // Register a function to run every time data is saved.
  function onChange(fn) {
    listeners.push(fn);
  }

  /* ---- Convenience helpers used all over the app ----------------------- */

  // Unique-enough id for list items.
  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // Log an activity. source is 'manual', 'plan', or 'quick'.
  // Logging activity also clears the "your streak broke" notice.
  function addActivity(entry) {
    update(function (d) {
      d.activities.push({
        id: newId(),
        date: entry.date || MM.dates.today(),
        type: entry.type || 'Other',
        minutes: Number(entry.minutes) || 0,
        source: entry.source || 'manual',
        notes: entry.notes || '',
      });
      d.streak.restartNotice = null;
    });
  }

  function addMeal(entry) {
    update(function (d) {
      d.meals.push({
        id: newId(),
        date: entry.date || MM.dates.today(),
        slot: entry.slot || 'Snack',
        name: entry.name || '',
        notes: entry.notes || '',
      });
    });
  }

  function removeActivity(id) {
    update(function (d) {
      d.activities = d.activities.filter(function (a) { return a.id !== id; });
      // If that was a plan check-off, un-check the matching day too.
      Object.keys(d.planCompletions).forEach(function (date) {
        var stillThere = d.activities.some(function (a) {
          return a.date === date && a.source === 'plan';
        });
        if (!stillThere) delete d.planCompletions[date];
      });
    });
  }

  function removeMeal(id) {
    update(function (d) {
      d.meals = d.meals.filter(function (m) { return m.id !== id; });
    });
  }

  // All activities logged on a given day.
  function activitiesOn(dayKey) {
    return get().activities.filter(function (a) { return a.date === dayKey; });
  }

  function mealsOn(dayKey) {
    return get().meals.filter(function (m) { return m.date === dayKey; });
  }

  // Did they log anything at all on this day?
  function isActiveDay(dayKey) {
    return activitiesOn(dayKey).length > 0;
  }

  // Is this day marked as a planned rest day?
  function isRestDay(dayKey) {
    return get().restDays.indexOf(dayKey) !== -1;
  }

  // Mark / unmark a planned rest day.
  function setRestDay(dayKey, on) {
    update(function (d) {
      var i = d.restDays.indexOf(dayKey);
      if (on && i === -1) d.restDays.push(dayKey);
      if (!on && i !== -1) d.restDays.splice(i, 1);
      if (on) d.streak.restartNotice = null;
    });
  }

  // Wipe everything and start over.
  function resetAll() {
    data = blank();
    save();
  }

  // Called after switching profiles. Dropping the in-memory copy means the
  // next get() reads the newly-signed-in profile's slot instead of still
  // showing the last person's streak.
  function reloadFromStorage() {
    data = null;
    return get();
  }

  return {
    get: get,
    save: save,
    update: update,
    onChange: onChange,
    newId: newId,
    addActivity: addActivity,
    addMeal: addMeal,
    removeActivity: removeActivity,
    removeMeal: removeMeal,
    activitiesOn: activitiesOn,
    mealsOn: mealsOn,
    isActiveDay: isActiveDay,
    isRestDay: isRestDay,
    setRestDay: setRestDay,
    resetAll: resetAll,
    reloadFromStorage: reloadFromStorage,
    // A function, not a string — the key changes when the profile does.
    storageKey: currentKey,
  };
})();
