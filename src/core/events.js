// events.js — tiny event bus. Used to decouple systems (combo engine fires
// "combo:triggered", HUD listens; battle fires "enemy:killed", economy listens).

export function makeBus() {
  /** @type {Map<string, Set<Function>>} */
  const map = new Map();
  return {
    on(type, fn) {
      if (!map.has(type)) map.set(type, new Set());
      map.get(type).add(fn);
      return () => map.get(type)?.delete(fn);
    },
    off(type, fn) { map.get(type)?.delete(fn); },
    emit(type, payload) {
      const set = map.get(type);
      if (!set) return;
      for (const fn of set) {
        try { fn(payload); } catch (e) { console.error(`[events] handler for "${type}" threw:`, e); }
      }
    },
    clear() { map.clear(); },
  };
}

/** A shared app-wide bus instance. */
export const bus = makeBus();
