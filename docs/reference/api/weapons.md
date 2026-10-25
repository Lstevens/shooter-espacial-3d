# API Weapons

Modulos en `src/weapons/`.

## WeaponSystem

Gestion de seleccion, cadencia, municion y recarga. Usa Strategy Pattern para ataques.

### Constructor

```javascript
new WeaponSystem({
  view,           // Player (ViewSource: origin, forward(), bobPhase)
  viewModel,      // ViewModel
  clock,          // THREE.Clock
  isFiring,       // () => boolean (input.firing)
  effects,        // EffectsSystem
  attacks,        // AttackStrategy[] (HitscanAttack, MeleeAttack, ...)
  audio?          // AudioSystem (opcional)
})
```

### Propiedades (Getters)

| Propiedad | Tipo | Descripcion |
|-----------|------|-------------|
| `currentKey` | string | Clave arma actual (`'pistol'`, `'ak'`, `'knife'`) |
| `current` | WeaponDef | Definicion completa del arma actual |
| `currentLabel` | string | Label para HUD |
| `ammoState` | WeaponAmmoState | Estado municion listo para HUD |

### Metodos Publicos

| Metodo | Descripcion |
|--------|-------------|
| `setTargets(targets: Target[])` | Actualiza lista de objetivos atacables |
| `select(key: string)` | Cambia arma por clave (cancela recarga) |
| `cycle(direction: number)` | Cicla armas (`+1` siguiente, `-1` anterior) |
| `tryFire(): boolean` | Intenta disparo unico (semiauto), retorna exito |
| `reload(): boolean` | Inicia recarga, retorna exito |
| `addAmmo(amount: number): number` | Añade reserva, retorna cantidad real añadida |
| `reset()` | Reset municion y cadencia a estado inicial |
| `update(delta)` | Tick: recarga, viewModel, disparo automatico |

### Flujo de Disparo

```
tryFire()
  -> valida recarga, cargador, fireRate
  -> viewModel.onShot(weapon)  // animacion visual
  -> attacks.get(weapon.attack).execute(context, weapon)
  -> ammo.magazine -= 1
  -> audio.shot(key)
```

### Contexto de Ataque (`#buildContext()`)

```javascript
{
  origin: player.origin,                    // THREE.Vector3
  direction: player.forward(),              // THREE.Vector3 normalizado
  muzzle: viewModel.muzzleWorldPosition(),  // THREE.Vector3 (copia antes de usar)
  targets: this.#targets,                   // Target[]
  fx: effects                               // EffectsSystem
}
```

---

## WeaponCatalog (`src/weapons/WeaponCatalog.js`)

Catalogo data-driven de armas.

```javascript
export const WEAPON_CATALOG = {
  pistol: { label: 'Pistola', damage: 12, fireRate: 0.25, automatic: false, range: 40, attack: 'hitscan', muzzle: new THREE.Vector3(0.1, -0.05, -0.6), flashScale: 0.8, recoilPush: 0.4, swingPush: 0, magazine: 12, reserve: 60, maxReserve: 120, reloadTime: 1.4 },
  ak: { label: 'AK', damage: 16, fireRate: 0.09, automatic: true, range: 50, attack: 'hitscan', muzzle: new THREE.Vector3(0.15, -0.1, -0.8), flashScale: 1.0, recoilPush: 0.6, swingPush: 0, magazine: 30, reserve: 90, maxReserve: 180, reloadTime: 2.2 },
  knife: { label: 'Cuchillo', damage: 40, fireRate: 0.9, automatic: false, range: 2.5, attack: 'melee', muzzle: new THREE.Vector3(0, 0, 0), flashScale: 0, recoilPush: 0, swingPush: 1.2, magazine: undefined, reserve: undefined, maxReserve: undefined, reloadTime: undefined }
}

export const WEAPON_ORDER = ['pistol', 'ak', 'knife']
export const DEFAULT_WEAPON = 'pistol'
```

> **Anadir arma**: nueva entrada en `WEAPON_CATALOG` + clave en `WEAPON_ORDER`. `WeaponSystem` no se toca (OCP).

---

## ViewModel (`src/weapons/ViewModel.js`)

Modelo visual del arma (animaciones, recoil, muzzle flash).

### Constructor

```javascript
new ViewModel({ camera: player.camera })
```

### Metodos

| Metodo | Descripcion |
|--------|-------------|
| `onSwitch(key)` | Animacion de cambio de arma |
| `onShot(weapon)` | Recoil, muzzle flash, screen shake |
| `muzzleWorldPosition(): THREE.Vector3` | Posicion boca en espacio mundo |
| `update(delta, bobPhase, elapsed)` | Bobbing, recuperacion recoil, decay flash |

---

## Attack Strategies (`src/weapons/attacks/`)

### HitscanAttack

Disparo instantaneo (raycast).

```javascript
new HitscanAttack()
// id = 'hitscan'
execute(context, weapon):
  - raycast desde context.origin + context.direction * weapon.range
  - filtra context.targets por interseccion con group
  - takeDamage en el mas cercano
  - fx.spawnBurst(punto impacto, HIT_BURSTS.bullet)
  - fx.spawnTracer(muzzle, punto impacto)
```

### MeleeAttack

Golpe cuerpo a cuerpo (esfera overlap).

```javascript
new MeleeAttack()
// id = 'melee'
execute(context, weapon):
  - esfera en context.muzzle radio weapon.range
  - filtra context.targets por distancia a aimPoint/position
  - takeDamage en los dentro de rango
  - fx.spawnBurst(muzzle, HIT_BURSTS.melee)
```

### Anadir Nueva Estrategia

```javascript
// src/weapons/attacks/ProjectileAttack.js
export class ProjectileAttack {
  id = 'projectile'
  execute(context, weapon) {
    // spawnea mesh con velocidad, gravedad, colision
  }
}

// En main.js:
import { ProjectileAttack } from './weapons/attacks/ProjectileAttack.js'
const weapons = new WeaponSystem({
  attacks: [new HitscanAttack(), new MeleeAttack(), new ProjectileAttack()]
})
// En WeaponCatalog: attack: 'projectile'
```

---

## WeaponFactory (`src/weapons/WeaponFactory.js`)

Crea modelo visual Three.js para ViewModel.

```javascript
WeaponFactory.createWeaponModel(key)  // retorna { group, parts, materials }
```

---

## Uso Tipico

```javascript
import { WeaponSystem } from './weapons/WeaponSystem.js'
import { HitscanAttack } from './weapons/attacks/HitscanAttack.js'
import { MeleeAttack } from './weapons/attacks/MeleeAttack.js'
import { ViewModel } from './weapons/ViewModel.js'

const viewModel = new ViewModel({ camera: player.camera })
const weapons = new WeaponSystem({
  view: player,
  viewModel,
  clock,
  isFiring: () => input.firing,
  effects,
  attacks: [new HitscanAttack(), new MeleeAttack()],
  audio
})

// En loop:
weapons.update(delta)

// Input:
input.on(INPUT_EVENTS.firePress, () => { if (!weapons.current.automatic) weapons.tryFire() })
input.on(INPUT_EVENTS.weaponSelect, (slot) => weapons.select(slot))
input.on(INPUT_EVENTS.reloadPress, () => weapons.reload())
```