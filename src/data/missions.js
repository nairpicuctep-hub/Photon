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
    blurb: 'The finale of Act I. The Void is cloaked AND armored AND radiates fear — only every friendship at once breaks it. Reveal it, smash its armor, and end the dark.',
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
    reward: { unlock: 'm2_1' },
  },

  // ===== Act II — The Null Tide =====
  {
    id: 'm2_1', act: 2, name: 'The Null Tide', teaches: null,
    blurb: 'Doctor Null’s curse spreads. Hexers now silence a hero’s power on hit — keep Pissy near to cleanse your friends with Good Spirits.',
    opts: {
      coreHp: 100, towerHp: 130,
      waves: { mode: 'script', firstDelay: 1.5, script: [
        { enemyId: 'crawler', count: 4, atTime: 1 },
        { enemyId: 'hexer', count: 2, atTime: 6 },
        { enemyId: 'slinger', count: 3, atTime: 13 },
        { enemyId: 'hexer', count: 2, atTime: 20 },
        { enemyId: 'brute', count: 1, atTime: 24 },
      ] },
    },
    reward: { unlock: 'm2_2' },
  },
  {
    id: 'm2_2', act: 2, name: 'Stolen Light',
    blurb: 'Doctor Null has stolen Radu’s power — the leader cannot deploy. Prove the team is stronger than any one hero. Hold the line together.',
    opts: {
      coreHp: 100, towerHp: 140, lockedHeroes: ['radu'],
      waves: { mode: 'script', firstDelay: 1.5, script: [
        { enemyId: 'wraith', count: 3, atTime: 2 },
        { enemyId: 'slinger', count: 3, atTime: 8 },
        { enemyId: 'hexer', count: 2, atTime: 14 },
        { enemyId: 'brute', count: 2, atTime: 20 },
        { enemyId: 'wraith', count: 3, atTime: 26 },
      ] },
    },
    reward: { unlock: 'm2_3' },
  },
  {
    id: 'm2_3', act: 2, name: 'The Iron Wall',
    blurb: 'A siege of armored Juggernauts — raw fire barely scratches them. Bring Manu: his anti-armor Titan Smash is the only thing that cracks their plates.',
    opts: {
      coreHp: 110, towerHp: 150, lockedHeroes: ['andreea'],
      waves: { mode: 'script', firstDelay: 1.5, script: [
        { enemyId: 'crawler', count: 5, atTime: 1 },
        { enemyId: 'juggernaut', count: 1, atTime: 8 },
        { enemyId: 'slinger', count: 3, atTime: 14 },
        { enemyId: 'juggernaut', count: 2, atTime: 22 },
        { enemyId: 'brute', count: 2, atTime: 30 },
      ] },
    },
    reward: { unlock: 'm2_4' },
  },
  {
    id: 'm2_4', act: 2, name: 'The Gathering Dark', objective: 'boss',
    blurb: 'The Shadow Network throws everything at you — its elite Wraiths, Hexers and Juggernauts, and a reforged Umbra. Every friendship, all at once.',
    opts: {
      coreHp: 90, towerHp: 160,
      waves: { mode: 'script', firstDelay: 1.5, script: [
        { enemyId: 'wraith', count: 3, atTime: 1 },
        { enemyId: 'hexer', count: 2, atTime: 7 },
        { enemyId: 'juggernaut', count: 1, atTime: 12 },
        { enemyId: 'brute', count: 2, atTime: 18 },
        { enemyId: 'umbra', count: 1, atTime: 24 },
      ] },
    },
    reward: { unlock: 'm3_1' },
  },

  // ===== Act III — Eclipse =====
  {
    id: 'm3_1', act: 3, name: 'Eclipse', teaches: null,
    blurb: 'Under the eclipse, Mirror-shadows reflect your light — raw fire bounces off. Deploy Victor: his Prism refracts around them so your attacks land.',
    opts: {
      biome: 'eclipse', coreHp: 100, towerHp: 170,
      waves: { mode: 'script', firstDelay: 2.5, script: [
        { enemyId: 'crawler', count: 3, atTime: 2 },
        { enemyId: 'mirror', count: 1, atTime: 9 },
        { enemyId: 'slinger', count: 2, atTime: 17 },
        { enemyId: 'mirror', count: 2, atTime: 25 },
      ] },
    },
    reward: { unlock: 'm3_2' },
  },
  {
    id: 'm3_2', act: 3, name: 'Hall of Mirrors',
    blurb: 'A wall of Mirrors, guarded by Hexers that silence your prism-maker. Keep Pissy near Victor — Good Spirits cleanses the curse so the Prism stays up.',
    opts: {
      biome: 'eclipse', coreHp: 110, towerHp: 150,
      waves: { mode: 'script', firstDelay: 1.5, script: [
        { enemyId: 'mirror', count: 2, atTime: 2 },
        { enemyId: 'hexer', count: 2, atTime: 8 },
        { enemyId: 'mirror', count: 3, atTime: 16 },
        { enemyId: 'brute', count: 1, atTime: 24 },
      ] },
    },
    reward: { unlock: 'm3_3' },
  },
  {
    id: 'm3_3', act: 3, name: 'Shattered Light',
    blurb: 'Mirrors AND armored Juggernauts, and Radu is still powerless. Victor breaks the mirrors, Manu cracks the armor — win it as a team, without the leader.',
    opts: {
      biome: 'eclipse', coreHp: 120, towerHp: 160, lockedHeroes: ['radu'],
      waves: { mode: 'script', firstDelay: 1.5, script: [
        { enemyId: 'mirror', count: 2, atTime: 2 },
        { enemyId: 'juggernaut', count: 1, atTime: 8 },
        { enemyId: 'mirror', count: 2, atTime: 16 },
        { enemyId: 'juggernaut', count: 1, atTime: 24 },
        { enemyId: 'hexer', count: 2, atTime: 30 },
      ] },
    },
    reward: { unlock: 'm3_4' },
  },
  {
    id: 'm3_4', act: 3, name: 'Eclipse’s End', objective: 'boss',
    blurb: 'The eclipse breaks — but The Void reforms one last time, shielded by Mirrors and elites. Reveal it, refract the mirrors, smash the armor, and bring back the dawn.',
    opts: {
      biome: 'eclipse', coreHp: 90, towerHp: 170,
      waves: { mode: 'script', firstDelay: 1.5, script: [
        { enemyId: 'mirror', count: 3, atTime: 1 },
        { enemyId: 'hexer', count: 2, atTime: 7 },
        { enemyId: 'juggernaut', count: 1, atTime: 12 },
        { enemyId: 'wraith', count: 3, atTime: 16 },
        { enemyId: 'theVoid', count: 1, atTime: 22 },
      ] },
    },
    reward: { unlock: 'm4_1' },
  },

  // ===== Act IV — Into the Void (finale) =====
  {
    id: 'm4_1', act: 4, name: 'The Long Dark', objective: 'boss',
    blurb: 'The Shadow Network empties its arsenal — every elite at once. Hold, adapt, and carve a path to the Void’s heart.',
    opts: {
      biome: 'eclipse', coreHp: 130, towerHp: 180,
      waves: { mode: 'script', firstDelay: 1.5, script: [
        { enemyId: 'crawler', count: 5, atTime: 1 },
        { enemyId: 'hexer', count: 2, atTime: 6 },
        { enemyId: 'mirror', count: 2, atTime: 12 },
        { enemyId: 'wraith', count: 3, atTime: 18 },
        { enemyId: 'juggernaut', count: 1, atTime: 24 },
        { enemyId: 'nullDrone', count: 1, atTime: 28 },
        { enemyId: 'brute', count: 2, atTime: 34 },
      ] },
    },
    reward: { unlock: 'm4_2' },
  },
  {
    id: 'm4_2', act: 4, name: 'Into the Void', objective: 'boss', finale: true,
    blurb: 'The final dark. The Void rises in full — survive every phase, break it with all your friendships at once, and bring back the dawn forever.',
    opts: {
      biome: 'eclipse', mode: 'bossrush', towerHp: 220,
      waves: { mode: 'script', firstDelay: 1.5, script: [
        { banner: { title: 'INTO THE VOID', subtitle: 'The last darkness', caption: 'Every friendship, one final time.', c1: '#b06bff', c2: '#6a5acd' }, atTime: 0.5 },
        { enemyId: 'crawler', count: 5, atTime: 2 },
        { enemyId: 'wraith', count: 3, atTime: 6 },
        { enemyId: 'theVoid', count: 1, atTime: 12 },
        { banner: { title: '✦ PHASE II', subtitle: 'The Swarm', caption: 'Hold the line — together.', c1: '#ff8a5a', c2: '#b06bff' }, atTime: 22 },
        { enemyId: 'juggernaut', count: 1, atTime: 24 },
        { enemyId: 'mirror', count: 2, atTime: 28 },
        { enemyId: 'hexer', count: 2, atTime: 34 },
        { banner: { title: '✦ PHASE III', subtitle: 'Break the Dark', caption: 'Bring back the dawn.', c1: '#ffd24a', c2: '#fff7d6' }, atTime: 42 },
        { enemyId: 'wraith', count: 3, atTime: 44 },
        { enemyId: 'brute', count: 2, atTime: 50 },
      ] },
    },
    reward: { unlock: null },
  },
];

export const ACTS = {
  1: { name: 'The First Light', eyebrow: 'ACT I' },
  2: { name: 'The Null Tide', eyebrow: 'ACT II' },
  3: { name: 'Eclipse', eyebrow: 'ACT III' },
  4: { name: 'Into the Void', eyebrow: 'ACT IV' },
};

export function missionById(id) { return MISSIONS.find((m) => m.id === id); }
export function actMissions(act) { return MISSIONS.filter((m) => m.act === act); }
export function acts() { return [...new Set(MISSIONS.map((m) => m.act))]; }
/** Global-order unlock: first mission is open; others unlock when the prior one is cleared. */
export function missionIndex(id) { return MISSIONS.findIndex((m) => m.id === id); }
export function prevMission(id) { const i = missionIndex(id); return i > 0 ? MISSIONS[i - 1] : null; }
