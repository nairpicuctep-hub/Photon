// difficulty.js — Easy / Normal / Hard presets (brief: adjustable difficulty for
// accessibility; this game is for a kid). Multipliers are applied in Battle.

export const DIFFICULTIES = {
  easy: { id: 'easy', label: 'Easy', enemyHp: 0.70, enemyDmg: 0.60, spawnMul: 1.3, regenMul: 1.35, startBonus: 30, towerMul: 1.3 },
  normal: { id: 'normal', label: 'Normal', enemyHp: 1.0, enemyDmg: 1.0, spawnMul: 1.0, regenMul: 1.0, startBonus: 0, towerMul: 1.0 },
  hard: { id: 'hard', label: 'Hard', enemyHp: 1.35, enemyDmg: 1.25, spawnMul: 0.78, regenMul: 0.9, startBonus: -10, towerMul: 0.85 },
};

export function difficulty(id) { return DIFFICULTIES[id] || DIFFICULTIES.normal; }
