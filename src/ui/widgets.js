// widgets.js — minimal canvas-drawn UI (buttons) in the art's visual language,
// reused by the menu / result / pause scenes. Hit-testing is in logical coords.

import { ctx } from '../render/gfx.js';
import { rgba, glow } from '../render/primitives.js';

export function makeButton(spec) {
  return {
    x: spec.x, y: spec.y, w: spec.w, h: spec.h,
    label: spec.label, primary: !!spec.primary, sub: spec.sub || '',
    enabled: spec.enabled !== false, onClick: spec.onClick || (() => {}),
    hover: false,
    contains(p) { return p.x >= this.x && p.x <= this.x + this.w && p.y >= this.y && p.y <= this.y + this.h; },
    draw() {
      ctx.save();
      ctx.globalAlpha = this.enabled ? 1 : 0.45;
      if (this.primary) {
        const g = ctx.createLinearGradient(this.x, 0, this.x + this.w, 0); g.addColorStop(0, '#ffd24a'); g.addColorStop(1, '#ff9d54');
        ctx.fillStyle = g; ctx.strokeStyle = 'transparent';
        if (this.hover) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(this.x + this.w / 2, this.y + this.h / 2, this.w * 0.6, '#ffd24a', 0.25); ctx.restore(); }
      } else {
        ctx.fillStyle = 'rgba(16,18,32,0.8)';
        ctx.strokeStyle = this.hover ? '#ffd24a' : rgba('#ffd24a', 0.35); ctx.lineWidth = 1.5;
      }
      ctx.beginPath(); ctx.roundRect(this.x, this.y, this.w, this.h, 14); ctx.fill(); if (!this.primary) ctx.stroke();
      ctx.fillStyle = this.primary ? '#1a1000' : '#eef1ff';
      ctx.font = '700 ' + (spec.fontSize || 20) + 'px system-ui,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(this.label, this.x + this.w / 2, this.y + this.h / 2 + (this.sub ? -8 : 0));
      if (this.sub) { ctx.font = '600 12px system-ui,sans-serif'; ctx.fillStyle = this.primary ? 'rgba(26,16,0,0.7)' : rgba('#9aa0c8', 1); ctx.fillText(this.sub, this.x + this.w / 2, this.y + this.h / 2 + 14); }
      ctx.textAlign = 'left'; ctx.restore();
    },
  };
}

/** Wire pointer hit-testing for a list of buttons. Returns an unbind fn. */
export function bindButtons(canvas, viewport, getButtons) {
  function loc(ev) { const t = ev.touches && ev.touches[0] ? ev.touches[0] : ev; return viewport.toLogical(t.clientX, t.clientY); }
  const move = (ev) => { const p = loc(ev); for (const b of getButtons()) b.hover = b.enabled && b.contains(p); };
  const down = (ev) => { const p = loc(ev); for (const b of getButtons()) if (b.enabled && b.contains(p)) { b.onClick(); return; } };
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerdown', down);
  return () => { canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerdown', down); };
}
