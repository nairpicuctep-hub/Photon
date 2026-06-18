// HeroPreviewScene.js — renders ANY hero in isolation on the dawn battlefield,
// driven by the hero's static MOVES. Used to compare each port to its feel
// slice and to verify rendering. Generic counterpart to FeelSliceScene (which
// is Radu-specific with the blast pylon).

import { initScene, drawScene, setDawn, drawVignette } from '../render/scene.js';
import * as particles from '../render/particles.js';
import { reduce } from '../core/env.js';

const W = 960, H = 600, GROUND = 506, HERO_X = 372;

export class HeroPreviewScene {
  constructor(viewport, hero) {
    this.viewport = viewport;
    this.hero = hero;
    this.W = W; this.H = H;
    hero.x = HERO_X; hero.groundY = GROUND;
    initScene({ W, H, GROUND, reduce });
    setDawn(0.5);
    this.shake = 0;
  }

  act(move) {
    if (!move) return;
    if (move.state) this.hero.setState(move.state);
    else if (move.method && typeof this.hero[move.method] === 'function') return this.hero[move.method]();
  }

  setDawn(v) { setDawn(v); }

  update(dt) {
    this.hero.update(dt);
    // heroes expose shakeRequest (Manu/Victor); decay a local screen shake
    const req = this.hero.shakeRequest || 0;
    if (req > this.shake) this.shake = req;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 30);
    particles.update(dt);
  }

  render(dt) {
    const sh = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    this.viewport.begin(sh, sh * 0.5);
    drawScene(dt);
    particles.drawAfterimages();
    this.hero.draw();
    particles.drawParts();
    drawVignette();
    this.viewport.end();
  }
}
