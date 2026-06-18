// loop.js — the guarded main loop. PORTED ethos from the feel slices: a single
// requestAnimationFrame loop with delta-time clamped (in time.js), wrapped in
// try/catch so one bad frame logs an error instead of freezing the game.
//
// The slices use clamped variable-dt (not a fixed-step accumulator). The hero
// animation timings are tuned to that, so we keep it to preserve the feel; a
// fixed-step accumulator can be layered in later for the deterministic sim
// without changing this contract.

import { makeClock } from './time.js';

/**
 * @param {(dt:number)=>void} update
 * @param {(dt:number)=>void} render
 * @returns {() => void} stop function
 */
export function startLoop(update, render) {
  const clock = makeClock();
  let raf = 0;
  let running = true;

  function frame(now) {
    if (!running) return;
    const dt = clock.tick(now);
    try {
      update(dt);
      render(dt);
    } catch (e) {
      // Never freeze on a single bad frame.
      console.error('[loop] frame error:', e);
    }
    raf = requestAnimationFrame(frame);
  }

  raf = requestAnimationFrame(frame);
  return function stop() {
    running = false;
    cancelAnimationFrame(raf);
  };
}
