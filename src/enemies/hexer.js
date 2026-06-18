// hexer.js — a ranged caster that hurls a curse: its bolt SILENCES a hero's
// signature ability for a few seconds. The answer is friendship — Pissy's Good
// Spirits cleanses nearby allies. A hooded figure with a spinning hex sigil.
import { ctx } from '../render/gfx.js';
import { mix, rgba, glow } from '../render/primitives.js';
import { EnemyBase } from './EnemyBase.js';

export class Hexer extends EnemyBase {
  constructor(def = {}) {
    super({ height: 80, width: 24, bodyHi: '#2a1838', bodyLo: '#0c0716', rimCol: '#ff6bd0', eyeCol: '#ff8ae0', ...def });
  }
  drawBody() {
    const sway = Math.sin(this.t * 1.8) * 4;
    const topY = -this.h, botY = 0;
    // robed body
    ctx.beginPath();
    ctx.moveTo(-this.w, botY);
    ctx.quadraticCurveTo(-this.w * 1.1 + sway, topY + this.h * 0.4, -this.w * 0.35 + sway, topY);
    ctx.quadraticCurveTo(sway, topY - 12, this.w * 0.35 + sway, topY);
    ctx.quadraticCurveTo(this.w * 1.1 + sway, topY + this.h * 0.4, this.w, botY);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, topY, 0, botY);
    g.addColorStop(0, mix(this.bodyHi, '#fff', this.hitFlash * 0.6)); g.addColorStop(1, this.bodyLo);
    ctx.fillStyle = g; ctx.strokeStyle = '#05040c'; ctx.lineWidth = 2.4; ctx.fill(); ctx.stroke();
    // floating hex sigil (the curse)
    const hx = sway, hy = topY + this.h * 0.3, pulse = 0.5 + Math.sin(this.t * 4) * 0.5;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(hx, hy - 28, 18, '#ff6bd0', 0.35 + pulse * 0.3); ctx.restore();
    ctx.strokeStyle = rgba('#ff8ae0', 0.7 + pulse * 0.3); ctx.lineWidth = 2;
    ctx.save(); ctx.translate(hx, hy - 28); ctx.rotate(this.t);
    ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; const x = Math.cos(a) * 10, y = Math.sin(a) * 10; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.stroke();
    ctx.restore();
    this.drawEyes(hy + sway);
  }
}
