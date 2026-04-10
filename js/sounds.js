/**
 * Sound and haptics for M1 Skills Prototype
 * Uses pre-rendered .wav files from assets/sounds/
 *
 * To regenerate the audio files, run:  node scripts/export-sounds.js
 */

var SOUND_STORAGE_KEY = 'm1-skills-sound-enabled';

function isSoundEnabled() {
  var val = sessionStorage.getItem(SOUND_STORAGE_KEY);
  if (val === null) {
    var exp = sessionStorage.getItem('proto-experiment') || '1';
    return exp === '4';
  }
  return val === 'true';
}

function setSoundEnabled(enabled) {
  sessionStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'true' : 'false');
}

function triggerHaptic() {
  if (!isSoundEnabled()) return;
  try {
    if (navigator.vibrate) navigator.vibrate(15);
  } catch (e) {}
}

/* Preload all audio files so playback is instant */
var _soundCache = {};

function _preload(name, src) {
  var audio = new Audio(src);
  audio.preload = 'auto';
  _soundCache[name] = audio;
}

(function preloadSounds() {
  var base = 'assets/sounds/';
  _preload('coin', base + 'coin.wav');
  _preload('celebration', base + 'celebration.wav');
  _preload('celebration-tune', base + 'celebration-tune.wav');
  _preload('filling-25', base + 'filling-25.wav');
  _preload('filling-50', base + 'filling-50.wav');
  _preload('filling-75', base + 'filling-75.wav');
  _preload('filling-100', base + 'filling-100.wav');
  _preload('module-complete', base + 'module-complete.wav');
})();

function _playSound(name) {
  if (!isSoundEnabled()) return;
  var cached = _soundCache[name];
  if (!cached) return;
  try {
    var clone = cached.cloneNode();
    clone.volume = 1;
    clone.play().catch(function() {});
  } catch (e) {}
}

function playRetroCoinSound() {
  _playSound('coin');
  triggerHaptic();
}

function playCelebrationSound() {
  _playSound('celebration');
  triggerHaptic();
}

function playCelebrationTune() {
  _playSound('celebration-tune');
  triggerHaptic();
}

function playFillingSound(progress) {
  if (!isSoundEnabled()) return;
  var p = typeof progress === 'number' ? progress : 50;
  var name;
  if (p <= 37.5) name = 'filling-25';
  else if (p <= 62.5) name = 'filling-50';
  else if (p <= 87.5) name = 'filling-75';
  else name = 'filling-100';
  _playSound(name);
}

function playModuleCompletionSound() {
  _playSound('module-complete');
  triggerHaptic();
}
