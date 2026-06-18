// enemies.js — tunable Shadow Network unit stats. Bosses are added in M4.
// EnemyDef: { id, name, maxHp, moveSpeed, attack:{damage,range,cooldown,kind},
//             traits?, height? }

export const ENEMY_DEFS = {
  crawler: {
    id: 'crawler', name: 'Crawler', maxHp: 30, moveSpeed: 96,
    attack: { damage: 7, range: 48, cooldown: 0.8, kind: 'melee' },
    traits: [],
  },
  slinger: {
    id: 'slinger', name: 'Slinger', maxHp: 34, moveSpeed: 54,
    attack: { damage: 9, range: 330, cooldown: 1.9, kind: 'bolt' },
    traits: [],
  },
  brute: {
    id: 'brute', name: 'Brute', maxHp: 160, moveSpeed: 34,
    attack: { damage: 22, range: 72, cooldown: 1.6, kind: 'melee' },
    traits: ['armored'],
  },
  nullDrone: {
    id: 'nullDrone', name: 'Null-Drone', maxHp: 44, moveSpeed: 46,
    attack: { damage: 0, range: 0, cooldown: 99, kind: 'none' },
    traits: ['suppresses_regen'],
  },
  wraith: {
    id: 'wraith', name: 'Wraith', maxHp: 46, moveSpeed: 132,
    attack: { damage: 9, range: 48, cooldown: 0.7, kind: 'melee' },
    traits: ['cloaked', 'fear'], cloaked: true, height: 78,
  },
  juggernaut: {
    id: 'juggernaut', name: 'Juggernaut', maxHp: 360, moveSpeed: 26,
    attack: { damage: 32, range: 78, cooldown: 1.7, kind: 'melee' },
    traits: ['armored'], height: 130,
  },
  hexer: {
    id: 'hexer', name: 'Hexer', maxHp: 52, moveSpeed: 48,
    attack: { damage: 6, range: 340, cooldown: 2.4, kind: 'bolt' },
    traits: ['silencer'], height: 80,
  },
  // --- bosses (M4+) ---
  umbra: {
    id: 'umbra', name: 'Umbra', maxHp: 900, moveSpeed: 26,
    attack: { damage: 18, range: 90, cooldown: 1.8, kind: 'melee' },
    traits: ['cloaked', 'fear'], cloaked: true, isBoss: true, height: 150,
  },
  doctorNull: {
    id: 'doctorNull', name: 'Doctor Null', maxHp: 700, moveSpeed: 24,
    attack: { damage: 14, range: 300, cooldown: 1.6, kind: 'bolt' },
    traits: ['suppresses_regen'], isBoss: true, height: 120,
  },
  theVoid: {
    id: 'theVoid', name: 'The Void', maxHp: 1600, moveSpeed: 18,
    attack: { damage: 26, range: 110, cooldown: 2.0, kind: 'melee' },
    traits: ['cloaked', 'armored', 'fear'], cloaked: true, isBoss: true, height: 200,
  },
};

