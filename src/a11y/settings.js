// settings.js — accessibility + audio settings store (brief §9). Persists via
// the save system. Reduced motion defaults to the OS preference but is
// user-overridable. Other systems read these live (audio: volumes; loop:
// gameSpeed; render: colorblind icons).

import { get as getSave, mergeSettings } from '../save/save.js';
import { reduce as envReduce, setReduce } from '../core/env.js';

const DEFAULTS = {
  reducedMotion: envReduce,
  colorblind: false,   // adds letter tags so units aren't distinguished by color alone
  gameSpeed: 1,        // accessibility: slow the whole game
  master: 0.75, music: 0.5, sfx: 0.85, muted: false,
};

let settings = { ...DEFAULTS, ...(getSave().settings || {}) };
setReduce(settings.reducedMotion); // apply persisted/OS reduced-motion at startup
const listeners = new Set();

export function getSettings() { return settings; }
export function isReduced() { return !!settings.reducedMotion; }
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function setSetting(key, value) {
  settings[key] = value;
  if (key === 'reducedMotion') setReduce(value);
  mergeSettings({ [key]: value });
  for (const fn of listeners) { try { fn(key, value, settings); } catch (e) { /* ignore */ } }
}

export function toggle(key) { setSetting(key, !settings[key]); return settings[key]; }
