# Radu Photon — Echipa Lumina

*A light-versus-darkness game made from a kid's comic.*

Radu visits CERN with his dad, an accelerator accident turns his atoms into photons, and he becomes **Radu Photon** — a hero who controls light and leads **Echipa Lumina** ("the Light Team"). The idea running through everything: **friendship is stronger than power.**

This repository holds the games built from that comic. The main game is a side-view tactical lane-battler; two earlier prototypes and the design docs are included as well.

---

## Play

**Main game — *Frontline of Light*** (the lane-battler)
- **Online:** turn on GitHub Pages (steps below) and open `https://<your-username>.github.io/<repo-name>/`
- **Offline:** just double-click `index.html`. No install, no internet, no setup — it runs anywhere, including locked-down work computers.

**Other prototypes**
- `games/classic-2d.html` — the original light-puzzle chamber game (double-click to play)
- `games/3d/index.html` — a 3D arena prototype with switchable heroes (needs internet on first load; can be installed as an app on a phone)

---

## Controls (Frontline of Light)

| Action | Input |
|---|---|
| Deploy a hero | Click its card, or press **1–7** |
| Pause | **P** |
| Mute | **M** |
| Start / restart | **Enter** or **Space** |

---

## How it plays

Darkness advances on your **Photon Tower** from the right. You spend regenerating **light energy** to deploy heroes from the cards along the bottom. Every hero answers a different threat — there is no single best unit, only the right one for the moment. Push the front line forward (and watch dawn break across the battlefield as you do), grind down the **Dark Core**, survive the **Umbra** that wakes to guard it, and shatter the Core before your Tower falls.

### The team — deployable heroes

| Hero | Role |
|---|---|
| **Photon Trooper** | Cheap ranged backbone — holds the line and kills drones |
| **Manu the Titan** | Slow wall of HP — anchors the front, shrugs off darkness |
| **Victor the Maker** | Marches up and plants a stationary **Light Prism turret** — locks down a zone |
| **Floris** | Long-range **artillery** with splash — shreds swarms |
| **Andreea** | A **slow-field** aura — strangles fast rushes |
| **Radu Photon** | Fast, piercing **hero strike** — breaks through a stalled front |
| **Pissy** | **Blinks into the enemy backline** — kills the Slingers and Null Drones you can't otherwise reach |

### The darkness — The Shadow Network

Shade Crawlers swarm, Slingers snipe from range, Brutes soak damage, **Null Drones** halve your energy regeneration while alive (so kill them fast), and **Umbra** — living darkness — wakes to guard the Core once you've hurt it.

---

## Put it online with GitHub Pages (about a minute, one time)

1. Create a new repository on GitHub and upload these files, keeping the structure (`index.html` stays at the root).
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Set the branch to **main** and the folder to **/ (root)**, then **Save**.
5. Wait about a minute, then open `https://<your-username>.github.io/<repo-name>/`. The game loads immediately.

There's no build step and nothing to configure — it's plain HTML and JavaScript.

---

## Project structure

```
.
├── index.html                      # Main game: Frontline of Light (the lane-battler)
├── games/
│   ├── classic-2d.html             # Light-puzzle chamber prototype
│   └── 3d/                         # 3D arena prototype (needs internet on first load)
├── docs/
│   ├── echipa-lumina-GDD.md        # Game Design Document for the lane-battler
│   └── claude-code-game-brief.md   # Build spec for a larger production version
├── README.md
└── LICENSE
```

---

## Tech

No frameworks, no dependencies, no build step. The main game and the classic prototype are single self-contained HTML files (Canvas 2D + Web Audio). The 3D prototype loads Three.js from a CDN, which is why it needs internet the first time.

---

## Credits and license

Radu Photon, Echipa Lumina, and the story and characters were created by the family this game was made for. Those characters and the comic belong to them.

The **code** in this repository is offered under the MIT License (see `LICENSE`), so anyone is free to read it, learn from it, and reuse it. Open `LICENSE` and replace `<YOUR NAME>` with yours. If you'd rather keep everything fully private, just delete the `LICENSE` file before publishing.

*Made with love, for Radu.*
