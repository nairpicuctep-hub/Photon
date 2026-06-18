// CampaignMapScene.js — multi-act mission select in the dawn art language.
// Acts switch with ◄ ►; missions unlock in global order (clear the previous one).

import { ctx } from '../render/gfx.js';
import { rgba, glow } from '../render/primitives.js';
import { initScene, drawScene, setDawn, drawVignette } from '../render/scene.js';
import { reduce } from '../core/env.js';
import { bindButtons, makeButton } from '../ui/widgets.js';
import { ACTS, acts, actMissions, missionIndex, prevMission } from '../data/missions.js';
import { isMissionCleared, missionStars } from '../save/save.js';

export class CampaignMapScene {
  constructor(viewport, nav) { this.viewport = viewport; this.nav = nav; this.t = 0; this.buttons = []; this.nodes = []; this.act = null; }

  enter() {
    this.viewport.setLogical(1280, 720);
    initScene({ W: 1280, H: 720, GROUND: 566, reduce });
    setDawn(0.45);
    this.actList = acts();
    if (this.act == null) this.act = this._defaultAct();
    this._build();
    this._unbind = bindButtons(document.getElementById('c'), this.viewport, () => this.buttons);
  }
  exit() { if (this._unbind) this._unbind(); }
  update(dt) { this.t += dt; }

  _unlocked(m) { const p = prevMission(m.id); return !p || isMissionCleared(p.id); }
  _defaultAct() {
    for (const a of this.actList) { for (const m of actMissions(a)) { if (this._unlocked(m) && !isMissionCleared(m.id)) return a; } }
    return this.actList[this.actList.length - 1];
  }

  _build() {
    const missions = actMissions(this.act);
    this.nodes = []; this.buttons = [];
    const y = 372, n = missions.length, x0 = 210, dx = n > 1 ? (1280 - 420) / (n - 1) : 0;
    missions.forEach((m, i) => {
      const unlocked = this._unlocked(m);
      const stars = missionStars(m.id);
      const x = n > 1 ? x0 + dx * i : 640;
      this.nodes.push({ m, x, y, unlocked, stars });
      this.buttons.push(makeButton({
        x: x - 78, y: y - 28, w: 156, h: 58, label: m.name,
        sub: unlocked ? (stars ? '★'.repeat(stars) : 'Play') : '🔒 Locked',
        primary: unlocked && !stars, enabled: !!unlocked, fontSize: 14,
        onClick: () => this.nav.mission(m),
      }));
    });
    const ai = this.actList.indexOf(this.act);
    if (ai > 0) this.buttons.push(makeButton({ x: 28, y: 338, w: 56, h: 66, label: '◄', primary: true, onClick: () => { this.act = this.actList[ai - 1]; this._build(); } }));
    if (ai < this.actList.length - 1) this.buttons.push(makeButton({ x: 1196, y: 338, w: 56, h: 66, label: '►', primary: true, onClick: () => { this.act = this.actList[ai + 1]; this._build(); } }));
    this.buttons.push(makeButton({ x: 40, y: 648, w: 150, h: 44, label: '← Menu', fontSize: 16, onClick: () => this.nav.menu() }));
  }

  render(dt) {
    this.viewport.begin();
    drawScene(dt);
    // path between nodes
    ctx.save(); ctx.strokeStyle = rgba('#ffd24a', 0.3); ctx.lineWidth = 4; ctx.setLineDash([8, 10]);
    ctx.beginPath();
    this.nodes.forEach((nd, i) => { if (i === 0) ctx.moveTo(nd.x, nd.y + 42); else ctx.lineTo(nd.x, nd.y + 42); });
    ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    // header
    const meta = ACTS[this.act] || { name: '', eyebrow: 'ACT' };
    ctx.save(); ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd24a'; ctx.font = '700 14px system-ui,sans-serif'; ctx.fillText(`CAMPAIGN · ${meta.eyebrow}`, 640, 96);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(640, 138, 200, '#ffd24a', 0.12); ctx.restore();
    ctx.fillStyle = '#fff7e0'; ctx.font = '800 42px system-ui,sans-serif'; ctx.shadowColor = 'rgba(255,210,74,.4)'; ctx.shadowBlur = 22;
    ctx.fillText(meta.name, 640, 140); ctx.shadowBlur = 0; ctx.textAlign = 'left'; ctx.restore();
    for (const b of this.buttons) b.draw();
    // blurb of hovered node
    const hov = this.buttons.find((b) => b.hover && b.enabled);
    const node = hov ? this.nodes.find((n) => Math.abs(n.x - (hov.x + hov.w / 2)) < 2) : null;
    if (node) {
      ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = rgba('#cfd6ff', 0.95); ctx.font = '500 15px system-ui,sans-serif';
      wrapText(node.m.blurb, 640, 478, 760, 22); ctx.textAlign = 'left'; ctx.restore();
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
