// nullDrone.js — a floating drone that SUPPRESSES the light economy (halves
// regen) while alive. Priority kill. A dark orb with a rotating suppression
// ring and a cold inner eye; hovers above the ground.
import { ctx } from '../render/gfx.js';
import { rgba, glow } from '../render/primitives.js';
import { EnemyBase } from './EnemyBase.js';

export class NullDrone extends EnemyBase {
  constructor(def = {}) {
    super({ height: 30, width: 24, bodyHi: '#2a1f44', bodyLo: '#0a0818', rimCol: '#7f6bff', eyeCol: '#8f7bff', ...def });
    this.suppresses = true;
    this.hover = 70; // floats this high above the ground
  }
  drawBody() {
    const bob = Math.sin(this.t * 2.4) * 4;
    const cy = -this.hover - bob, r = this.w;
    // suppression ring
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5;
    ctx.strokeStyle = rgba('#7f6bff', 0.6); ctx.lineWidth = 2;
    ctx.save(); ctx.translate(0, cy); ctx.rotate(this.t * 1.5); ctx.scale(1, 0.4);
    ctx.beginPath(); ctx.arc(0, 0, r * 1.7, 0, 6.28); ctx.stroke(); ctx.restore();
    ctx.restore();
    // orb
    const g = ctx.createRadialGradient(0, cy - 4, 2, 0, cy, r);
    g.addColorStop(0, '#3a2c5e'); g.addColorStop(1, this.bodyLo);
    ctx.fillStyle = g; ctx.strokeStyle = '#06060f'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(0, cy, r, 0, 6.28); ctx.fill(); ctx.stroke();
    // cold inner eye
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(0, cy, 12, this.eyeCol, 0.8 + this.hitFlash * 0.4);
    ctx.restore();
    ctx.fillStyle = this.eyeCol; ctx.beginPath(); ctx.arc(0, cy, 3.2, 0, 6.28); ctx.fill();
  }
}
