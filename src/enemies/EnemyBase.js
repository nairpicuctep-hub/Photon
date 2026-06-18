// EnemyBase.js — Shadow Network units. Per the brief's identity rule (§4.2):
// darkness uses NORMAL compositing with desaturated indigo/violet darks and a
// cold violet rim + glowing eyes — the deliberate foil to the heroes' additive
// light. Enemies aren't feel-slice-ported, so they're procedurally drawn here
// to a good bar but simpler than the heroes.

import { ctx } from '../render/gfx.js';
import { mix, rgba, glow } from '../render/primitives.js';

const SHADOW_INK = '#06060f';

export class EnemyBase {
  constructor(def = {}) {
    this.def = def;
    this.id = def.id || 'enemy';
    this.x = def.x || 0;
    this.groundY = def.groundY || 0;
    this.facing = -1;            // shadow units face left (toward the tower)
    this.t = Math.random() * 6;  // desync animations
    this.state = 'walk';
    this.hitFlash = 0;           // 0..1 white flash on taking damage
    this.revealed = 0;          // 0..1 (Floris reveal); cloaked enemies use this

    // visual profile (subclasses override)
    this.h = def.height || 64;          // body height
    this.w = def.width || 26;           // body width
    this.bodyHi = def.bodyHi || '#241b3a';
    this.bodyLo = def.bodyLo || '#0c0a18';
    this.rimCol = def.rimCol || '#7b6bd6';
    this.eyeCol = def.eyeCol || '#ff5d7a';
    this.cloaked = !!def.cloaked;       // Umbra/ambushers; needs Reveal to be solid
  }

  hit() { this.hitFlash = 1; }

  update(dt) {
    this.t += dt;
    if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt * 4);
  }

  /** Visibility multiplier — cloaked enemies are near-invisible until revealed. */
  get visible() { return this.cloaked ? 0.12 + 0.88 * this.revealed : 1; }

  draw() {
    const a = this.visible;
    ctx.save();
    ctx.translate(this.x, this.groundY);
    ctx.globalAlpha = a;

    // contact shadow
    ctx.save(); ctx.globalAlpha = 0.32 * a; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(0, 4, this.w * 0.9, 8, 0, 0, 6.2832); ctx.fill(); ctx.restore();

    this.drawBody();

    // cold violet rim (additive, thin) — the only "light" on darkness
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * (0.5 + this.revealed * 0.5);
    glow(0, -this.h * 0.55, this.w * 1.1, this.rimCol, 0.12 + this.revealed * 0.18);
    ctx.restore();

    // hit flash
    if (this.hitFlash > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glow(0, -this.h * 0.5, this.w * 1.4, '#fff', this.hitFlash * 0.5);
      ctx.restore();
    }
    ctx.restore();
  }

  /** Override: draw the body in local space (origin at feet, -y up). */
  drawBody() {
    const bob = Math.sin(this.t * 5) * 2;
    const topY = -this.h + bob, botY = 0;
    // cloaked silhouette
    ctx.beginPath();
    ctx.moveTo(-this.w, botY);
    ctx.quadraticCurveTo(-this.w * 1.1, topY + this.h * 0.3, -this.w * 0.4, topY);
    ctx.quadraticCurveTo(0, topY - 8, this.w * 0.4, topY);
    ctx.quadraticCurveTo(this.w * 1.1, topY + this.h * 0.3, this.w, botY);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, topY, 0, botY);
    g.addColorStop(0, mix(this.bodyHi, '#fff', this.hitFlash * 0.6));
    g.addColorStop(1, this.bodyLo);
    ctx.fillStyle = g; ctx.strokeStyle = SHADOW_INK; ctx.lineWidth = 2.4; ctx.fill(); ctx.stroke();
    this.drawEyes(topY + this.h * 0.22);
  }

  drawEyes(eyeY) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(-6 * -this.facing, eyeY, 7, this.eyeCol, 0.9);
    glow(4 * -this.facing, eyeY, 5, this.eyeCol, 0.7);
    ctx.restore();
    ctx.fillStyle = this.eyeCol;
    ctx.beginPath(); ctx.ellipse(-6 * -this.facing, eyeY, 2.4, 3.0, 0, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4 * -this.facing, eyeY, 1.8, 2.4, 0, 0, 6.28); ctx.fill();
  }
}
