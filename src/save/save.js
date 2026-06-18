// save.js — versioned SaveState in localStorage with a migrate() for forward
// compatibility (brief §11). No secrets. Includes a reset.

import { upgradeForClearCount } from '../data/upgrades.js';

const KEY = 'echipa-lumina:save';
const VERSION = 1;

/** @returns {object} default save */
function freshSave() {
  return {
    version: VERSION,
    campaign: [],                 // [{ missionId, stars }]
    unlocked: { heroes: ['trooper', 'radu', 'victor', 'manu', 'floris', 'andreea', 'pissy'], combos: ['light_lance'], upgrades: [] },
    settings: {},                 // merged A11y + Audio settings live here
    stats: { kills: 0, combosTriggered: {}, wins: 0, bestSurvival: 0 },
    player: { name: '' },
    scores: [],               // leaderboard: [{ name, score, time, diff }]
  };
}

function migrate(data) {
  if (!data || typeof data !== 'object') return freshSave();
  // future migrations switch on data.version here
  const base = freshSave();
  return {
    ...base, ...data, version: VERSION,
    unlocked: { ...base.unlocked, ...(data.unlocked || {}) },
    stats: { ...base.stats, ...(data.stats || {}) },
    settings: { ...base.settings, ...(data.settings || {}) },
  };
}

let state = freshSave();
load();

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? migrate(JSON.parse(raw)) : freshSave();
  } catch (e) { state = freshSave(); }
  return state;
}

export function get() { return state; }

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode / quota */ }
}

/** Record a mission result; keeps the best star rating. */
export function recordMission(missionId, stars, won) {
  const entry = state.campaign.find((c) => c.missionId === missionId);
  if (entry) entry.stars = Math.max(entry.stars, stars);
  else state.campaign.push({ missionId, stars });
  if (won) state.stats.wins++;
  // friendship meta: each newly cleared mission grants the next upgrade
  const cleared = state.campaign.filter((c) => c.stars > 0).length;
  const up = upgradeForClearCount(cleared);
  if (up && !state.unlocked.upgrades.includes(up)) state.unlocked.upgrades.push(up);
  save();
}

export function isMissionCleared(missionId) { return state.campaign.some((c) => c.missionId === missionId && c.stars > 0); }
export function missionStars(missionId) { const e = state.campaign.find((c) => c.missionId === missionId); return e ? e.stars : 0; }

export function getName() { return (state.player && state.player.name) || ''; }
export function setName(name) { state.player = state.player || {}; state.player.name = String(name || '').trim().slice(0, 16); save(); }

/** Add a leaderboard entry; returns its 1-based rank, or 0 if it missed the top 12. */
export function addScore(entry) {
  state.scores = state.scores || [];
  const e = { name: (entry.name || 'Hero').slice(0, 16), score: entry.score | 0, time: entry.time | 0, diff: entry.diff || 'normal' };
  state.scores.push(e);
  state.scores.sort((a, b) => b.score - a.score);
  const rank = state.scores.indexOf(e) + 1;
  state.scores = state.scores.slice(0, 12);
  save();
  return rank <= 12 ? rank : 0;
}
export function topScores(n = 10) { return (state.scores || []).slice(0, n); }

export function recordSurvival(score) {
  if (score > (state.stats.bestSurvival || 0)) { state.stats.bestSurvival = score; save(); return true; }
  return false;
}

export function unlock(kind, id) {
  const list = state.unlocked[kind];
  if (list && !list.includes(id)) { list.push(id); save(); }
}

export function mergeSettings(patch) { state.settings = { ...state.settings, ...patch }; save(); }

export function reset() { state = freshSave(); save(); }
