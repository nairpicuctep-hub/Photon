// TopScoresScene.js — local Survival leaderboard (name + score), highlighting
// the current player's entries.

import { ctx } from '../render/gfx.js';
import { rgba, glow } from '../render/primitives.js';
import { initScene, drawScene, setDawn, drawVignette } from '../render/scene.js';
import { reduce } from '../core/env.js';
import { makeButton, bindButtons } from '../ui/widgets.js';
import { topScores, getName } from '../save/save.js';

export class TopScoresScene {
  constructor(viewport, nav, back) {
    this.viewport = viewport; this.nav = nav; this.back = back || (() => nav.modes());
    this.t = 0; this.buttons = [];
  }
  enter() {
    this.viewport.setLogical(1280, 720);
    initScene({ W: 1280, H: 720, GROUND: 566, reduce });
    setDawn(0.5);
    this.scores = topScores(10);
    this.buttons = [makeButton({ x: 40, y: 640, w: 160, h: 46, label: '← Back', fontSize: 16, onClick: () => this.back() })];
    this._unbind = bindButtons(document.getElementById('c'), this.viewport, () => this.buttons);
  }
  exit() { if (this._unbind) this._unbind(); }
  update(dt) { this.t += dt; }

  render(dt) {
    this.viewport.begin();
    drawScene(dt);
    ctx.save(); ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd24a'; ctx.font = '700 14px system-ui,sans-serif'; ctx.fillText('SURVIVAL', 640, 92);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(640, 138, 180, '#ffd24a', 0.12); ctx.restore();
    ctx.fillStyle = '#fff7e0'; ctx.font = '800 44px system-ui,sans-serif'; ctx.shadowColor = 'rgba(255,210,74,.4)'; ctx.shadowBlur = 22;
    ctx.fillText('Top Scores', 640, 144); ctx.shadowBlur = 0; ctx.restore();

    const me = getName();
    if (!this.scores.length) {
      ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = rgba('#9aa0c8', 1); ctx.font = '600 18px system-ui,sans-serif';
      ctx.fillText('No runs yet — play Survival to set a score!', 640, 360); ctx.textAlign = 'left'; ctx.restore();
    } else {
      const w = 480, y0 = 205, rh = 40;
      for (let i = 0; i < this.scores.length; i++) {
        const s = this.scores[i], y = y0 + i * rh, mine = s.name === me;
        ctx.save();
        ctx.fillStyle = mine ? 'rgba(255,210,74,0.16)' : 'rgba(16,18,32,0.5)';
        ctx.beginPath(); ctx.roundRect(640 - w / 2, y - 16, w, 34, 8); ctx.fill();
        ctx.textBaseline = 'middle';
        ctx.fillStyle = i === 0 ? '#ffd24a' : i === 1 ? '#cfd6ff' : i === 2 ? '#ff9d54' : rgba('#9aa0c8', 1);
        ctx.font = '800 16px system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.fillText(`${i + 1}`, 640 - w / 2 + 16, y + 1);
        ctx.fillStyle = mine ? '#fff7e0' : '#eef1ff'; ctx.font = '700 16px system-ui,sans-serif';
        ctx.fillText(s.name + (mine ? '  (you)' : ''), 640 - w / 2 + 46, y + 1);
        ctx.fillStyle = rgba('#9aa0c8', 1); ctx.font = '600 12px system-ui,sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(`${s.time}s · ${s.diff}`, 640 + w / 2 - 92, y + 1);
        ctx.fillStyle = '#ffd24a'; ctx.font = '800 18px system-ui,sans-serif';
        ctx.fillText(String(s.score), 640 + w / 2 - 16, y + 1);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.restore();
      }
    }
    for (const b of this.buttons) b.draw();
    drawVignette();
    this.viewport.end();
  }
}
