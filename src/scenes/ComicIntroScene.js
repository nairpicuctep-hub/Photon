// ComicIntroScene.js — Radu's CERN origin, told as tap-through comic panels.
// Stylised canvas art (silhouettes, glows, the accelerator ring) + captions.
// Shown once on first launch; replayable via #scene=intro.

import { ctx } from '../render/gfx.js';
import { mix, rgba, glow, star, clamp, lerp, easeOutCubic } from '../render/primitives.js';
import * as particles from '../render/particles.js';
import { Radu } from '../heroes/radu.js';

const FW = 1280, FH = 720;
const PANEL = { x: 150, y: 64, w: 980, h: 452 };       // illustration frame
const GY = PANEL.y + PANEL.h - 70;                      // ground inside the panel

// ---- small stylised figure (head + tapered body) --------------------------
function figure(x, gy, h, col, opts = {}) {
  const headR = h * 0.13;
  if (opts.glow) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(x, gy - h * 0.55, h * (opts.glowR || 0.7), opts.glow, opts.glowA || 0.3); ctx.restore(); }
  ctx.fillStyle = col; ctx.strokeStyle = '#0c0a14'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
  // legs
  ctx.lineCap = 'round'; ctx.strokeStyle = mix(col, '#000', 0.25); ctx.lineWidth = h * 0.07;
  ctx.beginPath(); ctx.moveTo(x - h * 0.05, gy - h * 0.32); ctx.lineTo(x - h * 0.07, gy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + h * 0.05, gy - h * 0.32); ctx.lineTo(x + h * 0.07, gy); ctx.stroke();
  // body
  ctx.strokeStyle = '#0c0a14'; ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(x - h * 0.13, gy - h * 0.3);
  ctx.quadraticCurveTo(x - h * 0.17, gy - h * 0.52, x - h * 0.08, gy - h * 0.66);
  ctx.lineTo(x + h * 0.08, gy - h * 0.66);
  ctx.quadraticCurveTo(x + h * 0.17, gy - h * 0.52, x + h * 0.13, gy - h * 0.3);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // head
  ctx.beginPath(); ctx.arc(x, gy - h * 0.78, headR, 0, 6.28); ctx.fill(); ctx.stroke();
}

function cernArc(cx, cy, r, p, dash) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = rgba(mix('#2a3a6a', '#ffd24a', p), 0.5); ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
  ctx.strokeStyle = rgba(mix('#3a4f8a', '#fff3c4', p), 0.4); ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(cx, cy, r - 16, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
  if (dash) { ctx.strokeStyle = rgba('#fff7d6', 0.8); ctx.lineWidth = 3; ctx.setLineDash([6, 14]); ctx.lineDashOffset = -dash; ctx.beginPath(); ctx.arc(cx, cy, r - 8, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); ctx.setLineDash([]); }
  ctx.restore();
}

function sky(topCol, midCol, botCol) {
  const g = ctx.createLinearGradient(0, PANEL.y, 0, PANEL.y + PANEL.h);
  g.addColorStop(0, topCol); g.addColorStop(0.6, midCol); g.addColorStop(1, botCol);
  ctx.fillStyle = g; ctx.fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
}
function ground(col) { ctx.fillStyle = col; ctx.fillRect(PANEL.x, GY, PANEL.w, PANEL.y + PANEL.h - GY); }
function stars(n, t) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#cfe0ff';
  for (let i = 0; i < n; i++) { const x = PANEL.x + ((i * 137.5) % (PANEL.w - 40)) + 20; const y = PANEL.y + 20 + ((i * 91.3) % (PANEL.h * 0.5)); ctx.globalAlpha = 0.3 + 0.4 * Math.abs(Math.sin(t + i)); ctx.beginPath(); ctx.arc(x, y, 1.3, 0, 6.28); ctx.fill(); }
  ctx.restore();
}

export class ComicIntroScene {
  constructor(viewport, nav, onDone, start) {
    this.viewport = viewport; this.nav = nav; this.onDone = onDone;
    this.i = start || 0; this.t = 0; this.panelT = 0; this._done = false;
    this.skipRect = { x: FW - 150, y: 26, w: 120, h: 40 };
    this.PANELS = this._panels();
  }

  enter() {
    this.viewport.setLogical(FW, FH);
    this.radu = new Radu({ x: 640, groundY: GY }); this.radu.auraOn = true;
    particles.reset();
    const canvas = document.getElementById('c');
    this._pd = (ev) => {
      const t = ev.touches && ev.touches[0] ? ev.touches[0] : ev;
      const p = this.viewport.toLogical(t.clientX, t.clientY);
      const s = this.skipRect;
      if (p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h) this._finish();
      else this._next();
    };
    this._kd = (e) => { const k = e.key; if (k === 'Escape') this._finish(); else if (k === 'Enter' || k === ' ' || k === 'ArrowRight') this._next(); };
    canvas.addEventListener('pointerdown', this._pd);
    window.addEventListener('keydown', this._kd);
  }
  exit() { const c = document.getElementById('c'); if (this._pd) c.removeEventListener('pointerdown', this._pd); if (this._kd) window.removeEventListener('keydown', this._kd); particles.reset(); }

  _next() { if (this.i >= this.PANELS.length - 1) this._finish(); else { this.i++; this.panelT = 0; } }
  _finish() { if (this._done) return; this._done = true; this.onDone(); }

  update(dt) {
    this.t += dt; this.panelT += dt;
    this.radu.update(dt);
    if (this.i === 4 && Math.random() < 0.5) particles.emitPhotons(1, 640 + (Math.random() - 0.5) * 80, GY - 120, 60, 25);
    particles.update(dt);
  }

  render(dt) {
    this.viewport.begin();
    // backdrop
    ctx.fillStyle = '#05060e'; ctx.fillRect(0, 0, FW, FH);
    // comic panel frame
    ctx.save();
    ctx.fillStyle = '#0a0a16'; ctx.beginPath(); ctx.roundRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 16); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.roundRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 16); ctx.clip();
    this.PANELS[this.i].draw(this);
    ctx.restore();
    ctx.strokeStyle = rgba('#ffd24a', 0.5); ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 16); ctx.stroke();
    ctx.restore();

    // caption box
    const cap = this.PANELS[this.i].caption;
    ctx.save();
    ctx.fillStyle = 'rgba(10,10,22,0.9)'; ctx.strokeStyle = rgba('#ffd24a', 0.35); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(PANEL.x, 540, PANEL.w, 96, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff7e0'; ctx.font = '600 22px system-ui,sans-serif'; ctx.textAlign = 'center';
    wrap(cap, FW / 2, 576, PANEL.w - 80, 30);
    ctx.restore();

    // panel dots
    ctx.save(); ctx.textAlign = 'center';
    for (let k = 0; k < this.PANELS.length; k++) { ctx.fillStyle = k === this.i ? '#ffd24a' : 'rgba(150,150,180,0.4)'; ctx.beginPath(); ctx.arc(FW / 2 - (this.PANELS.length - 1) * 9 + k * 18, 666, 4, 0, 6.28); ctx.fill(); }
    // hint
    ctx.fillStyle = rgba('#9aa0c8', 0.6 + Math.sin(this.t * 3) * 0.3); ctx.font = '600 13px system-ui,sans-serif';
    ctx.fillText(this.i >= this.PANELS.length - 1 ? 'tap to begin ▸' : 'tap to continue ▸', FW / 2, 694);
    ctx.textAlign = 'left'; ctx.restore();

    // skip button
    const s = this.skipRect;
    ctx.save(); ctx.fillStyle = 'rgba(16,18,32,0.8)'; ctx.strokeStyle = rgba('#ffd24a', 0.35); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(s.x, s.y, s.w, s.h, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#cfd6ff'; ctx.font = '700 14px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Skip ⏭', s.x + s.w / 2, s.y + s.h / 2); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.restore();

    this.viewport.end();
  }

  _panels() {
    return [
      { // 0 — ordinary boy
        caption: 'Radu was an ordinary, curious boy — forever asking how the world really worked.',
        draw: (s) => { sky('#0b1430', '#1a2a55', '#2a2a4a'); stars(40, s.t); ground('#14152a'); figure(640, GY, 220, '#5a6aa0'); },
      },
      { // 1 — CERN
        caption: 'On a school trip, he stood before CERN — the great ring where light itself is born.',
        draw: (s) => { sky('#070a1c', '#142251', '#241f3a'); stars(50, s.t); cernArc(640, GY + 230, 360, 0.3, s.t * 60); ground('#10122a'); figure(640, GY, 150, '#4a5894'); },
      },
      { // 2 — the accident
        caption: 'Then the beam surged. Light tore through the ring — and through him.',
        draw: (s) => {
          sky('#1a1020', '#3a2a55', '#5a3a40'); cernArc(640, GY + 230, 360, 0.9, s.t * 220); ground('#1a1020');
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          const f = 0.5 + Math.sin(s.t * 14) * 0.5; glow(640, GY - 90, 240 + f * 60, '#fff7d6', 0.6 + f * 0.3); glow(640, GY - 90, 120, '#fff', 0.8);
          ctx.strokeStyle = rgba('#fff7d6', 0.6); ctx.lineWidth = 3;
          for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; ctx.beginPath(); ctx.moveTo(640, GY - 90); ctx.lineTo(640 + Math.cos(a) * 320, GY - 90 + Math.sin(a) * 320); ctx.stroke(); }
          ctx.restore();
          figure(640, GY, 150, '#d8c89a', { glow: '#fff7d6', glowA: 0.5 });
        },
      },
      { // 3 — dissolve into light
        caption: '—and his atoms scattered into pure, living light.',
        draw: (s) => {
          sky('#0a0820', '#241f55', '#3a2a55'); ground('#0c0a1a');
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          const spread = clamp(s.panelT * 0.6, 0, 1);
          for (let i = 0; i < 90; i++) { const a = i * 2.39; const r = (40 + (i % 30) * 9) * (0.3 + spread); const x = 640 + Math.cos(a) * r, y = GY - 110 + Math.sin(a) * r * 0.8; ctx.fillStyle = rgba(i % 2 ? '#ffd24a' : '#fff3c4', (1 - spread) * 0.8 + 0.2); ctx.beginPath(); ctx.arc(x, y, 2.4 + (i % 3), 0, 6.28); ctx.fill(); }
          glow(640, GY - 110, 160, '#ffd24a', (1 - spread) * 0.5 + 0.15);
          ctx.restore();
        },
      },
      { // 4 — RADU PHOTON
        caption: 'He reformed — transformed. He rose as RADU PHOTON, hero of light.',
        draw: (s) => {
          sky('#0a0a1e', '#2a2a5e', '#3a2f5a'); stars(40, s.t); ground('#12122a');
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 5; i++) { const a = -1.6 - 0.45 + i * 0.22; const lg = ctx.createLinearGradient(640, GY - 120, 640 + Math.cos(a) * 460, GY - 120 + Math.sin(a) * 460); lg.addColorStop(0, rgba('#ffe6b0', 0.22)); lg.addColorStop(1, rgba('#ffe6b0', 0)); ctx.fillStyle = lg; ctx.save(); ctx.translate(640, GY - 120); ctx.rotate(a); ctx.fillRect(-10, -26, 480, 52); ctx.restore(); }
          ctx.restore();
          particles.drawParts();
          this.radu.draw();
        },
      },
      { // 5 — friends gather
        caption: 'But shadow gathered against the dawn. Radu would not stand alone — he called his friends.',
        draw: (s) => {
          sky('#0a0a1c', '#1a2247', '#3a2a45'); stars(30, s.t); ground('#11122400');
          ground('#101226');
          // approaching dark on the right
          ctx.save(); ctx.globalCompositeOperation = 'source-over'; const dg = ctx.createLinearGradient(PANEL.x + PANEL.w, 0, PANEL.x + PANEL.w * 0.55, 0); dg.addColorStop(0, 'rgba(20,10,40,0.85)'); dg.addColorStop(1, 'rgba(20,10,40,0)'); ctx.fillStyle = dg; ctx.fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h); ctx.restore();
          const team = [['#ffd24a', 1], ['#7fe9dd', 0], ['#ffb15a', 0], ['#7df0bf', 0], ['#8e7ff0', 0], ['#d79bff', 0]];
          team.forEach((tcol, k) => { const x = 360 + k * 84; figure(x, GY, 132 - (k ? 14 : 0), tcol[0], tcol[1] ? { glow: '#ffd87a', glowA: 0.35 } : {}); });
        },
      },
      { // 6 — Echipa Lumina
        caption: 'Together, they are ECHIPA LUMINA. Friendship is stronger than power.',
        draw: (s) => {
          sky('#142251', '#36508f', '#ff9d54'); stars(16, s.t);
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(640, GY + 30, 380, '#ffe1a8', 0.4); ctx.restore();
          ground('#2a2440');
          const team = [['#7fe9dd'], ['#ffb15a'], ['#7df0bf'], ['#ffd24a', 1], ['#8e7ff0'], ['#d79bff']];
          team.forEach((tcol, k) => { const x = 380 + k * 80; figure(x, GY, tcol[1] ? 150 : 128, tcol[0], tcol[1] ? { glow: '#fff7d6', glowA: 0.5, glowR: 0.9 } : {}); });
          ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = '#fff7e0'; ctx.font = '800 40px system-ui,sans-serif'; ctx.shadowColor = 'rgba(255,210,74,0.6)'; ctx.shadowBlur = 24; ctx.fillText('ECHIPA LUMINA', 640, PANEL.y + 70); ctx.restore();
        },
      },
    ];
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
