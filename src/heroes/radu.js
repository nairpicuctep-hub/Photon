// radu.js — Radu Photon (LEADER / STRIKER). PORTED from radu-photon-feelslice.html.
// Authoritative for: Radu's look, palette, states (idle / walk / lightstep /
// energyBlast + photonAura toggle) and FX. The procedural figure, the authored
// keyframe poses with anticipation/follow-through, the verlet light-mantle and
// hair, and the gathered-light beam are all reproduced here on the shared
// render toolkit.

import { ctx } from '../render/gfx.js';
import {
  lerp, clamp, easeOutCubic, easeInOutCubic, easeOutBack,
  mix, rgba, glow, star,
} from '../render/primitives.js';
import { limb, limbGrad, rimStroke, hand, boot, setFigureStyle } from '../render/figure.js';
import { makeChain, stepChain } from '../render/cloth.js';
import { emitPhotons, pushAfterimage } from '../render/particles.js';
import { RADU } from '../render/palette.js';
import { reduce } from '../core/env.js';
import { HeroBase } from './HeroBase.js';

const { SUIT_HI, SUIT_LO, SUIT_SH, SKIN_HI, SKIN_LO, SEAM, HAIR, HAIR_HI, EYE, RIM, INK } = RADU;

export class Radu extends HeroBase {
  constructor(def = {}) {
    super({ id: 'radu', name: 'Radu Photon', ...def });

    this.auraOn = false;
    this.bodyX = 0; this.bodyXv = 0; this.bodyXprev = 0;
    this.blastBeam = 0;

    // secondary-motion chains (verlet), seeded in world space near the figure
    this.mantle = makeChain(9, 12, this.x - 6, this.groundY - 146);
    this.hairA = makeChain(4, 8, this.x, this.groundY - 206);
    this.hairB = makeChain(4, 7, this.x, this.groundY - 206);

    this.lastPose = this.pose();
  }

  // ----- abilities (triggered by input) -------------------------------------
  lightstep() { if (this.state !== 'dash') this.setState('dash'); }
  energyBlast() { if (this.state !== 'blast') this.setState('blast'); }
  toggleAura() { this.auraOn = !this.auraOn; return this.auraOn; }

  // ----- pose: origin at feet; +x right; returns joint coords (local space) --
  pose() {
    const tt = this.t;
    const state = this.state, stateT = this.stateT;
    let breath = Math.sin(tt * 1.6) * 1.0;
    let hover = (state === 'idle' || state === 'blast') ? Math.sin(tt * 1.5) * 3.5 : 0;
    let lean = 0, crouch = 0, reach = 0, stretch = 0, armPull = 0, fire = 0;

    if (state === 'walk') { hover = Math.abs(Math.sin(tt * 7)) * 2.4; }
    if (state === 'dash') {
      const p = stateT / 0.72;
      if (p < 0.30) { const e = easeInOutCubic(p / 0.30); crouch = e * 10; lean = e * 10; armPull = e; }       // anticipation
      else if (p < 0.50) { const e = easeOutCubic((p - 0.30) / 0.20); lean = lerp(10, 30, e); stretch = e; }    // burst
      else { const e = easeOutBack((p - 0.50) / 0.50); lean = lerp(30, 0, clamp(e, 0, 1)); }                    // recovery
    }
    if (state === 'blast') {
      const p = stateT / 0.85;
      if (p < 0.47) { const e = easeInOutCubic(p / 0.47); armPull = e; lean = -e * 7; }                         // wind-up
      else if (p < 0.56) { const e = (p - 0.47) / 0.09; reach = easeOutCubic(e); fire = 1; lean = lerp(-7, 6, e); } // fire
      else { const e = (p - 0.56) / 0.44; reach = 1 - easeInOutCubic(e); lean = lerp(6, 0, easeOutCubic(e)); }   // settle
    }

    const cx = 0;
    const hipY = -108, chestY = -168 + breath * 0.4, neckY = -186, headY = -208;
    const legSwing = state === 'walk' ? Math.sin(tt * 7) : 0;
    const armSwing = state === 'walk' ? Math.sin(tt * 7 + Math.PI) : 0;

    // legs
    const stanceL = -11 - crouch * 0.2, stanceR = 11 + crouch * 0.2;
    const kneeY = hipY * 0.5 - crouch * 0.6;
    const legL = { hip: { x: cx - 9, y: hipY }, knee: { x: cx - 12 + legSwing * 10, y: kneeY }, foot: { x: cx + stanceL + legSwing * 16, y: -2 - Math.max(0, legSwing) * 8 } };
    const legR = { hip: { x: cx + 9, y: hipY }, knee: { x: cx + 12 - legSwing * 10, y: kneeY }, foot: { x: cx + stanceR - legSwing * 16, y: -2 - Math.max(0, -legSwing) * 8 } };

    // torso lean as x offset of upper body
    const up = (lean) * 0.6;

    // shoulders
    const shL = { x: cx - 17 + up * 0.5, y: chestY }, shR = { x: cx + 17 + up * 0.5, y: chestY };

    // arms — front arm (right) drives abilities
    let elbowR, handR, elbowL, handL;
    // back arm (left)
    elbowL = { x: cx - 22 + up + armSwing * 6, y: chestY + 24 };
    handL = { x: cx - 20 + up + armSwing * 12, y: chestY + 46 + Math.max(0, armSwing) * 6 };
    // right arm
    if (state === 'dash') {
      const f = stretch;
      elbowR = { x: cx + 14 + up + f * 18, y: chestY + 18 - f * 6 };
      handR = { x: cx + 18 + up + f * 46, y: chestY + 30 - f * 22 };
      elbowL = { x: cx - 18 + up - f * 10, y: chestY + 26 + f * 6 };
      handL = { x: cx - 22 + up - f * 22, y: chestY + 44 + f * 10 };
    } else if (state === 'blast') {
      const pull = armPull, r = reach;
      // both hands come together for a focused beam, then thrust forward
      const baseX = cx + up, fx = lerp(-6, 56, r);
      elbowR = { x: baseX + 14 + fx * 0.5, y: chestY + 16 };
      handR = { x: baseX + lerp(6, 60, r), y: chestY + 22 - lerp(0, 4, r) };
      elbowL = { x: baseX + 8 + fx * 0.45, y: chestY + 22 };
      handL = { x: baseX + lerp(2, 52, r), y: chestY + 30 - lerp(0, 4, r) };
      // during wind-up pull hands back/in
      handR.x -= pull * 16; handL.x -= pull * 14; handR.y += pull * 4; handL.y += pull * 6;
    } else {
      elbowR = { x: cx + 22 + up - armSwing * 6, y: chestY + 24 };
      handR = { x: cx + 20 + up - armSwing * 12, y: chestY + 46 + Math.max(0, -armSwing) * 6 };
    }

    return { hipY, chestY, neckY, headY, up, hover, shL, shR, elbowL, handL, elbowR, handR, legL, legR, fire, reach, crouch };
  }

  // ----- draw: full figure --------------------------------------------------
  draw() {
    const P = this.lastPose;
    setFigureStyle(INK, RIM);
    ctx.save();
    ctx.translate(this.x + this.bodyX, this.groundY - P.hover);

    // ground contact shadow
    ctx.save(); ctx.globalAlpha = 0.34; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(0, 6 + P.hover * 0.4, 46 - P.hover * 0.3, 12, 0, 0, 6.2832); ctx.fill(); ctx.restore();

    // personal dawn glow
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(0, P.chestY, 150 + (this.auraOn ? 70 : 0), '#ffd87a', 0.18 + (this.auraOn ? 0.12 : 0));
    ctx.restore();

    // light-mantle ribbon (behind)
    this.drawMantle(P);

    // back arm + back leg (slightly darker = depth)
    limb(P.shL, P.elbowL, P.handL, 11, limbGrad(P.shL, P.handL, mix(SUIT_HI, SUIT_LO, 0.4), SUIT_SH));
    limb(P.legL.hip, P.legL.knee, P.legL.foot, 14, limbGrad(P.legL.hip, P.legL.foot, mix(SUIT_HI, SUIT_LO, 0.5), SUIT_SH));
    boot(P.legL.foot, true, SUIT_HI, SUIT_LO, SUIT_SH);
    hand(P.handL, 0.7, SKIN_HI, SKIN_LO);

    // torso
    this.drawTorso(P);

    // front leg
    limb(P.legR.hip, P.legR.knee, P.legR.foot, 15, limbGrad(P.legR.hip, P.legR.foot, SUIT_HI, SUIT_LO));
    boot(P.legR.foot, false, SUIT_HI, SUIT_LO, SUIT_SH);

    // front arm
    limb(P.shR, P.elbowR, P.handR, 12.5, limbGrad(P.shR, P.handR, SUIT_HI, SUIT_LO));
    hand(P.handR, 1, SKIN_HI, SKIN_LO);

    // gathered light during blast
    if (this.state === 'blast') this.drawBlastFX(P);

    // head, hair, face
    this.drawHead(P);

    // rim-light pass (additive)
    rimStroke(P.shR, P.elbowR, P.handR, 12.5);
    rimStroke(P.legR.hip, P.legR.knee, P.legR.foot, 15);
    rimStroke(P.shL, P.elbowL, P.handL, 11);

    ctx.restore();
  }

  drawTorso(P) {
    const topY = P.chestY - 6, botY = P.hipY + 6, lean = P.up;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-18 + lean, topY);
    ctx.quadraticCurveTo(-22 + lean * 0.6, (topY + botY) / 2, -13, botY);
    ctx.quadraticCurveTo(0, botY + 7, 13, botY);
    ctx.quadraticCurveTo(22 + lean * 0.6, (topY + botY) / 2, 18 + lean, topY);
    ctx.quadraticCurveTo(0, topY - 9, -18 + lean, topY);
    ctx.closePath();
    ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.stroke();
    const g = ctx.createLinearGradient(-20 + lean, topY, 18, botY);
    g.addColorStop(0, SUIT_HI); g.addColorStop(0.6, mix(SUIT_HI, SUIT_LO, 0.55)); g.addColorStop(1, SUIT_LO);
    ctx.fillStyle = g; ctx.fill();
    // core seam (glowing)
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const cg = ctx.createLinearGradient(0, topY, 0, botY);
    cg.addColorStop(0, rgba(SEAM, 0.0)); cg.addColorStop(0.5, rgba(SEAM, 0.9)); cg.addColorStop(1, rgba(SEAM, 0.0));
    ctx.strokeStyle = cg; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lean * 0.5, topY + 2); ctx.lineTo(0, botY - 2); ctx.stroke();
    // chest star
    glow(lean * 0.4, (topY + botY) / 2 - 6, 16 + (this.auraOn ? 6 : 0), '#fff7d6', 0.95);
    ctx.fillStyle = '#fffdf5'; star(lean * 0.4, (topY + botY) / 2 - 6, 6.5, 3.0, 4); ctx.fill();
    ctx.restore();
    // belt
    ctx.strokeStyle = rgba(INK, 0.6); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-13, botY - 1); ctx.lineTo(13, botY - 1); ctx.stroke();
    ctx.restore();
  }

  drawHead(P) {
    const hx0 = P.up * 0.9, hy = P.headY;
    ctx.save();
    // neck
    ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineWidth = 12.5; ctx.beginPath(); ctx.moveTo(hx0 * 0.6, P.chestY - 4); ctx.lineTo(hx0, hy + 15); ctx.stroke();
    ctx.strokeStyle = mix(SKIN_HI, SKIN_LO, 0.4); ctx.lineWidth = 9.5; ctx.beginPath(); ctx.moveTo(hx0 * 0.6, P.chestY - 4); ctx.lineTo(hx0, hy + 15); ctx.stroke();

    // back hair (behind head)
    this.drawHair(P, true);

    // head shape
    ctx.beginPath(); ctx.ellipse(hx0, hy, 20, 22, 0, 0, 6.2832);
    ctx.strokeStyle = INK; ctx.lineWidth = 3.2; ctx.stroke();
    const g = ctx.createRadialGradient(hx0 - 7, hy - 9, 3, hx0, hy, 26); g.addColorStop(0, SKIN_HI); g.addColorStop(1, SKIN_LO);
    ctx.fillStyle = g; ctx.fill();

    // ear
    ctx.fillStyle = mix(SKIN_HI, SKIN_LO, 0.5); ctx.beginPath(); ctx.ellipse(hx0 - 17, hy + 2, 4, 6, 0, 0, 6.28); ctx.fill();

    // face: eyes (cyan photon), brow, nose, soft smile
    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; glow(hx0 + 5, hy - 1, 10, EYE, 0.7); glow(hx0 - 7, hy - 1, 7, EYE, 0.4); ctx.restore();
    ctx.fillStyle = EYE; ctx.beginPath(); ctx.ellipse(hx0 + 6, hy - 1, 3.2, 4.4, 0, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.ellipse(hx0 - 5, hy - 1, 2.6, 3.8, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx0 + 7, hy - 2.5, 1.1, 0, 6.28); ctx.fill();
    // brow
    ctx.strokeStyle = rgba(INK, 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx0 + 1, hy - 7); ctx.quadraticCurveTo(hx0 + 6, hy - 9, hx0 + 11, hy - 6.5); ctx.stroke();
    // nose + mouth
    ctx.lineWidth = 1.6; ctx.strokeStyle = rgba(INK, 0.55);
    ctx.beginPath(); ctx.moveTo(hx0 + 11, hy + 1); ctx.lineTo(hx0 + 9, hy + 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx0 + 3, hy + 11); ctx.quadraticCurveTo(hx0 + 9, hy + 14, hx0 + 13, hy + 10); ctx.stroke();

    // front hair (over forehead)
    this.drawHair(P, false);

    // head rim
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(RIM, 0.5); ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.ellipse(hx0 + 2, hy - 1, 20, 22, 0, -2.5, -0.2); ctx.stroke(); ctx.restore();
    ctx.restore();
  }

  drawHair(P, back) {
    const hx0 = P.up * 0.9, hy = P.headY;
    if (back) {
      ctx.fillStyle = mix(HAIR, '#9a6a1e', 0.35);
      ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
      // back mass
      ctx.beginPath(); ctx.moveTo(hx0 - 18, hy - 6); ctx.quadraticCurveTo(hx0 - 26, hy - 26, hx0 - 6, hy - 28);
      ctx.quadraticCurveTo(hx0 + 4, hy - 30, hx0 + 8, hy - 22); ctx.quadraticCurveTo(hx0 - 2, hy - 20, hx0 - 18, hy - 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      return;
    }
    // front swept hair mass
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(hx0 - 19, hy - 4);
    ctx.quadraticCurveTo(hx0 - 22, hy - 24, hx0 - 2, hy - 27);
    ctx.quadraticCurveTo(hx0 + 16, hy - 29, hx0 + 21, hy - 12);
    ctx.quadraticCurveTo(hx0 + 22, hy - 4, hx0 + 15, hy - 7);
    ctx.quadraticCurveTo(hx0 + 10, hy - 16, hx0 + 2, hy - 13);
    ctx.quadraticCurveTo(hx0 - 2, hy - 7, hx0 - 8, hy - 13);
    ctx.quadraticCurveTo(hx0 - 12, hy - 6, hx0 - 19, hy - 4);
    ctx.closePath();
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
    const g = ctx.createLinearGradient(hx0, hy - 28, hx0, hy - 2); g.addColorStop(0, HAIR_HI); g.addColorStop(1, '#d89a2a');
    ctx.fillStyle = g; ctx.fill();
    // shine
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba('#fff7d6', 0.55); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(hx0 - 6, hy - 22); ctx.quadraticCurveTo(hx0 + 6, hy - 25, hx0 + 14, hy - 16); ctx.stroke(); ctx.restore();
    ctx.restore();

    // flowing strand tips (secondary motion) from hair chains (additive-ish gold)
    ctx.save();
    const ax = this.x + this.bodyX, ay = this.groundY - P.hover; // chains are world; convert to local
    ctx.strokeStyle = mix(HAIR, '#ffe6a0', 0.4); ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const ch of [this.hairA, this.hairB]) {
      ctx.beginPath();
      for (let i = 0; i < ch.pts.length; i++) { const lx = ch.pts[i].x - ax, ly = ch.pts[i].y - ay; if (i === 0) ctx.moveTo(lx, ly); else ctx.lineTo(lx, ly); }
      ctx.stroke();
    }
    ctx.restore();
  }

  drawMantle(P) {
    // ribbon along mantle chain (world coords -> local)
    const ax = this.x + this.bodyX, ay = this.groundY - P.hover;
    const pts = this.mantle.pts.map(p => ({ x: p.x - ax, y: p.y - ay }));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      const wBase = pass ? 7 : 13;
      for (let i = 0; i < pts.length; i++) { const w = wBase * (1 - i / pts.length); const nx = i < pts.length - 1 ? pts[i + 1].y - pts[i].y : 0, ny = i < pts.length - 1 ? -(pts[i + 1].x - pts[i].x) : 0; const d = Math.hypot(nx, ny) || 1; const ox2 = nx / d * w, oy2 = ny / d * w; if (i === 0) ctx.moveTo(pts[i].x + ox2, pts[i].y + oy2); else ctx.lineTo(pts[i].x + ox2, pts[i].y + oy2); }
      for (let i = pts.length - 1; i >= 0; i--) { const w = wBase * (1 - i / pts.length); const nx = i < pts.length - 1 ? pts[i + 1].y - pts[i].y : 0, ny = i < pts.length - 1 ? -(pts[i + 1].x - pts[i].x) : 0; const d = Math.hypot(nx, ny) || 1; const ox2 = nx / d * w, oy2 = ny / d * w; ctx.lineTo(pts[i].x - ox2, pts[i].y - oy2); }
      ctx.closePath();
      const g = ctx.createLinearGradient(pts[0].x, pts[0].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
      g.addColorStop(0, rgba(pass ? '#fffdf5' : '#ffd24a', pass ? 0.5 : 0.42)); g.addColorStop(1, rgba('#ff9d54', 0));
      ctx.fillStyle = g; ctx.fill();
    }
    ctx.restore();
  }

  drawBlastFX(P) {
    const r = P.reach;
    // gathered orb at hands (local space)
    const ox2 = lerp(2, 58, r) + P.up, oy2 = P.chestY + 24;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const charge = this.stateT < 0.47 * 0.85 ? easeInOutCubic(this.stateT / (0.47 * 0.85)) : 1;
    glow(ox2, oy2, 14 + charge * 14, '#fff7d6', 0.9); glow(ox2, oy2, 28 + charge * 16, '#ffd24a', 0.5);
    ctx.fillStyle = '#fffef8'; ctx.beginPath(); ctx.arc(ox2, oy2, 5 + charge * 4, 0, 6.28); ctx.fill();
    ctx.restore();
  }

  /** World-space origin of the energy beam (for the scene to draw it across). */
  beamOrigin() {
    const P = this.lastPose;
    return {
      x: this.x + this.bodyX + lerp(2, 58, P.reach) + P.up,
      y: this.groundY - P.hover + (P.chestY + 24),
    };
  }

  // ----- update: ability timelines + secondary motion -----------------------
  update(dt) {
    super.update(dt);
    this.bodyXprev = this.bodyX;

    if (this.state === 'dash') {
      const p = this.stateT / 0.72;
      let target = p < 0.30 ? 0 : p < 0.50 ? lerp(0, 150, easeOutCubic((p - 0.30) / 0.20)) : lerp(150, 0, easeInOutCubic((p - 0.50) / 0.50));
      this.bodyX = target;
      if (p > 0.30 && p < 0.55 && !reduce && Math.random() < 0.8) { pushAfterimage(this.x + this.bodyX, this.groundY - Math.sin(this.t * 1.5) * 3 - 120, 0.3); }
      if (p > 0.30 && p < 0.55) emitPhotons(2, this.x + this.bodyX, this.groundY - 110, 120, 20);
      if (p >= 1) { this.endAbility(); this.bodyX = 0; }
    } else if (this.state === 'blast') {
      const p = this.stateT / 0.85;
      if (p >= 0.47 && p < 0.66) { this.blastBeam = Math.min(1, this.blastBeam + dt * 12); }
      else this.blastBeam = Math.max(0, this.blastBeam - dt * 5);
      if (p >= 0.47 && p < 0.52) emitPhotons(3, this.x + this.bodyX + 60, this.groundY - 150, 160, 0);
      if (p >= 1) { this.endAbility(); this.blastBeam = 0; }
    } else {
      this.blastBeam = Math.max(0, this.blastBeam - dt * 6);
      this.bodyX = lerp(this.bodyX, 0, Math.min(1, dt * 8));
      if (this.auraOn && Math.random() < 0.5) emitPhotons(1, this.x + (Math.random() - 0.5) * 40, this.groundY - 120, 50, 30);
      else if (Math.random() < 0.18) emitPhotons(1, this.x + (Math.random() - 0.5) * 30, this.groundY - 130, 40, 25);
    }

    this.bodyXv = (this.bodyX - this.bodyXprev);

    // secondary motion: mantle from upper-back, hair from crown
    const P = this.pose();
    const ax = this.x + this.bodyX, ay = this.groundY - P.hover;
    const force = -this.bodyXv * 0.5;
    stepChain(this.mantle, ax - 8 + P.up * 0.5, ay + P.chestY - 2, force + Math.sin(this.t * 2) * 0.25, -0.55 + Math.sin(this.t * 1.7) * 0.2, 3);
    stepChain(this.hairA, ax + P.up * 0.9 - 6, ay + P.headY - 24, force * 0.8, -0.35, 2);
    stepChain(this.hairB, ax + P.up * 0.9 + 6, ay + P.headY - 24, force * 0.8 + 0.1, -0.3, 2);

    this.lastPose = P;
  }
}
