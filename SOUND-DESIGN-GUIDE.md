# Sound Design Guide — M1 Skills Prototype

This guide documents the sound system in the prototype: what each sound does, how it works technically, and how to modify sounds directly in code using the Web Audio API.

---

## Overview

The prototype has two sound modes:

1. **Audio file mode** (current) — Pre-rendered `.wav` files in `assets/sounds/`, played via `<audio>` elements. Simple to swap files; run `node scripts/export-sounds.js` to regenerate from code definitions.

2. **Web Audio API mode** (original) — Sounds synthesised in real-time in the browser using oscillators, gain nodes, and filters. No files needed; all sound design lives in code. The export script (`scripts/export-sounds.js`) contains the full synthesis logic if you want to switch back.

Both modes share the same public API in `js/sounds.js` — the rest of the codebase just calls functions like `playRetroCoinSound()` and doesn't care which mode is active.

---

## Sound inventory

| Function | File | Trigger | Duration | Character |
|---|---|---|---|---|
| `playRetroCoinSound()` | `coin.wav` | Item completion (video/reading mark-complete) | ~0.4s | Quick ascending 3-note chime |
| `playCelebrationSound()` | `celebration.wav` | All daily goals complete dialog | ~1.5s | Ascending arpeggio + sustained chord |
| `playCelebrationTune()` | `celebration-tune.wav` | Assignment/practice feedback modal | ~3.0s | 11-note melody with chord pad |
| `playFillingSound(progress)` | `filling-{25,50,75,100}.wav` | XP progress bar animation | ~0.05s | Short sine pip, pitch rises with progress |
| `playModuleCompletionSound()` | `module-complete.wav` | Module complete dialog | ~5.0s | Warm sawtooth chord + low rumble |

---

## Sound-to-event mapping

Detailed mapping of every sound to the exact UI event that triggers it and the user flow context. All call sites are in `js/main.js`.

### `playRetroCoinSound()` — `coin.wav`

| Event | User flow | Code location |
|---|---|---|
| Video completion | Learner watches a video to the end. The video-end modal appears showing XP earned and skill progress. Sound plays as the modal opens. | `triggerVideoEndModal()` — after the active item is marked complete |
| Reading mark-complete | Learner clicks "Mark as complete" on a reading item. Sound plays immediately (only if the XP intro modal has already been shown once). | `handleReadingMarkComplete()` — after status is flipped to completed |

### `playCelebrationSound()` — `celebration.wav`

| Event | User flow | Code location |
|---|---|---|
| All daily goals complete | All goals for the session are met (learning items + practice + coach for active; learning items for new). The goals-complete dialog appears. | `showGoalsCompleteDialog()` — as the modal becomes visible |
| XP intro modal (first-time) | The very first item completion in a session triggers the XP introduction modal instead of the normal feedback. Celebration sound plays on open. | `showXpIntroModal()` — as the modal displays |

### `playCelebrationTune()` — `celebration-tune.wav`

| Event | User flow | Code location |
|---|---|---|
| Assignment/practice feedback | Learner submits a practice assignment and the full-screen feedback modal opens showing their score, skill progress cards, and XP tags. Tune plays 300ms after modal open. | `showAssignmentFeedback()` — via `setTimeout(playCelebrationTune, 300)` |

### `playFillingSound(progress)` — `filling-{25,50,75,100}.wav`

| Event | User flow | Code location |
|---|---|---|
| Video-end skill progress bar | After the video-end modal appears, the skill XP progress bar animates to its new width. Pip plays at the target percentage. | `triggerVideoEndModal()` — inside the progress bar animation chain |
| Goals-complete skill progress bars | Inside the goals-complete dialog (active learner variant), skill cards animate their progress bars. Pip plays for the first card's target percentage. | `populateAndAnimateGoalsCompleteSkills()` — after cards and bars animate |
| Assignment feedback progress bars | Inside the assignment feedback modal, per-skill progress bars animate. Pip plays for the first card's target percentage. | `showAssignmentFeedback()` — in the final stage of the animation sequence |

### `playModuleCompletionSound()` — `module-complete.wav`

| Event | User flow | Code location |
|---|---|---|
| Module complete dialog | After the learner completes the final item in a module (specifically "Module 1 challenge") and dismisses the assignment feedback, the module-complete dialog appears. | `showModuleCompleteDialog()` — as the modal becomes visible |

### Trigger event tool (proto-tools shortcut)

Both "All daily goals complete" and "Module complete" can also be triggered manually via the **Trigger event** submenu in the proto-tools flyout (bottom-left wrench icon on the learning page). These call the same `showGoalsCompleteDialog()` and `showModuleCompleteDialog()` functions, so the same sounds play.

---

## Sound toggle and haptics

```
sessionStorage key: 'm1-skills-sound-enabled'
Default: true (sounds on)
```

- `isSoundEnabled()` — Returns boolean. Checked before every sound plays.
- `setSoundEnabled(bool)` — Persists to sessionStorage for the session.
- `triggerHaptic()` — Fires a 15ms vibration on supported devices (mobile). Called alongside most sounds.
- The UI toggle lives in the proto-tools flyout on every page.

---

## Swapping audio files

To replace a sound with a custom recording:

1. Export or record a `.wav` file (16-bit PCM, 44100 Hz, mono recommended)
2. Drop it into `assets/sounds/` with the matching filename
3. That's it — `js/sounds.js` preloads by filename

For the filling sound, there are 4 variants (`filling-25.wav` through `filling-100.wav`) at different pitches. You can replace all 4 or just provide one and update `playFillingSound()` in `js/sounds.js` to use a single file.

---

## Web Audio API reference (for code-based sound design)

The export script at `scripts/export-sounds.js` contains the full synthesis definitions. If you want to modify sounds in code and re-export, here's how everything works.

### Waveform types

| Type | Character | Use for |
|---|---|---|
| `sine` | Pure, clean, soft | Chimes, pips, gentle tones |
| `triangle` | Slightly brighter than sine, hollow | Arpeggios, mid-range sounds |
| `sawtooth` | Rich, buzzy, full of harmonics | Warm pads, synth-like textures |
| `square` | Hollow, retro, 8-bit feel | Retro/chip-tune effects |

### Frequency-to-note reference

| Note | Freq (Hz) | Note | Freq (Hz) |
|---|---|---|---|
| C4 (Middle C) | 261.63 | C5 | 523.25 |
| D4 | 293.66 | D5 | 587.33 |
| E4 | 329.63 | E5 | 659.25 |
| F4 | 349.23 | F5 | 698.46 |
| G4 | 392.00 | G5 | 783.99 |
| A4 | 440.00 | A5 | 880.00 |
| B4 | 493.88 | B5 | 987.77 |
| C6 | 1046.50 | D6 | 1174.66 |
| E6 | 1318.51 | | |

Quick formula: to go up one octave, multiply frequency by 2. Down one octave, divide by 2.

### Gain envelopes (ADSR)

Every sound uses a gain envelope to control volume over time. The four phases:

```
Volume
  ^
  |     /\
  |    /  \________
  |   /             \
  |  /               \
  +--A--D----S--------R--> Time
```

- **Attack (A)** — How quickly volume ramps up from 0 to peak. Short (0.01-0.02s) for percussive; longer (0.3-0.5s) for pads.
- **Decay (D)** — How quickly volume drops from peak to sustain level.
- **Sustain (S)** — The steady-state volume while the note plays.
- **Release (R)** — How quickly volume fades to 0 after the note ends.

In the export script, envelopes are defined as arrays of time/value points:

```javascript
gainEnvelope: [
  { t: 0,    v: 0 },           // start silent
  { t: 0.02, v: 0.1 },         // attack to 0.1 in 20ms
  { t: 0.5,  v: 0.1 },         // sustain at 0.1
  { t: 1.0,  v: 0.001, type: 'exp' }  // exponential release
]
```

- `type: 'exp'` gives a natural-sounding fade (logarithmic decay, like real instruments).
- Default (no type) is linear interpolation.
- Keep peak values between 0.03 and 0.15 — these sounds layer with other UI audio and shouldn't be loud.

---

## Detailed sound breakdowns

### 1. Retro coin sound (`playRetroCoinSound`)

Three ascending sine tones played in quick sequence, like a Mario coin.

| Tone | Frequency | Note | Start | Duration | Peak gain |
|---|---|---|---|---|---|
| 1 | 659 Hz | E5 | 0.00s | 0.15s | 0.07 |
| 2 | 784 Hz | G5 | 0.08s | 0.15s | 0.08 |
| 3 | 1047 Hz | C6 | 0.16s | 0.25s | 0.10 |

**To modify:** Change the frequencies to change the musical interval. Try `[523, 659, 784]` (C-E-G) for a major chord arpeggio, or `[440, 554, 659]` (A-C#-E) for an A major feel.

### 2. Celebration sound (`playCelebrationSound`)

Two layers:
- **Arpeggio**: 4 triangle-wave notes (C5-E5-G5-C6) played 120ms apart
- **Chord pad**: 3 sustained sine-wave notes (C4-E4-G4) forming a C major chord

**To modify:** Change the arpeggio speed by adjusting the `i * 0.12` multiplier. Change the chord by swapping the `chordNotes` array.

### 3. Celebration tune (`playCelebrationTune`)

A composed 11-note melody over a C major chord pad. This plays on assignment feedback.

```
Note timeline:
C5 -> E5 -> G5 -> C6 (hold) ... G5 -> C6 -> D6 (hold) -> C6 (hold) ... G5 -> C6 -> E6 (hold)
0.0   0.15  0.3   0.45         0.9   1.05  1.2          1.55         2.1   2.3   2.5
```

**To modify:** Edit the `melody` array in the export script. Each entry has `freq`, `time` (start in seconds), and `duration`.

### 4. Filling sound (`playFillingSound`)

A very short sine pip whose pitch scales with the progress percentage:

```
Frequency = 200 + (progress / 100) * 400
```

| Progress | Frequency | Approx. note |
|---|---|---|
| 25% | 300 Hz | ~D4 |
| 50% | 400 Hz | ~G4 |
| 75% | 500 Hz | ~B4 |
| 100% | 600 Hz | ~D5 |

**To modify:** Adjust the base frequency (200) or the range multiplier (400) to shift the pitch range.

### 5. Module completion sound (`playModuleCompletionSound`)

The most complex sound. Two layers:

**Layer 1 — Sawtooth chord** through a lowpass filter (1200 Hz cutoff):
- C4, E4, G4, C5 — staggered 50ms apart
- Long ADSR: 0.5s attack, 0.4s decay, 2.5s sustain, 2.0s release
- Peak gain: 0.06, sustain: 0.05

**Layer 2 — Filtered noise rumble**:
- White noise through a 120 Hz lowpass filter
- Slowly swells from 0 to gain 0.12 over 2s, then fades over 2.5s

**To modify:** The `filterFreq` value (1200) controls brightness — lower for warmer/darker, higher for brighter. The noise `filterFreq` (120) controls the rumble depth.

---

## Re-exporting after changes

After editing `scripts/export-sounds.js`:

```bash
node scripts/export-sounds.js
```

This overwrites all files in `assets/sounds/`. No other changes needed — `js/sounds.js` references them by the same filenames.

---

## Switching back to Web Audio API synthesis

If you prefer real-time synthesis (no audio files), the original `sounds.js` code is preserved in git history. You can also reconstruct it from the export script — each `render*` function in `scripts/export-sounds.js` maps 1:1 to the original `play*` functions.

The key advantage of synthesis is that `playFillingSound(progress)` can produce a continuous pitch range rather than 4 discrete variants.
