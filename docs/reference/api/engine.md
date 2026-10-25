# API Engine

Modulos en `src/engine/`.

## Arena

Escenario cerrado: escena, niebla, luces, suelo, techo, muros, rejilla, estructura fija y decorado por tema.

### Constructor

```javascript
new Arena()
// Crea escena completa con paleta por defecto (ARENA)
```

### Propiedades (Getters)

| Propiedad | Tipo | Descripcion |
|-----------|------|-------------|
| `scene` | THREE.Scene | Escena Three.js completa |
| `colliders` | THREE.Box3[] | Cajas estaticas: estructura fija + decorado actual |
| `sparkPoints` | THREE.Vector3[] | Puntos calientes para chispas (del decorado actual) |

### Metodos Publicos

| Metodo | Descripcion |
|--------|-------------|
| `setStage(stage)` | Aplica paleta, desmonta decorado anterior, monta nuevo tema |
| `update(delta)` | Actualiza decorado animado (ej. pecio en hangar) |
| `applyPalette(palette)` | Repinta entorno (cielo, niebla, luces, suelo, muros, rejilla) |

### Estructura Interna

- **Suelo/Techo**: PlaneGeometry con texturas procedurales
- **Muros**: 4 planos (DoubleSide) con textura
- **Estructura fija**: Paneles pared, vigas suelo-techo (con colliders)
- **Tuberias**: Decorativas, altura > cabeza (sin colliders)
- **Decorados (Props)**: Via `createProps(theme, { scene })` desde `scenes/props.js`

### Paleta (Palette)

```javascript
{
  background: 0x...,   // cielo, niebla, background
  groundColor: 0x...,  // suelo
  gridMain: 0x...,     // lineas principales rejilla
  gridLines: 0x...,    // lineas menores rejilla
  wallColor: 0x...,    // muros, techo
  skyColor: 0x...,     // HemisphereLight sky
  sunColor: 0x...      // DirectionalLight sun
}
```

### Temas (Themes)

Definidos en `src/scenes/props.js`:

| Tema | Camara | Descripcion |
|------|--------|-------------|
| `hangar` | 1 | Pecio central, contenedores, grúa |
| `depot` | 2 | Estanterias, cajas, palets |
| `reactor` | 3 | Nucleo central, tubos, consolas |
| `crucible` | 4 | Hornos, cadenas, metal fundido |
| `core` | 5 | Nucleo final, geometria alienigena |

---

## CollisionWorld

Colisiones sin motor de fisicas: cajas estaticas (escenario) + circulos dinamicos (entidades vivas). Trabaja en 2D (X, Z) con prueba vertical.

### Constructor

```javascript
new CollisionWorld({ half = ARENA.half } = {})
```

### Metodos

| Metodo | Descripcion |
|--------|-------------|
| `setStatics(Box3[])` | Cajas estaticas (arena.colliders) |
| `setDynamic({x, z, radius}[])` | Circulos dinamicos (mobs vivos) |
| `isBlocked(position, radius, bodyHeight): boolean` | Consulta sin mover: true si cuerpo no cabe (limite arena o prop a altura cuerpo) |
| `resolveEnvironment(position, radius, bodyHeight): Vector3` | Corrige posicion contra limites arena + props estaticos (modifica in situ) |
| `resolveActors(position, radius): Vector3` | Corrige contra enemigos vivos (empuje mutuo, modifica in situ) |

### Logica de Altura (`bodyHeight`)

```javascript
const STEP_HEIGHT = 0.35  // Altura maxima escalon

// Una caja bloquea SOLO si:
// box.max.y > STEP_HEIGHT  (no es escalon)
// AND box.min.y < bodyHeight (corta la altura del cuerpo)

// Asi:
// - Tuberias/techo (y > 2.5) -> no bloquean
// - Paneles/vigas/chatarra (y <= 2.5) -> bloquean
```

### Resolucion

1. **Limites arena**: Clamp a `[-half + radius, half - radius]`
2. **Estaticos**: Para cada caja que bloquea, empuja fuera (normal mas cercana)
3. **Dinamicos**: Empuje mutuo entre circulos solapados (distancia minima = r1 + r2)

### Uso en Jugador

```javascript
// En Player.update:
collision.resolveEnvironment(position, PLAYER.radius, PLAYER.height)
// Luego:
collision.resolveActors(position, PLAYER.radius)
```

### Uso en Enemigos (IA)

```javascript
// En Mob.#chooseDirection -> #isAheadBlocked:
collision.isBlocked(probePosition, probeRadius, bodyHeight)
// Sondea varios puntos adelante antes de moverse
```

---

## createRenderer (`src/engine/createRenderer.js`)

Factory de renderer Three.js con postproceso basico.

```javascript
import { createRenderer } from './engine/createRenderer.js'

const renderer = createRenderer(document.body)
// Retorna: THREE.WebGLRenderer configurado
// - antialias, alpha, toneMapping, outputColorSpace
// - setSize(window.innerWidth, window.innerHeight)
// - appendChild a document.body
```

---

## SpaceSkybox (`src/engine/SpaceSkybox.js`)

Cielo procedural: estrellas + planetas con animacion.

### Constructor

```javascript
new SpaceSkybox({ scene: arena.scene })
// Añade Group con estrellas y planetas a la escena
```

### Metodos

| Metodo | Descripcion |
|--------|-------------|
| `update(delta, elapsed)` | Animacion: twinkle estrellas, drift rotacion, rotacion planetas |

### Configuracion (config.js `SKY`)

```javascript
{
  starRadius: 160,      // < PLAYER.far (200), > ARENA.fogFar (80)
  starCount: 1400,
  starSize: 1.2,
  twinkleSpeed: 2.5,
  starDrift: 0.004,
  colors: [...],
  planets: [
    { direction, distance, radius, color, ring }
  ]
}
```

---

## textures (`src/engine/textures.js`)

Generacion procedural de texturas via Canvas 2D.

```javascript
import { getFloorTexture, getWallTexture, getMetalTexture } from './engine/textures.js'

getFloorTexture(scale)      // Patron rejilla + ruido
getWallTexture(tilesX, tilesY)  // Ladrillo/panel
getMetalTexture(variant)    // Placa metalica con tornillos
```

> Sin assets externos, todo generado en codigo.

---

## Uso Tipico

```javascript
import { Arena } from './engine/Arena.js'
import { CollisionWorld } from './engine/CollisionWorld.js'
import { createRenderer } from './engine/createRenderer.js'
import { SpaceSkybox } from './engine/SpaceSkybox.js'

const arena = new Arena()
const skybox = new SpaceSkybox({ scene: arena.scene })
const renderer = createRenderer(document.body)
const collision = new CollisionWorld()

// En Game.start / #loadStage:
arena.setStage(campaign.stage)
collision.setStatics(arena.colliders)
effects.setSparkEmitters(arena.sparkPoints)

// En Game.update:
arena.update(delta)
skybox.update(delta, clock.elapsedTime)
collision.setDynamic(mobs.circles)  // via MobSystem.#publishColliders
```