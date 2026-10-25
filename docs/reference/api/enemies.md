# API Enemies

Modulos en `src/enemies/`.

## MobSystem

Ciclo de vida de enemigos: aparicion, reaparicion, jefe, limpieza.

### Constructor

```javascript
new MobSystem({
  scene,              // THREE.Scene
  onPlayerDamage,     // (amount, sourcePosition) => void
  onMobKilled?,       // (mob) => void (opcional, para drops)
  collision?,         // CollisionWorld (opcional)
  random?             // () => number (default Math.random)
})
```

### Propiedades (Getters)

| Propiedad | Tipo | Descripcion |
|-----------|------|-------------|
| `targets` | Mob[] | Enemigos vivos (para WeaponSystem.setTargets) |
| `bossSpawned` | boolean | True si jefe ya aparecio |
| `boss` | Mob\|null | Jefe actual (vivo o muerto) |
| `bossDefeated` | boolean | True si jefe aparecio y fue eliminado |
| `kills` | number | Eliminaciones del jugador en etapa actual |
| `onMobKilled` | setter | Permite cablear handler despues de construir |

### Metodos Publicos

| Metodo | Descripcion |
|--------|-------------|
| `setStage(stage, playerPosition)` | Prepara arena para etapa: limpia todo, spawnea `stage.mobCount` normales |
| `spawnBoss(playerPosition)` | Spawnea jefe (una vez), reduce escolta a `stage.escortCount` |
| `update(delta, { targetPosition })` | Tick: IA, movimiento, ataque, separacion, colliders |

### Flujo de Etapa

```
setStage(stage, playerPos)
  -> #clearAll()
  -> for i in stage.mobCount:
       variant = normalVariants[i % normalVariants.length]  // reparto rotativo
       mob = #create(variant, level)
       mob.reset(randomSpawnPosition)
       #mobs.push(mob)

spawnBoss(playerPos)
  -> #bossSpawned = true
  -> #thinEscort()  // deja solo escortCount normales, resto a reserva
  -> boss = #create(stageBossVariant, level)
  -> boss.reset(randomSpawnPosition)
  -> #mobs.push(boss), #boss = boss

update(delta, context)
  -> if bossDefeated && !#bossCleared: #removeNormals(), #bossCleared = true
  -> for each mob:
       if dead: updateDead -> respawn en randomSpawnPosition
       else: mob.update(delta, context)  // IA, movimiento, ataque
  -> #separate()  // empuja solapados
  -> #publishColliders()  // para colision jugador
```

### Variante Jefe por Etapa (`#stageBossVariant`)

```javascript
{
  ...MOB_VARIANTS.boss,
  maxHp: stage.bossHp,
  damage: stage.bossDamage,
  speed: stage.bossSpeed
}
```

> El jefe usa valores absolutos de la etapa, no multiplicadores.

---

## Mob

Enemigo individual. Implementa contrato `Target`.

### Constructor

```javascript
new Mob({
  variant,       // MobVariant (ya escalada por MobSystem)
  maxHp,         // numero (variant.maxHp || MOB.maxHp)
  level,         // numero etapa (para factory)
  onKilled       // (mob) => void
})
```

### Propiedades (Getters)

| Propiedad | Tipo | Descripcion |
|-----------|------|-------------|
| `group` | THREE.Object3D | Raiz escena (para raycast, posicion) |
| `position` | THREE.Vector3 | `group.position` (alias) |
| `isAlive` | boolean | Vivo = true |
| `hp` | number | Vida actual |
| `maxHp` | number | Vida maxima |
| `variant` | MobVariant | Variante data-driven |
| `aimPoint` | THREE.Vector3 | Centro cuerpo (para melee), se recalcula al leer |

### Metodos Publicos

| Metodo | Descripcion |
|--------|-------------|
| `takeDamage(amount)` | Resta vida, flash hit, kill si <= 0, llama `onKilled` |
| `kill()` | Marca muerto, invisibilidad, timer respawn |
| `reset(position)` | Resetea vida, cooldown, flash, posicion, visibilidad |
| `updateDead(delta): boolean` | Decrementa timer respawn, retorna true si toca reaparecer |
| `update(delta, AiContext)` | IA: persecucion, esquiva, ataque melee |

### IA (`update`)

```
1. toTarget = targetPosition - position (plano XZ)
2. distance = toTarget.length()
3. moving = distance < aggroRange && distance > attackRange
4. if moving:
     direction = #chooseDirection(toTarget.normalize(), collision, bodyHeight)
     next = position + direction * speed * delta
     collision.resolveEnvironment(next, radius, bodyHeight)
     position = next
5. rotation.y = atan2(-direction.x, -direction.z)  // modelos miran -Z
6. model.animate(delta, { moving, attacking })
7. if distance <= attackRange && attackCooldown <= 0:
     attackCooldown = variant.attackCooldown
     attacking = true
     onHit(variant.damage, position)
```

### Esquiva Obstaculos (`#chooseDirection`)

- Prueba directo (offset 0)
- Si bloqueado, prueba giros `NAV_OFFSETS = [0.5, 1.0, 1.5, 2.0]` rad
- Lado preferido fijo por mob (`#turnSign`) para no oscilar
- Sondea `MOB.navSteps` puntos en linea `MOB.navLookahead` metros
- Si todo bloqueado, avanza directo y deja deslizar colision

### Respawn

- Normales: tras `MOB.respawnDelay` seg, reaparecen en `randomSpawnPosition`
- Jefe: una sola vez, no reaparece (marca fin de etapa)

---

## MobFactory (`src/enemies/MobFactory.js`)

Crea modelos visuales procedurales por variante.

```javascript
import { createMobModel, registerEntity, disposeModel } from './MobFactory.js'

// Modelo
const model = createMobModel(variant, level)
// retorna { group: THREE.Group, parts: { body, head, ... }, materials: [] }

// Registro para raycast -> entity
registerEntity(group, entity)

// Limpieza
disposeModel(group)  // dispose geometries, materials
```

### Variantes Soportadas

| Variante | Modelo | Descripcion |
|----------|--------|-------------|
| `soldier` | Humanoide basico | Estandar |
| `alien` | Forma organica | Rapido |
| `tank` | Pesado, blindado | Lento, resistente |
| `boss` | Grande, distintivo | Jefe de etapa |

> Anadir variante: entrada en `config.js` `MOB_VARIANTS` + funcion `create{X}Model` en `MobFactory.js` + registro.

---

## MobVariant (config.js)

```javascript
{
  label: 'soldier',      // ID
  model: 'soldier',      // clave factory
  scale: 1,              // escala geometria
  speed: 2.2,            // m/s
  damage: 2,             // por golpe
  attackRange: 1.7,      // metros
  attackCooldown: 1,     // segundos
  maxHp?: 20             // opcional, override MOB.maxHp
}
```

### Escalado por Etapa (en `MobSystem.#create`)

```javascript
const scaled = {
  ...variant,
  speed: variant.speed * stage.speedScale,
  damage: Math.round(variant.damage * stage.damageScale)
}
```

---

## Uso Tipico

```javascript
import { MobSystem } from './enemies/MobSystem.js'

const mobs = new MobSystem({
  scene: arena.scene,
  onPlayerDamage: (amount, pos) => game.onPlayerDamage(amount, pos),
  collision
})

// Arranque etapa
mobs.setStage(campaign.stage, player.position)

// En Game.update:
mobs.update(delta, { targetPosition: player.position })

// Armas
weapons.setTargets(mobs.targets)

// Jefe a los 40s (en Game.#updateTimer)
if (!mobs.bossSpawned && state.elapsed >= GAME.bossAt) {
  mobs.spawnBoss(player.position)
}

// Victoria
if (mobs.bossDefeated) { /* abrir puerta */ }
```