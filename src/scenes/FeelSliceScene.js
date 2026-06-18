// FeelSliceScene.js — dev scene that renders a single hero in isolation so it
// can be compared side-by-side with its source feel slice (the M1 acceptance
// gate). This is the in-engine reproduction of radu-photon-feelslice.html:
// the painted dawn battlefield, Radu, the blast-target pylon, the world beam,
// particles, screen-shake and vignette — all on the ported toolkit.

import { ctx } from '../render/gfx.js';
import { mix, rgba, glow } from '../render/primitives.js';
import { initScene, drawScene, setDawn, drawVignette } from '../render/scene.js';
import * as particles from '../render/particles.js';
import { reduce } from '../core/env.js';
import { Radu } from '../heroes/radu.js';

// Feel-slice logical space (matches radu-photon-feelslice.html exactly).
const W = 960, H = 600, GROUND = 506, RADU_X = 372, PYLON_X = 752;

export class FeelSliceScene {
  constructor(viewport) {
    this.viewport = viewport;
    this.W = W; this.H = H;

    initScene({ W, H, GROUND, reduce });
    setDawn(0.42);

    this.radu = new Radu({ x: RADU_X, groundY: GROUND });

    // blast-target pylon state + screen shake
    this.pylonHit = 0;
    this.pylonShake = 0;
    this.shake = 0;
  }

  /** Route a control action (button / hotkey). Returns aura state for 'aura'. */
  act(action) {
    switch (action) {
      case 'idle': this.radu.setState('idle'); break;
      case 'walk': this.radu.setState('walk'); break;
      case 'dash': this.radu.lightstep(); break;
      case 'blast': this.radu.energyBlast(); break;
      case 'aura': return this.radu.toggleAura();
    }
    return undefined;
  }

  setDawn(v) { setDawn(v); }

  update(dt) {
    this.radu.update(dt);

    // beam impact on the pylon (mirrors the slice's blast branch)
    if (this.radu.blastBeam > 0.4 && this.pylonHit < 0.1) {
      this.pylonHit = 1; this.pylonShake = 10; this.shake = 8;
      particles.emitPhotons(reduce ? 6 : 20, PYLON_X - 18, GROUND - 60, 200, 30);
    }

    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 30);
    if (this.pylonHit > 0) this.pylonHit = Math.max(0, this.pylonHit - dt * 2.2);
    if (this.pylonShake > 0) this.pylonShake = Math.max(0, this.pylonShake - dt * 30);

    particles.update(dt);
  }

  render(dt) {
    const sh = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    this.viewport.begin(sh, sh * 0.5);

    drawScene(dt);
    particles.drawAfterimages();
    this.drawPylon();
    this.radu.draw();
    this.drawWorldBeam();
    particles.drawParts();
    drawVignette();

    this.viewport.end();
  }

  drawPylon() {
    const x = PYLON_X, baseY = GROUND;
    const sh = this.pylonShake > 0 ? (Math.random() - 0.5) * this.pylonShake : 0;
    ctx.save(); ctx.translate(x + sh, 0);
    ctx.globalAlpha = 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, baseY + 5, 30, 9, 0, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(0, baseY - 60, 70, '#7fe6ff', 0.18 + this.pylonHit * 0.5); ctx.restore();
    // crystal
    ctx.beginPath(); ctx.moveTo(-16, baseY - 6); ctx.lineTo(-10, baseY - 104); ctx.lineTo(0, baseY - 126); ctx.lineTo(10, baseY - 104); ctx.lineTo(16, baseY - 6); ctx.closePath();
    const g = ctx.createLinearGradient(0, baseY - 126, 0, baseY - 6); g.addColorStop(0, mix('#bfefff', '#fff', this.pylonHit)); g.addColorStop(1, '#2f6f96');
    ctx.fillStyle = g; ctx.strokeStyle = 'rgba(10,30,46,0.7)'; ctx.lineWidth = 2.5; ctx.fill(); ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba('#eafcff', 0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, baseY - 100); ctx.lineTo(-3, baseY - 20); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#9aa4c0'; ctx.fillRect(-20, baseY - 6, 40, 8);
    ctx.restore();
  }

  drawWorldBeam() {
    const a = this.radu.blastBeam;
    if (a <= 0) return;
    const o = this.radu.beamOrigin();
    const sx = o.x, sy = o.y, ex = PYLON_X - 18;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(sx, 0, ex, 0);
    g.addColorStop(0, rgba('#fff7d6', 0.0)); g.addColorStop(0.1, rgba('#ffd24a', 0.7 * a)); g.addColorStop(1, rgba('#fffef8', 0.95 * a));
    ctx.strokeStyle = g; ctx.lineCap = 'round'; ctx.lineWidth = 10 * a + 4; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, sy); ctx.stroke();
    ctx.strokeStyle = rgba('#ffffff', 0.9 * a); ctx.lineWidth = 3 * a + 1.5; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, sy); ctx.stroke();
    glow(sx, sy, 18 * a, '#fff7d6', 0.8 * a);
    glow(ex, sy, 30 * a, '#fff7d6', 0.9 * a);
    ctx.restore();
  }
}
