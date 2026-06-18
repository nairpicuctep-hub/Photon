// ModeSelectScene.js — arcade modes: Survival (score chase) and Boss Rush.

import { ctx } from '../render/gfx.js';
import { rgba, glow } from '../render/primitives.js';
import { initScene, drawScene, setDawn, drawVignette } from '../render/scene.js';
import { reduce } from '../core/env.js';
import { makeButton, bindButtons } from '../ui/widgets.js';
import { get as getSave } from '../save/save.js';

export class ModeSelectScene {
  constructor(viewport, nav) { this.viewport = viewport; this.nav = nav; this.t = 0; this.buttons = []; }

  enter() {
    this.viewport.setLogical(1280, 720);
    initScene({ W: 1280, H: 720, GROUND: 566, reduce });
    setDawn(0.5);
    const best = (getSave().stats && getSave().stats.bestSurvival) || 0;
    const cx = 640, w = 360, h = 72, gap = 18; let y = 300;
    this.buttons = [
      makeButton({ x: cx - w / 2, y, w, h, label: 'Survival', sub: best ? `Endless waves · Best ${best}` : 'Endless waves — how long can you hold?', primary: true, onClick: () => this.nav.survival() }),
      makeButton({ x: cx - w / 2, y: y + (h + gap), w, h, label: 'Boss Rush', sub: 'Umbra → Doctor Null → The Void', onClick: () => this.nav.bossRush() }),
      makeButton({ x: 40, y: 640, w: 150, h: 46, label: '← Menu', fontSize: 16, onClick: () => this.nav.menu() }),
    ];
    this._unbind = bindButtons(document.getElementById('c'), this.viewport, () => this.buttons);
  }
  exit() { if (this._unbind) this._unbind(); }
  update(dt) { this.t += dt; }

  render(dt) {
    this.viewport.begin();
    drawScene(dt);
    ctx.save(); ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd24a'; ctx.font = '700 14px system-ui,sans-serif'; ctx.fillText('ARCADE', 640, 150);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(640, 200, 200, '#ffd24a', 0.14); ctx.restore();
    ctx.fillStyle = '#fff7e0'; ctx.font = '800 46px system-ui,sans-serif'; ctx.shadowColor = 'rgba(255,210,74,0.4)'; ctx.shadowBlur = 24;
    ctx.fillText('Choose a Mode', 640, 210); ctx.shadowBlur = 0;
    ctx.textAlign = 'left'; ctx.restore();
    for (const b of this.buttons) b.draw();
    drawVignette();
    this.viewport.end();
  }
}
