// doctorNull.js — Doctor Null (brief §8): steals power / null-fields. He
// suppresses the light economy (regen halved, via the 'suppresses_regen' trait)
// while alive, and projects null-rings. A gaunt figure of negation.

import { ctx } from '../../render/gfx.js';
import { mix, rgba, glow } from '../../render/primitives.js';
import { EnemyBase } from '../EnemyBase.js';

export class DoctorNull extends EnemyBase {
  constructor(def = {}) {
    super({ height: 120, width: 40, bodyHi: '#1c2238', bodyLo: '#070912', rimCol: '#6fd0ff', eyeCol: '#7fe6ff', ...def });
    this.rings = [0, 2.1, 4.2];
  }
  drawBody() {
    const sway = Math.sin(this.t * 1.3) * 3;
    const topY = -this.h, botY = 0;
    // null-rings orbiting (the field that smothers light)
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    this.rings.forEach((p, i) => {
      const r = 30 + i * 16, a = 0.25 - i * 0.05;
      ctx.strokeStyle = rgba('#7fb0ff', a); ctx.lineWidth = 2;
      ctx.save(); ctx.translate(0, topY * 0.55); ctx.rotate(this.t * (0.6 + i * 0.3) + p); ctx.scale(1, 0.34);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.28); ctx.stroke(); ctx.restore();
    });
    ctx.restore();
    // long coat figure
    ctx.beginPath();
    ctx.moveTo(-this.w, botY);
    ctx.quadraticCurveTo(-this.w * 0.9 + sway, topY + this.h * 0.45, -this.w * 0.4 + sway, topY);
    ctx.quadraticCurveTo(sway, topY - 14, this.w * 0.4 + sway, topY);
    ctx.quadraticCurveTo(this.w * 0.9 + sway, topY + this.h * 0.45, this.w, botY);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, topY, 0, botY);
    g.addColorStop(0, mix(this.bodyHi, '#fff', this.hitFlash * 0.6)); g.addColorStop(1, this.bodyLo);
    ctx.fillStyle = g; ctx.strokeStyle = '#05040c'; ctx.lineWidth = 2.6; ctx.fill(); ctx.stroke();
    // a "null" sigil on the chest (crossed circle)
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba('#7fe6ff', 0.7); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(sway, topY + this.h * 0.5, 9, 0, 6.28); ctx.moveTo(sway - 7, topY + this.h * 0.5 + 7); ctx.lineTo(sway + 7, topY + this.h * 0.5 - 7); ctx.stroke(); ctx.restore();
    this.drawEyes(topY + this.h * 0.2 + sway);
  }
}
