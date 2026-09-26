export const ARENA = {
  size: 20,
  half: 10,
  wallHeight: 3,
  background: 0x101218,
  fogNear: 35,
  fogFar: 80,
  groundColor: 0x2a2f3a,
  gridMain: 0x6f7a8a,
  gridLines: 0x3d4552,
  wallColor: 0x4a5166,
};

export const LIGHTS = {
  skyColor: 0xffffff,
  groundColor: 0x303040,
  skyIntensity: 1.6,
  sunColor: 0xffffff,
  sunIntensity: 2.2,
  sunPosition: [6, 10, 4],
};

export const GAME = {
  duration: 60,
  bossAt: 40,
  maxHp: 20,
};

export const PLAYER = {
  speed: 5,
  height: 1.7,
  edgeMargin: 0.5,
  bobRate: 10,
  fov: 70,
  near: 0.1,
  far: 200,
};

export const MOB = {
  maxHp: 20,
  count: 6,
  respawnDelay: 3,
  respawnCooldown: 1,
  aggroRange: 14,
  spawnMinDistance: 6.5,
  spawnAttempts: 12,
  spawnRingInner: 3,
  spawnRingSpread: 6.5,
  spawnFallbackInner: 8,
  hitFlashColor: 0x88ccff,
};

export const MOB_VARIANTS = {
  grunt: {
    label: 'grunt',
    color: 0x2f7fff,
    scale: 1,
    speed: 2.2,
    damage: 2,
    attackRange: 1.7,
    attackCooldown: 1,
  },
  boss: {
    label: 'boss',
    color: 0x4a2fff,
    scale: 2.2,
    speed: 3.2,
    damage: 8,
    attackRange: 2.6,
    attackCooldown: 2,
  },
};

export const FX = {
  particleCount: 60,
  tracerCount: 12,
  tracerSpeed: 130,
  gravity: 9.8,
  particleMinScale: 0.15,
  particleScaleRange: 0.12,
};

export const HIT_BURSTS = {
  bullet: { count: 12, speed: 4, color: 0xffaa33 },
  melee: { count: 6, speed: 3, color: 0x8fd3ff },
};
