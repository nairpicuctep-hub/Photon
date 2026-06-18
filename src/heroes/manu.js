// manu.js — Manu Titanul (TANK / GUARDIAN). PORTED from manu-titanul-feelslice.html.
// Authoritative for: Manu's look, palette, states (idle / walk + Titan Smash /
// Aegis of Dawn) and FX. A sturdy KID in heavy bronze armor — the armor gives
// the mass while the face stays youthful. The heavy, braced animation, the
// expanding ground shockwave that shatters a dark barrier, and the golden Aegis
// dome that breaks dark projectiles are all reproduced here on the shared
// render toolkit.
//
// Self-containment: the slice demonstrated the powers against external demo
// props (a purple barrier at BAR_X, a dark emitter at ENE_X). Those are ported
// as hero-anchored props (offset from this.x) so Manu renders the full power
// fantasy without any external object — see deviations in the porting notes.

import { ctx } from '../render/gfx.js';
import {
  lerp, clamp, easeOutCubic, easeInCubic, easeInOutCubic, easeOutBack,
  mix, rgba, glow, star,
} from '../render/primitives.js';
import { limb, limbGrad, rimStroke, setFigureStyle } from '../render/figure.js';
import { makeChain, stepChain } from '../render/cloth.js';
import { reduce } from '../core/env.js';
import { HeroBase } from './HeroBase.js';

// ---- local palette (Manu: bronze guardian) — his OWN ink/rim, not Radu's ----
const INK = '#16110a', RIM = '#fff0e0', SKIN_HI = '#ffe6c4', SKIN_LO = '#cf9356';
const mHI = '#ffb15a', mMID = '#e07a2a', mLO = '#c05518', mSH = '#7a3a12',
  PLATE = '#ffd9a8', PLATE_SH = '#b06a2a', CREST = '#ffd24a', mEYE = '#ffd27a',
  CAPE = '#7e2f0c', CAPE_HI = '#a94518';

// Hero-anchored demo-prop offsets (slice: MANU_X=336, BAR_X=566, ENE_X=864,
// ENE_Y=GROUND-150, BAR_TOP=GROUND-132). Kept relative to this.x / this.groundY.
const BAR_DX = 566 - 336;       // 230 — dark barrier shattered by the shockwave
const ENE_DX = 864 - 336;       // 528 — dark emitter that fires the volley
const ENE_DY = -150;            // ENE_Y = GROUND - 150
const BAR_TOP_DY = -132;        // BAR_TOP = GROUND - 132

export class Manu extends HeroBase {
  constructor(def = {}) {
    super({ id: 'manu', name: 'Manu Titanul', ...def });

    this.bodyX = 0;

    // FX state (mirrors the slice's module globals)
    this.shakeRequest = 0;       // slice `shake` — scene reads + we decay (no global shake)
    this.flash = 0;              // slice `flash` — decayed; exposed, not fullscreen-painted
    this.parts = [];             // slice `parts[]` (own dust/debris system, see deviations)
    this.shock = null;           // expanding ground shockwave
    this.barrier = { alive: true, crack: 0 };
    this.dome = { state: 'off', t: 0, hold: 0 };
    this.volley = [];
    this.glowSplash = null;
    this.smashHit = 0;           // slice `M._hit`
    this.walkFoot = 1;           // slice `walkFoot`
    this.psway = 0;              // slice `M._psway`

    // secondary-motion chains (verlet), seeded in world space near the figure
    // (slice: cape = chain(6,12,MANU_X-12,GROUND-150); tabard = chain(4,12,MANU_X,GROUND-110))
    this.cape = makeChain(6, 12, this.x - 12, this.groundY - 150);
    this.tabard = makeChain(4, 12, this.x, this.groundY - 110);

    this.lastPose = this.pose();
  }

  // ----- abilities (triggered by input) -------------------------------------
  titanSmash() { if (this.state !== 'smash') this.setState('smash'); this.smashHit = 0; }
  aegisOfDawn() {
    if (this.state !== 'aegis') this.setState('aegis');
    this.dome = { state: 'up', t: 0, hold: 0 };
    this.volley = [];
    this.spawnVolley();
  }

  // ----- pose: heavy, broad. origin at feet; +x right (local space) ---------
  pose() {
    const tt = this.t; const breath = Math.sin(tt * 1.2) * 1.6;
    let hover = 0, sway = 0, crouch = 0, armUp = 0, slam = 0, brace = 0, leanB = 0;
    if (this.state === 'walk') { sway = Math.sin(tt * 4.4) * 4; }
    if (this.state === 'smash') {
      const p = this.stateT / 1.1;
      if (p < 0.40) { const e = easeInOutCubic(p / 0.40); armUp = e; leanB = e; }
      else if (p < 0.50) { const e = easeInCubic((p - 0.40) / 0.10); armUp = 1 - e; slam = e; crouch = e * 10; }
      else { const e = easeOutCubic((p - 0.50) / 0.50); slam = 1 - e * 0.6; crouch = lerp(10, 0, e); }
    }
    if (this.state === 'aegis') { const p = this.stateT / 0.6; brace = Math.sin(clamp(p, 0, 1) * Math.PI) * 0.6 + (p < 0.5 ? easeOutCubic(p / 0.5) : 1) * 0.4; }
    const hipY = -112 + breath * 0.3, chestY = -176 + breath * 0.5, headY = -224, up = leanB * -6;
    const legL = { hip: { x: -13, y: hipY }, knee: { x: -20, y: hipY * 0.5 - crouch * 0.5 }, foot: { x: -26, y: -2 } };
    const legR = { hip: { x: 13, y: hipY }, knee: { x: 20, y: hipY * 0.5 - crouch * 0.5 }, foot: { x: 26, y: -2 } };
    if (this.state === 'walk') { const ls = Math.sin(tt * 4.4); legL.foot.x = -26 + ls * 10; legR.foot.x = 26 - ls * 10; legL.foot.y = -2 - Math.max(0, ls) * 7; legR.foot.y = -2 - Math.max(0, -ls) * 7; }
    const shL = { x: -34 + up * 0.4, y: chestY - 2 }, shR = { x: 34 + up * 0.4, y: chestY - 2 };
    let elbowL, handL, elbowR, handR;
    if (this.state === 'smash') {
      const yU = lerp(chestY + 30, headY - 46, armUp), yD = lerp(headY - 46, 24, slam);
      const y = armUp > slam ? yU : yD; const fx = lerp(0, 8, slam);
      elbowL = { x: -26 + up, y: lerp(chestY + 10, headY - 30, Math.max(armUp, 1 - slam * 0)) * 0.5 + y * 0.5 }; // approx
      elbowL = { x: -22 + up - slam * 2, y: (chestY + y) / 2 - 10 };
      handL = { x: -14 + up + fx, y: y };
      elbowR = { x: 22 + up + slam * 2, y: (chestY + y) / 2 - 10 };
      handR = { x: 14 + up + fx, y: y };
    } else if (this.state === 'aegis') {
      const b = brace; elbowL = { x: -30 + up, y: chestY + 14 }; handL = { x: -34 + up, y: chestY + 30 };
      elbowR = { x: 20 + up, y: lerp(chestY + 18, chestY - 18, b) }; handR = { x: lerp(26, 30, b) + up, y: lerp(chestY + 30, chestY - 34, b) };
    } else {
      const aw = this.state === 'walk' ? Math.sin(tt * 4.4 + Math.PI) * 5 : 0;
      elbowL = { x: -30 + up, y: chestY + 18 }; handL = { x: -30 + up + aw, y: chestY + 44 };
      elbowR = { x: 30 + up, y: chestY + 18 }; handR = { x: 30 + up - aw, y: chestY + 44 };
    }
    return { hipY, chestY, headY, up, hover, sway, crouch, shL, shR, elbowL, handL, elbowR, handR, legL, legR, armUp, slam, brace };
  }

  // ----- hero-specific armor caps (NOT the shared hand/boot) -----------------
  fist(p, b) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(p.x, p.y, 14 * b, '#ffcaa0', 0.4 * b); ctx.restore();
    ctx.fillStyle = mix(PLATE, PLATE_SH, 0.25); ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, 6.28); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = rgba(INK, 0.5); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(p.x - 7, p.y - 2); ctx.lineTo(p.x + 7, p.y - 2); ctx.stroke();
  }
  greave(p, back) {
    ctx.fillStyle = back ? mix(mLO, mSH, 0.4) : mix(mMID, mHI, 0.2); ctx.strokeStyle = INK; ctx.lineWidth = 2.8;
    ctx.beginPath(); ctx.moveTo(p.x - 11, p.y - 10); ctx.lineTo(p.x + 15, p.y - 7); ctx.quadraticCurveTo(p.x + 20, p.y + 4, p.x + 12, p.y + 5); ctx.lineTo(p.x - 11, p.y + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  // ----- draw: full figure --------------------------------------------------
  draw() {
    setFigureStyle(INK, RIM);

    // hero-anchored demo props + world-space FX (behind the figure)
    this.drawEmitter();
    this.drawBarrier();
    this.drawShock();

    const P = this.lastPose;
    ctx.save();
    ctx.translate(this.x + this.bodyX + P.sway, this.groundY - P.hover);

    ctx.save(); ctx.globalAlpha = 0.36; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, 6, 58, 14, 0, 0, 6.28); ctx.fill(); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(0, P.chestY + 10, 150, '#ff9d54', 0.16); ctx.restore();
    this.drawCape(P);
    // back arm + back leg
    limb(P.shL, P.elbowL, P.handL, 19, limbGrad(P.shL, P.handL, mix(mHI, mLO, 0.45), mSH)); this.fist(P.handL, 0.7);
    limb(P.legL.hip, P.legL.knee, P.legL.foot, 22, limbGrad(P.legL.hip, P.legL.foot, mix(mHI, mLO, 0.5), mSH)); this.greave(P.legL.foot, true);
    this.drawTorso(P);
    limb(P.legR.hip, P.legR.knee, P.legR.foot, 23, limbGrad(P.legR.hip, P.legR.foot, mHI, mLO)); this.greave(P.legR.foot, false);
    limb(P.shR, P.elbowR, P.handR, 20, limbGrad(P.shR, P.handR, mHI, mLO)); this.fist(P.handR, 1);
    this.drawTabard(P);
    this.drawPauldrons(P);
    this.drawHead(P);
    rimStroke(P.shR, P.elbowR, P.handR, 20); rimStroke(P.legR.hip, P.legR.knee, P.legR.foot, 23);
    ctx.restore();

    // dome + volley + splash render in front of the figure (world space)
    this.drawDome();
    this.drawVolley();
    this.drawParts();
  }

  drawCape(P) {
    const ax = this.x + this.bodyX + P.sway, ay = this.groundY - P.hover; const pts = this.cape.pts.map(q => ({ x: q.x - ax, y: q.y - ay }));
    ctx.save(); ctx.beginPath(); ctx.moveTo(-24, P.chestY + 6);
    for (let i = 0; i < pts.length; i++) ctx.lineTo(pts[i].x - 10 * (1 - i / pts.length), pts[i].y);
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].x + 10 * (1 - i / pts.length), pts[i].y);
    ctx.lineTo(24, P.chestY + 6); ctx.closePath();
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke();
    const g = ctx.createLinearGradient(0, P.chestY, 0, pts[pts.length - 1].y); g.addColorStop(0, CAPE_HI); g.addColorStop(1, CAPE); ctx.fillStyle = g; ctx.fill(); ctx.restore();
  }

  drawTorso(P) {
    const topY = P.chestY - 6, botY = P.hipY + 10, lean = P.up; ctx.save();
    // broad trapezoid chestplate
    ctx.beginPath();
    ctx.moveTo(-30 + lean, topY + 4); ctx.quadraticCurveTo(-34 + lean, topY - 2, -26 + lean, topY - 4);
    ctx.lineTo(26 + lean, topY - 4); ctx.quadraticCurveTo(34 + lean, topY - 2, 30 + lean, topY + 4);
    ctx.lineTo(18, botY); ctx.quadraticCurveTo(0, botY + 8, -18, botY); ctx.closePath();
    ctx.strokeStyle = INK; ctx.lineWidth = 3.6; ctx.lineJoin = 'round'; ctx.stroke();
    const g = ctx.createLinearGradient(-30 + lean, topY, 26, botY); g.addColorStop(0, mHI); g.addColorStop(0.55, mMID); g.addColorStop(1, mLO); ctx.fillStyle = g; ctx.fill();
    // plate seams
    ctx.strokeStyle = rgba(INK, 0.45); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-24, topY + 22); ctx.quadraticCurveTo(0, topY + 30, 24, topY + 22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-18, topY + 44); ctx.quadraticCurveTo(0, topY + 52, 18, topY + 44); ctx.stroke();
    // abdomen plates
    ctx.fillStyle = mix(mLO, mSH, 0.3); ctx.beginPath(); ctx.roundRect(-15, botY - 22, 30, 22, 5); ctx.fill(); ctx.strokeStyle = rgba(INK, 0.4); ctx.stroke();
    // dawn-crest emblem (glowing sun)
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(lean * 0.3, topY + 30, 20, CREST, 0.85); ctx.restore();
    ctx.fillStyle = CREST; star(lean * 0.3, topY + 30, 11, 5, 8); ctx.fill();
    ctx.strokeStyle = rgba('#fff7d6', 0.9); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(lean * 0.3, topY + 30, 5, 0, 6.28); ctx.stroke();
    // plate highlight
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba(PLATE, 0.25); ctx.beginPath(); ctx.moveTo(-26 + lean, topY - 2); ctx.lineTo(-6 + lean, topY + 2); ctx.lineTo(-12, botY - 20); ctx.lineTo(-22, botY - 22); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.restore();
  }

  drawPauldrons(P) {
    for (const s of [{ x: P.shL.x, y: P.shL.y, b: true }, { x: P.shR.x, y: P.shR.y, b: false }]) {
      ctx.save(); ctx.translate(s.x, s.y - 2);
      const g = ctx.createRadialGradient(-4, -6, 2, 0, 0, 24); g.addColorStop(0, s.b ? mMID : PLATE); g.addColorStop(1, s.b ? mSH : mLO);
      ctx.fillStyle = g; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(-15, 8); ctx.quadraticCurveTo(-18, -16, 2, -18); ctx.quadraticCurveTo(20, -18, 18, 6); ctx.quadraticCurveTo(2, 12, -15, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      // ridge
      ctx.strokeStyle = rgba(INK, 0.4); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-8, -6); ctx.quadraticCurveTo(2, -12, 12, -4); ctx.stroke();
      if (!s.b) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(2, -8, 12, CREST, 0.4); ctx.restore(); }
      ctx.restore();
    }
  }

  drawTabard(P) {
    const ax = this.x + this.bodyX + P.sway, ay = this.groundY - P.hover; const pts = this.tabard.pts.map(q => ({ x: q.x - ax, y: q.y - ay }));
    ctx.save(); ctx.beginPath(); ctx.moveTo(-12, P.hipY + 2);
    for (let i = 0; i < pts.length; i++) ctx.lineTo(pts[i].x - 7 * (1 - i / pts.length), pts[i].y);
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].x + 7 * (1 - i / pts.length), pts[i].y);
    ctx.lineTo(12, P.hipY + 2); ctx.closePath();
    ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.stroke();
    const g = ctx.createLinearGradient(0, P.hipY, 0, pts[pts.length - 1].y); g.addColorStop(0, '#caa24a'); g.addColorStop(1, '#8a5a14'); ctx.fillStyle = g; ctx.fill();
    // crest stripe
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(CREST, 0.5); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, P.hipY + 4); ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y - 2); ctx.stroke(); ctx.restore();
    ctx.restore();
  }

  drawHead(P) {
    const h0 = P.up * 0.8, hy = P.headY; ctx.save();
    // thick neck
    ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(h0 * 0.5, P.chestY - 6); ctx.lineTo(h0, hy + 16); ctx.stroke();
    ctx.strokeStyle = mix(SKIN_HI, SKIN_LO, 0.4); ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(h0 * 0.5, P.chestY - 6); ctx.lineTo(h0, hy + 16); ctx.stroke();
    // head (youthful, sturdy)
    ctx.beginPath(); ctx.ellipse(h0, hy, 20, 21, 0, 0, 6.28); ctx.strokeStyle = INK; ctx.lineWidth = 3.2; ctx.stroke();
    const g = ctx.createRadialGradient(h0 - 6, hy - 8, 3, h0, hy, 26); g.addColorStop(0, SKIN_HI); g.addColorStop(1, SKIN_LO); ctx.fillStyle = g; ctx.fill();
    ctx.fillStyle = mix(SKIN_HI, SKIN_LO, 0.5); ctx.beginPath(); ctx.ellipse(h0 - 17, hy + 3, 4, 6, 0, 0, 6.28); ctx.fill();
    // kind eyes, brows, soft smile
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(h0 + 5, hy, 8, mEYE, 0.45); ctx.restore();
    ctx.fillStyle = mix(mEYE, '#a86a2a', 0.2); ctx.beginPath(); ctx.ellipse(h0 + 6, hy, 2.9, 3.6, 0, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.ellipse(h0 - 5, hy, 2.4, 3.2, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(h0 + 7, hy - 1, 1, 0, 6.28); ctx.fill();
    ctx.strokeStyle = rgba(INK, 0.7); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(h0 + 1, hy - 6); ctx.quadraticCurveTo(h0 + 6, hy - 8, h0 + 11, hy - 5); ctx.stroke();
    ctx.lineWidth = 1.6; ctx.strokeStyle = rgba(INK, 0.55); ctx.beginPath(); ctx.moveTo(h0 + 11, hy + 2); ctx.lineTo(h0 + 9, hy + 7); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(h0 + 1, hy + 12); ctx.quadraticCurveTo(h0 + 8, hy + 15, h0 + 13, hy + 11); ctx.stroke();
    // helm crest band + dawn crest
    ctx.fillStyle = mix(PLATE, PLATE_SH, 0.2); ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(h0 - 20, hy - 9); ctx.quadraticCurveTo(h0, hy - 19, h0 + 20, hy - 8); ctx.lineTo(h0 + 18, hy - 13); ctx.quadraticCurveTo(h0, hy - 24, h0 - 18, hy - 13); ctx.closePath(); ctx.fill(); ctx.stroke();
    // crest fin
    ctx.fillStyle = CREST; ctx.beginPath(); ctx.moveTo(h0 - 2, hy - 17); ctx.lineTo(h0 + 2, hy - 17); ctx.lineTo(h0 + 1, hy - 30); ctx.lineTo(h0 - 1, hy - 30); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(h0, hy - 22, 8, CREST, 0.7); ctx.restore();
    // rim
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(RIM, 0.45); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.ellipse(h0 + 2, hy - 1, 20, 21, 0, -2.5, -0.2); ctx.stroke(); ctx.restore();
    ctx.restore();
  }

  // ---- barrier (Smash target) — hero-anchored at this.x + BAR_DX ----
  drawBarrier() {
    const x = this.x + BAR_DX, GROUND = this.groundY, BAR_TOP = this.groundY + BAR_TOP_DY; ctx.save();
    if (this.barrier.alive) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(x, (GROUND + BAR_TOP) / 2, 40, '#7a1fd6', 0.10); ctx.restore();
      const g = ctx.createLinearGradient(x - 22, 0, x + 22, 0); g.addColorStop(0, '#241340'); g.addColorStop(0.5, '#3a1d6e'); g.addColorStop(1, '#180c2c');
      ctx.fillStyle = g; ctx.strokeStyle = 'rgba(150,90,230,0.4)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(x - 22, BAR_TOP, 44, GROUND - BAR_TOP, 6); ctx.fill(); ctx.stroke();
      // plate detail
      ctx.strokeStyle = 'rgba(150,90,230,0.3)'; ctx.lineWidth = 2; for (let yy = BAR_TOP + 24; yy < GROUND - 10; yy += 28) { ctx.beginPath(); ctx.moveTo(x - 18, yy); ctx.lineTo(x + 18, yy); ctx.stroke(); }
      if (this.barrier.crack > 0) { ctx.strokeStyle = rgba('#fff', this.barrier.crack * 0.9); ctx.lineWidth = 2; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x, BAR_TOP + 10); ctx.lineTo(x + (Math.random() - 0.5) * 30, GROUND - 10); ctx.stroke(); } }
    } else {
      // rubble
      ctx.fillStyle = '#241340'; ctx.strokeStyle = 'rgba(150,90,230,0.3)'; ctx.lineWidth = 2;
      for (const r of [[-18, 10, 16], [2, 8, 20], [18, 12, 14]]) { ctx.beginPath(); ctx.moveTo(x + r[0] - r[2] / 2, GROUND); ctx.lineTo(x + r[0], GROUND - r[1]); ctx.lineTo(x + r[0] + r[2] / 2, GROUND); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    }
    ctx.restore();
  }

  drawShock() {
    if (!this.shock) return; const shock = this.shock; const GROUND = this.groundY;
    const k = easeOutCubic(shock.t / shock.dur), r = shock.max * k, a = 1 - k;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // ground shock arc
    ctx.strokeStyle = rgba('#ffd9a8', a * 0.8); ctx.lineWidth = 6 * (1 - k) + 1; ctx.beginPath(); ctx.ellipse(shock.x, GROUND, r, r * 0.36, 0, Math.PI, 2 * Math.PI); ctx.stroke();
    ctx.strokeStyle = rgba('#fff7d6', a * 0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(shock.x, GROUND, r * 0.7, r * 0.26, 0, Math.PI, 2 * Math.PI); ctx.stroke();
    glow(shock.x, GROUND - 6, 40 * a, '#ffd9a8', a * 0.4);
    ctx.restore();
  }

  // ---- Aegis dome ----
  domeRadius() { return 150; }
  drawDome() {
    if (this.dome.state === 'off') return; let s;
    if (this.dome.state === 'up') s = easeOutBack(clamp(this.dome.t / 0.45, 0, 1));
    else if (this.dome.state === 'down') s = lerp(1, 0, easeInOutCubic(clamp(this.dome.t / 0.5, 0, 1)));
    else s = 1;
    const cx = this.x + this.bodyX, cy = this.groundY, R = this.domeRadius() * s;
    ctx.save();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // dome fill
    const g = ctx.createRadialGradient(cx, cy - R * 0.3, R * 0.2, cx, cy, R); g.addColorStop(0, rgba('#fff7d6', 0.06)); g.addColorStop(0.7, rgba('#ffd24a', 0.10)); g.addColorStop(1, rgba('#ff9d54', 0.22));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, 2 * Math.PI); ctx.closePath(); ctx.fill();
    // rim
    ctx.strokeStyle = rgba('#fff3c4', 0.8); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, 2 * Math.PI); ctx.stroke();
    ctx.strokeStyle = rgba('#ffd24a', 0.5); ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, 2 * Math.PI); ctx.stroke();
    // hex shimmer lines
    ctx.strokeStyle = rgba('#fff7d6', 0.12); ctx.lineWidth = 1;
    for (let a = Math.PI; a < 2 * Math.PI; a += 0.5) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke(); }
    for (let rr = R * 0.4; rr < R; rr += R * 0.3) { ctx.beginPath(); ctx.arc(cx, cy, rr, Math.PI, 2 * Math.PI); ctx.stroke(); }
    ctx.restore(); ctx.restore();
  }

  // ---- dark emitter + volley (hero-anchored demonstration of the dome) ----
  drawEmitter() {
    const x = this.x + ENE_DX, y = this.groundY + ENE_DY, GROUND = this.groundY; ctx.save();
    ctx.globalAlpha = 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, GROUND + 4, 26, 8, 0, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#241340'; ctx.strokeStyle = 'rgba(150,90,230,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 22, GROUND); ctx.lineTo(x - 12, y - 8); ctx.lineTo(x + 14, y - 8); ctx.lineTo(x + 22, GROUND); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(x - 16, y, 12, '#b47bff', 0.7); ctx.restore(); ctx.fillStyle = '#1a0f2e'; ctx.fillRect(x - 26, y - 4, 16, 12); ctx.restore();
  }
  spawnVolley() {
    const ENE_X = this.x + ENE_DX, ENE_Y = this.groundY + ENE_DY, MANU_X = this.x;
    for (let i = 0; i < 6; i++) { const ty = this.groundY - 90 - Math.random() * 120; this.volley.push({ x: ENE_X - 22, y: ENE_Y - 2, tx: MANU_X, ty, vx: 0, vy: 0, set: false, delay: i * 0.28, life: 0 }); }
  }
  updVolley(dt) {
    const cx = this.x + this.bodyX, R = this.domeRadius() * (this.dome.state === 'off' ? 0 : 1), GROUND = this.groundY;
    for (let i = this.volley.length - 1; i >= 0; i--) {
      const p = this.volley[i]; p.life += dt; if (p.life < p.delay) continue;
      if (!p.set) { const ang = Math.atan2((p.ty) - (p.y), (cx) - (p.x)); const sp = 360; p.vx = Math.cos(ang) * sp; p.vy = Math.sin(ang) * sp; p.set = true; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      const d = Math.hypot(p.x - cx, p.y - GROUND);
      if (this.dome.state !== 'off' && d <= R + 2) { // splash on dome
        this.emit(reduce ? 5 : 10, p.x, p.y, 120, '#b47bff'); this.glowSplash = ({ x: p.x, y: p.y }); this.volley.splice(i, 1); continue;
      }
      if (p.x < cx - 10 || p.y > GROUND) { this.volley.splice(i, 1); continue; }
    }
  }
  drawVolley() {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const p of this.volley) { if (p.life < p.delay) continue; glow(p.x, p.y, 11, '#b47bff', 0.8); ctx.fillStyle = '#e9d3ff'; ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, 6.28); ctx.fill(); const ang = Math.atan2(p.vy, p.vx); ctx.strokeStyle = rgba('#b47bff', 0.5); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x - Math.cos(ang) * 12, p.y - Math.sin(ang) * 12); ctx.lineTo(p.x, p.y); ctx.stroke(); }
    ctx.restore();
    if (this.glowSplash) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(this.glowSplash.x, this.glowSplash.y, 24, '#fff3c4', 0.5); ctx.restore(); this.glowSplash = null; }
  }

  // ---- particles: Manu's own bronze-dust / purple-debris system -------------
  emit(n, x, y, sp, c) {
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.28; this.parts.push({ x: x + (Math.random() - .5) * 12, y: y + (Math.random() - .5) * 12, vx: Math.cos(a) * sp * (0.3 + Math.random()), vy: Math.sin(a) * sp * (0.3 + Math.random()) - 30, life: 0, max: 0.5 + Math.random() * 0.7, r: 1.6 + Math.random() * 2.6, c: c || (Math.random() < 0.5 ? '#ffb15a' : '#ffe0bf'), grav: p => 1 }); }
  }
  dust(x, y) {
    const GROUND = this.groundY;
    for (let i = 0; i < (reduce ? 4 : 9); i++) { const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.8; const sp = 40 + Math.random() * 70; this.parts.push({ x: x + (Math.random() - .5) * 16, y: GROUND, vx: Math.cos(a) * sp, vy: -Math.random() * 40, life: 0, max: 0.5 + Math.random() * 0.4, r: 2 + Math.random() * 3, c: '#caa074', dustp: 1 }); }
  }
  updP(dt) {
    for (let i = this.parts.length - 1; i >= 0; i--) { const q = this.parts[i]; q.life += dt; if (q.life >= q.max) { this.parts.splice(i, 1); continue; } q.vy += (q.dustp ? 40 : 90) * dt * 0.3; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.97; }
  }
  drawParts() {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const q of this.parts) { const a = 1 - q.life / q.max; if (!q.dustp) glow(q.x, q.y, q.r * 3, q.c, a * 0.3); ctx.fillStyle = rgba(q.c, a * (q.dustp ? 0.5 : 1)); ctx.beginPath(); ctx.arc(q.x, q.y, q.r * a + 0.4, 0, 6.28); ctx.fill(); } ctx.restore();
  }

  // ----- update: ability timelines + FX + secondary motion ------------------
  update(dt) {
    super.update(dt);
    const MANU_X = this.x, GROUND = this.groundY, BAR_X = this.x + BAR_DX, BAR_TOP = this.groundY + BAR_TOP_DY;
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2.2);
    if (this.shakeRequest > 0) this.shakeRequest = Math.max(0, this.shakeRequest - dt * 30);

    // smash impact
    if (this.state === 'smash') {
      const p = this.stateT / 1.1;
      if (p >= 0.50 && !this.smashHit) { this.smashHit = 1; const ix = MANU_X + this.bodyX + 44; this.shock = { x: ix, max: 300, t: 0, dur: 0.6 }; this.shakeRequest = 16; this.flash = 0.3; this.dust(ix, GROUND); this.emit(reduce ? 10 : 22, ix, GROUND - 8, 180, '#ffd9a8'); }
      if (p >= 1) { this.endAbility(); this.smashHit = 0; }
    }
    // aegis brace returns to idle (dome persists independently)
    if (this.state === 'aegis' && this.stateT >= 0.6) { this.endAbility(); }

    // walk footstep dust + micro shake
    if (this.state === 'walk') { const ph = Math.sin(this.t * 4.4); if (ph * this.walkFoot < 0) { this.walkFoot *= -1; const fx = MANU_X + this.bodyX + (this.walkFoot > 0 ? 26 : -26); this.dust(fx, GROUND); this.shakeRequest = Math.max(this.shakeRequest, 3); } }

    // shockwave
    if (this.shock) {
      this.shock.t += dt; const r = this.shock.max * easeOutCubic(this.shock.t / this.shock.dur);
      if (this.barrier.alive && r >= Math.abs(BAR_X - this.shock.x)) { this.barrier.crack += dt * 6; if (this.barrier.crack >= 1) { this.barrier.alive = false; this.shakeRequest = Math.max(this.shakeRequest, 12); for (let i = 0; i < (reduce ? 12 : 26); i++) { const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2; const sp = 80 + Math.random() * 220; this.parts.push({ x: BAR_X + (Math.random() - .5) * 30, y: BAR_TOP + Math.random() * (GROUND - BAR_TOP), vx: Math.cos(a) * sp + 60, vy: Math.sin(a) * sp, life: 0, max: 0.6 + Math.random() * 0.6, r: 2 + Math.random() * 4, c: Math.random() < 0.5 ? '#3a1d6e' : '#6a3aa0', dustp: 1 }); } } }
      if (this.shock.t >= this.shock.dur) this.shock = null;
    }

    // dome lifecycle
    if (this.dome.state === 'up') { this.dome.t += dt; if (this.dome.t >= 0.45) { this.dome.state = 'hold'; this.dome.t = 0; this.dome.hold = 0; } }
    else if (this.dome.state === 'hold') { this.dome.hold += dt; if (this.dome.hold >= 3.0) { this.dome.state = 'down'; this.dome.t = 0; } }
    else if (this.dome.state === 'down') { this.dome.t += dt; if (this.dome.t >= 0.5) { this.dome.state = 'off'; } }

    this.updVolley(dt);

    // secondary motion (heavy / stiff)
    const P = this.pose(); const ax = MANU_X + this.bodyX + P.sway, ay = GROUND - P.hover; const f = -((P.sway) - (this.psway || 0)) * 0.3; this.psway = P.sway;
    stepChain(this.cape, ax - 12, ay + P.chestY + 6, f + Math.sin(this.t * 1.4) * 0.12, 0.9, 3);
    stepChain(this.tabard, ax, ay + P.hipY + 2, f * 0.6 + Math.sin(this.t * 1.6) * 0.1, 0.8, 3);
    this.updP(dt);

    this.lastPose = P;
  }

  // ----- generic-preview control descriptor ---------------------------------
  static MOVES = [
    { key: '1', label: 'Idle', state: 'idle' },
    { key: '2', label: 'Walk', state: 'walk' },
    { key: '3', label: 'Titan Smash', method: 'titanSmash' },
    { key: '4', label: 'Aegis of Dawn', method: 'aegisOfDawn' },
  ];
}
