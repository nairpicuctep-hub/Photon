// floris.js — Floris Cunoasterea (SUPPORT / INTEL). PORTED from
// floris-cunoasterea-feelslice.html. Authoritative for: Floris's look, emerald
// lore-keeper palette, states (idle / glide=walk / reveal + barrage one-shots)
// and FX. The robed scholar figure, the floating tome, the orbiting glyph halo,
// the Reveal / Illuminate wavefront and the Codex Barrage arc are reproduced
// here on the shared render toolkit.
//
// SELF-CONTAINED NOTE: the feel slice's Reveal wavefront and Codex Barrage are
// aimed at three demo "cloaked foes" placed in world space to the hero's right.
// To keep Floris self-contained (renders in any state with no external props),
// those reveal-target dummies are reproduced verbatim BUT re-anchored relative
// to the hero (offsets from this.x / this.groundY) so the wavefront still peels
// shadow off them and the barrage still rains on what was uncovered — exactly
// the slice's drawFoe / drawReveal / drawBombs math, just hero-relative.

import { ctx } from '../render/gfx.js';
import {
  lerp, clamp, easeOutCubic, easeInOutCubic,
  mix, rgba, glow, star,
} from '../render/primitives.js';
import { hand, setFigureStyle } from '../render/figure.js';
import { makeChain, stepChain } from '../render/cloth.js';
import { reduce } from '../core/env.js';
import { HeroBase } from './HeroBase.js';

// Floris's OWN palette (emerald lore-keeper, gilded pages) — copied verbatim
// from the slice's palette block. Note Floris has his own INK/RIM (NOT Radu's).
const INK = '#102013', RIM = '#eafff7', SKIN_HI = '#fff1d8', SKIN_LO = '#cf9a5c';
const fHI = '#7df0bf', fLO = '#1f9c6e', fSH = '#114a38';
const MANTLE = '#15634a', MANTLE_SH = '#0c3a2b';
const GILD = '#ffcf6e', GILD_SH = '#b88a2e';
const TOME = '#fff0c8', TGLOW = '#ffd27a', GLYPH = '#9bf0cf', LENS = '#ffe2a0';
const fHAIR = '#5a4326', fHAIRHI = '#86653a';

// reveal wavefront origin offsets (slice: REV_OX=FLO_X+30, REV_OY=GROUND-118)
const REV_OX = 30, REV_OY = -118;
// slice demo-foe world layout (FLO_X=300, GROUND=508): foes at 636/720/802 on
// the ground. Re-expressed as offsets from the hero so they are self-contained.
const FOE_DEF = [
  { dx: 636 - 300, dy: 0, ph: 1.7 },
  { dx: 720 - 300, dy: 0, ph: 3.9 },
  { dx: 802 - 300, dy: 0, ph: 5.2 },
];

export class Floris extends HeroBase {
  constructor(def = {}) {
    super({ id: 'floris', name: 'Floris Cunoasterea', ...def });

    this.bodyX = 0;
    this.shakeRequest = 0;   // scene reads + decays; replaces the slice's global shake
    this.flash = 0;

    // ability/FX state (slice module globals -> instance fields)
    this.parts = [];
    this.reveal = null;
    this.bombs = [];
    // self-contained reveal targets (the slice's demo foes, hero-relative)
    this.foes = FOE_DEF.map(f => ({ dx: f.dx, dy: f.dy, rev: false, rt: 0, mark: 0, ph: f.ph }));

    // secondary-motion chains (verlet), seeded in world space near the figure.
    // Floris's visible robe/mantle use the slice's exact sine-driven math (see
    // deviations); these chains are seeded for structural parity with radu.js
    // and drive a faint trailing hem accent only.
    this.mantle = makeChain(7, 10, this.x - 6, this.groundY - 150);
    this.hairA = makeChain(4, 7, this.x, this.groundY - 186);
    this.hairB = makeChain(4, 6, this.x, this.groundY - 186);

    this.lastPose = this.pose();
  }

  // ----- abilities (triggered by input) -------------------------------------
  glide() { if (this.state !== 'glide') this.setState('glide'); }
  reveal_() { this.castReveal(); }
  barrage() { this.castBarrage(); }

  // slice: castReveal()
  castReveal() {
    this.reveal = { t: 0, dur: 0.95 };
    this.setState('reveal');
  }
  // slice: castBarrage()
  castBarrage() {
    this.setState('barrage');
    const P = this.pose();
    const tomeX = P.handR.x + 10;        // local (slice used FLO_X+handR.x+10 world)
    const tomeY = REV_OY;                // local GROUND-118
    for (let i = 0; i < 6; i++) {
      const tx = (624 - 300) + Math.random() * 200;  // hero-relative ground target
      this.bombs.push({ x: tomeX, y: tomeY, vx: 0, vy: 0, gx: tx, delay: 0.3 + i * 0.16, launched: false, t: 0 });
    }
  }

  glyph(x, y, s, rot, c, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a; ctx.strokeStyle = c; ctx.lineWidth = 1.6; ctx.beginPath();
    ctx.moveTo(-s, -s); ctx.lineTo(s, -s); ctx.moveTo(0, -s); ctx.lineTo(0, s); ctx.moveTo(-s * 0.7, s); ctx.lineTo(s * 0.7, s); ctx.moveTo(-s, 0); ctx.lineTo(s, 0); ctx.stroke(); ctx.restore();
  }

  // ----- pose: origin at feet; +x right; returns joint coords (local space) --
  // slice: flPose()
  pose() {
    const tt = this.t; const breath = Math.sin(tt * 1.4) * 0.8; let hover = 6 + Math.sin(tt * 1.3) * 4, lean = 0, raise = 0, up2 = 0;
    if (this.state === 'glide') { lean = 6; hover = 10 + Math.sin(tt * 2) * 5; }
    if (this.state === 'reveal') { const p = this.stateT / 0.9; if (p < 0.4) { const e = easeInOutCubic(p / 0.4); raise = e; } else { const e = (p - 0.4) / 0.6; raise = 1 - easeOutCubic(e) * 0.4; } }
    if (this.state === 'barrage') { const p = this.stateT / 1.0; if (p < 0.4) { const e = easeInOutCubic(p / 0.4); up2 = e; } else { const e = (p - 0.4) / 0.6; up2 = 1 - easeInOutCubic(e); } }
    const chestY = -150 + breath * 0.4, headY = -186, sh = lean;
    const shL = { x: -18 + sh, y: chestY }, shR = { x: 18 + sh, y: chestY };
    // sleeves/hands
    let elbowL = { x: -24 + sh, y: chestY + 22 }, handL = { x: -22 + sh, y: chestY + 40 };
    let elbowR, handR;
    if (this.state === 'reveal') { const r = raise; elbowR = { x: 20 + sh + r * 8, y: chestY + 12 - r * 6 }; handR = { x: 26 + sh + r * 22, y: chestY + 24 - r * 22 }; }
    else if (this.state === 'barrage') { const u = up2; elbowR = { x: 18 + sh, y: lerp(chestY + 16, chestY - 14, u) }; handR = { x: lerp(24, 18, u) + sh, y: lerp(chestY + 30, chestY - 40, u) }; elbowL = { x: -18 + sh, y: lerp(chestY + 16, chestY - 14, u) }; handL = { x: lerp(-24, -18, u) + sh, y: lerp(chestY + 30, chestY - 40, u) }; }
    else { elbowR = { x: 24 + sh, y: chestY + 18 }; handR = { x: 24 + sh, y: chestY + 36 }; }
    return { chestY, headY, hover, sh, raise, up2, shL, shR, elbowL, handL, elbowR, handR };
  }

  // slice: sleeve(a,b,c,w,hi,lo)
  sleeve(a, b, c, w, hi, lo) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = w + 3.4; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(b.x, b.y, c.x, c.y); ctx.stroke();
    const g = ctx.createLinearGradient(a.x, a.y, c.x, c.y); g.addColorStop(0, hi); g.addColorStop(1, lo); ctx.strokeStyle = g; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(b.x, b.y, c.x, c.y); ctx.stroke();
    // cuff
    ctx.fillStyle = GILD; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(c.x, c.y, 5.5, 0, 6.28); ctx.fill(); ctx.stroke();
  }

  // ----- draw: full figure --------------------------------------------------
  // slice: drawFloris()
  draw() {
    const P = this.lastPose;
    setFigureStyle(INK, RIM);

    // self-contained reveal targets + sweeping wavefront live behind/around the
    // figure in the hero's local frame (slice drew foes + reveal before Floris).
    ctx.save();
    ctx.translate(this.x + (this.bodyX || 0), this.groundY);
    for (const f of this.foes) this.drawFoe(f);
    this.drawReveal();
    ctx.restore();

    ctx.save(); ctx.translate(this.x + (this.bodyX || 0), this.groundY - P.hover);
    ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, 8 + P.hover * 0.5, 36, 10, 0, 0, 6.28); ctx.fill(); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(0, P.chestY + 10, 120, '#4fe0a0', 0.12); ctx.restore();
    // back sleeve
    this.sleeve(P.shL, P.elbowL, P.handL, 14, mix(fHI, fLO, 0.45), fSH); hand(P.handL, 0.7, SKIN_HI, SKIN_LO);
    this.drawRobe(P);
    this.drawMantle(P);
    // front sleeve + hand
    this.sleeve(P.shR, P.elbowR, P.handR, 15, fHI, fLO); hand(P.handR, 1, SKIN_HI, SKIN_LO);
    this.drawTome(P);
    this.drawHead(P);
    this.drawGlyphHalo(P);
    ctx.restore();

    // barrage projectiles + particles ride above the figure, hero-relative
    ctx.save(); ctx.translate(this.x + (this.bodyX || 0), this.groundY);
    this.drawBombs();
    this.drawP();
    ctx.restore();
  }

  // slice: drawRobe(P)
  drawRobe(P) {
    const topY = P.chestY + 6; ctx.save();
    const widthTop = 20, widthHem = 42; const pts = [];
    for (let i = 0; i <= 5; i++) { const u = i / 5; const x = lerp(-widthHem, widthHem, u); const y = -2 + Math.sin(this.t * 1.5 + u * 5) * 3; pts.push({ x: x + P.sh * 0.6, y }); }
    ctx.beginPath(); ctx.moveTo(-widthTop + P.sh, topY);
    ctx.quadraticCurveTo(-widthHem * 0.7 + P.sh, (topY - 2) / 2, pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.quadraticCurveTo(widthHem * 0.7 + P.sh, (topY - 2) / 2, widthTop + P.sh, topY);
    ctx.quadraticCurveTo(0, topY - 6, -widthTop + P.sh, topY); ctx.closePath();
    ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.lineJoin = 'round'; ctx.stroke();
    const g = ctx.createLinearGradient(0, topY, 0, -2); g.addColorStop(0, fHI); g.addColorStop(0.5, mix(fHI, fLO, 0.5)); g.addColorStop(1, fLO); ctx.fillStyle = g; ctx.fill();
    // fold lines
    ctx.strokeStyle = rgba(INK, 0.35); ctx.lineWidth = 2;
    for (const fx of [-22, -8, 8, 22]) { ctx.beginPath(); ctx.moveTo(fx * 0.4 + P.sh, topY + 6); ctx.quadraticCurveTo(fx * 0.8 + P.sh, (topY) / 2, fx + P.sh + Math.sin(this.t * 1.5 + fx) * 2, -3); ctx.stroke(); }
    // gilded hem trim
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(GILD, 0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke(); ctx.restore();
    ctx.restore();
  }

  // slice: drawMantle(P)
  drawMantle(P) {
    const y = P.chestY + 2; ctx.save();
    ctx.fillStyle = MANTLE; ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(-22 + P.sh, y); ctx.quadraticCurveTo(0, y - 12, 22 + P.sh, y); ctx.quadraticCurveTo(16 + P.sh, y + 16, 8 + P.sh, y + 12); ctx.quadraticCurveTo(0, y + 6, -8 + P.sh, y + 12); ctx.quadraticCurveTo(-16 + P.sh, y + 16, -22 + P.sh, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    // collar gem
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(P.sh, y + 2, 9, GILD, 0.8); ctx.restore(); ctx.fillStyle = GILD; star(P.sh, y + 2, 4.5, 2, 5); ctx.fill();
    ctx.restore();
  }

  // slice: drawTome(P) — floating open book near right hand
  drawTome(P) {
    const bx = P.handR.x + 10, by = P.handR.y - 18 + Math.sin(this.t * 2.2) * 3, op = this.state === 'barrage' ? 0.4 : 1;
    ctx.save(); ctx.translate(bx, by); ctx.rotate(Math.sin(this.t * 1.4) * 0.06 - 0.05);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(0, 0, 26, TGLOW, 0.5 + (this.reveal ? 0.3 : 0)); ctx.restore();
    // covers
    ctx.fillStyle = mix(GILD, GILD_SH, 0.4); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-16, -2); ctx.lineTo(-1, -6); ctx.lineTo(-1, 12); ctx.lineTo(-16, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(16, -2); ctx.lineTo(1, -6); ctx.lineTo(1, 12); ctx.lineTo(16, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    // pages
    ctx.fillStyle = TOME; ctx.beginPath(); ctx.moveTo(-15, -1); ctx.lineTo(-1, -5); ctx.lineTo(-1, 11); ctx.lineTo(-15, 15); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(15, -1); ctx.lineTo(1, -5); ctx.lineTo(1, 11); ctx.lineTo(15, 15); ctx.closePath(); ctx.fill();
    // runes on pages
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(GLYPH, 0.7); ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-13, 0 + i * 4); ctx.lineTo(-4, -1 + i * 4); ctx.moveTo(4, -1 + i * 4); ctx.lineTo(13, 0 + i * 4); ctx.stroke(); } ctx.restore();
    // a few fluttering loose pages
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const a = this.t * 1.5 + i * 2; ctx.globalAlpha = 0.4; ctx.fillStyle = TOME; ctx.save(); ctx.translate(Math.cos(a) * 18, -14 - Math.abs(Math.sin(a)) * 8); ctx.rotate(a); ctx.fillRect(-3, -4, 6, 8); ctx.restore(); } ctx.restore();
    ctx.restore();
  }

  // slice: drawHead(P)
  drawHead(P) {
    const h0 = P.sh * 0.9, hy = P.headY; ctx.save();
    ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(h0 * 0.6, P.chestY - 2); ctx.lineTo(h0, hy + 14); ctx.stroke();
    ctx.strokeStyle = mix(SKIN_HI, SKIN_LO, 0.4); ctx.lineWidth = 8.5; ctx.beginPath(); ctx.moveTo(h0 * 0.6, P.chestY - 2); ctx.lineTo(h0, hy + 14); ctx.stroke();
    // back hair
    ctx.fillStyle = mix(fHAIR, '#33260f', 0.3); ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(h0 - 17, hy - 3); ctx.quadraticCurveTo(h0 - 22, hy - 22, h0 - 2, hy - 25); ctx.quadraticCurveTo(h0 + 8, hy - 26, h0 + 9, hy - 18); ctx.quadraticCurveTo(h0 - 2, hy - 18, h0 - 17, hy - 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    // head
    ctx.beginPath(); ctx.ellipse(h0, hy, 19, 21, 0, 0, 6.28); ctx.strokeStyle = INK; ctx.lineWidth = 3.1; ctx.stroke();
    const g = ctx.createRadialGradient(h0 - 6, hy - 8, 3, h0, hy, 25); g.addColorStop(0, SKIN_HI); g.addColorStop(1, SKIN_LO); ctx.fillStyle = g; ctx.fill();
    ctx.fillStyle = mix(SKIN_HI, SKIN_LO, 0.5); ctx.beginPath(); ctx.ellipse(h0 - 16, hy + 2, 3.6, 5.6, 0, 0, 6.28); ctx.fill();
    // eyes + curious brows + slight smile
    ctx.fillStyle = mix('#bfeedd', '#3a6a55', 0.2); ctx.beginPath(); ctx.ellipse(h0 + 6, hy, 2.6, 3.2, 0, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.ellipse(h0 - 4, hy, 2.2, 2.8, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(h0 + 7, hy - 1, 0.9, 0, 6.28); ctx.fill();
    ctx.strokeStyle = rgba(INK, 0.65); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(h0 + 2, hy - 5); ctx.quadraticCurveTo(h0 + 6, hy - 7, h0 + 10, hy - 5); ctx.stroke();
    ctx.lineWidth = 1.6; ctx.strokeStyle = rgba(INK, 0.5); ctx.beginPath(); ctx.moveTo(h0 + 10, hy + 2); ctx.lineTo(h0 + 8, hy + 6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(h0 + 2, hy + 11); ctx.quadraticCurveTo(h0 + 8, hy + 13, h0 + 12, hy + 10); ctx.stroke();
    // round glasses (scholar)
    ctx.save(); ctx.strokeStyle = GILD_SH; ctx.lineWidth = 2;
    for (const lx of [-4, 8]) { ctx.beginPath(); ctx.arc(h0 + lx, hy, 5.4, 0, 6.28); ctx.stroke(); ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(h0 + lx, hy, 7, LENS, 0.35); ctx.restore(); }
    ctx.beginPath(); ctx.moveTo(h0 + 1.5, hy); ctx.lineTo(h0 + 2.5, hy); ctx.stroke(); ctx.beginPath(); ctx.moveTo(h0 + 13, hy); ctx.lineTo(h0 + 18, hy - 2); ctx.stroke();
    ctx.restore();
    // front hair
    ctx.fillStyle = mix(fHAIR, fHAIRHI, 0.25); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(h0 - 19, hy - 8); ctx.quadraticCurveTo(h0 - 10, hy - 25, h0 + 6, hy - 23); ctx.quadraticCurveTo(h0 + 18, hy - 22, h0 + 20, hy - 12); ctx.quadraticCurveTo(h0 + 12, hy - 18, h0 + 2, hy - 16); ctx.quadraticCurveTo(h0 - 6, hy - 15, h0 - 12, hy - 12); ctx.quadraticCurveTo(h0 - 16, hy - 10, h0 - 19, hy - 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(RIM, 0.45); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.ellipse(h0 + 2, hy - 1, 19, 21, 0, -2.5, -0.2); ctx.stroke(); ctx.restore();
    ctx.restore();
  }

  // slice: drawGlyphHalo(P)
  drawGlyphHalo(P) {
    const h0 = P.sh * 0.9, hy = P.headY; ctx.save();
    for (let i = 0; i < 4; i++) { const a = this.t * 0.7 + i * Math.PI / 2; const rx = 26, ry = 12; const gx = h0 + Math.cos(a) * rx, gy = hy - 6 + Math.sin(a) * ry; const sc = 0.7 + Math.sin(a) * 0.3;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; this.glyph(gx, gy, 4 * sc, a, GLYPH, 0.5 * sc + 0.2); ctx.restore(); }
    ctx.restore();
  }

  // ----- self-contained reveal targets (slice: drawFoe) ----------------------
  // Drawn in the hero-local frame (origin at feet) using foe offset dx/dy.
  drawFoe(f) {
    const wob = Math.sin(this.t * 3 + f.ph) * 3; ctx.save(); ctx.translate(f.dx, f.dy);
    const rt = f.rt;
    // reveal peel glow
    if (rt > 0 && rt < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(0, -44, 46, '#ffd27a', (1 - rt) * 0.5); ctx.restore(); }
    // shadow figure
    ctx.save(); ctx.globalAlpha = f.rev ? 1 : 0.18;
    ctx.translate(f.rev ? 0 : wob * 0.5, 0);
    // body
    const g = ctx.createLinearGradient(0, -84, 0, 0); g.addColorStop(0, '#3a2363'); g.addColorStop(1, '#120a22');
    ctx.fillStyle = f.rev ? g : 'rgba(40,24,70,0.6)'; ctx.strokeStyle = f.rev ? 'rgba(0,0,0,0.5)' : 'rgba(120,90,180,0.3)'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-15, 0); ctx.quadraticCurveTo(-20, -46, -8, -60); ctx.quadraticCurveTo(-12, -74, 0, -78);
    ctx.quadraticCurveTo(12, -74, 8, -60); ctx.quadraticCurveTo(20, -46, 15, 0); ctx.quadraticCurveTo(0, -8, -15, 0); ctx.closePath();
    ctx.fill(); ctx.stroke();
    // hunch head
    ctx.beginPath(); ctx.arc(2, -66, 11, 0, 6.28); ctx.fill(); ctx.stroke();
    ctx.restore();
    // eyes (always faintly visible)
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const ea = f.rev ? 0.95 : 0.5 + Math.sin(this.t * 4 + f.ph) * 0.2;
    glow(-2, -66, 7, '#b266ff', ea * 0.6); glow(7, -66, 6, '#b266ff', ea * 0.5);
    ctx.fillStyle = rgba('#d9b3ff', ea); ctx.beginPath(); ctx.ellipse(-2, -66, 1.8, 2.6, 0, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.ellipse(7, -66, 1.6, 2.4, 0, 0, 6.28); ctx.fill();
    ctx.restore();
    // revealed: weakness glyph mark above
    if (f.rev) { const m = clamp(f.mark, 0, 1); ctx.save(); ctx.globalAlpha = m; ctx.globalCompositeOperation = 'lighter';
      glow(2, -100, 16, GILD, 0.5 * m); this.glyph(2, -100, 6, this.t * 1.2, GILD, 0.9 * m); ctx.restore(); }
    ctx.restore();
  }

  // ----- reveal wavefront (slice: drawReveal) --------------------------------
  drawReveal() {
    if (!this.reveal) return; const k = easeOutCubic(this.reveal.t / this.reveal.dur), r = k * 640, a = 1 - k;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // wavefront ring (vertical-ish, sweeping right)
    ctx.strokeStyle = rgba('#ffe6a8', a * 0.7); ctx.lineWidth = 6 * (1 - k) + 2;
    ctx.beginPath(); ctx.ellipse(REV_OX, REV_OY, r, r * 0.92, 0, -1.2, 1.2); ctx.stroke();
    ctx.strokeStyle = rgba(GLYPH, a * 0.5); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(REV_OX, REV_OY, r * 0.86, r * 0.8, 0, -1.2, 1.2); ctx.stroke();
    // glyphs riding the front
    for (let i = -2; i <= 2; i++) { const ang = i * 0.42; const gx = REV_OX + Math.cos(ang) * r, gy = REV_OY + Math.sin(ang) * r * 0.92; ctx.globalAlpha = a * 0.8; this.glyph(gx, gy, 5, this.t * 2 + i, GILD, a * 0.8); }
    ctx.restore();
  }

  // ----- codex barrage projectiles (slice: drawBombs) ------------------------
  drawBombs() {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const b of this.bombs) { if (!b.launched) continue; glow(b.x, b.y, 12, GILD, 0.7); ctx.fillStyle = TOME; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.t * 8); ctx.fillRect(-3, -4, 6, 8); ctx.restore();
      ctx.strokeStyle = rgba(GILD, 0.4); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.03, b.y - b.vy * 0.03); ctx.stroke(); }
    ctx.restore();
  }

  // ----- particles (slice: emit / ink / updP / drawP) ------------------------
  emit(n, x, y, sp, c) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28; this.parts.push({ x: x + (Math.random() - .5) * 12, y: y + (Math.random() - .5) * 12, vx: Math.cos(a) * sp * (0.3 + Math.random()), vy: Math.sin(a) * sp * (0.3 + Math.random()) - 20, life: 0, max: 0.5 + Math.random() * 0.7, r: 1.5 + Math.random() * 2.4, c: c || GILD }); } }
  ink(n, x, y) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28; this.parts.push({ x, y: y - Math.random() * 60, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60 + 20, life: 0, max: 0.5 + Math.random() * 0.5, r: 2 + Math.random() * 3, c: Math.random() < 0.5 ? '#3a1d6e' : '#6a3aa0', dark: 1 }); } }
  updP(dt) { for (let i = this.parts.length - 1; i >= 0; i--) { const q = this.parts[i]; q.life += dt; if (q.life >= q.max) { this.parts.splice(i, 1); continue; } q.vy += (q.dark ? 60 : 90) * dt * 0.35; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.97; } }
  drawP() { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const q of this.parts) { const a = 1 - q.life / q.max; if (!q.dark) glow(q.x, q.y, q.r * 3, q.c, a * 0.35); ctx.fillStyle = rgba(q.c, a * (q.dark ? 0.6 : 1)); ctx.beginPath(); ctx.arc(q.x, q.y, q.r * a + 0.4, 0, 6.28); ctx.fill(); } ctx.restore(); }

  // ----- update: ability timelines + FX + secondary motion -------------------
  // slice: update(dt)
  update(dt) {
    super.update(dt);
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2.2);
    if (this.shakeRequest > 0) this.shakeRequest = Math.max(0, this.shakeRequest - dt * 30);

    // one-shot ability states auto-return to idle/walk when timeline completes
    if (this.state === 'reveal' && this.stateT >= 0.95) this.endAbility();
    else if (this.state === 'barrage' && this.stateT >= 1.0) this.endAbility();

    // reveal wavefront — peels shadow off self-contained targets as it sweeps
    if (this.reveal) {
      this.reveal.t += dt; const r = easeOutCubic(this.reveal.t / this.reveal.dur) * 640;
      for (const f of this.foes) { if (!f.rev && r >= (f.dx - REV_OX)) { f.rev = true; f.rt = 0.001; this.ink(reduce ? 8 : 18, f.dx, f.dy); this.shakeRequest = Math.max(this.shakeRequest, 4); } }
      if (this.reveal.t >= this.reveal.dur) this.reveal = null;
    }
    for (const f of this.foes) { if (f.rev) { if (f.rt < 1) f.rt = Math.min(1, f.rt + dt * 2); f.mark = Math.min(1, f.mark + dt * 2.2); } }

    // bombs (arcing artillery with splash)
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const b = this.bombs[i]; b.t += dt;
      if (!b.launched) { if (b.t >= b.delay) { b.launched = true; b.vx = (b.gx - b.x) / 0.85; b.vy = -300 - Math.random() * 40; } else continue; }
      b.vy += 520 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.y >= -4) { // impact (ground in hero-local = y 0; slice used GROUND-4)
        this.emit(reduce ? 10 : 22, b.gx, -6, 200, GILD); this.shakeRequest = Math.max(this.shakeRequest, 7); this.flash = Math.max(this.flash, 0.16);
        for (const f of this.foes) { if (Math.abs(f.dx - b.gx) < 70) { f.mark = 1; this.emit(6, f.dx, f.dy - 40, 120, f.rev ? '#ffd27a' : '#b266ff'); } }
        this.bombs.splice(i, 1);
      }
    }
    this.updP(dt);

    // secondary motion: faint hem/hair trail (structural parity; not visible robe)
    const P = this.pose();
    const ax = this.x + (this.bodyX || 0), ay = this.groundY - P.hover;
    stepChain(this.mantle, ax - 8 + P.sh * 0.5, ay + P.chestY + 2, Math.sin(this.t * 2) * 0.2, -0.4 + Math.sin(this.t * 1.7) * 0.15, 3);
    stepChain(this.hairA, ax + P.sh * 0.9 - 6, ay + P.headY - 22, 0.05, -0.3, 2);
    stepChain(this.hairB, ax + P.sh * 0.9 + 6, ay + P.headY - 22, 0.1, -0.28, 2);

    this.lastPose = P;
  }

  static MOVES = [
    { key: '1', label: 'Idle', state: 'idle' },
    { key: '2', label: 'Walk', state: 'glide' },
    { key: '3', label: 'Reveal', method: 'reveal_' },
    { key: '4', label: 'Codex Barrage', method: 'barrage' },
  ];
}
