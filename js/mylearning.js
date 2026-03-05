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
    if (isNewNotEnrolled()) {
      container.innerHTML = '<div style="text-align:center;padding:48px 24px;">' +
        '<div style="width:56px;height:56px;border-radius:50%;background:var(--cds-color-grey-50);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">' +
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--cds-color-grey-400)" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' +
        '</div>' +
        '<p class="cds-subtitle-md" style="color:var(--cds-color-grey-975);margin-bottom:8px;">No skills yet</p>' +
        '<p class="cds-body-secondary" style="color:var(--cds-color-grey-600);max-width:320px;margin:0 auto;">Complete your first lesson to start building skills. Every learning item earns XP toward in-demand skills.</p>' +
      '</div>';
      return;
    }
    var SKILL_TOTAL_XP = 2000;
    var skills = getSkillProgress().sort(function(a, b) { return b.points - a.points; });
    var html = skills.map(function(skill) {
      var currentXP = skill.points;
      var key = 'skills-tab-' + skill.name.replace(/\s/g, '-');
      return '<div class="mylearning-skill-card" data-skill-key="' + key + '">' +
        '<button type="button" class="mylearning-skill-card-header" aria-expanded="false">' +
          '<span class="mylearning-skill-chevron"><img src="assets/ChevronDown.svg" alt="" aria-hidden="true"></span>' +
          '<div class="mylearning-skill-info">' +
            '<span class="mylearning-skill-name cds-subtitle-md">' + skill.name + '</span>' +
          '</div>' +
          '<div class="mylearning-skill-xp cds-body-primary">' + currentXP + '/' + SKILL_TOTAL_XP + ' XP</div>' +
        '</button>' +
        '<div class="mylearning-skill-expanded" aria-hidden="true"></div>' +
      '</div>';
    }).join('');
    if (container) container.innerHTML = html;
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
      if (container && !container.innerHTML) renderSkillsTab(container);
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
    if (container) renderSkillsTab(container);

    document.addEventListener('click', function(e) {
      var header = e.target.closest('.mylearning-skill-card-header');
      if (!header) return;
      var card = header.closest('.mylearning-skill-card');
      if (!card) return;
      e.preventDefault();
      var expanded = card.querySelector('.mylearning-skill-expanded');
      var chevron = header.querySelector('.mylearning-skill-chevron');
      var isOpen = card.classList.toggle('is-expanded');
      header.setAttribute('aria-expanded', isOpen);
    });
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
    initSkillModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
