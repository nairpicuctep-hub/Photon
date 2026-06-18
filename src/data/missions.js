// missions.js — authored campaign missions (brief §8). Act I teaches the core
// loop and the friendship combos through obstacles that demand them: the Dark
// Wall demands the Light Lance (Radu × Victor); the cloaked boss demands Floris's
// Reveal. Each mission maps to Battle opts (data-driven; adding a mission = data).
//
// MissionDef: { id, act, name, blurb, teaches?, opts(BattleOpts), reward }

export const MISSIONS = [
  {
    id: 'm1_1', act: 1, name: 'First Light', teaches: null,
    blurb: 'The Shadow Network probes the frontier. Deploy the Light Team and destroy the Dark Core.',
    opts: {
      coreHp: 90, towerHp: 110,
      waves: { mode: 'script', firstDelay: 1.5, script: [
        { enemyId: 'crawler', count: 4, atTime: 1 },
        { enemyId: 'slinger', count: 2, atTime: 6 },
        { enemyId: 'crawler', count: 5, atTime: 12 },
        { enemyId: 'slinger', count: 3, atTime: 20 },
      ] },
    },
    reward: { unlock: 'm1_2' },
  },
  {
    id: 'm1_2', act: 1, name: 'The Dark Wall', teaches: 'light_lance',
    blurb: 'A wall of living darkness blocks the lane. Radu’s beam alone dies on it — refract it through Victor’s Prism to forge the Light Lance.',
    opts: {
      coreHp: 90, towerHp: 120,
      walls: [{ x: 760, height: 250, hp: 200 }],
      waves: { mode: 'script', firstDelay: 2, script: [
        { enemyId: 'slinger', count: 3, atTime: 2 },
        { enemyId: 'crawler', count: 4, atTime: 10 },
        { enemyId: 'brute', count: 1, atTime: 18 },
      ] },
    },
    reward: { unlock: 'm1_3' },
  },
  {
    id: 'm1_3', act: 1, name: 'Suppression', teaches: null,
    blurb: 'Null-Drones smother your light — your energy regen is halved while they live. Prioritise them, then break through.',
    opts: {
      coreHp: 100, towerHp: 110,
      waves: { mode: 'script', firstDelay: 1.5, script: [
        { enemyId: 'nullDrone', count: 1, atTime: 2 },
        { enemyId: 'crawler', count: 5, atTime: 4 },
        { enemyId: 'nullDrone', count: 1, atTime: 14 },
        { enemyId: 'brute', count: 1, atTime: 16 },
        { enemyId: 'slinger', count: 3, atTime: 22 },
      ] },
    },
    reward: { unlock: 'm1_4' },
  },
  {
    id: 'm1_4', act: 1, name: 'Umbra Stirs', teaches: 'exposed', objective: 'boss',
    blurb: 'Umbra, the living darkness, descends — cloaked and near-untouchable. Use Floris’s Reveal to expose it, then strike together.',
    opts: {
      coreHp: 80, towerHp: 130,
      waves: { mode: 'script', firstDelay: 1.5, script: [
        { enemyId: 'crawler', count: 4, atTime: 1 },
        { enemyId: 'slinger', count: 2, atTime: 8 },
        { enemyId: 'umbra', count: 1, atTime: 12 },
      ] },
    },
    reward: { unlock: 'm1_5' },
  },
  {
    id: 'm1_5', act: 1, name: 'Doctor Null', objective: 'boss',
    blurb: 'Doctor Null smothers your light — regen is halved while he lives. Hold the line, protect each other, and bring him down.',
    opts: {
      coreHp: 90, towerHp: 130,
      waves: { mode: 'script', firstDelay: 1.5, script: [
        { enemyId: 'nullDrone', count: 1, atTime: 1 },
        { enemyId: 'crawler', count: 4, atTime: 4 },
        { enemyId: 'wraith', count: 2, atTime: 8 },
        { enemyId: 'brute', count: 1, atTime: 10 },
        { enemyId: 'doctorNull', count: 1, atTime: 14 },
      ] },
    },
    reward: { unlock: 'm1_6' },
  },
  {
    id: 'm1_6', act: 1, name: 'The Void', objective: 'boss',
    blurb: 'The finale. The Void is cloaked AND armored AND radiates fear — only every friendship at once breaks it. Reveal it, smash its armor, and end the dark.',
    opts: {
      coreHp: 70, towerHp: 150,
      waves: { mode: 'script', firstDelay: 1.5, script: [
        { enemyId: 'crawler', count: 5, atTime: 1 },
        { enemyId: 'slinger', count: 3, atTime: 7 },
        { enemyId: 'wraith', count: 3, atTime: 10 },
        { enemyId: 'brute', count: 2, atTime: 13 },
        { enemyId: 'juggernaut', count: 1, atTime: 16 },
        { enemyId: 'theVoid', count: 1, atTime: 20 },
      ] },
    },
    reward: { unlock: null },
  },
];

export function missionById(id) { return MISSIONS.find((m) => m.id === id); }
export function actMissions(act) { return MISSIONS.filter((m) => m.act === act); }
