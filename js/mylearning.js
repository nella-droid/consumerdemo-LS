/**
 * My Learning page - tab switching, Skills tab, Skill Progress modal
 */
(function() {
  var SKILL_PROGRESS_KEY = 'm1-skills-skill-progress';
  var _mlExp = '2';
  var _mlXpMax = 1500;
  var SUB_SKILLS = [
    { name: 'Visualizing and Reporting Clean Data', points: 255, total: _mlXpMax },
    { name: 'Preparing and Cleaning Data', points: 120, total: _mlXpMax },
    { name: 'Connecting and Importing Data', points: 0, total: _mlXpMax },
    { name: 'Prepare Datasets in Power BI', points: 0, total: _mlXpMax }
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
    return '2';
  }

  function isZeroSkillProgress() {
    try { return sessionStorage.getItem('proto-zero-skill-progress') === 'true'; }
    catch (e) { return false; }
  }

  function renderSkillsTab(container) {
    if (!container) return;
    if (sessionStorage.getItem('proto-skills-features') !== 'true') {
      container.innerHTML = '';
      return;
    }
    if (isZeroSkillProgress()) {
      renderSkillsZeroState(container);
      return;
    }
    renderSkillAccordions(container);
  }

  /* Coin-only SVG reused from the XP intro modal, with portal + light + coin
     visible immediately (no reveal animations) and only the coin floating. */
  var ZERO_STATE_SVG = '<svg class="mylearning-zero-icon-svg" viewBox="0 0 210 301" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<g class="mylearning-zero-portal">' +
      '<path d="M72.9313 283.407C71.8909 282.8 71.38 280.788 70.9639 279.175C70.5099 277.391 69.9992 275.361 68.6183 273.463C67.2185 271.489 65.062 269.8 63.1704 268.32C61.6192 267.105 59.4818 265.416 59.4818 264.695C59.4818 263.955 61.5816 262.285 63.1327 261.07C65.0054 259.571 67.143 257.882 68.5428 255.908C69.8858 254.01 70.3776 251.979 70.8126 250.195C71.2099 248.582 71.7017 246.552 72.7232 245.963C73.7447 245.375 77.2063 245.071 79.987 244.844C83.0704 244.578 86.5511 244.293 89.8237 243.496C93.2097 242.68 96.1038 241.446 98.6575 240.346C100.757 239.435 103.633 238.201 104.9 238.201C106.167 238.201 109.061 239.435 111.161 240.327C113.734 241.428 116.628 242.68 120.033 243.477C123.324 244.274 126.805 244.559 129.869 244.825C132.65 245.052 136.131 245.356 137.171 245.944C138.212 246.533 138.703 248.563 139.12 250.177C139.574 251.96 140.103 253.991 141.465 255.889C142.865 257.863 145.021 259.552 146.932 261.032C148.483 262.247 150.64 263.936 150.64 264.676C150.64 265.416 148.521 267.086 146.97 268.32C145.078 269.8 142.96 271.489 141.56 273.463C140.217 275.361 139.725 277.391 139.271 279.175C138.874 280.788 138.401 282.8 137.379 283.407C136.358 284.015 132.877 284.299 130.096 284.527C127.032 284.793 123.551 285.077 120.279 285.874C116.893 286.69 113.999 287.943 111.445 289.044C109.345 289.936 106.47 291.169 105.203 291.169C103.935 291.169 101.041 289.936 98.9223 289.025C96.3497 287.924 93.4367 286.69 90.0507 285.874C86.7592 285.096 83.2784 284.793 80.1951 284.527C77.4144 284.299 73.9338 283.996 72.9123 283.407M149.089 238.998C144.076 236.095 137.531 235.544 132.272 235.089C130.078 234.918 127.789 234.709 126.465 234.406C124.97 234.045 123.135 233.248 121.168 232.413C116.95 230.61 111.691 228.352 104.862 228.352C98.0522 228.352 92.8124 230.591 88.613 232.413C86.6646 233.248 84.8297 234.045 83.3353 234.406C82.0111 234.728 79.7413 234.918 77.547 235.108C72.2882 235.544 65.7432 236.095 60.7682 238.998C55.7743 241.902 54.8473 245.698 54.1285 248.772C53.8069 250.044 53.4853 251.372 52.9368 252.15C52.3314 253.004 50.9883 254.086 49.5507 255.225C47.3942 256.933 43.9514 254.466 42.6272 256.876C42.0597 257.92 42.6272 263.499 42.6272 264.695C42.6461 268.661 46.5431 271.717 49.6453 274.165C51.1019 275.304 52.4638 276.385 53.088 277.239C53.6555 278.018 53.9961 279.327 54.3176 280.617C55.0932 283.673 56.0578 287.469 61.0707 290.391C66.0835 293.314 72.6286 293.845 77.8873 294.282C80.0816 294.472 82.3706 294.661 83.6948 294.965C85.1892 295.326 87.0239 296.123 88.9912 296.958C93.2285 298.761 98.4872 301 105.297 301C112.107 301 117.347 298.761 121.546 296.939C123.495 296.104 125.33 295.307 126.824 294.965C128.167 294.642 130.418 294.453 132.631 294.263C137.89 293.826 144.416 293.276 149.41 290.353C154.404 287.431 155.331 283.654 156.069 280.599C156.371 279.308 156.693 277.999 157.242 277.22C157.847 276.347 159.209 275.285 160.646 274.146C163.73 271.698 167.589 268.642 167.57 264.695C167.57 264.201 167.683 256.8 167.57 256.344C166.775 253.08 163.276 257.388 160.533 255.244C159.095 254.105 157.714 253.023 157.09 252.169C156.542 251.391 156.201 250.082 155.879 248.791C155.104 245.736 154.12 241.94 149.107 239.036" fill="#3587FC"/>' +
      '<path d="M72.9291 275.056C71.8887 274.449 71.3779 272.437 70.9617 270.824C70.5077 269.04 69.997 267.009 68.6161 265.111C67.2163 263.138 65.0598 261.448 63.1682 259.968C61.6171 258.754 59.4796 257.065 59.4796 256.343C59.4796 255.603 61.5794 253.933 63.1306 252.718C65.0033 251.219 67.1408 249.53 68.5406 247.556C69.8837 245.659 70.3754 243.628 70.8105 241.844C71.2077 240.231 71.6996 238.2 72.7211 237.612C73.7425 237.024 77.2042 236.72 79.9849 236.492C83.0682 236.226 86.549 235.942 89.8215 235.145C93.2076 234.329 96.1016 233.095 98.6553 231.994C100.755 231.083 103.63 229.85 104.898 229.85C106.165 229.85 109.059 231.083 111.159 231.975C113.732 233.076 116.626 234.328 120.031 235.126C123.322 235.923 126.803 236.207 129.867 236.473C132.648 236.701 136.129 237.005 137.169 237.593C138.209 238.181 138.701 240.212 139.117 241.825C139.571 243.609 140.101 245.64 141.463 247.537C142.863 249.511 145.019 251.2 146.93 252.68C148.481 253.895 150.637 255.584 150.637 256.324C150.637 257.064 148.519 258.735 146.968 259.968C145.076 261.448 142.958 263.138 141.558 265.111C140.215 267.009 139.723 269.04 139.269 270.824C138.872 272.437 138.399 274.449 137.377 275.056C136.356 275.663 132.875 275.948 130.094 276.175C127.03 276.441 123.549 276.726 120.277 277.523C116.891 278.339 113.997 279.592 111.443 280.692C109.343 281.584 106.468 282.818 105.201 282.818C103.933 282.818 101.039 281.584 98.9202 280.673C96.3476 279.573 93.4345 278.339 90.0485 277.523C86.7571 276.745 83.2763 276.441 80.1929 276.175C77.4122 275.948 73.9317 275.644 72.9102 275.056M149.086 230.647C144.074 227.743 137.528 227.193 132.27 226.737C130.075 226.566 127.787 226.358 126.463 226.054C124.968 225.693 123.133 224.896 121.166 224.061C116.947 222.258 111.689 220 104.86 220C98.0501 220 92.8103 222.239 88.6109 224.061C86.6625 224.896 84.8275 225.693 83.3331 226.054C82.009 226.377 79.7391 226.566 77.5448 226.756C72.2861 227.193 65.741 227.743 60.766 230.647C55.7721 233.55 54.8452 237.346 54.1264 240.421C53.8048 241.692 53.4832 243.021 52.9346 243.799C52.3293 244.653 50.9862 245.734 49.5485 246.873C46.4652 249.321 42.6062 252.377 42.6251 256.324C42.644 260.291 46.5409 263.346 49.6432 265.794C51.0998 266.933 52.4616 268.015 53.0859 268.869C53.6534 269.647 53.9939 270.957 54.3155 272.247C55.0911 275.303 56.0557 279.098 61.0685 282.021C66.0814 284.925 72.6264 285.475 77.8852 285.911C80.0795 286.101 82.3685 286.291 83.6926 286.595C85.187 286.955 87.0218 287.752 88.9891 288.587C93.2264 290.39 98.4851 292.63 105.295 292.63C112.105 292.63 117.345 290.39 121.544 288.568C123.493 287.733 125.327 286.936 126.822 286.595C128.165 286.272 130.416 286.082 132.629 285.892C137.888 285.456 144.414 284.906 149.408 281.983C154.383 279.079 155.329 275.284 156.067 272.228C156.369 270.938 156.691 269.628 157.239 268.85C157.845 267.977 159.207 266.914 160.644 265.775C163.728 263.327 167.587 260.272 167.568 256.324C167.549 252.358 163.671 249.321 160.531 246.873C159.093 245.734 157.712 244.653 157.088 243.799C156.539 243.021 156.199 241.711 155.877 240.421C155.102 237.365 154.118 233.569 149.105 230.666" fill="#ADCFFF"/>' +
      '<path d="M139.253 236.377C138.156 235.731 134.448 235.428 131.497 235.181C128.224 234.896 124.517 234.593 121.017 233.758C117.404 232.885 114.302 231.575 111.578 230.398C109.346 229.43 106.263 228.121 104.919 228.121C103.576 228.121 100.493 229.43 98.2609 230.398C95.5369 231.556 92.4536 232.885 88.8405 233.758C85.3599 234.593 81.6523 234.896 78.3797 235.181C75.4099 235.428 71.7212 235.731 70.643 236.377C69.5648 237.022 69.035 239.166 68.5999 240.893C68.127 242.791 67.6164 244.955 66.1788 246.966C64.6844 249.073 62.4333 250.857 60.4281 252.451C58.7824 253.742 56.5312 255.526 56.5312 256.323C56.5312 257.101 58.8014 258.885 60.466 260.194C62.4901 261.788 64.7599 263.572 66.2732 265.679C67.7487 267.71 68.2974 269.854 68.7703 271.771C69.2054 273.498 69.7539 275.643 70.8511 276.288C71.9482 276.933 75.6369 277.237 78.6067 277.483C81.8793 277.749 85.6059 278.072 89.1054 278.907C92.6995 279.78 95.8018 281.108 98.5446 282.266C100.777 283.234 103.879 284.543 105.222 284.543C106.565 284.543 109.629 283.234 111.862 282.266C114.586 281.089 117.669 279.761 121.282 278.907C124.763 278.072 128.47 277.749 131.743 277.483C134.713 277.237 138.401 276.914 139.499 276.288C140.596 275.662 141.106 273.517 141.523 271.79C141.995 269.892 142.525 267.729 143.944 265.698C145.419 263.61 147.689 261.807 149.694 260.232C151.321 258.923 153.591 257.139 153.591 256.361C153.591 255.582 151.302 253.78 149.657 252.489C147.633 250.914 145.344 249.111 143.849 247.023C142.393 244.993 141.844 242.829 141.352 240.931C140.917 239.204 140.369 237.06 139.272 236.433" fill="#0F1114"/>' +
    '</g>' +
    '<path class="mylearning-zero-light" d="M147.827 253.242L210 0.660704L0 0L64.8141 253.242C64.8141 253.242 67.1966 277 106.32 277C145.444 277 147.827 253.242 147.827 253.242Z" fill="url(#mylearning-zero-gradient)"/>' +
    '<g class="mylearning-zero-coin">' +
      '<path d="M178.5 130.504L158.028 148.779L141.871 160.859L162.344 142.584L178.5 130.504Z" fill="black"/>' +
      '<path d="M88.8416 67.3026L68.3691 85.5781L80.3833 69.2755L100.856 51L88.8416 67.3026Z" fill="black"/>' +
      '<path d="M163.174 164.564L142.701 182.839L121.193 181.662L141.631 163.387L163.174 164.564Z" fill="black"/>' +
      '<path d="M68.1311 88.1392L47.6586 106.415L46.8301 84.4356L67.3025 66.1602L68.1311 88.1392Z" fill="#FFC22F"/>' +
      '<path d="M129.618 179.723L109.145 197.999L90.4336 184.119L110.906 165.844L129.618 179.723Z" fill="#FFC22F"/>' +
      '<path d="M65.4366 119.36L44.9642 137.635L31.5 118.494L51.9724 100.219L65.4366 119.36Z" fill="black"/>' +
      '<path d="M90.5695 170.38L70.1316 188.69L61.3281 167.334L81.8005 149.059L90.5695 170.38Z" fill="#FFC22F"/>' +
      '<path d="M110.905 165.844L90.4326 184.119L70.1328 188.688L90.5707 170.378L110.905 165.844Z" fill="black"/>' +
      '<path d="M60.8793 140.058L40.4414 158.333L44.964 137.635L65.4364 119.359L60.8793 140.058Z" fill="#FFC22F"/>' +
      '<path d="M81.8005 149.058L61.3281 167.333L40.4414 158.334L60.8793 140.059L81.8005 149.058Z" fill="black"/>' +
      '<path d="M139.869 60.3454L148.673 81.6322L169.525 90.6661L165.037 111.33L178.501 130.505L162.344 142.585L163.173 164.564L141.63 163.387L129.616 179.725L110.904 165.845L90.5699 170.379L81.8009 149.058L60.8797 140.058L65.4368 119.36L51.9727 100.219L68.1296 88.1394L67.3011 66.1603L88.8437 67.3026L100.858 51L119.57 64.9143L139.869 60.3454Z" fill="#F07600"/>' +
    '</g>' +
    '<defs>' +
      '<linearGradient id="mylearning-zero-gradient" x1="105" y1="21" x2="105" y2="417" gradientUnits="userSpaceOnUse">' +
        '<stop offset="0.15" stop-color="#F28100" stop-opacity="0"/>' +
        '<stop offset="1" stop-color="#FFC936"/>' +
      '</linearGradient>' +
    '</defs>' +
  '</svg>';

  function renderSkillsZeroState(container) {
    container.innerHTML =
      '<div class="mylearning-skills-zero">' +
        '<div class="mylearning-skills-zero-icon">' + ZERO_STATE_SVG + '</div>' +
        '<div class="mylearning-skills-zero-text">' +
          '<h2 class="mylearning-skills-zero-title">Your first Skill Point is waiting</h2>' +
          '<p class="mylearning-skills-zero-body">Earn Skill Points (XP) by completing course items. Activities like labs and assessments earn more because they actively help you measure your skills progress</p>' +
        '</div>' +
      '</div>';
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
    { name: 'Data Integrity & Literacy', points: _mlXpMax, total: _mlXpMax }
  ];

  function renderSkillAccordions(container) {
    var skills = EXTRA_SKILLS.concat(getSkillProgress());
    var html = skills.map(function(skill, idx) {
      return ‘<div class="skill-accordion" data-skill-idx="’ + idx + ‘">’ +
        ‘<div class="skill-accordion-trigger">’ +
          ‘<span class="skill-accordion-name cds-subtitle-md">’ + skill.name + ‘</span>’ +
          ‘<span class="skill-accordion-xp cds-body-secondary" style="color:var(--cds-color-neutral-primary-weak)">’ + skill.points + ‘/’ + skill.total + ‘ XP</span>’ +
        ‘</div>’ +
      ‘</div>’;
    }).join(‘’);

    var feedbackHtml = ‘<div class="mylearning-skills-feedback-row"><a href="https://forms.gle/placeholder" target="_blank" rel="noopener" class="mylearning-skills-feedback-btn cds-action-secondary">Provide feedback</a></div>’;

    var paginationHtml = ‘<div class="mylearning-pagination" role="navigation" aria-label="Skills pagination">’ +
        ‘<div class="mylearning-pagination-select-wrap">’ +
          ‘<button type="button" class="mylearning-pagination-select" id="mylearning-pagination-select-trigger" aria-haspopup="listbox" aria-expanded="false">’ +
            ‘<span class="mylearning-pagination-select-label">Show:</span>’ +
            ‘<span class="mylearning-pagination-select-value" id="mylearning-pagination-select-value">16 results per page</span>’ +
            ‘<span class="material-symbols-rounded mylearning-pagination-chevron">expand_more</span>’ +
          ‘</button>’ +
          ‘<ul class="mylearning-pagination-select-menu" id="mylearning-pagination-select-menu" role="listbox" aria-label="Results per page">’ +
            ‘<li class="mylearning-pagination-select-option is-selected" role="option" aria-selected="true" data-value="16">16 results per page</li>’ +
            ‘<li class="mylearning-pagination-select-option" role="option" aria-selected="false" data-value="32">32 results per page</li>’ +
            ‘<li class="mylearning-pagination-select-option" role="option" aria-selected="false" data-value="64">64 results per page</li>’ +
          ‘</ul>’ +
        ‘</div>’ +
        ‘<div class="mylearning-pagination-pages">’ +
          ‘<button type="button" class="mylearning-pagination-icon" aria-label="Previous page">’ +
            ‘<span class="material-symbols-rounded">chevron_left</span>’ +
          ‘</button>’ +
          ‘<button type="button" class="mylearning-pagination-num">1</button>’ +
          ‘<button type="button" class="mylearning-pagination-num is-active" aria-current="page">2</button>’ +
          ‘<button type="button" class="mylearning-pagination-num">3</button>’ +
          ‘<button type="button" class="mylearning-pagination-num">4</button>’ +
          ‘<button type="button" class="mylearning-pagination-num">5</button>’ +
          ‘<button type="button" class="mylearning-pagination-ellipsis" aria-label="More pages">’ +
            ‘<span class="material-symbols-rounded">more_horiz</span>’ +
          ‘</button>’ +
          ‘<button type="button" class="mylearning-pagination-num">222</button>’ +
          ‘<button type="button" class="mylearning-pagination-icon" aria-label="Next page">’ +
            ‘<span class="material-symbols-rounded">chevron_right</span>’ +
          ‘</button>’ +
        ‘</div>’ +
      ‘</div>’;

    container.innerHTML =
      ‘<h2 class="mylearning-skills-header cds-subtitle-lg">Skills you’ve made progress in</h2>’ +
      ‘<div class="skill-accordions-list">’ + html + ‘</div>’ +
      feedbackHtml +
      paginationHtml;
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

  window.MlRerenderSkillsTab = function() {
    var c = document.getElementById('skills-cards-container');
    if (c) renderSkillsTab(c);
  };

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
          return;
        }

        var trigger = e.target.closest('#mylearning-pagination-select-trigger');
        if (trigger) {
          e.stopPropagation();
          var wrap = trigger.closest('.mylearning-pagination-select-wrap');
          if (wrap) {
            var open = wrap.classList.toggle('is-open');
            trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
          }
          return;
        }

        var option = e.target.closest('.mylearning-pagination-select-option');
        if (option) {
          var menu = option.closest('.mylearning-pagination-select-menu');
          var valueEl = document.getElementById('mylearning-pagination-select-value');
          var trig = document.getElementById('mylearning-pagination-select-trigger');
          var wrap2 = option.closest('.mylearning-pagination-select-wrap');
          if (menu) {
            menu.querySelectorAll('.mylearning-pagination-select-option').forEach(function(o) {
              o.classList.remove('is-selected');
              o.setAttribute('aria-selected', 'false');
            });
          }
          option.classList.add('is-selected');
          option.setAttribute('aria-selected', 'true');
          if (valueEl) valueEl.textContent = option.textContent;
          if (wrap2) wrap2.classList.remove('is-open');
          if (trig) trig.setAttribute('aria-expanded', 'false');
        }
      });

      document.addEventListener('click', function(e) {
        var wrap = document.querySelector('.mylearning-pagination-select-wrap.is-open');
        if (wrap && !wrap.contains(e.target)) {
          wrap.classList.remove('is-open');
          var t = document.getElementById('mylearning-pagination-select-trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
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
      openModal();
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
