// waves.js — the spawn director. Two modes: 'endless' (escalating skirmish,
// the prototype's mode) and 'script' (authored WaveDef entries for campaign
// missions). Umbra's boss trigger (Dark Core < ~40%) is handled by the Battle.

export class WaveDirector {
  constructor(opts = {}) {
    this.mode = opts.mode || 'endless';
    this.elapsed = 0;
    this.spawnT = opts.firstDelay != null ? opts.firstDelay : 2.5;
    this.baseInterval = opts.interval || 3.4;
    this.script = opts.script || null; // [{enemyId,count,atTime}]
    this._fired = this.script ? this.script.map(() => 0) : [];
    this.done = false;
  }

  update(dt, battle) {
    this.elapsed += dt;
    if (this.mode === 'script' && this.script) {
      let pending = false;
      for (let i = 0; i < this.script.length; i++) {
        const e = this.script[i];
        if (this.elapsed >= e.atTime && this._fired[i] < e.count) {
          // drip the count out over ~0.5s each
          const due = Math.min(e.count, Math.floor((this.elapsed - e.atTime) / 0.5) + 1);
          while (this._fired[i] < due) { battle.spawnEnemy(e.enemyId); this._fired[i]++; }
        }
        if (this._fired[i] < e.count) pending = true;
      }
      this.done = !pending;
      return;
    }
    // endless: escalating cadence + mix
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      const interval = Math.max(0.85, this.baseInterval - this.elapsed * 0.018);
      this.spawnT = interval;
      battle.spawnEnemy(this.pickKind());
      // occasional double-spawn as it heats up
      if (this.elapsed > 30 && Math.random() < 0.35) battle.spawnEnemy(this.pickKind());
    }
  }

  pickKind() {
    const e = this.elapsed, r = Math.random();
    if (e > 75 && r < 0.10) return 'juggernaut'; // late-game siege
    if (e > 55 && r < 0.16) return 'wraith';      // fast cloaked flankers
    if (e > 45 && r < 0.12) return 'nullDrone';
    if (e > 22 && r < 0.28) return 'brute';
    if (r < 0.5) return 'crawler';
    return 'slinger';
  }
}
