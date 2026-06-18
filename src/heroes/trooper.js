// trooper.js — Light Trooper, the cheap ranged backbone you spam to hold the
// lane. Not feel-slice-defined; built simply on the shared figure toolkit at a
// lower fidelity than the heroes (clean ink + gold/white light accents).

import { ctx } from '../render/gfx.js';
import { lerp, mix, rgba, glow, easeOutCubic } from '../render/primitives.js';
import { limb, limbGrad, rimStroke, hand, boot, setFigureStyle } from '../render/figure.js';
import { HeroBase } from './HeroBase.js';

const INK = '#1c2030', RIM = '#eafcff';
const SUIT_HI = '#dfe7ff', SUIT_LO = '#7f8ab0', SUIT_SH2 = '#3c445f';
const SKIN_HI = '#fff0d8', SKIN_LO = '#cf9a64';

export class Trooper extends HeroBase {
  static MOVES = [
    { key: '1', label: 'Idle', state: 'idle' },
    { key: '2', label: 'Walk', state: 'walk' },
    { key: '3', label: 'Light Bolt', method: 'shoot' },
  ];

  constructor(def = {}) {
    super({ id: 'trooper', name: 'Light Trooper', ...def });
    this.fire = 0;
    this.lastPose = this.pose();
  }

  shoot() { if (this.state !== 'shoot') this.setState('shoot'); }

  pose() {
    const tt = this.t, state = this.state, stateT = this.stateT;
    const breath = Math.sin(tt * 1.8) * 1.0;
    let hover = (state === 'idle') ? Math.sin(tt * 1.5) * 1.6 : 0;
    let reach = 0;
    if (state === 'walk') hover = Math.abs(Math.sin(tt * 8)) * 2.2;
    if (state === 'shoot') {
      const p = stateT / 0.5;
      if (p < 0.4) reach = easeOutCubic(p / 0.4); else reach = 1 - (p - 0.4) / 0.6;
    }
    const hipY = -78, chestY = -120 + breath * 0.4, headY = -150;
    const legSwing = state === 'walk' ? Math.sin(tt * 8) : 0;
    const legL = { hip: { x: -6, y: hipY }, knee: { x: -8 + legSwing * 7, y: hipY * 0.5 }, foot: { x: -9 + legSwing * 12, y: -2 - Math.max(0, legSwing) * 6 } };
    const legR = { hip: { x: 6, y: hipY }, knee: { x: 8 - legSwing * 7, y: hipY * 0.5 }, foot: { x: 9 - legSwing * 12, y: -2 - Math.max(0, -legSwing) * 6 } };
    const shL = { x: -12, y: chestY }, shR = { x: 12, y: chestY };
    const elbowL = { x: -16, y: chestY + 18 }, handL = { x: -18, y: chestY + 34 };
    const elbowR = { x: 14 + reach * 12, y: chestY + 14 - reach * 4 };
    const handR = { x: 16 + reach * 30, y: chestY + 22 - reach * 8 };
    return { hipY, chestY, headY, hover, shL, shR, elbowL, handL, elbowR, handR, legL, legR, reach };
  }

  draw() {
    const P = this.lastPose;
    setFigureStyle(INK, RIM);
    ctx.save();
    ctx.translate(this.x, this.groundY - P.hover);
    // shadow
    ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, 5, 28, 8, 0, 0, 6.28); ctx.fill(); ctx.restore();
    // faint aura
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(0, P.chestY, 70, '#cfe0ff', 0.12); ctx.restore();
    // back limbs
    limb(P.shL, P.elbowL, P.handL, 7, limbGrad(P.shL, P.handL, mix(SUIT_HI, SUIT_LO, 0.5), SUIT_SH2));
    limb(P.legL.hip, P.legL.knee, P.legL.foot, 9, limbGrad(P.legL.hip, P.legL.foot, mix(SUIT_HI, SUIT_LO, 0.5), SUIT_SH2));
    boot(P.legL.foot, true, SUIT_HI, SUIT_LO, SUIT_SH2);
    hand(P.handL, 0.6, SKIN_HI, SKIN_LO);
    // torso
    const topY = P.chestY - 4, botY = P.hipY + 4;
    ctx.beginPath(); ctx.moveTo(-12, topY); ctx.quadraticCurveTo(-14, (topY + botY) / 2, -9, botY);
    ctx.quadraticCurveTo(0, botY + 5, 9, botY); ctx.quadraticCurveTo(14, (topY + botY) / 2, 12, topY);
    ctx.quadraticCurveTo(0, topY - 6, -12, topY); ctx.closePath();
    const g = ctx.createLinearGradient(-12, topY, 12, botY); g.addColorStop(0, SUIT_HI); g.addColorStop(1, SUIT_LO);
    ctx.fillStyle = g; ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.fill(); ctx.stroke();
    // chest light
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(0, (topY + botY) / 2, 9, '#fff7d6', 0.8); ctx.restore();
    // front leg + arm
    limb(P.legR.hip, P.legR.knee, P.legR.foot, 10, limbGrad(P.legR.hip, P.legR.foot, SUIT_HI, SUIT_LO));
    boot(P.legR.foot, false, SUIT_HI, SUIT_LO, SUIT_SH2);
    limb(P.shR, P.elbowR, P.handR, 8, limbGrad(P.shR, P.handR, SUIT_HI, SUIT_LO));
    hand(P.handR, 1, SKIN_HI, SKIN_LO);
    // muzzle glow when shooting
    if (this.state === 'shoot' && P.reach > 0.5) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(P.handR.x, P.handR.y, 12, '#ffe28a', 0.8); ctx.restore(); }
    // head + helmet
    const hy = P.headY;
    ctx.beginPath(); ctx.ellipse(0, hy, 13, 14, 0, 0, 6.28); ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.stroke();
    const hg = ctx.createRadialGradient(-4, hy - 5, 2, 0, hy, 16); hg.addColorStop(0, SKIN_HI); hg.addColorStop(1, SKIN_LO); ctx.fillStyle = hg; ctx.fill();
    // helmet
    ctx.fillStyle = mix(SUIT_HI, SUIT_LO, 0.3); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, hy - 2, 14, Math.PI * 1.05, Math.PI * 1.95); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#bfe0ff'; ctx.beginPath(); ctx.ellipse(5, hy - 1, 2, 2.6, 0, 0, 6.28); ctx.fill();
    // rim
    rimStroke(P.shR, P.elbowR, P.handR, 8);
    rimStroke(P.legR.hip, P.legR.knee, P.legR.foot, 10);
    ctx.restore();
  }

  update(dt) {
    super.update(dt);
    if (this.state === 'shoot' && this.stateT >= 0.5) this.endAbility();
    this.lastPose = this.pose();
  }
}
