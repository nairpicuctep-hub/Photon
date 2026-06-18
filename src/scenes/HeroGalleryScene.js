// HeroGalleryScene.js — browse the whole roster: cycle heroes, read their role,
// try their moves, and head back to the menu. Replaces the old dead-end that
// reloaded into the Radu-only feel slice.

import { ctx } from '../render/gfx.js';
import { rgba, glow } from '../render/primitives.js';
import { initScene, drawScene, setDawn, drawVignette } from '../render/scene.js';
import * as particles from '../render/particles.js';
import { reduce } from '../core/env.js';
import { makeButton, bindButtons } from '../ui/widgets.js';
import { makeHero } from '../heroes/roster.js';
import { HERO_DEFS } from '../data/heroes.js';

const ORDER = ['radu', 'victor', 'manu', 'floris', 'andreea', 'pissy', 'trooper'];
const HERO_X = 640, HERO_GROUND = 560;

const BLURB = {
  radu: 'The heart of the team — a piercing light beam, a dashing Lightstep, and the aura that makes everyone stronger.',
  victor: 'The inventor. Deploys a Prism that bends Radu’s beam into the wall-shattering Light Lance.',
  manu: 'The gentle giant. A wall of bronze — Titan Smash breaks armor, the Aegis of Dawn shields his friends.',
  floris: 'The scholar. His Reveal peels the dark off cloaked foes (the only way to hurt Umbra), then rains Codex Barrage.',
  andreea: 'The strategist. Her Temporal Eddy slows enemy fire to a crawl, and Foresight reads what’s coming.',
  pissy: 'The wildcard (look still in progress). Blink, mischief, and Good Spirits that lift the whole team’s morale.',
  trooper: 'The backbone — cheap ranged light infantry you spam to hold the lane while the heroes do the heavy lifting.',
};

export class HeroGalleryScene {
  constructor(viewport, nav) {
    this.viewport = viewport; this.nav = nav; this.i = 0; this.t = 0; this.buttons = [];
  }

  enter() {
    this.viewport.setLogical(1280, 720);
    initScene({ W: 1280, H: 720, GROUND: 720, reduce });
    setDawn(0.55);
    particles.reset();
    this._load(0);
    this._unbind = bindButtons(document.getElementById('c'), this.viewport, () => this.buttons);
  }
  exit() { if (this._unbind) this._unbind(); particles.reset(); }

  _load(delta) {
    this.i = (this.i + delta + ORDER.length) % ORDER.length;
    const id = ORDER[this.i];
    this.hero = makeHero(id, HERO_X, HERO_GROUND);
    particles.reset();
    this._buildButtons();
  }

  _buildButtons() {
    const nav = this.nav;
    this.buttons = [
      makeButton({ x: 40, y: 36, w: 150, h: 46, label: '← Menu', fontSize: 16, onClick: () => nav.menu() }),
      makeButton({ x: 36, y: 320, w: 64, h: 72, label: '◄', primary: true, onClick: () => this._load(-1) }),
      makeButton({ x: 1180, y: 320, w: 64, h: 72, label: '►', primary: true, onClick: () => this._load(1) }),
    ];
    const moves = (this.hero.constructor.MOVES || []).filter((m) => m.state !== 'idle');
    const bw = 150, gap = 12, total = moves.length * bw + (moves.length - 1) * gap;
    let x = 640 - total / 2;
    for (const m of moves) {
      this.buttons.push(makeButton({
        x, y: 636, w: bw, h: 52, label: m.label, primary: !!m.method, fontSize: 15,
        onClick: () => { if (m.state) this.hero.setState(m.state); else if (typeof this.hero[m.method] === 'function') this.hero[m.method](); },
      }));
      x += bw + gap;
    }
  }

  update(dt) {
    this.t += dt;
    this.hero.update(dt);
    particles.update(dt);
  }

  render(dt) {
    const sh = this.hero.shakeRequest ? (Math.random() - 0.5) * this.hero.shakeRequest : 0;
    this.viewport.begin(sh, sh * 0.5);
    drawScene(dt);

    // hero
    particles.drawAfterimages();
    this.hero.draw();
    particles.drawParts();

    // text panel
    const def = HERO_DEFS[ORDER[this.i]] || {};
    ctx.save(); ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd24a'; ctx.font = '700 13px system-ui,sans-serif';
    ctx.fillText(`HERO ${this.i + 1} / ${ORDER.length}${this.hero.constructor.PROVISIONAL ? '  ·  PROVISIONAL' : ''}`, 640, 78);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(640, 120, 180, '#ffd24a', 0.12); ctx.restore();
    ctx.fillStyle = '#fff7e0'; ctx.font = '800 44px system-ui,sans-serif'; ctx.shadowColor = 'rgba(255,210,74,0.4)'; ctx.shadowBlur = 22;
    ctx.fillText(this.hero.name, 640, 128); ctx.shadowBlur = 0;
    ctx.fillStyle = rgba('#9aa0c8', 1); ctx.font = '600 15px system-ui,sans-serif';
    ctx.fillText(def.role || '', 640, 156);
    ctx.fillStyle = rgba('#cfd6ff', 0.95); ctx.font = '500 15px system-ui,sans-serif';
    wrap(BLURB[ORDER[this.i]] || '', 640, 188, 720, 22);
    ctx.textAlign = 'left'; ctx.restore();

    for (const b of this.buttons) b.draw();
    drawVignette();
    this.viewport.end();
  }
}

function wrap(text, cx, y, maxW, lh) {
  const words = text.split(' '); let line = '', yy = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW) { ctx.fillText(line, cx, yy); line = w; yy += lh; }
    else line = test;
  }
  if (line) ctx.fillText(line, cx, yy);
}
