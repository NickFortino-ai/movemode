/* ============================================================================
   config.js — THE ONE PLACE TO CHANGE SITE-WIDE SETTINGS
   ============================================================================
   If you want to rename the site, change SITE.name below. That's it.
   The name is pulled from here everywhere: the header, the page title,
   the footer, the README-style text, and the localStorage key prefix.

   Everything in this file is safe to edit without touching other code.
   ========================================================================== */

// The global namespace for the whole app. Every other file hangs off of this
// so we never pollute the page with dozens of loose variables.
window.MM = window.MM || {};

MM.SITE = {
  // ---- RENAME THE SITE HERE ------------------------------------------------
  name: 'MoveMode',

  // Short line describing what the site is for.
  // (Each mode also has its own tagline in js/data/copy.js — this is the
  // neutral fallback.)
  //
  // Worth keeping the spirit of this if you reword it: this is not a fitness
  // site. It is about movement being one of the best things you can do for
  // your body AND your head, whoever you are.
  tagline: 'Move your body. It is good for your head too.',

  // Bumping this number wipes old saved data if you ever change the shape of
  // the saved object in a way that old data can't handle. Leave it alone
  // unless you know you need to.
  dataVersion: 1,

  // Which mode a brand-new visitor starts in: 'chill' or 'grind'.
  defaultMode: 'chill',

  // How many "planned rest days" a person gets per 7-day window without
  // breaking their streak. Rest is part of training.
  restDaysPerWeek: 1,

  // Streak lengths that trigger a celebration popup.
  milestones: [3, 7, 14, 30, 100],
};

// The localStorage key is built from the site name so renaming the site also
// gives it a fresh, clearly-named storage slot.
MM.SITE.storageKey = MM.SITE.name.toLowerCase().replace(/[^a-z0-9]/g, '') +
  '.v' + MM.SITE.dataVersion;
