export const config = {
  game: {
    width: 960,
    height: 540,
  },
  player: {
    runSpeed: 220,
    accel: 1800,
    airAccel: 1400,
    friction: 1600,
    gravity: 1800,
    jumpVelocity: 620,
    jumpCutMultiplier: 0.45,
    maxFallSpeed: 900,
    coyoteFrames: 6,
    jumpBufferFrames: 6,
  },
  respawn: {
    delayMs: 120,
  },
  juice: {
    shakeDurationMs: 180,
    shakeIntensity: 0.012,
    particleCount: 16,
  },
  traps: {
    hiddenSpike: {
      revealRadiusPx: 48,
    },
    fakeBlock: {
      vanishDelayMs: 120,
      respawnMs: 1500,
    },
    arrowTrap: {
      fireIntervalMs: 1400,
      projectileSpeed: 320,
    },
    chaseZone: {
      scrollSpeed: 80,
    },
  },
  debug: {
    overlay: false,
    showHiddenTraps: false,
    showHitboxes: false,
  },
  ui: {
    color: {
      bg: 0x0d0d12,
      text: 0xf5f5f0,
      textDim: 0x9a9ab0,
      accent: 0xffd23f,
      danger: 0xff3b3b,
      safe: 0x3fe0a0,
    },
    scrimAlpha: 0.7,
    ctaPulseMs: 1200,
    deathFlashMs: 120,
    counterPunch: 1.15,
  },
} as const;
