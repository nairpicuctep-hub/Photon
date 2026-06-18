// pissy.js — the WILDCARD (morale + mischief). PROVISIONAL: there is no feel
// slice for Pissy yet, so his look is built to the shared toolkit with a
// clearly-marked provisional palette and a data-driven kit. Recommend producing
// a Pissy feel slice for approval before final art lock (brief §5.6).

import { ctx } from '../render/gfx.js';
import { lerp, clamp, mix, rgba, glow, star, easeOutBack, easeOutCubic } from '../render/primitives.js';
import { limb, limbGrad, rimStroke, hand, boot, setFigureStyle } from '../render/figure.js';
import { makeChain, stepChain } from '../render/cloth.js';
import { emitPhotons } from '../render/particles.js';
import { HeroBase } from './HeroBase.js';

// --- PROVISIONAL palette (mischief imp: amethyst + lime spark) ---
const INK = '#1b0f24', RIM = '#f0e6ff';
const SUIT_HI = '#d79bff', SUIT_LO = '#7a36c0', SUIT_SH = '#43176e';
const SKIN_HI = '#ffe9d6', SKIN_LO = '#caa07a';
const SPARK = '#b6ff5a', EYE = '#eaffa6';

export class Pissy extends HeroBase {
  static PROVISIONAL = true;
  static MOVES = [
    { key: '1', label: 'Idle', state: 'idle' },
    { key: '2', label: 'Walk', state: 'walk' },
    { key: '3', label: 'Blink', method: 'blink' },
    { key: '4', label: 'Mischief', method: 'mischief' },
    { key: '5', label: 'Good Spirits', method: 'goodSpirits' },
  ];

  constructor(def = {}) {
    super({ id: 'pissy', name: 'Pissy', ...def });
    this.moraleOn = false;
    this.blinkT = 0;            // 0..1 vanish/return
    this.scarf = makeChain(5, 7, this.x, this.groundY - 150);
    this.lastPose = this.pose();
  }

  blink() { if (this.state !== 'blink') this.setState('blink'); }
  mischief() { if (this.state !== 'mischief') this.setState('mischief'); }
  goodSpirits() { this.moraleOn = !this.moraleOn; return this.moraleOn; }

  pose() {
    const tt = this.t, state = this.state, stateT = this.stateT;
    let hover = Math.sin(tt * 2.2) * 4 + 2;        // always a bit floaty/bouncy
    let lean = Math.sin(tt * 1.3) * 3, reach = 0, tuck = 0;
    if (state === 'walk') hover = Math.abs(Math.sin(tt * 9)) * 3 + 2;
    if (state === 'mischief') {
      const p = stateT / 0.6;
      reach = p < 0.5 ? easeOutBack(p / 0.5) : 1 - (p - 0.5) / 0.5;
      lean += Math.sin(p * 18) * 6;
    }
    if (state === 'blink') { const p = stateT / 0.5; tuck = Math.sin(p * Math.PI); }
    const hipY = -84 - tuck * 8, chestY = -120, headY = -150 + tuck * 6;
    const sw = state === 'walk' ? Math.sin(tt * 9) : Math.sin(tt * 2.2) * 0.4;
    const legL = { hip: { x: -6, y: hipY }, knee: { x: -8 + sw * 8, y: hipY * 0.5 }, foot: { x: -10 + sw * 12, y: -2 - Math.max(0, sw) * 7 } };
    const legR = { hip: { x: 6, y: hipY }, knee: { x: 8 - sw * 8, y: hipY * 0.5 }, foot: { x: 10 - sw * 12, y: -2 - Math.max(0, -sw) * 7 } };
    const shL = { x: -12 + lean * 0.4, y: chestY }, shR = { x: 12 + lean * 0.4, y: chestY };
    const elbowL = { x: -16, y: chestY + 16 }, handL = { x: -20, y: chestY + 30 };
    const elbowR = { x: 14 + reach * 16, y: chestY + 14 - reach * 8 };
    const handR = { x: 18 + reach * 34, y: chestY + 24 - reach * 18 };
    return { hipY, chestY, headY, hover, lean, shL, shR, elbowL, handL, elbowR, handR, legL, legR, reach, tuck };
  }

  draw() {
    const P = this.lastPose;
    setFigureStyle(INK, RIM);
    const vis = this.state === 'blink' ? Math.abs(Math.cos(Math.min(1, this.stateT / 0.5) * Math.PI)) : 1;
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.75 * vis;
    ctx.translate(this.x, this.groundY - P.hover);
    // shadow
    ctx.save(); ctx.globalAlpha = 0.28 * (0.4 + 0.6 * vis); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, 5 + P.hover * 0.3, 26, 7, 0, 0, 6.28); ctx.fill(); ctx.restore();
    // morale aura
    if (this.moraleOn) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(0, P.chestY, 120, SPARK, 0.16); ctx.restore(); }
    // scarf (verlet, behind)
    this.drawScarf(P);
    // back limbs
    limb(P.shL, P.elbowL, P.handL, 7, limbGrad(P.shL, P.handL, mix(SUIT_HI, SUIT_LO, 0.5), SUIT_SH));
    limb(P.legL.hip, P.legL.knee, P.legL.foot, 9, limbGrad(P.legL.hip, P.legL.foot, mix(SUIT_HI, SUIT_LO, 0.5), SUIT_SH));
    boot(P.legL.foot, true, SUIT_HI, SUIT_LO, SUIT_SH);
    hand(P.handL, 0.7, SKIN_HI, SKIN_LO);
    // torso
    const topY = P.chestY - 4, botY = P.hipY + 4, lean = P.lean * 0.4;
    ctx.beginPath(); ctx.moveTo(-12 + lean, topY); ctx.quadraticCurveTo(-15, (topY + botY) / 2, -9, botY);
    ctx.quadraticCurveTo(0, botY + 6, 9, botY); ctx.quadraticCurveTo(15, (topY + botY) / 2, 12 + lean, topY);
    ctx.quadraticCurveTo(0, topY - 6, -12 + lean, topY); ctx.closePath();
    const g = ctx.createLinearGradient(-12, topY, 12, botY); g.addColorStop(0, SUIT_HI); g.addColorStop(1, SUIT_LO);
    ctx.fillStyle = g; ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.fill(); ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(lean, (topY + botY) / 2, 8, SPARK, 0.7); ctx.restore();
    // front leg + arm
    limb(P.legR.hip, P.legR.knee, P.legR.foot, 10, limbGrad(P.legR.hip, P.legR.foot, SUIT_HI, SUIT_LO));
    boot(P.legR.foot, false, SUIT_HI, SUIT_LO, SUIT_SH);
    limb(P.shR, P.elbowR, P.handR, 8, limbGrad(P.shR, P.handR, SUIT_HI, SUIT_LO));
    hand(P.handR, 1, SKIN_HI, SKIN_LO);
    // mischief spark at hand
    if (this.state === 'mischief' && P.reach > 0.4) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(P.handR.x, P.handR.y, 16, SPARK, 0.9); ctx.fillStyle = SPARK; star(P.handR.x, P.handR.y, 6, 2.5, 5); ctx.fill(); ctx.restore(); }
    // head + grin + jester hint
    const hy = P.headY, hx0 = lean * 0.6;
    ctx.beginPath(); ctx.ellipse(hx0, hy, 13, 14, 0, 0, 6.28); ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.stroke();
    const hg = ctx.createRadialGradient(hx0 - 4, hy - 5, 2, hx0, hy, 16); hg.addColorStop(0, SKIN_HI); hg.addColorStop(1, SKIN_LO); ctx.fillStyle = hg; ctx.fill();
    // eyes (mischievous) + grin
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(hx0 + 5, hy - 1, 7, EYE, 0.7); ctx.restore();
    ctx.fillStyle = EYE; ctx.beginPath(); ctx.ellipse(hx0 + 5, hy - 1, 2.4, 3, 0, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.ellipse(hx0 - 5, hy - 1, 2, 2.6, 0, 0, 6.28); ctx.fill();
    ctx.strokeStyle = rgba(INK, 0.7); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(hx0 - 5, hy + 7); ctx.quadraticCurveTo(hx0 + 2, hy + 12, hx0 + 9, hy + 6); ctx.stroke();
    // two little horn-tufts
    ctx.fillStyle = mix(SUIT_HI, SUIT_LO, 0.3);
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(hx0 + s * 7, hy - 11); ctx.lineTo(hx0 + s * 11, hy - 20); ctx.lineTo(hx0 + s * 3, hy - 13); ctx.closePath(); ctx.fill(); }
    rimStroke(P.shR, P.elbowR, P.handR, 8);
    ctx.restore();
  }

  drawScarf(P) {
    const ax = this.x, ay = this.groundY - P.hover;
    const pts = this.scarf.pts.map((p) => ({ x: p.x - ax, y: p.y - ay }));
    ctx.save();
    ctx.strokeStyle = SPARK; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.globalAlpha = 0.85;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) { if (i === 0) ctx.moveTo(pts[i].x, pts[i].y); else ctx.lineTo(pts[i].x, pts[i].y); }
    ctx.stroke();
    ctx.restore();
  }

  update(dt) {
    super.update(dt);
    if (this.state === 'mischief') { if (this.stateT > 0.2 && Math.random() < 0.5) emitPhotons(1, this.x + (Math.random() - 0.5) * 50, this.groundY - 120, 80, 20); if (this.stateT >= 0.6) this.endAbility(); }
    if (this.state === 'blink') { if (this.stateT >= 0.5) this.endAbility(); }
    if (this.moraleOn && Math.random() < 0.3) emitPhotons(1, this.x + (Math.random() - 0.5) * 40, this.groundY - 110, 50, 25);
    const P = this.pose();
    const ax = this.x, ay = this.groundY - P.hover;
    stepChain(this.scarf, ax + 8, ay + P.chestY + 4, Math.sin(this.t * 3) * 0.6, 0.4, 2);
    this.lastPose = P;
  }
}
