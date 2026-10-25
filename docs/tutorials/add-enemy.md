# Tutorial: Anadir Variante de Enemigo

Arquitectura data-driven: anadir variante = datos en config + modelo en factory. `Mob` y `MobSystem` no se tocan (OCP).

## 1. Datos en Config (`src/config.js`)

```javascript
export const MOB_VARIANTS = {
  // ... existentes
  sniper: {
    label: 'sniper',
    model: 'sniper',
    scale: 1,
    speed: 1.5,
    damage: 8,
    attackRange: 35,
    attackCooldown: 3,
  }
}
```

> **Campos**:
> - `label`: ID unico
> - `model`: clave en MobFactory
> - `scale`: escala geometria
> - `speed`: m/s base (se escala por `stage.speedScale`)
> - `damage`: por golpe (se escala por `stage.damageScale`)
> - `attackRange`: metros
> - `attackCooldown`: segundos
> - `maxHp` (opcional): override `MOB.maxHp`

## 2. Modelo en Factory (`src/enemies/MobFactory.js`)

```javascript
function createSniperModel() {
  const group = new THREE.Group()

  // Cuerpo
  const bodyGeo = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8)
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x444466, roughness: 0.6, metalness: 0.3 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 0.9
  group.add(body)

  // Cabeza
  const headGeo = new THREE.SphereGeometry(0.25, 8, 6)
  const headMat = new THREE.MeshStandardMaterial({ color: 0x555588, roughness: 0.5, metalness: 0.4, emissive: 0x001133 })
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.y = 1.8
  group.add(head)

  // Rifle (distintivo)
  const gunGeo = new THREE.BoxGeometry(0.08, 0.08, 1.2)
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.3, metalness: 0.8 })
  const gun = new THREE.Mesh(gunGeo, gunMat)
  gun.position.set(0.35, 1.5, -0.4)
  group.add(gun)

  return {
    group,
    parts: { body, head, gun },
    materials: [bodyMat, headMat, gunMat]
  }
}

// Registro
MobFactory.registerModel('sniper', createSniperModel)
```

## 3. Usar en Campaña

En `config.js` `CAMPAIGN.stages`, mezcla variantes en `mobCount` (reparto rotativo) o crea etapa dedicada.

```javascript
// Ejemplo: etapa con solo snipers (mobCount = 8)
{
  id: 6,
  label: 'Torres',
  difficulty: 'Francotiradores',
  theme: 'core',
  mobCount: 8,
  // ...
}
```

Como el reparto es `i % normalVariants.length`, con 1 variante salen todas del mismo tipo.

## 4. Verificacion

```bash
npm run dev
# 1. Inicia partida
# 2. Observa comportamiento: distancia de ataque, daño, velocidad
# 3. Comprueba HUD (barra vida jefe si es boss)
npm run build
npm test
```

## Checklist

- [ ] Entrada en `MOB_VARIANTS` con `model` coincidiendo factory
- [ ] Funcion `createXxxModel` en `MobFactory.js` + `registerModel`
- [ ] Modelo visible, materiales con emissive para hit flash
- [ ] `npm run build` sin errores
- [ ] `npm test` pasa