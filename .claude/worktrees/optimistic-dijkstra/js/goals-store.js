/**
 * Shared goals storage - syncs progress between homepage, my-learning, and learning experience
 * Reset on refresh; persist when navigating between pages so homepage reflects learning state.
 * New learners: 1 goal (3 learning items). Active: 3 goals (5 items, 1 practice, Coach).
 */
(function() {
  var STORAGE_KEY = 'm1-skills-daily-goals';
  var SKILL_PROGRESS_KEY = 'm1-skills-skill-progress';

  /* Reset goals on refresh only (not when navigating between pages) */
  try {
    var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    var isReload = nav && nav.type === 'reload';
    if (isReload) localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SKILL_PROGRESS_KEY);
  } catch (e) {}

  function getSegment() {
    try {
      var s = sessionStorage.getItem('m1-skills-segment') || 'active';
      return s === 'lapsed' ? 'active' : s;
    } catch (e) {
      return 'active';
    }
  }

  function getLearningItemsGoal() {
    return getSegment() === 'new' ? 3 : 5;
  }

  function getStored() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        var today = new Date().toDateString();
        if (data.date === today) return data;
      }
    } catch (e) {}
    return {
      date: new Date().toDateString(),
      learningItemsCompleted: 0,
      practiceComplete: false,
      coachComplete: false
    };
  }

  function save(data) {
    data.date = new Date().toDateString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  window.GoalsStore = {
    get: getStored,
    save: save,
    LEARNING_ITEMS_GOAL: 3,
    LEARNING_ITEMS_GOAL_ACTIVE: 5,
    getLearningItemsGoal: getLearningItemsGoal,
    getSegment: getSegment,
    updateFromLearning: function(opts) {
      var d = getStored();
      var goal = getLearningItemsGoal();
      if (opts && opts.learningItemsCompleted != null) d.learningItemsCompleted = Math.min(opts.learningItemsCompleted, goal);
      if (opts && opts.practiceComplete != null) d.practiceComplete = opts.practiceComplete;
      if (opts && opts.coachComplete != null) d.coachComplete = opts.coachComplete;
      save(d);
      return d;
    }
  };
})();
