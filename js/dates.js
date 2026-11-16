/* ============================================================================
   dates.js — DATE HELPERS
   ============================================================================
   Dates are the easiest place to introduce bugs in a streak app, so all the
   date work lives here in one place.

   THE KEY IDEA: every day is stored as a "day key" string like "2026-03-14".
   Day keys are built from the user's LOCAL date (not UTC), because a streak
   should flip over at the user's midnight, not at midnight in London.
   Never build one with toISOString() — that converts to UTC and can land on
   the wrong day for anyone west of Greenwich.
   ========================================================================== */

MM.dates = (function () {

  // Pad a number to two digits: 3 -> "03"
  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  // Turn a Date object into a local day key: "2026-03-14"
  function keyOf(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  // Today's day key.
  function today() {
    return keyOf(new Date());
  }

  // Turn a day key back into a Date at local noon. Noon (instead of midnight)
  // keeps daylight-saving shifts from bumping us into the previous day.
  function parse(key) {
    var parts = key.split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
  }

  // Day key n days away from the given key. Negative n goes backward.
  function addDays(key, n) {
    var d = parse(key);
    d.setDate(d.getDate() + n);
    return keyOf(d);
  }

  function prevDay(key) { return addDays(key, -1); }
  function nextDay(key) { return addDays(key, 1); }

  // Whole days between two keys (b - a). Same day = 0, yesterday->today = 1.
  function daysBetween(a, b) {
    var msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((parse(b) - parse(a)) / msPerDay);
  }

  // 0 = Monday ... 6 = Sunday. Our plans are laid out Monday-first, but
  // JavaScript's getDay() is Sunday-first, so we shift it.
  function weekdayIndex(key) {
    var jsDay = parse(key).getDay();      // 0 = Sunday
    return (jsDay + 6) % 7;               // 0 = Monday
  }

  // The Monday of the week that contains this key.
  function weekStart(key) {
    return addDays(key, -weekdayIndex(key));
  }

  // An array of day keys, oldest first, ending with `endKey`.
  // lastNDays(30) gives the 30-day heatmap window including today.
  function lastNDays(n, endKey) {
    var end = endKey || today();
    var out = [];
    for (var i = n - 1; i >= 0; i--) {
      out.push(addDays(end, -i));
    }
    return out;
  }

  // "Mar 14" — short label for lists and the heatmap tooltip.
  function shortLabel(key) {
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var d = parse(key);
    return months[d.getMonth()] + ' ' + d.getDate();
  }

  // "Today", "Yesterday", or "Mar 14" — friendlier for the log view.
  function friendlyLabel(key) {
    var diff = daysBetween(key, today());
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return shortLabel(key);
  }

  // "Saturday" — full weekday name for a key.
  function weekdayName(key) {
    return MM.WEEKDAYS_LONG[weekdayIndex(key)];
  }

  return {
    keyOf: keyOf,
    today: today,
    parse: parse,
    addDays: addDays,
    prevDay: prevDay,
    nextDay: nextDay,
    daysBetween: daysBetween,
    weekdayIndex: weekdayIndex,
    weekStart: weekStart,
    lastNDays: lastNDays,
    shortLabel: shortLabel,
    friendlyLabel: friendlyLabel,
    weekdayName: weekdayName,
  };
})();
