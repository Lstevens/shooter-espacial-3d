# Extender el Juego

La arquitectura esta disenada para anadir contenido sin tocar el nucleo (OCP).

## Anadir Arma Nueva

### 1. Datos en `src/weapons/WeaponCatalog.js`

```javascript
export const WEAPON_CATALOG = {
  // ... existentes
  plasma: {
    label: 'Plasma Rifle',
    damage: 18,
    fireRate: 0.15,
    automatic: true,
    range: 50,
    attack: 'hitscan',
    muzzle: new THREE.Vector3(0.15, -0.1, -0.8),
    flashScale: 1.2,
    recoilPush: 0.8,
    swingPush: 0.3,
    magazine: 30,
    reserve: 90,
    maxReserve: 180,
    reloadTime: 2.0
  }
}
```

### 2. (Opcional) Nueva Estrategia de Ataque

Si necesitas comportamiento distinto (proyectil con fisica):

```javascript
// src/weapons/attacks/ProjectileAttack.js
export class ProjectileAttack {
  id = 'projectile'
  execute(context, weapon) {
    // Spawnea mesh con velocidad, gravedad, colision
  }
}
```

Registrala en `main.js`:
```javascript
import { ProjectileAttack } from './weapons/attacks/ProjectileAttack.js'
const weapons = new WeaponSystem({
  attacks: [new HitscanAttack(), new MeleeAttack(), new ProjectileAttack()]
})
```

### 3. Slot de Teclado (si >3 armas)

```javascript
// src/input/KeyboardInput.js - anade tecla '4'
```

## Anadir Variante de Enemigo

### 1. Datos en `src/config.js`

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

### 2. Modelo en `src/enemies/MobFactory.js`

```javascript
function createSniperModel() {
  const group = new THREE.Group()
  // ... geometrias, materiales
  return { group, parts: { body, head, gun }, materials: [...] }
}

MobFactory.registerModel('sniper', createSniperModel)
```

### 3. Usar en Campaña

En `config.js` `CAMPAIGN.stages`, mezcla variantes en `mobCount` o crea etapa dedicada.

## Anadir Camara (Etapa)

En `src/config.js` `CAMPAIGN.stages`:

```javascript
{
  id: 6,
  label: 'Nucleo',
  difficulty: 'Amenaza extrema',
  theme: 'core',              // nuevo tema en scenes/props.js
  mobCount: 10,
  escortCount: 4,
  speedScale: 1.5,
  damageScale: 1.8,
  bossHp: 300,
  bossDamage: 12,
  bossSpeed: 4.0,
  palette: {
    background: 0x050510,
    groundColor: 0x1a1a2e,
    gridMain: 0xff3333,
    gridLines: 0x440000,
    wallColor: 0x330000,
    skyColor: 0xff6666,
    sunColor: 0xff3333
  }
}
```

### Tema Visual en `src/scenes/props.js`

```javascript
export const PROP_THEMES = {
  // ... existentes
  core: {
    // array de funciones que crean props
    // usan inExitLane(x, z) para no bloquear la puerta
  }
}
```

## Anadir Tipo de Pickup

### 1. Datos en `src/config.js`

```javascript
export const GAME = {
  // ...
  pickupHeal: 8,
  pickupAmmo: 24,
  pickupShield: 1      // nuevo
}
```

### 2. Logica en `src/pickups/PickupSystem.js`

```javascript
// En update(): al colisionar
if (kind === 'shield') {
  const added = this.#player.addShield(GAME.pickupShield)
  if (added > 0) message = `Escudo +${added}`
}
```

### 3. Modelo Visual en `src/pickups/PickupFactory.js`

```javascript
function createShieldPickup() {
  const geometry = new THREE.OctahedronGeometry(0.4)
  const material = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x004444 })
  return new THREE.Mesh(geometry, material)
}
```

## Verificacion

```bash
npm run dev      # Prueba manual
npm run build    # Compilacion OK
npm test         # Tests pasan
```

## Checklist de Calidad

- [ ] Datos en `config.js` (fuente unica de verdad)
- [ ] Modelo visual en factory correspondiente
- [ ] Sin modificar `Game.js`, `WeaponSystem.js`, `MobSystem.js` (OCP)
- [ ] `npm run build` sin errores
- [ ] `npm test` pasa
- [ ] Documentado en `docs/reference/api/` (auto-generado)