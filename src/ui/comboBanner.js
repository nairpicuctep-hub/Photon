// comboBanner.js — the "✦ LIGHT LANCE"-style callout + thesis caption. PORTED
// look from radu-victor-combo-feelslice.html: gold→teal gradient title that
// scales in (easeOutBack), a "Hero × Hero — combo" subtitle, and a caption line
// ("Friendship is stronger than power.").

import { ctx } from '../render/gfx.js';
import { rgba, clamp, easeOutBack } from '../render/primitives.js';
import { FIELD } from '../sim/field.js';

export class ComboBanner {
  constructor() { this.banner = null; this.caption = { txt: '', a: 0 }; }

  show(def) {
    this.banner = { t: 0, title: def.title, subtitle: def.subtitle, c1: def.c1 || '#ffd24a', c2: def.c2 || '#3fd6c8' };
    if (def.caption) this.setCaption(def.caption);
  }
  setCaption(txt) { this.caption = { txt, a: 0 }; }

  update(dt) {
    if (this.caption.a < 1) this.caption.a = Math.min(1, this.caption.a + dt * 3);
    if (this.banner) { this.banner.t += dt; if (this.banner.t > 2.2) this.banner = null; }
  }

  draw() {
    if (this.banner) {
      const b = this.banner, k = b.t;
      const a = k < 0.2 ? k / 0.2 : k > 1.6 ? 1 - (k - 1.6) / 0.6 : 1;
      const s = easeOutBack(clamp(k / 0.4, 0, 1));
      ctx.save(); ctx.globalAlpha = clamp(a, 0, 1); ctx.textAlign = 'center';
      ctx.translate(FIELD.W / 2, 160); ctx.scale(s, s);
      ctx.shadowColor = rgba('#ffd24a', 0.6); ctx.shadowBlur = 30;
      const g = ctx.createLinearGradient(-200, 0, 200, 0); g.addColorStop(0, b.c1); g.addColorStop(1, b.c2);
      ctx.fillStyle = g; ctx.font = '900 50px system-ui,sans-serif'; ctx.fillText(b.title, 0, 0);
      ctx.shadowBlur = 0; ctx.fillStyle = '#eef1ff'; ctx.font = '700 17px system-ui,sans-serif';
      ctx.fillText(b.subtitle, 0, 32);
      ctx.textAlign = 'left'; ctx.restore();
    }
    if (this.caption.txt) {
      ctx.save(); ctx.globalAlpha = this.caption.a; ctx.textAlign = 'center';
      ctx.fillStyle = '#fff7e0'; ctx.font = '800 22px system-ui,sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 10;
      ctx.fillText(this.caption.txt, FIELD.W / 2, FIELD.H - 96);
      ctx.textAlign = 'left'; ctx.restore();
    }
  }
}
