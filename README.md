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

## Verificación

```bash
npm run build
```

## Estructura

- Código: `src/` (`main.js` contiene toda la lógica del juego)
- Assets estáticos: `public/assets/`
- Documentación del proyecto: `PROJECT.md` y `AGENTS.md` (reglas para agentes de IA)
