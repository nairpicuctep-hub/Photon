// MenuScene.js — main menu in the dawn art language. Play / Campaign / Gallery.

import { ctx } from '../render/gfx.js';
import { rgba, glow, star } from '../render/primitives.js';
import { initScene, drawScene, setDawn, drawVignette } from '../render/scene.js';
import { reduce } from '../core/env.js';
import { makeButton, bindButtons } from '../ui/widgets.js';
import { openSettings } from '../ui/settingsPanel.js';
import { getName } from '../save/save.js';

export class MenuScene {
  constructor(viewport, nav) {
    this.viewport = viewport; this.nav = nav; this.t = 0; this.buttons = [];
  }

  enter() {
    this.viewport.setLogical(1280, 720);
    initScene({ W: 1280, H: 720, GROUND: 566, reduce });
    setDawn(0.55);
    const cx = 640, w = 300, h = 58, gap = 14; let y = 312;
    this.buttons = [
      makeButton({ x: cx - w / 2, y, w, h, label: 'Campaign', sub: 'Act I — The First Light', primary: true, onClick: () => this.nav.campaign() }),
      makeButton({ x: cx - w / 2, y: y + (h + gap), w, h, label: 'Play', sub: 'Survival & Boss Rush', onClick: () => this.nav.modes() }),
      makeButton({ x: cx - w / 2, y: y + (h + gap) * 2, w, h, label: 'Hero Gallery', sub: 'Meet Echipa Lumina', onClick: () => this.nav.gallery() }),
      makeButton({ x: cx - w / 2, y: y + (h + gap) * 3, w, h, label: 'Settings', sub: 'Audio & accessibility', onClick: () => openSettings() }),
    ];
    const canvas = document.getElementById('c');
    this._unbind = bindButtons(canvas, this.viewport, () => this.buttons);
  }

  exit() { if (this._unbind) this._unbind(); }

  update(dt) { this.t += dt; setDawn(0.5 + Math.sin(this.t * 0.25) * 0.12); }

  render(dt) {
    this.viewport.begin();
    drawScene(dt);
    // title
    ctx.save();
    ctx.textAlign = 'center';
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(640, 150, 260, '#ffd24a', 0.18); ctx.restore();
    ctx.fillStyle = '#ffd24a'; ctx.font = '700 16px system-ui,sans-serif'; ctx.letterSpacing = '6px';
    ctx.fillText('ECHIPA LUMINA', 640, 110);
    ctx.fillStyle = '#fff7e0'; ctx.font = '800 58px system-ui,sans-serif'; ctx.letterSpacing = '0px';
    ctx.shadowColor = 'rgba(255,210,74,0.5)'; ctx.shadowBlur = 30;
    ctx.fillText('Frontline of Light', 640, 175);
    ctx.shadowBlur = 0;
    ctx.fillStyle = rgba('#9aa0c8', 1); ctx.font = '500 15px system-ui,sans-serif';
    ctx.fillText('Radu Photon leads the Light Team against the Shadow Network.', 640, 230);
    // little star flourish
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#fffdf5'; star(640, 290, 9, 4, 5); ctx.fill(); ctx.restore();
    ctx.restore();
    for (const b of this.buttons) b.draw();
    const name = getName();
    if (name) {
      ctx.save(); ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd24a'; ctx.font = '700 15px system-ui,sans-serif';
      ctx.fillText(`✦ Playing as ${name}`, 640, 262);
      ctx.textAlign = 'left'; ctx.restore();
    }
    ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = rgba('#9aa0c8', 0.7); ctx.font = '500 12px system-ui,sans-serif';
    ctx.fillText('Friendship is stronger than power.', 640, 680); ctx.textAlign = 'left'; ctx.restore();
    drawVignette();
    this.viewport.end();
  }
}
