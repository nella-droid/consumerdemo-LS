/**
 * Sound and haptics for M1 Skills Prototype
 * Ported from Skill_widget_1-26 - Web Audio API synthesized sounds
 */

var SOUND_STORAGE_KEY = 'm1-skills-sound-enabled';

function isSoundEnabled() {
  var val = sessionStorage.getItem(SOUND_STORAGE_KEY);
  return val === null || val === 'true';
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

function playRetroCoinSound() {
  if (!isSoundEnabled()) return;
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    var ctx = new AudioContext();
    var playSound = function() {
      var now = ctx.currentTime;
      var osc1 = ctx.createOscillator();
      var gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.value = 659;
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.07, now + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.start(now);
      osc1.stop(now + 0.15);
      var start2 = now + 0.08;
      var osc2 = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = 784;
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      gain2.gain.setValueAtTime(0, start2);
      gain2.gain.linearRampToValueAtTime(0.08, start2 + 0.015);
      gain2.gain.exponentialRampToValueAtTime(0.001, start2 + 0.12);
      osc2.start(start2);
      osc2.stop(start2 + 0.15);
      var start3 = now + 0.16;
      var osc3 = ctx.createOscillator();
      var gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.value = 1047;
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      gain3.gain.setValueAtTime(0, start3);
      gain3.gain.linearRampToValueAtTime(0.1, start3 + 0.015);
      gain3.gain.exponentialRampToValueAtTime(0.001, start3 + 0.2);
      osc3.start(start3);
      osc3.stop(start3 + 0.25);
    };
    if (ctx.state === 'suspended') ctx.resume().then(playSound);
    else playSound();
    triggerHaptic();
  } catch (e) {}
}

function playCelebrationSound() {
  if (!isSoundEnabled()) return;
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    var ctx = new AudioContext();
    var now = ctx.currentTime;
    var notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach(function(freq, i) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + (i * 0.12));
      gain.gain.setValueAtTime(0, now + (i * 0.12));
      gain.gain.linearRampToValueAtTime(0.08, now + (i * 0.12) + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.12) + 0.6);
      osc.start(now + (i * 0.12));
      osc.stop(now + (i * 0.12) + 0.8);
    });
    var chordNotes = [261.63, 329.63, 392.00];
    chordNotes.forEach(function(freq) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.4);
      gain.gain.linearRampToValueAtTime(0, now + 1.5);
      osc.start(now);
      osc.stop(now + 1.5);
    });
    triggerHaptic();
  } catch (e) {}
}

function playCelebrationTune() {
  if (!isSoundEnabled()) return;
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    var ctx = new AudioContext();
    var now = ctx.currentTime;
    var melody = [
      { freq: 523.25, time: 0, duration: 0.2 },
      { freq: 659.25, time: 0.15, duration: 0.2 },
      { freq: 783.99, time: 0.3, duration: 0.2 },
      { freq: 1046.50, time: 0.45, duration: 0.4 },
      { freq: 783.99, time: 0.9, duration: 0.15 },
      { freq: 1046.50, time: 1.05, duration: 0.15 },
      { freq: 1174.66, time: 1.2, duration: 0.3 },
      { freq: 1046.50, time: 1.55, duration: 0.5 },
      { freq: 783.99, time: 2.1, duration: 0.2 },
      { freq: 1046.50, time: 2.3, duration: 0.2 },
      { freq: 1318.51, time: 2.5, duration: 0.5 }
    ];
    melody.forEach(function(n) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = n.freq;
      osc.type = 'sine';
      var startTime = now + n.time;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
      gain.gain.setValueAtTime(0.1, startTime + n.duration - 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + n.duration);
      osc.start(startTime);
      osc.stop(startTime + n.duration + 0.1);
    });
    var chordNotes = [261.63, 329.63, 392.00];
    chordNotes.forEach(function(freq) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.3);
      gain.gain.setValueAtTime(0.04, now + 2.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3);
      osc.start(now);
      osc.stop(now + 3.1);
    });
    triggerHaptic();
  } catch (e) {}
}

function playFillingSound(progress) {
  if (!isSoundEnabled()) return;
  try {
    var audioContext = new (window.AudioContext || window.webkitAudioContext)();
    var osc = audioContext.createOscillator();
    var gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    var baseFreq = 200 + (progress / 100) * 400;
    osc.frequency.value = baseFreq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.03, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
    osc.start();
    osc.stop(audioContext.currentTime + 0.05);
  } catch (e) {}
}

function playModuleCompletionSound() {
  if (!isSoundEnabled()) return;
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    var ctx = new AudioContext();
    var now = ctx.currentTime;
    var notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach(function(freq, index) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      var filter = ctx.createBiquadFilter();
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      filter.Q.value = 1;
      var start = now + (index * 0.05);
      var attack = 0.5, decay = 0.4, hold = 2.5, release = 2.0;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.06, start + attack);
      gain.gain.linearRampToValueAtTime(0.05, start + attack + decay);
      gain.gain.setValueAtTime(0.05, start + attack + decay + hold);
      gain.gain.exponentialRampToValueAtTime(0.001, start + attack + decay + hold + release);
      osc.start(start);
      osc.stop(start + attack + decay + hold + release + 0.5);
    });
    var bufferSize = ctx.sampleRate * 5;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    var noise = ctx.createBufferSource();
    noise.buffer = buffer;
    var noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 120;
    var noiseGain = ctx.createGain();
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.12, now + 2.0);
    noiseGain.gain.linearRampToValueAtTime(0, now + 4.5);
    noise.start(now);
    noise.stop(now + 5.0);
    triggerHaptic();
  } catch (e) {}
}
