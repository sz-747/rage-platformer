# Codex Build Spec — Rage Slice

This is the implementation contract for Codex. Design rationale lives in
`DESIGN.md`; this file says exactly what to build, in what order, and to what
interface. Do not invent scope beyond the vertical slice. When a decision is
ambiguous, prefer the simplest thing that satisfies the fairness pillars and
flag it as `UNSURE` rather than guessing on player feel.

## Target

A single playable vertical-slice level (~3–4 screens) of a kaizo rage
platformer, running in the browser via Vite, with all four trap types,
checkpoints, instant respawn, death counter, screen-shake/particle juice, and a
win flag — fully tunable via one config + an in-game dev overlay.

## Stack (use exactly this)

- **Phaser 3** (latest 3.x), **TypeScript**, **Vite**
- Arcade Physics (not Matter) — simpler, deterministic, right for tile platformers
- **Kenney CC0** pixel-art assets (e.g. "Pixel Platformer" / "Simplified
  Platformer Pack"). Commit the assets used; include the license file.
- Tiled JSON map format (`.tmj`/`.json`), embedded or external tileset

## Project layout

```
/                       Vite root
  index.html
  vite.config.ts
  package.json
  tsconfig.json
  /public/assets/       Kenney tileset(s) + license, custom icon atlas, fonts
  /assets/maps/         Tiled .tmj + tileset .tsx (source)
  /src
    main.ts             Phaser game config + boot
    config.ts           ALL tunable constants (single source of truth)
    /scenes
      BootScene.ts      preload assets + map
      GameScene.ts      gameplay
      UIScene.ts        death counter, win banner (runs parallel to GameScene)
    /entities
      Player.ts         movement state machine
    /traps
      Trap.ts           base interface
      HiddenSpike.ts
      FakeBlock.ts
      ArrowTrap.ts
      ChaseZone.ts
    /systems
      LevelLoader.ts    parse Tiled JSON -> tiles, spawn, checkpoints, traps, win
      RespawnSystem.ts  checkpoint tracking + instant respawn
      Juice.ts          screen shake + death particles
      DevOverlay.ts     live-edit config constants
```

## `config.ts` — single tunable source of truth

Every feel/difficulty number lives here. No magic numbers elsewhere. The dev
overlay mutates this object live.

```ts
export const config = {
  player: {
    runSpeed: 220,        // px/s
    accel: 1800,          // px/s^2 ground accel
    airAccel: 1400,
    friction: 1600,
    gravity: 1800,        // px/s^2
    jumpVelocity: 620,    // initial jump impulse
    jumpCutMultiplier: 0.45, // velocity * this when jump released early
    maxFallSpeed: 900,
    coyoteFrames: 6,      // frames after leaving ground a jump still works
    jumpBufferFrames: 6,  // frames before landing a jump press is remembered
  },
  respawn: {
    delayMs: 120,         // death -> respawn (keep sub-second)
  },
  juice: {
    shakeDurationMs: 180,
    shakeIntensity: 0.012,
    particleCount: 16,
  },
  traps: {
    hiddenSpike: { revealRadiusPx: 48 },
    fakeBlock:   { vanishDelayMs: 120, respawnMs: 1500 },
    arrowTrap:   { fireIntervalMs: 1400, projectileSpeed: 320 },
    chaseZone:   { scrollSpeed: 80 },   // px/s the kill-wall advances
  },
  debug: { overlay: false, showHiddenTraps: false, showHitboxes: false },
  ui: {
    color: {
      bg: 0x0d0d12, text: 0xf5f5f0, textDim: 0x9a9ab0,
      accent: 0xffd23f, danger: 0xff3b3b, safe: 0x3fe0a0,
    },
    scrimAlpha: 0.7,
    ctaPulseMs: 1200,
    deathFlashMs: 120,
    counterPunch: 1.15,   // scale spike when death count increments
  },
} as const;
```

(Values above are starting guesses — they exist to be tuned, not trusted.)

## Tiled schema contract (THE critical interface)

The level is the integration point between content and code. Author maps to
exactly this contract; `LevelLoader` parses exactly this.

**Map:** orthogonal, tile size 16 or 18 (match the Kenney set).

**Tile layers**
- `solid` — collision geometry. Every non-empty tile is solid ground/wall.
- `bg` — purely decorative, no collision.

**Object layers** (use Tiled object layers; read `type`/`name`/custom props):

- `spawn` — one point object. Player start.
- `checkpoints` — point objects. Each: optional `order:int`. Crossing activates
  it (becomes the respawn point). Activating a later checkpoint never reverts.
- `win` — one rectangle object. Overlap = level complete.
- `traps` — rectangle/point objects, each with a string property **`type`**:

  | `type`         | shape | extra properties (override config defaults) |
  |----------------|-------|----------------------------------------------|
  | `hidden_spike` | rect  | `revealRadiusPx?:int` — kills on contact; invisible until player within radius |
  | `fake_block`   | rect  | `vanishDelayMs?:int`, `respawnMs?:int` — solid until landed on, then vanishes, then restores |
  | `arrow_trap`   | point | `direction:"left"\|"right"\|"up"\|"down"` (required), `fireIntervalMs?:int`, `projectileSpeed?:int` — emits a killing projectile on interval; projectile dies on solid tile |
  | `chase_zone`   | rect  | `direction:"right"\|"up"` (required), `scrollSpeed?:int` — entering the rect spawns an advancing kill-wall along that axis until the zone is exited/win |

  Any object missing a required prop: `LevelLoader` logs a clear error naming the
  object id and skips it (fail loud, never silent).

`LevelLoader` exposes a typed result: `{ spawn, checkpoints[], win, traps[] }`.
Adding a new trap type later = new class implementing `Trap` + one switch case.

## UI / UX implementation contract

Full rationale in `DESIGN.md` ("UI / UX suite"). Hard requirements for Codex:

- **Icons are custom pixel-art sprites, never emoji/unicode glyphs.** Create a
  small icon atlas (`icon_skull`, `icon_clock`, `icon_flag`) drawn to match the
  Kenney tileset palette/outline, load it in `BootScene`, render via Phaser
  sprites/`Image`. Do NOT use `🟥`, `💀`, `⏱`, or any text glyph for icons.
  If you cannot source/produce a fitting pixel icon, draw a simple one
  programmatically (Graphics → generateTexture) rather than falling back to a
  font glyph, and mark `// UNSURE` for human art review.
- **Fonts:** bundle "Press Start 2P" (display) and a pixel mono ("Silkscreen" or
  system `monospace`) for HUD/overlay. Death counter and timer must use
  **tabular/monospaced figures** (fixed-width digits — no width jitter).
- **All UI colors come from `config.ui.color`** — no raw hex in UI components.
- **HUD** (`UIScene`): skull icon + count top-left (danger), clock icon + timer
  top-right (dim); 1px dark outline on text; ~8px safe margin; nothing in the
  lower-center play band.
- **Title/menu:** dimmed gameplay backdrop, centered logo, ONE primary CTA with
  ~`ctaPulseMs` pulse, dim controls legend (keys) below.
- **Death feedback:** red vignette flash (`deathFlashMs`) + shake + particles +
  counter scale-punch (`counterPunch`), all ≤300ms ease-out, then respawn.
- **Win banner:** accent panel, scale+fade from center, "Deaths / Time" in
  tabular mono, scrim `scrimAlpha`, one CTA.
- **Dev overlay** (`DevOverlay`, toggle `` ` ``): right-docked scrim panel,
  sections grouped by `config` key (Player/Respawn/Juice/Traps/UI), each a
  labeled control + live numeric readout + helper text for non-obvious consts.
- **Reduced motion:** if `window.matchMedia('(prefers-reduced-motion: reduce)')`
  matches, replace shake/particles with a single flash; keep the game playable.
- Maintain ≥4.5:1 contrast for UI text over the tileset.

## `Trap` interface

```ts
export interface Trap {
  // called once after construction with its Tiled object + parsed props
  spawn(scene: GameScene, obj: TiledObject): void;
  update(dt: number, player: Player): void; // dt in seconds
  // traps signal a kill by calling scene.killPlayer(); no return-value coupling
}
```

`GameScene.killPlayer()` is the single death entry point: trigger juice → brief
delay (`config.respawn.delayMs`) → respawn at active checkpoint → increment
death counter. Idempotent if called multiple times in one frame.

## Player movement (implement precisely)

State: `grounded`, `coyoteTimer`, `jumpBufferTimer`, `velocity`.
- On move input: accelerate toward `±runSpeed` using ground/air accel; apply
  friction when no input on ground.
- Jump fires if (`grounded` OR `coyoteTimer>0`) AND a jump press is buffered.
- Releasing jump while rising multiplies upward velocity by `jumpCutMultiplier`
  (variable height).
- Clamp fall to `maxFallSpeed`.
- Decrement `coyoteTimer` each airborne frame; set `jumpBufferTimer` on press.

Acceptance: a jump pressed up to `jumpBufferFrames` before landing still
executes; a jump pressed up to `coyoteFrames` after walking off a ledge still
executes. These are testable without judging "feel."

## Dev overlay (`DevOverlay.ts`)

Toggle with backtick `` ` ``. Renders sliders/number inputs bound to `config`
values; changes take effect immediately (no reload). Also exposes
`debug.showHiddenTraps` (renders hidden spikes / fake-block ghosts) and
`debug.showHitboxes`. This is how the human tunes feel at batch-review time.

## Milestones (build sequentially; each must run in the browser)

1. **Scaffold** — Vite + Phaser + TS boots to an empty `GameScene`; `config.ts`
   present; `DevOverlay` toggles (can be empty). `npm run dev` works.
2. **Movement + camera** — `Player` with full moveset above; Arcade collision
   against a hardcoded test `solid` layer; camera follows player. Verify the two
   acceptance tests (coyote + buffer).
3. **Death/respawn loop** — `killPlayer`, `RespawnSystem` with checkpoints,
   death counter in `UIScene`, `Juice` shake + particles. Use a kill-plane and a
   couple of test checkpoints.
4. **Trap components** — all four traps implementing `Trap`, driven by props,
   each demoed in the test map.
5. **Tiled loader + the slice level** — `LevelLoader` to the schema above; wire
   Kenney tileset; author the real 3–4 screen level using all four trap types,
   frequent checkpoints, a chase finale, and a win flag.
6. **Polish + UI** — implement the UI/UX contract above: custom pixel-art icon
   atlas (no emoji), fonts with tabular HUD digits, title/menu, win banner,
   death feedback, reduced-motion path; populate the dev overlay with all
   constants; final particle/shake pass; ensure `showHiddenTraps` works.

## Definition of done

- `npm install && npm run dev` launches a playable slice.
- All four trap types appear and kill fairly; every section is beatable with the
  base moveset (no trap requires a tool the player lacks).
- Instant respawn at the last checkpoint; death counter increments; no soft-locks.
- Win flag ends the level (banner in `UIScene`).
- Every feel constant is in `config.ts` and live-editable via the overlay.
- All icons are custom pixel sprites (no emoji/glyphs); HUD digits are tabular;
  reduced-motion path verified; UI text meets 4.5:1 contrast.
- README documents how to run, how to open the map in Tiled, and the trap schema.

## Rules of engagement for Codex

- Stay in scope (one slice). No menus/save/world-map/audio.
- Fail loud on bad map data; never silently swallow a missing required prop.
- No magic numbers outside `config.ts`.
- If a choice materially affects player feel and isn't specified, pick the
  simplest option and mark it `// UNSURE: <what & why>` for human review.
- Parallel sub-agents are read-only only — see `AGENTS.md`. All edits/commands
  with side effects run in the main agent.
