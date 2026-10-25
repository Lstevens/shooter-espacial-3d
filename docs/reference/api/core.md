# API Core

Modulos en `src/core/`.

## Game

Orquestador principal. Decide orden de actualizacion y transiciones de partida.

### Constructor

```javascript
new Game({
  scene,           // THREE.Scene
  renderer,        // THREE.WebGLRenderer
  camera,          // THREE.PerspectiveCamera
  state,           // GameState
  player,          // Player
  input,           // InputController
  weapons,         // WeaponSystem
  mobs,            // MobSystem
  effects,         // EffectsSystem
  skybox,          // SpaceSkybox
  hud,             // Hud
  campaign,        // Campaign
  arena,           // Arena
  collision,       // CollisionWorld
  audio?,          // AudioSystem (opcional)
  pickups?         // PickupSystem (opcional)
})
```

### Metodos Publicos

| Metodo | Descripcion |
|--------|-------------|
| `start()` | Inicia bucle: carga etapa 1, render inicial, `setAnimationLoop` |
| `restart()` | Reinicia run actual (o desde camara 1 si campana completada) |
| `restartFromFirst()` | Reinicia desde camara 1, resetea progreso campana |
| `onPlayerDamage(amount, sourcePosition?)` | Aplica dano al jugador, actualiza HUD, chequea muerte |
| `endGame(won)` | Fin de partida: avanza campana o game over, muestra overlay |

### Metodos Privados (Internos)

| Metodo | Descripcion |
|--------|-------------|
| `#tick()` | Frame: delta clampado, `update()`, `renderer.render()` |
| `update(delta)` | Orden de actualizacion completo (ver Game Loop) |
| `#updateTimer(delta)` | Spawn jefe a `GAME.bossAt` segundos |
| `#openExit()` | Crea y abre `Door` tras derrotar jefe |
| `#advanceStage()` | Cruce puerta: cura, reset timer, carga siguiente etapa |
| `#loadStage(stage)` | Configura arena, colisiones, mobs, armas, efectos, HUD |
| `#applyPickup(kind)` | Procesa pickup vida/municion |
| `#damageAngle(sourcePosition)` | Angulo relativo a mirada para indicador HUD |
| `#snapshot()` | Estado para HUD (hp, ammo, arma, jefe, etapa, kills, tiempo) |

### Eventos de Entrada (wired en `main.js`)

- `INPUT_EVENTS.lockRequest` -> `player.lock()` -> `state.start()`
- `INPUT_EVENTS.firePress` -> `weapons.tryFire()` (semiauto)
- `INPUT_EVENTS.weaponSelect(slot)` -> `weapons.select(slot)`
- `INPUT_EVENTS.weaponCycle(dir)` -> `weapons.cycle(dir)`
- `INPUT_EVENTS.reloadPress` -> `weapons.reload()`
- `INPUT_EVENTS.savePress` -> `campaign.save()`
- `hud.onRestart` -> `game.restart()`
- `hud.onRestartFromFirst` -> `game.restartFromFirst()`

---

## GameState

Estado de la partida: vida, tiempo, status.

### Propiedades

| Propiedad | Tipo | Descripcion |
|-----------|------|-------------|
| `status` | string | `'menu' \| 'playing' \| 'paused' \| 'dead' \| 'won'` |
| `hp` | number | Vida actual |
| `elapsed` | number | Segundos en camara actual |
| `isPlaying` | boolean | `status === 'playing'` |
| `isFinished` | boolean | `status === 'dead' \| 'won'` |

### Metodos

| Metodo | Descripcion |
|--------|-------------|
| `start()` | `status = 'playing'` |
| `pause()` | `status = 'paused'` |
| `finish(won)` | `status = won ? 'won' : 'dead'` |
| `damage(amount)` | Resta hp, retorna `true` si muere |
| `heal(amount)` | Suma hp (max `GAME.maxHp`), retorna cantidad curada |
| `reset()` | `hp = maxHp`, `elapsed = 0`, `status = 'menu'` |

---

## Campaign

Progreso de 5 camaras, persistencia `localStorage`.

### Propiedades

| Propiedad | Descripcion |
|-----------|-------------|
| `unlocked` | Ultima camara desbloqueada (1-5) |
| `stageIndex` | Indice actual (0-based) |
| `stage` | Objeto etapa actual (ver `config.js`) |
| `isComplete` | `stageIndex === stages.length - 1` y jefe derrotado |
| `total` | Total etapas (5) |

### Metodos

| Metodo | Descripcion |
|--------|-------------|
| `advance()` | Avanza a siguiente etapa, retorna `stage` o `null` si ya en la ultima |
| `reset()` | Vuelve a etapa 1, `unlocked = 1` |
| `save()` | Persiste en `localStorage` (`fps-azul:campaign`) |

### Estructura Stage (ver `config.js`)

```javascript
{
  id: 1,
  label: 'Hangar',
  difficulty: 'Amenaza baja',
  theme: 'hangar',
  mobCount: 6,
  escortCount: 2,
  speedScale: 1,
  damageScale: 1,
  bossHp: 100,
  bossDamage: 5,
  bossSpeed: 3.2,
  palette: { background, groundColor, gridMain, gridLines, wallColor, skyColor, sunColor }
}
```

---

## EventEmitter

Pub/sub ligero (sin dependencias).

```javascript
const emitter = new EventEmitter()

emitter.on('evento', (data) => { ... })
emitter.off('evento', handler)
emitter.emit('evento', data)
emitter.once('evento', handler)  // se elimina tras primera ejecucion
```

---

## Uso Tipico

```javascript
import { Game } from './core/Game.js'
import { GameState } from './core/GameState.js'
import { Campaign } from './core/Campaign.js'

const state = new GameState()
const campaign = new Campaign()
const game = new Game({ state, campaign, /* ... */ })

game.start()
// ...
game.onPlayerDamage(5, enemyPosition)
```