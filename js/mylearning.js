/**
 * My Learning page - tab switching, Skills tab, Skill Progress modal
 */
(function() {
  var SKILL_PROGRESS_KEY = 'm1-skills-skill-progress';
  var SUB_SKILLS = [
    { name: 'Visualizing and Reporting Clean Data', points: 10, total: 25 },
    { name: 'Preparing and Cleaning Data', points: 2, total: 25 },
    { name: 'Connecting and Importing Data', points: 0, total: 25 },
    { name: 'Prepare Datasets in Power BI', points: 0, total: 25 }
  ];

  var COURSE_TITLE = 'Foundations: Data, Data, Everywhere';
  var COURSE_PROVIDER = 'Google';

  function getSkillProgress() {
    try {
      var raw = localStorage.getItem(SKILL_PROGRESS_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        return SUB_SKILLS.map(function(s) {
          var stored = data[s.name];
          return { name: s.name, points: stored != null ? Math.min(stored, s.total) : s.points, total: s.total };
        });
      }
    } catch (e) {}
    return SUB_SKILLS.map(function(s) { return { name: s.name, points: s.points, total: s.total }; });
  }

  function getSkillLevel(percent) {
    if (percent >= 90) return { label: 'Comprehending', className: 'skill-level-comprehending' };
    if (percent >= 40) return { label: 'Developing', className: 'skill-level-developing' };
    return { label: 'Practicing', className: 'skill-level-practicing' };
  }

  function getSegment() {
    return sessionStorage.getItem('m1-skills-segment') || 'active';
  }

  function isNewNotEnrolled() {
    return getSegment() === 'new' && !sessionStorage.getItem('m1-skills-commitment-done');
  }

  function renderSkillsTab(container) {
    if (!container) return;
    container.innerHTML =
      '<div class="mylearning-skills-empty">' +
        '<div class="mylearning-skills-empty-illustration">' +
          '<img src="assets/xp-coin.svg" alt="" width="120" height="120" aria-hidden="true">' +
        '</div>' +
        '<h2 class="mylearning-skills-empty-title cds-title-md">Level Up Your Skill Tracking</h2>' +
        '<p class="mylearning-skills-empty-desc cds-body-primary">A whole new way to view your learning progress is in the works. Let us know if you want a heads-up when it\'s ready!</p>' +
        '<button type="button" class="mylearning-skills-empty-cta btn-primary cds-action-primary" id="skills-get-early-access-btn">Get early access</button>' +
      '</div>';
  }

  function updateTabIndicator() {
    var active = document.querySelector('.mylearning-tab.active');
    var indicator = document.getElementById('mylearning-tabs-indicator');
    if (!active || !indicator) return;
    var tabsEl = active.closest('.mylearning-tabs');
    var tabsRect = tabsEl.getBoundingClientRect();
    var activeRect = active.getBoundingClientRect();
    indicator.style.left = (activeRect.left - tabsRect.left) + 'px';
    indicator.style.width = activeRect.width + 'px';
  }

  function switchToTab(tabId) {
    var tabs = document.querySelectorAll('.mylearning-tab');
    var panels = document.querySelectorAll('.mylearning-tab-panel');
    var tab = document.querySelector('.mylearning-tab[data-tab="' + tabId + '"]');
    if (!tab) return;
    tabs.forEach(function(t) { t.classList.remove('active'); });
    panels.forEach(function(p) { p.classList.remove('active'); });
    tab.classList.add('active');
    var panel = document.getElementById('panel-' + tabId);
    if (panel) panel.classList.add('active');
    updateTabIndicator();
    if (tabId === 'skills') {
      var container = document.getElementById('skills-cards-container');
      if (container) renderSkillsTab(container);
    }
  }

  function initTabs() {
    var tabs = document.querySelectorAll('.mylearning-tab');
    var panels = document.querySelectorAll('.mylearning-tab-panel');
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        switchToTab(tab.getAttribute('data-tab'));
      });
    });
    var hash = (location.hash || '').replace(/^#/, '');
    if (hash && ['overview', 'courses', 'skills', 'certificates'].indexOf(hash) >= 0) {
      switchToTab(hash);
    }
    updateTabIndicator();
    window.addEventListener('resize', updateTabIndicator);
  }

  function initSkillCards() {
    var container = document.getElementById('skills-cards-container');
    if (container) {
      renderSkillsTab(container);
      container.addEventListener('click', function(e) {
        var cta = e.target.closest('.mylearning-skills-empty-cta');
        if (cta) {
          e.preventDefault();
          var modal = document.getElementById('skills-early-access-modal');
          if (modal) {
            modal.classList.add('is-visible');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
          }
        }
      });
    }
  }

  function initSkillsEarlyAccessModal() {
    var modal = document.getElementById('skills-early-access-modal');
    var backdrop = document.getElementById('skills-early-access-backdrop');
    var closeBtn = document.getElementById('skills-early-access-close');
    var submitBtn = document.getElementById('skills-early-access-submit');
    var skipBtn = document.getElementById('skills-early-access-skip');
    var input = document.getElementById('skills-feedback-input');

    function closeModal() {
      if (modal) {
        modal.classList.remove('is-visible');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
      if (input) input.value = '';
    }

    if (backdrop) backdrop.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    if (submitBtn) {
      submitBtn.addEventListener('click', function() {
        /* In a real app, would send feedback to server */
        closeModal();
      });
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', function() {
        closeModal();
      });
    }
  }

  function renderSkillModalBody(container) {
    var skills = getSkillProgress();
    var html = skills.map(function(skill) {
      var pct = skill.total ? Math.round((skill.points / skill.total) * 100) : 0;
      var level = getSkillLevel(pct);
      return '<div class="skill-modal-skill">' +
        '<div class="skill-modal-skill-header">' +
          '<span class="skill-modal-skill-name">' + skill.name + '</span>' +
          '<div class="skill-modal-skill-xp">' + skill.points + '/' + skill.total + ' XP</div>' +
        '</div>' +
        '<div class="skill-modal-progress-bar">' +
          '<div class="skill-modal-progress-fill" style="width:' + pct + '%"></div>' +
        '</div>' +
        '<span class="skill-modal-level-badge ' + level.className + '">' + level.label + '</span>' +
      '</div>';
    }).join('');
    if (container) container.innerHTML = html;
  }

  function initSkillModal() {
    var modal = document.getElementById('skill-progress-modal');
    var backdrop = document.getElementById('skill-modal-backdrop');
    var closeBtn = document.getElementById('skill-modal-close');
    var seeFullBtn = document.getElementById('skill-modal-see-full');
    var seeLink = document.getElementById('see-skill-progress-link');
    var body = document.getElementById('skill-modal-body');

    function openModal() {
      renderSkillModalBody(body);
      if (modal) {
        modal.classList.add('is-visible');
        modal.setAttribute('aria-hidden', 'false');
      }
    }

    function closeModal() {
      if (modal) {
        modal.classList.remove('is-visible');
        modal.setAttribute('aria-hidden', 'true');
      }
    }

    if (seeLink) seeLink.addEventListener('click', function(e) { e.preventDefault(); openModal(); });
    if (backdrop) backdrop.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    if (seeFullBtn) {
      seeFullBtn.addEventListener('click', function() {
        closeModal();
        var skillsTab = document.querySelector('.mylearning-tab[data-tab="skills"]');
        if (skillsTab) skillsTab.click();
      });
    }
  }

  function init() {
    initTabs();
    initSkillCards();
    initSkillsEarlyAccessModal();
    initSkillModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
