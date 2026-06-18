// cloth.js — verlet secondary-motion chains. PORTED verbatim from the feel
// slices. Drives hair, capes, light-mantles, stoles and robe hems so they trail
// the figure's motion. Pure simulation: no ctx, no palette.

/**
 * @typedef {{ x:number, y:number, px:number, py:number }} ClothPoint
 * @typedef {{ pts: ClothPoint[], seg:number }} Chain
 */

/** Build a chain of n points spaced `seg` apart, hanging from (x,y). */
export function makeChain(n, seg, x, y) {
  const pts = [];
  for (let i = 0; i < n; i++) pts.push({ x, y: y + i * seg, px: x, py: y + i * seg });
  return { pts, seg };
}

/**
 * Advance a verlet chain one step.
 * @param {Chain} ch
 * @param {number} ax anchor x (point 0 is pinned here)
 * @param {number} ay anchor y
 * @param {number} fx per-step force x (e.g. inertial drag + breeze)
 * @param {number} fy per-step force y (e.g. buoyancy/gravity)
 * @param {number} [stiff] constraint solver iterations (higher = stiffer)
 */
export function stepChain(ch, ax, ay, fx, fy, stiff) {
  ch.pts[0].x = ax; ch.pts[0].y = ay; ch.pts[0].px = ax; ch.pts[0].py = ay;
  for (let i = 1; i < ch.pts.length; i++) {
    const p = ch.pts[i];
    let vx = (p.x - p.px) * 0.9, vy = (p.y - p.py) * 0.9;
    p.px = p.x; p.py = p.y;
    p.x += vx + fx; p.y += vy + fy;
  }
  const it = stiff || 2;
  for (let k = 0; k < it; k++) for (let i = 1; i < ch.pts.length; i++) {
    const a = ch.pts[i - 1], p = ch.pts[i];
    let dx = p.x - a.x, dy = p.y - a.y;
    const d = Math.hypot(dx, dy) || 0.0001;
    const diff = (d - ch.seg) / d;
    p.x -= dx * diff; p.y -= dy * diff;
  }
}
