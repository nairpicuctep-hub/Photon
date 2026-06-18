// BattleScene.js — hosts a Battle: switches the viewport to 1280x720, wires
// deploy input (tap a card or press 1-7), draws the field + HUD, and reports
// the result when the battle ends.

import { Battle, FIELD } from '../sim/Battle.js';
import { drawHud, hudLayout } from '../ui/hud.js';
import { DEPLOY_ORDER } from '../data/heroes.js';
import { makePointer, bindKeys } from '../core/input.js';

export class BattleScene {
  constructor(viewport, opts = {}) {
    this.viewport = viewport;
    this.opts = opts;
    this.battle = null;
    this._unbind = [];
    this.ended = false;
    this.resultDelay = 0;
  }

  enter() {
    this.viewport.setLogical(FIELD.W, FIELD.H);
    this.ended = false;
    this.battle = new Battle({ ...this.opts, onEnd: (res, stats) => this._onEnd(res, stats) });
    const keys = {};
    DEPLOY_ORDER.forEach((id, i) => { keys[String(i + 1)] = () => this.battle && this.battle.deploy(id); });
    this._unbind.push(bindKeys(keys));
    const canvas = document.getElementById('c');
    this._unbind.push(makePointer(canvas, this.viewport, { down: (p) => this._tap(p) }));
  }

  exit() { for (const u of this._unbind) if (u) u(); this._unbind = []; }

  _tap(p) {
    if (!this.battle) return;
    const { cards } = hudLayout();
    for (const c of cards) {
      if (p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h) { this.battle.deploy(c.id); return; }
    }
  }

  update(dt) {
    if (!this.battle) return;
    this.battle.update(dt);
    if (this.opts.auto) this._autoPlay(dt);
    if (this.ended && !this._reported) {
      this.resultDelay -= dt;
      if (this.resultDelay <= 0) { this._reported = true; if (this.opts.onResult) this.opts.onResult(this._result, this.battle.stats); }
    }
  }

  // Demo / attract-mode auto-deploy (also lets headless capture a real battle).
  // Rotates through the roster so heroes (not just cheap Troopers) reach the
  // field and can form combos.
  _autoPlay(dt) {
    this._autoT = (this._autoT || 0) - dt;
    if (this._autoT > 0 || this.battle.state !== 'playing') return;
    this._autoT = 1.2;
    const order = ['radu', 'manu', 'victor', 'floris', 'andreea', 'pissy'];
    this._autoI = this._autoI || 0;
    const id = order[this._autoI % order.length];
    if (this.battle.canDeploy(id)) { this.battle.deploy(id); this._autoI++; return; }
    // hero not yet affordable — save up, but spend overflow on a Trooper to hold the line
    if (this.battle.economy.energy > 92 && this.battle.canDeploy('trooper')) this.battle.deploy('trooper');
  }

  render(dt) {
    const b = this.battle;
    const sh = b.shake > 0 ? (Math.random() - 0.5) * b.shake : 0;
    this.viewport.begin(sh, sh * 0.5);
    b.render(dt);
    drawHud(b);
    b.banner.draw();
    this.viewport.end();
  }

  _onEnd(res, stats) {
    if (this.ended) return;
    this.ended = true;
    this._result = res;
    this.resultDelay = 1.6;
  }
}
