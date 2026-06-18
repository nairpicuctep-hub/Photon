// time.js — global clock with support for *local* time-scaling.
//
// The brief (Section 3.3): character animation always runs on real dt and never
// slows. Specific entities/zones can be slowed locally — this is how Andreea's
// Temporal Eddy slows only projectiles inside its radius, and how Foresight
// applies a brief global premonition slow to projectiles. Model time-scale as a
// per-entity multiplier the simulation reads:  eff = dt * fieldFactor * premonitionFactor

const MAX_DT = 0.05; // clamp big frame gaps, exactly like the feel slices

export function makeClock() {
  let last = performance.now();
  let elapsed = 0;
  return {
    /** Real, clamped delta-time in seconds. Used for ALL character animation. */
    tick(now) {
      let dt = (now - last) / 1000;
      last = now;
      if (dt > MAX_DT) dt = MAX_DT;
      if (!(dt >= 0)) dt = 0; // guard NaN / clock weirdness
      elapsed += dt;
      return dt;
    },
    get elapsed() { return elapsed; },
    reset() { last = performance.now(); },
  };
}

/**
 * Effective dt for an entity under any number of slow factors (each in [0,1]).
 * Projectiles read this; characters do not. Returns dt scaled by the product.
 */
export function scaledDt(dt, ...factors) {
  let f = 1;
  for (const x of factors) f *= Number.isFinite(x) ? x : 1;
  return dt * f;
}
