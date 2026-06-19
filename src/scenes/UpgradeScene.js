// UpgradeScene.js — the "Light Codex": spend Light points (earned by clearing
// missions) to unlock friendship/protection/light upgrades of your choice.
// Their effects are applied at battle start by aggregateEffects(unlocked).

import { ctx } from '../render/gfx.js';
import { rgba, glow, clamp } from '../render/primitives.js';
import { initScene, drawScene, setDawn, drawVignette } from '../render/scene.js';
import { reduce } from '../core/env.js';
import { makeButton, bindButtons } from '../ui/widgets.js';
import { UPGRADES, BRANCHES } from '../data/upgrades.js';
import { getLightPoints, hasUpgrade, unlockUpgrade } from '../save/save.js';
import { sfx } from '../audio/audio.js';

const CW = 300, CH = 150, GX = 28, GY = 30, COLS = 3;
const X0 = (1280 - (COLS * CW + (COLS - 1) * GX)) / 2, Y0 = 224;

export class UpgradeScene {
  constructor(viewport, nav, back) {
    this.viewport = viewport; this.nav = nav; this.back = back || (() => nav.menu());
    this.t = 0; this.flash = 0;
    this.cards = UPGRADES.map((u, i) => ({ u, x: X0 + (i % COLS) * (CW + GX), y: Y0 + Math.floor(i / COLS) * (CH + GY), w: CW, h: CH }));
  }

  enter() {
    this.viewport.setLogical(1280, 720);
    initScene({ W: 1280, H: 720, GROUND: 566, reduce });
    setDawn(0.5);
    this.buttons = [makeButton({ x: 40, y: 648, w: 150, h: 44, label: '← Back', fontSize: 16, onClick: () => this.back() })];
    this._unbindBtn = bindButtons(document.getElementById('c'), this.viewport, () => this.buttons);
    const canvas = document.getElementById('c');
    this._pd = (ev) => {
      const t = ev.touches && ev.touches[0] ? ev.touches[0] : ev;
      const p = this.viewport.toLogical(t.clientX, t.clientY);
      for (const c of this.cards) {
        if (p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h) {
          if (!hasUpgrade(c.u.id) && getLightPoints() >= c.u.cost) { if (unlockUpgrade(c.u.id, c.u.cost)) { this.flash = 1; sfx('deploy'); } }
          return;
        }
      }
    };
    canvas.addEventListener('pointerdown', this._pd);
  }
  exit() { if (this._unbindBtn) this._unbindBtn(); if (this._pd) document.getElementById('c').removeEventListener('pointerdown', this._pd); }
  update(dt) { this.t += dt; if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2); }

  render(dt) {
    this.viewport.begin();
    drawScene(dt);
    ctx.save(); ctx.fillStyle = 'rgba(4,5,12,0.4)'; ctx.fillRect(0, 0, 1280, 720); ctx.restore();
    // header
    ctx.save(); ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd24a'; ctx.font = '700 14px system-ui,sans-serif'; ctx.fillText('FRIENDSHIP META', 640, 86);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(640, 128, 180, '#ffd24a', 0.12); ctx.restore();
    ctx.fillStyle = '#fff7e0'; ctx.font = '800 42px system-ui,sans-serif'; ctx.shadowColor = 'rgba(255,210,74,.4)'; ctx.shadowBlur = 22;
    ctx.fillText('Light Codex', 640, 134); ctx.shadowBlur = 0;
    const pts = getLightPoints();
    ctx.fillStyle = '#ffd24a'; ctx.font = '800 22px system-ui,sans-serif'; ctx.fillText(`✦ ${pts} Light`, 640, 178);
    ctx.fillStyle = rgba('#9aa0c8', 1); ctx.font = '500 13px system-ui,sans-serif'; ctx.fillText('Earn Light by clearing campaign missions, then unlock what your team needs.', 640, 200);
    ctx.textAlign = 'left'; ctx.restore();

    for (const c of this.cards) this._drawCard(c, pts);
    for (const b of this.buttons) b.draw();
    drawVignette();
    this.viewport.end();
  }

  _drawCard(c, pts) {
    const u = c.u, br = BRANCHES[u.branch] || { name: '', color: '#ffd24a' };
    const owned = hasUpgrade(u.id), afford = !owned && pts >= u.cost;
    ctx.save();
    ctx.globalAlpha = owned ? 1 : (afford ? 1 : 0.6);
    ctx.fillStyle = 'rgba(16,18,32,0.82)';
    ctx.strokeStyle = owned ? rgba(br.color, 0.9) : afford ? rgba(br.color, 0.6) : rgba('#9aa0c8', 0.3);
    ctx.lineWidth = owned ? 2.5 : 1.5;
    ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 12); ctx.fill(); ctx.stroke();
    // branch chip
    ctx.fillStyle = br.color; ctx.beginPath(); ctx.arc(c.x + 18, c.y + 18, 6, 0, 6.28); ctx.fill();
    ctx.fillStyle = rgba(br.color, 0.9); ctx.font = '700 11px system-ui,sans-serif'; ctx.fillText(br.name.toUpperCase(), c.x + 32, c.y + 22);
    // name + desc
    ctx.fillStyle = '#fff7e0'; ctx.font = '800 19px system-ui,sans-serif'; ctx.fillText(u.name, c.x + 16, c.y + 52);
    ctx.fillStyle = rgba('#cfd6ff', 0.95); ctx.font = '500 14px system-ui,sans-serif';
    wrap(u.desc, c.x + 16, c.y + 78, c.w - 32, 20);
    // status pill
    const py = c.y + c.h - 30;
    if (owned) { ctx.fillStyle = rgba(br.color, 0.18); ctx.beginPath(); ctx.roundRect(c.x + 16, py, 110, 24, 8); ctx.fill(); ctx.fillStyle = br.color; ctx.font = '700 13px system-ui,sans-serif'; ctx.fillText('✦ Owned', c.x + 30, py + 16); }
    else {
      if (afford) { const g = ctx.createLinearGradient(c.x + 16, 0, c.x + 150, 0); g.addColorStop(0, '#ffd24a'); g.addColorStop(1, '#ff9d54'); ctx.fillStyle = g; }
      else ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.roundRect(c.x + 16, py, 140, 24, 8); ctx.fill();
      ctx.fillStyle = afford ? '#1a1000' : rgba('#ff9a9a', 1); ctx.font = '700 13px system-ui,sans-serif';
      ctx.fillText(afford ? `Unlock — ✦ ${u.cost}` : `Need ✦ ${u.cost}`, c.x + 28, py + 16);
    }
    ctx.restore();
  }
}

function wrap(text, x, y, maxW, lh) {
  const words = text.split(' '); let line = '', yy = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW) { ctx.fillText(line, x, yy); line = w; yy += lh; }
    else line = test;
  }
  if (line) ctx.fillText(line, x, yy);
}
