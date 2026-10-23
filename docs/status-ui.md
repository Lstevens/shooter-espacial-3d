# Estado UI / audio / pickups (agente B - freebuff)

Rama `agent/ui`. Ultima verificacion: `npm test` (20/20) y `npm run build` en verde.

## Entregado

| Archivo | Que hace |
| --- | --- |
| `src/ui/Hud.js` | Render diferido (solo escribe lo que cambio), contador de municion con barra de recarga, barra del jefe, `showPause`/`hidePause`/`onResume`, `damageFrom(angleRad)` |
| `index.html` | Elementos nuevos: `#weapon-ammo` (`#ammo-count`, `#reload-track`, `#reload-fill`), `#damage-indicator`, `#boss-bar` (`#boss-name`, `#boss-track`, `#boss-fill`), `#pause` (`#pause-resume`, `#pause-restart`, `#pause-restart-first`) |
| `src/style.css` | Estilos de los elementos anteriores, con la estetica existente |
| `src/audio/AudioSystem.js` | `AudioContract` completo, WebAudio procedural (sin archivos), contexto perezoso, `contextFactory` inyectable |
| `src/pickups/PickupSystem.js` | `PickupSystemContract` completo: drops de vida/municion procedurales, recogida por radio, lifetime, `clear`/`dispose` |
| `test/ui/hud.test.js` | Render diferido, snapshot v0, municion, pausa, indicador |
| `test/audio/audio-system.test.js` | Pereza del contexto, mute, no-op sin soporte |
| `test/pickups/pickup-system.test.js` | Contrato, recogida, lifetime, clear/dispose |

## Lo que A debe cablear en integracion

1. **`audio.resume()` en el primer gesto** (click que pide PointerLock). Sin
   llamarlo no suena nada: `AudioSystem` no crea contexto hasta `resume()`.
2. **Pausa**: en `player.on('unlock')` llamar `hud.showPause()` y en
   `player.on('lock')` `hud.hidePause()`. El overlay ya existe.
3. **`hud.onResume(() => player.lock())`** en `main.js`: el boton
   `#pause-resume` pide el PointerLock (el click es el gesto exigido).
4. **Silenciador**: tecla `M` en `KeyboardInput` -> evento nuevo ->
   `audio.toggleMute()` (el input es de A).
5. **Drops**: en `main.js` o `Game`, `mobs.onMobKilled = (mob) => { ... }`
   con probabilidad; `pickups.spawn('health'|'ammo', mob.position)` y
   `GAME.pickupHeal` / `GAME.pickupAmmo` para aplicarlos en `#applyPickup`
   (ya implementado en el lado A). El `update`/`clear` de pickups ya esta
   cableados en `Game`.
6. **Indicador direccional**: `Game.onPlayerDamage(amount, sourcePosition)`
   y `hud.damageFrom?.(angulo)` ya estan en el lado A; B solo expone el
   metodo (acepta el `?.` hasta integrar).
7. **Al ganar/morir**: `hud.hidePause()` junto a `hud.showGameOver(...)`.

## Tolerancia (contratos congelados v1)

- `Hud.render` lee `snapshot.weaponAmmo?.hasAmmo ?? false` y
  `snapshot.boss ?? null`: funciona con snapshots v0 sin esos campos.
- Si `weaponAmmo.hasAmmo === false` (cuchillo) el contador queda oculto.
- `AudioSystem` y `PickupSystem` no importan nada de `src/core`, `src/enemies`
  ni `src/weapons`.

## Checklist de coordinacion (lado B)

- [x] Pausa con Esc: overlay, reanar y reiniciar (metodos listos; el cableado
  de Esc/lock es de A, ver punto 2/3).
- [x] Municion visible en pistola/AK; cuchillo sin municion.
- [x] Recarga con `R` visible (barra); la logica es de A.
- [x] El HUD no reescribe el DOM si el texto no cambio (test incluido).
- [x] Audio: disparo, recarga, vacio, dano, muerte, victoria, jefe, pickup.
- [x] Drops de vida y municion; recoger con el jugador.
- [x] Indicador direccional de dano.
- [x] `npm test` y `npm run build` en verde.
- [ ] Los puntos que dependen del cableado de A (1-7 de arriba).
