// main.js — bootstrap + navigation. Routes by URL hash:
//   (default)   -> Main Menu  (the game)
//   #scene=battle[,auto]      -> straight into an endless skirmish (auto = demo)
//   #hero=<id>  -> generic HeroPreviewScene  (radu -> the rich FeelSliceScene)
//   #feel       -> Radu feel slice
// In-app navigation (Menu -> Battle -> Result -> Menu) is handled by `nav`.

import { makeViewport } from './core/canvas.js';
import { startLoop } from './core/loop.js';
import { bindKeys } from './core/input.js';
import { SceneManager } from './scenes/SceneManager.js';
import { FeelSliceScene } from './scenes/FeelSliceScene.js';
import { HeroPreviewScene } from './scenes/HeroPreviewScene.js';
import { BattleScene } from './scenes/BattleScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { ResultScene } from './scenes/ResultScene.js';
import { CampaignMapScene } from './scenes/CampaignMapScene.js';
import { makeHero, heroClass } from './heroes/roster.js';
import { recordMission } from './save/save.js';
import { missionById } from './data/missions.js';
import { clamp } from './render/primitives.js';
import { startAudio } from './audio/audio.js';
import { getSettings } from './a11y/settings.js';

const canvas = document.getElementById('c');
const viewport = makeViewport(canvas, 960, 600);
const scenes = new SceneManager();

function parseHash() {
  const out = { moves: [] };
  const h = decodeURIComponent(location.hash.replace(/^#/, '')).trim();
  for (const tok of h.split(/[,&]/).map((s) => s.trim()).filter(Boolean)) {
    const kv = tok.match(/^(\w+)=(.+)$/);
    if (kv) out[kv[1]] = kv[2]; else out.moves.push(tok);
  }
  return out;
}
const params = parseHash();

const bar = document.getElementById('bar');
const dawnEl = document.getElementById('dawn');
const auraBtn = document.getElementById('auraBtn');
function setChrome(show) { for (const sel of ['.titlewrap', '#bar', '.hint']) { const el = document.querySelector(sel); if (el) el.style.display = show ? '' : 'none'; } }

// ----- in-app navigation ----------------------------------------------------
const nav = {
  menu() { setChrome(false); scenes.set(new MenuScene(viewport, nav)); },
  battle(opts = {}) {
    setChrome(false);
    scenes.set(new BattleScene(viewport, { ...opts, onResult: (res, stats) => nav.result(res, { ...stats, mode: opts.mode || 'endless' }) }));
  },
  campaign() { setChrome(false); scenes.set(new CampaignMapScene(viewport, nav)); },
  mission(m) {
    setChrome(false);
    scenes.set(new BattleScene(viewport, { ...m.opts, mode: 'campaign', onResult: (res, stats) => nav.result(res, { ...stats, mode: 'campaign', mission: m }) }));
  },
  result(res, stats) {
    setChrome(false);
    if (stats.mission && res === 'won') {
      const stars = clamp(1 + Math.floor((stats.kills || 0) / 10), 1, 3);
      recordMission(stats.mission.id, stars, true);
      stats.stars = stars;
    }
    scenes.set(new ResultScene(viewport, nav, res, stats));
  },
  gallery() { location.hash = '#feel'; location.reload(); },
};

// ----- initial route --------------------------------------------------------
if (params.scene === 'campaign') {
  nav.campaign();
} else if (params.mission && missionById(params.mission)) {
  nav.mission(missionById(params.mission));
} else if (params.scene === 'battle' || params.demo) {
  const walls = params.wall != null || params.moves.includes('wall') ? [{ x: 720, height: 240, hp: 200 }] : undefined;
  nav.battle({ mode: 'endless', auto: params.auto != null || params.moves.includes('auto'), walls, demo: params.demo });
} else if (params.feel != null || params.moves.includes('feel') || params.hero === 'radu') {
  setChrome(true);
  const scene = new FeelSliceScene(viewport);
  scenes.set(scene);
  wireRaduControls(scene);
} else if (params.hero && heroClass(params.hero)) {
  setChrome(true);
  const hero = makeHero(params.hero, 372, 506);
  const scene = new HeroPreviewScene(viewport, hero);
  scenes.set(scene);
  rebuildControls(scene, hero);
} else {
  nav.menu();
}

// ----- Radu feel-slice controls ---------------------------------------------
function wireRaduControls(scene) {
  function doAct(action) { const r = scene.act(action); if (action === 'aura' && auraBtn) auraBtn.classList.toggle('on', !!r); }
  if (bar) bar.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (b) doAct(b.dataset.act); });
  if (dawnEl) dawnEl.addEventListener('input', (e) => scene.setDawn((+e.target.value) / 100));
  bindKeys({ '1': () => doAct('idle'), '2': () => doAct('walk'), '3': () => doAct('dash'), '4': () => doAct('blast'), 'a': () => doAct('aura') });
  for (const m of params.moves) doAct(m);
  if (params.dawn != null) { const v = parseFloat(params.dawn); scene.setDawn(v); if (dawnEl) dawnEl.value = String(Math.round(v * 100)); }
}

// ----- generic hero preview controls (built from hero MOVES) ----------------
function rebuildControls(scene, hero) {
  const moves = hero.constructor.MOVES || [];
  if (!bar) return;
  bar.innerHTML = '';
  const title = document.querySelector('.title');
  if (title) title.textContent = hero.name + (hero.constructor.PROVISIONAL ? ' (provisional)' : '');
  const keyMap = {};
  const apply = (m, btn) => { const r = scene.act(m); if (typeof r === 'boolean' && btn) btn.classList.toggle('on', r); };
  for (const m of moves) {
    const btn = document.createElement('button');
    btn.className = 'btn' + (m.method ? ' primary' : '');
    btn.textContent = m.label;
    btn.addEventListener('click', () => apply(m, btn));
    bar.appendChild(btn);
    keyMap[m.key] = () => apply(m, btn);
  }
  const wrap = document.createElement('span'); wrap.className = 'dawn'; wrap.innerHTML = 'Dawn ';
  const slider = document.createElement('input'); slider.type = 'range'; slider.min = 0; slider.max = 100; slider.value = 50;
  slider.addEventListener('input', (e) => scene.setDawn((+e.target.value) / 100));
  wrap.appendChild(slider); bar.appendChild(wrap);
  bindKeys(keyMap);
  for (const mv of params.moves) { const m = moves.find((x) => x.state === mv || (x.label || '').toLowerCase() === mv.toLowerCase()); if (m) scene.act(m); }
  if (params.dawn != null) scene.setDawn(parseFloat(params.dawn));
}

// ----- audio start on first gesture (mobile requirement) --------------------
['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, startAudio, { once: true, passive: true }));

// ----- PWA: service worker + install affordance -----------------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); deferredPrompt = e;
  const btn = document.createElement('button');
  btn.textContent = '⤓ Install';
  btn.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:50;padding:10px 16px;border-radius:12px;border:1px solid rgba(255,210,74,.5);background:rgba(16,18,32,.85);color:#ffd24a;font:700 14px system-ui;cursor:pointer';
  btn.onclick = async () => { btn.remove(); if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt = null; } };
  document.body.appendChild(btn);
});

// ----- run ------------------------------------------------------------------
// gameSpeed is an accessibility option (slow the whole game); clamp dt sanity.
startLoop((dt) => scenes.update(dt * (getSettings().gameSpeed || 1)), (dt) => scenes.render(dt));
