# Estado de UI, audio y pickups

Integrado en `main` (merges `f31394a` y `57bf9cc`). Verificacion despues del
cableado de audio: `npm test` (26/26) y `npm run build` en verde. El codigo vive
en `src/ui/`, `src/audio/` y `src/pickups/`; los contratos estan en
`src/contracts.js`.

## Entregado

| Archivo | Que hace |
| --- | --- |
| `src/ui/Hud.js` | Render diferido (solo escribe lo que cambio), contador de municion con barra de recarga, barra del jefe, `showPause`/`hidePause`/`onResume`, `damageFrom(angleRad)` |
| `index.html` | Elementos nuevos: `#weapon-ammo` (`#ammo-count`, `#reload-track`, `#reload-fill`), `#damage-indicator`, `#boss-bar` (`#boss-name`, `#boss-track`, `#boss-fill`), `#pause` (`#pause-resume`, `#pause-restart`, `#pause-restart-first`) |
| `src/style.css` | Estilos de los elementos anteriores, con la estetica existente |
| `src/audio/AudioSystem.js` | `AudioContract` completo, WebAudio procedural (sin archivos), contexto perezoso, `contextFactory` inyectable, mute con `setMuted`/`toggleMute` |
| `src/pickups/PickupSystem.js` | `PickupSystemContract` completo: drops de vida/municion procedurales, recogida por radio, lifetime, `clear`/`dispose`. Codigo presente y testeado, aun sin cablear |
| `test/ui/hud.test.js` | Render diferido, snapshot v0, municion, pausa, indicador |
| `test/audio/audio-system.test.js` | Pereza del contexto, mute, no-op sin soporte |
| `test/audio/game-audio-wiring.test.js` | Cableado de eventos del juego (disparo, dano, muerte, victoria, jefe) |
| `test/pickups/pickup-system.test.js` | Contrato, recogida, lifetime, clear/dispose |

## Cableado de audio (en `src/main.js`)

- `main.js` instancia `AudioSystem` y lo inyecta en `Game` y `WeaponSystem`.
- El contexto se reanuda durante el click de PointerLock y al reanudar/reiniciar.
- Disparos, dano no letal, muerte, victoria y derrota del jefe disparan sus efectos.
- La tecla `M` alterna silencio y el HUD anuncia el estado.
- Recarga y recogida aun no producen sonidos: el cableado de pickups esta
  pendiente (ver siguiente seccion).

## Pendiente

- Conectar `PickupSystem` en `src/main.js` y `src/core/Game.js`, igual que se
  hizo con el audio: drops al matar, aplicar vida/municion con
  `GameState.heal` y `WeaponSystem.addAmmo`, y sonido `pickup()`.
- `src/pickups/PickupSystem.js` y su test ya estan listos; solo falta el
  cableado y los constantes de balance en `src/config.js`.

## Pruebas y limite de verificacion

`test/audio/audio-system.test.js` verifica la sintesis con un `AudioContext`
falso; `test/audio/game-audio-wiring.test.js` cubre el cableado de eventos del
juego. La reproduccion fisica debe confirmarse en un navegador con salida de
audio.

## Tolerancia (contratos v1)

- `Hud.render` lee `snapshot.weaponAmmo?.hasAmmo ?? false` y
  `snapshot.boss ?? null`: funciona con snapshots v0 sin esos campos.
- Si `weaponAmmo.hasAmmo === false` (cuchillo) el contador queda oculto.
- `AudioSystem` y `PickupSystem` no importan nada de `src/core`, `src/enemies`
  ni `src/weapons`.

## Checklist

- [x] Pausa con Esc: overlay, reanudar y reiniciar (metodos listos; el cableado
  de Esc/lock esta en `src/main.js`).
- [x] Municion visible en pistola/AK; cuchillo sin municion.
- [x] Recarga con `R` visible (barra); la logica esta en `WeaponSystem`.
- [x] El HUD no reescribe el DOM si el texto no cambio (test incluido).
- [x] Audio: disparo, dano, muerte, victoria, jefe con `WebAudio` procedural.
- [x] Mute con `M` desde el teclado (anunciado en el HUD).
- [x] Indicador direccional de dano.
- [x] `npm test` y `npm run build` en verde.
- [ ] Cableado de `PickupSystem` en `src/main.js` / `src/core/Game.js`.
