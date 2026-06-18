// primitives.js — shared low-level drawing + math toolkit.
// PORTED verbatim from the feel slices (identical across all of them), with two
// defensive hardenings the brief explicitly requires (Section 12): color/number
// inputs are validated so a stray NaN can never produce `rgba(NaN,...)` and
// freeze the game.

import { ctx } from './gfx.js';

// ---- easing + math ---------------------------------------------------------
export function lerp(a, b, t) { return a + (b - a) * t; }
export function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
export function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
export function easeInCubic(t) { return t * t * t; }
export function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
export function easeOutBack(t) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }

// ---- color -----------------------------------------------------------------
/** hex "#rrggbb" -> [r,g,b]; any malformed channel clamps to 0 (anti-freeze). */
export function hx(h) {
  if (typeof h !== 'string') return [0, 0, 0];
  h = h.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; // expand #fff shorthand
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return [Number.isFinite(r) ? r : 0, Number.isFinite(g) ? g : 0, Number.isFinite(b) ? b : 0];
}

/** linear blend of two hex colors -> "rgb(...)". t is clamped-safe vs NaN. */
export function mix(a, b, t) {
  const A = hx(a), B = hx(b);
  const tt = Number.isFinite(t) ? t : 0;
  return `rgb(${A[0] + (B[0] - A[0]) * tt | 0},${A[1] + (B[1] - A[1]) * tt | 0},${A[2] + (B[2] - A[2]) * tt | 0})`;
}

/** hex + alpha -> "rgba(...)". alpha coerced to a finite number (anti-freeze). */
export function rgba(h, a) {
  const A = hx(h);
  const al = Number.isFinite(a) ? a : 0;
  return `rgba(${A[0]},${A[1]},${A[2]},${al})`;
}

// ---- canvas primitives -----------------------------------------------------
/** Additive-friendly radial glow (caller sets compositeOperation='lighter'). */
export function glow(x, y, r, c, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(c, a));
  g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 6.2832);
  ctx.fill();
}

/** N-pointed star path (does not fill/stroke — caller decides). */
export function star(cx, cy, R, r, n) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = Math.PI / n * i - Math.PI / 2;
    const rad = i % 2 ? r : R;
    const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
}

// ---- roundRect polyfill ----------------------------------------------------
// Kept from the prototype: it crashed on engines lacking ctx.roundRect.
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    let radii = typeof r === 'number' ? [r, r, r, r] : (Array.isArray(r) ? r : [0, 0, 0, 0]);
    if (radii.length === 1) radii = [radii[0], radii[0], radii[0], radii[0]];
    if (radii.length === 2) radii = [radii[0], radii[1], radii[0], radii[1]];
    const [tl, tr, br, bl] = radii;
    this.beginPath();
    this.moveTo(x + tl, y);
    this.lineTo(x + w - tr, y); this.arcTo(x + w, y, x + w, y + tr, tr);
    this.lineTo(x + w, y + h - br); this.arcTo(x + w, y + h, x + w - br, y + h, br);
    this.lineTo(x + bl, y + h); this.arcTo(x, y + h, x, y + h - bl, bl);
    this.lineTo(x, y + tl); this.arcTo(x, y, x + tl, y, tl);
    this.closePath();
    return this;
  };
}
