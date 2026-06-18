// gfx.js — the single active 2D drawing context.
//
// The brief mandates a single full-canvas Canvas2D context (Section 3.1). The
// feel slices all close over one module-global `ctx`; to port their drawing
// code faithfully (and keep the dense figure/scene functions byte-identical to
// source) we expose that one context here. ES module *live bindings* mean every
// importer sees the value set by `setCtx()` — the loop sets it once per frame.
//
// This is intentionally the only piece of mutable module state in render/.

/** @type {CanvasRenderingContext2D|null} */
export let ctx = null;

/** Bind the active drawing context. Called by the viewport each frame. */
export function setCtx(c) {
  ctx = c;
}
