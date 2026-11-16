/* ============================================================================
   accounts.js — PROFILES AND SIGNING IN
   ============================================================================
   Lets more than one person use the same device — a sibling, a teammate, a
   shared family laptop. Each profile gets its own streak, plan, goals, and
   log, kept completely separate.

   ⚠️  READ THIS BEFORE YOU TRUST IT  ⚠️
   This is NOT a real login. There is no server, so:
     - Profiles live in this browser only. They do not follow you to your
       phone, and a friend signing in on their own laptop sees nothing.
     - The optional PIN is a speed bump, not security. It stops a sibling
       poking at your log; it does not stop anyone who knows how to open
       developer tools. That's why it's a PIN and not a password — nobody
       should reuse a real password here.
   If this ever needs to be real, it needs a backend. See the README.

   HOW THE DATA IS LAID OUT
     movemode.v1.accounts        the list of profiles + who is signed in
     movemode.v1.<profileId>     one profile's data (streak, plan, log...)

   The second one is what js/storage.js reads and writes — it just asks this
   file which profile is active.
   ========================================================================== */

MM.accounts = (function () {
  var ACCOUNTS_KEY = MM.SITE.storageKey + '.accounts';

  /* The emoji someone can pick as their profile picture.

     These are picked to be easy to tell apart at a glance — that's the
     actual job of a profile icon when a few people share a device.

     They are deliberately NOT gym icons. An earlier version had flexing
     arms, a boxing glove, a wolf and a rocket, which quietly said "this is
     for athletes". This site is about movement for everybody, so the list
     leads with walking and includes plenty of ways to move plus some calm
     outdoor things. Nobody should scroll this list and feel like it isn't
     meant for them.

     The human figures are the gender-neutral versions with no skin tone
     set — keep it that way if you add more. */
  var AVATARS = [
    // Ways to move
    '🚶', '🏃', '🚴', '🏊', '🧘', '🤸', '🥾', '🛹', '🐕',
    // Outside
    '🌱', '🌲', '🌊', '🏔️', '🌞', '🌙', '⭐',
  ];

  var book = null;   // { version, profiles: [...], activeId }

  /* --------------------------------------------------------------------------
     A deliberately simple scramble of the PIN so it isn't sitting in
     localStorage in plain sight.

     THIS IS NOT ENCRYPTION AND NOT A SECURE HASH. It stops someone reading
     the PIN over your shoulder in developer tools. It does not stop anyone
     who actually wants in — they can simply delete the pin from storage.
     Real password handling has to happen on a server, with a real algorithm
     like bcrypt or Argon2. Never put that in frontend code.
     -------------------------------------------------------------------------- */
  function scramblePin(pin) {
    var text = String(pin) + '::' + MM.SITE.name;
    var hash = 2166136261;                      // FNV-1a starting value

    for (var i = 0; i < text.length; i++) {
      hash = hash ^ text.charCodeAt(i);
      // The multiply-and-wrap that gives FNV its spread.
      hash = (hash * 16777619) >>> 0;
    }
    return hash.toString(36);
  }

  /* ---- Reading and writing the profile list ----------------------------- */

  function blankBook() {
    return { version: MM.SITE.dataVersion, profiles: [], activeId: null };
  }

  function loadBook() {
    var raw;
    try {
      raw = window.localStorage.getItem(ACCOUNTS_KEY);
    } catch (err) {
      console.warn(MM.SITE.name + ': localStorage unavailable, profiles will not be saved.', err);
      book = blankBook();
      return book;
    }

    if (!raw) {
      book = blankBook();
      migrateSingleUserData();
      return book;
    }

    try {
      book = JSON.parse(raw);
      if (!Array.isArray(book.profiles)) book = blankBook();
    } catch (err) {
      console.warn(MM.SITE.name + ': the profile list was corrupted, starting fresh.', err);
      book = blankBook();
    }
    return book;
  }

  function saveBook() {
    try {
      window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(book));
    } catch (err) {
      console.warn(MM.SITE.name + ': could not save profiles.', err);
    }
  }

  /* --------------------------------------------------------------------------
     Upgrade from before profiles existed.

     Older versions stored everything under one key with no profiles at all.
     If we find that data, it becomes the first profile rather than being
     thrown away — nobody should lose a streak to a software update.
     -------------------------------------------------------------------------- */
  function migrateSingleUserData() {
    var oldData;
    try {
      oldData = window.localStorage.getItem(MM.SITE.storageKey);
    } catch (err) {
      return;
    }
    if (!oldData) return;

    var profile = buildProfile('You', AVATARS[0]);
    book.profiles.push(profile);
    book.activeId = profile.id;

    try {
      // Copy the old save into the new per-profile slot.
      window.localStorage.setItem(dataKeyFor(profile.id), oldData);
      // Leave the original key alone; it does no harm and is a safety net if
      // something goes wrong with the copy.
    } catch (err) {
      console.warn(MM.SITE.name + ': could not move the old data across.', err);
    }

    saveBook();
    console.info(MM.SITE.name + ': existing data was moved into a profile called "You".');
  }

  /* ---- Profile objects --------------------------------------------------- */

  function buildProfile(name, avatar) {
    return {
      id: 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: String(name || 'Me').trim().slice(0, 24) || 'Me',
      avatar: avatar || AVATARS[0],
      pin: null,                  // scrambled PIN, or null for no PIN
      createdAt: MM.dates.today(),
    };
  }

  // Where one profile's streak/plan/log lives.
  function dataKeyFor(profileId) {
    return MM.SITE.storageKey + '.' + profileId;
  }

  /* ---- The public bits --------------------------------------------------- */

  function all() {
    if (!book) loadBook();
    return book.profiles;
  }

  function activeId() {
    if (!book) loadBook();
    return book.activeId;
  }

  function active() {
    return find(activeId());
  }

  function find(id) {
    return all().find(function (p) { return p.id === id; });
  }

  // The storage key for whichever profile is signed in. js/storage.js calls
  // this every time it reads or writes.
  function activeDataKey() {
    var id = activeId();
    return id ? dataKeyFor(id) : MM.SITE.storageKey + '.guest';
  }

  function isSignedIn() {
    return !!active();
  }

  /* ---- Creating, editing, removing --------------------------------------- */

  function create(name, avatar, pin) {
    if (!book) loadBook();

    var profile = buildProfile(name, avatar);
    if (pin) profile.pin = scramblePin(pin);

    book.profiles.push(profile);
    saveBook();
    return profile;
  }

  function update(id, changes) {
    var profile = find(id);
    if (!profile) return null;

    if (changes.name !== undefined) {
      profile.name = String(changes.name).trim().slice(0, 24) || profile.name;
    }
    if (changes.avatar !== undefined) profile.avatar = changes.avatar;

    saveBook();
    return profile;
  }

  function remove(id) {
    if (!book) loadBook();

    book.profiles = book.profiles.filter(function (p) { return p.id !== id; });
    if (book.activeId === id) book.activeId = null;

    // Throw away that profile's data too — keeping it would be a privacy
    // problem, and there's no way back to it once the profile is gone.
    try {
      window.localStorage.removeItem(dataKeyFor(id));
    } catch (err) { /* nothing useful to do */ }

    saveBook();
  }

  /* ---- PINs --------------------------------------------------------------- */

  function hasPin(id) {
    var profile = find(id);
    return !!(profile && profile.pin);
  }

  // A PIN must be 4–8 digits. Letters are refused on purpose: this is not
  // secure storage, and a word-shaped box invites reusing a real password.
  function isValidPin(pin) {
    return /^\d{4,8}$/.test(String(pin));
  }

  function setPin(id, pin) {
    var profile = find(id);
    if (!profile) return false;
    if (pin && !isValidPin(pin)) return false;

    profile.pin = pin ? scramblePin(pin) : null;
    saveBook();
    return true;
  }

  function checkPin(id, pin) {
    var profile = find(id);
    if (!profile) return false;
    if (!profile.pin) return true;          // no PIN set, everyone's welcome
    return profile.pin === scramblePin(pin);
  }

  /* ---- Signing in and out ------------------------------------------------- */

  // Returns true when the profile is now signed in, false when the PIN was
  // wrong.
  function signIn(id, pin) {
    var profile = find(id);
    if (!profile) return false;
    if (profile.pin && !checkPin(id, pin)) return false;

    book.activeId = id;
    saveBook();
    return true;
  }

  function signOut() {
    if (!book) loadBook();
    book.activeId = null;
    saveBook();
  }

  return {
    AVATARS: AVATARS,
    all: all,
    find: find,
    active: active,
    activeId: activeId,
    activeDataKey: activeDataKey,
    isSignedIn: isSignedIn,
    create: create,
    update: update,
    remove: remove,
    hasPin: hasPin,
    isValidPin: isValidPin,
    setPin: setPin,
    checkPin: checkPin,
    signIn: signIn,
    signOut: signOut,
    load: loadBook,
  };
})();
