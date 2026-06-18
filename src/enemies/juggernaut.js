// juggernaut.js — a hulking armored siege-shadow. Very high HP and armored, so
// raw fire barely dents it — it wants Manu's anti-armor Titan Smash. The wall
// of the Shadow Network. Massive layered plates.
import { ctx } from '../render/gfx.js';
import { mix, rgba } from '../render/primitives.js';
import { EnemyBase } from './EnemyBase.js';

export class Juggernaut extends EnemyBase {
  constructor(def = {}) {
    super({ height: 130, width: 64, bodyHi: '#2f2348', bodyLo: '#0a0816', rimCol: '#ff9a5a', eyeCol: '#ff8a4a', ...def });
  }
  drawBody() {
    const lumber = Math.sin(this.t * 2.6) * 2;
    const topY = -this.h, botY = 0;
    ctx.beginPath();
    ctx.moveTo(-this.w, botY);
    ctx.lineTo(-this.w * 0.95, topY + this.h * 0.4);
    ctx.quadraticCurveTo(-this.w * 0.6, topY, 0, topY - 2);
    ctx.quadraticCurveTo(this.w * 0.6, topY, this.w * 0.95, topY + this.h * 0.4);
    ctx.lineTo(this.w, botY);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, topY, 0, botY);
    g.addColorStop(0, mix(this.bodyHi, '#fff', this.hitFlash * 0.6)); g.addColorStop(1, this.bodyLo);
    ctx.fillStyle = g; ctx.strokeStyle = '#05040c'; ctx.lineWidth = 3.4; ctx.fill(); ctx.stroke();
    // stacked armor plates + huge pauldrons
    ctx.fillStyle = mix('#46365f', '#fff', this.hitFlash * 0.5); ctx.strokeStyle = '#05040c'; ctx.lineWidth = 2.6;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * this.w * 0.5, topY + this.h * 0.16 + lumber);
      ctx.lineTo(s * this.w * 1.3, topY + this.h * 0.02 + lumber);
      ctx.lineTo(s * this.w * 1.25, topY + this.h * 0.36 + lumber);
      ctx.lineTo(s * this.w * 0.55, topY + this.h * 0.3 + lumber);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // chest plate band
    ctx.strokeStyle = rgba('#6a4aa0', 0.7); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-this.w * 0.7, topY + this.h * 0.55); ctx.lineTo(this.w * 0.7, topY + this.h * 0.55); ctx.stroke();
    this.drawEyes(topY + this.h * 0.2);
  }
}
