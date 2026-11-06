# Estado UI / audio / pickups (agente B - freebuff)

Rama `agent/ui`. Verificacion despues del cableado de audio: `npm test` (26/26) y `npm run build` en verde.

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

## Cableado de audio (completado en esta rama)

- `main.js` instancia `AudioSystem` y lo inyecta en `Game` y `WeaponSystem`.
- El contexto se reanuda durante el click de PointerLock y al reanudar/reiniciar.
- Disparos, daño no letal, muerte, victoria y derrota del jefe disparan sus efectos.
- La tecla `M` alterna silencio y el HUD anuncia el estado.
- Recarga y recogida aún no producen sonidos en esta rama porque las mecánicas
  de munición y pickups no están presentes aquí.

## Pruebas y límite de verificación

`test/audio/audio-system.test.js` verifica la síntesis con un `AudioContext` falso;
`test/audio/game-audio-wiring.test.js` cubre el cableado de eventos del juego.
La reproducción física debe confirmarse en un navegador con salida de audio.
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
