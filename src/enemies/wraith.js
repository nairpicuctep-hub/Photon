// wraith.js — a fast, cloaked flanker. Near-untouchable until revealed (Floris),
// so it punishes teams without intel. Slim shadow with trailing wisps.
import { ctx } from '../render/gfx.js';
import { mix, rgba, glow } from '../render/primitives.js';
import { EnemyBase } from './EnemyBase.js';

export class Wraith extends EnemyBase {
  constructor(def = {}) {
    super({ height: 78, width: 18, bodyHi: '#241a3e', bodyLo: '#0a0716', rimCol: '#b48bff', eyeCol: '#d8a6ff', cloaked: true, ...def });
  }
  drawBody() {
    const sway = Math.sin(this.t * 4) * 5;
    const topY = -this.h, botY = 0;
    // trailing wisps
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba('#7a4fd0', 0.3 + this.revealed * 0.3); ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(this.w * 0.6, topY * 0.4); ctx.quadraticCurveTo(this.w * (1.5 + i * 0.5), topY * 0.3, this.w * (2 + i), topY * 0.5 + Math.sin(this.t * 3 + i) * 8); ctx.stroke(); }
    ctx.restore();
    // slim tapered body
    ctx.beginPath();
    ctx.moveTo(-this.w + sway * 0.5, botY);
    ctx.quadraticCurveTo(-this.w * 1.4 + sway, topY + this.h * 0.4, sway, topY);
    ctx.quadraticCurveTo(this.w * 1.4 + sway, topY + this.h * 0.4, this.w + sway * 0.5, botY);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, topY, 0, botY);
    g.addColorStop(0, mix(this.bodyHi, '#fff', this.hitFlash * 0.6)); g.addColorStop(1, this.bodyLo);
    ctx.fillStyle = g; ctx.strokeStyle = '#05040c'; ctx.lineWidth = 2; ctx.fill(); ctx.stroke();
    this.drawEyes(topY + this.h * 0.24 + sway);
  }
}
