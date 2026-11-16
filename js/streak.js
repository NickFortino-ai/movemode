/* ============================================================================
   streak.js — STREAK LOGIC
   ============================================================================
   The rules, in plain English:

   1. A day "counts" if the user logged any activity on it. That can come from
      the "I moved today" button, from checking off a plan workout, or from
      finishing a quick workout.

   2. The streak is the number of counting days in an unbroken chain ending
      today (or ending yesterday if today is still empty — today is not a
      miss until the day is over).

   3. A PLANNED REST DAY does not break the chain. You get
      MM.SITE.restDaysPerWeek of them per calendar week (Monday–Sunday).
      A rest day keeps the chain alive but does not add to the number,
      because the streak counts days you moved.

   4. If a day is neither active nor an allowed rest day, the chain stops
      there.

   5. The best streak ever is remembered forever, even after a reset.

   WORKED EXAMPLE
   --------------
   Mon: walked      -> counts
   Tue: lifted      -> counts
   Wed: rest day    -> bridges (uses this week's one rest day)
   Thu: ran         -> counts
   Fri: nothing     -> chain stops here
   Streak as of Thursday = 3 (Mon, Tue, Thu). On Friday evening the streak
   still reads 3 because today isn't over. On Saturday it reads 0 and the
   restart message appears.
   ========================================================================== */

MM.streak = (function () {

  // Guards against refresh() -> save() -> onChange -> refresh() looping.
  var syncing = false;

  /* --------------------------------------------------------------------------
     How many rest days have been "spent" in the calendar week containing
     dayKey, looking only at the days we've already walked through.
     -------------------------------------------------------------------------- */
  function restsSpentInWeek(spentDates, dayKey) {
    var week = MM.dates.weekStart(dayKey);
    return spentDates.filter(function (d) {
      return MM.dates.weekStart(d) === week;
    }).length;
  }

  /* --------------------------------------------------------------------------
     Walk backwards from today and measure the chain.
     Returns { length, startDate, restDaysUsed, endDate }
     -------------------------------------------------------------------------- */
  function compute(todayKey) {
    var today = todayKey || MM.dates.today();
    var cursor;

    // Where does the chain end? Today if something happened today;
    // otherwise yesterday, because today still has time left in it.
    if (MM.store.isActiveDay(today) || MM.store.isRestDay(today)) {
      cursor = today;
    } else {
      cursor = MM.dates.prevDay(today);
    }

    var length = 0;
    var restSpent = [];
    var lastCountedDay = null;
    var endDate = cursor;

    // Safety stop so a weird data state can never spin forever.
    var maxDaysToCheck = 2000;

    while (maxDaysToCheck-- > 0) {
      if (MM.store.isActiveDay(cursor)) {
        length++;
        lastCountedDay = cursor;
      } else if (
        MM.store.isRestDay(cursor) &&
        restsSpentInWeek(restSpent, cursor) < MM.SITE.restDaysPerWeek
      ) {
        // Rest day bridges the gap but doesn't add to the count.
        restSpent.push(cursor);
      } else {
        break; // chain is broken here
      }
      cursor = MM.dates.prevDay(cursor);
    }

    return {
      length: length,
      startDate: lastCountedDay,
      endDate: endDate,
      restDaysUsed: restSpent,
    };
  }

  /* --------------------------------------------------------------------------
     Recompute the streak and update the saved record: best streak,
     milestone celebrations, and the "your streak broke" notice.

     Returns the info the home screen needs:
       { length, best, celebrate: milestoneNumber|null, restartNotice }
     -------------------------------------------------------------------------- */
  function refresh() {
    var d = MM.store.get();
    var result = compute();
    var length = result.length;

    var celebrate = null;
    var changed = false;

    // --- Best streak ever -------------------------------------------------
    if (length > d.streak.best) {
      d.streak.best = length;
      changed = true;
    }

    // --- Did a streak just break? ----------------------------------------
    // Only worth saying something if they actually had a few days going.
    if (length === 0 && d.streak.lastSeen >= 2 && d.streak.restartNotice === null) {
      d.streak.restartNotice = d.streak.lastSeen;
      changed = true;
    }

    // Starting over means milestones are up for grabs again.
    if (length === 0 && d.streak.celebrated.length > 0) {
      d.streak.celebrated = [];
      changed = true;
    }

    // --- Milestones -------------------------------------------------------
    // Celebrate the biggest milestone they've reached but not yet seen.
    MM.SITE.milestones.forEach(function (m) {
      if (length >= m && d.streak.celebrated.indexOf(m) === -1) {
        celebrate = m;                 // keep overwriting -> ends up largest
        d.streak.celebrated.push(m);
        changed = true;
      }
    });

    // --- Remember where we were for next time -----------------------------
    if (d.streak.lastSeen !== length) {
      d.streak.lastSeen = length;
      changed = true;
    }

    if (changed && !syncing) {
      syncing = true;
      MM.store.save();
      syncing = false;
    }

    return {
      length: length,
      best: d.streak.best,
      startDate: result.startDate,
      restDaysUsed: result.restDaysUsed,
      celebrate: celebrate,
      restartNotice: d.streak.restartNotice,
    };
  }

  /* --------------------------------------------------------------------------
     Rest day accounting for the UI.
     -------------------------------------------------------------------------- */

  // How many rest days are already marked in the calendar week containing
  // dayKey (whether or not the streak walk needed them).
  function restDaysUsedThisWeek(dayKey) {
    var day = dayKey || MM.dates.today();
    var week = MM.dates.weekStart(day);
    return MM.store.get().restDays.filter(function (r) {
      return MM.dates.weekStart(r) === week;
    }).length;
  }

  // Can today still be marked as a rest day without burning the streak?
  function canRestToday() {
    var today = MM.dates.today();
    if (MM.store.isRestDay(today)) return true;  // already marked, can unmark
    return restDaysUsedThisWeek(today) < MM.SITE.restDaysPerWeek;
  }

  /* --------------------------------------------------------------------------
     Data for the 30-day heatmap.
     level 0 = nothing, 1 = a little, 2 = solid, 3 = big day
     -------------------------------------------------------------------------- */
  function heatmap(days) {
    var count = days || 30;
    return MM.dates.lastNDays(count).map(function (key) {
      var acts = MM.store.activitiesOn(key);
      var minutes = acts.reduce(function (sum, a) { return sum + (a.minutes || 0); }, 0);

      var level = 0;
      if (acts.length > 0) {
        if (minutes >= 46) level = 3;
        else if (minutes >= 21) level = 2;
        else level = 1;
      }

      return {
        date: key,
        active: acts.length > 0,
        rest: MM.store.isRestDay(key),
        minutes: minutes,
        count: acts.length,
        level: level,
        isToday: key === MM.dates.today(),
      };
    });
  }

  // Total minutes logged across the last n days. Used for the small stats row.
  function minutesInLast(days) {
    var window = MM.dates.lastNDays(days);
    return MM.store.get().activities.reduce(function (sum, a) {
      return window.indexOf(a.date) !== -1 ? sum + (a.minutes || 0) : sum;
    }, 0);
  }

  // How many of the last n days had activity.
  function activeDaysInLast(days) {
    return MM.dates.lastNDays(days).filter(function (key) {
      return MM.store.isActiveDay(key);
    }).length;
  }

  return {
    compute: compute,
    refresh: refresh,
    heatmap: heatmap,
    canRestToday: canRestToday,
    restDaysUsedThisWeek: restDaysUsedThisWeek,
    minutesInLast: minutesInLast,
    activeDaysInLast: activeDaysInLast,
  };
})();
