# Coordinacion de agentes

Este documento es la fuente de verdad para el trabajo en paralelo. Lo mantiene
el agente de core/integracion (opencode). El agente de UI/audio/pickups
(freebuff) lo lee, pero no lo edita.

## Ramas y carpetas

| Agente | Rama | Carpeta | Rol |
| --- | --- | --- | --- |
| opencode | `agent/core` | repo principal | core, gameplay, tests, integracion |
| freebuff | `agent/ui` | `..\shoter-3d-ui` | UI, audio, pickups, tests de UI |

Nadie trabaja en la rama del otro. La integracion se hace en
`integration/fases-0-2c` y la ejecuta opencode.

## Propiedad de archivos

### opencode (A)

- `src/core/**`, `src/enemies/**`, `src/engine/**`, `src/weapons/**`,
  `src/input/**`, `src/fx/**`, `src/player/**`.
- `src/main.js`, `src/config.js`, `src/contracts.js`, `package.json`.
- `README.md`, `ARCHITECTURE.md`, `docs/**`.
- `test/core/**`, `test/engine/**`, `test/enemies/**`, `test/weapons/**`.

### freebuff (B)

- `index.html`, `src/style.css`.
- `src/ui/**`, `src/audio/**`, `src/pickups/**`.
- `test/ui/**`, `test/audio/**`, `test/pickups/**`.
- Puede crear `docs/status-ui.md` para reportar avances. No edita este archivo.

### Prohibido para B

`src/main.js`, `src/core/**`, `src/config.js`, `src/enemies/**`,
`src/weapons/**`, `src/input/**`, `src/fx/**`, `package.json`,
`README.md`, `ARCHITECTURE.md`, `docs/coordination.md`, lockfiles.

Si B necesita un cambio en un archivo de A, lo pide en el mensaje final o en
`docs/status-ui.md`. A lo aplica en integracion.

## Contratos congelados v1

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

- B debe tolerar campos ausentes con valores por defecto:
  `snapshot.weaponAmmo?.hasAmmo ?? false`, `snapshot.boss ?? null`.
- A llamara a los metodos nuevos del HUD con `?.` hasta que B este integrado.
- A no importa `src/audio/**` ni `src/pickups/**` antes de la integracion.

## Flujo de trabajo

1. Cada agente hace commits pequenos en su rama.
2. Antes de cada commit: `npm test` y `npm run build`.
3. Nunca `git add -A`, `git add .`, `git commit -a`, amend ni force-push.
4. No formatear archivos ajenos ni todo el repo.
5. Usar solo npm. No tocar `pnpm-lock.yaml`.
6. No agregar dependencias sin coordinarlo.
7. Si aparece un conflicto, se resuelve en `integration/fases-0-2c`.

## Integracion (solo A)

```powershell
git switch -c integration/fases-0-2c main
git merge --no-ff agent/ui
git merge --no-ff agent/core
npm ci
npm test
npm run build
```

Antes del merge, A revisa:

```powershell
git diff --name-only main...agent/ui
```

Si B toco un archivo prohibido, se corrige en `agent/ui` antes de integrar.

## Checklist manual de integracion

- [ ] Pausa con `Esc`: overlay, reanudar y reiniciar.
- [ ] Municion visible en pistola/AK; cuchillo sin municion.
- [ ] Recarga con `R`; no recarga con cargador lleno ni sin reserva.
- [ ] El HUD no reescribe el DOM si el texto no cambio.
- [ ] Audio: disparo, recarga, vacio, dano, muerte, victoria, jefe, pickup.
- [ ] Drops de vida y municion; recoger con el jugador.
- [ ] Indicador direccional de dano.
- [ ] Al cruzar la puerta se restaura la vida completa.
- [ ] Cadáveres invisibles no bloquean disparos.
- [ ] El cuchillo acierta a bocajarro.
- [ ] `npm test` y `npm run build` en verde.
