// pool.js — generic object pool. The brief (Section 12) requires pooling for
// projectiles, particles, after-images and debris to hit 60fps on mid-range
// phones without per-frame GC churn.

/**
 * @template T
 * @param {() => T} create  factory for a fresh object
 * @param {(o:T) => void} [reset]  reset an object before reuse
 */
export function makePool(create, reset) {
  /** @type {T[]} */
  const free = [];
  /** @type {Set<T>} */
  const live = new Set();

  return {
    acquire() {
      const o = free.pop() || create();
      live.add(o);
      return o;
    },
    release(o) {
      if (!live.delete(o)) return;
      if (reset) reset(o);
      free.push(o);
    },
    /** Release every live object. */
    releaseAll() {
      for (const o of live) { if (reset) reset(o); free.push(o); }
      live.clear();
    },
    get liveCount() { return live.size; },
    get freeCount() { return free.length; },
    forEach(fn) { live.forEach(fn); },
  };
}
