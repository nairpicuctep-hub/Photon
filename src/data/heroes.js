// heroes.js — tunable hero stats (the data-driven roster). The brief calls for
// data/*.json; we use a JS data module instead (no bundler/fetch needed and it
// imports directly). Values are the prototyped starting points — tune freely;
// no game logic lives here.
//
// HeroDef: { id, name, role, cost, deployCooldown, maxHp, moveSpeed,
//            attack:{ damage, range, cooldown, pierce?, kind }, abilities:[ids],
//            tags?:[] }

/** @type {Record<string, any>} */
export const HERO_DEFS = {
  trooper: {
    id: 'trooper', name: 'Light Trooper', role: 'Backbone',
    cost: 15, deployCooldown: 2.5, maxHp: 70, moveSpeed: 62,
    attack: { damage: 8, range: 230, cooldown: 0.95, kind: 'bolt' },
    abilities: [],
  },
  manu: {
    id: 'manu', name: 'Manu Titanul', role: 'Tank',
    cost: 50, deployCooldown: 14, maxHp: 340, moveSpeed: 40,
    attack: { damage: 24, range: 78, cooldown: 1.5, kind: 'melee' },
    abilities: ['titan_smash', 'aegis_of_dawn'], tags: ['anti_armor', 'darkness_resist'],
  },
  victor: {
    id: 'victor', name: 'Victor Creatorul', role: 'Maker / Zone',
    cost: 40, deployCooldown: 12, maxHp: 120, moveSpeed: 58,
    attack: { damage: 11, range: 300, cooldown: 1.4, kind: 'bolt' },
    abilities: ['prism_mirror'],
  },
  floris: {
    id: 'floris', name: 'Floris Cunoasterea', role: 'Support / Intel',
    cost: 40, deployCooldown: 12, maxHp: 100, moveSpeed: 56,
    attack: { damage: 14, range: 430, cooldown: 2.2, kind: 'arc' },
    abilities: ['reveal', 'codex_barrage'],
  },
  andreea: {
    id: 'andreea', name: 'Andreea Intelepciunea', role: 'Control / Mind',
    cost: 45, deployCooldown: 13, maxHp: 100, moveSpeed: 56,
    attack: { damage: 9, range: 360, cooldown: 1.6, kind: 'bolt' },
    abilities: ['temporal_eddy', 'foresight'],
  },
  radu: {
    id: 'radu', name: 'Radu Photon', role: 'Leader / Striker',
    cost: 45, deployCooldown: 12, maxHp: 130, moveSpeed: 72,
    attack: { damage: 18, range: 380, cooldown: 1.6, pierce: true, kind: 'beam' },
    abilities: ['energy_blast', 'lightstep', 'photon_aura', 'infinite_potential'],
  },
  pissy: {
    id: 'pissy', name: 'Pissy', role: 'Wildcard',
    cost: 35, deployCooldown: 11, maxHp: 90, moveSpeed: 70,
    attack: { damage: 11, range: 280, cooldown: 1.2, kind: 'bolt' },
    abilities: ['blink', 'mischief', 'good_spirits'], tags: ['provisional'],
  },
};

// Deploy-bar order (brief hotkeys 1..7): trooper, manu, victor, floris, andreea, radu, pissy
export const DEPLOY_ORDER = ['trooper', 'manu', 'victor', 'floris', 'andreea', 'radu', 'pissy'];
