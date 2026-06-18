// HeroBase.js — shared hero entity. Holds the small state machine every hero
// runs (idle / walk + one state per ability), a world transform, and battle
// vitals (hp / cooldowns) used once heroes are deployed in BattleScene.
//
// Concrete heroes (radu.js, victor.js, ...) subclass this and port their
// pose()/draw*()/ability logic from the matching feel slice.

export class HeroBase {
  constructor(def = {}) {
    this.def = def;
    this.id = def.id || 'hero';
    this.name = def.name || '';

    // world transform (origin at the feet)
    this.x = def.x || 0;
    this.groundY = def.groundY || 0;
    this.facing = 1;

    // state machine
    this.state = 'idle';
    this.stateT = 0;               // seconds spent in the current state
    this.prevContinuous = 'idle';  // idle|walk to return to after a one-shot ability
    this.t = 0;                    // lifetime clock (drives breathing, hover, FX phase)

    // battle vitals (unused in the feel-slice scene)
    this.maxHp = def.maxHp || 100;
    this.hp = this.maxHp;
    /** @type {Record<string, number>} remaining cooldown seconds per ability id */
    this.cooldowns = {};
  }

  /** Enter a state. idle/walk are remembered as the "continuous" state. */
  setState(s) {
    if (s === 'idle' || s === 'walk') this.prevContinuous = s;
    this.state = s;
    this.stateT = 0;
  }

  /** A one-shot ability state finished -> fall back to idle/walk. */
  endAbility() {
    this.state = this.prevContinuous;
    this.stateT = 0;
  }

  update(dt) {
    this.t += dt;
    this.stateT += dt;
    for (const k in this.cooldowns) {
      if (this.cooldowns[k] > 0) this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt);
    }
  }

  /** Override in subclasses; draws into the shared render context. */
  draw() {}
}
