// EndingScene.js — the victory outro after the Act IV finale. Full dawn, the
// whole team together, the thesis, and a personal sign-off. Closes the arc the
// comic intro opened.

import { ctx } from '../render/gfx.js';
import { rgba, glow, star } from '../render/primitives.js';
import { initScene, drawScene, setDawn, drawVignette } from '../render/scene.js';
import * as particles from '../render/particles.js';
import { reduce } from '../core/env.js';
import { makeButton, bindButtons } from '../ui/widgets.js';
import { getName } from '../save/save.js';
import { sfx } from '../audio/audio.js';

const GY = 556;
const TEAM = [['#7fe9dd'], ['#ffb15a'], ['#7df0bf'], ['#ffd24a', 1], ['#8e7ff0'], ['#d79bff']];

function figure(x, gy, h, col, glowOn) {
  if (glowOn) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(x, gy - h * 0.55, h * 0.9, '#fff7d6', 0.45); ctx.restore(); }
  ctx.lineCap = 'round'; ctx.strokeStyle = col; ctx.lineWidth = h * 0.07;
  ctx.beginPath(); ctx.moveTo(x - h * 0.05, gy - h * 0.32); ctx.lineTo(x - h * 0.07, gy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + h * 0.05, gy - h * 0.32); ctx.lineTo(x + h * 0.07, gy); ctx.stroke();
  ctx.strokeStyle = '#0c0a14'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - h * 0.13, gy - h * 0.3);
  ctx.quadraticCurveTo(x - h * 0.17, gy - h * 0.52, x - h * 0.08, gy - h * 0.66);
  ctx.lineTo(x + h * 0.08, gy - h * 0.66);
  ctx.quadraticCurveTo(x + h * 0.17, gy - h * 0.52, x + h * 0.13, gy - h * 0.3);
  ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, gy - h * 0.78, h * 0.13, 0, 6.28); ctx.fill(); ctx.stroke();
}

export class EndingScene {
  constructor(viewport, nav) { this.viewport = viewport; this.nav = nav; this.t = 0; this.buttons = []; }

  enter() {
    this.viewport.setLogical(1280, 720);
    initScene({ W: 1280, H: 720, GROUND: GY, reduce });
    setDawn(1);
    particles.reset();
    const cx = 640, w = 240, h = 56;
    this.buttons = [
      makeButton({ x: cx - w - 10, y: 612, w, h, label: 'Main Menu', primary: true, onClick: () => this.nav.menu() }),
      makeButton({ x: cx + 10, y: 612, w, h, label: 'Keep Playing', onClick: () => this.nav.modes() }),
    ];
    this._unbind = bindButtons(document.getElementById('c'), this.viewport, () => this.buttons);
    sfx('win');
  }
  exit() { if (this._unbind) this._unbind(); particles.reset(); }

  update(dt) {
    this.t += dt;
    if (!reduce && Math.random() < 0.6) particles.emitPhotons(1, 200 + Math.random() * 880, GY - 40 - Math.random() * 200, 60, -10);
    particles.update(dt);
  }

  render(dt) {
    this.viewport.begin();
    drawScene(dt);
    // extra dawn bloom
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(640, GY + 20, 460, '#ffe1a8', 0.35); ctx.restore();
    // the team, together
    TEAM.forEach((tc, k) => { const x = 380 + k * 80; figure(x, GY, tc[1] ? 150 : 128, tc[0], !!tc[1]); });
    particles.drawParts();
    // titles
    ctx.save(); ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd24a'; ctx.font = '700 15px system-ui,sans-serif'; ctx.fillText('VICTORY', 640, 120);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(640, 175, 280, '#ffd24a', 0.2); ctx.restore();
    ctx.fillStyle = '#fff7e0'; ctx.font = '800 56px system-ui,sans-serif'; ctx.shadowColor = 'rgba(255,210,74,0.6)'; ctx.shadowBlur = 30;
    ctx.fillText('The Dawn is Saved', 640, 185); ctx.shadowBlur = 0;
    ctx.fillStyle = rgba('#cfd6ff', 1); ctx.font = '500 17px system-ui,sans-serif';
    ctx.fillText('The Void is broken. Light returns to the frontier — and stays.', 640, 222);
    const name = getName();
    ctx.fillStyle = '#ffd24a'; ctx.font = '700 18px system-ui,sans-serif';
    ctx.fillText(name ? `Well fought, ${name}. Echipa Lumina endures.` : 'Echipa Lumina endures.', 640, 250);
    // thesis flourish
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#fffdf5'; star(640, 300, 10, 4.5, 5); ctx.fill(); ctx.restore();
    ctx.fillStyle = rgba('#fff7e0', 0.9); ctx.font = '800 20px system-ui,sans-serif';
    ctx.fillText('Friendship is stronger than power.', 640, 340);
    ctx.textAlign = 'left'; ctx.restore();
    for (const b of this.buttons) b.draw();
    drawVignette();
    this.viewport.end();
  }
}
