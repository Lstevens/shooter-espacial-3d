# Tutorial: Anadir Arma Nueva

El sistema usa Strategy Pattern — anadir arma = nueva entrada en catalogo + (opcional) nueva estrategia de ataque. `WeaponSystem` no se toca (OCP).

## 1. Datos en Catalogo (`src/weapons/WeaponCatalog.js`)

```javascript
export const WEAPON_CATALOG = {
  // ... existentes
  plasma: {
    label: 'Plasma Rifle',
    damage: 18,
    fireRate: 0.15,
    automatic: true,
    range: 50,
    attack: 'hitscan',      // o 'projectile' si creas ProjectileAttack
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

export const WEAPON_ORDER = ['pistol', 'ak', 'knife', 'plasma']
export const DEFAULT_WEAPON = 'pistol'
```

## 2. (Opcional) Nueva Estrategia de Ataque

Si necesitas comportamiento distinto (proyectil con fisica):

```javascript
// src/weapons/attacks/ProjectileAttack.js
export class ProjectileAttack {
  id = 'projectile'
  execute(context, weapon) {
    // context: { origin, direction, muzzle, targets, fx }
    // weapon: WeaponDef
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

## 3. Slot de Teclado (si >3 armas)

En `src/input/KeyboardInput.js` anade tecla `'4'` (o la que prefieras).

## 4. Modelo Visual (Opcional)

En `src/weapons/WeaponFactory.js` anade `createPlasmaModel()` y registralo.

## 5. Verificacion

```bash
npm run dev
# 1. Selecciona arma con '4' o rueda
# 2. Dispara - mira consola (logs de WeaponSystem)
# 3. Cambia arma, recarga, comprueba HUD
npm run build   # Compilacion OK
npm test        # Tests pasan
```

## Checklist

- [ ] Entrada en `WEAPON_CATALOG` con datos balanceados
- [ ] Clave en `WEAPON_ORDER`
- [ ] Estrategia existente (`hitscan`/`melee`) o nueva registrada en `main.js`
- [ ] Slot teclado/HUD si >3 armas
- [ ] `npm run build` sin errores
- [ ] `npm test` pasa