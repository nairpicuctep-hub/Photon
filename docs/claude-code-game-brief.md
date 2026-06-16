# Radu Photon — Build Brief for Claude Code

> **Working title:** *Radu Photon* (full title option: *Radu Photon & Echipa Lumina*). It's your son's comic — finalize the name as you like.
> **Hero:** Radu (hero name "Radu Photon" / "Radu Foton").
> **Note on the cast:** the visual identities in §9 (colors, symbols, power sources) are *suggested starting points* — override them with whatever's already canon in your comic.

---

## 0. How to use this document (read first, Claude Code)

You are building a browser-based 3D game. **Work in phases (§10). Get each phase fully running in the browser before starting the next. Commit after every working phase.** Do not scaffold all features at once.

Rules of engagement:
- Prefer a small, *playable* increment over a large, broken one.
- Keep the game playable at the end of every phase.
- When a design decision has real trade-offs, **stop and ask** rather than guessing.
- Never commit secrets. Supabase keys live in `.env.local` (gitignored).
- Target **60 fps**. If a feature tanks performance, simplify it and flag it.
- The full story (§7) is ambitious. **Ship Act 1 (solo Radu at CERN) first.** Everything else layers on incrementally — never build it as one monolith.

---

## 1. Concept & vision

**Premise.** Radu is an ordinary boy with extraordinary curiosity. Visiting CERN with his father, he witnesses an accident inside a particle accelerator — a vast burst of energy engulfs him. Instead of being harmed, every atom in his body is transformed into photons and pure energy. He becomes **Radu Photon**, the first human able to control light itself. He struggles to master his powers, discovers he isn't alone, and unites with other gifted kids to form **Echipa Lumina** ("the Light Team") — whose mission is to *bring light where there is darkness*.

**Central theme.** *Friendship is stronger than power.* Radu is a hero not because he's powerful, but because he helps others, protects his friends, stays curious, and never gives up. The game must make this true **mechanically**, not just in cutscenes — the finale (§7) can only be won by the whole team, not by Radu alone.

**What the game feels like.** A physics-grounded action-platformer about *being light*: dashing as a beam, blasting photon energy, lighting up the dark, bending through mirrors and prisms — and, late-game, pushing past the light barrier itself. Then it grows into a *team* game where each friend's power solves what light alone can't.

**Tone.** "Stylized realism" — not photoreal AAA (out of scope for a from-scratch build), but clean, glowing, physically believable visuals. A CERN that looks like CERN, lit beautifully, where light behaves like light, and where **darkness is the enemy you can see spreading.**

**Audience.** Built for a child first. **Core controls stay simple.** Physics and team depth layer on top, never a wall. Failure is gentle (you rewind — see §5), no death screens.

**Signature hook.** Speedrunning. A game about the speed of light *should* be about going fast and beating your time — that's what the Supabase leaderboard (§8) is for.

---

## 2. Radu's powers → game mechanics

From the comic, mapped to play. Each power is grounded in real physics, then bent for fun; keep the real concept as optional "Codex" entries (§7, Floris) so it teaches without lecturing.

1. **Speed of Light → Light-Dash.** Radu becomes a beam and travels fast in a straight line. *Game:* aim, dash, cross gaps, trigger switches. Beams obey optics (below). Brief cooldown.
2. **Photon Form → Phase & Stealth.** Convert partially/fully to light: pass through small openings and laser grids, travel along light guides, and become hard to see (stealth past enemies/detectors).
3. **Energy Blasts → Photon Beam (combat).** Fire concentrated photon beams that stun, push back, or destroy obstacles and enemies. The primary offensive tool.
4. **Photon Aura → Illuminate & Repel.** A glowing field that lights entire areas, reveals hidden paths/enemies, and **pushes back darkness** (the direct counter to Umbra, §7). Light vs dark is a core verb.
5. **Rapid Reactions → Time Dilation.** Processes information faster than anyone; expressed as bullet-time — the world slows so Radu can dodge and solve timing puzzles before others react.
6. **Light Constructs (later ability).** Shields, weapons, and temporary structures made of photon energy. Unlocks mid/late game (Act 3).
7. **Infinite Potential → Beyond-Light Rewind (capstone).** Because photons have no rest mass, Radu's power has no known upper limit. As he masters it he pushes *past* the speed of light — which the game expresses as a short **rewind / undo** ("outrun a mistake"). This is also the kid-friendly failure system, and the emotional payoff of his arc.

**Optics — the puzzle vocabulary.** Beams (dash and blasts) interact with:
- **Mirror** — reflects (angle in = angle out).
- **Prism / water** — refracts (bends) the beam.
- **Absorber (dark surface)** — stops/drains light: hazard (and Umbra's signature).
- **Diffraction grating** — splits the beam into several paths.
- **Lens / focuser** — converges beams to power a switch.

---

## 3. Tech stack

**Primary (recommended for the "light" goal):**
- **React + TypeScript + Vite** — app shell, fast dev loop.
- **React Three Fiber + Three.js** — 3D rendering, declarative, huge ecosystem.
- **@react-three/drei** — helpers (cameras, loaders, controls).
- **@react-three/rapier** — physics (collisions, raycasts for light beams).
- **@react-three/postprocessing** + custom GLSL — the relativistic/light look (Doppler, aberration, bloom, the darkness effect).
- **Zustand** — game state (lightweight, ideal for games).
- **Howler.js** — audio/SFX.
- **Tailwind CSS** — HUD and menus (DOM overlay on top of the canvas).
- **Supabase** — save + leaderboards (optional for MVP; see §8).
- **Hosting:** Vercel or Netlify (static SPA).

**Fallback (if 3D proves too heavy):** **Phaser 3 + TypeScript + Vite** for a polished 2.5D version — same pillars, simpler rendering, faster path to "reliably fun." Do **not** switch without asking the user first, but raise it if Phase 1–2 struggle.

---

## 4. Project setup

```bash
npm create vite@latest radu-photon -- --template react-ts
cd radu-photon
npm install three @react-three/fiber @react-three/drei @react-three/rapier @react-three/postprocessing
npm install zustand howler
npm install -D @types/three @types/howler
npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
# Supabase — only when we reach Phase 4
# npm install @supabase/supabase-js
```

**Repo structure to create:**

```
src/
  main.tsx
  App.tsx
  game/
    GameCanvas.tsx        # the R3F <Canvas> + scene root
    Player.tsx            # Radu: entity + movement state machine
    states/               # Normal / LightDash / Photon / Rewind
    abilities/            # dash, blast, aura, spectrum, constructs, rewind
    team/                 # companion summon system + each ally's ability
    optics/               # mirrors, prisms, lasers, absorbers, gratings
    physics/              # rapier helpers, beam raycasting
  rendering/
    effects/              # postprocessing: Doppler, aberration, bloom, darkness
    shaders/              # GLSL
  levels/
    Level1_CERN.tsx
    level1.config.ts      # geometry, triggers, checkpoints, par time
  ui/
    HUD.tsx               # speed, aura/energy, active ally, checkpoint, timer
    MainMenu.tsx
    PauseMenu.tsx
    Settings.tsx          # difficulty, colorblind mode, reduce-motion, volume
    Codex.tsx             # Floris's science/lore cards
  state/
    useGameStore.ts       # zustand store
  audio/
    sfx.ts
  lib/
    supabase.ts           # client (optional, Phase 4)
    save.ts               # save/load: localStorage first, Supabase later
  styles/
docs/
  GAME_DESIGN.md          # paste a copy of this brief here
CLAUDE.md                 # conventions (below)
.env.local                # gitignored
.gitignore                # ensure .env.local, node_modules, dist
```

**Create a `CLAUDE.md`** with these conventions:
- TypeScript strict mode; no `any` without a justifying comment.
- One responsibility per file; keep components small.
- All gameplay tunables (speeds, cooldowns, par times) live in config files, not as magic numbers.
- Zustand for cross-cutting state; keep per-frame data local.
- Every new mechanic gets a tiny "test room" before entering a real level.
- `npm run build` must compile clean before any phase is "done."

---

## 5. Core systems (detailed)

**Player controller — a state machine.** States: **Normal** (walk/jump, gravity via Rapier character controller), **LightDash** (aim + release → straight beam, obeys optics, cooldown), **Photon** (hold → phase through transparent material / laser grids / light guides, reduced visibility), **Rewind** (hold → scrub the last N seconds of Radu's transform back to safety; replaces death).

Keep inputs minimal: **Move, Jump, Dash (aim+release), Blast, Aura (hold), Transform (hold), Rewind (hold), Cycle Ally.** Add **gamepad support** (Gamepad API) for couch play.

**Combat & light.** Energy Blast = a fast raycast/projectile that obeys optics and damages/pushes enemies. Photon Aura = a radius around Radu that lights dark zones, reveals hidden things, and steadily pushes back Umbra's darkness (drains an energy gauge while active).

**The team / companion system (the heart of the game).**
Radu is the only directly-controlled hero. Allies are **summoned for their ability** in sections designed around them, and join the story one at a time as the team forms (Act 2). Each maps to a complementary mechanic (full roster and gameplay roles in §7):
- **Manu (Titan):** smash heavy barriers, hold/move massive objects, raise a shield wall that blocks projectiles and protects Radu while he charges.
- **Victor (Creator):** deploy gadgets — most importantly a **portable mirror/prism to redirect Radu's beams** (direct synergy with optics), plus bridges, grapple anchors, turrets, portable lights.
- **Andreea (Wisdom):** **Foresight** — briefly slow time and overlay the safe path, mark hazards and enemy weak points.
- **Floris (Knowledge):** **Decode/Reveal** — solve symbol puzzles, translate clues, reveal hidden routes; keeper of the **Codex** (the science/lore cards).
- **Pissy (Wildcard):** find hidden secrets/collectibles, occasional lucky save, comic relief and the team's emotional balance.

> **One decision to confirm:** I've specced the team as **summonable companions** (simplest, keeps Radu's light movement central, matches the "team forms over time" arc). The richer alternative is **full character-switching** (Trine-style) in dedicated team levels — more engaging but more work. Recommend companions for the MVP and Acts 1–3, with switching as a stretch goal for Act 3+ team levels. Confirm before building the team layer.

**Relativistic visuals (postprocessing), scaling with speed:** Doppler shift (blueshift ahead, redshift behind), aberration / FOV warp forward, bloom on all emissive sources, motion streaks on dash. Gate intensity on a "relativistic factor" derived from speed. Provide a **reduce-motion** toggle.

**Darkness (Umbra) effect:** spreading dark zones that desaturate/dim the screen and drain Radu's energy; Photon Aura and light beams push them back. This is both a hazard system and the villain's visual signature.

**Camera:** smooth follow with look-ahead in the dash direction, slight pull-back at high speed; clamp shake and smooth FOV changes to avoid nausea.

**Save / checkpoints:** auto-checkpoint at level beats. `save.ts` writes to `localStorage` first (zero backend needed); the same interface later writes to Supabase (§8). Persist: current level/act, checkpoint, unlocked abilities, recruited allies, best times.

**Difficulty & accessibility (MVP-scope, not later):** difficulty presets (hazard speed, rewind generosity); **colorblind mode** (every color also carries a distinct icon/shape — critical, since light/color is a mechanic); reduce-motion; remappable keys; full gamepad support; gentle failure via rewind.

---

## 6. Level 1 — "CERN: The Door" (Act 1 / the MVP)

The single level that proves the game works. Build it after the core mechanics exist as test rooms.

**Beats:**
1. **Arrival.** Radu walks the LHC service tunnel with his father (long, curved, industrial). Tutorial: move, jump. Optional Codex card: *what the LHC does.*
2. **The accelerator hall.** A huge detector cavern (ATLAS/CMS-style). A scripted moment sets up the forbidden door / accident.
3. **The accident.** Radu opens the door; a burst of energy fills the screen. **Transformation** — his body dissolves into photons. (The emotional hook — make the light effect spectacular.)
4. **First dash (tutorial).** Now able to Light-Dash. A simple gap teaches aim-and-release; a mirror teaches reflection.
5. **The escape.** A short *timed* run out of the cavern using dash + one reflect + one absorber hazard. Results screen shows the time and a **par time** (sets up speedrunning).

**Definition of done for Level 1:** playable start-to-finish in the browser, smooth, with HUD (timer, speed, energy), a checkpoint, the transformation moment, dash + reflect + absorber, a results/time screen, and working main + pause menus.

---

## 7. Characters & story

### Hero
**Radu Photon (Radu).** Playable protagonist. Powers per §2. Personality: curious, kind, protective, never abandons anyone — "his greatest strength is his heart." His arc: gain powers → struggle to control them → realize he isn't alone → lead Echipa Lumina → learn that *together* beats *alone*.

### Echipa Lumina (the Light Team) — allies & gameplay roles
| Character | Role | In-game ability | Joins |
|---|---|---|---|
| **Andreea Înțelepciunea** (The Wisdom) | Strategist / brain | **Foresight:** slow time, reveal safe path, mark hazards & weak points | Act 2 |
| **Manu Titanul** (The Titan) | Protector / powerhouse | **Bulwark:** smash barriers, move heavy objects, shield wall | Act 2 |
| **Victor Creatorul** (The Creator) | Inventor / engineer | **Gadgets:** portable mirror/prism (redirect beams), bridges, grapples, turrets | Act 2 |
| **Floris Cunoașterea** (The Knowledge) | Scholar / researcher | **Decode/Reveal:** solve clue puzzles, reveal secrets; keeper of the Codex | Act 2 |
| **Pissy** | Wildcard / heart | **Wildcard:** find secrets, lucky saves, comic relief (powers loosely defined — keep mysterious) | Act 2 |

*Design each ally's levels around their ability so every friend feels essential — that's how the theme lands.*

### Villains — and how they play
- **Umbra** — a being of living darkness that seeks to absorb all light. The thematic antagonist and recurring boss. *Mechanic:* spreading darkness zones that drain Radu; fought by lighting the area (Aura), redirecting beams (Victor's mirrors) into its core, with Manu shielding you from dark tendrils. Light vs dark, made literal.
- **Doctor Null** — a scientist who wants to steal Radu's photon powers. The human plot driver. *Mechanic:* deploys **null fields** that suppress Radu's powers → forced no-power platforming/stealth sections (disable the emitter to restore them); builds power-draining machines; commands the Shadow Network.
- **The Shadow Network** — a secret organization that fears knowledge and progress. *Mechanic:* the standard enemy faction and surveillance/stealth encounters (callback to CERN detectors). Serves Doctor Null.
- **The Void** — a cosmic entity that consumes stars. *Mechanic:* the endgame escalation / final threat; the cosmic act where only the whole team can stand against it.

### Headquarters
Recommend a single cohesive base: the **Photon Tower** (powered by Radu's energy), with **Victor's lab** as a workshop wing and a hidden entrance **beneath the school**. Established in Act 3. (Swap freely if your comic specifies otherwise.)

### Act structure (maps to the long-term arc)
- **Act 1 — Origin (CERN).** Radu gains his powers; struggles to control them. *Solo.* (Level 1, §6.)
- **Act 2 — Not Alone.** Radu finds the others; recruits Andreea, Manu, Victor, Floris, and Pissy one per level; first clashes with the Shadow Network and a taste of Umbra. Each level teaches one ally's ability.
- **Act 3 — Echipa Lumina.** The team is whole; establish the Photon Tower; Doctor Null's scheme to steal Radu's powers escalates; team puzzles/combat using combined abilities. Radu unlocks **Light Constructs**.
- **Act 4 — Into the Dark.** Umbra ascendant / The Void approaching. **Climax (theme made mechanical):** Radu's power alone fails — the finale can only be cleared with every member acting in concert (Andreea reads the pattern → Victor sets the mirrors → Manu shields → Floris finds the weak point → Pissy spots the hidden opening → Radu delivers the combined light). *Friendship is stronger than power.* Radu emerges as one of the planet's mightiest heroes — but the lesson is the team.

---

## 8. Supabase (save + leaderboards)

**Optional for the MVP** — the game runs fully offline with `localStorage`. Add Supabase in Phase 4 for cross-device saves and online leaderboards (the speedrun payoff). The same `save.ts` interface swaps backends transparently.

**Env vars (Vite), in `.env.local` (gitignored):**
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
The **anon key is safe client-side** when RLS is on. Never put the service-role key in the client or repo.

**Schema (run in the Supabase SQL editor):**
```sql
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  created_at timestamptz default now()
);

create table public.save_states (
  profile_id uuid references public.profiles(id) on delete cascade primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table public.level_times (
  id bigint generated always as identity primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  level_id text not null,
  time_ms integer not null check (time_ms > 0),
  created_at timestamptz default now()
);
create index level_times_board_idx on public.level_times (level_id, time_ms);
```

**Row-Level Security:**
```sql
alter table public.profiles    enable row level security;
alter table public.save_states enable row level security;
alter table public.level_times enable row level security;

create policy "profiles readable" on public.profiles
  for select using (true);
create policy "own profile write" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own save" on public.save_states
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "times readable" on public.level_times
  for select using (true);
create policy "own time insert" on public.level_times
  for insert with check (auth.uid() = profile_id);
```

**Auto-create profile + save on signup:**
```sql
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Player'));
  insert into public.save_states (profile_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

**Integration notes:** for a child, keep auth frictionless — magic-link email or anonymous sessions promoted later. **Stretch goal:** "ghost races" — store a recorded path per level and race your own (or the world-record) ghost. The dream feature for a light-speed game; only after the core is solid.

---

## 9. Art & audio direction

**Look great fast without art assets:** start with **primitive geometry + strong lighting, emissive materials, and bloom.** A glowing world built from boxes and tubes already looks striking against a dark CERN. Add models later, only where they earn it.

- **Palette:** dark, cool industrial CERN so *light pops* — and so Umbra's darkness reads as a visible threat.
- **Radu:** in light form, a bright emissive/particle silhouette rather than a detailed human — easier and on-theme.
- **Environments:** the tunnel (long, ribbed, receding), the accelerator cavern (radial, cathedral-scale), the Photon Tower, Victor's lab, and creeping-darkness zones for Umbra.

**Cast visual identities — suggested starting points (override with your comic's canon):**
| Character | Color | Symbol | Power source / costume hook |
|---|---|---|---|
| Radu Photon | brilliant white-gold | radiant photon burst | his own photonic body — glowing suit that brightens with energy |
| Andreea (Wisdom) | deep blue / violet | concentric rings / an eye | sharp tactician's visor or HUD-glasses |
| Manu (Titan) | bronze / orange | a fist / mountain | heavy, armored, grounded |
| Victor (Creator) | tech teal-green | gear / circuit | tool-rig, utility harness, gadget pack |
| Floris (Knowledge) | warm amber | open book | scholar's coat, data-slate / tome |
| Pissy | bright magenta-pink | spark / star | playful, mismatched, expressive |

*(You asked for Avengers/Teen-Titans depth — happy to expand each into a full origin + symbol + power-source bible as a separate doc if you want; just say the word.)*

- **Audio (Howler):** low industrial hum for CERN; a bright "charge + release" for dash and blasts; a chime for Codex collection; a soft whoosh for rewind; a low dread tone for Umbra's darkness. Music: ambient/electronic, calm-to-tense per beat, hopeful in team moments.
- **Codex cards (Floris's domain):** short, friendly science/lore facts on collection — "A photon is a particle of light. Light always travels at the same top speed: c." Skippable; this is the educational layer.

---

## 10. Milestones / phased build plan

Build in order. **Each phase ends with a working build and a commit.**

- **Phase 0 — Scaffold.** Vite + React + TS, R3F `<Canvas>` with a lit test scene, Tailwind wired. App runs.
- **Phase 1 — Movement.** Rapier ground + test room. Radu's Normal controller (move, jump), follow camera, gamepad support. *Done = run and jump around a room.*
- **Phase 2 — Light mechanics + the look.** Light-Dash (aim + release, beam raycast), Energy Blast, one mirror (reflect) and one absorber (hazard). Doppler/aberration/bloom postprocessing tied to speed, with reduce-motion. *Done = a one-screen dash/blast puzzle that feels and looks relativistic.*
- **Phase 3 — Act 1 vertical slice (the MVP).** Build "CERN: The Door" (§6) end to end + HUD, checkpoints, main/pause menus, local save, Photon Aura, the transformation set-piece, results/par-time screen. *Done = the MVP in §6.*
- **Phase 4 — Backend + accessibility.** Add Supabase (auth, save sync, level-time leaderboard) behind `save.ts`. Settings: difficulty, colorblind mode, reduce-motion, volume, key remap. Deploy to Vercel/Netlify. *Done = saves sync across devices and a leaderboard shows times.*
- **Phase 5 — The team forms (Act 2).** Build the companion system (§5) — **confirm companions vs switching first.** Introduce allies one per level with their abilities; add the Codex (Floris) and first Shadow Network / Umbra encounters. *Done = at least two allies playable in their own levels.*
- **Phase 6 — Echipa Lumina + villains (Act 3).** Photon Tower HQ, Light Constructs, Doctor Null's null-field sections, combined-ability team puzzles. *Done = a full team-based level.*
- **Phase 7 — Into the Dark + polish (Act 4).** Umbra/Void climax including the **friendship-finale** that requires every member; audio pass; "juice" (particles, feedback); content/QA pass. *Done = the comic's arc is playable end to end.*

---

## 11. Definition of done (MVP) & quality bar

The MVP is done when, in a browser: Act 1 ("CERN: The Door") plays start to finish smoothly at ~60 fps; the transformation lands and looks great; dash + blast + reflect + absorber + aura all work; the run is timed with a par time; main menu, pause, checkpoints, and local save work; `npm run build` compiles clean; colorblind and reduce-motion toggles function.

---

## 12. Guardrails for Claude Code (summary)

- **Phase by phase.** Keep it playable at every step. Commit each phase. Ship Act 1 before anything else.
- **Ask, don't guess** on real trade-offs — especially **companions vs character-switching (§5)** and any switch to the Phaser fallback.
- **Performance first:** target 60 fps; simplify and flag anything that doesn't hit it.
- **No magic numbers:** tunables in config files.
- **No secrets in the repo;** `.env.local` only; RLS on for all Supabase tables.
- **Accessibility is MVP-scope.**
- **Make the theme mechanical:** every ally must feel essential, and the finale must require the whole team — *friendship is stronger than power.*
- **Small, testable commits;** every mechanic gets a test room before it enters a level.
