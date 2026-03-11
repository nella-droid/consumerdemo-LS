#!/usr/bin/env node
/**
 * Export all prototype sounds to .wav files.
 *
 * Each sound is synthesised in-memory from the same parameters used by
 * js/sounds.js (Web Audio API), then encoded as 16-bit PCM WAV and written
 * to assets/sounds/.
 *
 * Usage:  node scripts/export-sounds.js
 */

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const OUT_DIR = path.join(__dirname, '..', 'assets', 'sounds');

// ---------------------------------------------------------------------------
// WAV encoder (16-bit mono PCM)
// ---------------------------------------------------------------------------

function encodeWav(samples, sampleRate) {
  const numSamples = samples.length;
  const byteRate = sampleRate * 2; // 16-bit mono
  const blockAlign = 2;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);         // chunk size
  buffer.writeUInt16LE(1, 20);          // PCM format
  buffer.writeUInt16LE(1, 22);          // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 30);
  buffer.writeUInt16LE(16, 32);         // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  return buffer;
}

// ---------------------------------------------------------------------------
// DSP helpers — replicate Web Audio primitives in plain maths
// ---------------------------------------------------------------------------

function makeSamples(durationSec) {
  return new Float64Array(Math.ceil(durationSec * SAMPLE_RATE));
}

function addOscillator(out, opts) {
  const { type, freq, startTime, stopTime, gainEnvelope } = opts;
  const startSample = Math.floor(startTime * SAMPLE_RATE);
  const stopSample = Math.min(Math.ceil(stopTime * SAMPLE_RATE), out.length);

  for (let i = startSample; i < stopSample; i++) {
    const t = i / SAMPLE_RATE;
    const phase = (t - startTime) * freq;
    let sample;
    switch (type) {
      case 'sine':
        sample = Math.sin(2 * Math.PI * phase);
        break;
      case 'triangle':
        sample = 2 * Math.abs(2 * (phase % 1) - 1) - 1;
        break;
      case 'sawtooth':
        sample = 2 * (phase % 1) - 1;
        break;
      case 'square':
        sample = (phase % 1) < 0.5 ? 1 : -1;
        break;
      default:
        sample = Math.sin(2 * Math.PI * phase);
    }
    const gain = evalEnvelope(gainEnvelope, t);
    out[i] += sample * gain;
  }
}

function addFilteredOscillator(out, opts) {
  const { type, freq, startTime, stopTime, gainEnvelope, filterFreq } = opts;
  const startSample = Math.floor(startTime * SAMPLE_RATE);
  const stopSample = Math.min(Math.ceil(stopTime * SAMPLE_RATE), out.length);

  // Simple one-pole lowpass approximation
  const rc = 1.0 / (2.0 * Math.PI * filterFreq);
  const dt = 1.0 / SAMPLE_RATE;
  const alpha = dt / (rc + dt);
  let prev = 0;

  for (let i = startSample; i < stopSample; i++) {
    const t = i / SAMPLE_RATE;
    const phase = (t - startTime) * freq;
    let sample;
    switch (type) {
      case 'sawtooth': sample = 2 * (phase % 1) - 1; break;
      case 'sine': sample = Math.sin(2 * Math.PI * phase); break;
      case 'triangle': sample = 2 * Math.abs(2 * (phase % 1) - 1) - 1; break;
      default: sample = Math.sin(2 * Math.PI * phase);
    }
    // Apply lowpass
    prev = prev + alpha * (sample - prev);
    const gain = evalEnvelope(gainEnvelope, t);
    out[i] += prev * gain;
  }
}

function addNoise(out, opts) {
  const { startTime, stopTime, gainEnvelope, filterFreq } = opts;
  const startSample = Math.floor(startTime * SAMPLE_RATE);
  const stopSample = Math.min(Math.ceil(stopTime * SAMPLE_RATE), out.length);

  const rc = 1.0 / (2.0 * Math.PI * filterFreq);
  const dt = 1.0 / SAMPLE_RATE;
  const alpha = dt / (rc + dt);
  let prev = 0;

  for (let i = startSample; i < stopSample; i++) {
    const t = i / SAMPLE_RATE;
    const raw = Math.random() * 2 - 1;
    prev = prev + alpha * (raw - prev);
    const gain = evalEnvelope(gainEnvelope, t);
    out[i] += prev * gain;
  }
}

/**
 * Evaluate a piecewise-linear (or exponential) envelope at time t.
 * Points: [{ t, v, type? }]  where type is 'linear' (default) or 'exp'.
 */
function evalEnvelope(points, t) {
  if (!points || points.length === 0) return 1;
  if (t <= points[0].t) return points[0].v;
  if (t >= points[points.length - 1].t) return points[points.length - 1].v;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    if (t >= p0.t && t < p1.t) {
      const frac = (t - p0.t) / (p1.t - p0.t);
      if (p1.type === 'exp') {
        const v0 = Math.max(p0.v, 0.0001);
        const v1 = Math.max(p1.v, 0.0001);
        return v0 * Math.pow(v1 / v0, frac);
      }
      return p0.v + (p1.v - p0.v) * frac;
    }
  }
  return points[points.length - 1].v;
}

// ---------------------------------------------------------------------------
// Sound definitions — mirrors js/sounds.js
// ---------------------------------------------------------------------------

function renderRetroCoinSound() {
  const duration = 0.5;
  const out = makeSamples(duration);

  // Tone 1: sine 659Hz, 0 -> 0.15s
  addOscillator(out, {
    type: 'sine', freq: 659, startTime: 0, stopTime: 0.15,
    gainEnvelope: [
      { t: 0, v: 0 },
      { t: 0.015, v: 0.07 },
      { t: 0.12, v: 0.001, type: 'exp' }
    ]
  });

  // Tone 2: sine 784Hz, 0.08 -> 0.23s
  addOscillator(out, {
    type: 'sine', freq: 784, startTime: 0.08, stopTime: 0.23,
    gainEnvelope: [
      { t: 0.08, v: 0 },
      { t: 0.095, v: 0.08 },
      { t: 0.20, v: 0.001, type: 'exp' }
    ]
  });

  // Tone 3: sine 1047Hz, 0.16 -> 0.41s
  addOscillator(out, {
    type: 'sine', freq: 1047, startTime: 0.16, stopTime: 0.41,
    gainEnvelope: [
      { t: 0.16, v: 0 },
      { t: 0.175, v: 0.1 },
      { t: 0.36, v: 0.001, type: 'exp' }
    ]
  });

  return out;
}

function renderCelebrationSound() {
  const duration = 1.6;
  const out = makeSamples(duration);

  // Ascending triangle arpeggio
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((freq, i) => {
    const start = i * 0.12;
    addOscillator(out, {
      type: 'triangle', freq, startTime: start, stopTime: start + 0.8,
      gainEnvelope: [
        { t: start, v: 0 },
        { t: start + 0.04, v: 0.08 },
        { t: start + 0.6, v: 0.001, type: 'exp' }
      ]
    });
  });

  // Background chord pad
  const chordNotes = [261.63, 329.63, 392.00];
  chordNotes.forEach(freq => {
    addOscillator(out, {
      type: 'sine', freq, startTime: 0, stopTime: 1.5,
      gainEnvelope: [
        { t: 0, v: 0 },
        { t: 0.4, v: 0.04 },
        { t: 1.5, v: 0 }
      ]
    });
  });

  return out;
}

function renderCelebrationTune() {
  const duration = 3.2;
  const out = makeSamples(duration);

  const melody = [
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

  melody.forEach(n => {
    const start = n.time;
    const end = start + n.duration + 0.1;
    addOscillator(out, {
      type: 'sine', freq: n.freq, startTime: start, stopTime: end,
      gainEnvelope: [
        { t: start, v: 0 },
        { t: start + 0.02, v: 0.1 },
        { t: start + n.duration - 0.05, v: 0.1 },
        { t: start + n.duration, v: 0.01, type: 'exp' }
      ]
    });
  });

  // Background chord pad
  const chordNotes = [261.63, 329.63, 392.00];
  chordNotes.forEach(freq => {
    addOscillator(out, {
      type: 'sine', freq, startTime: 0, stopTime: 3.1,
      gainEnvelope: [
        { t: 0, v: 0 },
        { t: 0.3, v: 0.04 },
        { t: 2.5, v: 0.04 },
        { t: 3.0, v: 0.001, type: 'exp' }
      ]
    });
  });

  return out;
}

function renderFillingSound(progress) {
  const duration = 0.08;
  const out = makeSamples(duration);
  const baseFreq = 200 + (progress / 100) * 400;

  addOscillator(out, {
    type: 'sine', freq: baseFreq, startTime: 0, stopTime: 0.05,
    gainEnvelope: [
      { t: 0, v: 0.03 },
      { t: 0.05, v: 0.01, type: 'exp' }
    ]
  });

  return out;
}

function renderModuleCompletionSound() {
  const duration = 5.5;
  const out = makeSamples(duration);

  const notes = [261.63, 329.63, 392.00, 523.25];
  notes.forEach((freq, index) => {
    const start = index * 0.05;
    const attack = 0.5, decay = 0.4, hold = 2.5, release = 2.0;
    const end = start + attack + decay + hold + release + 0.5;

    addFilteredOscillator(out, {
      type: 'sawtooth', freq, startTime: start, stopTime: end,
      filterFreq: 1200,
      gainEnvelope: [
        { t: start, v: 0 },
        { t: start + attack, v: 0.06 },
        { t: start + attack + decay, v: 0.05 },
        { t: start + attack + decay + hold, v: 0.05 },
        { t: start + attack + decay + hold + release, v: 0.001, type: 'exp' }
      ]
    });
  });

  // Noise rumble layer
  addNoise(out, {
    startTime: 0, stopTime: 5.0,
    filterFreq: 120,
    gainEnvelope: [
      { t: 0, v: 0 },
      { t: 2.0, v: 0.12 },
      { t: 4.5, v: 0 }
    ]
  });

  return out;
}

// ---------------------------------------------------------------------------
// Main — render and write all files
// ---------------------------------------------------------------------------

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const sounds = [
  { name: 'coin', render: () => renderRetroCoinSound() },
  { name: 'celebration', render: () => renderCelebrationSound() },
  { name: 'celebration-tune', render: () => renderCelebrationTune() },
  { name: 'filling-25', render: () => renderFillingSound(25) },
  { name: 'filling-50', render: () => renderFillingSound(50) },
  { name: 'filling-75', render: () => renderFillingSound(75) },
  { name: 'filling-100', render: () => renderFillingSound(100) },
  { name: 'module-complete', render: () => renderModuleCompletionSound() },
];

sounds.forEach(({ name, render }) => {
  process.stdout.write(`Rendering ${name}...`);
  const samples = render();
  const wav = encodeWav(samples, SAMPLE_RATE);
  const filePath = path.join(OUT_DIR, `${name}.wav`);
  fs.writeFileSync(filePath, wav);
  const kb = (wav.length / 1024).toFixed(1);
  console.log(` ${kb} KB -> ${filePath}`);
});

console.log('\nDone! All sounds exported to assets/sounds/');
