// canvas.js — DPR-aware viewport. Renders in a fixed *logical* coordinate space
// (e.g. 960x600 for a feel slice, 1280x720 for the battler) and letterbox-scales
// it to the device, exactly as the feel slices' fit() does. Owns the single 2D
// context and publishes it to render/gfx so the ported drawing code can use it.

import { setCtx } from '../render/gfx.js';

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number} W logical width
 * @param {number} H logical height
 */
export function makeViewport(canvas, logicalW, logicalH) {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const ctx = canvas.getContext('2d');
  setCtx(ctx);
  let W = logicalW, H = logicalH;
  let scale = 1, ox = 0, oy = 0;

  function fit() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    scale = Math.min(w / W, h / H);
    ox = (w - W * scale) / 2;
    oy = (h - H * scale) / 2;
  }

  /** Map a device/client point to logical coordinates (for input). */
  function toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - ox) / scale;
    const y = (clientY - rect.top - oy) / scale;
    return { x, y };
  }

  /** Begin a frame: reset transform, clear, then apply logical transform + shake. */
  function begin(shakeX = 0, shakeY = 0) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
    ctx.translate(shakeX, shakeY);
  }

  function end() { ctx.restore(); }

  /** Switch the logical coordinate space (e.g. 960x600 preview -> 1280x720 battle). */
  function setLogical(w, h) { W = w; H = h; fit(); }

  fit();
  window.addEventListener('resize', fit);

  return {
    ctx, dpr, fit, toLogical, begin, end, setLogical,
    get W() { return W; }, get H() { return H; },
    get scale() { return scale; }, get ox() { return ox; }, get oy() { return oy; },
  };
}
