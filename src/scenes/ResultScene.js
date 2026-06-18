// ResultScene.js — win/lose summary with stars + score, in the art language.

import { ctx } from '../render/gfx.js';
import { rgba, glow, star, clamp } from '../render/primitives.js';
import { initScene, drawScene, setDawn, drawVignette } from '../render/scene.js';
import { reduce } from '../core/env.js';
import { makeButton, bindButtons } from '../ui/widgets.js';

export class ResultScene {
  constructor(viewport, nav, result, stats) {
    this.viewport = viewport; this.nav = nav; this.result = result; this.stats = stats || {};
    this.t = 0; this.buttons = [];
    this.won = result === 'won';
    this.survival = this.stats.mode === 'survival';
    this.newBest = !!this.stats.newBest;
    this.stars = this.stats.stars != null ? this.stats.stars : (this.won ? clamp(1 + Math.floor((this.stats.kills || 0) / 12), 1, 3) : 0);
  }

  enter() {
    this.viewport.setLogical(1280, 720);
    initScene({ W: 1280, H: 720, GROUND: 566, reduce });
    setDawn(this.survival ? 0.6 : (this.won ? 0.95 : 0.12));
    const cx = 640, w = 280, h = 58;
    const m = this.stats.mission;
    this.buttons = this.survival ? [
      makeButton({ x: cx - w - 10, y: 470, w, h, label: 'Play Again', primary: true, onClick: () => this.nav.survival() }),
      makeButton({ x: cx + 10, y: 470, w, h, label: 'Main Menu', onClick: () => this.nav.menu() }),
    ] : m ? [
      makeButton({ x: cx - w - 10, y: 470, w, h, label: this.won ? 'Continue' : 'Retry', primary: true, onClick: () => (this.won ? this.nav.campaign() : this.nav.mission(m)) }),
      makeButton({ x: cx + 10, y: 470, w, h, label: this.won ? 'Replay' : 'Campaign Map', onClick: () => (this.won ? this.nav.mission(m) : this.nav.campaign()) }),
    ] : [
      makeButton({ x: cx - w - 10, y: 470, w, h, label: 'Play Again', primary: true, onClick: () => (this.stats.mode === 'bossrush' ? this.nav.bossRush() : this.nav.battle({ mode: this.stats.mode || 'endless' })) }),
      makeButton({ x: cx + 10, y: 470, w, h, label: 'Main Menu', onClick: () => this.nav.menu() }),
    ];
    this._unbind = bindButtons(document.getElementById('c'), this.viewport, () => this.buttons);
  }

  exit() { if (this._unbind) this._unbind(); }
  update(dt) { this.t += dt; }

  render(dt) {
    this.viewport.begin();
    drawScene(dt);
    ctx.save(); ctx.fillStyle = 'rgba(4,5,12,0.45)'; ctx.fillRect(0, 0, 1280, 720); ctx.restore();
    ctx.save(); ctx.textAlign = 'center';
    if (this.survival) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(640, 200, 240, '#ffd24a', 0.18); ctx.restore();
      ctx.fillStyle = '#fff7e0'; ctx.font = '800 54px system-ui,sans-serif'; ctx.shadowColor = 'rgba(255,210,74,0.5)'; ctx.shadowBlur = 26;
      ctx.fillText('THE LIGHT HELD', 640, 200); ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffd24a'; ctx.font = '800 70px system-ui,sans-serif';
      ctx.fillText(`${this.stats.score || 0}`, 640, 300);
      ctx.fillStyle = rgba('#cfd6ff', 1); ctx.font = '600 16px system-ui,sans-serif';
      ctx.fillText('SCORE', 640, 326);
      ctx.fillStyle = rgba('#cfd6ff', 1); ctx.font = '600 18px system-ui,sans-serif';
      ctx.fillText(`Survived ${this.stats.timeSurvived || 0}s  ·  ${this.stats.kills || 0} defeated  ·  Best ${this.stats.best || 0}`, 640, 390);
      if (this.newBest) { ctx.fillStyle = '#b6ff5a'; ctx.font = '700 18px system-ui,sans-serif'; ctx.fillText('★ NEW BEST!', 640, 420); }
    } else {
      const title = this.won ? 'DAWN BREAKS' : 'THE LIGHT FADES';
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(640, 230, 240, this.won ? '#ffd24a' : '#6a5acd', 0.2); ctx.restore();
      ctx.fillStyle = this.won ? '#fff7e0' : '#cfd6ff'; ctx.font = '800 56px system-ui,sans-serif';
      ctx.shadowColor = this.won ? 'rgba(255,210,74,0.5)' : 'rgba(120,100,220,0.4)'; ctx.shadowBlur = 28;
      ctx.fillText(title, 640, 230); ctx.shadowBlur = 0;
      for (let i = 0; i < 3; i++) {
        const on = i < this.stars && this.t > 0.3 + i * 0.3;
        ctx.save();
        if (on) { ctx.globalCompositeOperation = 'lighter'; glow(540 + i * 100, 320, 40, '#ffd24a', 0.6); }
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = on ? '#ffd24a' : 'rgba(120,120,150,0.4)';
        star(540 + i * 100, 320, on ? 30 : 24, on ? 13 : 11, 5); ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = rgba('#cfd6ff', 1); ctx.font = '600 18px system-ui,sans-serif';
      ctx.fillText(`Enemies defeated: ${this.stats.kills || 0}    ·    Heroes deployed: ${this.stats.deployed || 0}`, 640, 400);
    }
    ctx.textAlign = 'left'; ctx.restore();
    for (const b of this.buttons) b.draw();
    drawVignette();
    this.viewport.end();
  }
}
