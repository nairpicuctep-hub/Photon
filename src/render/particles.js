// particles.js — the additive photon particle system + dash after-images.
// PORTED verbatim from the feel slices. Light particles use additive glow; the
// system also holds the streaking after-images Radu's Lightstep leaves behind.
//
// Singleton module (matches the slices' single global `parts[]`). When multiple
// emitters are needed later, this can be instanced; the API stays the same.

import { ctx } from './gfx.js';
import { rgba, glow } from './primitives.js';

/** @typedef {{x:number,y:number,vx:number,vy:number,life:number,max:number,r:number,c:string}} Photon */
let parts = [];
/** @typedef {{x:number,y:number,life:number,max:number}} Afterimage */
let afterimages = [];

/** Clear all particles (e.g. on scene switch). */
export function reset() { parts.length = 0; afterimages.length = 0; }

/** Emit n photons from (x,y) with a radial spread, biased upward by `up`. */
export function emitPhotons(n, x, y, spread, up) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.28; const sp = spread * (0.3 + Math.random());
    parts.push({
      x: x + (Math.random() - 0.5) * 16, y: y + (Math.random() - 0.5) * 16,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (up || 0),
      life: 0, max: 0.6 + Math.random() * 0.8,
      r: 1.5 + Math.random() * 2.4,
      c: Math.random() < 0.5 ? '#ffd24a' : '#fff3c4',
    });
  }
}

/** Push a Lightstep after-image streak. */
export function pushAfterimage(x, y, max) { afterimages.push({ x, y, life: 0, max: max || 0.3 }); }

export function update(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.life += dt;
    if (p.life >= p.max) { parts.splice(i, 1); continue; }
    p.vy += 8 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.98;
  }
  if (afterimages.length) for (let i = afterimages.length - 1; i >= 0; i--) {
    const a = afterimages[i]; a.life += dt; if (a.life >= a.max) afterimages.splice(i, 1);
  }
}

export function drawParts() {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const p of parts) {
    const a = 1 - p.life / p.max;
    glow(p.x, p.y, p.r * 3, '#ffd24a', a * 0.4);
    ctx.fillStyle = rgba(p.c, a);
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * a + 0.4, 0, 6.28); ctx.fill();
  }
  ctx.restore();
}

export function drawAfterimages() {
  if (!afterimages.length) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const a of afterimages) {
    const k = 1 - a.life / a.max; ctx.globalAlpha = k * 0.4;
    const g = ctx.createLinearGradient(a.x - 30, 0, a.x + 10, 0);
    g.addColorStop(0, rgba('#ffd24a', 0)); g.addColorStop(1, rgba('#fff3c4', 0.8));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(a.x, a.y, 26, 70, 0, 0, 6.28); ctx.fill();
  }
  ctx.restore();
}
