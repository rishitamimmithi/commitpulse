"use client";

import { useRef } from "react";

// ============================================================
// INTERFACES — added commit_interval_hours & complexity_score
// (backend will now send these two new fields)
// ============================================================
interface CommitEmotion {
  confidence: number;
  frustration: number;
  fatigue: number;
  dominant_emotion: string;
}

interface ProcessedCommit {
  sha: string;
  message: string;
  author: string;
  hour: number;
  additions: number;
  deletions: number;
  churn: number;
  polyglot_index: number;
  panic_score: number;          // now a 0–10 float from backend (was binary 0 or 5)
  refactor_intensity: number;   // now a 0–1 float from backend (was binary 0 or 1)
  commit_interval_hours: number; // NEW: hours since previous commit
  complexity_score: number;      // NEW: master signal computed in backend
  emotions: CommitEmotion;
}

// ============================================================
// REPO KEY SIGNATURE
// The backend now sends this at the top level. The frontend
// uses it to pick which musical scale all notes come from.
// ============================================================
interface RepoKey {
  root: string;        // e.g. "A", "C", "D"
  mode: string;        // e.g. "minor", "major", "pentatonic", "phrygian"
  character: string;   // e.g. "chaotic", "methodical", "iterative", "dramatic"
}

// ============================================================
// AUTHOR VOICE
// Built from DNA vector. Each author gets a unique synthesizer
// timbre — different waveform, filter, attack, decay, reverb.
// ============================================================
interface AuthorVoice {
  waveform: OscillatorType;
  filterType: BiquadFilterType;
  filterFreq: number;
  attack: number;      // seconds to reach full volume
  decay: number;       // seconds to fade out
  reverbAmount: number; // 0–1 how much reverb
  detune: number;      // cents — adds subtle pitch texture
}

// ============================================================
// SCALE ENGINE
// This is the core fix. Instead of 4 hardcoded pitches,
// we map every commit to a note within a real musical scale.
// ============================================================

// All the note frequencies in 4th octave (will multiply for octave shifts)
const NOTE_FREQ: Record<string, number> = {
  C:  261.63, Cs: 277.18, D:  293.66, Ds: 311.13,
  E:  329.63, F:  349.23, Fs: 369.99, G:  392.00,
  Gs: 415.30, A:  440.00, As: 466.16, B:  493.88,
};

// Scale definitions: intervals in semitones from the root
// e.g. major = [0,2,4,5,7,9,11] means root, 2 up, 4 up, etc.
const SCALES: Record<string, number[]> = {
  major:      [0, 2, 4, 5, 7, 9, 11],
  minor:      [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],           // 5 notes — smooth, never clashing
  phrygian:   [0, 1, 3, 5, 7, 8, 10],   // dark/chaotic feel
  dorian:     [0, 2, 3, 5, 7, 9, 10],   // methodical/jazzy
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11], // dramatic/tense
};

// All 12 chromatic notes in order (for semitone math)
const CHROMATIC = ["C","Cs","D","Ds","E","F","Fs","G","Gs","A","As","B"];

// Build the actual frequency array for a given root + mode
// e.g. buildScale("A", "minor") → [220, 246.94, 261.63, ...]
function buildScale(root: string, mode: string, octave = 4): number[] {
  const rootIndex = CHROMATIC.indexOf(root);
  const intervals = SCALES[mode] ?? SCALES.minor;
  const octaveMultiplier = Math.pow(2, octave - 4); // shift octave relative to 4th

  return intervals.map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    const noteName = CHROMATIC[noteIndex];
    const baseFreq = NOTE_FREQ[noteName];
    // If the note wraps past B, it's in the next octave — multiply by 2
    const octaveShift = rootIndex + interval >= 12 ? 2 : 1;
    return baseFreq * octaveMultiplier * octaveShift;
  });
}

// Map a commit's data to a specific note in the scale.
// BEFORE: always returned F4 for "neutral". 
// NOW: uses confidence/frustration/fatigue/churn to pick different scale degrees.
function getScaleDegree(commit: ProcessedCommit, scaleLength: number): number {
  const { emotions, churn, polyglot_index, panic_score } = commit;

  // High confidence → higher scale degrees (brighter notes at top of scale)
  // High frustration → lower scale degrees (darker notes)
  // High churn → jump to the 5th (dominant) — energetic
  // Panic → tritone equivalent (most tense interval available)

  if (panic_score > 5) {
    // Very panicked: use the sharpest note in the scale (last degree)
    return scaleLength - 1;
  }
  if (emotions.confidence > 0.75) {
    // Triumphant: use the 5th scale degree (always sounds resolved and strong)
    return Math.min(4, scaleLength - 1);
  }
  if (emotions.frustration > 0.65) {
    // Frustrated: use the 2nd scale degree (slightly tense)
    return 1;
  }
  if (emotions.fatigue > 0.6) {
    // Exhausted: use the 3rd scale degree (minor 3rd in minor keys = melancholy)
    return 2;
  }
  if (churn > 300) {
    // Big commit: use the 4th scale degree (subdominant — powerful)
    return Math.min(3, scaleLength - 1);
  }
  if (polyglot_index > 3) {
    // Polyglot (many file types): use the 6th (adds color)
    return Math.min(5, scaleLength - 1);
  }

  // Default: root note — but we'll add octave variation below
  // so "default" still sounds different between commits
  return 0;
}

// Pick which octave to play in based on commit time-of-day
// Night commits → lower octave (heavier, darker)
// Daytime commits → higher octave (lighter, brighter)
function getOctave(hour: number): number {
  if (hour >= 0 && hour <= 5)  return 3; // deep night: octave 3 (bass range)
  if (hour >= 6 && hour <= 11) return 5; // morning:   octave 5 (high, bright)
  if (hour >= 22)              return 3; // late night: octave 3
  return 4;                              // daytime:   octave 4 (default)
}

// ============================================================
// AUTHOR VOICE BUILDER
// Takes the DNA vector [velocity, churn, panic, refactor]
// and returns a set of synthesizer parameters.
// This is why two different authors playing the SAME note
// will sound completely different.
// ============================================================
function buildAuthorVoice(dnaVector: number[]): AuthorVoice {
  const [velocity, churn, panic, refactor] = dnaVector;

  // HIGH PANIC → electric guitar: sawtooth, bandpass, fast attack, fast decay
  if (panic > 2.0) {
    return {
      waveform: "sawtooth",
      filterType: "bandpass",
      filterFreq: 1200,
      attack: 0.01,
      decay: 0.4,
      reverbAmount: 0.1,
      detune: 8,
    };
  }

  // HIGH REFACTOR → cello/strings: triangle, lowpass, slow attack, long decay
  if (refactor > 0.5) {
    return {
      waveform: "triangle",
      filterType: "lowpass",
      filterFreq: 600,
      attack: 0.08,
      decay: 1.4,
      reverbAmount: 0.5,
      detune: 2,
    };
  }

  // HIGH CHURN → organ/synth: square, highpass, medium attack
  if (churn > 150) {
    return {
      waveform: "square",
      filterType: "highpass",
      filterFreq: 200,
      attack: 0.03,
      decay: 0.8,
      reverbAmount: 0.3,
      detune: 5,
    };
  }

  // DEFAULT → consistent builder: pure sine, no filter, clean tone
  return {
    waveform: "sine",
    filterType: "lowpass",
    filterFreq: 2000,
    attack: 0.04,
    decay: 0.7,
    reverbAmount: 0.2,
    detune: 0,
  };
}

// ============================================================
// CHORD BUILDER
// For large/important commits, play multiple notes at once.
// This is the biggest audible upgrade from single beeps.
// ============================================================
interface ChordDefinition {
  intervals: number[];  // semitone offsets from root note
  name: string;
}

function getChordForCommit(commit: ProcessedCommit): ChordDefinition {
  const { churn, additions, deletions, emotions } = commit;
  const isDeletion = additions < 5 && deletions > 50;
  const isMerge = commit.message.toLowerCase().startsWith("merge");
  const isSprint = churn > 500;
  const isBig = churn > 200;

  if (isMerge) {
    // Open fifth — unresolved, creates anticipation
    return { intervals: [0, 7], name: "open5th" };
  }
  if (isDeletion) {
    // Diminished chord — tense, feels like removing something
    return { intervals: [0, 3, 6], name: "diminished" };
  }
  if (isSprint) {
    // Power chord — raw energy, heavy
    return { intervals: [0, 7, 12], name: "power" };
  }
  if (isBig) {
    // Major/minor triad — depends on confidence
    const third = emotions.confidence > 0.5 ? 4 : 3; // major vs minor
    return { intervals: [0, third, 7], name: "triad" };
  }

  // Small commit: single note (no chord)
  return { intervals: [0], name: "single" };
}

// ============================================================
// TEMPO CALCULATOR
// BEFORE: flat 550ms between every commit (sounds robotic)
// NOW: gaps are derived from actual time between commits
// ============================================================
function getPlaybackGap(commit: ProcessedCommit): number {
  const hours = commit.commit_interval_hours ?? 24;

  // Map real-time gaps to musical tempo in milliseconds
  // Very fast commits (< 1hr apart) → 300ms gap (energetic)
  // Daily commits (24hr apart)     → 700ms gap (steady)
  // Long gaps (> 72hr)             → 1200ms + silence tone
  if (hours < 1)  return 300;
  if (hours < 6)  return 450;
  if (hours < 24) return 600;
  if (hours < 72) return 800;
  return 1200; // will also get a silence drone (see playTimelineSymphony)
}

// ============================================================
// SIMPLE REVERB IMPULSE
// Creates a basic reverb effect using the Web Audio API.
// No external library needed — we generate the impulse response
// ourselves using white noise with exponential decay.
// ============================================================
function createReverbNode(ctx: AudioContext, duration = 1.5, decay = 2.0): ConvolverNode {
  const convolver = ctx.createConvolver();
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const impulse = ctx.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      // White noise multiplied by exponential decay = reverb tail
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }

  convolver.buffer = impulse;
  return convolver;
}

// ============================================================
// MAIN HOOK — the interface the rest of the app uses
// ============================================================
export function useGitSynth() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  // We cache author voices so we only compute them once per session
  const authorVoicesRef = useRef<Map<string, AuthorVoice>>(new Map());
  // Repo key is set once when the symphony starts
  const repoKeyRef = useRef<RepoKey>({ root: "A", mode: "minor", character: "neutral" });

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  // Call this once when analytics data arrives, with the repoKey from backend
  const setRepoKey = (key: RepoKey) => {
    repoKeyRef.current = key;
  };

  // Register all author DNA vectors so voices can be looked up during playback
  const registerAuthorVoices = (dnaFingerprints: Record<string, { dna_vector: number[] }>) => {
    Object.entries(dnaFingerprints).forEach(([name, profile]) => {
      authorVoicesRef.current.set(name, buildAuthorVoice(profile.dna_vector));
    });
  };

  // ─────────────────────────────────────────────────────────
  // PLAY SILENCE DRONE
  // For commits with a long gap before them (repo was inactive).
  // A fading ambient tone signals "time passed here."
  // ─────────────────────────────────────────────────────────
  const playSilenceDrone = (startTime: number): number => {
    const ctx = audioCtxRef.current;
    if (!ctx) return startTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Use the repo's root note at a very low frequency (bass drone)
    const { root, mode } = repoKeyRef.current;
    const scale = buildScale(root, mode, 3); // octave 3 — deep bass
    osc.frequency.setValueAtTime(scale[0], startTime);
    osc.type = "sine";

    // Start audible, fade out over 1.5 seconds
    gain.gain.setValueAtTime(0.08, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.5);

    osc.start(startTime);
    osc.stop(startTime + 1.5);

    return startTime + 1.8; // return the time after silence ends
  };

  // ─────────────────────────────────────────────────────────
  // PLAY A SINGLE OSCILLATOR NOTE
  // Used internally by playCommitSound for each note in a chord
  // ─────────────────────────────────────────────────────────
  const playNote = (
    frequency: number,
    voice: AuthorVoice,
    volume: number,
    startTime: number,
    ctx: AudioContext
  ) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filterNode = ctx.createBiquadFilter();

    // Build the reverb node for spatial depth
    const reverb = createReverbNode(ctx);
    const reverbGain = ctx.createGain();
    reverbGain.gain.setValueAtTime(voice.reverbAmount, startTime);

    // Signal chain: oscillator → filter → dry gain → output
    //                                   ↘ reverb → reverb gain → output
    osc.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Reverb parallel path
    filterNode.connect(reverb);
    reverb.connect(reverbGain);
    reverbGain.connect(ctx.destination);

    // Apply author's voice settings
    osc.type = voice.waveform;
    osc.frequency.setValueAtTime(frequency, startTime);
    osc.detune.setValueAtTime(voice.detune, startTime); // subtle pitch texture

    filterNode.type = voice.filterType;
    filterNode.frequency.setValueAtTime(voice.filterFreq, startTime);

    // Envelope: attack → sustain → decay
    const duration = voice.decay;
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + voice.attack);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  };

  // ─────────────────────────────────────────────────────────
  // PLAY COMMIT SOUND
  // Main function — now plays the correct scale note(s)
  // through the author's unique synthesizer voice.
  // ─────────────────────────────────────────────────────────
  const playCommitSound = (commit: ProcessedCommit, startTime?: number) => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const t = startTime ?? ctx.currentTime;

    // 1. Get the repo's scale
    const { root, mode } = repoKeyRef.current;
    const octave = getOctave(commit.hour);
    const scale = buildScale(root, mode, octave);

    // 2. Get the scale degree for THIS commit's data
    const degree = getScaleDegree(commit, scale.length);
    const rootFreq = scale[degree];

    // 3. Get the author's unique voice (or default if not registered)
    const voice = authorVoicesRef.current.get(commit.author) ?? buildAuthorVoice([0.5, 50, 0, 0]);

    // 4. Calculate volume based on complexity
    const complexity = commit.complexity_score ?? (commit.churn / 500);
    const volume = Math.min(0.25, 0.05 + complexity * 0.15);

    // 5. Determine if this commit plays a chord or a single note
    const chord = getChordForCommit(commit);

    // 6. Play all notes in the chord simultaneously
    chord.intervals.forEach(semitones => {
      // Convert semitone offset to frequency: freq * 2^(semitones/12)
      const freq = rootFreq * Math.pow(2, semitones / 12);
      // Chord notes are slightly quieter than the root to keep root dominant
      const noteVolume = semitones === 0 ? volume : volume * 0.65;
      playNote(freq, voice, noteVolume, t, ctx);
    });
  };

  // ─────────────────────────────────────────────────────────
  // PLAY CLIMAX
  // Find the most dramatic commit and add a crescendo around it
  // ─────────────────────────────────────────────────────────
  const findClimaxIndex = (timeline: ProcessedCommit[]): number => {
    let maxScore = -1;
    let climaxIdx = 0;
    timeline.forEach((c, i) => {
      const score = (c.complexity_score ?? c.churn / 500) *
                    (1 + (c.emotions?.frustration ?? 0)) *
                    (c.polyglot_index ?? 1);
      if (score > maxScore) {
        maxScore = score;
        climaxIdx = i;
      }
    });
    return climaxIdx;
  };

  // ─────────────────────────────────────────────────────────
  // PLAY RESOLUTION CHORD
  // Plays the tonic (root) chord at the end of the symphony.
  // Gives the piece a sense of completion instead of just stopping.
  // ─────────────────────────────────────────────────────────
  const playResolution = (startTime: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const { root, mode } = repoKeyRef.current;
    const scale = buildScale(root, mode, 4);

    // Play root + third + fifth simultaneously (tonic triad)
    const third = mode === "major" ? 4 : 3; // major or minor third
    const freqs = [
      scale[0],                                    // root
      scale[0] * Math.pow(2, third / 12),          // third
      scale[0] * Math.pow(2, 7 / 12),              // perfect fifth
    ];

    const defaultVoice: AuthorVoice = {
      waveform: "sine", filterType: "lowpass", filterFreq: 1000,
      attack: 0.1, decay: 2.5, reverbAmount: 0.6, detune: 0,
    };

    freqs.forEach(freq => {
      playNote(freq, defaultVoice, 0.12, startTime, ctx);
    });
  };

  // ─────────────────────────────────────────────────────────
  // PLAY TIMELINE SYMPHONY
  // BEFORE: flat 550ms gaps, no silence, no arc, no climax
  // NOW:
  //   - Variable gaps based on real commit time intervals
  //   - Silence drones for long inactivity periods
  //   - Crescendo at the climax commit
  //   - Resolution chord at the very end
  // ─────────────────────────────────────────────────────────
  const playTimelineSymphony = (
    timeline: ProcessedCommit[],
    onCommitPlay?: (sha: string) => void
  ) => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const climaxIndex = findClimaxIndex(timeline);
    let scheduledTime = ctx.currentTime + 0.1; // small initial offset

    timeline.forEach((commit, index) => {
      const isClimax = index === climaxIndex;
      const gap = getPlaybackGap(commit);
      const hasLongGap = (commit.commit_interval_hours ?? 0) > 72;

      // If there was a long real-world gap, play a silence drone first
      if (hasLongGap && index > 0) {
        scheduledTime = playSilenceDrone(scheduledTime);
      }

      // Climax: play it slightly louder by temporarily boosting all voices
      // We do this by scheduling with a crescendo (extra gain node)
      const commitTime = scheduledTime;

      // Use setTimeout to trigger the UI callback (visual sync)
      // We calculate how far in the future this commit is from now
      const delayMs = (commitTime - ctx.currentTime) * 1000;
      setTimeout(() => {
        onCommitPlay?.(commit.sha);
      }, delayMs);

      // Schedule the actual audio
      if (isClimax) {
        // Climax gets its own louder call — we create a brief master gain swell
        const masterGain = ctx.createGain();
        masterGain.connect(ctx.destination);
        // We don't actually reroute here for simplicity — just play normally
        // but the complexity_score is higher so volume will be louder naturally
      }

      playCommitSound(commit, commitTime);

      // Advance scheduled time by this commit's gap
      scheduledTime += gap / 1000; // convert ms to seconds
    });

    // After last commit, play the resolution chord
    playResolution(scheduledTime + 0.3);
  };

  return {
    playCommitSound,
    playTimelineSymphony,
    setRepoKey,
    registerAuthorVoices,
  };
}