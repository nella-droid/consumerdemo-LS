/**
 * Features List overlay — shows features per experiment with highlight-on-click
 */
(function() {

  /*
   * Each feature can have:
   *   text     – label shown in the list
   *   hl       – CSS selector(s) to highlight when clicked (comma-separated)
   *   action   – function name to call (opens modal, navigates, etc.)
   *   children – nested items (rendered indented)
   *   nav      – URL to open in new tab if element not found on current page
   */
  var FEATURES = {
    '2': {
      label: 'Experiment A+B',
      sections: [
        {
          title: 'Learning experience',
          items: [
            {
              text: 'Persistent "Today\'s Skill Points" section in left nav with XP',
              hl: '#sidebar-xp-tracker',
              children: [
                { text: 'See course skill progress link that opens Course Skill Progress modal', action: 'openSkillProgressModal' },
                { text: 'Has link to painted door feedback', hl: '#skills-progress-feedback-btn', action: 'openSkillProgressModal' }
              ]
            },
            { text: 'Course skill progress modal shows list of skills are that rooted in the course. The skill xp values are based on overall skill progress', action: 'openSkillProgressModal' },
            {
              text: 'Skill progress intro modal after completion of 1 item',
              action: 'openXpIntroModal',
              children: [
                { text: 'Enrolled learner: Show all skill progress learner has made in course' },
                { text: 'New learner: Show last skill learner made progress in + different copy' }
              ]
            },
            {
              text: 'Skill tag on items',
              hl: '.skill-tag, #content-skill-tags',
              children: [
                { text: 'Skill point tags are dynamic: Skill tags on item pages show learners the exact number of XP they will receive from that item before they complete it', hl: '.skill-tag' },
                { text: 'If an item would award 0 points to a given learner (e.g. because the learner has already maxed the XP they can earn from the skill expression tagged to that item), the skill tag is not shown on the item page for that learner' }
              ]
            },
            { text: 'Skill progress cards show on assignment completion results page (both practice and graded)', action: 'goToPracticeItem' },
            { text: 'Updated skills oriented module completion dialog', action: 'openModuleCompleteModal' }
          ]
        },
        {
          title: 'My Learning',
          items: [
            { text: 'Skills tab', hl: '.mylearning-tab[data-tab="skills"], #panel-skills', nav: 'my-learning.html#skills' },
            { text: 'Painted door button to give feedback', hl: '#skills-get-early-access-btn', nav: 'my-learning.html#skills' }
          ]
        }
      ]
    }
  };

  /* Action handlers — open modals, navigate to items, etc. */
  var ACTIONS = {
    openSkillProgressModal: function() {
      if (typeof showSkillsProgressModal === 'function') {
        showSkillsProgressModal();
        return true;
      }
      return false;
    },
    openXpIntroModal: function() {
      if (typeof showXpIntroModal === 'function') {
        showXpIntroModal();
        return true;
      }
      return false;
    },
    openModuleCompleteModal: function() {
      if (typeof showModuleCompleteDialog === 'function') {
        window.moduleCompleteDialogShown = false;
        showModuleCompleteDialog();
        return true;
      }
      return false;
    },
    openGoalsCompleteModal: function() {
      if (typeof showGoalsCompleteDialog === 'function') {
        window.goalsCompleteDialogShown = false;
        showGoalsCompleteDialog();
        return true;
      }
      return false;
    },
    openYourProgressModal: function() {
      var modal = document.getElementById('your-progress-modal');
      if (modal) {
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        return true;
      }
      return false;
    },
    goToPracticeItem: function() {
      /* Find closest practice item and click it, then show feedback */
      var practiceItem = document.querySelector('.lecture-item[data-practice-item="true"]');
      if (practiceItem) {
        practiceItem.click();
        /* Small delay to let the content switch, then trigger the feedback/results view */
        setTimeout(function() {
          if (typeof showAssignmentFeedback === 'function') {
            showAssignmentFeedback();
          }
        }, 300);
        return true;
      }
      return false;
    },
    forceVideoComplete: function() {
      if (typeof triggerVideoEndModal === 'function') {
        /* Reset the triggered flag so the end modal can fire */
        window.videoEndModalTriggered = false;
        triggerVideoEndModal();
        return true;
      }
      return false;
    }
  };

  var activeHighlightKey = null;

  function clearHighlights() {
    document.querySelectorAll('.proto-feature-hl').forEach(function(el) {
      el.classList.remove('proto-feature-hl');
    });
    var overlay = document.getElementById('proto-features-overlay');
    if (overlay) {
      overlay.querySelectorAll('.proto-features-item-active').forEach(function(el) {
        el.classList.remove('proto-features-item-active');
      });
    }
    activeHighlightKey = null;
  }

  function applyHighlight(selector) {
    if (!selector) return false;
    var selectors = selector.split(',').map(function(s) { return s.trim(); });
    var found = false;
    selectors.forEach(function(sel) {
      document.querySelectorAll(sel).forEach(function(el) {
        el.classList.add('proto-feature-hl');
        found = true;
      });
    });
    return found;
  }

  function scrollToHighlighted() {
    var first = document.querySelector('.proto-feature-hl');
    if (first) {
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function getExp() {
    return '2';
  }

  function renderItem(item, idx, parentIdx) {
    var key = parentIdx !== undefined ? parentIdx + '-' + idx : String(idx);
    var hasInteraction = !!item.hl || !!item.action || !!item.nav;
    var classes = 'proto-features-item' + (hasInteraction ? ' proto-features-item-clickable' : '');
    return '<li class="' + classes + '" data-fl-key="' + key + '"' +
      (item.hl ? ' data-fl-hl="' + item.hl.replace(/"/g, '&quot;') + '"' : '') +
      (item.action ? ' data-fl-action="' + item.action + '"' : '') +
      (item.nav ? ' data-fl-nav="' + item.nav + '"' : '') +
      '>' +
      '<span class="proto-features-bullet"></span>' +
      '<span>' + item.text + '</span>' +
    '</li>';
  }

  function render(overlay) {
    var exp = getExp();
    var data = FEATURES[exp] || FEATURES['2'];

    var html = '<div class="proto-features-header">' +
      '<span class="proto-features-title">' + data.label + '</span>' +
      '<button type="button" class="proto-features-close" id="proto-features-close" aria-label="Close">' +
        '<span class="material-symbols-rounded">close</span>' +
      '</button>' +
    '</div>';

    if (data.notice) {
      html += '<div class="proto-features-notice">' + data.notice + '</div>';
    }

    var itemIdx = 0;
    data.sections.forEach(function(section) {
      html += '<div class="proto-features-section-title">' + section.title + '</div>';
      html += '<ul class="proto-features-list">';
      section.items.forEach(function(item) {
        html += renderItem(item, itemIdx);
        if (item.children) {
          html += '<ul class="proto-features-sublist">';
          item.children.forEach(function(child, ci) {
            html += renderItem(child, ci, itemIdx);
          });
          html += '</ul>';
        }
        itemIdx++;
      });
      html += '</ul>';
    });

    overlay.innerHTML = html;

    /* Close button */
    overlay.querySelector('#proto-features-close').addEventListener('click', function() {
      overlay.classList.remove('is-open');
      var btn = document.getElementById('proto-features-btn');
      if (btn) btn.setAttribute('aria-pressed', 'false');
      clearHighlights();
    });

    /* Click handlers for items */
    overlay.querySelectorAll('.proto-features-item-clickable').forEach(function(li) {
      li.addEventListener('click', function() {
        var key = li.getAttribute('data-fl-key');
        var hl = li.getAttribute('data-fl-hl');
        var action = li.getAttribute('data-fl-action');
        var nav = li.getAttribute('data-fl-nav');

        /* Toggle off if already active */
        if (activeHighlightKey === key) {
          clearHighlights();
          return;
        }

        clearHighlights();

        /* If there's an action, run it */
        if (action && ACTIONS[action]) {
          var handled = ACTIONS[action]();
          if (handled) {
            li.classList.add('proto-features-item-active');
            activeHighlightKey = key;
            return;
          }
        }

        /* Try to highlight on current page */
        if (hl) {
          var found = applyHighlight(hl);
          if (found) {
            li.classList.add('proto-features-item-active');
            activeHighlightKey = key;
            scrollToHighlighted();
            return;
          }
        }

        /* If not found on page, navigate */
        if (nav) {
          var exp = '2';
          var hashIdx = nav.indexOf('#');
          var base = hashIdx !== -1 ? nav.substring(0, hashIdx) : nav;
          var hash = hashIdx !== -1 ? nav.substring(hashIdx) : '';
          var sep = base.indexOf('?') === -1 ? '?' : '&';
          var url = base + sep + 'exp=' + exp + hash;
          window.location.href = url;
        }
      });
    });

    /* Restore active highlight if it was set */
    if (activeHighlightKey) {
      var activeLi = overlay.querySelector('[data-fl-key="' + activeHighlightKey + '"]');
      if (activeLi) activeLi.classList.add('proto-features-item-active');
    }
  }

  function init() {
    var strip = document.querySelector('.proto-control-strip');
    if (!strip) return;

    /* Create overlay */
    var overlay = document.createElement('div');
    overlay.className = 'proto-features-overlay';
    overlay.id = 'proto-features-overlay';
    document.body.appendChild(overlay);

    /* Create trigger button */
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'proto-features-btn';
    btn.id = 'proto-features-btn';
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Show features list');
    btn.setAttribute('data-tooltip', 'Features list');
    btn.innerHTML = '<span class="material-symbols-rounded">checklist</span>';

    /* Insert before the tools wrapper */
    var toolsWrapper = strip.querySelector('.proto-tools-wrapper');
    if (toolsWrapper) {
      strip.insertBefore(btn, toolsWrapper);
    } else {
      strip.appendChild(btn);
    }

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var isOpen = overlay.classList.contains('is-open');
      if (isOpen) {
        overlay.classList.remove('is-open');
        btn.setAttribute('aria-pressed', 'false');
        clearHighlights();
      } else {
        render(overlay);
        overlay.classList.add('is-open');
        btn.setAttribute('aria-pressed', 'true');
      }
    });

    /* Prevent clicks inside overlay from propagating (keeps overlay open) */
    overlay.addEventListener('click', function(e) {
      e.stopPropagation();
    });

    /* Re-render when experiment changes */
    window.addEventListener('experiment-changed', function() {
      clearHighlights();
      if (overlay.classList.contains('is-open')) {
        render(overlay);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
