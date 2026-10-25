# Referencia de Configuracion

Todas las constantes del juego en `src/config.js`. Fuente unica de verdad para balanceo.

## ARENA

```javascript
export const ARENA = {
  size: 20,           // Tamaño total (metros)
  half: 10,           // Mitad (radio)
  wallHeight: 3,      // Altura muros
  background: 0x0a0d15,
  fogNear: 35,
  fogFar: 80,
  groundColor: 0x3a3842,
  gridMain: 0x7a8090,
  gridLines: 0x4d525a,
  wallColor: 0x52586a
}
```

## LIGHTS

```javascript
export const LIGHTS = {
  skyColor: 0xffffff,
  groundColor: 0x303040,
  skyIntensity: 1.6,
  sunColor: 0xffffff,
  sunIntensity: 2.2,
  sunPosition: [6, 10, 4]
}
```

## SKY (Cielo Procedural)

```javascript
export const SKY = {
  starRadius: 160,        // Debe ser < PLAYER.far (200) y > ARENA.fogFar (80)
  starCount: 1400,
  starSize: 1.2,
  twinkleSpeed: 2.5,
  starDrift: 0.004,
  colors: [0xffffff, 0xbfd8ff, 0xffd9b3, 0xffb3c2],
  planets: [
    { direction: [-0.6, 0.5, -0.55], distance: 120, radius: 10, color: 0x9a4f2e, ring: false },
    { direction: [0.65, 0.35, -0.6], distance: 115, radius: 7, color: 0x6f8fbf, ring: true },
    { direction: [0.15, 0.7, 0.65], distance: 130, radius: 5.5, color: 0x8a6fbf, ring: false }
  ]
}
```

## GAME (Reglas Generales)

```javascript
export const GAME = {
  bossAt: 40,           // Segundos hasta spawn del jefe
  maxHp: 20,            // Vida maxima jugador
  pickupHeal: 8,        // Curacion por pickup vida
  pickupAmmo: 24        // Municion por pickup ammo
}
```

## DOOR (Puerta de Salida)

```javascript
export const DOOR = {
  width: 4.2,
  height: 3,
  openTime: 1.6,
  triggerRadius: 1.8,
  clearance: 1.2,       // Margen lateral libre
  laneDepth: 4          // Profundidad franja libre frente al vano
}
```

Helper: `inExitLane(x, z)` — true si punto cae en franja frente a la puerta.

## PLAYER

```javascript
export const PLAYER = {
  speed: 5,
  height: 1.7,
  radius: 0.35,
  edgeMargin: 0.5,
  bobRate: 10,
  jumpSpeed: 6,
  gravity: 18,
  fov: 70,
  near: 0.1,
  far: 200,
  spawn: { x: 0, z: 0 }
}
```

## MOB (Defaults Enemigos)

```javascript
export const MOB = {
  maxHp: 20,
  radius: 0.42,
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
  navLookahead: 1.4,
  navSteps: 3,
  navProbeScale: 0.9
}
```

## MOB_VARIANTS

```javascript
export const MOB_VARIANTS = {
  soldier: { label: 'soldier', model: 'soldier', scale: 1, speed: 2.2, damage: 2, attackRange: 1.7, attackCooldown: 1 },
  alien:   { label: 'alien',   model: 'alien',   scale: 1, speed: 1.8, damage: 2, attackRange: 1.7, attackCooldown: 1 },
  tank:    { label: 'tank',    model: 'tank',    scale: 1, speed: 0.9, damage: 2, attackRange: 2.1, attackCooldown: 1 },
  boss:    { label: 'boss',    model: 'boss',    isBoss: true, maxHp: 100, scale: 1, speed: 3.2, damage: 5, attackRange: 2.6, attackCooldown: 2 }
}
```

> **Nota**: Si una variante define `maxHp`, ese valor tiene prioridad sobre `MOB.maxHp`.

## FX (Efectos)

```javascript
export const FX = {
  particleCount: 60,
  tracerCount: 12,
  tracerSpeed: 130,
  gravity: 9.8,
  particleMinScale: 0.15,
  particleScaleRange: 0.12
}

export const HIT_BURSTS = {
  bullet: { count: 12, speed: 4, color: 0xffaa33 },
  melee: { count: 6, speed: 3, color: 0x8fd3ff },
  shipDestruction: { count: 30, speed: 6, color: 0xff9900 }
}
```

## CAMPAIGN (5 Etapas)

Cada etapa define: tema visual, conteo enemigos, stats jefe, paleta de colores.

```javascript
export const CAMPAIGN = {
  storageKey: 'fps-azul:campaign',
  stages: [
    { id: 1, label: 'Hangar',     difficulty: 'Amenaza baja',        theme: 'hangar',  mobCount: 6,  escortCount: 2, speedScale: 1.0, damageScale: 1.0, bossHp: 100, bossDamage: 5, bossSpeed: 3.2, palette: {...} },
    { id: 2, label: 'Deposito',   difficulty: 'Amenaza moderada',    theme: 'depot',   mobCount: 7,  escortCount: 3, speedScale: 1.1, damageScale: 1.2, bossHp: 130, bossDamage: 6, bossSpeed: 3.4, palette: {...} },
    { id: 3, label: 'Reactor',    difficulty: 'Amenaza alta',        theme: 'reactor', mobCount: 8,  escortCount: 3, speedScale: 1.2, damageScale: 1.4, bossHp: 160, bossDamage: 7, bossSpeed: 3.6, palette: {...} },
    { id: 4, label: 'Crisol',     difficulty: 'Amenaza critica',     theme: 'crucible',mobCount: 9,  escortCount: 4, speedScale: 1.3, damageScale: 1.6, bossHp: 200, bossDamage: 8, bossSpeed: 3.8, palette: {...} },
    { id: 5, label: 'Nucleo',     difficulty: 'Amenaza extrema',     theme: 'core',    mobCount: 10, escortCount: 4, speedScale: 1.4, damageScale: 1.8, bossHp: 240, bossDamage: 9, bossSpeed: 4.0, palette: {...} }
  ]
}
```

### Estructura Palette

```javascript
palette: {
  background: 0x...,   // cielo y niebla
  groundColor: 0x...,  // suelo
  gridMain: 0x...,     // lineas principales rejilla
  gridLines: 0x...,    // lineas menores rejilla
  wallColor: 0x...,    // muros
  skyColor: 0x...,     // luz hemisferica
  sunColor: 0x...      // luz direccional
}
```

## Uso en Codigo

```javascript
import { ARENA, GAME, MOB, CAMPAIGN, inExitLane } from '../config.js'

// Ejemplo: verificar spawn valido
if (inExitLane(x, z)) return false // no spawn en franja puerta

// Ejemplo: escalar stats por etapa
const stage = CAMPAIGN.stages[campaign.stageIndex]
const enemySpeed = MOB_VARIANTS.soldier.speed * stage.speedScale
const enemyDamage = MOB_VARIANTS.soldier.damage * stage.damageScale
```