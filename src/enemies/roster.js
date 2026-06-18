// roster.js (enemies) — bind ENEMY_DEFS to their renderer classes.
import { ENEMY_DEFS } from '../data/enemies.js';
import { Crawler } from './crawler.js';
import { Slinger } from './slinger.js';
import { Brute } from './brute.js';
import { NullDrone } from './nullDrone.js';
import { Wraith } from './wraith.js';
import { Juggernaut } from './juggernaut.js';
import { Hexer } from './hexer.js';
import { Mirror } from './mirror.js';
import { Umbra } from './bosses/umbra.js';
import { DoctorNull } from './bosses/doctorNull.js';
import { TheVoid } from './bosses/theVoid.js';

const CLASSES = { crawler: Crawler, slinger: Slinger, brute: Brute, nullDrone: NullDrone, wraith: Wraith, juggernaut: Juggernaut, hexer: Hexer, mirror: Mirror, umbra: Umbra, doctorNull: DoctorNull, theVoid: TheVoid };

export function makeEnemy(kind, x, groundY) {
  const Cls = CLASSES[kind];
  if (!Cls) throw new Error(`Unknown enemy kind: ${kind}`);
  return new Cls({ x, groundY });
}
export function enemyDef(kind) { return ENEMY_DEFS[kind]; }
export { ENEMY_DEFS };
