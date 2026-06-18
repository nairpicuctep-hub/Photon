// scene.js — the painted parallax battlefield. PORTED verbatim from the feel
// slices. A single `dawn ∈ [0,1]` value drives the whole transformation from
// dark void to dawn: sky gradient, twinkling stars (fade as dawn rises), the
// dawn sun bloom, the CERN accelerator arc, layered hills, volumetric light
// shafts, ground + warm reflection pool, and drifting motes. The full-screen
// vignette is here too.
//
// In the battler `dawn` is computed from the front line (light advancing ->
// dawn rises). Expose setDawn/getDawn so callers can drive it.

import { ctx } from './gfx.js';
import { mix, rgba, glow } from './primitives.js';

let W = 960, H = 600, GROUND = 506, reduce = false;
let dawn = 0.42;
let stars = [], motes = [], hills = [];

/** Initialize scene geometry for a given logical viewport. */
export function initScene(opts) {
  W = opts.W; H = opts.H; GROUND = opts.GROUND; reduce = !!opts.reduce;
  stars = Array.from({ length: 80 }, () => ({
    x: Math.random() * W, y: Math.random() * GROUND * 0.78,
    r: Math.random() * 1.5 + 0.4, a: Math.random() * 0.6 + 0.2, tw: Math.random() * 6,
  }));
  motes = Array.from({ length: reduce ? 14 : 34 }, () => ({
    x: Math.random() * W, y: Math.random() * GROUND,
    vx: (Math.random() - 0.5) * 6, vy: -(4 + Math.random() * 9),
    ph: Math.random() * 6, z: 0.4 + Math.random() * 0.6,
  }));
  hills = [
    { y: 430, amp: 26, col1: '#0e1430', col2: '#243a6b', sp: 0.012, off: 0 },
    { y: 462, amp: 18, col1: '#0a0e26', col2: '#1a2a55', sp: 0.018, off: 2 },
  ];
}

export function setDawn(v) { dawn = Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0)); }
export function getDawn() { return dawn; }

/** Draw the full painted background. dt advances star twinkle + mote drift. */
export function drawScene(dt) {
  const p = dawn;
  // sky
  const g = ctx.createLinearGradient(0, 0, 0, GROUND + 30);
  g.addColorStop(0, mix('#05060e', '#142251', p));
  g.addColorStop(0.55, mix('#0b0a1c', '#36508f', p));
  g.addColorStop(1, mix('#180e2c', '#ff9d54', p * 0.92));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, GROUND + 40);

  // stars
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const s of stars) {
    s.tw += dt;
    ctx.globalAlpha = s.a * (1 - p) * (0.6 + Math.sin(s.tw * 2) * 0.4);
    ctx.fillStyle = '#cfe0ff';
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.28); ctx.fill();
  }
  ctx.restore();

  // dawn sun glow on horizon
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  glow(W * 0.62, GROUND + 10, 360, mix('#3a2a55', '#ffe1a8', p), 0.12 + p * 0.28);
  glow(W * 0.62, GROUND + 10, 150, '#fff3d6', p * 0.5);
  ctx.restore();

  // CERN ring
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = rgba(mix('#2a3a6a', '#ffd24a', p), 0.45); ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(W * 0.5, GROUND + 150, 320, Math.PI * 1.13, Math.PI * 1.87); ctx.stroke();
  ctx.strokeStyle = rgba(mix('#2a3a6a', '#fff3c4', p), 0.35); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(W * 0.5, GROUND + 150, 300, Math.PI * 1.13, Math.PI * 1.87); ctx.stroke();
  ctx.restore();

  // parallax hills (atmospheric perspective)
  for (const h of hills) {
    ctx.fillStyle = mix(h.col1, h.col2, p * 0.7);
    ctx.beginPath(); ctx.moveTo(0, GROUND);
    for (let x = 0; x <= W; x += 24) ctx.lineTo(x, h.y - Math.sin(x * h.sp + h.off) * h.amp - Math.sin(x * h.sp * 2.3 + h.off) * h.amp * 0.4);
    ctx.lineTo(W, GROUND); ctx.closePath(); ctx.fill();
  }

  // volumetric light shafts from the dawn
  if (!reduce) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const sx = W * 0.62, a = (0.05 + p * 0.12) * (1 - i * 0.18); const ang = -1.15 - i * 0.12;
      const lg = ctx.createLinearGradient(sx, GROUND, sx + Math.cos(ang) * 500, GROUND + Math.sin(ang) * 500);
      lg.addColorStop(0, rgba('#ffe6b0', a)); lg.addColorStop(1, rgba('#ffe6b0', 0));
      ctx.fillStyle = lg; ctx.save(); ctx.translate(sx, GROUND - 20); ctx.rotate(ang); ctx.fillRect(-8, -30, 520, 60); ctx.restore();
    }
    ctx.restore();
  }

  // ground
  const gg = ctx.createLinearGradient(0, GROUND, 0, H);
  gg.addColorStop(0, mix('#14152a', '#3a3152', p * 0.5)); gg.addColorStop(1, '#070710');
  ctx.fillStyle = gg; ctx.fillRect(0, GROUND, W, H - GROUND);
  // warm light pooling on ground from the dawn
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const pool = ctx.createLinearGradient(0, GROUND, 0, H);
  pool.addColorStop(0, rgba('#ffd24a', 0.10 + p * 0.06)); pool.addColorStop(1, rgba('#ffd24a', 0));
  ctx.fillStyle = pool; ctx.fillRect(0, GROUND, W, H - GROUND); ctx.restore();
  ctx.strokeStyle = rgba('#ffffff', 0.06); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke();

  // motes
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const m of motes) {
    m.x += m.vx * dt * m.z; m.y += m.vy * dt * m.z; m.ph += dt;
    if (m.y < -6) { m.y = GROUND + 6; m.x = Math.random() * W; }
    ctx.globalAlpha = (0.25 + Math.sin(m.ph * 2) * 0.2) * m.z;
    ctx.fillStyle = mix('#9a6fd6', '#ffe9a8', p);
    ctx.beginPath(); ctx.arc(m.x, m.y, 1.4 * m.z, 0, 6.28); ctx.fill();
  }
  ctx.restore();
}

/** Full-screen dark vignette — draw last, over everything. */
export function drawVignette() {
  const v = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.5, H * 0.95);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}
