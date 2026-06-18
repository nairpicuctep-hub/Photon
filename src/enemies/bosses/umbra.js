// umbra.js — Umbra, the living darkness (brief §8). A CLOAKED boss: it is
// near-immune to damage while shrouded and must be made targetable with Floris's
// Reveal (which also fires the Exposed combo). Drifting shadow tendrils, a fear
// pulse, and eyes that blaze once revealed. The "power alone fails" boss.

import { ctx } from '../../render/gfx.js';
import { mix, rgba, glow } from '../../render/primitives.js';
import { EnemyBase } from '../EnemyBase.js';

export class Umbra extends EnemyBase {
  constructor(def = {}) {
    super({ height: 150, width: 70, bodyHi: '#241634', bodyLo: '#070510', rimCol: '#8a5cff', eyeCol: '#c46bff', cloaked: true, ...def });
    this.tendrils = Array.from({ length: 7 }, (_, i) => ({ ph: i * 0.9, len: 70 + Math.random() * 40 }));
    this.fear = 0; // pulse 0..1
  }

  update(dt) {
    super.update(dt);
    this.fear = (Math.sin(this.t * 0.7) * 0.5 + 0.5); // slow menacing pulse
    // fades back toward cloaked if not actively revealed (Reveal field tops it up)
    if (this.revealed > 0) this.revealed = Math.max(0, this.revealed - dt * 0.25);
  }

  drawBody() {
    const rev = this.revealed;
    const sway = Math.sin(this.t * 1.1) * 6;
    const topY = -this.h, botY = 0;
    // drifting shadow tendrils (behind)
    ctx.save(); ctx.strokeStyle = rgba('#1a0f2e', 0.8); ctx.lineWidth = 6; ctx.lineCap = 'round';
    for (const tn of this.tendrils) {
      tn.ph += 0.02;
      const bx = (tn.ph % 2 - 1) * this.w * 0.8;
      ctx.beginPath(); ctx.moveTo(0, topY * 0.5);
      ctx.quadraticCurveTo(bx, topY * 0.5 - tn.len * 0.4, bx * 1.4 + Math.sin(tn.ph) * 14, topY * 0.5 - tn.len + Math.sin(tn.ph * 1.3) * 12);
      ctx.stroke();
    }
    ctx.restore();
    // hooded mass
    ctx.beginPath();
    ctx.moveTo(-this.w, botY);
    ctx.quadraticCurveTo(-this.w * 1.2 + sway, topY + this.h * 0.4, -this.w * 0.4 + sway, topY);
    ctx.quadraticCurveTo(0 + sway, topY - 18, this.w * 0.4 + sway, topY);
    ctx.quadraticCurveTo(this.w * 1.2 + sway, topY + this.h * 0.4, this.w, botY);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, topY, 0, botY);
    g.addColorStop(0, mix(this.bodyHi, '#fff', this.hitFlash * 0.6 + rev * 0.15));
    g.addColorStop(1, this.bodyLo);
    ctx.fillStyle = g; ctx.strokeStyle = rgba('#3a1d6e', 0.5 + rev * 0.5); ctx.lineWidth = 3; ctx.fill(); ctx.stroke();
    // glyph-marks appear when revealed (Floris)
    if (rev > 0.2) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba('#9bf0cf', rev * 0.7); ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) { const yy = topY + this.h * (0.2 + i * 0.18); ctx.beginPath(); ctx.arc(sway, yy, 10 + i * 3, 0.6, 2.5); ctx.stroke(); }
      ctx.restore();
    }
    // blazing eyes (intensify with menace + reveal)
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const eg = 0.6 + this.fear * 0.4 + rev * 0.4;
    glow(-16 + sway, topY + this.h * 0.2, 16, this.eyeCol, eg);
    glow(14 + sway, topY + this.h * 0.2, 13, this.eyeCol, eg * 0.8);
    ctx.restore();
    ctx.fillStyle = this.eyeCol;
    ctx.beginPath(); ctx.ellipse(-16 + sway, topY + this.h * 0.2, 4, 6, 0.2, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.ellipse(14 + sway, topY + this.h * 0.2, 3.2, 5, -0.2, 0, 6.28); ctx.fill();
  }
}
