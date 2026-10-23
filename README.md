# Shooter 3D (arena)

Prototipo de un shooter 3D en primera persona hecho con Three.js + Vite.
Sobrevive 60 segundos en una arena cerrada eliminando enemigos; a los 40 segundos aparece un jefe final.

## Requisitos

- Node.js 20.19+ o 22.12+ (versión recomendada por Vite).
- Un navegador moderno.

## Arranque

```bash
npm install
npm run dev
```

Abre la URL que muestre Vite. Haz clic en el escenario para tomar el control del ratón.

## Controles

- `WASD`: moverse
- Ratón: apuntar
- Clic izquierdo: disparar
- `1` / `2` / `3` o rueda del ratón: cambiar de arma (Pistola, AK, Cuchillo)
- `R`: recargar el arma actual
- `Espacio`: saltar
- `F5`: guardar el progreso de la campaña

## Verificación

```bash
npm test
npm run build
```

## Estructura

- Código: `src/` (el composition root es `main.js`; el orden de juego vive en `core/Game.js`)
- Assets estáticos: `public/assets/`
- Documentación del proyecto: `PROJECT.md`, `ARCHITECTURE.md` y `AGENTS.md`
- Coordinación de agentes: `docs/coordination.md`
