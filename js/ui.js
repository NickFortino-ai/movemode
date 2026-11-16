/* ============================================================================
   ui.js — SHARED UI HELPERS
   ============================================================================
   Little functions the view files use over and over: finding elements,
   escaping text, showing a toast, opening modals, wiring up the segmented
   pickers, and rendering an exercise row.

   Keeping them here means the view files stay focused on their own screen.
   ========================================================================== */

MM.ui = (function () {

  /* ---- Finding elements ------------------------------------------------- */
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    // Array.prototype.slice turns the NodeList into a real array so we can
    // use forEach / map / filter on it.
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  /* ---- Escaping text ----------------------------------------------------
     ALWAYS run user-typed text (meal names, notes, sport) through this
     before putting it in innerHTML. Otherwise someone typing a < character
     breaks the page. */
  function esc(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ---- Toast ------------------------------------------------------------ */
  var toastTimer = null;

  function toast(message) {
    var el = $('#toast');
    if (!el) return;

    el.textContent = message;
    el.classList.add('is-visible');

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      el.classList.remove('is-visible');
    }, 2600);
  }

  /* ---- Modals ----------------------------------------------------------- */
  function openModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('is-open');
    // Stop the page behind the modal from scrolling.
    document.body.style.overflow = 'hidden';
  }

  function closeModal(id) {
    var modal = id ? document.getElementById(id) : null;
    if (modal) {
      modal.classList.remove('is-open');
    } else {
      $$('.modal').forEach(function (m) { m.classList.remove('is-open'); });
    }
    document.body.style.overflow = '';
  }

  // Wire up every [data-close-modal] button and clicking the dark backdrop.
  function initModals() {
    $$('.modal').forEach(function (modal) {
      modal.addEventListener('click', function (event) {
        var clickedBackdrop = event.target === modal;
        var clickedCloser = event.target.closest('[data-close-modal]');
        if (clickedBackdrop || clickedCloser) closeModal(modal.id);
      });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeModal();
    });
  }

  /* ---- Segmented pickers ------------------------------------------------
     Turns a container of .seg-btn buttons into a single-choice picker.
     The chosen value is read from the button's data-value attribute. */
  function initSegmented(container, onChange) {
    if (!container) return;

    container.addEventListener('click', function (event) {
      var btn = event.target.closest('.seg-btn');
      if (!btn || !container.contains(btn)) return;

      setSegmentedValue(container, btn.dataset.value);
      if (onChange) onChange(btn.dataset.value);
    });
  }

  function setSegmentedValue(container, value) {
    $$('.seg-btn', container).forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.dataset.value === String(value) ? 'true' : 'false');
    });
  }

  function getSegmentedValue(container) {
    var active = $('.seg-btn[aria-pressed="true"]', container);
    return active ? active.dataset.value : null;
  }

  /* ---- Big option cards (onboarding, settings) ---------------------------
     items:    [{ id, label, blurb, icon, badge }]
     selected: either one id (single choice) or an array of ids (multi choice)
     `badge` draws a small chip on the card — used to mark the main goal. */
  function renderOptionCards(container, items, selected) {
    if (!container) return;

    var chosen = Array.isArray(selected) ? selected : [selected];

    container.innerHTML = items.map(function (item) {
      var pressed = chosen.indexOf(item.id) !== -1 ? 'true' : 'false';
      var badge = item.badge
        ? '<span class="chip chip-accent option-badge">' + esc(item.badge) + '</span>'
        : '';

      return '' +
        '<button type="button" class="option-card" data-value="' + esc(item.id) + '" aria-pressed="' + pressed + '">' +
          '<span class="option-icon" aria-hidden="true">' + esc(item.icon || '•') + '</span>' +
          '<span class="option-text">' +
            '<span class="option-label">' + esc(item.label) + badge + '</span>' +
            '<span class="option-blurb">' + esc(item.blurb || '') + '</span>' +
          '</span>' +
        '</button>';
    }).join('');
  }

  /* Wire up a set of option cards.
       onSelect(value, isPressed) is called on every tap.
       multi = true  -> tapping toggles a card, so several can be on at once
       multi = false -> tapping picks one and clears the rest (the default) */
  function initOptionCards(container, onSelect, multi) {
    if (!container) return;

    container.addEventListener('click', function (event) {
      var card = event.target.closest('.option-card');
      if (!card || !container.contains(card)) return;

      var nowPressed;

      if (multi) {
        nowPressed = card.getAttribute('aria-pressed') !== 'true';
        card.setAttribute('aria-pressed', nowPressed ? 'true' : 'false');
      } else {
        nowPressed = true;
        $$('.option-card', container).forEach(function (c) {
          c.setAttribute('aria-pressed', c === card ? 'true' : 'false');
        });
      }

      if (onSelect) onSelect(card.dataset.value, nowPressed);
    });
  }

  /* Which option cards are currently on? Returns an array of ids. */
  function pressedOptionValues(container) {
    return $$('.option-card[aria-pressed="true"]', container).map(function (c) {
      return c.dataset.value;
    });
  }

  /* ---- Describing a prescription ----------------------------------------
     Turns a plan block into readable text:
       "3 sets × 10–12"      (rep based)
       "3 × 45 sec"          (timed, multiple sets)
       "5 min"               (single long cardio effort)
     -------------------------------------------------------------------- */
  function doseText(block) {
    var setsWord = MM.copy('planSets');

    if (block.timed) {
      var length = MM.formatLength(block.seconds);
      return block.sets > 1 ? block.sets + ' × ' + length : length;
    }

    if (block.reps === 'max effort' || block.reps === 'easy' || block.reps === '—') {
      return block.sets + ' × ' + block.reps;
    }

    return block.sets + ' ' + setsWord + ' × ' + block.reps;
  }

  /* ---- One exercise row inside a plan day ------------------------------- */
  function exerciseRowHTML(block, index) {
    var exercise = MM.getExercise(block.exerciseId);

    // If an exercise was removed from the library, say so instead of crashing.
    if (!exercise) {
      return '<div class="exercise-row"><div class="exercise-main">' +
        '<div class="exercise-name faint">Exercise no longer in the library</div>' +
        '</div></div>';
    }

    var restHint = (block.rest > 0 && block.sets > 1)
      ? ' · rest ' + block.rest + 's'
      : '';

    var label = block.label
      ? '<span class="exercise-label">' + esc(block.label) + '</span>'
      : '';

    return '' +
      '<div class="exercise-row">' +
        '<span class="exercise-index" aria-hidden="true">' + (index + 1) + '</span>' +
        '<div class="exercise-main">' +
          label +
          '<div class="exercise-name">' + esc(exercise.name) + '</div>' +
          '<div class="exercise-dose">' + esc(doseText(block)) + restHint + '</div>' +
          '<p class="exercise-how">' + esc(exercise.howTo) + '</p>' +
          '<div class="chip-row exercise-tags">' +
            exercise.muscles.slice(0, 3).map(function (m) {
              return '<span class="chip">' + esc(m) + '</span>';
            }).join('') +
            (exercise.equipment !== 'none'
              ? '<span class="chip chip-accent">' + esc(exercise.equipment) + '</span>'
              : '') +
          '</div>' +
        '</div>' +
      '</div>';
  }

  /* ---- A small emoji for what someone logged, used in the log ------------
     People TYPE what they did, so there is no fixed list to look up. Instead
     we look for a keyword anywhere in what they wrote: "walked the dog on
     the trail" finds "dog" and shows 🐕.

     Order matters — the first match wins. More specific words go first, so
     "walked the dog" gets the dog rather than the walker. Anything we don't
     recognise still gets a tick, because it still counts. */
  var ACTIVITY_ICONS = [
    ['dog', '🐕'],
    ['hik', '🥾'],
    ['walk', '🚶'],
    ['step', '🚶'],
    ['stair', '🚶'],
    ['run', '🏃'],
    ['jog', '🏃'],
    ['sprint', '🏃'],
    ['bike', '🚴'],
    ['cycl', '🚴'],
    ['swim', '🏊'],
    ['dance', '💃'],
    ['danc', '💃'],
    ['yoga', '🧘'],
    ['stretch', '🧘'],
    ['lift', '🏋️'],
    ['weight', '🏋️'],
    ['gym', '🏋️'],
    ['push', '🏋️'],
    ['skate', '🛹'],
    ['ski', '⛷️'],
    ['climb', '🧗'],
    ['row', '🚣'],
    ['surf', '🏄'],
    ['soccer', '⚽'],
    ['football', '🏈'],
    ['basketball', '🏀'],
    ['tennis', '🎾'],
    ['practice', '🥎'],
    ['game', '🏆'],
    ['sport', '🥎'],
    ['yard', '🍂'],
    ['rake', '🍂'],
    ['leaves', '🍂'],
    ['mow', '🌿'],
    ['garden', '🌿'],
    ['shovel', '❄️'],
    ['snow', '❄️'],
    ['clean', '🧹'],
    ['chore', '🧹'],
    ['housework', '🧹'],
    ['vacuum', '🧹'],
    ['play', '🤸'],
    ['outside', '🌳'],
    ['workout', '💥'],
  ];

  function activityIcon(type) {
    var text = String(type || '').toLowerCase();

    for (var i = 0; i < ACTIVITY_ICONS.length; i++) {
      if (text.indexOf(ACTIVITY_ICONS[i][0]) !== -1) {
        return ACTIVITY_ICONS[i][1];
      }
    }
    return '✅';
  }

  var MEAL_ICONS = {
    'Breakfast': '🍳',
    'Lunch': '🥪',
    'Dinner': '🍽️',
    'Snack': '🍎',
  };

  function mealIcon(slot) {
    return MEAL_ICONS[slot] || '🍽️';
  }

  /* ---- The friendly "check with a grown-up" note ------------------------ */
  function disclaimerHTML() {
    return '' +
      '<div class="note mt-1">' +
        '<span class="note-icon" aria-hidden="true">💬</span>' +
        '<span>' + esc(MM.NUTRITION_DISCLAIMER) + '</span>' +
      '</div>';
  }

  return {
    $: $,
    $$: $$,
    esc: esc,
    toast: toast,
    openModal: openModal,
    closeModal: closeModal,
    initModals: initModals,
    initSegmented: initSegmented,
    setSegmentedValue: setSegmentedValue,
    getSegmentedValue: getSegmentedValue,
    renderOptionCards: renderOptionCards,
    initOptionCards: initOptionCards,
    pressedOptionValues: pressedOptionValues,
    doseText: doseText,
    exerciseRowHTML: exerciseRowHTML,
    activityIcon: activityIcon,
    mealIcon: mealIcon,
    disclaimerHTML: disclaimerHTML,
  };
})();
