/**
 * Lecture page - main application logic
 */

function hideCourseIntroModal() {
  var modal = document.getElementById('course-intro-modal');
  if (modal) {
    modal.classList.add('is-hidden');
    modal.setAttribute('aria-hidden', 'true');
  }
}

function toggleSidebar() {
  if (window.innerWidth < 1024) {
    var open = document.body.classList.toggle('sidebar-overlay-open');
    var btn = document.getElementById('header-menu-btn');
    var backdrop = document.getElementById('sidebar-backdrop');
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (backdrop) backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
  } else {
    var sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
  }
}

function closeSidebarOverlay() {
  document.body.classList.remove('sidebar-overlay-open');
  var btn = document.getElementById('header-menu-btn');
  var backdrop = document.getElementById('sidebar-backdrop');
  if (btn) btn.setAttribute('aria-expanded', 'false');
  if (backdrop) backdrop.setAttribute('aria-hidden', 'true');
}

function toggleModule(header) {
  const content = header.nextElementSibling;
  const chevron = header.querySelector('.module-chevron');
  content.classList.toggle('collapsed');
  chevron.classList.toggle('expanded', !content.classList.contains('collapsed'));
}

function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
  document.getElementById('tab-' + tabId).classList.add('active');
  document.getElementById('panel-' + tabId).classList.add('active');
}

/* Video end modal - matches MainContent.tsx from reference */
var videoEndModalTriggered = false;
var videoEndCountdownInterval = null;
var videoEndCountdownValue = 5;
var videoEndCountdownPaused = false;
var videoEndNextItemTitle = 'Next item';
var skillProgress = {}; /* { skillName: xp } - cumulative per skill */
try {
  var stored = localStorage.getItem('m1-skills-skill-progress');
  if (stored) skillProgress = JSON.parse(stored);
} catch (e) {}

var SESSION_XP_KEY = 'm1-skills-session-xp';
var EXP4_XP_GOAL = 100;

function isExperiment4() {
  var exp = sessionStorage.getItem('proto-experiment') || '1';
  return exp === '4';
}

/* XP tracker always visible in sidebar */
function applyXpTrackerVisibility() {
  var tracker = document.getElementById('sidebar-xp-tracker');
  if (tracker) tracker.style.display = '';
}

function getSessionXp() {
  try {
    var v = sessionStorage.getItem(SESSION_XP_KEY);
    return v != null ? parseInt(v, 10) : 0;
  } catch (e) { return 0; }
}

function addSessionXp(amount) {
  if (!amount || amount < 0) return;
  var total = getSessionXp() + amount;
  try {
    sessionStorage.setItem(SESSION_XP_KEY, String(total));
    updateSessionXpDisplay();
    if (isExperiment4()) syncProgressToNextGoal();
  } catch (e) {}
}

function updateSessionXpDisplay() {
  var el = document.getElementById('sidebar-xp-value');
  var currentXp = getSessionXp();
  var isStrictExp4 = (sessionStorage.getItem('proto-experiment') || '1') === '4';
  if (el) {
    if (isStrictExp4) {
      el.textContent = currentXp + '/' + EXP4_XP_GOAL;
    } else {
      el.textContent = currentXp;
    }
  }
  if (isStrictExp4) {
    var labelEl = document.querySelector('.sidebar-xp-tracker-label');
    if (labelEl) labelEl.textContent = "Today's Goal";
  }
}

function getNextLectureItem() {
  var all = getAllLectureItems();
  var idx = all.findIndex(function(item) { return item.classList.contains('active'); });
  if (idx === -1 || idx + 1 >= all.length) return null;
  return all[idx + 1];
}

function getItemTypeIcon(type) {
  var icons = { Video: 'play_circle', Reading: 'menu_book', Activity: 'tune', Practice: 'quiz', Assignment: 'edit_note' };
  return icons[type] || 'play_circle';
}

function parseLectureMeta(metaEl) {
  if (!metaEl || !metaEl.textContent) return { type: 'Item' };
  var parts = metaEl.textContent.trim().split(/\s*·\s*/);
  return { type: parts[0] || 'Item' };
}

function triggerVideoEndModal() {
  var modal = document.getElementById('video-end-modal');
  var player = document.getElementById('video-player');
  if (!modal || !player) return;
  if (videoEndModalTriggered) return;

  videoEndModalTriggered = true;
  videoEndCountdownValue = 5;
  videoEndCountdownPaused = false;

  var activeItem = document.querySelector('.lecture-item.active');
  if (!activeItem) return;

  var lessonId = activeItem.getAttribute('data-lesson-id');
  var tags = getLessonSkillTags(lessonId);
  var skillName = tags[0] || 'Skill Progress';
  var xp = getSkillPointsFromItem(activeItem);
  var currentSkillXP = skillProgress[skillName] || 0;
  var newSkillXP = Math.min(currentSkillXP + xp, SKILL_XP_MAX);
  skillProgress[skillName] = newSkillXP;
  try {
    localStorage.setItem('m1-skills-skill-progress', JSON.stringify(skillProgress));
  } catch (e) {}
  addSessionXp(xp);

  var startPct = (currentSkillXP / SKILL_XP_MAX) * 100;
  var targetPct = (newSkillXP / SKILL_XP_MAX) * 100;

  document.getElementById('video-end-skill-name').textContent = skillName;
  document.getElementById('video-end-xp-tag').textContent = '+' + xp;
  document.getElementById('video-end-progress-label').textContent = newSkillXP + '/' + SKILL_XP_MAX + ' XP';

  var progressFill = document.getElementById('video-end-progress-fill');
  progressFill.setAttribute('data-progress', targetPct);
  progressFill.setAttribute('data-start', startPct);
  progressFill.style.width = startPct + '%';

  var skillCard = document.getElementById('video-end-skill-card');
  var xpTag = document.getElementById('video-end-xp-tag');
  skillCard.classList.remove('card-visible');
  xpTag.classList.remove('xp-tag-visible');

  var nextItem = getNextLectureItem();
  var nextTitleEl = document.getElementById('video-end-next-title');
  if (nextItem) {
    var nextTitle = nextItem.querySelector('.lecture-title');
    videoEndNextItemTitle = nextTitle ? nextTitle.textContent : 'Next item';
    var meta = parseLectureMeta(nextItem.querySelector('.lecture-meta'));
    var typeEl = document.getElementById('video-end-item-type-text');
    var iconEl = document.getElementById('video-end-item-icon');
    if (typeEl) typeEl.textContent = meta.type;
    if (iconEl) iconEl.textContent = getItemTypeIcon(meta.type);
  } else {
    videoEndNextItemTitle = 'Next item';
  }
  if (nextTitleEl) nextTitleEl.textContent = videoEndNextItemTitle + ' starts in ' + videoEndCountdownValue + 's';

  /* First completion: show the big XP intro modal instead of video-end modal */
  if (!sessionStorage.getItem('m1-skills-xp-intro-shown')) {
    sessionStorage.setItem('m1-skills-xp-intro-shown', 'true');
    var statusEl = activeItem.querySelector('.lecture-status');
    if (statusEl && statusEl.classList.contains('pending')) {
      statusEl.classList.remove('pending');
      statusEl.classList.add('completed');
      statusEl.innerHTML = COMPLETED_SVG;
      var cnt = getCompletedLearningItemsCount();
      updateProgressDisplay(cnt, { justCompletedPracticeItem: isAssignmentType(activeItem) });
    }
    videoEndModalTriggered = false;
    showXpIntroModal();
    return;
  }

  var statusEl = activeItem.querySelector('.lecture-status');
  if (statusEl && statusEl.classList.contains('pending')) {
    statusEl.classList.remove('pending');
    statusEl.classList.add('completed');
    statusEl.innerHTML = COMPLETED_SVG;
    var cnt = getCompletedLearningItemsCount();
    updateProgressDisplay(cnt, { justCompletedPracticeItem: isAssignmentType(activeItem) });
  }

  if (typeof playRetroCoinSound === 'function') playRetroCoinSound();

  modal.classList.add('is-visible');
  modal.setAttribute('aria-hidden', 'false');

  setTimeout(function() {
    skillCard.classList.add('card-visible');
    setTimeout(function() {
      xpTag.classList.add('xp-tag-visible');
      setTimeout(function() {
        progressFill.style.width = targetPct + '%';
        if (typeof playFillingSound === 'function') playFillingSound(targetPct);
      }, 500);
    }, 400);
  }, 100);

  videoEndCountdownInterval = setInterval(function() {
    if (videoEndCountdownPaused) return;
    videoEndCountdownValue--;
    var el = document.getElementById('video-end-next-title');
    if (el) el.textContent = videoEndNextItemTitle + ' starts in ' + videoEndCountdownValue + 's';
    if (videoEndCountdownValue <= 0) {
      clearInterval(videoEndCountdownInterval);
      videoEndCountdownInterval = null;
      hideVideoEndModalAndGoNext();
    }
  }, 1000);
}

function hideVideoEndModalAndGoNext() {
  var modal = document.getElementById('video-end-modal');
  if (videoEndCountdownInterval) {
    clearInterval(videoEndCountdownInterval);
    videoEndCountdownInterval = null;
  }
  videoEndModalTriggered = false;
  if (modal) {
    modal.classList.remove('is-visible');
    modal.setAttribute('aria-hidden', 'true');
  }
  if (document.fullscreenElement) document.exitFullscreen();
  goToNextItem();
}

function hideVideoEndModal() {
  var modal = document.getElementById('video-end-modal');
  if (videoEndCountdownInterval) {
    clearInterval(videoEndCountdownInterval);
    videoEndCountdownInterval = null;
  }
  videoEndModalTriggered = false;
  if (modal) {
    modal.classList.remove('is-visible');
    modal.setAttribute('aria-hidden', 'true');
  }
}

function toggleVideoEndCountdownPause() {
  videoEndCountdownPaused = !videoEndCountdownPaused;
  var btn = document.getElementById('video-end-btn-pause');
  if (btn) btn.textContent = videoEndCountdownPaused ? 'Resume' : 'Pause';
}

function initVideoPlayer() {
  var player = document.getElementById('video-player');
  if (!player) return;

  player.addEventListener('ended', function() {
    if (getNextLectureItem()) triggerVideoEndModal();
  });

  document.getElementById('video-end-btn-next') && document.getElementById('video-end-btn-next').addEventListener('click', hideVideoEndModalAndGoNext);
  document.getElementById('video-end-btn-pause') && document.getElementById('video-end-btn-pause').addEventListener('click', toggleVideoEndCountdownPause);
}

function toggleProgressDropdown() {
  const wrapper = document.querySelector('.progress-tracker-wrapper');
  const tracker = document.getElementById('progress-tracker');
  wrapper.classList.toggle('open');
  tracker.setAttribute('aria-expanded', wrapper.classList.contains('open'));
}

const COMPLETED_SVG = '<svg viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 19.17A9.17 9.17 0 1010 .83a9.17 9.17 0 000 18.33zm3.6-12.31l-5.3 5.3-2.22-2.23a.6.6 0 00-.89.26.64.64 0 00.18.45l2.69 2.69a.6.6 0 00.87-.19l5.73-5.75a.6.6 0 00-.18-.44.6.6 0 00-.44-.19.6.6 0 00-.44.19z" fill="currentColor"/></svg>';

function getCompleteStarSvg() {
  const id = 'paint0_linear_complete_star_' + Date.now();
  return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="12" fill="#F9F5FF"/><path d="M12.0024 16.8764L7.90242 19.3264C7.71909 19.4264 7.53992 19.468 7.36492 19.4514C7.18992 19.4347 7.03576 19.3764 6.90242 19.2764C6.76909 19.1764 6.66909 19.0389 6.60242 18.8639C6.53576 18.6889 6.52742 18.5097 6.57742 18.3264L7.65242 13.7514L4.02742 10.6764C3.87742 10.543 3.78576 10.3889 3.75242 10.2139C3.71909 10.0389 3.72742 9.86803 3.77742 9.70137C3.82742 9.5347 3.91909 9.3972 4.05242 9.28887C4.18576 9.18053 4.35242 9.11803 4.55242 9.10137L9.30242 8.67637L11.1774 4.32637C11.2608 4.14303 11.3774 4.00553 11.5274 3.91387C11.6774 3.8222 11.8358 3.77637 12.0024 3.77637C12.1691 3.77637 12.3274 3.8222 12.4774 3.91387C12.6274 4.00553 12.7441 4.14303 12.8274 4.32637L14.7024 8.70137L19.4524 9.10137C19.6524 9.11803 19.8191 9.1847 19.9524 9.30137C20.0858 9.41803 20.1774 9.5597 20.2274 9.72637C20.2774 9.89303 20.2816 10.0597 20.2399 10.2264C20.1983 10.393 20.1024 10.543 19.9524 10.6764L16.3524 13.7514L17.4274 18.3264C17.4774 18.5097 17.4691 18.6889 17.4024 18.8639C17.3358 19.0389 17.2358 19.1764 17.1024 19.2764C16.9691 19.3764 16.8149 19.4347 16.6399 19.4514C16.4649 19.468 16.2858 19.4264 16.1024 19.3264L12.0024 16.8764Z" fill="url(#' + id + ')"/><defs><linearGradient id="' + id + '" x1="3.72367" y1="11.6157" x2="20.279" y2="11.8191" gradientUnits="userSpaceOnUse"><stop stop-color="#A678F5"/><stop offset="0.99" stop-color="#4A0FAB"/></linearGradient></defs></svg>';
}

function getLearningItemsGoal() {
  if (typeof window.GoalsStore !== 'undefined' && typeof window.GoalsStore.getLearningItemsGoal === 'function') {
    return window.GoalsStore.getLearningItemsGoal();
  }
  var seg = (typeof getSegment === 'function') ? getSegment() : (sessionStorage.getItem('m1-skills-segment') || 'active');
  return seg === 'new' ? 3 : 8;
}

function isNewLearnerSegment() {
  var seg = (typeof getSegment === 'function') ? getSegment() : (sessionStorage.getItem('m1-skills-segment') || 'active');
  return seg === 'new';
}

let toastTimeout = null;
let itemsToastShown = false;
let practiceToastShown = false;
let coachToastShown = false;
let goalsCompleteDialogShown = false;
var moduleCompleteDialogShown = false;

let goal1Complete = false;
let goal2Complete = false;
let goal3Complete = false;

var assignmentGrades = {};

function getCompletedLearningItemsCount() {
  return getAllLectureItems().filter((item) => {
    const s = item.querySelector('.lecture-status');
    return s && s.classList.contains('completed');
  }).length;
}

function syncProgressToNextGoal() {
  var stored = (typeof window.GoalsStore !== 'undefined' && window.GoalsStore.get) ? window.GoalsStore.get() : null;
  var storedCount = stored && stored.learningItemsCompleted != null ? stored.learningItemsCompleted : getCompletedLearningItemsCount();
  const completedCount = storedCount;
  const goal = getLearningItemsGoal();
  const capped = Math.min(completedCount, goal);
  const progressTextEl = document.querySelector('.progress-text');
  const progressBar = document.querySelector('.header-progress-bar');
  const goalEl = document.getElementById('progress-goal-learning-items');
  const goal2El = document.getElementById('progress-goal-practice');
  const goal3El = document.getElementById('progress-goal-coach');
  const isNew = isNewLearnerSegment();
  const isExp4 = isExperiment4();

  /* Show/hide multi-goal UI based on segment */
  document.querySelectorAll('.progress-star-multi').forEach(function(el) { el.style.display = isNew ? 'none' : ''; });
  document.querySelectorAll('.progress-goal-multi').forEach(function(el) { el.style.display = isNew ? 'none' : ''; });

  if (isExp4) {
    var currentXp = getSessionXp();
    var xpCapped = Math.min(currentXp, EXP4_XP_GOAL);
    var xpPct = (xpCapped / EXP4_XP_GOAL) * 100;

    if (!goal1Complete) {
      progressTextEl.textContent = xpCapped + '/' + EXP4_XP_GOAL + ' XP earned';
      if (progressBar) progressBar.classList.remove('progress-bar-hidden');
      if (goalEl) goalEl.textContent = 'Earn ' + EXP4_XP_GOAL + ' XP - ' + xpCapped + '/' + EXP4_XP_GOAL;
      var fillEl = document.querySelector('.header-progress-bar-fill');
      if (fillEl) {
        fillEl.style.width = xpPct + '%';
        fillEl.classList.remove('progress-fill-animate');
        void fillEl.offsetWidth;
        fillEl.classList.add('progress-fill-animate');
      }
      if (xpCapped >= EXP4_XP_GOAL) {
        goal1Complete = true;
        var completeSvg = getCompleteStarSvg();
        var star1 = document.getElementById('progress-star-1');
        if (star1) {
          star1.classList.remove('fade-in-star');
          star1.innerHTML = completeSvg;
          void star1.offsetWidth;
          star1.classList.add('fade-in-star');
        }
        var dropdownStars = document.querySelectorAll('.progress-tracker-dropdown-item .progress-tracker-dropdown-star');
        if (dropdownStars[0]) dropdownStars[0].outerHTML = completeSvg.replace('<svg ', '<svg class="progress-tracker-dropdown-star" ');
      }
    } else if (!goal2Complete) {
      progressTextEl.textContent = 'Complete 1 practice item';
      if (progressBar) progressBar.classList.add('progress-bar-hidden');
      if (goal2El) goal2El.textContent = goal2Complete ? 'Complete 1 practice item - ✓' : 'Complete 1 practice item';
    } else if (!goal3Complete) {
      progressTextEl.textContent = 'Use Coach';
      if (progressBar) progressBar.classList.add('progress-bar-hidden');
      if (goal3El) goal3El.textContent = goal3Complete ? 'Use Coach - ✓' : 'Use Coach';
    } else {
      progressTextEl.textContent = 'All goals complete!';
      if (progressBar) progressBar.classList.add('progress-bar-hidden');
    }
    if (goalEl && goal1Complete) goalEl.textContent = 'Earn ' + EXP4_XP_GOAL + ' XP - ✓';
    if (goal2El) goal2El.textContent = goal2Complete ? 'Complete 1 practice item - ✓' : 'Complete 1 practice item';
    if (goal3El) goal3El.textContent = goal3Complete ? 'Use Coach - ✓' : 'Use Coach';
    return;
  }

  if (isNew) {
    if (!goal1Complete) {
      progressTextEl.textContent = capped + '/' + goal + ' learning items';
      if (progressBar) progressBar.classList.remove('progress-bar-hidden');
      if (goalEl) goalEl.textContent = 'Complete any ' + goal + ' learning items - ' + capped + '/' + goal;
      const pct = (capped / goal) * 100;
      const fillEl = document.querySelector('.header-progress-bar-fill');
      if (fillEl) {
        fillEl.style.width = pct + '%';
        fillEl.classList.remove('progress-fill-animate');
        void fillEl.offsetWidth;
        fillEl.classList.add('progress-fill-animate');
      }
    } else {
      progressTextEl.textContent = 'All goals complete!';
      if (progressBar) progressBar.classList.add('progress-bar-hidden');
    }
  } else {
    if (!goal1Complete) {
      progressTextEl.textContent = capped + '/' + goal + ' learning items';
      if (progressBar) progressBar.classList.remove('progress-bar-hidden');
      if (goalEl) goalEl.textContent = 'Complete any ' + goal + ' learning items - ' + capped + '/' + goal;
      const pct = (capped / goal) * 100;
      const fillEl = document.querySelector('.header-progress-bar-fill');
      if (fillEl) {
        fillEl.style.width = pct + '%';
        fillEl.classList.remove('progress-fill-animate');
        void fillEl.offsetWidth;
        fillEl.classList.add('progress-fill-animate');
      }
    } else if (!goal2Complete) {
      progressTextEl.textContent = 'Complete 1 practice item';
      if (progressBar) progressBar.classList.add('progress-bar-hidden');
      if (goal2El) goal2El.textContent = goal2Complete ? 'Complete 1 practice item - ✓' : 'Complete 1 practice item';
    } else if (!goal3Complete) {
      progressTextEl.textContent = 'Use Coach';
      if (progressBar) progressBar.classList.add('progress-bar-hidden');
      if (goal3El) goal3El.textContent = goal3Complete ? 'Use Coach - ✓' : 'Use Coach';
    } else {
      progressTextEl.textContent = 'All goals complete!';
      if (progressBar) progressBar.classList.add('progress-bar-hidden');
    }
    if (goal2El) goal2El.textContent = goal2Complete ? 'Complete 1 practice item - ✓' : 'Complete 1 practice item';
    if (goal3El) goal3El.textContent = goal3Complete ? 'Use Coach - ✓' : 'Use Coach';
  }
}

function getAllLectureItems() {
  return Array.from(document.querySelectorAll('.lecture-item'));
}

function parseDurationToDisplay(metaText) {
  if (!metaText) return '0:00';
  const secMatch = metaText.match(/(\d+)\s*sec/);
  const minMatch = metaText.match(/(\d+)\s*min/);
  const hourMatch = metaText.match(/(\d+)\s*h/);
  if (hourMatch) {
    const h = parseInt(hourMatch[1], 10);
    const mins = h * 60;
    return mins + ':00';
  }
  if (minMatch) return minMatch[1] + ':00';
  if (secMatch) return '0:' + secMatch[1].padStart(2, '0');
  return '0:00';
}

function isAssignmentType(item) {
  const meta = item && item.querySelector('.lecture-meta');
  if (!meta) return false;
  const text = meta.textContent || '';
  return /Practice|Assignment/i.test(text) || item.hasAttribute('data-practice-item');
}

function isReadingType(item) {
  const meta = item && item.querySelector('.lecture-meta');
  if (!meta) return false;
  return /Reading/i.test(meta.textContent || '');
}

var LESSON_SKILL_TAGS = {
  'm1-l1': ['Visualizing and Reporting Clean Data'],
  'm1-l2': ['Visualizing and Reporting Clean Data'],
  'm1-l3': ['Visualizing and Reporting Clean Data'],
  'm1-l4': ['Visualizing and Reporting Clean Data'],
  'm1-l5': ['Visualizing and Reporting Clean Data'],
  'm1-l6': ['Visualizing and Reporting Clean Data'],
  'm1-l7': ['Visualizing and Reporting Clean Data'],
  'm1-l8': ['Visualizing and Reporting Clean Data'],
  'm1-l9': ['Visualizing and Reporting Clean Data'],
  'm1-l10': ['Visualizing and Reporting Clean Data'],
  'm1-l11': ['Visualizing and Reporting Clean Data', 'Preparing and Cleaning Data']
};

function getLessonSkillTags(lessonId) {
  return LESSON_SKILL_TAGS[lessonId] || ['Visualizing and Reporting Clean Data'];
}

function getSkillPointsFromItem(item) {
  var meta = item && item.querySelector('.lecture-meta');
  if (!meta) return 30;
  var text = (meta.textContent || '').toLowerCase();
  var mins = 0;
  var hourMatch = text.match(/(\d+)\s*h/);
  var minMatch = text.match(/(\d+)\s*min/);
  if (hourMatch) mins = parseInt(hourMatch[1], 10) * 60;
  if (minMatch) mins += parseInt(minMatch[1], 10);

  if (/video|reading/.test(text)) {
    if (mins <= 3) return 8;
    if (mins <= 6) return 10;
    return 12;
  }
  if (/graded/.test(text)) return 50;
  if (/practice|assignment|activity/.test(text)) {
    if (mins <= 10) return 30;
    if (mins <= 30) return 40;
    return 50;
  }
  return 30;
}

function updateSkillTags(item, contentTagsEl, readingTagsEl) {
  var lessonId = item.getAttribute('data-lesson-id');
  var tags = lessonId ? getLessonSkillTags(lessonId) : ['Visualizing and Reporting Clean Data'];
  var xp = getSkillPointsFromItem(item);
  var html = tags.map(function(t) {
    return '<span class="cds-tag cds-tag--emphasis-tertiary-xweak skill-tag">' +
      '<span class="skill-tag-xp">' + xp + ' XP</span>' +
      '<span class="skill-tag-sep"> • </span>' +
      '<span class="skill-tag-name">' + t + '</span>' +
      '</span>';
  }).join('');
  if (contentTagsEl) contentTagsEl.innerHTML = html;
  if (readingTagsEl) readingTagsEl.innerHTML = html;
}

function updateMainContent(item) {
  const title = item.querySelector('.lecture-title');
  const meta = item.querySelector('.lecture-meta');
  const contentArea = document.querySelector('.content-area');
  const isAssignment = isAssignmentType(item);
  const isReading = isReadingType(item);

  /* Reset video end modal when switching lessons */
  if (videoEndCountdownInterval) {
    clearInterval(videoEndCountdownInterval);
    videoEndCountdownInterval = null;
  }
  videoEndModalTriggered = false;
  var vModal = document.getElementById('video-end-modal');
  if (vModal && vModal.classList.contains('is-visible')) {
    vModal.classList.remove('is-visible');
    vModal.setAttribute('aria-hidden', 'true');
  }

  updateSkillTags(item, document.getElementById('content-skill-tags'), document.getElementById('reading-skill-tags'));

  if (contentArea) {
    contentArea.classList.remove('content-type-assignment', 'content-type-video', 'content-type-reading');
    if (isAssignment) {
      contentArea.classList.add('content-type-assignment');
    } else if (isReading) {
      contentArea.classList.add('content-type-reading');
    } else {
      contentArea.classList.add('content-type-video');
    }
  }

  if (title) {
    const titleEl = document.querySelector('.video-title');
    if (titleEl) titleEl.textContent = title.textContent;
  }
  if (meta) {
    /* Video uses native controls - no custom time display */
  }

  /* Reset video when switching to video item */
  if (!isAssignment && !isReading) {
    var player = document.getElementById('video-player');
    if (player) {
      player.currentTime = 0;
    }
  }

  if (isAssignment) {
    updateGradeBox(item);
  }

  if (isReading) {
    var readMeta = document.querySelector('.reading-meta');
    if (readMeta && meta) {
      var m = meta.textContent.match(/(\d+)\s*min/);
      readMeta.textContent = m ? m[1] + ' min read' : 'read';
    }
    var readingTitle = document.querySelector('.reading-content-title');
    if (readingTitle && title) readingTitle.textContent = title.textContent;
    var def = document.getElementById('reading-complete-default');
    var done = document.getElementById('reading-complete-done');
    if (def && done) {
      var statusEl = item.querySelector('.lecture-status');
      if (statusEl && statusEl.classList.contains('completed')) {
        def.style.display = 'none';
        done.style.display = 'block';
      } else {
        def.style.display = 'block';
        done.style.display = 'none';
      }
    }
  }
}

function updateGradeBox(item) {
  var gradeBox = document.querySelector('.grade-box');
  var valueEl = document.querySelector('.grade-box-value');
  var textEl = document.querySelector('.grade-box-text');
  if (!gradeBox || !valueEl || !textEl) return;

  var title = item && item.querySelector('.lecture-title');
  var key = title ? title.textContent.trim() : '';
  var score = assignmentGrades[key];

  if (score != null) {
    gradeBox.classList.add('grade-box-scored');
    valueEl.textContent = score + '%';
    textEl.textContent = 'Your latest: ' + score + '% • Your highest: ' + score + '% • We keep your highest score. These grades will not affect your overall skill progress.';
  } else {
    gradeBox.classList.remove('grade-box-scored');
    valueEl.textContent = '--';
    textEl.textContent = "You haven't submitted this yet. We keep your highest score. These grades will not affect your overall skill progress.";
  }
}

function showGoalsCompleteDialog() {
  var _exp = sessionStorage.getItem('proto-experiment') || '1';
  if (_exp === '1' || _exp === '2' || _exp === '3') return;
  if (goalsCompleteDialogShown) return;
  goalsCompleteDialogShown = true;

  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }

  const modal = document.getElementById('goals-complete-modal');
  if (!modal) return;

  var newEl = document.getElementById('goals-complete-new');
  var activeEl = document.getElementById('goals-complete-active');
  var dialog = modal.querySelector('.goals-complete-dialog');
  var isNew = isNewLearnerSegment();

  if (isNew) {
    if (newEl) newEl.style.display = '';
    if (activeEl) activeEl.style.display = 'none';
    if (dialog) dialog.classList.remove('goals-complete-dialog-active');
    modal.setAttribute('aria-labelledby', 'goals-complete-title');
  } else {
    if (newEl) newEl.style.display = 'none';
    if (activeEl) activeEl.style.display = '';
    if (dialog) dialog.classList.add('goals-complete-dialog-active');
    modal.setAttribute('aria-labelledby', 'goals-complete-title-active');
    populateAndAnimateGoalsCompleteSkills();
  }

  modal.classList.add('is-visible');
  modal.setAttribute('aria-hidden', 'false');
  if (typeof playCelebrationSound === 'function') playCelebrationSound();
}

var goalsCompleteSkillIndex = 0;
var goalsCompleteSkillsList = [];

function goalsCompletePrevSkill() {
  if (goalsCompleteSkillsList.length <= 1) return;
  goalsCompleteSkillIndex = goalsCompleteSkillIndex > 0 ? goalsCompleteSkillIndex - 1 : goalsCompleteSkillsList.length - 1;
  updateGoalsCompletePagination();
}

function goalsCompleteNextSkill() {
  if (goalsCompleteSkillsList.length <= 1) return;
  goalsCompleteSkillIndex = goalsCompleteSkillIndex < goalsCompleteSkillsList.length - 1 ? goalsCompleteSkillIndex + 1 : 0;
  updateGoalsCompletePagination();
}

function updateGoalsCompletePagination() {
  var cards = document.querySelectorAll('#goals-complete-skills-grid .feedback-skill-card');
  var indicator = document.getElementById('goals-complete-page-indicator');
  if (indicator && goalsCompleteSkillsList.length > 0) indicator.textContent = (goalsCompleteSkillIndex + 1) + ' / ' + goalsCompleteSkillsList.length;
  cards.forEach(function(c, i) {
    c.classList.toggle('goals-skill-active', i === goalsCompleteSkillIndex);
  });
}

function populateAndAnimateGoalsCompleteSkills() {
  var skills = [];
  for (var name in skillProgress) {
    if (skillProgress.hasOwnProperty(name) && skillProgress[name] > 0) {
      skills.push({ name: name, xp: skillProgress[name] });
    }
  }
  goalsCompleteSkillsList = skills;
  goalsCompleteSkillIndex = 0;

  var grid = document.getElementById('goals-complete-skills-grid');
  var skillsWrap = document.getElementById('goals-complete-skills-wrap');
  var pagination = document.getElementById('goals-complete-pagination');
  var subtextRow = document.querySelector('.goals-complete-subtext-row');

  if (!grid) return;

  grid.innerHTML = '';
  if (skillsWrap) skillsWrap.classList.remove('is-visible');
  if (pagination) pagination.style.display = 'none';

  if (skills.length === 0) {
    if (subtextRow) subtextRow.querySelector('.goals-complete-subtext').textContent = 'No skill progress from this session';
    if (skillsWrap) skillsWrap.style.display = 'none';
    return;
  }

  if (subtextRow) subtextRow.querySelector('.goals-complete-subtext').textContent = "Here's how your skill progress is looking";
  if (skillsWrap) skillsWrap.style.display = '';

  skills.forEach(function(s, i) {
    var pct = Math.min((s.xp / SKILL_XP_MAX) * 100, 100);
    var card = document.createElement('div');
    card.className = 'feedback-skill-card feedback-skill-card-' + (i + 1) + (i === 0 ? ' goals-skill-active' : '');
    card.innerHTML = '<div class="feedback-skill-card-header">' +
      '<h4 class="feedback-skill-card-name cds-body-primary">' + escapeHtml(s.name) + '</h4>' +
      '</div>' +
      '<div class="feedback-skill-progress-row">' +
      '<div class="feedback-skill-progress-bar">' +
      '<div class="feedback-skill-progress-fill" data-progress="' + pct + '" data-start="0" style="width: 0%"></div>' +
      '</div>' +
      '<span class="feedback-skill-progress-value">' + s.xp + '/' + SKILL_XP_MAX + ' XP</span>' +
      '</div>';
    grid.appendChild(card);
  });

  if (skills.length > 1 && pagination) {
    pagination.style.display = 'flex';
    var indicator = document.getElementById('goals-complete-page-indicator');
    if (indicator) indicator.textContent = '1 / ' + skills.length;
  }

  var cards = grid.querySelectorAll('.feedback-skill-card');
  var progressFills = grid.querySelectorAll('.feedback-skill-progress-fill');
  cards.forEach(function(c) { c.classList.remove('card-visible'); });

  setTimeout(function() {
    if (skillsWrap) skillsWrap.classList.add('is-visible');
    cards.forEach(function(c) { c.classList.add('card-visible'); });
    setTimeout(function() {
      progressFills.forEach(function(f) {
        var target = f.getAttribute('data-progress');
        if (target) f.style.width = target + '%';
      });
      var first = progressFills[0];
      if (first && typeof playFillingSound === 'function') {
        var p = first.getAttribute('data-progress');
        if (p) playFillingSound(parseFloat(p));
      }
    }, 500);
  }, 300);
}

function escapeHtml(s) {
  var div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function hideGoalsCompleteDialog() {
  const modal = document.getElementById('goals-complete-modal');
  if (modal) {
    modal.classList.remove('is-visible');
    modal.setAttribute('aria-hidden', 'true');
    var dialog = modal.querySelector('.goals-complete-dialog');
    if (dialog) dialog.classList.remove('goals-complete-dialog-active');
    var skillsWrap = document.getElementById('goals-complete-skills-wrap');
    var cards = modal.querySelectorAll('#goals-complete-skills-wrap .feedback-skill-card');
    var progressFills = modal.querySelectorAll('#goals-complete-skills-wrap .feedback-skill-progress-fill');
    if (skillsWrap) skillsWrap.classList.remove('is-visible');
    if (cards.length) cards.forEach(function(c) { c.classList.remove('card-visible'); });
    progressFills.forEach(function(f) {
      f.style.width = (f.getAttribute('data-start') || '0') + '%';
    });
  }
}

var ASSIGNMENT_FEEDBACK_SCORE = 100;

function showAssignmentFeedback() {
  const modal = document.getElementById('assignment-feedback-modal');
  if (!modal) return;

  var activeItem = document.querySelector('.lecture-item.active');
  if (activeItem) {
    var titleEl = modal.querySelector('.feedback-modal-title');
    var subtitleEl = modal.querySelector('.feedback-modal-subtitle');
    var title = activeItem.querySelector('.lecture-title');
    var meta = activeItem.querySelector('.lecture-meta');
    if (titleEl && title) titleEl.textContent = title.textContent;
    if (subtitleEl && meta) subtitleEl.textContent = meta.textContent;

    var key = title ? title.textContent.trim() : '';
    assignmentGrades[key] = ASSIGNMENT_FEEDBACK_SCORE;

    var statusEl = activeItem.querySelector('.lecture-status');
    if (statusEl && statusEl.classList.contains('pending')) {
      statusEl.classList.remove('pending');
      statusEl.classList.add('completed');
      statusEl.innerHTML = COMPLETED_SVG;
      var completedCount = getCompletedLearningItemsCount();
      updateProgressDisplay(completedCount, { justCompletedPracticeItem: isAssignmentType(activeItem) });
    }
    var xp = getSkillPointsFromItem(activeItem);
    addSessionXp(xp);
    var lessonId = activeItem.getAttribute('data-lesson-id');
    var tags = getLessonSkillTags(lessonId);
    tags.forEach(function(skillName) {
      var current = skillProgress[skillName] || 0;
      skillProgress[skillName] = Math.min(current + xp, SKILL_XP_MAX);
    });
    try { localStorage.setItem('m1-skills-skill-progress', JSON.stringify(skillProgress)); } catch (e) {}
  }

  if (!sessionStorage.getItem('m1-skills-xp-intro-shown')) {
    sessionStorage.setItem('m1-skills-xp-intro-shown', 'true');
    showXpIntroModal();
    return;
  }

  modal.classList.add('is-visible');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if (typeof playCelebrationTune === 'function') setTimeout(playCelebrationTune, 300);

  // Reset and run assessment result animation sequence
  var skillSection = modal.querySelector('#feedback-skill-progress-content-section');
  var titleEl = modal.querySelector('#feedback-skill-progress-title');
  var cards = modal.querySelectorAll('.feedback-skill-card');
  var xpTags = modal.querySelectorAll('.feedback-skill-xp-tag');
  var progressFills = modal.querySelectorAll('.feedback-skill-progress-fill');
  if (titleEl) titleEl.classList.remove('title-visible');
  cards.forEach(function(c) { c.classList.remove('card-visible'); });
  xpTags.forEach(function(t) { t.classList.remove('xp-tag-visible'); });
  progressFills.forEach(function(f) {
    var start = f.getAttribute('data-start') || '0';
    f.style.width = start + '%';
  });

  // Wait for Lottie animation to complete before showing skill cards
  function startSkillCardSequence() {
    if (titleEl) titleEl.classList.add('title-visible');
    cards.forEach(function(c) { c.classList.add('card-visible'); });
    setTimeout(function() {
      xpTags.forEach(function(t) { t.classList.add('xp-tag-visible'); });
      setTimeout(function() {
        progressFills.forEach(function(f) {
          var target = f.getAttribute('data-progress');
          if (target) f.style.width = target + '%';
        });
        var first = progressFills[0];
        if (first && typeof playFillingSound === 'function') {
          var p = first.getAttribute('data-progress');
          if (p) playFillingSound(parseFloat(p));
        }
      }, 500);
    }, 900);
  }

  var lottieEl = document.getElementById('assessment-lottie');
  if (lottieEl) {
    // Restart the animation on each open
    if (lottieEl.dotLottie) {
      lottieEl.dotLottie.stop();
      lottieEl.dotLottie.play();
    }
    var handled = false;
    function onLottieComplete() {
      if (handled) return;
      handled = true;
      lottieEl.removeEventListener('complete', onLottieComplete);
      startSkillCardSequence();
    }
    lottieEl.addEventListener('complete', onLottieComplete);
    // Fallback in case the event doesn't fire (269 frames @ 60fps ≈ 4.5s)
    setTimeout(function() { onLottieComplete(); }, 5000);
  } else {
    setTimeout(startSkillCardSequence, 400);
  }
}

function hideAssignmentFeedback() {
  const modal = document.getElementById('assignment-feedback-modal');
  if (modal) {
    modal.classList.remove('is-visible');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // Reset animation state for next open
    var titleEl = modal.querySelector('#feedback-skill-progress-title');
    var cards = modal.querySelectorAll('.feedback-skill-card');
    var xpTags = modal.querySelectorAll('.feedback-skill-xp-tag');
    var progressFills = modal.querySelectorAll('.feedback-skill-progress-fill');
    if (titleEl) titleEl.classList.remove('title-visible');
    cards.forEach(function(c) { c.classList.remove('card-visible'); });
    xpTags.forEach(function(t) { t.classList.remove('xp-tag-visible'); });
    progressFills.forEach(function(f) {
      var start = f.getAttribute('data-start') || '0';
      f.style.width = start + '%';
    });
  }
  var activeItem = document.querySelector('.lecture-item.active');
  if (activeItem && isAssignmentType(activeItem)) {
    updateGradeBox(activeItem);
  }
  if (activeItem && !moduleCompleteDialogShown) {
    var title = activeItem.querySelector('.lecture-title');
    if (title && title.textContent.trim() === 'Module 1 challenge') {
      showModuleCompleteDialog();
    }
  }
}

var moduleCompleteSkillIndex = 0;

function moduleCompletePrevSkill() {
  var cards = document.querySelectorAll('.module-complete-skill-card');
  var dots = document.querySelectorAll('.module-complete-dot');
  if (cards.length === 0) return;
  moduleCompleteSkillIndex = moduleCompleteSkillIndex > 0 ? moduleCompleteSkillIndex - 1 : cards.length - 1;
  updateModuleCompleteCarousel();
}

function moduleCompleteNextSkill() {
  var cards = document.querySelectorAll('.module-complete-skill-card');
  var dots = document.querySelectorAll('.module-complete-dot');
  if (cards.length === 0) return;
  moduleCompleteSkillIndex = moduleCompleteSkillIndex < cards.length - 1 ? moduleCompleteSkillIndex + 1 : 0;
  updateModuleCompleteCarousel();
}

function moduleCompleteGoToSkill(index) {
  var cards = document.querySelectorAll('.module-complete-skill-card');
  if (index >= 0 && index < cards.length) {
    moduleCompleteSkillIndex = index;
    updateModuleCompleteCarousel();
  }
}

function updateModuleCompleteCarousel() {
  var cards = document.querySelectorAll('.module-complete-skill-card');
  var dots = document.querySelectorAll('.module-complete-dot');
  cards.forEach(function(c, i) {
    var isActive = i === moduleCompleteSkillIndex;
    c.classList.toggle('active', isActive);
    if (isActive) c.classList.add('card-visible');
    else c.classList.remove('card-visible');
  });
  dots.forEach(function(d, i) { d.classList.toggle('active', i === moduleCompleteSkillIndex); });
}

function showModuleCompleteDialog() {
  if (moduleCompleteDialogShown) return;
  moduleCompleteDialogShown = true;

  var modal = document.getElementById('module-complete-modal');
  if (!modal) return;

  moduleCompleteSkillIndex = 0;
  updateModuleCompleteCarousel();

  var cards = modal.querySelectorAll('.module-complete-skill-card');
  cards.forEach(function(c) { c.classList.remove('card-visible'); });
  var activeCard = modal.querySelector('.module-complete-skill-card.active');
  if (activeCard) {
    setTimeout(function() { activeCard.classList.add('card-visible'); }, 100);
  }

  modal.classList.add('is-visible');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if (typeof playModuleCompletionSound === 'function') playModuleCompletionSound();
}

function hideModuleCompleteDialog() {
  var modal = document.getElementById('module-complete-modal');
  if (modal) {
    modal.classList.remove('is-visible');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

function feedbackNextItem() {
  hideAssignmentFeedback();
  goToNextItem();
}

function handleReadingMarkComplete() {
  var defaultEl = document.getElementById('reading-complete-default');
  var doneEl = document.getElementById('reading-complete-done');

  if (!defaultEl || !doneEl) return;

  defaultEl.style.display = 'none';
  doneEl.style.display = 'block';

  var activeItem = document.querySelector('.lecture-item.active');
  if (activeItem) {
    var xp = getSkillPointsFromItem(activeItem);
    addSessionXp(xp);
    var lessonId = activeItem.getAttribute('data-lesson-id');
    var tags = getLessonSkillTags(lessonId);
    tags.forEach(function(skillName) {
      var current = skillProgress[skillName] || 0;
      skillProgress[skillName] = Math.min(current + xp, SKILL_XP_MAX);
    });
    try { localStorage.setItem('m1-skills-skill-progress', JSON.stringify(skillProgress)); } catch (e) {}

    var statusEl = activeItem.querySelector('.lecture-status');
    if (statusEl && statusEl.classList.contains('pending')) {
      statusEl.classList.remove('pending');
      statusEl.classList.add('completed');
      statusEl.innerHTML = COMPLETED_SVG;
      var completedCount = getCompletedLearningItemsCount();
      updateProgressDisplay(completedCount, { justCompletedPracticeItem: isAssignmentType(activeItem) });
    }
  }

  if (!sessionStorage.getItem('m1-skills-xp-intro-shown')) {
    sessionStorage.setItem('m1-skills-xp-intro-shown', 'true');
    showXpIntroModal();
  } else {
    if (typeof playRetroCoinSound === 'function') playRetroCoinSound();
  }
}

function showToast(title, body) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  container.innerHTML = '<div class="toast"><div class="toast-lottie"><dotlottie-wc src="assets/star.lottie" autoplay></dotlottie-wc></div><div class="toast-content"><p class="toast-title">' + title + '</p><p class="toast-body">' + body + '</p></div></div>';
}

function showWeeklyStreakToast() {
  var container = document.getElementById('toast-container');
  if (!container) return;
  var seg = (typeof getSegment === 'function') ? getSegment() : (sessionStorage.getItem('m1-skills-segment') || 'active');
  if (seg !== 'new') return;
  if (sessionStorage.getItem('m1-skills-weekly-streak-toast-shown')) return;
  sessionStorage.setItem('m1-skills-weekly-streak-toast-shown', 'true');

  var days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  var todayIndex = (new Date().getDay() + 6) % 7;
  var html = '<div class="toast toast--streak">' +
    '<p class="toast-streak-message">Just 2 more days to start your weekly streak!</p>' +
    '<div class="toast-streak-days">';
  for (var i = 0; i < days.length; i++) {
    var isCurrent = i === todayIndex;
    var cls = 'toast-streak-day' + (isCurrent ? ' toast-streak-day--current toast-streak-day--checked' : '');
    var dayContent = isCurrent
      ? '<div class="toast-streak-lottie"><dotlottie-wc src="assets/tick-check.json" autoplay></dotlottie-wc></div>'
      : '<span class="toast-streak-label">' + days[i] + '</span>';
    html += '<button type="button" class="' + cls + '" data-day-index="' + i + '" aria-label="' + days[i] + (isCurrent ? ' (today - tap to dismiss)' : '') + '">' +
      dayContent +
      '</button>';
  }
  html += '</div></div>';
  container.innerHTML = html;

  var currentBtn = container.querySelector('.toast-streak-day--current');
  var lottieEl = container.querySelector('dotlottie-wc');
  var dismissed = false;
  function dismissToast() {
    if (dismissed) return;
    dismissed = true;
    hideToast();
  }
  var lottieInited = false;
  function initLottie() {
    if (lottieInited || !lottieEl || !lottieEl.dotLottie) return lottieInited;
    lottieInited = true;
    lottieEl.dotLottie.setLoop(false);
    lottieEl.dotLottie.addEventListener('complete', function() {
      setTimeout(dismissToast, 500);
    });
    return true;
  }
  if (lottieEl) {
    lottieEl.addEventListener('load', initLottie);
    var checkReady = setInterval(function() {
      if (initLottie()) clearInterval(checkReady);
    }, 50);
    setTimeout(function() {
      clearInterval(checkReady);
      if (!dismissed) dismissToast();
    }, 3500);
  }
  if (currentBtn) {
    currentBtn.addEventListener('click', function handleDismiss() {
      currentBtn.removeEventListener('click', handleDismiss);
      hideToast();
    });
  }
}

function hideToast(onComplete) {
  const toast = document.querySelector('.toast-container .toast');
  if (!toast) {
    const container = document.getElementById('toast-container');
    if (container) container.innerHTML = '';
    if (onComplete) onComplete();
    return;
  }
  toast.classList.add('toast-exit');
  var completed = false;
  function done() {
    if (completed) return;
    completed = true;
    const container = document.getElementById('toast-container');
    if (container) container.innerHTML = '';
    if (onComplete) onComplete();
  }
  toast.addEventListener('animationend', function h() {
    toast.removeEventListener('animationend', h);
    done();
  });
  setTimeout(done, 400);
}

var PRE_COMPLETE_COUNT = 4; /* Active: items pre-completed before session; don't count toward daily goal */

function updateProgressDisplay(completedCount, opts) {
  opts = opts || {};
  const goal = getLearningItemsGoal();
  const isNew = isNewLearnerSegment();
  var sessionCount = isNew ? completedCount : Math.max(0, completedCount - PRE_COMPLETE_COUNT);
  const capped = Math.min(sessionCount, goal);

  if (!isNew && opts.justCompletedPracticeItem) {
    goal2Complete = true;
    const completeSvg = getCompleteStarSvg();
    const star2 = document.getElementById('progress-star-2');
    if (star2) {
      star2.classList.remove('fade-in-star');
      star2.innerHTML = completeSvg;
      void star2.offsetWidth;
      star2.classList.add('fade-in-star');
    }
    const dropdownStars = document.querySelectorAll('.progress-tracker-dropdown-item .progress-tracker-dropdown-star');
    if (dropdownStars[1]) dropdownStars[1].outerHTML = completeSvg.replace('<svg ', '<svg class="progress-tracker-dropdown-star" ');
  }

  if (!isExperiment4() && capped === goal && !goal1Complete) {
    goal1Complete = true;
    const completeSvg = getCompleteStarSvg();
    const star1 = document.getElementById('progress-star-1');
    if (star1) {
      star1.classList.remove('fade-in-star');
      star1.innerHTML = completeSvg;
      void star1.offsetWidth;
      star1.classList.add('fade-in-star');
    }
    const dropdownStars = document.querySelectorAll('.progress-tracker-dropdown-item .progress-tracker-dropdown-star');
    if (dropdownStars[0]) dropdownStars[0].outerHTML = completeSvg.replace('<svg ', '<svg class="progress-tracker-dropdown-star" ');
  }

  /* Update GoalsStore first so syncProgressToNextGoal reads fresh data (fixes lag for new learners) */
  if (typeof window.GoalsStore !== 'undefined') {
    var updateOpts = { learningItemsCompleted: sessionCount };
    if (!isNew) {
      updateOpts.practiceComplete = goal2Complete;
      updateOpts.coachComplete = goal3Complete;
    }
    window.GoalsStore.updateFromLearning(updateOpts);
  }

  syncProgressToNextGoal();

  var allGoalsComplete = isNew ? goal1Complete : (goal1Complete && goal2Complete && goal3Complete);
  if (allGoalsComplete) {
    showGoalsCompleteDialog();
  } else if (goal1Complete && !itemsToastShown) {
    itemsToastShown = true;
    if (toastTimeout) clearTimeout(toastTimeout);
    var toastMsg = isExperiment4()
      ? "You've completed a daily goal by earning " + EXP4_XP_GOAL + " XP."
      : "You've completed a daily goal by finishing " + goal + " learning items.";
    showToast('High five!', toastMsg);
    toastTimeout = setTimeout(function() {
      hideToast(function() {
        toastTimeout = null;
      });
    }, 5000);
  } else if (goal2Complete && !practiceToastShown) {
    practiceToastShown = true;
    if (toastTimeout) clearTimeout(toastTimeout);
    showToast('Nice work!', "You've completed a daily goal by finishing a practice item.");
    toastTimeout = setTimeout(function() {
      hideToast(function() { toastTimeout = null; });
    }, 5000);
  } else if (goal3Complete && !coachToastShown) {
    coachToastShown = true;
    if (toastTimeout) clearTimeout(toastTimeout);
    showToast('Way to go!', "You've completed a daily goal by using Coach.");
    toastTimeout = setTimeout(function() {
      hideToast(function() { toastTimeout = null; });
    }, 5000);
  }
}

function selectLectureItem(item) {
  document.querySelectorAll('.lecture-item').forEach((i) => i.classList.remove('active'));
  item.classList.add('active');

  const module = item.closest('.module');
  if (module) {
    const moduleContent = module.querySelector('.module-content');
    const chevron = module.querySelector('.module-chevron');
    if (moduleContent && moduleContent.classList.contains('collapsed')) {
      moduleContent.classList.remove('collapsed');
      if (chevron) chevron.classList.add('expanded');
    }
  }

  updateMainContent(item);
}

function goToNextItem() {
  const allItems = getAllLectureItems();
  const activeIndex = allItems.findIndex((item) => item.classList.contains('active'));
  if (activeIndex === -1) return;

  const currentItem = allItems[activeIndex];
  const nextIndex = activeIndex + 1;
  if (nextIndex >= allItems.length) return;

  currentItem.classList.remove('active');
  const nextItem = allItems[nextIndex];
  nextItem.classList.add('active');

  const nextModule = nextItem.closest('.module');
  if (nextModule) {
    const moduleContent = nextModule.querySelector('.module-content');
    const chevron = nextModule.querySelector('.module-chevron');
    if (moduleContent && moduleContent.classList.contains('collapsed')) {
      moduleContent.classList.remove('collapsed');
      if (chevron) chevron.classList.add('expanded');
    }
  }

  updateMainContent(nextItem);
}

function refreshStarsFromGoals() {
  var completeSvg = getCompleteStarSvg();
  var svgWithClass = completeSvg.replace('<svg ', '<svg class="progress-tracker-dropdown-star" ');
  if (goal1Complete) {
    var s1 = document.getElementById('progress-star-1');
    if (s1) s1.innerHTML = completeSvg;
    var d1 = document.getElementById('dropdown-star-1');
    if (d1) d1.innerHTML = svgWithClass;
  }
  if (!isNewLearnerSegment()) {
    if (goal2Complete) {
      var s2 = document.getElementById('progress-star-2');
      if (s2) s2.innerHTML = completeSvg;
      var d2 = document.getElementById('dropdown-star-2');
      if (d2) d2.innerHTML = svgWithClass;
    }
    if (goal3Complete) {
      var s3 = document.getElementById('progress-star-3');
      if (s3) s3.innerHTML = completeSvg;
      var d3 = document.getElementById('dropdown-star-3');
      if (d3) d3.innerHTML = svgWithClass;
    }
  }
}

/* ─── First-time XP Introduction Modal ──────────────────────── */
function showXpIntroModal() {
  var _exp = sessionStorage.getItem('proto-experiment') || '1';
  if (_exp === '2' || _exp === '3' || _exp === '4') return;
  var modal = document.getElementById('xp-intro-modal');
  if (!modal) return;
  var seg = (typeof getSegment === 'function') ? getSegment() : (sessionStorage.getItem('m1-skills-segment') || 'active');

  var titleEl = document.getElementById('xp-intro-title');
  var earnedEl = document.getElementById('xp-intro-earned');
  if (seg === 'active') {
    if (titleEl) titleEl.textContent = 'Introducing Skill Points!';
    if (earnedEl) earnedEl.textContent = 'Every item you complete earns Skill Points toward real, employer-valued skills. Here\u2019s what you\u2019ve built so far in this course:';
  } else {
    if (titleEl) titleEl.textContent = 'You just earned Skill Points!';
    if (earnedEl) earnedEl.textContent = 'Every item you complete earns Skill Points toward real, employer-valued skills. Here is the skill you just made progress towards:';
  }

  var skillsContainer = document.getElementById('xp-intro-skills');
  if (skillsContainer) {
    skillsContainer.classList.remove('names-only');
  }

  Object.keys(SKILL_KEY_TO_NAME).forEach(function(key) {
    var row = modal.querySelector('[data-xp-skill="' + key + '"]');
    if (!row) return;
    var fullName = SKILL_KEY_TO_NAME[key];
    var xp = (typeof skillProgress !== 'undefined' && skillProgress[fullName]) ? skillProgress[fullName] : 0;
    var valEl = row.querySelector('[data-xp-value]');
    var barEl = row.querySelector('[data-xp-bar]');
    var barRow = row.querySelector('.xp-intro-skill-bar-row');

    if (xp > 0) {
      row.style.display = '';
      if (valEl) valEl.textContent = xp + '/' + SKILL_XP_MAX + ' XP';
      if (barEl) barEl.style.width = (xp / SKILL_XP_MAX * 100) + '%';
      if (barRow) barRow.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });

  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  if (typeof playCelebrationSound === 'function') playCelebrationSound();

  var svg = modal.querySelector('.xp-intro-illustration');
  if (svg) {
    svg.classList.remove('is-animating');
    void svg.offsetWidth;
    svg.classList.add('is-animating');
  }
}

function hideXpIntroModal() {
  var modal = document.getElementById('xp-intro-modal');
  if (!modal) return;
  var svg = modal.querySelector('.xp-intro-illustration');
  if (svg) svg.classList.remove('is-animating');
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  applyXpTrackerVisibility();
  var seg = (typeof getSegment === 'function') ? getSegment() : (sessionStorage.getItem('m1-skills-segment') || 'active');
  if (seg === 'new') {
    setTimeout(showWeeklyStreakToast, 300);
  }
}

/* Skills intro modal (copy for sidebar click - design can be changed separately) */
var SKILL_KEY_TO_NAME = {
  visualizing: 'Visualizing and Reporting Clean Data',
  preparing: 'Preparing and Cleaning Data',
  connecting: 'Connecting and Importing Data',
  powerbi: 'Prepare Datasets in Power BI'
};
function getSkillXpMax() {
  var exp = sessionStorage.getItem('proto-experiment') || '1';
  return exp === '1' ? 300 : 1500;
}
var SKILL_XP_MAX = getSkillXpMax();

function showSkillsIntroModal() {
  showSkillsProgressModal();
}

function showSkillsProgressModal() {
  var modal = document.getElementById('skills-progress-modal');
  if (!modal) return;

  /* Experiment B-D+ text overrides */
  var _exp = sessionStorage.getItem('proto-experiment') || '1';
  if (_exp !== '1') {
    var titleEl = document.getElementById('skills-progress-title');
    if (titleEl) titleEl.textContent = 'Skill Progress';
    var subtextEl = modal.querySelector('.skills-progress-header .cds-body-primary');
    if (subtextEl) subtextEl.textContent = "Here are the latest skills you\u2019ve been building on Coursera. Continue completing learning items to earn Skill Points!";
    var feedbackBtn = document.getElementById('skills-progress-feedback-btn');
    if (feedbackBtn) {
      feedbackBtn.textContent = 'See all skills';
      feedbackBtn.href = 'my-learning.html?exp=' + _exp + '#skills';
    }
  }

  Object.keys(SKILL_KEY_TO_NAME).forEach(function(key) {
    var row = modal.querySelector('[data-sp-skill="' + key + '"]');
    if (!row) return;
    var fullName = SKILL_KEY_TO_NAME[key];
    var xp = (typeof skillProgress !== 'undefined' && skillProgress[fullName]) ? skillProgress[fullName] : 0;
    var valEl = row.querySelector('[data-sp-value]');
    var barEl = row.querySelector('[data-sp-bar]');
    if (valEl) valEl.textContent = xp + '/' + SKILL_XP_MAX + ' XP';
    if (barEl) barEl.style.width = (xp / SKILL_XP_MAX * 100) + '%';
  });

  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function hideSkillsProgressModal() {
  var modal = document.getElementById('skills-progress-modal');
  if (!modal) return;
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function hideSkillsIntroModal() {
  hideSkillsProgressModal();
}

/* Pre-complete first N sidebar items for active learners */
function preCompleteItemsForReturningLearners() {
  var seg = (typeof getSegment === 'function') ? getSegment() : (sessionStorage.getItem('m1-skills-segment') || 'active');
  if (seg !== 'active') return;

  var preCompleteIds = ['m1-l1', 'm1-l2', 'm1-l3', 'm1-l4'];
  var firstIncompleteId = 'm1-l5';

  preCompleteIds.forEach(function(id) {
    var item = document.querySelector('.lecture-item[data-lesson-id="' + id + '"]');
    if (!item) return;
    var statusEl = item.querySelector('.lecture-status');
    if (statusEl) {
      statusEl.classList.remove('pending');
      statusEl.classList.add('completed');
      statusEl.innerHTML = COMPLETED_SVG;
    }
  });

  var firstIncomplete = document.querySelector('.lecture-item[data-lesson-id="' + firstIncompleteId + '"]');
  if (firstIncomplete) {
    document.querySelectorAll('.lecture-item').forEach(function(i) { i.classList.remove('active'); });
    firstIncomplete.classList.add('active');
    updateMainContent(firstIncomplete);
  }

  /* Don't update goals - pre-completed items are pre-session; daily goal starts at 0 */
  syncProgressToNextGoal();
}

function completeCoachGoal() {
  if (goal3Complete) return;
  goal3Complete = true;
  if (typeof window.GoalsStore !== 'undefined') {
    window.GoalsStore.updateFromLearning({ coachComplete: true });
  }
  var completeSvg = getCompleteStarSvg();
  var star3 = document.getElementById('progress-star-3');
  if (star3) {
    star3.classList.remove('fade-in-star');
    star3.innerHTML = completeSvg;
    void star3.offsetWidth;
    star3.classList.add('fade-in-star');
  }
  var dropdownStars = document.querySelectorAll('.progress-tracker-dropdown-item .progress-tracker-dropdown-star');
  if (dropdownStars[2]) dropdownStars[2].outerHTML = completeSvg.replace('<svg ', '<svg class="progress-tracker-dropdown-star" ');
  syncProgressToNextGoal();
  var allComplete = goal1Complete && goal2Complete && goal3Complete;
  if (allComplete) {
    showGoalsCompleteDialog();
  } else if (!coachToastShown) {
    coachToastShown = true;
    if (toastTimeout) clearTimeout(toastTimeout);
    showToast('Way to go!', "You've completed a daily goal by using Coach.");
    toastTimeout = setTimeout(function() {
      hideToast(function() { toastTimeout = null; });
    }, 5000);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  try {
    sessionStorage.setItem(SESSION_XP_KEY, '0');
  } catch (e) {}
  updateSessionXpDisplay();

  if (typeof window.GoalsStore !== 'undefined') {
    var stored = window.GoalsStore.get();
    var goal = getLearningItemsGoal();
    if (stored.learningItemsCompleted >= goal) { goal1Complete = true; itemsToastShown = true; }
    if (!isNewLearnerSegment()) {
      goal2Complete = !!stored.practiceComplete;
      goal3Complete = !!stored.coachComplete;
      if (goal2Complete) practiceToastShown = true;
      if (goal3Complete) coachToastShown = true;
    }
    syncProgressToNextGoal();
    if (goal1Complete || goal2Complete || goal3Complete) refreshStarsFromGoals();
  }
  var activeItem = document.querySelector('.lecture-item.active');
  if (activeItem) updateMainContent(activeItem);
  initVideoPlayer();
  applyXpTrackerVisibility();

  /* Patch static skill XP denominators for experiment A (300 vs 1500) */
  document.querySelectorAll('.feedback-skill-progress-value').forEach(function(el) {
    el.textContent = el.textContent.replace(/\/1500 XP/, '/' + SKILL_XP_MAX + ' XP');
  });

  /* Experiment B-D+: update sidebar entry point text */
  var _expInit = sessionStorage.getItem('proto-experiment') || '1';
  if (_expInit !== '1') {
    var sidebarLink = document.getElementById('sidebar-skill-progress-link');
    if (sidebarLink) sidebarLink.textContent = 'See skill progress';
  }

  document.addEventListener('click', function(e) {
    const wrapper = document.querySelector('.progress-tracker-wrapper');
    const tracker = document.getElementById('progress-tracker');
    if (wrapper && wrapper.classList.contains('open') && !wrapper.contains(e.target)) {
      wrapper.classList.remove('open');
      tracker.setAttribute('aria-expanded', 'false');
    }
  });

  const sidebarContent = document.getElementById('sidebar-content');
  if (sidebarContent) {
    sidebarContent.addEventListener('click', function(e) {
      const item = e.target.closest('.lecture-item');
      if (item) {
        e.preventDefault();
        selectLectureItem(item);
      }
    });
  }

  var continueBtn = document.querySelector('.goals-complete-btn');
  if (continueBtn) {
    continueBtn.addEventListener('click', hideGoalsCompleteDialog);
  }

  var startBtn = document.querySelector('.assignment-start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', showAssignmentFeedback);
  }

  var markCompleteBtn = document.getElementById('reading-mark-complete-btn');
  if (markCompleteBtn) {
    markCompleteBtn.addEventListener('click', handleReadingMarkComplete);
  }

  var readingNextBtn = document.getElementById('reading-next-btn');
  if (readingNextBtn) {
    readingNextBtn.addEventListener('click', goToNextItem);
  }

  var coachBtns = document.querySelectorAll('.coach-prompt-btn');
  coachBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (typeof completeCoachGoal === 'function') completeCoachGoal();
    });
  });

  var coachBox = document.querySelector('.coach-box');
  if (coachBox && isNewLearnerSegment()) coachBox.style.display = 'none';

  preCompleteItemsForReturningLearners();
});
