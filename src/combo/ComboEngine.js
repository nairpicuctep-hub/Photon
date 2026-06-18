// ComboEngine.js — watches the battle each tick, detects satisfied combo
// triggers, spawns the fused effect, fires the banner + flash + shake, and
// applies the gameplay payoff (brief §6). The marquee is Light Lance: Radu's
// beam through Victor's prism becomes a wall-breaking megabeam.

import { COMBO_DEFS } from './combos.js';
import * as particles from '../render/particles.js';
import { reduce } from '../core/env.js';
import { sfx } from '../audio/audio.js';
import { get as getSave } from '../save/save.js';

export class ComboEngine {
  constructor(battle, banner) { this.b = battle; this.banner = banner; this.cd = {}; }

  _ready(id, secs) { if ((this.cd[id] || 0) > 0) return false; this.cd[id] = secs; return true; }
  _dmg(base) { return base * (this.b._comboDmgMul || 1); } // friendship "Shared Light" upgrade

  fire(id) {
    const d = COMBO_DEFS[id]; if (!d) return;
    if (typeof console !== 'undefined' && console.info) console.info('[combo]', id);
    try { const st = getSave().stats; st.combosTriggered[id] = (st.combosTriggered[id] || 0) + 1; } catch (e) { /* ignore */ }
    sfx('combo');
    this.banner.show(d);
    this.b.flash = Math.min(1, this.b.flash + 0.5);
    this.b.shake = Math.max(this.b.shake, 11);
  }

  /** Light Lance: called when Radu fires a beam. Returns true if it became a combo. */
  tryLightLance(owner, dir) {
    const b = this.b;
    const range = owner.def.attack.range;
    const prism = b.prisms.find((p) => Math.sign(p.x - owner.x) === Math.sign(dir) && Math.abs(p.x - owner.x) <= range && p.asm > 0.4);
    if (!prism) return false;
    if (!this._ready('light_lance', 1.4)) return false; // on cooldown -> Radu fires a normal beam instead
    const reach = Math.max(range, 560);
    const endX = prism.x + dir * reach;
    b.lances.push({ x1: owner.x, y1: owner.attackY, px: prism.x, py: prism.y, x2: endX, y2: prism.y, life: 0, max: 0.6 });
    // megabeam damage + wall break in its span (beyond the prism)
    for (const e of b.enemies) if (!e.dead && Math.sign(e.x - prism.x) === Math.sign(dir) && Math.abs(e.x - prism.x) <= reach) b.applyDamage(e, this._dmg(owner.def.attack.damage * 3.5), { antiArmor: true });
    // the lance refracts through and shatters any combo-gated wall ahead of Radu
    for (const w of b.walls) if (w.hp > 0 && Math.sign(w.x - owner.x) === Math.sign(dir) && Math.abs(w.x - owner.x) <= reach + 80) b.breakWall(w);
    particles.emitPhotons(reduce ? 12 : 28, prism.x, prism.y, 240, 30);
    this.fire('light_lance');
    return true;
  }

  /** Called by Battle when an Andreea slow-field expires with foes inside. */
  frozenVolley(zone) {
    const b = this.b;
    let hit = 0;
    for (const e of b.enemies) if (!e.dead && Math.abs(e.x - zone.x) <= zone.r) { b.applyDamage(e, this._dmg(30), {}); hit++; }
    if (hit > 0 && this._ready('frozen_volley', 6)) this.fire('frozen_volley');
  }

  update(dt) {
    for (const k in this.cd) if (this.cd[k] > 0) this.cd[k] -= dt;
    const b = this.b, allies = b.allies;
    const find = (id) => allies.find((c) => c.def.id === id && !c.dead);
    const radu = find('radu'), manu = find('manu'), pissy = find('pissy');

    // Bastion Dawn — Radu's aura beside Manu (his shield amplifies the light).
    if (radu && manu && radu.r.auraOn && Math.abs(radu.x - manu.x) < 280) {
      if (this._ready('bastion_dawn', 10)) { this.fire('bastion_dawn'); radu.comboHaste = { until: b.time + 5, mul: 2 }; radu.hp = Math.min(radu.maxHp, radu.hp + 30); }
    }
    // Morale Surge — Pissy's Good Spirits over Radu's aura: team-wide buff.
    if (radu && pissy && radu.r.auraOn && pissy.r.moraleOn && Math.abs(radu.x - pissy.x) < 300) {
      if (this._ready('morale_surge', 10)) { this.fire('morale_surge'); for (const a of allies) a.comboHaste = { until: b.time + 5, mul: 1.7 }; }
    }
    // Exposed — Floris reveal makes cloaked foes targetable; mark the moment.
    const reveal = b.fields.find((f) => f.kind === 'reveal');
    if (reveal && b.enemies.some((e) => e.def.cloaked && (e.r.revealed || 0) > 0.5)) {
      if (this._ready('exposed', 7)) this.fire('exposed');
    }

    const victor = find('victor'), floris = find('floris'), andreea = find('andreea');
    // Prismatic Aegis — Victor's prism under Manu's dome: a reflective ward.
    if (victor && manu && b.prisms.length && b.fields.some((f) => f.kind === 'dome') && Math.abs(victor.x - manu.x) < 260) {
      if (this._ready('prismatic_aegis', 12)) { this.fire('prismatic_aegis'); for (const a of allies) a.hp = Math.min(a.maxHp, a.hp + 15); }
    }
    // Insight Barrage — Andreea's foresight guides Floris's artillery onto the foe.
    if (andreea && floris && Math.abs(andreea.x - floris.x) < 300) {
      if (this._ready('insight_barrage', 11)) { this.fire('insight_barrage'); for (const e of b.enemies) if (!e.dead) b.applyDamage(e, this._dmg(16), { antiArmor: true }); }
    }
    // Photon Overdrive — Radu's Infinite Potential, only with a real team (>=3 allies).
    if (radu && radu.r.auraOn && allies.length >= 3) {
      if (this._ready('photon_overdrive', 16)) { this.fire('photon_overdrive'); b.flash = 1; for (const e of b.enemies) if (!e.dead) b.applyDamage(e, this._dmg(40), { antiArmor: true }); }
    }
  }
}
