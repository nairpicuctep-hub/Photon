// projectiles.js — bolts, dark fire and arcing artillery. Pooled-ish flat array
// (small counts); light projectiles draw additive, dark ones normal/violet.
// A per-projectile timeScale lets Andreea's Temporal Eddy slow them (brief §3.3).

import { ctx } from '../render/gfx.js';
import { rgba, glow, lerp } from '../render/primitives.js';

/** @type {Array<any>} */
let projs = [];

export function clearProjectiles() { projs = []; }
export function getProjectiles() { return projs; }

/**
 * Straight-ish seeking bolt toward a target combatant.
 * @param {{side:string,x:number,y:number,target:any,damage:number,speed?:number,color?:string,dark?:boolean,pierce?:boolean,onHit?:Function}} o
 */
export function spawnBolt(o) {
  projs.push({
    kind: 'bolt', side: o.side, x: o.x, y: o.y,
    target: o.target, damage: o.damage,
    speed: o.speed || 520, color: o.color || (o.dark ? '#b06bff' : '#ffe28a'),
    dark: !!o.dark, pierce: !!o.pierce, silence: !!o.silence, ranged: true, r: o.r || 4, life: 0, max: 3,
    onHit: o.onHit, dead: false,
  });
}

/** Arcing artillery shell that splashes on landing at (tx, groundY). */
export function spawnArc(o) {
  const dx = o.tx - o.x;
  const flight = o.flight || 0.9;
  projs.push({
    kind: 'arc', side: o.side, x: o.x, y: o.y, x0: o.x, y0: o.y,
    tx: o.tx, ty: o.ty, vx: dx / flight, t: 0, flight, peak: o.peak || 150,
    damage: o.damage, splash: o.splash || 70, color: o.color || '#ffd27a',
    dark: !!o.dark, onLand: o.onLand, dead: false,
  });
}

export function updateProjectiles(dt, battle) {
  for (const p of projs) {
    if (p.dead) continue;
    const sdt = dt * (battle ? battle.projectileTimeScaleAt(p.x, p.y) : 1);
    if (p.kind === 'bolt') {
      p.life += sdt; // age with the (possibly slowed) clock so eddy-caught bolts travel consistently
      const tgt = p.target;
      if (!tgt || tgt.dead) {
        // fly off in its travel direction, expire
        p.x += (p.side === 'light' ? 1 : -1) * p.speed * sdt;
        if (p.life > 0.6) p.dead = true;
        continue;
      }
      const ty = tgt.attackY != null ? tgt.attackY : tgt.y;
      const dx = tgt.x - p.x, dy = ty - p.y;
      const d = Math.hypot(dx, dy) || 1;
      const step = p.speed * sdt;
      if (d <= step + (tgt.hitR || 18)) {
        if (battle) battle.applyDamage(tgt, p.damage, p);
        if (p.onHit) p.onHit(tgt);
        if (!p.pierce) p.dead = true; else { p.target = null; }
      } else {
        p.x += dx / d * step; p.y += dy / d * step;
      }
      if (p.life > p.max) p.dead = true;
    } else if (p.kind === 'arc') {
      p.t += sdt;
      const k = Math.min(1, p.t / p.flight);
      p.x = p.x0 + p.vx * p.t;
      p.y = lerp(p.y0, p.ty, k) - Math.sin(k * Math.PI) * p.peak;
      if (k >= 1) {
        p.dead = true;
        if (battle) battle.splashDamage(p.tx, p.side === 'light' ? 'shadow' : 'light', p.splash, p.damage, { ranged: true });
        if (p.onLand) p.onLand(p.tx, p.ty);
      }
    }
  }
  projs = projs.filter((p) => !p.dead);
}

export function drawProjectiles() {
  for (const p of projs) {
    if (p.kind === 'bolt') {
      ctx.save();
      ctx.globalCompositeOperation = p.dark ? 'source-over' : 'lighter';
      glow(p.x, p.y, p.r * 3, p.color, p.dark ? 0.5 : 0.6);
      ctx.fillStyle = rgba(p.color, 0.95);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
      ctx.restore();
    } else if (p.kind === 'arc') {
      ctx.save();
      ctx.globalCompositeOperation = p.dark ? 'source-over' : 'lighter';
      glow(p.x, p.y, 10, p.color, 0.7);
      ctx.fillStyle = rgba(p.color, 0.95);
      ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, 6.28); ctx.fill();
      ctx.restore();
    }
  }
}
