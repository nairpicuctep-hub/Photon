// victor.js — Victor Creatorul (MAKER / ZONE-GADGET). PORTED from
// victor-creatorul-feelslice.html. Authoritative for: Victor's look, palette,
// states (idle / walk / deploy / fire + react) and FX. The teal maker's coat,
// brass goggles, satchel, orbiting hand-prism, the deployed Prism Mirror and the
// scripted refracting beams are all reproduced here on the shared render toolkit.
//
// SELF-CONTAINED: the slice rendered its beams against demo props (a dark wall,
// a caged crystal target, an enemy emitter). Here Victor deploys the Prism Mirror
// in front of himself and the ally/enemy beams refract through it around him, so
// the hero renders correctly in any state with no external demo objects.

import { ctx } from '../render/gfx.js';
import {
  lerp, clamp, easeOutCubic, easeInOutCubic, easeOutBack,
  mix, rgba, glow,
} from '../render/primitives.js';
import { limb, limbGrad, rimStroke, hand, boot, setFigureStyle } from '../render/figure.js';
import { makeChain, stepChain } from '../render/cloth.js';
import { emitPhotons } from '../render/particles.js';
import { reduce } from '../core/env.js';
import { HeroBase } from './HeroBase.js';

// Victor's OWN palette (teal maker, brass tools, brown hair, amber goggles).
// Mapped onto the toolkit's suit tokens: SUIT_* = COAT_* (so boot()/limbGrad()
// read the coat colors).
const COAT_HI = '#7fe9dd', COAT_LO = '#1b9488', COAT_SH = '#0e564e', UNDER = '#173b3a';
const SKIN_HI = '#fff0d6', SKIN_LO = '#cf9450', BRASS = '#e7b25e', BRASS_SH = '#9c6a26';
const HAIR = '#6b4a2e', HAIR_HI = '#9a6f44', LENS = '#ffd27a', EYE = '#ffe6b0', RIM = '#d6fff8', INK = '#0f1208', SEAM = '#d8fffb';
// toolkit suit tokens for hand()/boot()
const SUIT_HI = COAT_HI, SUIT_LO = COAT_LO, SUIT_SH = COAT_SH;

export class Victor extends HeroBase {
  constructor(def = {}) {
    super({ id: 'victor', name: 'Victor Creatorul', ...def });

    this.bodyX = 0; this.bodyXv = 0; this.bodyXp = 0;
    this.shakeRequest = 0;

    // deployed Prism Mirror state (placed in front of Victor, self-contained)
    this.prism = { placed: false, asm: 0 };
    this.beams = [];
    this.tgtHit = 0; this.vicFlinch = 0; this.vicShield = 0;

    // local-space offsets (relative to the figure origin at the feet) where the
    // self-contained Prism Mirror sits and where refracted beams terminate.
    this.PRISM_DX = 96;  this.PRISM_DY = -100;
    this.HAND_DX = 34;   this.HAND_DY = -152;
    this.ENE_DX = 132;   this.ENE_DY = -40;

    // secondary-motion chains (verlet) for the coat tails, seeded in world space
    this.coatL = makeChain(6, 11, this.x - 8, this.groundY - 100);
    this.coatR = makeChain(6, 11, this.x + 8, this.groundY - 100);

    this.lastPose = this.pose();
  }

  // ----- abilities (triggered by input) -------------------------------------
  deploy() { if (this.state !== 'deploy') this.setState('deploy'); }
  fire() { if (this.state !== 'fire') this.setState('fire'); }
  enemyBeam() {
    if (this.state !== 'react') { this.setState('react'); this.fireBeam('enemy'); }
  }

  // ----- pose: origin at feet; +x right; returns joint coords (local space) --
  pose() {
    const tt = this.t;
    const state = this.state, stateT = this.stateT;
    const breath = Math.sin(tt * 1.5) * 0.9;
    let hover = (state === 'idle') ? Math.sin(tt * 1.4) * 2.2 : 0;
    let lean = 0, crouch = 0, reach = 0, pull = 0;
    if (state === 'walk') hover = Math.abs(Math.sin(tt * 7)) * 2.2;
    if (state === 'deploy') { const p = stateT / 0.7; if (p < 0.4) { const e = easeInOutCubic(p / 0.4); crouch = e * 8; reach = e * 0.5; } else { const e = easeOutBack(clamp((p - 0.4) / 0.6, 0, 1)); crouch = lerp(8, 0, clamp(e, 0, 1)); reach = lerp(0.5, 0.2, clamp(e, 0, 1)); } }
    if (state === 'fire') { const p = stateT / 0.8; if (p < 0.35) { const e = easeInOutCubic(p / 0.35); pull = e; lean = -e * 4; } else if (p < 0.5) { const e = (p - 0.35) / 0.15; reach = easeOutCubic(e); lean = lerp(-4, 5, e); } else { const e = (p - 0.5) / 0.5; reach = 1 - easeInOutCubic(e); lean = lerp(5, 0, easeOutCubic(e)); } }
    if (state === 'react') { const p = stateT / 0.7; const e = Math.sin(clamp(p, 0, 1) * Math.PI); lean = -e * 8; }

    const hipY = -100 + breath * 0.3, chestY = -156 + breath * 0.4, headY = -194, up = lean * 0.6;
    const legSwing = state === 'walk' ? Math.sin(tt * 7) : 0;
    const legL = { hip: { x: -9, y: hipY }, knee: { x: -12 + legSwing * 9, y: hipY * 0.5 - crouch * 0.5 }, foot: { x: -12 + legSwing * 15, y: -2 - Math.max(0, legSwing) * 7 } };
    const legR = { hip: { x: 9, y: hipY }, knee: { x: 12 - legSwing * 9, y: hipY * 0.5 - crouch * 0.5 }, foot: { x: 12 - legSwing * 15, y: -2 - Math.max(0, -legSwing) * 7 } };
    const shL = { x: -16 + up * 0.5, y: chestY }, shR = { x: 16 + up * 0.5, y: chestY };
    // back arm (left)
    let elbowL = { x: -21 + up, y: chestY + 22 }, handL = { x: -19 + up, y: chestY + 44 };
    // right arm holds prism / deploys / fires
    let elbowR, handR;
    if (state === 'deploy') { const r = reach; elbowR = { x: 16 + up + r * 14, y: chestY + 16 }; handR = { x: 20 + up + r * 40, y: chestY + 30 + crouch * 1.0 }; }
    else if (state === 'fire') { const r = reach, p = pull; elbowR = { x: 16 + up + r * 16, y: chestY + 12 }; handR = { x: lerp(14, 60, r) + up - p * 14, y: chestY + 18 - lerp(0, 4, r) + p * 3 }; }
    else { elbowR = { x: 21 + up, y: chestY + 20 }; handR = { x: 24 + up, y: chestY + 34 }; }
    return { hipY, chestY, headY, up, hover, shL, shR, elbowL, handL, elbowR, handR, legL, legR, reach, crouch };
  }

  // ----- draw: full figure --------------------------------------------------
  draw() {
    const P = this.lastPose;
    setFigureStyle(INK, RIM);

    // self-contained world-space FX behind the figure (deployed prism + beams)
    this.drawPrism();

    ctx.save();
    if (this.vicFlinch > 0) ctx.translate(-this.vicFlinch * 5, 0);
    ctx.translate(this.x + (this.bodyX || 0), this.groundY - P.hover);

    // shadow
    ctx.save(); ctx.globalAlpha = 0.32; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, 6 + P.hover * 0.4, 40, 11, 0, 0, 6.28); ctx.fill(); ctx.restore();
    // soft personal glow
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(0, P.chestY, 120, '#3fd6c8', 0.12); ctx.restore();

    // back coat tail (left) behind body
    this.drawCoat(this.coatL, P, true);

    // back arm + back leg
    limb(P.shL, P.elbowL, P.handL, 10, limbGrad(P.shL, P.handL, mix(COAT_HI, COAT_LO, 0.45), COAT_SH));
    limb(P.legL.hip, P.legL.knee, P.legL.foot, 13, limbGrad(P.legL.hip, P.legL.foot, mix(COAT_HI, COAT_LO, 0.5), COAT_SH));
    boot(P.legL.foot, true, SUIT_HI, SUIT_LO, SUIT_SH); hand(P.handL, 0.7, SKIN_HI, SKIN_LO);

    // back satchel (silhouette differentiator)
    this.drawSatchel(P);

    // torso (coat)
    this.drawTorso(P);
    // front coat tail (right)
    this.drawCoat(this.coatR, P, false);

    // front leg
    limb(P.legR.hip, P.legR.knee, P.legR.foot, 14, limbGrad(P.legR.hip, P.legR.foot, COAT_HI, COAT_LO)); boot(P.legR.foot, false, SUIT_HI, SUIT_LO, SUIT_SH);
    // front arm
    limb(P.shR, P.elbowR, P.handR, 11.5, limbGrad(P.shR, P.handR, COAT_HI, COAT_LO)); hand(P.handR, 1, SKIN_HI, SKIN_LO);

    // orbiting hand-prism (idle/most states) — small signature prop
    if (this.state !== 'deploy') this.drawHandPrism(P);

    // head + goggles
    this.drawHead(P);

    // rim pass
    rimStroke(P.shR, P.elbowR, P.handR, 11.5); rimStroke(P.legR.hip, P.legR.knee, P.legR.foot, 14);

    // personal shield flash (self-contained reaction; local space around chest)
    if (this.vicShield > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(10, P.chestY + 6, 40, '#7fe9dd', this.vicShield * 0.6); ctx.restore(); }

    ctx.restore();

    // beams refract around the figure (drawn in world space, on top)
    for (const bm of this.beams) this.drawBeam(bm);
  }

  drawCoat(c, P, back) {
    // chain in world -> local
    const ax = this.x + this.bodyX, ay = this.groundY - P.hover;
    const pts = c.pts.map(q => ({ x: q.x - ax, y: q.y - ay }));
    ctx.save();
    ctx.beginPath();
    const topx = back ? -10 + P.up * 0.5 : 10 + P.up * 0.5, topy = P.chestY + 30;
    ctx.moveTo(topx, topy);
    for (let i = 0; i < pts.length; i++) ctx.lineTo(pts[i].x + (back ? -1 : 1) * (7 * (1 - i / pts.length)), pts[i].y);
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].x - (back ? -1 : 1) * (7 * (1 - i / pts.length)), pts[i].y);
    ctx.closePath();
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke();
    const g = ctx.createLinearGradient(0, topy, 0, pts[pts.length - 1].y);
    g.addColorStop(0, back ? mix(COAT_HI, COAT_LO, 0.5) : COAT_HI); g.addColorStop(1, back ? COAT_SH : COAT_LO);
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
  }

  drawSatchel(P) {
    const x = -18 + P.up * 0.4, y = P.chestY + 26; ctx.save();
    ctx.fillStyle = mix(BRASS, BRASS_SH, 0.4); ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.roundRect(x - 8, y - 4, 18, 26, 4); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = rgba(SEAM, 0.5); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 6, y + 2); ctx.lineTo(x + 8, y + 2); ctx.stroke(); ctx.restore();
    // little antenna tool
    ctx.strokeStyle = BRASS_SH; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 6, y - 4); ctx.lineTo(x + 12, y - 20); ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(x + 12, y - 20, 7, '#7fe9dd', 0.8); ctx.restore();
    ctx.restore();
  }

  drawTorso(P) {
    const topY = P.chestY - 6, botY = P.hipY + 8, lean = P.up;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-17 + lean, topY); ctx.quadraticCurveTo(-21 + lean * 0.6, (topY + botY) / 2, -14, botY);
    ctx.quadraticCurveTo(0, botY + 6, 14, botY); ctx.quadraticCurveTo(21 + lean * 0.6, (topY + botY) / 2, 17 + lean, topY);
    ctx.quadraticCurveTo(0, topY - 8, -17 + lean, topY); ctx.closePath();
    ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.lineJoin = 'round'; ctx.stroke();
    const g = ctx.createLinearGradient(-19 + lean, topY, 17, botY); g.addColorStop(0, COAT_HI); g.addColorStop(0.6, mix(COAT_HI, COAT_LO, 0.55)); g.addColorStop(1, COAT_LO);
    ctx.fillStyle = g; ctx.fill();
    // open coat front -> dark undersuit V
    ctx.fillStyle = UNDER; ctx.beginPath(); ctx.moveTo(-7 + lean, topY + 1); ctx.lineTo(7 + lean, topY + 1); ctx.lineTo(0, botY - 6); ctx.closePath(); ctx.fill();
    // glowing tech core on chest
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(lean * 0.3, (topY + botY) / 2 - 2, 12, '#7fe9dd', 0.9);
    ctx.fillStyle = '#eafffb'; ctx.beginPath(); ctx.arc(lean * 0.3, (topY + botY) / 2 - 2, 3.4, 0, 6.28); ctx.fill();
    ctx.strokeStyle = rgba(SEAM, 0.8); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(lean * 0.3, (topY + botY) / 2 - 2, 7, 0, 6.28); ctx.stroke(); ctx.restore();
    // brass collar + belt
    ctx.strokeStyle = BRASS; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-12, botY - 1); ctx.lineTo(12, botY - 1); ctx.stroke();
    ctx.restore();
  }

  drawHead(P) {
    const hx0 = P.up * 0.9, hy = P.headY;
    ctx.save();
    ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(hx0 * 0.6, P.chestY - 3); ctx.lineTo(hx0, hy + 14); ctx.stroke();
    ctx.strokeStyle = mix(SKIN_HI, SKIN_LO, 0.4); ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(hx0 * 0.6, P.chestY - 3); ctx.lineTo(hx0, hy + 14); ctx.stroke();
    // back hair
    ctx.fillStyle = mix(HAIR, '#3e2a18', 0.3); ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(hx0 - 17, hy - 4); ctx.quadraticCurveTo(hx0 - 22, hy - 22, hx0 - 2, hy - 25); ctx.quadraticCurveTo(hx0 + 6, hy - 26, hx0 + 8, hy - 19); ctx.quadraticCurveTo(hx0 - 2, hy - 18, hx0 - 17, hy - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    // head
    ctx.beginPath(); ctx.ellipse(hx0, hy, 19, 21, 0, 0, 6.28); ctx.strokeStyle = INK; ctx.lineWidth = 3.1; ctx.stroke();
    const g = ctx.createRadialGradient(hx0 - 6, hy - 8, 3, hx0, hy, 25); g.addColorStop(0, SKIN_HI); g.addColorStop(1, SKIN_LO); ctx.fillStyle = g; ctx.fill();
    ctx.fillStyle = mix(SKIN_HI, SKIN_LO, 0.5); ctx.beginPath(); ctx.ellipse(hx0 - 16, hy + 2, 3.6, 5.6, 0, 0, 6.28); ctx.fill();
    // eyes (focused), brow, mouth
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(hx0 + 5, hy + 1, 7, EYE, 0.45); ctx.restore();
    ctx.fillStyle = mix(EYE, '#a06a2a', 0.15); ctx.beginPath(); ctx.ellipse(hx0 + 6, hy + 1, 2.8, 3.6, 0, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.ellipse(hx0 - 4, hy + 1, 2.2, 3.0, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx0 + 7, hy - 0.2, 1, 0, 6.28); ctx.fill();
    ctx.strokeStyle = rgba(INK, 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx0 + 2, hy - 5); ctx.quadraticCurveTo(hx0 + 6, hy - 7, hx0 + 10, hy - 4.5); ctx.stroke();
    ctx.lineWidth = 1.6; ctx.strokeStyle = rgba(INK, 0.55); ctx.beginPath(); ctx.moveTo(hx0 + 10, hy + 2); ctx.lineTo(hx0 + 8, hy + 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx0 + 2, hy + 11); ctx.quadraticCurveTo(hx0 + 8, hy + 13, hx0 + 12, hy + 10); ctx.stroke();
    // goggles pushed up on forehead (brass band + amber lenses)
    ctx.save();
    ctx.strokeStyle = BRASS_SH; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(hx0 - 19, hy - 16); ctx.quadraticCurveTo(hx0, hy - 24, hx0 + 19, hy - 15); ctx.stroke();
    for (const lx of [hx0 - 7, hx0 + 9]) {
      ctx.fillStyle = mix(BRASS, BRASS_SH, 0.3); ctx.beginPath(); ctx.arc(lx, hy - 18, 5.6, 0, 6.28); ctx.fill(); ctx.strokeStyle = BRASS_SH; ctx.lineWidth = 2; ctx.stroke();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(lx, hy - 18, 7, LENS, 0.8); ctx.fillStyle = rgba(LENS, 0.85); ctx.beginPath(); ctx.arc(lx, hy - 18, 3.4, 0, 6.28); ctx.fill(); ctx.restore();
    }
    ctx.restore();
    // front hair tuft over goggles
    ctx.fillStyle = mix(HAIR, HAIR_HI, 0.2); ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(hx0 - 19, hy - 12); ctx.quadraticCurveTo(hx0 - 10, hy - 25, hx0 + 4, hy - 23); ctx.quadraticCurveTo(hx0 + 2, hy - 17, hx0 - 6, hy - 16); ctx.quadraticCurveTo(hx0 - 12, hy - 12, hx0 - 19, hy - 12); ctx.closePath(); ctx.fill(); ctx.stroke();
    // rim
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(RIM, 0.5); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.ellipse(hx0 + 2, hy - 1, 19, 21, 0, -2.5, -0.2); ctx.stroke(); ctx.restore();
    ctx.restore();
  }

  drawHandPrism(P) {
    const hx0 = P.handR.x, hy = P.handR.y - 16 + Math.sin(this.t * 2) * 2, rot = this.t * 1.3;
    ctx.save(); ctx.translate(hx0, hy); ctx.rotate(rot);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(0, 0, 14, '#7fe9dd', 0.6); ctx.restore();
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(8, 5); ctx.lineTo(-8, 5); ctx.closePath();
    ctx.fillStyle = 'rgba(220,255,250,0.55)'; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = '#eafffb'; ctx.stroke();
    // tiny rainbow edge
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 1.4;
    ['#ff6f6f', '#ffd24a', '#6fffa0', '#6fd0ff'].forEach((c, i) => { ctx.strokeStyle = rgba(c, 0.5); ctx.beginPath(); ctx.moveTo(-8 + i, 5); ctx.lineTo(0 + i * 0.4, -9); ctx.stroke(); });
    ctx.restore();
    ctx.restore();
  }

  // ----- deployed Prism Mirror (self-contained, in front of Victor) ---------
  // World-space anchor of the prism (figure origin + local offset).
  prismWorld() {
    return { x: this.x + (this.bodyX || 0) + this.PRISM_DX, y: this.groundY + this.PRISM_DY };
  }

  drawPrism() {
    if (!this.prism.placed && this.prism.asm <= 0) return;
    const a = this.prism.asm; const pw = this.prismWorld(); const x = pw.x, y = pw.y, s = easeOutBack(clamp(a, 0, 1));
    ctx.save(); ctx.translate(x, y);
    // assemble shards converging
    if (a < 1) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba('#7fe9dd', (1 - a) * 0.7); ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) { const ang = i / 6 * 6.28; const d = (1 - a) * 60; ctx.beginPath(); ctx.moveTo(Math.cos(ang) * d, Math.sin(ang) * d); ctx.lineTo(Math.cos(ang) * 8, Math.sin(ang) * 8); ctx.stroke(); }
      ctx.restore();
    }
    ctx.scale(s, s);
    ctx.rotate(Math.sin(this.t * 1.2) * 0.05 - 0.18);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(0, 0, 46, '#7fe9dd', 0.28); ctx.restore();
    // glass panel (tall hex prism)
    ctx.beginPath(); ctx.moveTo(-14, -34); ctx.lineTo(14, -30); ctx.lineTo(18, 30); ctx.lineTo(-10, 34); ctx.closePath();
    const g = ctx.createLinearGradient(-16, 0, 18, 0); g.addColorStop(0, 'rgba(127,233,221,0.25)'); g.addColorStop(0.5, 'rgba(230,255,251,0.6)'); g.addColorStop(1, 'rgba(110,208,255,0.3)');
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2.4; ctx.strokeStyle = '#eafffb'; ctx.stroke();
    // rainbow refraction streaks
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 2;
    ['#ff6f6f', '#ffd24a', '#6fffa0', '#6fd0ff', '#b47bff'].forEach((c, i) => { ctx.strokeStyle = rgba(c, 0.45); ctx.beginPath(); ctx.moveTo(-12 + i * 1.5, -30); ctx.lineTo(8 + i * 2, 30); ctx.stroke(); });
    ctx.restore();
    // brass mount
    ctx.fillStyle = mix(BRASS, BRASS_SH, 0.3); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(-12, 30, 26, 10, 3); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // ----- beams (scripted bend at the prism, self-contained world coords) -----
  beamPath(kind) {
    const bx = this.x + (this.bodyX || 0); const pw = this.prismWorld();
    if (kind === 'ally') {
      const start = { x: bx + this.HAND_DX, y: this.groundY + this.HAND_DY };
      if (this.prism.placed) return [start, { x: pw.x, y: pw.y }, { x: pw.x + 160, y: this.groundY - 200 }];
      return [start, { x: bx + 110, y: this.groundY - 152 }]; // unblocked short throw
    } else {
      const start = { x: bx + this.ENE_DX + 80, y: this.groundY + this.ENE_DY - 110 };
      if (this.prism.placed) return [start, { x: pw.x, y: pw.y }, { x: pw.x + 250, y: this.groundY - 400 }]; // reflected up & away
      return [start, { x: bx + 22, y: this.groundY - 150 }]; // hits Victor
    }
  }

  fireBeam(kind) { this.beams.push({ kind, t: 0, dur: 0.55, path: this.beamPath(kind), struck: false }); }

  polyAt(path, d) { // point at distance d along polyline
    for (let i = 0; i < path.length - 1; i++) { const a = path[i], b = path[i + 1]; const seg = Math.hypot(b.x - a.x, b.y - a.y); if (d <= seg) { const u = d / seg; return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, i }; } d -= seg; }
    const e = path[path.length - 1]; return { x: e.x, y: e.y, i: path.length - 2 };
  }

  polyLen(path) { let s = 0; for (let i = 0; i < path.length - 1; i++) s += Math.hypot(path[i + 1].x - path[i].x, path[i + 1].y - path[i].y); return s; }

  drawBeam(bm) {
    const col = bm.kind === 'ally' ? '#ffd24a' : '#b47bff';
    const pw = this.prismWorld();
    const total = this.polyLen(bm.path); const grow = easeOutCubic(clamp(bm.t / (bm.dur * 0.5), 0, 1)); const head = total * grow;
    const fade = bm.t > bm.dur * 0.7 ? 1 - (bm.t - bm.dur * 0.7) / (bm.dur * 0.3) : 1;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = clamp(fade, 0, 1);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // draw up to head
    let drawn = 0; ctx.beginPath(); ctx.moveTo(bm.path[0].x, bm.path[0].y);
    for (let i = 0; i < bm.path.length - 1; i++) {
      const a = bm.path[i], b = bm.path[i + 1]; const seg = Math.hypot(b.x - a.x, b.y - a.y);
      if (drawn + seg <= head) { ctx.lineTo(b.x, b.y); drawn += seg; }
      else { const u = (head - drawn) / seg; ctx.lineTo(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u); drawn = head; break; }
    }
    ctx.strokeStyle = rgba(col, 0.7); ctx.lineWidth = 9; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 3; ctx.stroke();
    // bend flare at prism
    if (this.prism.placed && bm.path.length > 2) {
      glow(pw.x, pw.y, 26, '#eafffb', 0.8 * fade);
      ['#ff6f6f', '#ffd24a', '#6fffa0', '#6fd0ff'].forEach((c, i) => { glow(pw.x + (i - 1.5) * 6, pw.y - 18, 8, c, 0.5 * fade); });
    }
    // head glow
    const hp = this.polyAt(bm.path, head); glow(hp.x, hp.y, 16, col, 0.8 * fade);
    ctx.restore();
  }

  // ----- update: ability timelines + secondary motion -----------------------
  update(dt) {
    super.update(dt);
    this.bodyXp = this.bodyX;

    if (this.state === 'deploy') {
      const p = this.stateT / 0.7;
      if (p >= 0.4 && !this.prism.placed) {
        this.prism.placed = true; this.prism.asm = 0.001;
        const pw = this.prismWorld();
        emitPhotons(reduce ? 8 : 22, pw.x, pw.y, 160, 0);
        this.shakeRequest = 6;
      }
      if (p >= 1) { this.endAbility(); }
    } else if (this.state === 'fire') {
      const p = this.stateT / 0.8;
      if (p >= 0.46 && p < 0.5 && !this._fired) { this.fireBeam('ally'); this._fired = true; }
      if (p >= 1) { this.endAbility(); this._fired = false; }
    } else if (this.state === 'react') {
      if (this.stateT >= 0.7) { this.endAbility(); }
    } else {
      this.bodyX = lerp(this.bodyX, 0, Math.min(1, dt * 8));
      if (Math.random() < 0.1) emitPhotons(1, this.x + (Math.random() - 0.5) * 20, this.groundY - 110, 26, 8);
    }

    if (this.prism.placed && this.prism.asm < 1) this.prism.asm = Math.min(1, this.prism.asm + dt * 2.2);
    if (this.shakeRequest > 0) this.shakeRequest = Math.max(0, this.shakeRequest - dt * 30);
    if (this.tgtHit > 0) this.tgtHit = Math.max(0, this.tgtHit - dt * 1.6);
    if (this.vicFlinch > 0) this.vicFlinch = Math.max(0, this.vicFlinch - dt * 3);
    if (this.vicShield > 0) this.vicShield = Math.max(0, this.vicShield - dt * 2.5);

    // beams
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const bm = this.beams[i]; bm.t += dt;
      const total = this.polyLen(bm.path), grow = easeOutCubic(clamp(bm.t / (bm.dur * 0.5), 0, 1)), head = total * grow;
      if (!bm.struck && grow >= 0.999) {
        bm.struck = true;
        const end = bm.path[bm.path.length - 1];
        if (bm.kind === 'ally') {
          if (this.prism.placed) { this.tgtHit = 1; emitPhotons(reduce ? 10 : 26, end.x, end.y, 200, 0); this.shakeRequest = 7; }
          else { emitPhotons(8, end.x, end.y, 120, 0); }
        } else {
          if (this.prism.placed) { const pw = this.prismWorld(); emitPhotons(reduce ? 8 : 18, pw.x, pw.y, 160, 0); }
          else { this.vicFlinch = 1; this.vicShield = 1; emitPhotons(10, end.x, end.y, 140, 0); this.shakeRequest = 8; }
        }
      }
      if (bm.t >= bm.dur) this.beams.splice(i, 1);
    }

    this.bodyXv = this.bodyX - this.bodyXp;

    // secondary motion: coat tails from chest, anchored in world coords
    const P = this.pose();
    const ax = this.x + this.bodyX, ay = this.groundY - P.hover; const f = -this.bodyXv * 0.4;
    stepChain(this.coatL, ax - 9 + P.up * 0.4, ay + P.chestY + 30, f + Math.sin(this.t * 1.8) * 0.15, 0.7, 2);
    stepChain(this.coatR, ax + 9 + P.up * 0.4, ay + P.chestY + 30, f + Math.sin(this.t * 1.7 + 1) * 0.15, 0.7, 2);

    this.lastPose = P;
  }

  static MOVES = [
    { key: '1', label: 'Idle', state: 'idle' },
    { key: '2', label: 'Walk', state: 'walk' },
    { key: '3', label: 'Deploy Prism', method: 'deploy' },
    { key: '4', label: 'Fire Beam', method: 'fire' },
    { key: '5', label: 'Enemy Beam', method: 'enemyBeam' },
  ];
}
