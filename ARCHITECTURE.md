# Arquitectura

El juego esta dividido en modulos ES. Cada archivo tiene una sola
responsabilidad y `src/main.js` solo instancia y conecta (composition root).

```
src/
  main.js                    composition root: instancia y cablea
  config.js                  constantes y tunables
  contracts.js               contratos JSDoc compartidos
  core/     EventEmitter, GameState, Game
  engine/   Arena, SpaceSkybox, createRenderer
  input/    InputController, KeyboardInput, MouseInput
  player/   Player
  weapons/  WeaponCatalog, WeaponFactory, ViewModel, WeaponSystem
            attacks/ HitscanAttack, MeleeAttack
  enemies/  Mob, MobFactory, MobSystem
  fx/       EffectsSystem
  ui/       Hud
```

## 1. Como se aplica SOLID

| Principio | Donde se ve |
| --- | --- |
| SRP | `Hud` solo DOM, `Mob` solo vida e IA, `MobSystem` solo ciclo de vida, `Game` solo orden de actualizacion |
| OCP | nuevo modo de disparo = nueva clase en `weapons/attacks`; `WeaponSystem` no cambia |
| LSP | `Mob` cumple el contrato `Target`; el jefe es la misma clase con otra variante (`MOB_VARIANTS.boss`), sin subclases |
| ISP | `InputController` expone `movement`, `firing` y eventos; cada consumidor toma solo lo que usa |
| DIP | `Game` recibe subsistemas por constructor; los ataques reciben un `AttackContext`, no clases concretas |

## 2. Vista de clases

```mermaid
classDiagram
    direction TB

    class Game {
        +update(delta)
        +start()
        +restart()
        +endGame(won)
        +onPlayerDamage(amount)
    }

    class GameState {
        +string status
        +number hp
        +number elapsed
        +boolean isPlaying
        +boolean isFinished
        +number secondsLeft
        +start()
        +pause()
        +finish(won)
        +damage(amount)
        +reset()
    }

    class Arena {
        +Scene scene
        +addLights()
        +addGround()
        +addWalls()
    }

    class SpaceSkybox {
        +Group group
        +update(delta, elapsed)
    }

    class Player {
        +PerspectiveCamera camera
        +number bobPhase
        +Vector3 origin
        +reset()
        +update(delta, axis)
        +forward()
        +lock()
        +unlock()
    }

    class WeaponSystem {
        +string currentKey
        +WeaponDef current
        +select(key)
        +cycle(direction)
        +tryFire()
        +update(delta)
        +setTargets(targets)
    }

    class WeaponDef {
        <<datos>>
        +string label
        +number damage
        +number fireRate
        +boolean automatic
        +number range
        +string attack
        +Vector3 muzzle
        +number flashScale
        +number recoilPush
        +number swingPush
    }

    class AttackStrategy {
        <<interface>>
        +string id
        +execute(context, weapon)
    }

    class HitscanAttack {
        +string id
        +execute(context, weapon)
    }

    class MeleeAttack {
        +string id
        +execute(context, weapon)
    }

    class ViewModel {
        +Group holder
        +onSwitch(key)
        +onShot(weapon)
        +muzzleWorldPosition()
        +update(delta, bobPhase, elapsed)
    }

    class Mob {
        +Object3D group
        +MobVariant variant
        +number hp
        +boolean isAlive
        +takeDamage(amount)
        +kill()
        +reset(position)
        +updateDead(delta)
        +update(delta, context)
    }

    class MobFactory {
        <<module>>
        +createMobModel(variant) : MobModel
        +registerEntity(group, entity)
    }

    class MobModel {
        <<value>>
        +Object3D group
        +Object parts
        +Material[] materials
        +animate(delta, state)
    }

    class MobSystem {
        +Mob[] targets
        +boolean bossSpawned
        +update(delta, context)
        +spawnBoss(playerPosition)
        +resetAll(playerPosition)
        +randomSpawnPosition(playerPosition, minDistance)
    }

    class EffectsSystem {
        +spawnBurst(position, count, speed, hex)
        +spawnTracer(from, to)
        +update(delta)
    }

    class Hud {
        +render(snapshot)
        +announce(text, seconds)
        +updateAnnounce(delta)
        +flashDamage()
        +setCrosshair(active)
        +showGameOver(won)
        +hideGameOver()
        +onRestart(handler)
    }

    class InputController {
        +MovementAxis movement
        +boolean firing
        +on(event, handler)
    }

    class KeyboardInput
    class MouseInput
    class EventEmitter

    Game *-- GameState : consulta
    Game o-- Player : mueve
    Game o-- WeaponSystem : actualiza
    Game o-- MobSystem : actualiza
    MobSystem *-- Mob : crea y reubica
    Mob ..> MobFactory : pide modelo y animacion
    Game o-- EffectsSystem : actualiza
    Game o-- SpaceSkybox : anima
    Game o-- Hud : dibuja
    Game --> InputController : consulta
    Arena *-- Player : aloja camera
    WeaponSystem o-- HitscanAttack : estrategia
    WeaponSystem o-- MeleeAttack : estrategia
    WeaponSystem --> ViewModel : feedback
    WeaponSystem ..> Mob : apunta a objetivos
    WeaponSystem ..> EffectsSystem : pide efectos
    HitscanAttack ..> Mob : takeDamage
    InputController *-- KeyboardInput
    InputController *-- MouseInput
    KeyboardInput ..> EventEmitter
    MouseInput ..> EventEmitter
```

## 3. Maquina de estados de la partida

```mermaid
stateDiagram-v2
    [*] --> menu : carga inicial
    menu --> playing : click en canvas / PointerLock lock
    playing --> paused : unlock / Esc
    paused --> playing : click / lock
    playing --> dead : playerHp 0
    playing --> won : gameTime 60 s
    dead --> playing : restart()
    won --> playing : restart()
    playing --> playing : t 40 s dispara spawnBoss()
```

## 4. Secuencia: disparo con arma de fuego

```mermaid
sequenceDiagram
    actor User as Jugador
    participant DOM as Canvas
    participant GC as Game animate
    participant WS as WeaponSystem
    participant HS as HitscanAttack
    participant MS as MobSystem
    participant FX as EffectsSystem

    User->>DOM: mousedown(0)
    DOM->>WS: tryFire
    WS->>WS: valida fireRate con clock
    WS->>WS: viewModel.onShot destello y retroceso
    WS->>HS: execute(context, weapon)
    HS->>MS: raycast intersectObjects groups
    MS-->>HS: hit con object.userData.entity
    HS->>MS: takeDamage(damage)
    alt mob muere
        MS->>MS: kill y respawnTimer 3 s
    end
    HS->>FX: spawnBurst punto de impacto
    HS->>FX: spawnTracer boca hasta impacto
    GC->>FX: updateParticles(delta)
    GC->>GC: renderer.render
```

## 5. Secuencia: ciclo de `Game.update()`

```mermaid
sequenceDiagram
    participant RAF as setAnimationLoop
    participant GC as Game
    participant P as Player
    participant MS as MobSystem
    participant WS as WeaponSystem
    participant H as Hud

    RAF->>GC: frame delta
    alt estado playing
        GC->>P: update(delta, input.movement)
        GC->>MS: update(delta, targetPosition)
        MS->>GC: onPlayerDamage si toca
        GC->>H: flashDamage y render
        GC->>MS: spawnBoss si t 40
        GC->>WS: update(delta)
        WS->>WS: tryFire si automatic y firing
    end
    GC->>H: render snapshot
    GC->>RAF: renderer.render
```

## 6. Dependencias

```mermaid
graph LR
    VITE["Vite 8"] --> MAIN["src/main.js"]
    MAIN --> THREE["three 0.185.1"]
    MAIN --> PLC["PointerLockControls addon"]
    MAIN --> CSS["src/style.css"]
    HTML["index.html"] --> HUDDOM["#hud #crosshair #announce<br/>#damage-flash #gameover"]
    MAIN --> HUDDOM
    MAIN --> CFG["config.js"]
    MAIN --> GAME["core/Game.js"]
    GAME --> PLAYER["player/Player.js"]
    GAME --> WEAPONS["weapons/WeaponSystem.js"]
    GAME --> MOBS["enemies/MobSystem.js"]
    GAME --> FX["fx/EffectsSystem.js"]
    GAME --> HUD["ui/Hud.js"]
    GAME --> STATE["core/GameState.js"]
    WEAPONS --> ATTACKS["weapons/attacks/*"]
```

## Enemigos

`MobFactory` construye el modelo procedural a partir de la variante y devuelve
`{ group, parts, materials, animate }`. Cada enemigo recibe materiales propios:
compartirlos hacia que el destello de impacto de uno se viera en todos.

- Los modelos miran hacia `-Z`, por eso `Mob` calcula el yaw a mano
  (`Math.atan2(-x, -z)`) en lugar de usar `lookAt`, que apunta a `+Z`.
- `animate(delta, state)` solo mueve las piezas; la IA sigue en `Mob`, que le
  pasa `moving` y `attacking`. Las animaciones parten de una pose base, asi que
  un enemigo que se detiene vuelve a la postura.
- El brillo de los ojos se guarda al crear el enemigo y se restaura tras el
  destello y al reaparecer, de modo que no se pierde ni queda en negro.
- Las variantes normales (`soldier`, `alien`, `tank`) se reparten por turno
  entre los `MOB.count` enemigos; el jefe es siempre `boss`.

### Proporciones

Las medidas estan en metros y son deliberadas, porque un enemigo mas alto que
la camara (1.7) tapa la escena en vez de amenazar:

| modelo | alto | ancho | lectura |
| --- | --- | --- | --- |
| `soldier` | 1.78 | 0.67 | humano, el tamano de referencia |
| `alien` | 1.94 | 0.66 | el mas alto de los gruntos, delgado |
| `tank` | 1.42 | 1.23 | bajo y ancho, perfil de vehiculo |
| `boss` | 2.82 | 1.35 | imponente, por debajo de los muros (3) |

- Nada de `BoxGeometry` pelado: las placas son `RoundedBoxGeometry` para que las
  aristas cojan luz, y las extremidades son capsulas con hombro y codo.
- Las extremidades cuelgan de un grupo pivote en la cadera o el hombro, asi que
  giran desde la articulacion en vez de deslizarse desde su centro.
- El tanque es intencionadamente bajo: hay que apuntar hacia abajo para
  acertarle, y esa es su diferencia de silueta con los demas.

## Deuda tecnica

- `MobSystem.randomSpawnPosition` se prueba por parametro, pero sigue siendo
  publico: se podria dejar privado y exponer solo `resetAll`.
- El contrato de las armas es un objeto plano (`view`) con cuatro miembros en
  lugar de una clase. Es suficiente, pero no hay comprobacion de tipos.
- `main.js` conoce el orden de actualizacion a traves de `Game`, no de los
  modulos: correcto, pero sigue habiendo un unico punto que hay que leer.
- Sin sombras: el render no activa `shadowMap`, asi que `castShadow` no tiene
  efecto. Las siluetas se leen por contraste de materiales.
- `MeleeAttack` mide el cono contra el origen del enemigo (sus pies), no contra
  su centro de masa. Con un enemigo alto como el jefe hay que apuntar mas bajo
  de lo natural para acertar con el cuchillo.
- Sin pruebas en el repositorio: la verificacion se hizo con un script temporal
  de humo sobre `GameState`, `Mob`, `MobSystem`, `WeaponSystem` y los ataques.
