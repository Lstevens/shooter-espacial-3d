# Convenciones de integracion

`main` es la rama publicada y verificada. El trabajo de UI y audio de fases 0-2c
ya esta integrado (merges `f31394a` y `57bf9cc`), incluido el HUD v2 y los
contratos descritos en `src/contracts.js`. Las ramas `agent/core` y `agent/ui`
quedan como historial del desarrollo inicial y no reciben trabajo nuevo.

## Ramas

- `main`: rama estable; todo cambio entra mediante una rama corta y revision.
- `feature/*` o `fix/*`: una rama por cambio, pequena y facil de revertir.
- No se trabaja directamente en `main`.

## Verificacion antes de integrar

```bash
npm ci
npm test
npm run build
```

Si el cambio toca `docs/`, anade:

```bash
npm run docs:build
```

- [ ] `npm test` en verde.
- [ ] `npm run build` en verde.
- [ ] Si el cambio es visual o de input, se probo en el navegador.
- [ ] No se editaron `dist/` ni `docs/.vitepress/dist|cache/`.

## Contratos implementados (v1)

Los tipos completos viven en `src/contracts.js`. Esta es la parte ejecutable:

```js
// Snapshot que recibe Hud.render(snapshot)
{
  hp, maxHp, elapsed,
  weaponLabel,
  weaponAmmo: { hasAmmo, magazine, capacity, reserve, reloading, reloadProgress },
  boss: { hp, maxHp } | null,
  stageIndex, stageTotal, stageLabel, difficulty,
}

// Hud
render(snapshot)
showPause()
hidePause()
damageFrom(angleRad) // 0 = frente, +PI/2 = derecha
flashDamage()
damageNumber(amount)
setCrosshair(active)

// AudioSystem
resume()
setMuted(muted)
toggleMute() -> boolean
shot(weaponId), reload(), empty(), hurt(), death(), win(), bossDown(), pickup()

// PickupSystem
spawn(kind, position)          // kind: 'health' | 'ammo'
update(delta, playerPosition, { onPickup })
clear()
dispose()

// Core
GameState.heal(amount)
WeaponSystem.ammoState
WeaponSystem.reload()
WeaponSystem.addAmmo(amount)
Mob.onKilled(mob)
Mob.aimPoint
Mob.maxHp
MobSystem.onMobKilled = (mob) => {}
MobSystem.boss
Game.onPlayerDamage(amount, sourcePosition)
INPUT_EVENTS.reloadPress
```

Reglas de compatibilidad:

- `Hud.render` tolera snapshots v0 con valores por defecto:
  `snapshot.weaponAmmo?.hasAmmo ?? false` y `snapshot.boss ?? null`.
- `AudioSystem` y `PickupSystem` no importan nada de `src/core`, `src/enemies`
  ni `src/weapons`.

## Pendiente conocido

- `src/pickups/PickupSystem.js` y sus tests estan en `main`, pero todavia no
  estan cableados: ni `src/main.js` ni `src/core/Game.js` los referencian. El
  siguiente paso es conectarlo (drops al matar, aplicar vida/municion y sonido
  de recogida), igual que se hizo con el audio.

## Checklist manual

- [ ] Pausa con `Esc`: overlay, reanudar y reiniciar.
- [ ] Municion visible en pistola/AK; cuchillo sin municion.
- [ ] Recarga con `R`; no recarga con cargador lleno ni sin reserva.
- [ ] El HUD no reescribe el DOM si el texto no cambio.
- [ ] Audio: disparo, dano, muerte, victoria, jefe, mute con `M`.
- [ ] Indicador direccional de dano.
- [ ] Al cruzar la puerta se restaura la vida completa.
- [ ] `npm test` y `npm run build` en verde.
