// audio.js — Web Audio engine, fully synthesized (no asset files). An adaptive
// ambient bed that brightens dark -> dawn (mirrors the front line), plus short
// SFX cues. Master/music/sfx volumes + mute, persisted via settings. Audio must
// start on a user gesture (mobile), so we lazily create/resume on first use.

import { getSettings, onChange } from '../a11y/settings.js';

let ctx = null, master = null, musicGain = null, sfxGain = null;
let darkGain = null, dawnGain = null;
let started = false;

function ensure() {
  if (ctx) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  master = ctx.createGain(); master.connect(ctx.destination);
  musicGain = ctx.createGain(); musicGain.connect(master);
  sfxGain = ctx.createGain(); sfxGain.connect(master);
  applyVolumes();
  buildBed();
  return true;
}

function applyVolumes() {
  if (!ctx) return;
  const s = getSettings();
  const m = s.muted ? 0 : s.master;
  master.gain.setTargetAtTime(m, ctx.currentTime, 0.05);
  musicGain.gain.setTargetAtTime(s.music, ctx.currentTime, 0.05);
  sfxGain.gain.setTargetAtTime(s.sfx, ctx.currentTime, 0.05);
}
onChange((k) => { if (['master', 'music', 'sfx', 'muted'].includes(k)) applyVolumes(); });

// Ambient bed: a low drone (dark) crossfading into a brighter detuned pad (dawn).
function buildBed() {
  darkGain = ctx.createGain(); darkGain.gain.value = 0.18; darkGain.connect(musicGain);
  dawnGain = ctx.createGain(); dawnGain.gain.value = 0.0; dawnGain.connect(musicGain);
  const mkOsc = (type, freq, gainNode, detune = 0) => {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; o.detune.value = detune;
    const g = ctx.createGain(); g.gain.value = 0.5; o.connect(g); g.connect(gainNode); o.start(); return o;
  };
  // dark: low fifths
  mkOsc('sawtooth', 55, darkGain); mkOsc('sawtooth', 82.4, darkGain, 6);
  // dawn: warm major chord (A C# E) up an octave, gently detuned
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200; lp.connect(dawnGain);
  for (const f of [220, 277.2, 329.6]) { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = (Math.random() * 8 - 4); const g = ctx.createGain(); g.gain.value = 0.33; o.connect(g); g.connect(lp); o.start(); }
}

/** Call once on a user gesture (click/tap/key). */
export function startAudio() {
  if (started) return;
  if (!ensure()) return;
  if (ctx.state === 'suspended') ctx.resume();
  started = true;
}

/** Mirror the battle's dawn (0..1): brighten the bed. */
export function setMusicDawn(d) {
  if (!ctx) return;
  const t = ctx.currentTime;
  darkGain.gain.setTargetAtTime(0.18 * (1 - d * 0.7), t, 0.4);
  dawnGain.gain.setTargetAtTime(0.16 * d, t, 0.4);
}

// ---- SFX -------------------------------------------------------------------
function blip({ type = 'sine', f0, f1, dur = 0.18, gain = 0.5, when = 0 }) {
  if (!ctx) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t);
  if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + dur + 0.02);
}
function noise({ dur = 0.2, gain = 0.4, cutoff = 800 }) {
  if (!ctx) return;
  const t = ctx.currentTime; const n = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate); const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cutoff;
  const g = ctx.createGain(); g.gain.value = gain;
  src.connect(lp); lp.connect(g); g.connect(sfxGain); src.start(t);
}

const SFX = {
  beam: () => blip({ type: 'sawtooth', f0: 900, f1: 300, dur: 0.16, gain: 0.35 }),
  bolt: () => blip({ type: 'square', f0: 660, f1: 440, dur: 0.08, gain: 0.18 }),
  smash: () => { noise({ dur: 0.3, gain: 0.5, cutoff: 500 }); blip({ type: 'sine', f0: 120, f1: 50, dur: 0.3, gain: 0.4 }); },
  deploy: () => blip({ type: 'triangle', f0: 330, f1: 660, dur: 0.12, gain: 0.25 }),
  reveal: () => blip({ type: 'sine', f0: 500, f1: 1200, dur: 0.3, gain: 0.25 }),
  combo: () => { [523, 659, 784, 1047].forEach((f, i) => blip({ type: 'triangle', f0: f, dur: 0.18, gain: 0.3, when: i * 0.06 })); },
  win: () => { [392, 523, 659, 784].forEach((f, i) => blip({ type: 'triangle', f0: f, dur: 0.5, gain: 0.3, when: i * 0.12 })); },
  lose: () => { [330, 247, 196].forEach((f, i) => blip({ type: 'sawtooth', f0: f, dur: 0.5, gain: 0.25, when: i * 0.15 })); },
};

export function sfx(name) { const fn = SFX[name]; if (fn) try { fn(); } catch (e) { /* ignore */ } }
