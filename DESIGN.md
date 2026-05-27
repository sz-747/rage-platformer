# Rage Slice — Design Spec

A kaizo-style rage platformer built around fair-but-brutal surprise deaths.
This document is the design source of truth. The build instructions for Codex
live in `CODEX_BUILD_SPEC.md`.

## Pillars

1. **Every death is fair.** Surprises are memorizable, not random. Anything that
   kills you must be survivable with the player's exact moveset.
2. **Retry is instant.** Sub-second death-to-retry is what turns rage into
   "one more try."
3. **Readability over art.** In a fairness-critical game, the player must always
   parse what is dangerous. Visual clarity beats visual flourish.

## Tech & pipeline

- **Engine:** Phaser 3 + TypeScript
- **Build/dev:** Vite (instant HMR, browser playtest)
- **Levels:** authored in [Tiled](https://www.mapeditor.org/), exported as JSON,
  loaded at runtime. See the schema in `CODEX_BUILD_SPEC.md`.
- **Art:** Kenney CC0 pixel-art tileset (player, tiles, hazards)
- **Audio:** none in the vertical slice

## Controls

- Move: `←/→` or `A/D`
- Jump: `Space` or `Z` (variable height — hold for higher)
- Restart: `R`
- Gamepad: stretch goal, not in slice

## Movement (fairness foundation)

- Run + **variable-height jump** (hold to go higher, release to cut)
- **Coyote time** — jump remains valid for a few frames after leaving a ledge
- **Jump buffering** — a jump pressed just before landing still fires
- Sharp, responsive air control

These three forgiveness mechanics are non-negotiable: they guarantee a death is
the trap's fault, never the input system's.

## Trap vocabulary

Each trap is a reusable component, placed and configured from Tiled.

1. **Hidden / invisible spikes** — invisible until the player approaches a
   safe-looking spot, then revealed.
2. **Fake blocks / disappearing floors** — platforms that vanish on landing, or
   solid-looking blocks the player falls through.
3. **Triggered projectiles / arrow traps** — crossing a trigger tile fires
   projectiles on a timing pattern.
4. **Chase / auto-scroll segment** — a rising wall / forced-scroll camera that
   punishes hesitation.

## Fairness contract (death & respawn)

- **Instant respawn** (sub-second) at **frequent checkpoints** (~every screen).
- **Death counter** — persistent on-screen tally (badge of shame).
- **Screen shake + particle splat** on death.
- No lives / no game-over.

## Scope: vertical slice

One polished level, ~3–4 screens, exercising **all four** trap types,
checkpoints, instant respawn, death counter, juice, and a win flag. Proves the
whole loop end-to-end before any mass level production.

## Tuning

All feel/difficulty constants live in one tunable config plus an in-game dev
overlay (toggle to tweak live): gravity, jump height/hold, coyote frames, jump
buffer frames, respawn delay, shake intensity/duration, per-trap timings.

## UI / UX suite — "Honest Brutalist Arcade"

Guiding rule: the UI must never compete with the playfield or obscure a hazard.
High-contrast, pixel-snapped, corner-docked, gets out of the way. Personality
lives in the death feedback, not persistent chrome.

### Icons — custom pixel art ONLY

All icons (death skull, timer, checkpoint flag, etc.) are **custom pixel-art
sprites** drawn to match the Kenney tileset and rendered as Phaser sprites/atlas
frames. **Never use OS/font emoji** (e.g. Windows Segoe 💀/⏱) or unicode glyphs
for structural icons — they render differently per platform, can't be themed,
and clash with the pixel look. Ship the icon atlas + license in the repo.

Icon inventory (slice): `icon_skull` (death counter), `icon_clock` (timer),
`icon_flag` (checkpoint/win). One visual language: same outline width, same
palette, pixel-aligned.

### Color tokens (semantic, defined in `config.ts`)

| Token | Value | Use |
|-------|-------|-----|
| `ui.bg` | `#0D0D12` @ ~70% | Overlay scrims (menu, win) |
| `ui.text` | `#F5F5F0` | Primary text |
| `ui.textDim` | `#9A9AB0` | Secondary text / hints |
| `ui.accent` | `#FFD23F` | Win, checkpoint flash, primary CTA |
| `ui.danger` | `#FF3B3B` | Death counter, death vignette |
| `ui.safe` | `#3FE0A0` | Checkpoint activated |

Functional colors always pair with an icon or motion — never color alone.

### Typography

- **Display** (title, win, big numbers): "Press Start 2P" (OFL), used sparingly.
- **HUD / overlay body**: pixel monospace ("Silkscreen" or system `monospace`).
- **Death counter & timer use tabular figures** so digits don't jitter.
- Sizes: HUD 16–18px, title ~32px, menu 18px. Never below 12px.

### Surfaces

- **HUD:** death-counter sprite + tabular count (top-left, danger), timer
  (top-right, dim). 1px dark outline for legibility over any tile, ~8px safe
  margin, never over the lower-center play zone.
- **Title/menu:** centered logo over dimmed gameplay backdrop; ONE primary CTA
  ("PRESS SPACE TO START", gentle ~1.2s pulse); dim controls legend below.
- **Death feedback:** red vignette flash (≤120ms) + screen shake + particle
  splat + counter scale-punch, then instant respawn. All ≤300ms, ease-out.
- **Win banner:** accent-gold panel, scale+fade from center, shows Deaths / Time
  in tabular mono; ~50% black scrim; one CTA.
- **Dev overlay** (`` ` ``): right-docked translucent panel, grouped by config
  section, labeled sliders + live readouts + helper text for non-obvious consts.

### Motion & accessibility

- Micro-interactions 150–300ms, ease-out enter / faster exit.
- **Respect `prefers-reduced-motion`**: replace shake/particles with a simple
  flash (also avoids nausea from rapid rage-death shake).
- Maintain 4.5:1 contrast for all UI text; verify against the busy tileset.

### Anti-patterns to avoid

- Emoji/font glyphs as icons (use custom pixel sprites).
- Persistent chrome covering hazards or the lower play zone.
- Color-only state signals without icon/motion.
- Rapid shake with no reduced-motion path.
- Non-tabular numbers that shift the timer/counter width.

## Build process

Codex implements; Claude specs and reviews. Codex self-verifies through the
milestones; Claude batch-reviews the finished slice for bugs and unfair traps;
the human playtests and dials in feel via the overlay. Milestones are in
`CODEX_BUILD_SPEC.md`.
