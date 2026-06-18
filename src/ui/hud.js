// hud.js — battle HUD drawn in logical (1280x720) space inside the viewport
// transform, so it scales with the letterboxed field. Energy bar + regen state,
// deploy cards (cost, cooldown radial, hotkey, affordability), and the
// tower/core "front-line" meters.

import { ctx } from '../render/gfx.js';
import { mix, rgba, glow, clamp } from '../render/primitives.js';
import { DEPLOY_ORDER, HERO_DEFS } from '../data/heroes.js';
import { FIELD } from '../sim/field.js';

const CARD_W = 104, CARD_H = 58, GAP = 8;
const CHIP = { trooper: '#dfe7ff', manu: '#ffb15a', victor: '#7fe9dd', floris: '#7df0bf', andreea: '#8e7ff0', radu: '#ffd24a', pissy: '#d79bff' };
const SHORT = { trooper: 'Trooper', manu: 'Manu', victor: 'Victor', floris: 'Floris', andreea: 'Andreea', radu: 'Radu', pissy: 'Pissy' };

/** Card rects + bar geometry (logical coords). Used for drawing AND hit-testing. */
export function hudLayout() {
  const n = DEPLOY_ORDER.length;
  const totalW = n * CARD_W + (n - 1) * GAP;
  const startX = (FIELD.W - totalW) / 2;
  const y = FIELD.H - CARD_H - 14;
  const cards = DEPLOY_ORDER.map((id, i) => ({ id, key: String(i + 1), x: startX + i * (CARD_W + GAP), y, w: CARD_W, h: CARD_H }));
  return { cards };
}

export function drawHud(battle, selectedId) {
  const layout = hudLayout();
  drawEconomy(battle);
  drawStructureMeters(battle);
  for (const card of layout.cards) drawCard(battle, card, selectedId);
  drawTopInfo(battle);
}

function drawEconomy(battle) {
  const x = 24, y = 22, w = 320, h = 20;
  const e = battle.economy;
  ctx.save();
  ctx.fillStyle = 'rgba(8,10,22,0.7)'; ctx.strokeStyle = rgba('#ffd24a', 0.4); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill(); ctx.stroke();
  const f = clamp(e.energy / e.cfg.cap, 0, 1);
  const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#ffd24a'); g.addColorStop(1, '#ff9d54');
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x + 2, y + 2, (w - 4) * f, h - 4, 6); ctx.fill();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(x + (w - 4) * f, y + h / 2, 14, '#fff7d6', 0.5); ctx.restore();
  ctx.fillStyle = '#fff7e0'; ctx.font = '700 13px system-ui,sans-serif'; ctx.textBaseline = 'middle';
  ctx.fillText(`☀ ${Math.floor(e.energy)} / ${e.cfg.cap}${e.suppressed ? '  (suppressed!)' : ''}`, x + 10, y + h / 2 + 1);
  ctx.restore();
}

function drawStructureMeters(battle) {
  // Photon Tower (left) + Dark Core (right) health, the "front-line" feedback.
  bar(24, 50, 230, 12, battle.towerHp / battle.towerMaxHp, '#ffd24a', 'Photon Tower', false);
  bar(FIELD.W - 24 - 230, 50, 230, 12, battle.coreHp / battle.coreMaxHp, '#9a6bff', 'Dark Core', true);
}

function bar(x, y, w, h, f, col, label, right) {
  ctx.save();
  ctx.fillStyle = 'rgba(8,10,22,0.6)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 6); ctx.fill();
  const ff = clamp(f, 0, 1);
  ctx.fillStyle = col;
  if (right) { ctx.beginPath(); ctx.roundRect(x + w - w * ff, y, w * ff, h, 6); ctx.fill(); }
  else { ctx.beginPath(); ctx.roundRect(x, y, w * ff, h, 6); ctx.fill(); }
  ctx.fillStyle = rgba('#ffffff', 0.8); ctx.font = '600 10px system-ui,sans-serif'; ctx.textBaseline = 'middle';
  ctx.textAlign = right ? 'right' : 'left';
  ctx.fillText(label, right ? x + w : x, y - 7);
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawCard(battle, card, selectedId) {
  const def = HERO_DEFS[card.id];
  const locked = battle.isLocked && battle.isLocked(card.id);
  const afford = battle.economy.canAfford(def.cost);
  const cdF = battle.deployCooldownFrac(card.id);
  const ready = afford && cdF <= 0 && !locked;
  ctx.save();
  // card body
  ctx.globalAlpha = ready ? 1 : 0.55;
  ctx.fillStyle = 'rgba(16,18,32,0.82)';
  ctx.strokeStyle = card.id === selectedId ? '#ffd24a' : rgba(CHIP[card.id], 0.5);
  ctx.lineWidth = card.id === selectedId ? 2.5 : 1.5;
  ctx.beginPath(); ctx.roundRect(card.x, card.y, card.w, card.h, 10); ctx.fill(); ctx.stroke();
  // color chip
  ctx.fillStyle = CHIP[card.id]; ctx.beginPath(); ctx.arc(card.x + 16, card.y + 16, 7, 0, 6.28); ctx.fill();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(card.x + 16, card.y + 16, 12, CHIP[card.id], 0.5); ctx.restore();
  // name + cost
  ctx.fillStyle = '#eef1ff'; ctx.font = '700 12px system-ui,sans-serif'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(SHORT[card.id], card.x + 30, card.y + 20);
  ctx.fillStyle = afford ? '#ffd24a' : '#ff7a7a'; ctx.font = '700 12px system-ui,sans-serif';
  ctx.fillText(`☀ ${def.cost}`, card.x + 10, card.y + card.h - 9);
  // hotkey badge
  ctx.fillStyle = rgba('#000', 0.4); ctx.beginPath(); ctx.roundRect(card.x + card.w - 22, card.y + 6, 16, 16, 4); ctx.fill();
  ctx.fillStyle = '#cfd6ff'; ctx.font = '700 11px system-ui,sans-serif'; ctx.fillText(card.key, card.x + card.w - 18, card.y + 18);
  // cooldown overlay
  if (cdF > 0 && !locked) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.roundRect(card.x, card.y, card.w, card.h * cdF, 10); ctx.fill(); }
  // locked ("power stolen") overlay
  if (locked) {
    ctx.fillStyle = 'rgba(8,6,16,0.66)'; ctx.beginPath(); ctx.roundRect(card.x, card.y, card.w, card.h, 10); ctx.fill();
    ctx.fillStyle = '#b06bff'; ctx.font = '700 11px system-ui,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('🔒 STOLEN', card.x + card.w / 2, card.y + card.h / 2 + 4); ctx.textAlign = 'left';
  }
  ctx.restore();
}

function drawTopInfo(battle) {
  ctx.save();
  ctx.fillStyle = rgba('#cfd6ff', 0.8); ctx.font = '600 12px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const t = Math.floor(battle.time);
  ctx.fillText(`Kills ${battle.stats.kills}   ·   ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`, FIELD.W / 2, 30);
  ctx.textAlign = 'left';
  ctx.restore();
}
