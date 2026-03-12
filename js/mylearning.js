/**
 * My Learning page - tab switching, Skills tab, Skill Progress modal
 */
(function() {
  var SKILL_PROGRESS_KEY = 'm1-skills-skill-progress';
  var SUB_SKILLS = [
    { name: 'Visualizing and Reporting Clean Data', points: 255, total: 1500 },
    { name: 'Preparing and Cleaning Data', points: 120, total: 1500 },
    { name: 'Connecting and Importing Data', points: 0, total: 1500 },
    { name: 'Prepare Datasets in Power BI', points: 0, total: 1500 }
  ];

  var COURSE_TITLE = 'Foundations: Data, Data, Everywhere';
  var COURSE_PROVIDER = 'Google';

  var SKILL_COURSES = {
    'Visualizing and Reporting Clean Data': [
      { title: 'Share Data Through the Art of Visualization', provider: 'Google', module: 'Module 1 — Visualizing data', progress: 40 },
      { title: 'Data Analysis with R Programming', provider: 'Google', module: 'Module 4 — Visualizations, aesthetics, and annotations', progress: 0 }
    ],
    'Preparing and Cleaning Data': [
      { title: 'Process Data from Dirty to Clean', provider: 'Google', module: 'Modules 1–5', progress: 25 },
      { title: 'Share Data Through the Art of Visualization', provider: 'Google', module: 'Module 1 — Data storytelling', progress: 40 }
    ],
    'Connecting and Importing Data': [
      { title: 'Prepare Data for Exploration', provider: 'Google', module: 'Modules 1–4', progress: 0 },
      { title: 'Foundations: Data, Data, Everywhere', provider: 'Google', module: 'Module 3 — The data ecosystem', progress: 0 }
    ],
    'Prepare Datasets in Power BI': [
      { title: 'Prepare Data for Analysis with Microsoft Power BI', provider: 'Microsoft', module: 'Modules 1–5', progress: 0 }
    ]
  };

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

  function getActiveExperiment() {
    return sessionStorage.getItem('proto-experiment') || '1';
  }

  function renderSkillsTab(container) {
    if (!container) return;
    var exp = getActiveExperiment();
    if (exp === '2' || exp === '3' || exp === '4') {
      renderSkillAccordions(container);
    } else {
      renderSkillsEmpty(container);
    }
  }

  function renderSkillsEmpty(container) {
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

  var EXTRA_SKILLS = [
    { name: 'Data Integrity & Literacy', points: 1500, total: 1500 }
  ];

  function renderSkillAccordions(container) {
    var skills = EXTRA_SKILLS.concat(getSkillProgress());
    var html = skills.map(function(skill, idx) {
      var isVerified = skill.points >= skill.total && skill.total > 0;
      var tagHtml = isVerified ? ' <span class="skill-verified-tag">Verified</span>' : '';
      return '<div class="skill-accordion" data-skill-idx="' + idx + '">' +
        '<div class="skill-accordion-trigger">' +
          '<span class="skill-accordion-name cds-subtitle-md">' + skill.name + tagHtml + '</span>' +
          '<span class="skill-accordion-xp cds-body-secondary" style="color:var(--cds-color-neutral-primary-weak)">' + skill.points + '/' + skill.total + ' XP</span>' +
        '</div>' +
      '</div>';
    }).join('');

    container.innerHTML = '<div class="skill-accordions-list">' + html + '</div>';
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

      window.addEventListener('experiment-changed', function() {
        renderSkillsTab(container);
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

    if (seeLink) seeLink.addEventListener('click', function(e) {
      e.preventDefault();
      if ((getActiveExperiment() === '3' || getActiveExperiment() === '4') && typeof window._openYourProgressModal === 'function') {
        window._openYourProgressModal();
      } else {
        openModal();
      }
    });
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

  /* ─── Your Progress dialog (Experiment 3) ─── */

  var YP_SKILL_AREAS = [
    {
      name: 'Data Integrity & Literacy',
      mastered: 13, total: 13,
      masteredList: [
        'Define rows, columns, variables and records',
        'Run duplicate & range checks in validation too',
        'Explain purpose of data dictionary & data-life-cycle',
        'Translate plain-English requests into tool steps',
        'List common PII and regulatory frameworks',
        'Mask sensitive columns & set permissions',
        'Name accuracy, completeness, consistency, timeliness',
        'Describe consent, minimisation, least-privilege',
        'Define population, sample, sampling frame',
        'Identify selection & survivorship bias examples',
        'Explain impact of poor data quality on decisions',
        'Diagnose root cause of duplicate record surges',
        'Generate random/stratified sample & document method'
      ],
      notMasteredList: [],
      assessment: {
        title: 'Prepare and Clean Customer Feedback Data for Analysis',
        meta: 'Assesses all skill capabilities  ·  1-2 hours'
      }
    },
    { name: 'Acquire & Prepare Data', mastered: 0, total: 17, masteredList: [], notMasteredList: [], assessment: null },
    { name: 'Analyze & Interpret', mastered: 0, total: 9, masteredList: [], notMasteredList: [], assessment: null },
    { name: 'Visualize & Communicate', mastered: 0, total: 7, masteredList: [], notMasteredList: [], assessment: null },
    { name: 'Script and Automate', mastered: 0, total: 4, masteredList: [], notMasteredList: [], assessment: null },
    { name: 'Collaborate & Grow', mastered: 0, total: 18, masteredList: [], notMasteredList: [], assessment: null },
    { name: 'Tools & Technology', mastered: 0, total: 10, masteredList: [], notMasteredList: [], assessment: null },
    { name: 'Business & Governance', mastered: 0, total: 8, masteredList: [], notMasteredList: [], assessment: null }
  ];

  function renderYourProgressContent(container, expandIdx) {
    if (!container) return;
    if (typeof expandIdx !== 'number') expandIdx = 1;

    var motivational =
      '<div class="yp-motivational">' +
        '<div class="yp-motivational-text">' +
          '<h3 class="yp-motivational-title cds-subtitle-lg">You\'re on the right track! Keep up the momentum!</h3>' +
          '<p class="yp-motivational-desc cds-body-secondary">Master all skills to earn the Data Analytics: Early Professional certificate.<br>' +
          'Already proficient in some of these skills? Just take the related assessment to verify your skills.</p>' +
        '</div>' +
        '<img class="yp-motivational-badge" src="assets/Larger Badge.svg" alt="" width="64" height="64">' +
      '</div>';

    var areas = YP_SKILL_AREAS.map(function(area, idx) {
      var expanded = idx === expandIdx;
      var pct = area.total ? Math.round((area.mastered / area.total) * 100) : 0;
      var chevron = expanded ? 'expand_less' : 'expand_more';
      var nameClass = expanded ? 'yp-skill-name cds-action-primary yp-skill-name-expanded' : 'yp-skill-name cds-body-primary';

      var isComplete = pct >= 100;
      var countLabel = area.mastered + '/' + area.total + ' skills verified';
      var starHtml = isComplete ? '<img class="yp-progress-star" src="assets/StarFilled.svg" alt="" width="20" height="20" aria-hidden="true">' : '';

      var html = '<div class="yp-skill-area" data-yp-idx="' + idx + '">' +
        '<button type="button" class="yp-skill-trigger" data-yp-toggle="' + idx + '">' +
          '<span class="' + nameClass + '">' + area.name + '</span>' +
          '<span class="yp-skill-right">' +
            '<span class="yp-skill-count cds-body-secondary">' + countLabel + '</span>' +
            '<span class="material-symbols-rounded yp-skill-chevron">' + chevron + '</span>' +
          '</span>' +
        '</button>' +
        '<div class="yp-progress-bar-wrapper">' +
          '<div class="yp-progress-bar"><div class="yp-progress-fill" style="width:' + pct + '%"></div></div>' +
          starHtml +
        '</div>';

      if (expanded) {
        html += '<div class="yp-skill-body">';
        // Mastered / not mastered columns
        html += '<div class="yp-mastery-columns">';
        html += '<div class="yp-mastery-col">';
        html += '<p class="yp-mastery-heading cds-subtitle-sm">Mastered (' + area.masteredList.length + ')</p>';
        html += '<ul class="yp-mastery-list cds-body-secondary">' + area.masteredList.map(function(s) { return '<li>' + s + '</li>'; }).join('') + '</ul>';
        html += '</div>';
        html += '<div class="yp-mastery-col">';
        html += '<p class="yp-mastery-heading cds-subtitle-sm">Not yet mastered (' + area.notMasteredList.length + ')</p>';
        html += '<ul class="yp-mastery-list cds-body-secondary">' + area.notMasteredList.map(function(s) { return '<li>' + s + '</li>'; }).join('') + '</ul>';
        html += '</div>';
        html += '</div>';
        // Assessment
        if (area.assessment) {
          html += '<div class="yp-assessment">' +
            '<div class="yp-assessment-info">' +
              '<p class="yp-assessment-title cds-subtitle-sm">' + area.assessment.title + '</p>' +
              '<p class="yp-assessment-meta cds-body-secondary">' + area.assessment.meta + '</p>' +
            '</div>' +
            '<button type="button" class="yp-assessment-btn cds-action-secondary">' +
              '<span class="material-symbols-rounded">refresh</span> Retry assessment' +
            '</button>' +
          '</div>';
        }
        html += '<div class="yp-skill-divider"></div>';
        html += '</div>';
      }

      html += '</div>';
      return html;
    }).join('');

    container.innerHTML = motivational + '<div class="yp-skill-areas">' + areas + '</div>';

    // Toggle expand/collapse
    container.querySelectorAll('[data-yp-toggle]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(btn.getAttribute('data-yp-toggle'));
        var areaEl = container.querySelector('[data-yp-idx="' + idx + '"]');
        var body = areaEl ? areaEl.querySelector('.yp-skill-body') : null;
        var chevronEl = btn.querySelector('.yp-skill-chevron');
        var nameEl = btn.querySelector('.yp-skill-name');

        if (body) {
          // Collapse
          body.remove();
          var divider = areaEl.querySelector('.yp-skill-divider');
          if (divider) divider.remove();
          if (chevronEl) chevronEl.textContent = 'expand_more';
          if (nameEl) { nameEl.classList.remove('yp-skill-name-expanded'); nameEl.className = nameEl.className.replace('cds-action-primary', 'cds-body-primary'); }
        } else {
          // Expand
          var area = YP_SKILL_AREAS[idx];
          var pct = area.total ? Math.round((area.mastered / area.total) * 100) : 0;
          var bodyHtml = '<div class="yp-skill-body">';
          if (area.masteredList.length || area.notMasteredList.length) {
            bodyHtml += '<div class="yp-mastery-columns">';
            bodyHtml += '<div class="yp-mastery-col">';
            bodyHtml += '<p class="yp-mastery-heading cds-subtitle-sm">Mastered (' + area.masteredList.length + ')</p>';
            bodyHtml += '<ul class="yp-mastery-list cds-body-secondary">' + area.masteredList.map(function(s) { return '<li>' + s + '</li>'; }).join('') + '</ul>';
            bodyHtml += '</div>';
            bodyHtml += '<div class="yp-mastery-col">';
            bodyHtml += '<p class="yp-mastery-heading cds-subtitle-sm">Not yet mastered (' + area.notMasteredList.length + ')</p>';
            bodyHtml += '<ul class="yp-mastery-list cds-body-secondary">' + area.notMasteredList.map(function(s) { return '<li>' + s + '</li>'; }).join('') + '</ul>';
            bodyHtml += '</div>';
            bodyHtml += '</div>';
          } else {
            bodyHtml += '<p class="cds-body-secondary" style="color:var(--cds-color-neutral-primary-weak)">No capabilities assessed yet. Complete course content or take an assessment to start tracking progress.</p>';
          }
          if (area.assessment) {
            bodyHtml += '<div class="yp-assessment">' +
              '<div class="yp-assessment-info">' +
                '<p class="yp-assessment-title cds-subtitle-sm">' + area.assessment.title + '</p>' +
                '<p class="yp-assessment-meta cds-body-secondary">' + area.assessment.meta + '</p>' +
              '</div>' +
              '<button type="button" class="yp-assessment-btn cds-action-secondary">' +
                '<span class="material-symbols-rounded">refresh</span> Retry assessment' +
              '</button>' +
            '</div>';
          }
          bodyHtml += '<div class="yp-skill-divider"></div>';
          bodyHtml += '</div>';

          areaEl.insertAdjacentHTML('beforeend', bodyHtml);
          if (chevronEl) chevronEl.textContent = 'expand_less';
          if (nameEl) { nameEl.classList.add('yp-skill-name-expanded'); nameEl.className = nameEl.className.replace('cds-body-primary', 'cds-action-primary'); }
        }
      });
    });
  }

  function initYourProgressModal() {
    var modal = document.getElementById('your-progress-modal');
    var backdrop = document.getElementById('yp-backdrop');
    var closeBtn = document.getElementById('yp-close-btn');
    var footerClose = document.getElementById('yp-footer-close');
    var content = document.getElementById('yp-content');

    function openModal(expandIdx) {
      renderYourProgressContent(content, typeof expandIdx === 'number' ? expandIdx : undefined);
      if (modal) {
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }
      if (typeof expandIdx === 'number' && content) {
        var target = content.querySelector('[data-yp-idx="' + expandIdx + '"]');
        if (target) {
          setTimeout(function() { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
        }
      }
    }

    function closeModal() {
      if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    }

    if (backdrop) backdrop.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (footerClose) footerClose.addEventListener('click', closeModal);

    window._openYourProgressModal = openModal;
  }

  function init() {
    initTabs();
    initSkillCards();
    initSkillsEarlyAccessModal();
    initSkillModal();
    initYourProgressModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
