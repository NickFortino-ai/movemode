/* ============================================================================
   views/profile.js — THE PROFILE PAGE
   ============================================================================
   Reached from the avatar in the header, or from Settings.

   Two halves:
     1. WHO YOU ARE   — display name, icon, PIN, sign out, switch profile,
                        delete profile.
     2. YOUR TRAINING — experience, days per week, equipment, sport. These
                        used to be changeable only by redoing the whole
                        onboarding flow; here each one can be edited on its
                        own, and the plan rebuilds when they change.
   ========================================================================== */

MM.profileView = (function () {
  var ui = MM.ui;

  function render() {
    var account = MM.accounts.active();
    var data = MM.store.get();

    ui.$('#profile-heading').textContent = MM.copy('profileTitle');
    ui.$('#profile-intro').textContent = MM.copy('profileIntro');

    if (!account) {
      ui.$('#profile-content').innerHTML =
        '<div class="empty-state">Nobody is signed in.</div>';
      return;
    }

    ui.$('#profile-content').innerHTML =
      identityHTML(account) +
      trainingHTML(data) +
      accountActionsHTML(account);
  }

  /* ---- Who you are -------------------------------------------------------- */
  function identityHTML(account) {
    var stats = MM.store.get();

    return '' +
      '<div class="card profile-header-card">' +
        '<span class="profile-avatar-big" aria-hidden="true">' +
          ui.esc(account.avatar) + '</span>' +
        '<div>' +
          '<h2 class="card-title" style="margin:0">' + ui.esc(account.name) + '</h2>' +
          '<p class="small faint" style="margin:0">' +
            'Profile made ' + ui.esc(MM.dates.shortLabel(account.createdAt)) +
            ' · ' + stats.activities.length + ' workouts logged' +
            (account.pin ? ' · PIN on 🔒' : '') +
          '</p>' +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<h3 class="card-title">Name and icon</h3>' +
        '<div class="field">' +
          '<label for="profile-name">Display name</label>' +
          '<input type="text" id="profile-name" maxlength="24" ' +
            'value="' + ui.esc(account.name) + '" autocomplete="off">' +
        '</div>' +
        '<div class="field">' +
          '<label>Icon</label>' +
          '<div class="avatar-grid" id="profile-avatars"></div>' +
        '</div>' +
        '<button type="button" class="btn btn-primary btn-block" id="profile-save">' +
          'Save changes' +
        '</button>' +
      '</div>' +

      pinCardHTML(account);
  }

  function pinCardHTML(account) {
    return '' +
      '<div class="card">' +
        '<h3 class="card-title">PIN</h3>' +
        '<p class="small muted">' +
          (account.pin
            ? 'This profile asks for a PIN when you sign in.'
            : 'No PIN on this profile — anyone opening the app can pick it.') +
        '</p>' +

        '<div class="field mt-1">' +
          '<label for="profile-pin">' +
            (account.pin ? 'New PIN' : 'Set a PIN') +
          '</label>' +
          '<input type="password" id="profile-pin" inputmode="numeric" ' +
            'maxlength="8" autocomplete="off" placeholder="4–8 digits">' +
        '</div>' +

        '<div class="btn-row">' +
          '<button type="button" class="btn btn-outline" id="profile-set-pin">' +
            (account.pin ? 'Change PIN' : 'Set PIN') +
          '</button>' +
          (account.pin
            ? '<button type="button" class="btn btn-ghost" id="profile-clear-pin">Remove PIN</button>'
            : '') +
        '</div>' +

        '<div class="note mt-1">' +
          '<span class="note-icon" aria-hidden="true">🔒</span>' +
          '<span>This PIN is a speed bump, not security. It keeps someone else ' +
            'on this device out of your log, but anyone who knows their way ' +
            'around a browser can get past it. Never use a password you use ' +
            'anywhere else. Your data never leaves this browser.</span>' +
        '</div>' +
      '</div>';
  }

  /* ---- Your training setup ------------------------------------------------ */
  function trainingHTML(data) {
    var profile = data.profile;

    return '' +
      '<div class="section-title"><h2>Your training setup</h2></div>' +

      '<div class="card">' +
        '<div class="field">' +
          '<label for="profile-experience">Experience</label>' +
          '<select id="profile-experience">' +
            MM.EXPERIENCE_LEVELS.map(function (level) {
              return '<option value="' + ui.esc(level.id) + '"' +
                (level.id === profile.experience ? ' selected' : '') + '>' +
                ui.esc(level.label) + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +

        '<div class="field">' +
          '<label for="profile-equipment">Equipment</label>' +
          '<select id="profile-equipment">' +
            MM.EQUIPMENT_OPTIONS.map(function (option) {
              return '<option value="' + ui.esc(option.id) + '"' +
                (option.id === profile.equipment ? ' selected' : '') + '>' +
                ui.esc(option.label) + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +

        '<div class="field">' +
          '<label for="profile-days">Days per week</label>' +
          '<select id="profile-days">' +
            [2, 3, 4, 5, 6, 7].map(function (n) {
              return '<option value="' + n + '"' +
                (n === profile.daysPerWeek ? ' selected' : '') + '>' +
                n + ' days</option>';
            }).join('') +
          '</select>' +
        '</div>' +

        '<div class="field">' +
          '<label for="profile-sport">Sport (optional)</label>' +
          '<input type="text" id="profile-sport" maxlength="40" ' +
            'value="' + ui.esc(profile.sport) + '" ' +
            'placeholder="Football, track, swimming…" autocomplete="off">' +
        '</div>' +

        '<p class="small faint">Changing any of these rebuilds your weekly plan. ' +
          'Your streak, goals, and log are never touched.</p>' +

        '<button type="button" class="btn btn-primary btn-block mt-1" id="profile-save-training">' +
          'Save and rebuild my plan' +
        '</button>' +
      '</div>';
  }

  /* ---- Sign out / switch / delete ----------------------------------------- */
  function accountActionsHTML(account) {
    var otherProfiles = MM.accounts.all().filter(function (p) {
      return p.id !== account.id;
    });

    return '' +
      '<div class="section-title"><h2>This profile</h2></div>' +

      '<div class="card">' +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-outline" id="profile-switch">' +
            (otherProfiles.length ? 'Switch profile' : 'Add a profile') +
          '</button>' +
          '<button type="button" class="btn btn-outline" id="profile-signout">Sign out</button>' +
        '</div>' +
        '<p class="small faint mt-1">' +
          (otherProfiles.length
            ? otherProfiles.length + ' other profile' +
              (otherProfiles.length === 1 ? '' : 's') + ' on this device.'
            : 'Nobody else uses this device yet.') +
        '</p>' +
      '</div>' +

      '<div class="card">' +
        '<h3 class="card-title">Delete this profile</h3>' +
        '<p class="small muted">Deletes ' + ui.esc(account.name) + ' along with their ' +
          'streak, plan, goals, and log. There is no undo, and it cannot be ' +
          'recovered from anywhere else.</p>' +
        '<button type="button" class="btn btn-danger btn-block mt-1" id="profile-delete">' +
          'Delete ' + ui.esc(account.name) +
        '</button>' +
      '</div>';
  }

  /* ==========================================================================
     INIT — one delegated listener, since render() rewrites this HTML.
     ======================================================================== */
  function init() {
    var host = ui.$('#profile-content');

    host.addEventListener('click', function (event) {
      var account = MM.accounts.active();
      if (!account) return;

      // ---- Save name + icon ----
      if (event.target.closest('#profile-save')) {
        var avatarBtn = ui.$('#profile-avatars .avatar-opt[aria-pressed="true"]');
        MM.accounts.update(account.id, {
          name: ui.$('#profile-name').value,
          avatar: avatarBtn ? avatarBtn.dataset.avatar : account.avatar,
        });
        MM.app.refreshAvatar();
        render();
        ui.toast('Profile updated.');
        return;
      }

      // ---- Set or change the PIN ----
      if (event.target.closest('#profile-set-pin')) {
        var pin = ui.$('#profile-pin').value.trim();
        if (!MM.accounts.isValidPin(pin)) {
          ui.toast('A PIN has to be 4 to 8 digits.');
          return;
        }
        MM.accounts.setPin(account.id, pin);
        render();
        ui.toast('PIN saved.');
        return;
      }

      if (event.target.closest('#profile-clear-pin')) {
        MM.accounts.setPin(account.id, null);
        render();
        ui.toast('PIN removed.');
        return;
      }

      // ---- Save the training setup and rebuild the plan ----
      if (event.target.closest('#profile-save-training')) {
        MM.store.update(function (d) {
          d.profile.experience = ui.$('#profile-experience').value;
          d.profile.equipment = ui.$('#profile-equipment').value;
          d.profile.daysPerWeek = Number(ui.$('#profile-days').value);
          d.profile.sport = ui.$('#profile-sport').value.trim().slice(0, 40);
          d.plan = MM.planBuilder.build(d.profile, d.mode);
        });
        ui.toast('Plan rebuilt with your new setup.');
        return;
      }

      // ---- Switch profile / sign out ----
      if (event.target.closest('#profile-switch') ||
          event.target.closest('#profile-signout')) {
        MM.app.signOut();
        return;
      }

      // ---- Delete ----
      if (event.target.closest('#profile-delete')) {
        var sure = window.confirm(
          'Delete "' + account.name + '" and everything in it?\n\n' +
          'This cannot be undone.');
        if (!sure) return;

        MM.accounts.remove(account.id);
        ui.toast('Profile deleted.');
        MM.app.signOut();
      }
    });
  }

  // The avatar picker needs rebuilding every time the page is drawn.
  function afterRender() {
    var account = MM.accounts.active();
    if (!account) return;
    MM.signinView.renderAvatarPicker(ui.$('#profile-avatars'), account.avatar);
  }

  return {
    init: init,
    render: function () { render(); afterRender(); },
  };
})();
