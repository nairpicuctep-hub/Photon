// CampaignMapScene.js — Act I mission select, in the dawn art language. Missions
// unlock in sequence; cleared ones show stars. Tap an unlocked node to play.

import { ctx } from '../render/gfx.js';
import { rgba, glow, star, clamp } from '../render/primitives.js';
import { initScene, drawScene, setDawn, drawVignette } from '../render/scene.js';
import { reduce } from '../core/env.js';
import { bindButtons, makeButton } from '../ui/widgets.js';
import { actMissions } from '../data/missions.js';
import { isMissionCleared, missionStars } from '../save/save.js';

export class CampaignMapScene {
  constructor(viewport, nav) { this.viewport = viewport; this.nav = nav; this.t = 0; this.buttons = []; this.nodes = []; }

  enter() {
    this.viewport.setLogical(1280, 720);
    initScene({ W: 1280, H: 720, GROUND: 566, reduce });
    setDawn(0.45);
    const missions = actMissions(1);
    this.nodes = [];
    this.buttons = [];
    const y = 360, x0 = 200, dx = (1280 - 400) / Math.max(1, missions.length - 1);
    missions.forEach((m, i) => {
      const prev = i === 0 ? null : missions[i - 1];
      const unlocked = i === 0 || (prev && isMissionCleared(prev.id));
      const stars = missionStars(m.id);
      const x = x0 + dx * i;
      this.nodes.push({ m, x, y, unlocked, stars });
      const b = makeButton({
        x: x - 80, y: y - 30, w: 160, h: 60, label: m.name, sub: unlocked ? (stars ? '★'.repeat(stars) : 'Play') : 'Locked',
        primary: unlocked && !stars, enabled: !!unlocked, fontSize: 16,
        onClick: () => this.nav.mission(m),
      });
      this.buttons.push(b);
    });
    this.back = makeButton({ x: 40, y: 640, w: 160, h: 48, label: '← Menu', fontSize: 16, onClick: () => this.nav.menu() });
    this.buttons.push(this.back);
    this._unbind = bindButtons(document.getElementById('c'), this.viewport, () => this.buttons);
  }

  exit() { if (this._unbind) this._unbind(); }
  update(dt) { this.t += dt; }

  render(dt) {
    this.viewport.begin();
    drawScene(dt);
    // path between nodes
    ctx.save(); ctx.strokeStyle = rgba('#ffd24a', 0.3); ctx.lineWidth = 4; ctx.setLineDash([8, 10]);
    ctx.beginPath();
    this.nodes.forEach((n, i) => { if (i === 0) ctx.moveTo(n.x, n.y + 40); else ctx.lineTo(n.x, n.y + 40); });
    ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    // title
    ctx.save(); ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd24a'; ctx.font = '700 14px system-ui,sans-serif'; ctx.fillText('CAMPAIGN · ACT I', 640, 90);
    ctx.fillStyle = '#fff7e0'; ctx.font = '800 40px system-ui,sans-serif'; ctx.shadowColor = 'rgba(255,210,74,0.4)'; ctx.shadowBlur = 24;
    ctx.fillText('The First Light', 640, 135); ctx.shadowBlur = 0; ctx.textAlign = 'left'; ctx.restore();
    for (const b of this.buttons) b.draw();
    // blurb of hovered/first unlocked
    const hov = this.buttons.find((b) => b.hover && b.enabled);
    const node = hov ? this.nodes.find((n) => Math.abs(n.x - (hov.x + hov.w / 2)) < 2) : null;
    if (node) {
      ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = rgba('#cfd6ff', 0.95); ctx.font = '500 15px system-ui,sans-serif';
      wrapText(node.m.blurb, 640, 470, 760, 22); ctx.textAlign = 'left'; ctx.restore();
    }
    drawVignette();
    this.viewport.end();
  }
}

function wrapText(text, cx, y, maxW, lh) {
  const words = text.split(' '); let line = '', yy = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW) { ctx.fillText(line, cx, yy); line = w; yy += lh; }
    else line = test;
  }
  if (line) ctx.fillText(line, cx, yy);
}
