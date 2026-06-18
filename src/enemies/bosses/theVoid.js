// theVoid.js — The Void (brief §8), the finale. A multi-mechanic colossus:
// cloaked (needs Reveal), armored (wants anti-armor), and it radiates fear. A
// vast dark maw ringed with collapsing light.

import { ctx } from '../../render/gfx.js';
import { mix, rgba, glow } from '../../render/primitives.js';
import { EnemyBase } from '../EnemyBase.js';

export class TheVoid extends EnemyBase {
  constructor(def = {}) {
    super({ height: 200, width: 110, bodyHi: '#1a1230', bodyLo: '#040308', rimCol: '#9a6bff', eyeCol: '#c46bff', cloaked: true, ...def });
  }
  update(dt) { super.update(dt); if (this.revealed > 0) this.revealed = Math.max(0, this.revealed - dt * 0.2); }
  drawBody() {
    const rev = this.revealed, cy = -this.h * 0.55, r = this.w;
    // collapsing light ring (accretion)
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { ctx.strokeStyle = rgba('#7a3aff', (0.2 + rev * 0.3) * (1 - i * 0.25)); ctx.lineWidth = 3; ctx.save(); ctx.translate(0, cy); ctx.rotate(this.t * (0.3 + i * 0.2)); ctx.scale(1, 0.5); ctx.beginPath(); ctx.arc(0, 0, r * (1.1 + i * 0.18), 0, 6.28); ctx.stroke(); ctx.restore(); }
    ctx.restore();
    // the mass
    const g = ctx.createRadialGradient(0, cy, 6, 0, cy, r * 1.2);
    g.addColorStop(0, '#04030a'); g.addColorStop(0.7, mix('#160e2c', '#fff', this.hitFlash * 0.5 + rev * 0.1)); g.addColorStop(1, '#070510');
    ctx.fillStyle = g; ctx.strokeStyle = rgba('#3a1d6e', 0.5 + rev * 0.5); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(0, cy, r, this.h * 0.5, 0, 0, 6.28); ctx.fill(); ctx.stroke();
    // central maw
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(0, cy, r * 0.5, '#5a1fd6', 0.4 + Math.sin(this.t * 1.5) * 0.1); ctx.restore();
    ctx.fillStyle = '#020107'; ctx.beginPath(); ctx.ellipse(0, cy, r * 0.42, this.h * 0.26, 0, 0, 6.28); ctx.fill();
    // glyph-marks when revealed
    if (rev > 0.2) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba('#9bf0cf', rev * 0.7); ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 + this.t * 0.3; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.6, cy + Math.sin(a) * this.h * 0.3, 7, 0, 6.28); ctx.stroke(); } ctx.restore(); }
    // twin core-eyes
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(-20, cy, 18, this.eyeCol, 0.7 + rev * 0.3); glow(20, cy, 18, this.eyeCol, 0.7 + rev * 0.3); ctx.restore();
    ctx.fillStyle = this.eyeCol; ctx.beginPath(); ctx.ellipse(-20, cy, 5, 8, 0, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.ellipse(20, cy, 5, 8, 0, 0, 6.28); ctx.fill();
  }
}
