export const ARENA = {
  size: 20,
  half: 10,
  wallHeight: 3,
  background: 0x04060e,
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

/**
 * Cielo procedural. Ojo: starRadius y las distancias de los planetas tienen que
 * quedar por debajo de PLAYER.far (200) y por encima de ARENA.fogFar (80),
 * o el cielo desaparece dentro de la niebla o queda detras del far plane.
 */
export const SKY = {
  starRadius: 160,
  starCount: 1400,
  starSize: 1.2,
  twinkleSpeed: 2.5,
  starDrift: 0.004,
  colors: [0xffffff, 0xbfd8ff, 0xffd9b3, 0xffb3c2],
  planets: [
    { direction: [-0.6, 0.5, -0.55], distance: 120, radius: 10, color: 0x9a4f2e, ring: false },
    { direction: [0.65, 0.35, -0.6], distance: 115, radius: 7, color: 0x6f8fbf, ring: true },
    { direction: [0.15, 0.7, 0.65], distance: 130, radius: 5.5, color: 0x8a6fbf, ring: false },
  ],
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
  /** Impulso vertical inicial del salto, en metros por segundo. */
  jumpSpeed: 6,
  /** Caida libre. Con jumpSpeed 6 y gravity 18 el salto dura ~0.66 s. */
  gravity: 18,
  fov: 70,
  near: 0.1,
  far: 200,
  /**
   * Punto de aparicion. El jugador reaparece aqui al reiniciar, no donde
   * morreu. La arena va de -10 a 10 en X y Z: mantenlo dentro de ese margen.
   */
  spawn: { x: 0, z: 0 },
};

export const MOB = {
  maxHp: 20,
  /** Defaults. Cada etapa de CAMPAIGN los sobrescribe con sus valores. */
  bossMaxHp: 100,
  bossEscortCount: 2,
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

/**
 * Variantes de enemigo. El color y la forma salen del modelo (ver MobFactory),
 * aqui solo va lo de juego: escala, velocidad y cuando golpea.
 * Si la variante define maxHp, ese valor gana sobre MOB.maxHp.
 * El jefe conserva el balance ajustado: 8 de dano cada 2 s.
 */
export const MOB_VARIANTS = {
  soldier: {
    label: 'soldier',
    model: 'soldier',
    scale: 1,
    speed: 2.2,
    damage: 2,
    attackRange: 1.7,
    attackCooldown: 1,
  },
  alien: {
    label: 'alien',
    model: 'alien',
    scale: 1,
    speed: 1.8,
    damage: 2,
    attackRange: 1.7,
    attackCooldown: 1,
  },
  tank: {
    label: 'tank',
    model: 'tank',
    scale: 1,
    speed: 0.9,
    damage: 2,
    attackRange: 2.1,
    attackCooldown: 1,
  },
  boss: {
    label: 'boss',
    model: 'boss',
    isBoss: true,
    maxHp: MOB.bossMaxHp,
    scale: 1,
    speed: 3.2,
    damage: 5,
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

/**
 * Campaña de 5 etapas. Cada una sube la dificultad: mas enemigos, mas
 * rápidos, mas dano, mas escolta alrededor del jefe y un jefe mas duro.
 * Derrotar al jefe de una etapa desbloquea la siguiente. La etapa 1 es la
 * que arranca el jugador y sus numeros coinciden con los defaults de MOB.
 *
 * @typedef {Object} Stage
 * @property {number} id
 * @property {string} label nombre de la camara, se muestra en el HUD
 * @property {number} mobCount enemigos normales en la arena
 * @property {number} escortCount enemigos normales que quedan con el jefe
 * @property {number} speedScale multiplicador de velocidad de los normales
 * @property {number} damageScale multiplicador de dano de los normales
 * @property {number} bossHp vida del jefe de la etapa
 * @property {number} bossDamage dano por golpe del jefe
 * @property {number} bossSpeed velocidad del jefe
 * @property {Palette} palette colores con que Arena pinta la camara
 *
 * @typedef {Object} Palette color environment de la camara
 * @property {number} background cielo y niebla
 * @property {number} groundColor suelo
 * @property {number} gridMain lineas principales de la rejilla
 * @property {number} gridLines lineas menores de la rejilla
 * @property {number} wallColor muros
 * @property {number} skyColor luz de cielo (hemispherical)
 * @property {number} sunColor luz del sol (direccional)
 */
export const CAMPAIGN = {
  storageKey: 'fps-azul:campaign',
  stages: [
    {
      id: 1,
      label: 'Hangar',
      mobCount: 6,
      escortCount: 2,
      speedScale: 1,
      damageScale: 1,
      bossHp: MOB.bossMaxHp,
      bossDamage: 5,
      bossSpeed: 3.2,
      palette: {
        background: ARENA.background,
        groundColor: ARENA.groundColor,
        gridMain: ARENA.gridMain,
        gridLines: ARENA.gridLines,
        wallColor: ARENA.wallColor,
        skyColor: LIGHTS.skyColor,
        sunColor: LIGHTS.sunColor,
      },
    },
    {
      id: 2,
      label: 'Deposito',
      mobCount: 7,
      escortCount: 3,
      speedScale: 1.1,
      damageScale: 1.2,
      bossHp: 130,
      bossDamage: 6,
      bossSpeed: 3.4,
      palette: {
        background: 0x140b04,
        groundColor: 0x3a332a,
        gridMain: 0x8a7a6f,
        gridLines: 0x52493d,
        wallColor: 0x665c4a,
        skyColor: 0xffe8c8,
        sunColor: 0xffb347,
      },
    },
    {
      id: 3,
      label: 'Reactor',
      mobCount: 8,
      escortCount: 3,
      speedScale: 1.2,
      damageScale: 1.4,
      bossHp: 160,
      bossDamage: 7,
      bossSpeed: 3.6,
      palette: {
        background: 0x031412,
        groundColor: 0x203a38,
        gridMain: 0x5fa8a0,
        gridLines: 0x356b66,
        wallColor: 0x3a6b66,
        skyColor: 0xd4fff8,
        sunColor: 0x59e6c8,
      },
    },
    {
      id: 4,
      label: 'Crisol',
      mobCount: 9,
      escortCount: 4,
      speedScale: 1.3,
      damageScale: 1.6,
      bossHp: 200,
      bossDamage: 8,
      bossSpeed: 3.8,
      palette: {
        background: 0x140602,
        groundColor: 0x45302a,
        gridMain: 0xc98f6a,
        gridLines: 0x7a5242,
        wallColor: 0x8a4a3a,
        skyColor: 0xffd7b3,
        sunColor: 0xff7f3f,
      },
    },
    {
      id: 5,
      label: 'Nucleo',
      mobCount: 10,
      escortCount: 4,
      speedScale: 1.4,
      damageScale: 1.8,
      bossHp: 240,
      bossDamage: 9,
      bossSpeed: 4,
      palette: {
        background: 0x0b0414,
        groundColor: 0x352a45,
        gridMain: 0x9a8ac9,
        gridLines: 0x5a4d7a,
        wallColor: 0x5f4d8a,
        skyColor: 0xe8d8ff,
        sunColor: 0xa86fff,
      },
    },
  ],
};
