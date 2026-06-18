// Battle.js — the lane tug-of-war (brief §7). Photon Tower (left) vs Dark Core
// (right) on a 1280x720 logical field, GROUND 566. Units advance, auto-engage,
// and attack; the front line drives the sky's dawn; destroy the Core to win,
// lose if the Tower falls.

import { ctx } from '../render/gfx.js';
import { mix, rgba, glow, star, clamp, lerp, easeOutBack } from '../render/primitives.js';
import { initScene, drawScene, setDawn, getDawn, drawVignette } from '../render/scene.js';
import * as particles from '../render/particles.js';
import { reduce } from '../core/env.js';
import { LightEconomy } from './economy.js';
import { WaveDirector } from './waves.js';
import { acquireTarget, inRange, frontMostAlly, frontMostEnemy } from './targeting.js';
import { spawnBolt, spawnArc, updateProjectiles, drawProjectiles, clearProjectiles } from '../abilities/projectiles.js';
import { makeHero, heroDef } from '../heroes/roster.js';
import { makeEnemy, enemyDef } from '../enemies/roster.js';
import { FIELD } from './field.js';
import { ComboEngine } from '../combo/ComboEngine.js';
import { ComboBanner } from '../ui/comboBanner.js';
import { setMusicDawn, sfx } from '../audio/audio.js';
import { getSettings } from '../a11y/settings.js';
import { get as getSave } from '../save/save.js';
import { aggregateEffects } from '../data/upgrades.js';
import { difficulty } from '../data/difficulty.js';

export { FIELD };

// animation states used for "basic attack" flourish, per hero
const ATTACK_ANIM = { trooper: 'shoot', radu: 'energyBlast', victor: 'fire', floris: 'barrage', pissy: 'mischief' };
// signature abilities triggered occasionally (visual + a modest effect; combos in M3).
// Method names must match each hero class exactly (verified against the ports).
const SIGNATURE = {
  manu: { method: 'titanSmash', cd: 7 }, floris: { method: 'castReveal', cd: 8 },
  andreea: { method: 'eddy', cd: 9 }, victor: { method: 'deploy', cd: 11 },
  radu: { method: 'toggleAura', cd: 9 }, pissy: { method: 'goodSpirits', cd: 10 },
};

// Heroes are drawn at full feel-slice scale (the gallery/preview showcase needs
// that fidelity), but in battle they'd tower over the enemies — so light units
// render scaled down here, keeping them proportional to the Shadow Network.
const HERO_SCALE = 0.64;

class Combatant {
  constructor(side, def, renderer, x) {
    this.side = side; this.def = def; this.r = renderer;
    this.x = x; this.groundY = FIELD.GROUND;
    this.hp = def.maxHp; this.maxHp = def.maxHp;
    this.atkCd = 0; this.abilityCd = (SIGNATURE[def.id] ? SIGNATURE[def.id].cd * 0.6 : 0);
    this.dead = false;
    this.attacking = false;
    this.atkSpeedMul = 1;          // buffed by Radu's aura
    this.dmgMul = 1;               // enemy damage scaled by difficulty
    this.silenced = 0;             // Hexer curse: ability disabled while > 0
    this.stun = 0;
    const melee = def.attack && def.attack.kind === 'melee';
    this.hitR = melee ? 38 : (side === 'shadow' ? 26 : 22);
    this.scale = side === 'light' ? HERO_SCALE : 1;
    this.attackY = FIELD.GROUND - (side === 'light' ? 118 * HERO_SCALE : (def.id === 'nullDrone' ? 90 : 46));
  }
  get range() { return this.def.attack ? this.def.attack.range : 0; }
}

export class Battle {
  constructor(opts = {}) {
    this.mode = opts.mode || 'endless';
    this.allies = []; this.enemies = [];
    this.fields = [];               // slow zones, domes, auras, reveal waves
    this.beams = [];                // transient piercing-beam FX
    this.prisms = [];               // Victor's deployed Prism Mirrors
    this.lances = [];               // Light Lance megabeam FX
    this.walls = (opts.walls || []).map((w) => ({ x: w.x, top: FIELD.GROUND - (w.height || 240), maxHp: w.hp || 200, hp: w.hp || 200, broken: 0 }));
    this.lockedHeroes = opts.lockedHeroes || []; // "stolen power" — these can't deploy this mission
    this.biome = opts.biome || null;             // e.g. 'eclipse' tints the battlefield
    this.banner = new ComboBanner();
    this.combo = new ComboEngine(this, this.banner);
    this.economy = new LightEconomy(opts.economy);
    this.waves = new WaveDirector(opts.waves || { mode: this.mode === 'campaign' ? 'script' : 'endless', script: opts.script });
    this.towerMaxHp = opts.towerHp || 100; this.towerHp = this.towerMaxHp;
    this.coreMaxHp = opts.coreHp || 100; this.coreHp = this.coreMaxHp;
    this.state = 'playing';         // 'playing' | 'won' | 'lost'
    this.shake = 0; this.flash = 0;
    this.time = 0;
    this.dawn = 0.18; this._dawnV = 0.18;
    this.umbraSpawned = false;
    this.onEnd = opts.onEnd || null;
    this.stats = { kills: 0, deployed: 0 };

    // friendship meta upgrades (data-driven; auto-unlocked by clearing missions)
    const up = aggregateEffects((getSave().unlocked && getSave().unlocked.upgrades) || []);
    this._heroHpMul = up.hpMul; this._comboDmgMul = up.comboDmgMul;
    this.economy.cfg.regenPerSec += up.regenBonus;
    this.economy.cfg.killBonus += up.killBonus;
    this.economy.energy = Math.min(this.economy.cfg.cap, this.economy.energy + up.startBonus);
    this.towerMaxHp = Math.round(this.towerMaxHp * up.towerMul); this.towerHp = this.towerMaxHp;

    // difficulty (Easy/Normal/Hard)
    const D = difficulty(getSettings().difficulty);
    this._enemyHpMul = D.enemyHp; this._enemyDmgMul = D.enemyDmg;
    this.economy.cfg.regenPerSec *= D.regenMul;
    this.economy.energy = Math.max(10, this.economy.energy + D.startBonus);
    this.towerMaxHp = Math.round(this.towerMaxHp * D.towerMul); this.towerHp = this.towerMaxHp;
    if (this.waves && this.waves.baseInterval) this.waves.baseInterval *= D.spawnMul;
    // Survival / Boss Rush: no destructible Core — survive (score) or clear the
    // bosses. Use a large FINITE hp (Infinity would make the core's render math NaN).
    if (this.mode === 'survival' || this.mode === 'bossrush') { this.coreMaxHp = 1e9; this.coreHp = 1e9; }

    initScene({ W: FIELD.W, H: FIELD.H, GROUND: FIELD.GROUND, reduce });
    setDawn(this.dawn);
    clearProjectiles();

    if (opts.demo === 'lightlance') this._setupLightLanceDemo();
    else if (opts.demo === 'combos') this._setupComboDemo();
    else if (opts.demo === 'umbra') this._setupUmbraDemo();
  }

  // Umbra reveal-gate demo: the team's attacks barely scratch the cloaked boss
  // until Floris's Reveal exposes it (firing the Exposed combo).
  _setupUmbraDemo() {
    this.waves = { update() {} };
    this._freeDeploy('trooper', 400);
    this._freeDeploy('manu', 440);
    this._freeDeploy('floris', 480);
    this._freeDeploy('radu', 520);
    this.spawnEnemy('umbra');
    const u = this.enemies[this.enemies.length - 1];
    u.x = 860; u.r.x = 860;
  }

  // Deterministic showcase: the whole team grouped mid-field with auras up, so
  // the cooperative combos (Bastion Dawn, Morale Surge, Frozen Volley, Light
  // Lance) light up as enemies arrive.
  _setupComboDemo() {
    this.waves = new WaveDirector({ mode: 'endless', interval: 2.0, firstDelay: 0.6 });
    this._freeDeploy('floris', 420);
    this._freeDeploy('manu', 470);
    this._freeDeploy('radu', 510);
    this._freeDeploy('victor', 545);
    this._freeDeploy('pissy', 520);
    this._freeDeploy('andreea', 560);
    for (const c of this.allies) { if (c.def.id === 'radu') c.r.auraOn = true; if (c.def.id === 'pissy') c.r.moraleOn = true; }
  }

  // Deterministic "Dark Wall" demonstration: Radu's beam alone dies on the wall;
  // through Victor's prism it becomes the Light Lance and shatters it. Reused as
  // the campaign's combo-teaching beat.
  _setupLightLanceDemo() {
    this.waves = { update() {} };
    this.walls = [{ x: 720, top: FIELD.GROUND - 240, maxHp: 200, hp: 200, broken: 0 }];
    this._freeDeploy('victor', 600);
    this._freeDeploy('radu', 556);
    this.prisms.push({ x: 642, y: FIELD.GROUND - 150, asm: 0.001, life: 0, max: 40 });
    this.spawnEnemy('slinger');
    const s = this.enemies[this.enemies.length - 1];
    s.x = 900; s.r.x = 900; s.hp = s.maxHp = 300; // a durable target just beyond the wall, in Radu's range
  }

  _freeDeploy(id, x) {
    const def = heroDef(id); if (!def) return;
    const r = makeHero(id, x, FIELD.GROUND);
    const c = new Combatant('light', def, r, x);
    if (this._heroHpMul && this._heroHpMul !== 1) { c.maxHp = Math.round(c.maxHp * this._heroHpMul); c.hp = c.maxHp; }
    this.allies.push(c);
  }

  // ---- deployment ----------------------------------------------------------
  isLocked(id) { return this.lockedHeroes && this.lockedHeroes.includes(id); }
  canDeploy(id) {
    const def = heroDef(id); if (!def) return false;
    if (this.isLocked(id)) return false;
    if (!this.economy.canAfford(def.cost)) return false;
    return (this._deployCd && this._deployCd[id] > 0) ? false : true;
  }
  deploy(id) {
    const def = heroDef(id); if (!def) return false;
    if (this.isLocked(id)) return false; // power stolen this mission
    if (this._deployCd && this._deployCd[id] > 0) return false; // respect per-hero cooldown on all paths
    if (!this.economy.spend(def.cost)) return false;
    const x = FIELD.BASE_X + 44;
    const r = makeHero(id, x, FIELD.GROUND);
    const c = new Combatant('light', def, r, x);
    if (this._heroHpMul && this._heroHpMul !== 1) { c.maxHp = Math.round(c.maxHp * this._heroHpMul); c.hp = c.maxHp; }
    this.allies.push(c);
    this._deployCd = this._deployCd || {};
    this._deployCd[id] = def.deployCooldown;
    this.stats.deployed++;
    this.flash = Math.min(1, this.flash + 0.25);
    sfx('deploy');
    return true;
  }
  deployCooldownFrac(id) {
    const def = heroDef(id); if (!def || !def.deployCooldown) return 0;
    const c = this._deployCd && this._deployCd[id] ? this._deployCd[id] : 0;
    return c / def.deployCooldown;
  }

  spawnEnemy(kind) {
    const def = enemyDef(kind); if (!def) return;
    const x = FIELD.CORE_X - 44;
    const r = makeEnemy(kind, x, FIELD.GROUND);
    const c = new Combatant('shadow', def, r, x);
    if (this._enemyHpMul && this._enemyHpMul !== 1) { c.maxHp = Math.round(c.maxHp * this._enemyHpMul); c.hp = c.maxHp; }
    c.dmgMul = this._enemyDmgMul || 1;
    this.enemies.push(c);
  }

  // ---- damage helpers ------------------------------------------------------
  /** A Victor prism is deployed -> Mirrors can be hit. */
  _prismActive() { return this.prisms && this.prisms.length > 0; }

  applyDamage(target, dmg, opts = {}) {
    if (!target || target.dead) return;
    let d = dmg;
    if (target.def.traits && target.def.traits.includes('armored') && !opts.antiArmor) d *= 0.5;
    if (target.def.cloaked && (target.r.revealed || 0) < 0.5) d *= 0.15; // must be revealed
    // Mirror: reflects ranged light unless Victor's prism refracts around it
    if (target.def.traits && target.def.traits.includes('reflective') && opts.ranged && !this._prismActive()) {
      d *= 0.12; if (target.r) target.r.reflectFlash = 1;
    }
    target.hp -= d;
    if (opts.silence && target.side === 'light') target.silenced = 4; // Hexer's curse
    if (target.r.hit) target.r.hit();
    if (target.hp <= 0) this._kill(target);
  }
  splashDamage(x, side, radius, dmg, opts = {}) {
    const list = side === 'shadow' ? this.enemies : this.allies;
    for (const c of list) if (!c.dead && Math.abs(c.x - x) <= radius) this.applyDamage(c, dmg, opts);
  }
  _kill(c) {
    if (c.dead) return;
    c.dead = true;
    if (c.side === 'shadow') { this.economy.onKill(); this.stats.kills++; particles.emitPhotons(reduce ? 4 : 12, c.x, FIELD.GROUND - 40, 140, 20); }
  }

  /** Andreea's Temporal Eddy: projectiles inside a slow field crawl. */
  projectileTimeScaleAt(x, y) {
    let f = 1;
    for (const z of this.fields) if (z.kind === 'slow' && Math.hypot(x - z.x, y - z.y) <= z.r) f = Math.min(f, z.factor);
    return f;
  }

  // ---- main update ---------------------------------------------------------
  update(dt) {
    if (this.state !== 'playing') { this._decay(dt); return; }
    this.time += dt;

    // economy + Null-Drone suppression
    this.economy.suppressed = this.enemies.some((e) => !e.dead && e.def.traits && e.def.traits.includes('suppresses_regen'));
    this.economy.update(dt);
    for (const id in (this._deployCd || {})) if (this._deployCd[id] > 0) this._deployCd[id] = Math.max(0, this._deployCd[id] - dt);

    this.waves.update(dt, this);

    // sync + animate renderers
    for (const c of this.allies) { c.r.x = c.x; c.r.groundY = FIELD.GROUND; c.r.update(dt); }
    for (const c of this.enemies) { c.r.x = c.x; c.r.groundY = FIELD.GROUND; c.r.update(dt); }
    // Mirrors lower their reflection only while a prism is up
    const prismUp = this._prismActive();
    for (const e of this.enemies) if (e.r && e.def.traits && e.def.traits.includes('reflective')) e.r.reflectActive = !prismUp;

    // aura buffs (reset then apply)
    for (const c of this.allies) c.atkSpeedMul = 1;
    this._applyFields(dt);

    for (const c of this.allies) this._step(c, this.enemies, +1, dt);
    for (const c of this.enemies) this._step(c, this.allies, -1, dt);

    updateProjectiles(dt, this);
    particles.update(dt);
    this._updateBeams(dt);
    this.combo.update(dt);
    this.banner.update(dt);

    // collect screen shake from heroes (Manu smash etc.)
    for (const c of this.allies) if (c.r.shakeRequest) this.shake = Math.max(this.shake, c.r.shakeRequest);

    // reap dead
    this.allies = this.allies.filter((c) => !c.dead);
    this.enemies = this.enemies.filter((c) => !c.dead);

    // boss trigger (endless): Umbra emerges when the Dark Core drops below 40%
    if (this.mode === 'endless' && !this.umbraSpawned && this.coreHp < this.coreMaxHp * 0.4) {
      this.umbraSpawned = true;
      this.spawnEnemy('umbra');
      this.banner.show({ title: 'UMBRA', subtitle: 'Reveal it with Floris to strike', caption: 'Power alone fails against the dark.', c1: '#b06bff', c2: '#6a5acd' });
    }

    this._updateDawn(dt);
    this._decay(dt);

    if (this.mode === 'bossrush') {
      if (this.towerHp <= 0) this._finish('lost');
      else if (this.waves.done && this.enemies.length === 0 && this.time > 6) this._finish('won');
    } else if (this.coreHp <= 0) this._finish('won');
    else if (this.towerHp <= 0) this._finish('lost');
  }

  _step(c, foes, dir, dt) {
    if (c.dead) return;
    if (c.atkCd > 0) c.atkCd -= dt;
    if (c.abilityCd > 0) c.abilityCd -= dt;
    if (c.silenced > 0) c.silenced -= dt;
    if (c.stun > 0) { c.stun -= dt; return; }

    // signature ability (heroes) — Manu alternates Smash / Aegis of Dawn
    // (Hexer's curse silences signatures while c.silenced > 0)
    const sig = SIGNATURE[c.def.id];
    if (sig && c.abilityCd <= 0 && c.side === 'light' && c.silenced <= 0) {
      let method = sig.method;
      if (c.def.id === 'manu') { c._sigN = (c._sigN || 0) + 1; method = (c._sigN % 2 === 0) ? 'aegisOfDawn' : 'titanSmash'; }
      if (typeof c.r[method] === 'function') { this._fireSignature(c, method); c.abilityCd = sig.cd; }
    }

    const target = acquireTarget(c, foes);
    const struct = dir > 0 ? { x: FIELD.CORE_X, isCore: true } : { x: FIELD.BASE_X, isTower: true };
    const reachStruct = dir > 0 ? (c.x >= FIELD.CORE_X - Math.max(60, c.range)) : (c.x <= FIELD.BASE_X + Math.max(60, c.range));

    if (target && inRange(c, target)) {
      this._attack(c, target, dt);
    } else if (reachStruct && (!target || Math.abs(target.x - c.x) > c.range)) {
      this._attackStructure(c, struct, dt);
    } else {
      // a combo-gated wall blocks the LIGHT advance (only Light Lance breaks it)
      if (dir > 0) {
        const wall = this.walls.find((w) => w.hp > 0 && w.x > c.x && c.x >= w.x - 54);
        if (wall) { c.attacking = false; if (c.r.setState && this._isContinuous(c)) c.r.setState('idle'); return; }
      }
      // advance
      c.x += dir * c.def.moveSpeed * dt;
      c.x = clamp(c.x, FIELD.BASE_X + 20, FIELD.CORE_X - 20);
      c.attacking = false;
      if (c.r.setState && c.r.state !== 'walk' && this._isContinuous(c)) c.r.setState('walk');
    }
  }

  _isContinuous(c) { return c.r.state === 'idle' || c.r.state === 'walk'; }

  _attack(c, target, dt) {
    c.attacking = true;
    if (c.r.setState && this._isContinuous(c)) c.r.setState('idle');
    if (c.atkCd > 0) return;
    const a = c.def.attack;
    c.atkCd = a.cooldown / c.atkSpeedMul;
    const anti = c.def.id === 'manu' || (c.def.tags && c.def.tags.includes('anti_armor'));
    const dmg = a.damage * (c.dmgMul || 1); // enemy damage scaled by difficulty
    const silence = !!(c.def.traits && c.def.traits.includes('silencer'));
    // play attack flourish
    const anim = ATTACK_ANIM[c.def.id];
    if (anim && typeof c.r[anim] === 'function' && this._isContinuous(c)) c.r[anim]();

    if (a.kind === 'beam') {
      const dir = Math.sign(target.x - c.x) || 1;
      // Radu's beam through Victor's prism becomes the Light Lance (combo).
      if (c.def.id === 'radu' && this.combo.tryLightLance(c, dir)) {
        // the combo replaces the normal beam this shot
      } else {
        const foes = c.side === 'light' ? this.enemies : this.allies;
        for (const f of foes) if (!f.dead && Math.sign(f.x - c.x) === dir && Math.abs(f.x - c.x) <= a.range) this.applyDamage(f, dmg, { antiArmor: anti, ranged: true });
        this.beams.push({ x1: c.x, y: c.attackY, x2: c.x + dir * a.range, life: 0, max: 0.22, dark: c.side === 'shadow' });
      }
    } else if (a.kind === 'arc') {
      spawnArc({ side: c.side, x: c.x, y: c.attackY, tx: target.x, ty: FIELD.GROUND - 30, damage: dmg, splash: 80, dark: c.side === 'shadow' });
    } else if (a.kind === 'melee') {
      this.applyDamage(target, dmg, { antiArmor: anti, silence });
    } else if (a.kind === 'bolt') {
      spawnBolt({ side: c.side, x: c.x + Math.sign(target.x - c.x) * 18, y: c.attackY, target, damage: dmg, dark: c.side === 'shadow', pierce: !!a.pierce, silence });
    }
  }

  _attackStructure(c, struct, dt) {
    c.attacking = true;
    if (c.atkCd > 0) return;
    const a = c.def.attack; if (!a || a.kind === 'none') return;
    c.atkCd = a.cooldown / c.atkSpeedMul;
    const dmg = a.damage * (c.dmgMul || 1);
    if (struct.isCore) { this.coreHp = Math.max(0, this.coreHp - dmg); this.flash = Math.min(1, this.flash + 0.06); particles.emitPhotons(reduce ? 3 : 8, FIELD.CORE_X - 30, FIELD.GROUND - 70, 120, 20); }
    else { this.towerHp = Math.max(0, this.towerHp - dmg); this.shake = Math.max(this.shake, 6); }
  }

  _fireSignature(c, method) {
    try { c.r[method](); } catch (e) { /* visual-only safety */ }
    if (c.def.id === 'manu' && method === 'aegisOfDawn') { this.fields.push({ kind: 'dome', x: c.x, y: FIELD.GROUND, r: 120, life: 0, max: 4 }); }
    else if (c.def.id === 'manu') { this.splashDamage(c.x + 90, 'shadow', 110, 26, { antiArmor: true }); for (const e of this.enemies) if (Math.abs(e.x - (c.x + 90)) < 110) e.stun = 0.8; this.shake = Math.max(this.shake, 8); }
    else if (c.def.id === 'floris') { this.fields.push({ kind: 'reveal', x: c.x + 150, y: FIELD.GROUND - 80, r: 30, grow: 500, life: 0, max: 0.95 }); }
    else if (c.def.id === 'andreea') { const fx = frontMostAlly(this.allies); this.fields.push({ kind: 'slow', x: (fx ? fx.x : c.x) + 120, y: FIELD.GROUND - 90, r: 120, factor: 0.25, life: 0, max: 4, foesInside: false }); }
    else if (c.def.id === 'victor') { this.prisms.push({ x: clamp(c.x + 38, FIELD.BASE_X + 40, FIELD.CORE_X - 40), y: FIELD.GROUND - 150, asm: 0.001, life: 0, max: 16 }); }
    else if (c.def.id === 'radu') { c.r.auraOn = true; /* keep the aura up so allies stay buffed */ }
    else if (c.def.id === 'pissy') { c.r.moraleOn = true; }
  }

  _applyFields(dt) {
    // Radu aura: buff nearby allies' attack speed while auraOn
    for (const a of this.allies) {
      if (a.def.id === 'radu' && a.r.auraOn) {
        for (const o of this.allies) if (Math.abs(o.x - a.x) < 180) o.atkSpeedMul = Math.max(o.atkSpeedMul, 1.5);
      }
      // Pissy's Good Spirits cleanses the Hexer's silence on nearby friends
      if (a.def.id === 'pissy' && a.r.moraleOn) {
        for (const o of this.allies) if (Math.abs(o.x - a.x) < 200) o.silenced = 0;
      }
    }
    // timed combo haste (Bastion Dawn / Morale Surge) — applied before attacks resolve
    for (const c of this.allies) if (c.comboHaste && this.time < c.comboHaste.until) c.atkSpeedMul = Math.max(c.atkSpeedMul, c.comboHaste.mul);
    for (const z of this.fields) {
      z.life += dt;
      if (z.kind === 'reveal') {
        z.r = lerp(30, z.grow, Math.min(1, z.life / z.max));
        for (const e of this.enemies) if (e.def.cloaked && Math.abs(e.x - z.x) <= z.r) e.r.revealed = Math.min(1, (e.r.revealed || 0) + dt * 2);
      } else if (z.kind === 'slow') {
        if (this.enemies.some((e) => !e.dead && Math.abs(e.x - z.x) <= z.r)) {
          z.foesInside = true;
          if (!z.triggered) { z.triggered = true; this.combo.frozenVolley(z); }
        }
      }
    }
    // (Frozen Volley fires once on first foe-entry above; no duplicate on expiry.)
    this.fields = this.fields.filter((z) => z.life < (z.max || 1));
  }

  _updateBeams(dt) {
    for (const b of this.beams) b.life += dt;
    this.beams = this.beams.filter((b) => b.life < b.max);
    for (const l of this.lances) l.life += dt;
    this.lances = this.lances.filter((l) => l.life < l.max);
    for (const p of this.prisms) { p.life += dt; if (p.asm < 1) p.asm = Math.min(1, p.asm + dt * 2.2); }
    this.prisms = this.prisms.filter((p) => p.life < p.max);
  }

  breakWall(w) {
    if (w.hp <= 0) return;
    w.hp = 0; w.broken = 1;
    this.shake = Math.max(this.shake, 12);
    particles.emitPhotons(reduce ? 8 : 18, w.x, FIELD.GROUND - 110, 200, 30);
  }

  _updateDawn(dt) {
    const af = frontMostAlly(this.allies), ef = frontMostEnemy(this.enemies);
    const allyX = af ? af.x : FIELD.BASE_X;
    const enemyX = ef ? ef.x : FIELD.CORE_X;
    const contested = (allyX * 0.6 + enemyX * 0.4);
    const target = clamp((contested - FIELD.BASE_X) / (FIELD.CORE_X - FIELD.BASE_X), 0.05, 1);
    this._dawnV += (target - this._dawnV) * Math.min(1, dt * 1.5);
    this.dawn = this._dawnV; setDawn(this.dawn); setMusicDawn(this.dawn);
  }

  _decay(dt) {
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 26);
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2);
  }

  _finish(result) {
    if (this.state !== 'playing') return;
    this.state = result;
    this.flash = 1;
    sfx(result === 'won' ? 'win' : 'lose');
    if (this.mode === 'survival') { this.stats.timeSurvived = Math.floor(this.time); this.stats.score = this.stats.kills * 10 + this.stats.timeSurvived; }
    if (this.onEnd) this.onEnd(result, this.stats);
  }

  // ---- rendering -----------------------------------------------------------
  render(dt) {
    drawScene(dt);
    if (this.biome === 'eclipse') this._drawEclipse();
    this._drawTower();
    this._drawCore();
    this._drawWalls();
    // entities back-to-front by x (enemies + allies merged)
    const all = [...this.enemies, ...this.allies].sort((a, b) => a.x - b.x);
    const cb = getSettings().colorblind;
    for (const c of all) {
      if (c.scale !== 1) { ctx.save(); ctx.translate(c.x, FIELD.GROUND); ctx.scale(c.scale, c.scale); ctx.translate(-c.x, -FIELD.GROUND); c.r.draw(); ctx.restore(); }
      else c.r.draw();
      if (c.hp < c.maxHp && !c.dead) this._drawHpBar(c);
      if (cb && !c.dead) this._drawTag(c);
    }
    this._drawPrisms();
    this._drawFields();
    this._drawBeams();
    this._drawLances();
    drawProjectiles();
    particles.drawParts();
    drawVignette();
    if (this.flash > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba('#fff7e0', this.flash * 0.4); ctx.fillRect(0, 0, FIELD.W, FIELD.H); ctx.restore(); }
  }

  _drawTower() {
    const x = FIELD.BASE_X, baseY = FIELD.GROUND, hpF = this.towerHp / this.towerMaxHp;
    ctx.save();
    ctx.globalAlpha = 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, baseY + 6, 46, 12, 0, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(x, baseY - 120, 130, '#ffd87a', 0.18 + hpF * 0.14); ctx.restore();
    // luminous spire
    ctx.beginPath(); ctx.moveTo(x - 30, baseY); ctx.lineTo(x - 16, baseY - 190); ctx.lineTo(x, baseY - 230); ctx.lineTo(x + 16, baseY - 190); ctx.lineTo(x + 30, baseY); ctx.closePath();
    const g = ctx.createLinearGradient(x, baseY - 230, x, baseY); g.addColorStop(0, '#fff7d6'); g.addColorStop(0.5, mix('#ffe7a6', '#b9781f', 0.4)); g.addColorStop(1, '#7c4f15');
    ctx.fillStyle = g; ctx.strokeStyle = 'rgba(40,22,6,0.7)'; ctx.lineWidth = 3; ctx.fill(); ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#fffdf5'; star(x, baseY - 150, 16, 7, 6); ctx.fill(); glow(x, baseY - 150, 30, '#fff7d6', 0.9); ctx.restore();
    ctx.restore();
  }

  _drawCore() {
    const x = FIELD.CORE_X, baseY = FIELD.GROUND, hpF = this.coreHp / this.coreMaxHp;
    ctx.save();
    ctx.globalAlpha = 0.34; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, baseY + 6, 50, 13, 0, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1;
    // dark pylon base
    ctx.fillStyle = '#0c0a1a'; ctx.strokeStyle = '#05040c'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - 34, baseY); ctx.lineTo(x - 22, baseY - 150); ctx.lineTo(x + 22, baseY - 150); ctx.lineTo(x + 34, baseY); ctx.closePath(); ctx.fill(); ctx.stroke();
    // pulsing void orb
    const pulse = 0.5 + Math.sin(this.time * 3) * 0.1;
    const cy = baseY - 180, r = 40 + (1 - hpF) * 6;
    ctx.fillStyle = '#05040c'; ctx.beginPath(); ctx.arc(x, cy, r, 0, 6.28); ctx.fill();
    const vg = ctx.createRadialGradient(x, cy, 4, x, cy, r); vg.addColorStop(0, mix('#3a1d6e', '#7a3aff', pulse)); vg.addColorStop(1, '#0c0820');
    ctx.fillStyle = vg; ctx.beginPath(); ctx.arc(x, cy, r * 0.8, 0, 6.28); ctx.fill();
    ctx.strokeStyle = rgba('#9a6bff', 0.5 + pulse * 0.3); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, cy, r, 0, 6.28); ctx.stroke();
    ctx.restore();
  }

  // colorblind aid: a letter tag (hero/enemy initial) so units aren't color-only
  _drawTag(c) {
    const letter = ((c.def.name || '?')[0] || '?').toUpperCase();
    const y = c.side === 'light' ? FIELD.GROUND - 172 : FIELD.GROUND - ((c.r.h || 64) + (c.r.hover || 0) + 34);
    ctx.save();
    ctx.fillStyle = c.side === 'light' ? 'rgba(255,210,74,0.9)' : 'rgba(176,107,255,0.9)';
    ctx.beginPath(); ctx.arc(c.x, y, 9, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#0c0a14'; ctx.font = '700 11px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(letter, c.x, y + 0.5); ctx.textAlign = 'left'; ctx.restore();
  }

  _drawHpBar(c) {
    const w = 36, x = c.x - w / 2;
    const y = c.side === 'light' ? FIELD.GROUND - 158 : FIELD.GROUND - ((c.r.h || 64) + (c.r.hover || 0) + 14);
    const f = clamp(c.hp / c.maxHp, 0, 1);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x, y, w, 4);
    ctx.fillStyle = c.side === 'light' ? '#ffd24a' : '#b06bff'; ctx.fillRect(x, y, w * f, 4);
    ctx.restore();
  }

  _drawFields() {
    for (const z of this.fields) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      if (z.kind === 'slow') { glow(z.x, z.y, z.r, '#7fb0ff', 0.18); ctx.strokeStyle = rgba('#bcd4ff', 0.4); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 6.28); ctx.stroke(); }
      else if (z.kind === 'reveal') { const a = 1 - z.life / z.max; ctx.strokeStyle = rgba('#9bf0cf', a * 0.8); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 6.28); ctx.stroke(); }
      else if (z.kind === 'dome') { const a = 1 - (z.life / z.max) * 0.4; glow(z.x, z.y - z.r * 0.4, z.r, '#ffd87a', 0.1 * a); ctx.strokeStyle = rgba('#ffd24a', 0.55 * a); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, Math.PI, 0); ctx.stroke(); ctx.strokeStyle = rgba('#fff7d6', 0.3 * a); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(z.x, z.y, z.r - 5, Math.PI, 0); ctx.stroke(); }
      ctx.restore();
    }
  }

  _drawBeams() {
    for (const b of this.beams) {
      const a = 1 - b.life / b.max;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(b.x1, 0, b.x2, 0);
      g.addColorStop(0, rgba(b.dark ? '#b06bff' : '#ffd24a', 0.7 * a)); g.addColorStop(1, rgba('#fffef8', 0.9 * a));
      ctx.strokeStyle = g; ctx.lineCap = 'round'; ctx.lineWidth = 9 * a + 3; ctx.beginPath(); ctx.moveTo(b.x1, b.y); ctx.lineTo(b.x2, b.y); ctx.stroke();
      ctx.restore();
    }
  }

  _drawEclipse() {
    const x = FIELD.W * 0.62, y = FIELD.GROUND - 50;
    ctx.save();
    ctx.fillStyle = 'rgba(38,18,66,0.30)'; ctx.fillRect(0, 0, FIELD.W, FIELD.GROUND + 30); // violet sky tint
    ctx.globalCompositeOperation = 'lighter';
    glow(x, y, 150, '#b06bff', 0.30); glow(x, y, 90, '#dca6ff', 0.22); // corona
    ctx.restore();
    ctx.save();
    ctx.fillStyle = '#0a0716'; ctx.beginPath(); ctx.arc(x, y, 60, 0, 6.28); ctx.fill(); // dark disc
    ctx.strokeStyle = rgba('#c9a6ff', 0.8); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 60, 0, 6.28); ctx.stroke();
    ctx.restore();
  }

  _drawWalls() {
    for (const w of this.walls) {
      if (w.hp <= 0) continue;
      const x = w.x, top = w.top, gy = FIELD.GROUND;
      ctx.save();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(x, (gy + top) / 2, 44, '#7a1fd6', 0.12); ctx.restore();
      const g = ctx.createLinearGradient(x - 16, 0, x + 16, 0); g.addColorStop(0, '#241340'); g.addColorStop(0.5, '#3a1d6e'); g.addColorStop(1, '#180c2c');
      ctx.fillStyle = g; ctx.strokeStyle = 'rgba(150,90,230,0.35)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(x - 16, top, 32, gy - top, 6); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = rgba('#b47bff', 0.6 + Math.sin(this.time * 3) * 0.2); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - 2, top + 24); ctx.lineTo(x - 8, gy - 60); ctx.lineTo(x + 4, gy - 14); ctx.stroke();
      ctx.restore();
    }
  }

  _drawPrisms() {
    for (const p of this.prisms) {
      const a = p.asm, s = easeOutBack(clamp(a, 0, 1));
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s, s); ctx.rotate(Math.sin(this.time * 1.2) * 0.05 - 0.18);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(0, 0, 46, '#7fe9dd', 0.28); ctx.restore();
      ctx.beginPath(); ctx.moveTo(-14, -34); ctx.lineTo(14, -30); ctx.lineTo(18, 30); ctx.lineTo(-10, 34); ctx.closePath();
      const g = ctx.createLinearGradient(-16, 0, 18, 0); g.addColorStop(0, 'rgba(127,233,221,0.25)'); g.addColorStop(0.5, 'rgba(230,255,251,0.6)'); g.addColorStop(1, 'rgba(110,208,255,0.3)');
      ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2.4; ctx.strokeStyle = '#eafffb'; ctx.stroke();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 2;
      ['#ff6f6f', '#ffd24a', '#6fffa0', '#6fd0ff', '#b47bff'].forEach((c, i) => { ctx.strokeStyle = rgba(c, 0.45); ctx.beginPath(); ctx.moveTo(-12 + i * 1.5, -30); ctx.lineTo(8 + i * 2, 30); ctx.stroke(); });
      ctx.restore();
      ctx.fillStyle = '#e7b25e'; ctx.strokeStyle = '#0f1208'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(-12, 30, 26, 10, 3); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }

  _drawLances() {
    for (const l of this.lances) {
      const fade = l.life > l.max * 0.6 ? 1 - (l.life - l.max * 0.6) / (l.max * 0.4) : 1;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = clamp(fade, 0, 1); ctx.lineCap = 'round';
      const path = [[l.x1, l.y1], [l.px, l.py], [l.x2, l.y2]];
      const stroke = (w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(path[0][0], path[0][1]); for (let i = 1; i < path.length; i++) ctx.lineTo(path[i][0], path[i][1]); ctx.stroke(); };
      stroke(22, rgba('#ffd24a', 0.5)); stroke(14, rgba('#3fd6c8', 0.4)); stroke(6, 'rgba(255,255,255,0.95)');
      glow(l.x2, l.y2, 26, '#fff7d6', 0.85 * fade);
      ctx.restore();
    }
  }
}
