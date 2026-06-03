# 🎧 useGitSynth.ts 

> "Code isn't just logic. It has a rhythm, a weight, and a psychological temperature."

Welcome to the sonic heartbeat of **CommitPulse**. 

Instead of triggering basic, childish arcade beeps, `useGitSynth` is a generative audio hook built on top of the **Tone.js** framework. It translates cold, raw code signatures, terminal logs, and unique error strings into an evolving, continuous cyberpunk soundscape. 

Because it operates entirely on procedural algorithmic generation, **no two unique errors will ever sound the exact same.**

---

## 🧬 Architectural Flow

The engine completely bypasses pre-recorded static mp3 assets. It instantiates a localized synth network directly within the client's Web Audio API context, channeling code streams through a dynamic musical matrix:

Raw String Data ] ──> [ Deterministic Hashing ] ──> [ Scale Intercept Mapping ]
│
┌───────────────────────┴──────────────────────────────┐
▼                                                       ▼
[ Melodic Motifs ]                                     [ Parametric Modulations ]
• C-Minor Ambient Scale                                 • Adaptive low-pass cutoff sweeps
• 3-Note Open Harmonies                                 • 1-Semitone friction transpositions
• Spatial Room Reflections                              • Evolving sub-bass baseline chords

### 1. Text-to-Math Determinism
The engine passes the incoming text string through a localized hashing algorithm (`hashString()`). This returns a unique mathematical seed used to isolate 3 distinct notes from a high-end, atmospheric C-Minor scale configuration. If you change a single variable name, line number, or character in an error log, the entire melodic pattern changes instantly.

### 2. The Persistent Ambient Pad
To prevent the sound from cutting out awkwardly like a soundboard toy, a low-pass sub-bass sine drone (`C2` / `G2`) breathes continuously in the background. When code changes or errors occur, the root note of this baseline dynamically slips into a new chord inversion, blending the entire tracking experience into one unbroken song.

### 3. Humanized Contextual Profiles
* **Features & Cleans:** Spawns expansive, airy 3-note open arpeggios washed in an `88%` wet cinematic room reverb. It sounds like structural progress.
* **Friction & Exceptions:** Clamps down a steep low-pass filter (ranging from 450Hz to 750Hz based on the text hash) to sound dark and claustrophobic. The engine calculates the frequency of the second note and forces a **1-semitone transposition**, injecting deliberate musical dissonance (*friction*) into the air.

---

## 🛠️ Implementation Guide

### Hook API Signature
```typescript
const { composeFromText } = useGitSynth();
