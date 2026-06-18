// economy.js — the light-energy economy (brief §7). Starting values are the
// prototype's; they live here and in data so they can be tuned.
//
//   start 60, cap 110, passive regen ~9/s (HALVED while any Null-Drone is
//   alive — drones suppress your light), +4 on each enemy kill.

export const ECONOMY_DEFAULTS = {
  start: 60,
  cap: 110,
  regenPerSec: 9,
  killBonus: 4,
};

export class LightEconomy {
  constructor(cfg = {}) {
    this.cfg = { ...ECONOMY_DEFAULTS, ...cfg };
    this.energy = this.cfg.start;
    this.suppressed = false; // true while any Null-Drone is alive
    this._regenAccrued = 0;
  }

  /** Current regen rate (halved under suppression). */
  get regenRate() { return this.cfg.regenPerSec * (this.suppressed ? 0.5 : 1); }

  update(dt) {
    this.energy = Math.min(this.cfg.cap, this.energy + this.regenRate * dt);
  }

  canAfford(cost) { return this.energy >= cost; }

  /** Spend energy if affordable. Returns true on success. */
  spend(cost) {
    if (this.energy < cost) return false;
    this.energy -= cost;
    return true;
  }

  onKill() { this.energy = Math.min(this.cfg.cap, this.energy + this.cfg.killBonus); }

  get fraction() { return this.energy / this.cfg.cap; }
}
