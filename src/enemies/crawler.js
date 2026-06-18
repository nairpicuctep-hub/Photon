// crawler.js — fast, fragile melee shadow that scuttles low to the ground.
import { ctx } from '../render/gfx.js';
import { mix } from '../render/primitives.js';
import { EnemyBase } from './EnemyBase.js';

export class Crawler extends EnemyBase {
  constructor(def = {}) {
    super({ height: 40, width: 24, bodyHi: '#221733', bodyLo: '#0a0814', rimCol: '#ff6a8a', eyeCol: '#ff5d7a', ...def });
  }
  drawBody() {
    const scuttle = Math.abs(Math.sin(this.t * 11)) * 3;
    const topY = -this.h - scuttle, botY = 0;
    // low hunched body
    ctx.beginPath();
    ctx.moveTo(-this.w, botY);
    ctx.quadraticCurveTo(-this.w * 1.2, topY + 10, -2, topY);
    ctx.quadraticCurveTo(this.w * 1.3, topY + 6, this.w * 1.1, botY);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, topY, 0, botY);
    g.addColorStop(0, mix(this.bodyHi, '#fff', this.hitFlash * 0.6)); g.addColorStop(1, this.bodyLo);
    ctx.fillStyle = g; ctx.strokeStyle = '#06060f'; ctx.lineWidth = 2.2; ctx.fill(); ctx.stroke();
    // skittering legs
    ctx.strokeStyle = '#0a0814'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const px = -this.w * 0.6 + i * this.w * 0.7;
      const k = Math.sin(this.t * 11 + i) * 5;
      ctx.beginPath(); ctx.moveTo(px, botY - 8); ctx.quadraticCurveTo(px + 4 + k, botY - 2, px + 8 + k, botY); ctx.stroke();
    }
    this.drawEyes(topY + 12);
  }
}
