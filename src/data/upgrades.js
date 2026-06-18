// upgrades.js — the friendship / ethical meta tree (brief §8). Progression
// rewards cooperation, protection and light — never raw-damage pay-to-win.
// Data-driven: add an upgrade here + an effect key handled in aggregateEffects.
// (Upgrades currently auto-unlock as campaign missions are cleared; a dedicated
//  selectable tree UI is a natural future addition.)

export const UPGRADES = [
  { id: 'radiance', name: 'Radiance', branch: 'light', desc: '+1.5 light regen per second.', effect: { regenBonus: 1.5 } },
  { id: 'kinship', name: 'Kinship', branch: 'friendship', desc: 'Start each battle with +20 light.', effect: { startBonus: 20 } },
  { id: 'aegis_training', name: 'Aegis Training', branch: 'protection', desc: 'Every hero deploys with +12% HP.', effect: { hpMul: 1.12 } },
  { id: 'shared_light', name: 'Shared Light', branch: 'friendship', desc: 'Combo effects hit 15% harder.', effect: { comboDmgMul: 1.15 } },
  { id: 'unbroken_bond', name: 'Unbroken Bond', branch: 'protection', desc: 'The Photon Tower is +25% sturdier.', effect: { towerMul: 1.25 } },
  { id: 'dawnbringer', name: 'Dawnbringer', branch: 'light', desc: '+2 light per enemy defeated.', effect: { killBonus: 2 } },
];

/** Combine the effects of the unlocked upgrade ids into one modifier set. */
export function aggregateEffects(unlockedIds = []) {
  const e = { regenBonus: 0, startBonus: 0, hpMul: 1, comboDmgMul: 1, towerMul: 1, killBonus: 0 };
  for (const u of UPGRADES) {
    if (!unlockedIds.includes(u.id)) continue;
    const f = u.effect;
    if (f.regenBonus) e.regenBonus += f.regenBonus;
    if (f.startBonus) e.startBonus += f.startBonus;
    if (f.hpMul) e.hpMul *= f.hpMul;
    if (f.comboDmgMul) e.comboDmgMul *= f.comboDmgMul;
    if (f.towerMul) e.towerMul *= f.towerMul;
    if (f.killBonus) e.killBonus += f.killBonus;
  }
  return e;
}

/** The upgrade granted after clearing the Nth mission (1-based). */
export function upgradeForClearCount(n) { return UPGRADES[n - 1] ? UPGRADES[n - 1].id : null; }
