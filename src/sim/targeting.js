// targeting.js — lane-battler target acquisition. Units live on a 1D lane (x).
// Light units advance +x (toward the Dark Core); shadow units advance -x
// (toward the Photon Tower). Engagement is horizontal-distance based.

/** Nearest living foe by |dx|, or null. */
export function acquireTarget(unit, foes) {
  let best = null, bestD = Infinity;
  for (const f of foes) {
    if (f.dead) continue;
    const d = Math.abs(f.x - unit.x);
    if (d < bestD) { bestD = d; best = f; }
  }
  return best;
}

export function inRange(unit, target, range) {
  return Math.abs(unit.x - target.x) <= (range != null ? range : unit.range);
}

/** Front-most ally (max x) and front-most enemy (min x). */
export function frontMostAlly(allies) {
  let best = null;
  for (const a of allies) { if (a.dead) continue; if (!best || a.x > best.x) best = a; }
  return best;
}
export function frontMostEnemy(enemies) {
  let best = null;
  for (const e of enemies) { if (e.dead) continue; if (!best || e.x < best.x) best = e; }
  return best;
}
