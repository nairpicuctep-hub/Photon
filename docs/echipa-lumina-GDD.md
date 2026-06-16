# RADU PHOTON: ECHIPA LUMINA — *Frontline of Light*
### Game Design Document · v1 · (companion to the playable vertical slice)

---

## 1. Vision

**A side-view tactical lane-battler where the darkness is always advancing, and the only way to push it back is to deploy the right friend at the right moment.**

Radu, a boy who was turned into living light by an accident at CERN, leads **Echipa Lumina** — a team whose powers are useless alone and unstoppable together. The whole game is a single, legible argument: *friendship is stronger than power.* You don't win by out-muscling the dark. You win by having the right teammate for the moment, and by fighting together.

Genre touchstone: **Warfare 1944** (ConArtist / Armor Games) — the deploy-down-a-lane, earn-resources, counter-the-enemy tug-of-war — reframed entirely around light versus darkness.

Audience: built first for one specific kid (the comic's author), then for the broad 8–14 strategy-curious player and the adults who grew up on Flash war games.

---

## 2. Design pillars

1. **Deploy the right friend.** Every hero answers a specific threat. There is no single "best unit" — only the right unit for what's in front of you. The strategy is *reading the lane and choosing*.
2. **The battlefield shows how you feel.** The sky and lighting are a living feelings-meter: push the front forward and dawn breaks; lose ground and the void creeps in. You can read the whole match at a glance, and the theme is never just decoration.
3. **Friendship is mechanically stronger than power.** More of the team = more answers. Teammates fighting side by side get stronger. The finale literally cannot be won without the whole roster acting in concert.

---

## 3. Core loop

- **Second to second:** read the incoming wave → choose a hero whose role counters it → spend light energy to deploy → watch the front line shift.
- **Per match:** survive escalating dark waves, push the front into enemy territory, grind down the **Dark Core**, survive the **Umbra** that awakens to guard it, and shatter the Core before your **Photon Tower** falls.
- **Meta (campaign):** win missions → earn Light Shards → unlock teammates (story-gated) and upgrade their kits → face bigger threats that demand the new tools.

---

## 4. The light-energy economy

Light energy is the single resource and the central tension.

- It **regenerates over time** (your team is recharging), caps at a ceiling, and every dark unit you destroy **harvests a little extra** (light reclaimed from the dark).
- The **Null Drone** is an *economy attacker* — while one is alive, your regen is **halved**. This forces a hard choice: spend on cheap troopers to kill the drone now, or eat the tax and save energy for a bigger play.
- Cheap, spammable units keep the line; expensive heroes are decisive but rare. Managing this curve *is* the skill.

---

## 5. The roster — a counter-web (deployables)

Each hero is a role, not a stat-line. Powers are pulled straight from the comic.

| Hero | Power → role | Counters | Story unlock |
|---|---|---|---|
| **Photon Trooper** (Lumina cadets) | Ranged light-bolt → cheap backbone | Holds the line; kills drones | Act I |
| **Radu Photon** | Speed of Light + Energy Blasts → fast piercing **hero strike** | Breaks through stalled fronts; deletes clustered ranks | Act I |
| **Manu Titanul** | Titan body → slow **HP wall**, immune to darkness debuffs | Anchors the front; absorbs Brutes & boss melee | Act II |
| **Floris Cunoașterea** | Knowledge → long-range **artillery** with splash | Shreds swarms before they reach you | Act II |
| **Andreea Înțelepciunea** | Foresight → **slow-field** aura (later: highlight/strategy buffs) | Strangles fast rushes; buys time | Act II |
| **Victor Creatorul** | Inventor → marches up and **plants a stationary Light Prism turret** | Zone control; holds a forward position | Act III (playable now) |
| **Pissy** | Wildcard → **blinks straight into the enemy backline** | Kills Slingers & Null Drones you can't otherwise reach | Act III (playable now) |

**Capstone — Radu's "Infinite Potential":** a once-per-mission team-wide surge, only available when several teammates are alive together — the mechanical expression of the theme.

---

## 6. The enemy — The Shadow Network

| Enemy | Role |
|---|---|
| **Shade Crawler** | Cheap melee swarm — overwhelms by numbers |
| **Shade Slinger** | Ranged poke from the back |
| **Dark Brute** | Tank — slow, huge HP, heavy hits |
| **Null Drone** | *Economy attacker* — halves your energy regen while alive (Doctor Null's tech) |
| **UMBRA** (boss) | Living darkness; wide AoE; awakens to guard the Core. The thematic heart of the enemy. |

**Future bosses:** **Doctor Null** (steals a power mid-mission — disables one of your cards until you rally the team) and **The Void** (the cosmic finale).

---

## 7. Progression & campaign — friendship as a system

Four acts, each a mechanical statement of the theme.

- **Act I — The Accident.** CERN origin; tutorial. You have only Radu and troopers. The dark is barely held. The lesson: alone is not enough.
- **Act II — Echipa Lumina.** Each mission *introduces and unlocks a teammate*. Gaining a friend is gaining a new deploy card — literally more answers. Difficulty rises exactly as your options do.
- **Act III — The Shadow Network.** Doctor Null **steals a power** — one of your cards goes dark — until a rescue mission brings that friend back. You feel the absence of a teammate as a hole in your toolkit.
- **Act IV — The Void.** A finale **gated on using the whole roster in concert**: a wall only Manu breaks, a beam only Victor redirects, a backline only Pissy reaches, a push only Radu finishes — all in one battle. Power loses; the team wins.

**Between missions:** spend **Light Shards** to upgrade stats and unlock abilities. **Synergy bonus:** teammates within range of each other gain a small damage/defense buff — fighting together is always better than fighting apart.

---

## 8. The signature — living light

The one bold thing, executed well: the **dawn-vs-darkness battlefield**. A blended sky + horizontal lighting gradient tracks the front line in real time. Winning literally brightens the world from your side outward; losing lets the void pour back in. It is the score readout, the mood, and the theme — all in one image. Everything else around it stays disciplined so this lands.

---

## 9. Art direction

**Palette**
- Void `#06070f` · Shadow `#1a0f2e` · Umbra Purple `#3a1d6e` / `#7a1fd6`
- Photon Gold `#ffd24a` · Aurora Cyan `#5fe6ff` · Dawn Amber `#ff9d54`
- Hero identities: Radu gold `#ffd24a` · Manu bronze `#ff8a3d` · Floris emerald `#4fe0a0` · Andreea periwinkle `#8fb0ff` / violet `#b47bff` · Trooper cyan `#5fe6ff`

**Characters — not dots and blocks.** Stylised, rim-lit heroic figures with: a color-graded body, a signature aura, distinct silhouettes (slim trooper, broad Titan, robed scholar, staff-bearing strategist, radiant Radu), procedural walk/idle/attack animation, hit-flash, and a death that dissolves *upward* into photons (light) or *downward* into smoke (dark). Color identity is readable at a glance even when small.

**Enemies** are desaturated smoke-and-shadow with magenta eyes — deliberately less detailed than the heroes, so light always reads as life.

**VFX:** additive glows, photon motes drifting on the lit side, beam impacts, artillery bursts, a pulsing front-line shaft of light. Restraint elsewhere.

---

## 10. Audio

Slice ships with a **synthesised WebAudio palette** (deploy chimes, light-bolts, shadow-fire, booms, victory/defeat stings) — zero asset files, works offline.

Direction: a **low ambient drone that brightens into warm pads as you win**, darkening as you lose — the audio twin of the living-light signature. Per-hero deploy motifs. A theme that resolves to major only on victory.

---

## 11. UX & accessibility

- **Deploy cards** with mini hero portraits, cost, hotkey (1–5), a cooldown sweep, and affordability dimming. Click or keypress.
- **Two readable bars** (Photon Tower vs Dark Core) = the tug-of-war at a glance.
- **Colorblind-safe:** roles are distinguished by silhouette and motion, not color alone.
- **Reduced-motion** honored (fewer particles, calmer effects).
- **Mobile:** tap-to-deploy; the same UI scales to touch.

---

## 12. Technical approach (and why)

**Single-file HTML5 Canvas, zero dependencies.** No build step, no CDN, no install, no network. It runs by **double-click**, **offline**, **even on a locked-down corporate machine behind a strict proxy** — which is the real-world constraint this project lives under. That constraint *chose the genre*: a 2D lane-battler is exactly the kind of game that thrives in one self-contained file.

**Path to scale** (for a future unlocked machine): migrate to a sprite-atlas pipeline, add a data-driven content/level system, externalize balance into JSON, and layer in real audio. The architecture (entity list + per-type draw/AI, data-defined stats) is already shaped for that.

---

## 13. Vertical slice — what's playable today

`radu-photon-frontline.html` implements the full core loop:

- **7 deployable heroes** — Trooper (line), Manu (wall), **Victor (forward Prism turret)**, Floris (artillery), Andreea (slow-field), Radu (hero strike), **Pissy (blink assassin)** — each a distinct situational answer.
- **5 enemy types** (Crawler, Slinger, Brute, Null Drone) + the **Umbra** boss that awakens to guard the Core.
- **Light-energy economy** with kill-harvest and the drone tax.
- **Tug-of-war** to destroy the Dark Core / defend the Photon Tower.
- **Living dawn-vs-darkness lighting**, hand-drawn animated characters, particles, screen-shake, hitstop, and synth audio.
- Menu / win / lose / pause.

**Balance is deliberately first-pass and tunable.** Notably, Umbra's AoE can wipe a line of troopers — bring Manu and Radu to the boss. Every stat lives in two readable objects (`LIGHT{}` / `DARK{}`) for fast iteration.

---

## 14. Roadmap

- **M1 — Vertical slice** ✅ *(this build)* — prove the loop and the look.
- **M2 — Campaign + meta** — Acts I–II, Light Shards, upgrades, hero unlocks, synergy buff.
- **M3 — Bosses + synergy** — Doctor Null's power-theft mission; teammate synergy buffs. *(Victor & Pissy now playable — done early.)*
- **M4 — Finale + polish** — The Void team-gated finale, real music, juice pass, mobile tuning.

---

## 15. The honest "$1M" framing

A literal million-dollar game is team-months of art, audio, code, and QA. What this package is: the **two things a studio greenlights from** — a *playable vertical slice that proves the core loop is fun and the look is distinctive*, and a *design document that maps the whole game*. The theme is genuinely strong, the mechanic is proven (Warfare 1944 ran for years on it), and the constraint that shaped it is a feature, not a bug. This is the foundation; the rest is execution.

*— for Radu, and for Echipa Lumina.*
