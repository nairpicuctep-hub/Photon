// mirror.js — a crystalline shadow that REFLECTS ranged light: bolts/beams/arcs
// barely scratch it (a cyan reflect-spark bounces off) UNTIL Victor deploys a
// Prism, which refracts around the reflection and lets attacks land. Manu's
// melee also bypasses it. The "Victor counters Mirror" friendship beat.
import { ctx } from '../render/gfx.js';
import { mix, rgba, glow } from '../render/primitives.js';
import { EnemyBase } from './EnemyBase.js';

export class Mirror extends EnemyBase {
  constructor(def = {}) {
    super({ height: 92, width: 34, bodyHi: '#2a2450', bodyLo: '#0a0820', rimCol: '#9fd6ff', eyeCol: '#bfe6ff', ...def });
    this.reflectActive = true;  // set by Battle each frame (true while no prism is up)
    this.reflectFlash = 0;      // cyan spark when it reflects a hit
  }
  update(dt) { super.update(dt); if (this.reflectFlash > 0) this.reflectFlash = Math.max(0, this.reflectFlash - dt * 3); }
  drawBody() {
    const sway = Math.sin(this.t * 1.6) * 3;
    const topY = -this.h, botY = 0, w = this.w;
    // faceted mirror-shard body
    ctx.beginPath();
    ctx.moveTo(0 + sway, topY);
    ctx.lineTo(w + sway, topY + this.h * 0.32);
    ctx.lineTo(w * 0.6, botY);
    ctx.lineTo(-w * 0.6, botY);
    ctx.lineTo(-w + sway, topY + this.h * 0.32);
    ctx.closePath();
    const g = ctx.createLinearGradient(-w, topY, w, botY);
    g.addColorStop(0, mix(this.bodyHi, '#fff', this.hitFlash * 0.5 + 0.1));
    g.addColorStop(0.5, '#3a4f8a');
    g.addColorStop(1, this.bodyLo);
    ctx.fillStyle = g; ctx.strokeStyle = '#06060f'; ctx.lineWidth = 2.6; ctx.fill(); ctx.stroke();
    // reflective sheen facets
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba('#dffaff', this.reflectActive ? 0.5 : 0.2); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sway - 4, topY + 10); ctx.lineTo(-w * 0.4, botY - 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sway + 8, topY + 8); ctx.lineTo(w * 0.45, botY - 12); ctx.stroke();
    ctx.restore();
    // active reflection shield shimmer
    if (this.reflectActive) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glow(sway, topY + this.h * 0.45, w * 1.5, '#7fd0ff', 0.08 + Math.sin(this.t * 3) * 0.04);
      ctx.restore();
    }
    // reflect spark when it bounces a hit
    if (this.reflectFlash > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glow(-w, topY + this.h * 0.4, 26, '#dffaff', this.reflectFlash * 0.8);
      ctx.restore();
    }
    this.drawEyes(topY + this.h * 0.28 + sway);
  }
}
