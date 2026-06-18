// brute.js — armored heavy shadow. Slow, tanky; wants an anti-armor answer
// (Manu / Titan Smash). Bulky silhouette with jagged pauldrons.
import { ctx } from '../render/gfx.js';
import { mix } from '../render/primitives.js';
import { EnemyBase } from './EnemyBase.js';

export class Brute extends EnemyBase {
  constructor(def = {}) {
    super({ height: 92, width: 46, bodyHi: '#2a2040', bodyLo: '#0c0a1a', rimCol: '#ff8a5a', eyeCol: '#ff7a4a', ...def });
  }
  drawBody() {
    const lumber = Math.sin(this.t * 3.4) * 2;
    const topY = -this.h, botY = 0;
    // bulky body
    ctx.beginPath();
    ctx.moveTo(-this.w, botY);
    ctx.lineTo(-this.w * 0.9, topY + this.h * 0.35);
    ctx.quadraticCurveTo(-this.w * 0.7, topY, 0, topY - 2);
    ctx.quadraticCurveTo(this.w * 0.7, topY, this.w * 0.9, topY + this.h * 0.35);
    ctx.lineTo(this.w, botY);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, topY, 0, botY);
    g.addColorStop(0, mix(this.bodyHi, '#fff', this.hitFlash * 0.6)); g.addColorStop(1, this.bodyLo);
    ctx.fillStyle = g; ctx.strokeStyle = '#06060f'; ctx.lineWidth = 3.2; ctx.fill(); ctx.stroke();
    // jagged pauldrons (armor)
    ctx.fillStyle = mix('#3a2c52', '#fff', this.hitFlash * 0.5); ctx.strokeStyle = '#06060f'; ctx.lineWidth = 2.4;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * this.w * 0.6, topY + this.h * 0.18 + lumber);
      ctx.lineTo(s * this.w * 1.15, topY + this.h * 0.05 + lumber);
      ctx.lineTo(s * this.w * 1.05, topY + this.h * 0.32 + lumber);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    this.drawEyes(topY + this.h * 0.2);
  }
}
