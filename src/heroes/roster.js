// roster.js — binds tunable HERO_DEFS (data) to their renderer classes (code).
// One place the battle + previews resolve "id -> { def, make() }".

import { HERO_DEFS, DEPLOY_ORDER } from '../data/heroes.js';
import { Trooper } from './trooper.js';
import { Manu } from './manu.js';
import { Victor } from './victor.js';
import { Floris } from './floris.js';
import { Andreea } from './andreea.js';
import { Radu } from './radu.js';
import { Pissy } from './pissy.js';

const CLASSES = { trooper: Trooper, manu: Manu, victor: Victor, floris: Floris, andreea: Andreea, radu: Radu, pissy: Pissy };

/** Make a hero renderer instance positioned at (x, groundY). */
export function makeHero(id, x, groundY) {
  const Cls = CLASSES[id];
  if (!Cls) throw new Error(`Unknown hero id: ${id}`);
  return new Cls({ x, groundY });
}

export function heroDef(id) { return HERO_DEFS[id]; }
export function heroClass(id) { return CLASSES[id]; }
export { DEPLOY_ORDER, HERO_DEFS };
