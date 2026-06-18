// input.js — unified input. Keyboard map for desktop hotkeys, and a pointer
// abstraction that unifies mouse + touch and reports logical coordinates (via
// the viewport) so battle/touch UI can be built on one path.

/**
 * Bind lowercase-key handlers. Returns an unbind function.
 * @param {Record<string, (e:KeyboardEvent)=>void>} map
 */
export function bindKeys(map) {
  const handler = (e) => {
    const k = (e.key || '').toLowerCase();
    const fn = map[k];
    if (fn) fn(e);
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}

/**
 * Unified pointer over a canvas. Callbacks receive logical {x,y}.
 * @param {HTMLElement} el
 * @param {{toLogical:(x:number,y:number)=>{x:number,y:number}}} viewport
 * @param {{down?:Function, move?:Function, up?:Function}} cbs
 */
export function makePointer(el, viewport, cbs = {}) {
  const loc = (ev) => {
    const t = ev.touches && ev.touches[0] ? ev.touches[0] : ev;
    return viewport.toLogical(t.clientX, t.clientY);
  };
  const down = (ev) => { cbs.down && cbs.down(loc(ev), ev); };
  const move = (ev) => { cbs.move && cbs.move(loc(ev), ev); };
  const up = (ev) => { cbs.up && cbs.up(loc(ev), ev); };

  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);

  return () => {
    el.removeEventListener('pointerdown', down);
    el.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
  };
}
