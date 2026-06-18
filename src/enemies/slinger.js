// slinger.js — ranged shadow that lobs dark fire. Cloaked figure with a raised
// arm cradling a violet ember.
import { ctx } from '../render/gfx.js';
import { mix, rgba, glow } from '../render/primitives.js';
import { EnemyBase } from './EnemyBase.js';

export class Slinger extends EnemyBase {
  constructor(def = {}) {
    super({ height: 64, width: 22, bodyHi: '#1d1733', bodyLo: '#0a0816', rimCol: '#b06bff', eyeCol: '#c46bff', ...def });
  }
  drawBody() {
    const sway = Math.sin(this.t * 2.2) * 3;
    const topY = -this.h, botY = 0;
    ctx.beginPath();
    ctx.moveTo(-this.w, botY);
    ctx.quadraticCurveTo(-this.w * 1.1 + sway, topY + this.h * 0.4, -this.w * 0.35 + sway, topY);
    ctx.quadraticCurveTo(0 + sway, topY - 10, this.w * 0.35 + sway, topY);
    ctx.quadraticCurveTo(this.w * 1.1 + sway, topY + this.h * 0.4, this.w, botY);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, topY, 0, botY);
    g.addColorStop(0, mix(this.bodyHi, '#fff', this.hitFlash * 0.6)); g.addColorStop(1, this.bodyLo);
    ctx.fillStyle = g; ctx.strokeStyle = '#06060f'; ctx.lineWidth = 2.4; ctx.fill(); ctx.stroke();
    // raised arm + dark-fire ember
    const ex = -this.w * 0.9 + sway, ey = topY + this.h * 0.32;
    ctx.strokeStyle = '#0a0816'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sway, topY + this.h * 0.4); ctx.quadraticCurveTo(ex * 0.7, ey - 4, ex, ey); ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(ex, ey, 12 + Math.sin(this.t * 6) * 2, '#a64bff', 0.8);
    ctx.fillStyle = rgba('#d8a6ff', 0.9); ctx.beginPath(); ctx.arc(ex, ey, 3.5, 0, 6.28); ctx.fill();
    ctx.restore();
    this.drawEyes(topY + this.h * 0.22 + sway);
  }
}
