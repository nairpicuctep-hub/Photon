// figure.js — the hand-inked figure toolkit. PORTED from the feel slices
// (function bodies are identical across all of them). Every hero is built from
// these strokes: an ink under-stroke + gradient over-stroke for limbs, a cool
// additive rim-light pass, and small hand/boot caps.
//
// Each hero defines its OWN ink + rim colors, so a hero calls setFigureStyle()
// at the top of its draw() and the toolkit reads the active ink/rim from there
// (same pattern as the shared ctx). The ported drawing code is otherwise
// unchanged from source.

import { ctx } from './gfx.js';
import { mix, rgba, glow } from './primitives.js';
import { DEFAULT_INK, DEFAULT_RIM } from './palette.js';

let curInk = DEFAULT_INK;
let curRim = DEFAULT_RIM;

/** Set the active ink (outline) + rim-light colors for subsequent figure draws. */
export function setFigureStyle(ink, rim) {
  curInk = ink || DEFAULT_INK;
  curRim = rim || DEFAULT_RIM;
}

/** Tapered quadratic limb: ink under-stroke, then gradient over-stroke. */
export function limb(a, b, c, w, grad) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = curInk; ctx.lineWidth = w + 3.2;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(b.x, b.y, c.x, c.y); ctx.stroke();
  ctx.strokeStyle = grad; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(b.x, b.y, c.x, c.y); ctx.stroke();
}

/** Linear gradient along a limb, hi at the proximal end, lo at the distal. */
export function limbGrad(a, c, hi, lo) {
  const g = ctx.createLinearGradient(a.x - 6, a.y, c.x + 6, c.y);
  g.addColorStop(0, hi); g.addColorStop(1, lo);
  return g;
}

/** Cool additive rim-light tracing a limb's silhouette. (w kept for parity.) */
export function rimStroke(a, b, c, w) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = rgba(curRim, 0.5); ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(b.x, b.y, c.x, c.y); ctx.stroke();
  ctx.restore();
}

/** Glowing hand cap. skinHi/skinLo are the hero's skin tokens. */
export function hand(p, bright, skinHi, skinLo) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  glow(p.x, p.y, 11 * bright, '#fff3c4', 0.6 * bright);
  ctx.restore();
  ctx.fillStyle = mix(skinHi, skinLo, 0.3); ctx.strokeStyle = curInk; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(p.x, p.y, 5.2, 0, 6.28); ctx.fill(); ctx.stroke();
}

/** Boot/foot cap. `back` darkens it for depth. suit* are the hero's suit tokens. */
export function boot(p, back, suitHi, suitLo, suitSh) {
  ctx.fillStyle = back ? mix(suitLo, suitSh, 0.4) : mix(suitLo, suitHi, 0.15);
  ctx.strokeStyle = curInk; ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(p.x - 7, p.y - 6);
  ctx.lineTo(p.x + 10, p.y - 4);
  ctx.quadraticCurveTo(p.x + 14, p.y + 2, p.x + 8, p.y + 3);
  ctx.lineTo(p.x - 7, p.y + 2);
  ctx.closePath(); ctx.fill(); ctx.stroke();
}
