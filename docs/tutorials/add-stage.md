# Tutorial: Anadir Camara (Etapa)

Cada camara = entrada en `CAMPAIGN.stages` + tema visual en `scenes/props.js`.

## 1. Etapa en Config (`src/config.js`)

```javascript
export const CAMPAIGN = {
  stages: [
    // ... existentes (1-5)
    {
      id: 6,
      label: 'Nucleo Profundo',
      difficulty: 'Amenaza final',
      theme: 'deepcore',        // nuevo tema en props.js
      mobCount: 12,
      escortCount: 5,
      speedScale: 1.5,
      damageScale: 2.0,
      bossHp: 350,
      bossDamage: 12,
      bossSpeed: 4.5,
      palette: {
        background: 0x030014,
        groundColor: 0x1a1035,
        gridMain: 0xaa33ff,
        gridLines: 0x440088,
        wallColor: 0x330055,
        skyColor: 0xcc88ff,
        sunColor: 0xaa44ff
      }
    }
  ]
}
```

### Campos Requeridos

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | number | Secuencial (6, 7, ...) |
| `label` | string | Nombre mostrado en HUD |
| `difficulty` | string | Etiqueta amenaza |
| `theme` | string | Clave en `PROP_THEMES` |
| `mobCount` | number | Enemigos normales iniciales |
| `escortCount` | number | Normales que quedan con jefe |
| `speedScale` | number | Multiplicador velocidad normales |
| `damageScale` | number | Multiplicador dano normales |
| `bossHp` | number | Vida jefe (absoluta) |
| `bossDamage` | number | Dano por golpe jefe |
| `bossSpeed` | number | Velocidad jefe |
| `palette` | Palette | 7 colores (ver abajo) |

### Palette

```javascript
palette: {
  background: 0x...,   // cielo, niebla, background
  groundColor: 0x...,  // suelo
  gridMain: 0x...,     // lineas principales rejilla
  gridLines: 0x...,    // lineas menores rejilla
  wallColor: 0x...,    // muros, techo
  skyColor: 0x...,     // HemisphereLight sky
  sunColor: 0x...      // DirectionalLight sun
}
```

## 2. Tema Visual (`src/scenes/props.js`)

```javascript
export const PROP_THEMES = {
  // ... existentes
  deepcore: {
    create({ scene }) {
      const colliders = []
      const sparkPoints = []

      // Nucleo central flotante
      const core = createCore()
      scene.add(core.group)
      colliders.push(...core.colliders)
      sparkPoints.push(...core.sparkPoints)

      // Columnas perimetrales
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        const radius = 7
        const col = createColumn()
        col.group.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
        scene.add(col.group)
        colliders.push(...col.colliders)
      }

      return { colliders, sparkPoints, dispose: () => { core.dispose(); /* ... */ } }
    }
  }
}

// Helpers locales
function createCore() { /* ... */ }
function createColumn() { /* ... */ }
```

### Contrato Tema

```javascript
create({ scene }): {
  colliders: THREE.Box3[],
  sparkPoints: THREE.Vector3[],
  dispose: () => void
}
```

> **Importante**: Usa `inExitLane(x, z)` (import de `config.js`) para no montar props en la franja de la puerta.

## 3. Verificacion

```bash
npm run dev
# 1. Llega a camara 5, derrota jefe, cruza puerta
# 2. Debe cargar camara 6 con nueva paleta y decorado
# 3. Enemigos con stats escalados (speedScale, damageScale)
# 4. Jefe con bossHp/bossDamage/bossSpeed
npm run build
npm test
```

## Checklist

- [ ] Entrada en `CAMPAIGN.stages` con todos los campos
- [ ] Paleta coherente (contraste, legibilidad HUD)
- [ ] Tema en `PROP_THEMES` con `create({ scene })` retornando colliders + sparkPoints + dispose
- [ ] `inExitLane(x, z)` respetado en props
- [ ] `npm run build` sin errores
- [ ] `npm test` pasa