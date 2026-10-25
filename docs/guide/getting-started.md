# Arranque Rapido

## Requisitos

- Node.js 20.19+ o 22.12+ (version recomendada por Vite)
- Navegador moderno con soporte WebGL2

## Instalacion

```bash
git clone https://github.com/tu-usuario/shooter-3d.git
cd shooter-3d
npm install
```

## Desarrollo

```bash
npm run dev
```

Abre la URL que muestre Vite (típicamente `http://localhost:5173`). Haz clic en el canvas para tomar el control del raton (PointerLock).

## Produccion

```bash
npm run build
npm run preview
```

El comando `build` genera un bundle optimizado en `dist/`. `preview` lo sirve localmente para verificacion.

## Verificacion

```bash
npm test        # Tests nativos (node --test)
npm run build   # Verifica compilacion sin errores
```

## Estructura del Proyecto

```
shooter-3d/
├── src/                    # Codigo fuente
│   ├── main.js             # Composition root
│   ├── config.js           # Constantes centralizadas
│   ├── contracts.js        # Tipos JSDoc compartidos
│   ├── core/               # Nucleo del juego
│   ├── engine/             # Motor grafico y fisica
│   ├── input/              # Sistema de entrada
│   ├── player/             # Jugador
│   ├── weapons/            # Sistema de armas
│   ├── enemies/            # Enemigos
│   ├── fx/                 # Efectos visuales
│   ├── scenes/             # Contenido de niveles
│   ├── ui/                 # HUD
│   └── pickups/            # Sistema de drops
├── public/assets/          # Assets estaticos
├── test/                   # Tests (node --test)
├── docs/                   # Documentacion VitePress
├── ARCHITECTURE.md         # Documentacion tecnica detallada
├── PROJECT.md              # Vision de producto y roadmap
├── AGENTS.md               # Reglas para agentes IA
└── package.json
```

## Scripts Disponibles

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Servidor Vite con HMR |
| `npm run build` | Bundle de produccion en `dist/` |
| `npm run preview` | Sirve `dist/` localmente |
| `npm test` | Ejecuta tests nativos |
| `npm run docs:dev` | Documentacion web (VitePress) |
| `npm run docs:build` | Build de documentacion para deploy |
| `npm run docs:preview` | Previsualiza build de documentacion |