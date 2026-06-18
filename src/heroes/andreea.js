// andreea.js — Andreea Înțelepciunea (CONTROL / MIND). PORTED from
// andreea-intelepciunea-feelslice.html. Authoritative for: Andreea's look,
// indigo-seer palette, states (idle / walk[="glide"] / eddy + foresight) and
// FX. The poised contrapposto figure, the floating orrery, the verlet stole +
// long hair, the silver star-trim coat, the star-diadem, the Temporal Eddy
// time-dilation bubble and the Foresight premonition echoes/markers are all
// reproduced here on the shared render toolkit.
//
// DEVIATIONS from a byte-for-byte port (forced by the modular contract; the
// visual math is otherwise verbatim):
//  - The slice draws the dark emitter / projectiles / eddy field / foresight
//    markers against a demo target placed at fixed canvas coords (ENE_X, FX/FY,
//    GUARD_X). Those effects are kept VERBATIM but re-anchored relative to the
//    hero (offset by dx = this.x - AND_X, dy = this.groundY - GROUND) so the
//    hero is self-contained and renders identically with no external object.
//  - The slice's bespoke hand()/boot() (non-glowing hand r=4.2; heeled boot with
//    a silver ankle strap) differ from the shared figure toolkit's caps, so they
//    are ported here as private methods to keep the silhouette exact. limb /
//    limbGrad / rimStroke use the shared toolkit (unchanged per contract).
//  - The slice's global screen-shake is stored as this.shakeRequest (decayed in
//    update) for the scene to read, rather than shaking globally.

import { ctx } from '../render/gfx.js';
import {
  lerp, clamp, easeOutCubic, easeInOutCubic, easeOutBack,
  mix, rgba, glow, star,
} from '../render/primitives.js';
import { limb, limbGrad, rimStroke, setFigureStyle } from '../render/figure.js';
import { makeChain, stepChain } from '../render/cloth.js';
import { HeroBase } from './HeroBase.js';

// Andreea: indigo seer. Her OWN ink + rim (NOT Radu's), skin, coat tokens.
const INK = '#0d0c1f', RIM = '#e7ecff', SKIN_HI = '#fff0db', SKIN_LO = '#d09a64';
const aHI = '#8e7ff0', aLO = '#3a3a8c', aSH = '#201d4a', aCOAT2 = '#6a4fd0',
  SILVER = '#cfe0ff', STAR = '#eaf2ff', GOLD = '#ffd24a', TIME = '#7fb0ff',
  aEYE = '#cdbcff', aHAIR = '#241d44', aHAIRHI = '#5a4f8c', BOOT = '#1c1838';

// Slice authored geometry (the figure lives at AND_X/GROUND there; here it
// lives at this.x/this.groundY — we keep the source numbers and re-anchor).
const AND_X = 292, GROUND = 508;
const ENE_X = 884, ENE_Y = GROUND - 150, GUARD_X = AND_X + 44;
const FX = 602, FY = GROUND - 150, FR = 124;

export class Andreea extends HeroBase {
  static MOVES = [
    { key: '1', label: 'Idle', state: 'idle' },
    { key: '2', label: 'Walk', state: 'walk' },
    { key: '3', label: 'Temporal Eddy', method: 'eddy' },
    { key: '4', label: 'Foresight', method: 'foresightCast' },
  ];

  constructor(def = {}) {
    super({ id: 'andreea', name: 'Andreea Intelepciunea', ...def });

    // FX state (mirrors the slice's module globals)
    this.parts = [];
    this.proj = [];
    this.projTimer = 0;
    this.field = { state: 'off', t: 0, hold: 0 };
    this.foresight = null;
    this.shakeRequest = 0; // slice's global `shake`, surfaced for the scene

    // secondary-motion chains (verlet), seeded in world space near the figure
    // (slice: A.hairL/hairR seeded at AND_X±8, GROUND-176; stole at AND_X+14)
    this.hairL = makeChain(6, 11, this.x - 8, this.groundY - 176);
    this.hairR = makeChain(6, 10, this.x + 8, this.groundY - 176);
    this.stole = makeChain(7, 12, this.x + 14, this.groundY - 150);

    this.lastPose = this.pose();
  }

  // ----- abilities (triggered by input) -------------------------------------
  glide() { if (this.state !== 'walk') this.setState('walk'); }
  eddy() {
    this.field = { state: 'up', t: 0, hold: 0 };
    if (this.state !== 'eddy') this.setState('eddy');
  }
  foresightCast() {
    this.foresight = { t: 0, dur: 3.0 };
    if (this.state !== 'foresight') this.setState('foresight');
  }

  // ----- pose: origin at feet; +x right; returns joint coords (local space) --
  // Ported VERBATIM from anPose(). `glide` maps to the 'walk' state.
  pose() {
    const tt = this.t;
    const breath = Math.sin(tt * 1.3) * 0.7;
    let hipShift = Math.sin(tt * 0.9) * 2, lean = 0, cast = 0, temple = 0;
    if (this.state === 'walk') { lean = 4; }
    if (this.state === 'eddy') { const p = this.stateT / 0.8; if (p < 0.45) { const e = easeInOutCubic(p / 0.45); cast = e; } else cast = 1 - (easeOutCubic((p - 0.45) / 0.55)) * 0.25; }
    if (this.state === 'foresight') { const p = this.stateT / 0.8; if (p < 0.4) { const e = easeInOutCubic(p / 0.4); temple = e; } else temple = 1 - (easeOutCubic((p - 0.4) / 0.6)) * 0.3; }
    const hipY = -104 + breath * 0.3, chestY = -156 + breath * 0.4, headY = -194, sh = lean;
    // legs (slim, contrapposto): front weight leg straight, back leg slightly back/bent
    const legF = { knee: { x: 5 + hipShift * 0.5, y: -52 }, foot: { x: 6 + hipShift * 0.4, y: -2 } };
    const legB = { knee: { x: -7 + hipShift * 0.5, y: -50 }, foot: { x: -12 + hipShift * 0.4, y: -2 } };
    if (this.state === 'walk') { const s = Math.sin(tt * 4); legF.foot.x = 6 + s * 9; legB.foot.x = -12 - s * 9; legF.foot.y = -2 - Math.max(0, s) * 6; legB.foot.y = -2 - Math.max(0, -s) * 6; }
    const shL = { x: -16 + sh, y: chestY }, shR = { x: 16 + sh, y: chestY };
    let elbowL = { x: -20 + sh, y: chestY + 20 }, handL = { x: -18 + sh + hipShift * 0.3, y: chestY + 40 };
    let elbowR, handR;
    if (this.state === 'eddy') { const c = cast; elbowR = { x: 20 + sh + c * 6, y: chestY + 14 }; handR = { x: 26 + sh + c * 30, y: chestY + 18 - c * 4 }; }
    else if (this.state === 'foresight') { const c = temple; elbowR = { x: 18 + sh, y: chestY + 6 - c * 4 }; handR = { x: lerp(24, 12, c) + sh, y: lerp(chestY + 22, headY + 6, c) }; }
    else { elbowR = { x: 20 + sh, y: chestY + 8 }; handR = { x: 24 + sh, y: chestY - 6 + Math.sin(tt * 1.5) * 1.5 }; } // idle: hand raised holding orrery
    return { hipY, chestY, headY, sh, hipShift, cast, temple, shL, shR, elbowL, handL, elbowR, handR, legF, legB };
  }

  // local hip helper (slice's legHip)
  legHip(P, x) { return x + P.hipShift * 0.4; }

  // ----- bespoke caps (ported verbatim from the slice's hand()/boot()) -------
  hand(p) {
    ctx.fillStyle = mix(SKIN_HI, SKIN_LO, 0.3); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, 4.2, 0, 6.28); ctx.fill(); ctx.stroke();
  }
  boot(p, back) {
    ctx.fillStyle = back ? mix(BOOT, '#000', 0.2) : BOOT; ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(p.x - 5, p.y - 14); ctx.lineTo(p.x + 5, p.y - 14); ctx.lineTo(p.x + 9, p.y); ctx.quadraticCurveTo(p.x + 10, p.y + 3, p.x + 4, p.y + 3); ctx.lineTo(p.x - 5, p.y + 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(SILVER, 0.5); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(p.x - 5, p.y - 13); ctx.lineTo(p.x + 5, p.y - 13); ctx.stroke(); ctx.restore();
  }

  // ----- figure draw --------------------------------------------------------
  // Mirrors drawAndreea(): self-effects first, then the figure. setFigureStyle
  // uses Andreea's own ink/rim. Self-effects (emitter/field/proj/foresight) are
  // drawn around the hero in world space (see anchorDX/anchorDY).
  draw() {
    const P = this.lastPose;
    setFigureStyle(INK, RIM);

    // self-contained world-space FX behind the figure (re-anchored to the hero)
    this.drawEmitter();
    this.drawField();
    this.drawProj();
    this.drawForesight();

    ctx.save();
    ctx.translate(this.x, this.groundY);

    // ground contact shadow
    ctx.save(); ctx.globalAlpha = 0.32; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, 4, 34, 10, 0, 0, 6.28); ctx.fill(); ctx.restore();
    // personal glow (gold under foresight, indigo otherwise)
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(0, P.chestY + 10, 120, this.state === 'foresight' ? '#ffd24a' : '#7b6cf0', 0.12); ctx.restore();

    this.drawHairBack(P);
    this.drawStole(P);
    // back arm
    limb(P.shL, P.elbowL, P.handL, 10, limbGrad(P.shL, P.handL, mix(aHI, aLO, 0.45), aSH)); this.hand(P.handL);
    // back leg
    limb({ x: this.legHip(P, -7), y: P.hipY - 2 }, P.legB.knee, P.legB.foot, 10, limbGrad({ x: -7, y: P.hipY }, P.legB.foot, mix(aHI, aLO, 0.5), aSH)); this.boot(P.legB.foot, true);
    this.drawCoat(P);
    // front leg
    limb({ x: this.legHip(P, 5), y: P.hipY - 2 }, P.legF.knee, P.legF.foot, 10.5, limbGrad({ x: 5, y: P.hipY }, P.legF.foot, aHI, aLO)); this.boot(P.legF.foot, false);
    // front arm
    limb(P.shR, P.elbowR, P.handR, 10.5, limbGrad(P.shR, P.handR, aHI, aLO)); this.hand(P.handR);
    this.drawOrrery(P);
    this.drawHead(P);
    rimStroke(P.shR, P.elbowR, P.handR, 10.5);

    ctx.restore();

    // hero-local particles (drawn in world space after figure, like the slice)
    this.drawP();
  }

  drawCoat(P) {
    const topY = P.chestY - 6, waistY = P.hipY, hemY = -60; ctx.save();
    const sway = Math.sin(this.t * 1.2) * 2;
    // bodice + A-line skirt as one panel
    ctx.beginPath();
    ctx.moveTo(-16 + P.sh, topY); ctx.quadraticCurveTo(-19 + P.sh, (topY + waistY) / 2, -12, waistY);
    ctx.quadraticCurveTo(-26 + sway, (waistY + hemY) / 2, -26 + sway, hemY); // left hem
    ctx.quadraticCurveTo(-13 + sway, hemY - 5, 0, hemY - 2);
    ctx.quadraticCurveTo(13 + sway, hemY - 5, 26 + sway, hemY); // right hem
    ctx.quadraticCurveTo(26 + P.sh, (waistY + hemY) / 2, 12, waistY);
    ctx.quadraticCurveTo(19 + P.sh, (topY + waistY) / 2, 16 + P.sh, topY);
    ctx.quadraticCurveTo(0, topY - 8, -16 + P.sh, topY); ctx.closePath();
    ctx.strokeStyle = INK; ctx.lineWidth = 3.3; ctx.lineJoin = 'round'; ctx.stroke();
    const g = ctx.createLinearGradient(-20, topY, 20, hemY); g.addColorStop(0, aHI); g.addColorStop(0.5, mix(aCOAT2, aLO, 0.4)); g.addColorStop(1, aLO); ctx.fillStyle = g; ctx.fill();
    // center seam
    ctx.strokeStyle = rgba(aSH, 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(P.sh * 0.5, topY + 4); ctx.lineTo(0, hemY - 2); ctx.stroke();
    // silver star-trim down the front + hem
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(SILVER, 0.6); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-26 + sway, hemY); ctx.quadraticCurveTo(0, hemY - 3, 26 + sway, hemY); ctx.stroke();
    // constellation on skirt
    const cs = [[-10, -78], [2, -86], [12, -74], [-4, -70]]; ctx.strokeStyle = rgba(SILVER, 0.5);
    for (let i = 0; i < cs.length - 1; i++) { ctx.beginPath(); ctx.moveTo(cs[i][0], cs[i][1]); ctx.lineTo(cs[i + 1][0], cs[i + 1][1]); ctx.stroke(); }
    for (const s of cs) { glow(s[0], s[1], 4, STAR, 0.7); ctx.fillStyle = STAR; star(s[0], s[1], 2.4, 1, 5); ctx.fill(); }
    ctx.restore();
    // waist sash
    ctx.fillStyle = mix(aSH, aCOAT2, 0.3); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.roundRect(-13, waistY - 6, 26, 9, 3); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(0, waistY - 1, 10, TIME, 0.6); ctx.fillStyle = STAR; star(0, waistY - 1, 4, 1.8, 6); ctx.fill(); ctx.restore();
    ctx.restore();
  }

  drawStole(P) {
    const ax = this.x, ay = this.groundY; const pts = this.stole.pts.map(q => ({ x: q.x - ax, y: q.y - ay })); ctx.save();
    ctx.beginPath(); ctx.moveTo(-14 + P.sh, P.chestY + 2);
    for (let i = 0; i < pts.length; i++) ctx.lineTo(pts[i].x - 6 * (1 - i / pts.length), pts[i].y);
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].x + 6 * (1 - i / pts.length), pts[i].y);
    ctx.lineTo(16 + P.sh, P.chestY + 2); ctx.closePath();
    ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.stroke();
    const g = ctx.createLinearGradient(0, P.chestY, 0, pts[pts.length - 1].y); g.addColorStop(0, aCOAT2); g.addColorStop(1, aSH); ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(SILVER, 0.5); ctx.lineWidth = 1.4; ctx.beginPath(); for (let i = 0; i < pts.length; i++) { const x = pts[i].x + 6 * (1 - i / pts.length); i ? ctx.lineTo(x, pts[i].y) : ctx.moveTo(x, pts[i].y); } ctx.stroke(); ctx.restore();
    ctx.restore();
  }

  drawHairBack(P) {
    for (const c of [this.hairL, this.hairR]) {
      const ax = this.x, ay = this.groundY; const pts = c.pts.map(q => ({ x: q.x - ax, y: q.y - ay }));
      ctx.save(); ctx.beginPath(); ctx.moveTo(pts[0].x - 8, pts[0].y);
      for (let i = 0; i < pts.length; i++) ctx.lineTo(pts[i].x - 5 * (1 - i / pts.length), pts[i].y);
      for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].x + 5 * (1 - i / pts.length), pts[i].y);
      ctx.closePath(); ctx.fillStyle = mix(aHAIR, aHAIRHI, 0.2); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fill(); ctx.stroke();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(aHAIRHI, 0.5); ctx.lineWidth = 1.4; ctx.beginPath(); for (let i = 0; i < pts.length; i++) { i ? ctx.lineTo(pts[i].x, pts[i].y) : ctx.moveTo(pts[i].x, pts[i].y); } ctx.stroke(); ctx.restore();
      ctx.restore();
    }
  }

  drawOrrery(P) {
    const cx = P.handR.x, cy = P.handR.y - 16; const fl = (this.state === 'foresight' || this.state === 'eddy') ? 1 : 0; const sp = this.t * (1 + fl * 1.5);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(cx, cy, 20 + fl * 10, fl ? GOLD : TIME, 0.4 + fl * 0.3); ctx.restore();
    ctx.save(); ctx.translate(cx, cy);
    // 3 rings at angles
    const rings = [[14, 5, 0], [12, 11, 1.0], [10, 8, 2.0]];
    ctx.lineWidth = 1.8;
    for (let i = 0; i < rings.length; i++) {
      const [rx, ry, ph] = rings[i]; ctx.strokeStyle = rgba(i === 0 ? SILVER : (fl ? GOLD : TIME), 0.8); ctx.save(); ctx.rotate(sp * 0.4 + ph); ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 6.28); ctx.stroke();
      // bead on ring
      const ba = sp * 1.4 + ph * 2; ctx.fillStyle = STAR; const bx = Math.cos(ba) * rx, by = Math.sin(ba) * ry; ctx.beginPath(); ctx.arc(bx, by, 1.8, 0, 6.28); ctx.fill(); ctx.restore();
    }
    // center star
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(0, 0, 8, STAR, 0.9); ctx.restore(); ctx.fillStyle = STAR; star(0, 0, 4, 1.6, 6); ctx.fill();
    ctx.restore();
  }

  drawHead(P) {
    const h0 = P.sh * 0.9, hy = P.headY; ctx.save();
    ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(h0 * 0.6, P.chestY - 2); ctx.lineTo(h0, hy + 13); ctx.stroke();
    ctx.strokeStyle = mix(SKIN_HI, SKIN_LO, 0.4); ctx.lineWidth = 7.5; ctx.beginPath(); ctx.moveTo(h0 * 0.6, P.chestY - 2); ctx.lineTo(h0, hy + 13); ctx.stroke();
    // head
    ctx.beginPath(); ctx.ellipse(h0, hy, 18, 20, 0, 0, 6.28); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
    const g = ctx.createRadialGradient(h0 - 6, hy - 7, 3, h0, hy, 24); g.addColorStop(0, SKIN_HI); g.addColorStop(1, SKIN_LO); ctx.fillStyle = g; ctx.fill();
    ctx.fillStyle = mix(SKIN_HI, SKIN_LO, 0.5); ctx.beginPath(); ctx.ellipse(h0 - 15, hy + 2, 3.4, 5.2, 0, 0, 6.28); ctx.fill();
    // calm eyes (half-lidded, knowing), brows, soft mouth
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(h0 + 5, hy, 7, aEYE, 0.45); ctx.restore();
    ctx.fillStyle = mix(aEYE, '#5a4f8c', 0.2); ctx.beginPath(); ctx.ellipse(h0 + 6, hy, 2.6, 2.8, 0, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.ellipse(h0 - 4, hy, 2.1, 2.4, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(h0 + 7, hy - 0.6, 0.9, 0, 6.28); ctx.fill();
    ctx.strokeStyle = rgba(INK, 0.6); ctx.lineWidth = 1.7; ctx.beginPath(); ctx.moveTo(h0 + 1, hy - 5); ctx.quadraticCurveTo(h0 + 6, hy - 6.5, h0 + 11, hy - 4.5); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.strokeStyle = rgba(INK, 0.5); ctx.beginPath(); ctx.moveTo(h0 + 3, hy + 10); ctx.quadraticCurveTo(h0 + 8, hy + 11.5, h0 + 11, hy + 9); ctx.stroke();
    // lips hint
    ctx.fillStyle = rgba('#c8607a', 0.4); ctx.beginPath(); ctx.ellipse(h0 + 7, hy + 10, 3, 1.4, 0, 0, 6.28); ctx.fill();
    // front hair sweep
    ctx.fillStyle = mix(aHAIR, aHAIRHI, 0.25); ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(h0 - 18, hy - 7); ctx.quadraticCurveTo(h0 - 12, hy - 24, h0 + 4, hy - 23); ctx.quadraticCurveTo(h0 + 18, hy - 22, h0 + 19, hy - 9); ctx.quadraticCurveTo(h0 + 12, hy - 16, h0 + 2, hy - 15); ctx.quadraticCurveTo(h0 - 8, hy - 14, h0 - 18, hy - 7); ctx.closePath(); ctx.fill(); ctx.stroke();
    // star diadem
    ctx.save(); ctx.strokeStyle = SILVER; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(h0 - 15, hy - 12); ctx.quadraticCurveTo(h0, hy - 19, h0 + 15, hy - 11); ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(h0, hy - 15, 9, this.state === 'foresight' ? GOLD : TIME, 0.8); ctx.restore();
    ctx.fillStyle = this.state === 'foresight' ? GOLD : STAR; star(h0, hy - 15, 4.5, 1.8, 6); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(RIM, 0.45); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(h0 + 2, hy - 1, 18, 20, 0, -2.5, -0.2); ctx.stroke(); ctx.restore();
    ctx.restore();
  }

  // ----- self-contained world-space FX (re-anchored to the hero) ------------
  // anchorDX/anchorDY shift the slice's fixed canvas coords so the demo emitter,
  // eddy field and foresight markers stay positioned relative to the hero.
  anchorDX() { return this.x - AND_X; }
  anchorDY() { return this.groundY - GROUND; }

  drawEmitter() {
    const dx = this.anchorDX(), dy = this.anchorDY();
    const x = ENE_X + dx, y = ENE_Y + dy, ground = GROUND + dy;
    ctx.save();
    ctx.globalAlpha = 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, ground + 2, 26, 8, 0, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#241340'; ctx.strokeStyle = 'rgba(150,90,230,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 22, ground); ctx.lineTo(x - 12, y - 30); ctx.lineTo(x + 16, y - 30); ctx.lineTo(x + 22, ground); ctx.closePath(); ctx.fill(); ctx.stroke();
    // barrel
    ctx.fillStyle = '#1a0f2e'; ctx.fillRect(x - 28, y - 6, 18, 12);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(x - 22, y, 12, '#b266ff', 0.7 + Math.sin(this.t * 5) * 0.2); ctx.restore(); ctx.restore();
  }

  spawnProj() {
    const dy = this.anchorDY();
    const ty = (GROUND + dy) - 90 - Math.random() * 130;
    this.proj.push({ x: ENE_X + this.anchorDX() - 26, y: ENE_Y + dy, vx: -(230 + Math.random() * 70), vy: (ty - (ENE_Y + dy)) * 0.0, ph: Math.random() * 6, trail: [] });
  }
  inField(p) { const fx = FX + this.anchorDX(), fy = FY + this.anchorDY(); return this.field.state !== 'off' && this.fieldScale() > 0.4 && Math.hypot(p.x - fx, p.y - fy) < FR; }
  fieldScale() { if (this.field.state === 'off') return 0; if (this.field.state === 'up') return easeOutBack(clamp(this.field.t / 0.5, 0, 1)); if (this.field.state === 'down') return lerp(1, 0, easeInOutCubic(clamp(this.field.t / 0.5, 0, 1))); return 1; }

  drawField() {
    const s = this.fieldScale(); if (s <= 0) return; const R = FR * s;
    const fx = FX + this.anchorDX(), fy = FY + this.anchorDY();
    ctx.save();
    // dilation sphere
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(fx, fy, R * 0.2, fx, fy, R); g.addColorStop(0, rgba('#dfeaff', 0.05)); g.addColorStop(0.6, rgba(TIME, 0.10)); g.addColorStop(1, rgba('#3a5fb0', 0.20));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fx, fy, R, 0, 6.28); ctx.fill();
    // rim
    ctx.strokeStyle = rgba('#e7ecff', 0.7); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(fx, fy, R, 0, 6.28); ctx.stroke();
    ctx.strokeStyle = rgba(TIME, 0.45); ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(fx, fy, R, 0, 6.28); ctx.stroke();
    // clock ticks (slow rotation = time motif)
    const rot = this.t * 0.5; ctx.strokeStyle = rgba('#cfe0ff', 0.4); ctx.lineWidth = 1.6;
    for (let i = 0; i < 12; i++) { const a = rot + i / 12 * 6.28; ctx.beginPath(); ctx.moveTo(fx + Math.cos(a) * (R - 12), fy + Math.sin(a) * (R - 12)); ctx.lineTo(fx + Math.cos(a) * (R - 4), fy + Math.sin(a) * (R - 4)); ctx.stroke(); }
    // hands
    ctx.lineWidth = 2; ctx.strokeStyle = rgba('#e7ecff', 0.6); ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + Math.cos(this.t * 0.5) * R * 0.5, fy + Math.sin(this.t * 0.5) * R * 0.5); ctx.stroke();
    ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + Math.cos(this.t * 0.12 - 1.57) * R * 0.66, fy + Math.sin(this.t * 0.12 - 1.57) * R * 0.66); ctx.stroke();
    // slowed motes inside
    for (let i = 0; i < 10; i++) { const a = this.t * 0.2 + i * 0.63, rr = (i / 10) * R * 0.85; ctx.fillStyle = rgba('#bcd4ff', 0.4); ctx.beginPath(); ctx.arc(fx + Math.cos(a) * rr, fy + Math.sin(a * 1.2) * rr * 0.7, 1.4, 0, 6.28); ctx.fill(); }
    ctx.restore(); ctx.restore();
  }

  drawForesight() {
    if (!this.foresight) return; const fr = this.foresight; const a = fr.t < 0.3 ? fr.t / 0.3 : (fr.t > fr.dur - 0.5 ? (fr.dur - fr.t) / 0.5 : 1);
    const guardX = GUARD_X + this.anchorDX();
    ctx.save(); ctx.globalAlpha = clamp(a, 0, 1); ctx.globalCompositeOperation = 'lighter';
    // sort by x to mark nearest (smallest x) threats
    const sorted = [...this.proj].sort((p, q) => p.x - q.x);
    sorted.forEach((p, idx) => {
      // predicted path + future echo at +0.6s (full-speed prediction, ignoring field for the "intent" line)
      const fx = p.x + p.vx * 0.6, fy = p.y + p.vy * 0.6;
      ctx.strokeStyle = rgba(GOLD, 0.25); ctx.lineWidth = 1.4; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(fx, fy); ctx.stroke(); ctx.setLineDash([]);
      // ghost echo
      glow(fx, fy, 10, GOLD, 0.3); ctx.fillStyle = rgba('#fff0c8', 0.5); ctx.beginPath(); ctx.arc(fx, fy, 2.6, 0, 6.28); ctx.fill();
      // predicted impact marker on guard line
      if (p.vx < 0) { const tcross = (guardX - p.x) / p.vx; if (tcross > 0 && tcross < 1.6) { const iy = p.y + p.vy * tcross; ctx.strokeStyle = rgba(GOLD, 0.5); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(guardX, iy, 7, 0, 6.28); ctx.stroke(); ctx.beginPath(); ctx.moveTo(guardX - 3, iy); ctx.lineTo(guardX + 3, iy); ctx.moveTo(guardX, iy - 3); ctx.lineTo(guardX, iy + 3); ctx.stroke(); } }
      // insight-mark the 2 nearest
      if (idx < 2) {
        ctx.strokeStyle = rgba(GOLD, 0.85); ctx.lineWidth = 2; const b = 8; const bx = p.x, by = p.y;
        ctx.beginPath();
        ctx.moveTo(bx - b, by - b + 3); ctx.lineTo(bx - b, by - b); ctx.lineTo(bx - b + 3, by - b);
        ctx.moveTo(bx + b - 3, by - b); ctx.lineTo(bx + b, by - b); ctx.lineTo(bx + b, by - b + 3);
        ctx.moveTo(bx + b, by + b - 3); ctx.lineTo(bx + b, by + b); ctx.lineTo(bx + b - 3, by + b);
        ctx.moveTo(bx - b + 3, by + b); ctx.lineTo(bx - b, by + b); ctx.lineTo(bx - b, by + b - 3);
        ctx.stroke();
        ctx.save(); ctx.translate(bx, by - 16); this.glyphMark(this.t * 1.5); ctx.restore();
      }
    });
    ctx.restore();
  }
  glyphMark(rot) { ctx.save(); ctx.rotate(rot); ctx.strokeStyle = rgba(GOLD, 0.8); ctx.lineWidth = 1.4; ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28 - 1.57; const x = Math.cos(a) * 4, y = Math.sin(a) * 4; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.stroke(); ctx.restore(); }

  drawProj() {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const p of this.proj) {
      const slow = this.inField(p);
      // trail
      for (let i = 0; i < p.trail.length; i++) { const tp = p.trail[i], aa = i / p.trail.length; glow(tp.x, tp.y, 6 * aa, '#b266ff', 0.18 * aa); }
      glow(p.x, p.y, slow ? 13 : 10, '#b266ff', slow ? 0.85 : 0.7);
      ctx.fillStyle = slow ? '#e6d3ff' : '#d9b3ff'; ctx.beginPath(); ctx.arc(p.x, p.y, slow ? 3.2 : 2.6, 0, 6.28); ctx.fill();
      if (slow) { ctx.strokeStyle = rgba('#cfe0ff', 0.5); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, 6.28); ctx.stroke(); }
    }
    ctx.restore();
  }

  // ----- hero-local particles (slice's parts[] / emit / updP / drawP) -------
  emit(n, x, y, sp, c) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28; this.parts.push({ x: x + (Math.random() - .5) * 12, y: y + (Math.random() - .5) * 12, vx: Math.cos(a) * sp * (0.3 + Math.random()), vy: Math.sin(a) * sp * (0.3 + Math.random()) - 20, life: 0, max: 0.5 + Math.random() * 0.7, r: 1.5 + Math.random() * 2.2, c: c || TIME }); } }
  updP(dt) { for (let i = this.parts.length - 1; i >= 0; i--) { const q = this.parts[i]; q.life += dt; if (q.life >= q.max) { this.parts.splice(i, 1); continue; } q.vy += 30 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.97; } }
  drawP() { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const q of this.parts) { const a = 1 - q.life / q.max; glow(q.x, q.y, q.r * 3, q.c, a * 0.3); ctx.fillStyle = rgba(q.c, a); ctx.beginPath(); ctx.arc(q.x, q.y, q.r * a + 0.4, 0, 6.28); ctx.fill(); } ctx.restore(); }

  // ----- update: ability timelines + FX lifecycles + secondary motion -------
  update(dt) {
    super.update(dt);
    if (this.shakeRequest > 0) this.shakeRequest = Math.max(0, this.shakeRequest - dt * 30);

    // one-shot ability states auto-return to idle/walk (slice's >=0.8 check)
    if ((this.state === 'eddy' && this.stateT >= 0.8) || (this.state === 'foresight' && this.stateT >= 0.8)) {
      this.endAbility();
    }

    // premonition: brief global slow at foresight start
    let gs = 1;
    if (this.foresight) { this.foresight.t += dt; if (this.foresight.t < 0.6) { gs = lerp(0.35, 1, easeOutCubic(this.foresight.t / 0.6)); } if (this.foresight.t >= this.foresight.dur) this.foresight = null; }

    // field lifecycle
    if (this.field.state === 'up') { this.field.t += dt; if (this.field.t >= 0.5) { this.field.state = 'hold'; this.field.t = 0; this.field.hold = 0; } }
    else if (this.field.state === 'hold') { this.field.hold += dt; if (this.field.hold >= 4.5) { this.field.state = 'down'; this.field.t = 0; } }
    else if (this.field.state === 'down') { this.field.t += dt; if (this.field.t >= 0.5) this.field.state = 'off'; }

    // projectiles (re-anchored despawn line: slice culls at x<108)
    const cull = 108 + this.anchorDX();
    this.projTimer += dt; if (this.projTimer >= 0.5) { this.projTimer = 0; this.spawnProj(); }
    for (let i = this.proj.length - 1; i >= 0; i--) {
      const p = this.proj[i]; const sf = this.inField(p) ? 0.13 : 1; const eff = dt * sf * gs;
      p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > (this.inField(p) ? 10 : 5)) p.trail.shift();
      p.x += p.vx * eff; p.y += p.vy * eff;
      if (p.x < cull) { this.proj.splice(i, 1); continue; }
    }

    // secondary motion (chains in world coords anchored at this.x / this.groundY)
    const P = this.pose(); const ax = this.x, ay = this.groundY;
    stepChain(this.hairL, ax + P.sh * 0.9 - 7, ay + P.headY - 6, Math.sin(this.t * 1.4) * 0.18, 0.5, 2);
    stepChain(this.hairR, ax + P.sh * 0.9 + 5, ay + P.headY - 6, Math.sin(this.t * 1.5 + 1) * 0.18, 0.5, 2);
    stepChain(this.stole, ax + 14 + P.sh, ay + P.chestY + 2, Math.sin(this.t * 1.3) * 0.2 - 0.1, 0.7, 2);
    this.updP(dt);

    this.lastPose = P;
  }
}
