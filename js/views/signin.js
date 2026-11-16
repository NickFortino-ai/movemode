/* ============================================================================
   views/signin.js — THE SIGN-IN SCREEN
   ============================================================================
   A full-screen overlay shown before the app whenever nobody is signed in.
   It lists the profiles saved in this browser, asks for a PIN if one is set,
   and lets you make a new profile.

   Remember what this is and isn't (see js/accounts.js): profiles live in
   this browser only, and the PIN is a speed bump, not security. The note at
   the bottom of the screen says so to the user too — it would be worse to
   let someone believe their data is protected when it isn't.
   ========================================================================== */

MM.signinView = (function () {
  var ui = MM.ui;

  var pendingId = null;    // the profile whose PIN we're asking for

  function open() {
    render();
    ui.$('#signin').classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    ui.$('#signin').classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function isOpen() {
    return ui.$('#signin').classList.contains('is-open');
  }

  /* ==========================================================================
     RENDER
     ======================================================================== */
  function render() {
    var profiles = MM.accounts.all();

    ui.$('#signin-site-name').textContent = MM.SITE.name;
    ui.$('#signin-disclaimer').textContent =
      'Profiles are saved in this browser only — they will not show up on ' +
      'another device, and anyone using this one can get to them. A PIN keeps ' +
      'a sibling out of your log; it is not real security, so never use a ' +
      'password you use anywhere else.';

    // First run: no profiles yet, so go straight to making one.
    if (profiles.length === 0) {
      ui.$('#signin-title').textContent = 'Welcome to ' + MM.SITE.name;
      ui.$('#signin-help').textContent =
        'Make a profile so your streak, plan, and log have somewhere to live.';
      ui.$('#signin-profiles').innerHTML = '';
      ui.$('#signin-new').textContent = 'Create my profile';
      ui.$('#signin-pin').innerHTML = '';
      return;
    }

    ui.$('#signin-title').textContent = "Who's moving today?";
    ui.$('#signin-help').textContent = profiles.length === 1
      ? 'Tap your name to carry on.'
      : 'Tap whoever is about to train.';
    ui.$('#signin-new').textContent = '+ New profile';

    ui.$('#signin-profiles').innerHTML =
      '<div class="profile-list">' + profiles.map(profileCardHTML).join('') + '</div>';

    renderPinPrompt();
  }

  function profileCardHTML(profile) {
    var locked = !!profile.pin;

    return '' +
      '<button type="button" class="profile-card" data-signin="' + ui.esc(profile.id) + '">' +
        '<span class="profile-avatar" aria-hidden="true">' + ui.esc(profile.avatar) + '</span>' +
        '<span class="profile-name">' + ui.esc(profile.name) + '</span>' +
        (locked ? '<span class="profile-lock" aria-label="PIN required">🔒</span>' : '') +
      '</button>';
  }

  /* ---- The PIN box, shown once a locked profile is tapped ---------------- */
  function renderPinPrompt(errorMessage) {
    var host = ui.$('#signin-pin');

    if (!pendingId) {
      host.innerHTML = '';
      return;
    }

    var profile = MM.accounts.find(pendingId);
    if (!profile) { pendingId = null; host.innerHTML = ''; return; }

    host.innerHTML = '' +
      '<form class="card mt-2" id="pin-form">' +
        '<h3 class="card-title">' + ui.esc(profile.avatar) + ' ' +
          ui.esc(profile.name) + '</h3>' +
        '<div class="field">' +
          '<label for="pin-input">Enter your PIN</label>' +
          '<input type="password" id="pin-input" inputmode="numeric" ' +
            'autocomplete="off" maxlength="8" placeholder="••••" required>' +
          (errorMessage
            ? '<p class="field-hint" style="color:#d2543d">' + ui.esc(errorMessage) + '</p>'
            : '') +
        '</div>' +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-outline" id="pin-cancel">Back</button>' +
          '<button type="submit" class="btn btn-primary">Sign in</button>' +
        '</div>' +
      '</form>';

    var input = ui.$('#pin-input');
    if (input) input.focus();
  }

  /* ==========================================================================
     ACTIONS
     ======================================================================== */

  function attemptSignIn(profileId, pin) {
    if (MM.accounts.signIn(profileId, pin)) {
      pendingId = null;
      finishSignIn();
      return true;
    }
    renderPinPrompt('That PIN did not match. Try again.');
    return false;
  }

  // Shared by signing in and by creating a profile.
  function finishSignIn() {
    // Point the store at the newly-signed-in profile and redraw everything.
    MM.store.reloadFromStorage();
    close();
    MM.app.afterSignIn();
  }

  /* ---- Making a new profile ---------------------------------------------- */
  function openCreateForm() {
    ui.$('#entry-modal-title').textContent = 'New profile';

    ui.$('#entry-modal-body').innerHTML = '' +
      '<form id="new-profile-form">' +
        '<div class="field">' +
          '<label for="new-profile-name">Your name</label>' +
          '<input type="text" id="new-profile-name" maxlength="24" required ' +
            'placeholder="First name or nickname" autocomplete="off">' +
        '</div>' +

        '<div class="field">' +
          '<label>Pick an icon</label>' +
          '<div class="avatar-grid" id="new-profile-avatars"></div>' +
        '</div>' +

        '<div class="field">' +
          '<label for="new-profile-pin">PIN (optional)</label>' +
          '<input type="password" id="new-profile-pin" inputmode="numeric" ' +
            'maxlength="8" autocomplete="off" placeholder="4–8 digits">' +
          '<p class="field-hint">Only digits. This keeps someone else on this ' +
            'device out of your log — it is not real security, so do not use a ' +
            'password you use anywhere else. You can leave it blank.</p>' +
        '</div>' +

        '<button type="submit" class="btn btn-primary btn-big btn-block">' +
          'Create profile' +
        '</button>' +
      '</form>';

    renderAvatarPicker(ui.$('#new-profile-avatars'), MM.accounts.AVATARS[0]);
    ui.openModal('entry-modal');

    ui.$('#new-profile-form').addEventListener('submit', function (event) {
      event.preventDefault();

      var name = ui.$('#new-profile-name').value.trim();
      if (!name) return;

      var pin = ui.$('#new-profile-pin').value.trim();
      if (pin && !MM.accounts.isValidPin(pin)) {
        ui.toast('A PIN has to be 4 to 8 digits.');
        return;
      }

      var avatarBtn = ui.$('#new-profile-avatars .avatar-opt[aria-pressed="true"]');
      var avatar = avatarBtn ? avatarBtn.dataset.avatar : MM.accounts.AVATARS[0];

      var profile = MM.accounts.create(name, avatar, pin || null);
      MM.accounts.signIn(profile.id, pin || null);

      ui.closeModal('entry-modal');
      finishSignIn();
      ui.toast('Welcome, ' + profile.name + '.');
    });
  }

  /* A row of emoji to pick from. Shared with the Profile page. */
  function renderAvatarPicker(container, selected) {
    if (!container) return;

    var choices = MM.accounts.AVATARS;

    // If someone is using an icon that is no longer on the list — the set of
    // icons changed at one point — keep theirs as an option rather than
    // showing them a picker with nothing selected.
    if (selected && choices.indexOf(selected) === -1) {
      choices = [selected].concat(choices);
    }

    container.innerHTML = choices.map(function (emoji) {
      return '<button type="button" class="avatar-opt" data-avatar="' + ui.esc(emoji) + '"' +
        ' aria-pressed="' + (emoji === selected ? 'true' : 'false') + '">' +
        ui.esc(emoji) + '</button>';
    }).join('');

    container.addEventListener('click', function (event) {
      var btn = event.target.closest('.avatar-opt');
      if (!btn) return;
      ui.$$('.avatar-opt', container).forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
    });
  }

  /* ==========================================================================
     INIT
     ======================================================================== */
  function init() {
    ui.$('#signin-profiles').addEventListener('click', function (event) {
      var card = event.target.closest('[data-signin]');
      if (!card) return;

      var id = card.dataset.signin;

      // No PIN? Straight in. Otherwise ask for it.
      if (!MM.accounts.hasPin(id)) {
        attemptSignIn(id, null);
      } else {
        pendingId = id;
        renderPinPrompt();
      }
    });

    ui.$('#signin-pin').addEventListener('click', function (event) {
      if (event.target.closest('#pin-cancel')) {
        pendingId = null;
        renderPinPrompt();
      }
    });

    ui.$('#signin-pin').addEventListener('submit', function (event) {
      if (!event.target.closest('#pin-form')) return;
      event.preventDefault();
      attemptSignIn(pendingId, ui.$('#pin-input').value.trim());
    });

    ui.$('#signin-new').addEventListener('click', openCreateForm);
  }

  return {
    init: init,
    open: open,
    close: close,
    isOpen: isOpen,
    render: render,
    renderAvatarPicker: renderAvatarPicker,
  };
})();
