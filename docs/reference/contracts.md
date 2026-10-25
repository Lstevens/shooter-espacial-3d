# Contratos (Tipos Compartidos)

Definiciones JSDoc en `src/contracts.js`. Cero codigo en tiempo de ejecucion. Un modulo depende de la forma documentada aqui, no de una clase concreta.

## WeaponDef

Definicion de datos de un arma.

```typescript
interface WeaponDef {
  label: string;              // Nombre mostrado
  damage: number;             // Danio por disparo
  fireRate: number;           // Segundos entre disparos
  automatic: boolean;         // Dispara mientras boton presionado
  range: number;              // Alcance maximo
  attack: string;             // ID estrategia en WeaponSystem
  muzzle: { x: number, y: number, z: number };  // Boca del arma en espacio modelo
  flashScale: number;         // Tamano destello boca
  recoilPush: number;         // Retroceso al disparar
  swingPush: number;          // Avance al golpear melee
  magazine?: number;          // Balas por cargador (undefined = sin municion)
  reserve?: number;           // Reserva inicial
  maxReserve?: number;        // Tope reserva
  reloadTime?: number;        // Segundos recarga
}
```

## WeaponAmmoState

Estado de municion actual.

```typescript
interface WeaponAmmoState {
  hasAmmo: boolean;       // El arma usa municion
  magazine: number;       // Balas en cargador
  capacity: number;       // Tamano cargador
  reserve: number;        // Balas guardadas
  reloading: boolean;     // En proceso recarga
  reloadProgress: number; // 0 a 1
}
```

## AttackContext

Contexto que recibe la estrategia de ataque al ejecutarse.

```typescript
interface AttackContext {
  origin: THREE.Vector3;           // Posicion jugador
  direction: THREE.Vector3;        // Vector normalizado hacia donde mira
  muzzle: THREE.Vector3;           // Punto salida proyectil (copiar antes de usar)
  targets: Target[];               // Todo lo que puede recibir dano
  fx: {
    spawnBurst: (position: THREE.Vector3, count: number, speed: number, hex: number) => void;
    spawnTracer: (from: THREE.Vector3, to: THREE.Vector3) => void;
  };
}
```

## Target

Contrato minimo de un objetivo atacable.

```typescript
interface Target {
  group: THREE.Object3D;        // Raiz usada para raycast
  position: THREE.Vector3;
  isAlive: boolean;
  takeDamage: (amount: number) => void;
  aimPoint?: THREE.Vector3;     // Centro cuerpo para golpes melee
  maxHp?: number;               // Vida maxima (barras, debug)
}
```

## AttackStrategy

Contrato minimo de un modo de disparo (Strategy Pattern).

```typescript
interface AttackStrategy {
  id: string;
  execute: (context: AttackContext, weapon: WeaponDef) => void;
}
```

## ViewSource

Lo que un arma necesita ver para dispararse (camara, movimiento).

```typescript
interface ViewSource {
  origin: THREE.Vector3;
  forward: () => THREE.Vector3;
  bobPhase: number;
}
```

## MovementAxis

Entrada de movimiento normalizada.

```typescript
interface MovementAxis {
  forward: -1 | 0 | 1;
  right: -1 | 0 | 1;
}
```

## MobVariant

Variante de enemigo (data-driven).

```typescript
interface MobVariant {
  label: string;
  maxHp?: number;      // Si falta, gana MOB.maxHp
  color: number;
  scale: number;
  speed: number;
  damage: number;
  attackRange: number;
  attackCooldown: number;
}
```

## AiContext

Contexto para IA de enemigos.

```typescript
interface AiContext {
  targetPosition: THREE.Vector3;
  onHit: (damage: number, sourcePosition?: THREE.Vector3) => void;
  collision?: CollisionWorld;
}
```

## BossState

Estado del jefe para HUD.

```typescript
interface BossState {
  hp: number;
  maxHp: number;
}
```

## Snapshot

Lo que el HUD necesita para dibujarse cada frame.

```typescript
interface Snapshot {
  hp: number;
  maxHp: number;
  elapsed: number;           // Segundos en camara actual
  weaponLabel: string;
  weaponAmmo: WeaponAmmoState;
  boss: BossState | null;    // Jefe vivo si ya aparecio
  stageIndex: number;        // Camara actual (1 a 5)
  stageTotal: number;        // Total camaras
  stageLabel: string;        // Nombre camara
  difficulty: string;        // Nivel amenaza
}
```

## HudContract

Vista del DOM que consume Game.

```typescript
interface HudContract {
  render: (snapshot: Snapshot) => void;
  showPause: () => void;
  hidePause: () => void;
  damageFrom: (angleRad: number) => void;  // 0 = frente, +PI/2 = derecha
  flashDamage: () => void;
  damageNumber: (amount: number) => void;
  setCrosshair: (active: boolean) => void;
}
```

## AudioContract

Sonido procedural, sin archivos.

```typescript
interface AudioContract {
  resume: () => void;
  setMuted: (muted: boolean) => void;
  toggleMute: () => boolean;
  shot: (weaponId: string) => void;
  reload: () => void;
  empty: () => void;
  hurt: () => void;
  death: () => void;
  win: () => void;
  bossDown: () => void;
  pickup: () => void;
}
```

## PickupKind

```typescript
type PickupKind = 'health' | 'ammo';
```

## PickupSystemContract

```typescript
interface PickupSystemContract {
  spawn: (kind: PickupKind, position: THREE.Vector3) => void;
  update: (
    delta: number,
    playerPosition: THREE.Vector3,
    hooks: { onPickup?: (kind: PickupKind) => void }
  ) => void;
  clear: () => void;
  dispose: () => void;
}
```

## Uso en Modulos

```javascript
/**
 * @param {import('../contracts.js').AttackContext} context
 * @param {import('../contracts.js').WeaponDef} weapon
 */
export class HitscanAttack {
  id = 'hitscan'
  execute(context, weapon) {
    // context.targets cumple Target[]
    // context.fx.spawnBurst, spawnTracer
  }
}
```

> **Principio**: Los modulos importan solo los tipos (`@typedef`) via JSDoc. No hay dependencia en tiempo de ejecucion sobre `contracts.js` (export vacio).