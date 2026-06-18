# Echipa Lumina: Frontline of Light

A touch-first, offline-capable **2D Canvas** lane-battler — *"a living comic of
light."* Radu Photon leads **Echipa Lumina** (the Light Team) against the Shadow
Network. The sky turns from dark void to dawn as the light side advances, and
the heart of the game is the **friendship / combo engine**: heroes combined are
transformative, and some obstacles can only be broken *together*.

Reproduces the approved "feel slice" art and ability-feel in a real, modular
codebase and grows it through the milestones in
`../CLAUDE-CODE-BRIEF-echipa-lumina.md`.

---

## Status — all milestones implemented

- **M1 Engine + renderer + Radu** — ported render toolkit (primitives, palette,
  inked figures, verlet cloth, painted dawn scene, photon particles), guarded
  loop, DPR viewport. Radu rendered indistinguishably from his feel slice.
- **M2 All heroes + lane battle** — Radu, Victor, Manu, Floris, Andreea (ported
  from their feel slices) + Light Trooper + provisional Pissy; the tug-of-war
  battle (Photon Tower vs Dark Core), light-energy economy, escalating waves,
  Shadow minions, HUD + deploy cards, touch/keys, front-line→dawn, win/lose,
  Menu → Battle → Result.
- **M3 Friendship / combo engine** — 8 combos incl. the **Light Lance**
  (Radu × Victor through the Prism) that shatters combo-gated **dark walls**;
  banners + the thesis caption *"Friendship is stronger than power."*
- **M4 Villains + bosses** — Crawler / Slinger / Brute / Null-Drone (regen
  suppression), and **Umbra**, the reveal-gated boss (near-immune until Floris
  exposes it → fires the **Exposed** combo).
- **M5 Campaign + meta + audio + a11y + save + PWA** — Act I campaign map &
  missions (combo-teaching beats), the friendship upgrade meta, synthesized
  adaptive dark→dawn audio + SFX, a DOM accessibility settings panel, versioned
  save, and a service worker (offline + installable).
- **M6 Content / balance / polish** — Doctor Null & The Void finale bosses, the
  full 8-combo set, an adversarial code review pass (12 findings fixed).

---

## Run it

No build step. You only need a static file server because browsers load ES
modules over `http://`, not `file://`.

**Windows (uses Git's bundled Perl — no Node/Python required):**

```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1   # or double-click serve.bat
```

Then open <http://localhost:8080/>.

Any static server works too (`npx serve`, `python -m http.server`, VS Code Live
Server, …) — point it at this folder.

### Controls

- **Deploy:** tap a card or press `1`–`7` (Trooper, Manu, Victor, Floris,
  Andreea, Radu, Pissy). Units auto-advance, auto-engage, and fire abilities;
  combos trigger automatically when heroes cooperate.
- **Menu:** Campaign · Play (Endless Skirmish) · Hero Gallery · Settings.

### Dev / demo routes (URL hash)

| Hash | Shows |
|---|---|
| `#feel` | Radu feel slice (M1 fidelity reference) |
| `#hero=victor` (manu/floris/andreea/pissy/trooper) | a single hero in isolation + its moves |
| `#scene=battle,auto` | endless skirmish, auto-played (attract mode) |
| `#demo=combos` | the whole team mid-field — watch the 8 combos fire |
| `#demo=lightlance` | the Dark Wall broken by the Light Lance |
| `#demo=umbra` | Umbra revealed by Floris (reveal-gate) |
| `#scene=campaign` · `#mission=m1_2` | campaign map / a specific mission |

---

## Project structure

```
echipa-lumina/
├─ index.html · serve.ps1 / serve.bat · sw.js (service worker)
├─ public/ manifest.webmanifest, icons/
├─ tools/serve.pl            zero-dependency static server (Perl core)
└─ src/
   ├─ main.js                bootstrap + hash routing + nav + PWA/audio init
   ├─ core/                  loop, canvas (DPR viewport), time, input, rng, events, pool, env
   ├─ render/                gfx (active ctx), primitives, palette, figure, cloth, scene, particles
   ├─ heroes/                HeroBase, radu/victor/manu/floris/andreea/trooper/pissy, roster
   ├─ enemies/               EnemyBase, crawler/slinger/brute/nullDrone, bosses/ (umbra, doctorNull, theVoid)
   ├─ abilities/             projectiles (bolts/arcs)
   ├─ combo/                 ComboEngine, combos (8 ComboDefs)
   ├─ sim/                   Battle, economy, waves, targeting, field
   ├─ scenes/                SceneManager, Menu, CampaignMap, Battle, Result, FeelSlice, HeroPreview
   ├─ ui/                    hud, comboBanner, widgets, settingsPanel
   ├─ a11y/                  settings
   ├─ audio/                 audio (Web Audio synthesis)
   ├─ save/                  save (versioned localStorage + migrate)
   └─ data/                  heroes, enemies, missions, upgrades  (tunable, data-driven)
```

### Extending (data + minimal code)

- **Hero:** read its feel slice → `src/heroes/<id>.js` extending `HeroBase`
  (port `pose()`/`draw*()`/abilities, own INK/RIM via `setFigureStyle`, a static
  `MOVES`) → add stats to `data/heroes.js` + register in `heroes/roster.js`.
- **Combo:** add a `ComboDef` to `combo/combos.js` + a detection/effect hook in
  `ComboEngine`.
- **Mission:** add a `MissionDef` (waves / walls / bosses) to `data/missions.js`.
- **Enemy / boss:** `src/enemies/[bosses/]<id>.js` + `data/enemies.js` + roster.

---

## Why native ES modules (and not Vite/TypeScript yet)

The brief specifies Vite + TypeScript. The machine this was built on is locked
down: **Node.js cannot be installed** (winget blocked by group policy, direct
`nodejs.org` downloads reset by the firewall, no Python). So this is authored as
**native ES modules** that run with zero tooling via the bundled-Perl server.

This is *forward-compatible*, not a different architecture — Vite serves native
ES modules as-is. Migrating to the brief's exact stack is mechanical:
`npm create vite`, drop in `src/`, optionally rename `.js`→`.ts` (the JSDoc
typedefs sketch the types), swap the hand-rolled `sw.js` for `vite-plugin-pwa`,
and add Vitest for the pure-logic modules (economy, combo resolution, save).
The Canvas2D rendering pipeline — the thing the brief insists must be preserved
— is untouched by any of that.

## Known gaps / future work

- A dedicated **upgrade-tree UI** (upgrades currently auto-unlock per mission
  clear and apply their effects; the data + effects are in `data/upgrades.js`).
- Acts II–IV beyond the Act I arc; more authored waves and balance tuning.
- A **Pissy feel slice** for art approval (Pissy is provisional).
- Victor/Floris ability particles currently use the shared gold photons rather
  than their teal/violet variants (a fidelity nicety).
