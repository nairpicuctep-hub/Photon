// rng.js — seedable RNG (mulberry32) for deterministic gameplay (wave spawns,
// loot, AI jitter). Cosmetic scene noise still uses Math.random to match the
// feel slices exactly; anything that affects the simulation should use this so
// runs are reproducible and testable.

/** @param {number} seed 32-bit integer seed */
export function makeRng(seed = 0x9e3779b9) {
  let a = seed >>> 0;
  function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  return {
    /** float in [0,1) */
    next,
    /** float in [min,max) */
    range(min, max) { return min + next() * (max - min); },
    /** integer in [min,max] inclusive */
    int(min, max) { return Math.floor(min + next() * (max - min + 1)); },
    /** pick a random element */
    pick(arr) { return arr[Math.floor(next() * arr.length)]; },
    reseed(s) { a = s >>> 0; },
  };
}
