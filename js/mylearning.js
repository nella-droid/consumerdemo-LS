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
    var skills = getSkillProgress().sort(function(a, b) { return b.points - a.points; });
    var html = skills.map(function(skill, idx) {
      var pct = skill.total ? Math.round((skill.points / skill.total) * 100) : 0;
      var level = getSkillLevel(pct);
      var contributing = [
        { name: COURSE_TITLE, provider: COURSE_PROVIDER, xp: skill.points, total: skill.total, isCurrent: true }
      ];
      if (skill.name === 'Visualizing and Reporting Clean Data') {
        contributing.push({ name: 'Data Visualization with Tableau', provider: 'Coursera', xp: 0, total: 25, isCurrent: false });
        contributing.push({ name: 'Advanced Excel for Data Analysis', provider: 'Microsoft', xp: 0, total: 15, isCurrent: false });
      } else if (skill.name === 'Preparing and Cleaning Data') {
        contributing.push({ name: 'Data Wrangling with Python', provider: 'Microsoft', xp: 0, total: 20, isCurrent: false });
      } else if (skill.name === 'Connecting and Importing Data') {
        contributing.push({ name: 'SQL for Data Science', provider: 'Coursera', xp: 0, total: 20, isCurrent: false });
      }
      var totalXP = contributing.reduce(function(sum, c) { return sum + c.xp; }, 0);
      var key = 'skills-tab-' + skill.name.replace(/\s/g, '-');
      return '<div class="mylearning-skill-card" data-skill-key="' + key + '">' +
        '<button type="button" class="mylearning-skill-card-header" aria-expanded="false">' +
          '<span class="mylearning-skill-chevron"></span>' +
          '<div class="mylearning-skill-info">' +
            '<div class="mylearning-skill-name-row">' +
              '<span class="mylearning-skill-name">' + skill.name + '</span>' +
              '<span class="mylearning-skill-level-badge ' + level.className + '">' + level.label + '</span>' +
            '</div>' +
            '<span class="mylearning-skill-meta">' + contributing.length + ' course' + (contributing.length > 1 ? 's' : '') + ' contribute to this skill</span>' +
          '</div>' +
          '<div class="mylearning-skill-xp">' + totalXP + ' XP</div>' +
        '</button>' +
        '<div class="mylearning-skill-expanded">' +
          '<p class="mylearning-skill-expanded-title">Courses contributing to this skill</p>' +
          '<div class="mylearning-skill-courses">' +
            contributing.map(function(c) {
              var iconClass = c.isCurrent ? ' is-current' : '';
              return '<div class="mylearning-skill-course-item' + iconClass + '">' +
                '<div class="mylearning-skill-course-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8M8 11h8"/></svg></div>' +
                '<div class="mylearning-skill-course-info">' +
                  '<p class="mylearning-skill-course-name">' + c.name + '</p>' +
                  '<p class="mylearning-skill-course-provider">' + c.provider + '</p>' +
                '</div>' +
                '<div class="mylearning-skill-course-xp">' + c.xp + ' XP</div>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
    if (container) container.innerHTML = html;
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
