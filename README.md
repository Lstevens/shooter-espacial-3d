# 🎮 Shooter 3D Arena

> Prototipo educativo de shooter 3D en primera persona — Three.js + Vite + arquitectura modular

[![Node](https://img.shields.io/badge/Node-20.19%2B-339933?logo=node.js)](https://nodejs.org)
[![Three.js](https://img.shields.io/badge/Three.js-r185-000000?logo=three.js)](https://threejs.org)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite)](https://vite.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-node%20--test-green)](package.json)
[![Build](https://img.shields.io/badge/build-vite%20build-646CFF)](package.json)

---

## 🎯 Visión en una frase

> **Sobrevive en el interior de una nave eliminando oleadas de enemigos; a los 40 s aparece un jefe final — derrótalo, cruza la puerta y avanza a la siguiente cámara (5 en total).**

---

## 🕹️ Demo Rápida

```bash
# 1. Clona e instala
git clone https://github.com/tu-usuario/shooter-3d.git
cd shooter-3d
npm install

# 2. Desarrollo (hot-reload)
npm run dev
# → Abre http://localhost:5173 y haz clic en el canvas para PointerLock

# 3. Producción
npm run build && npm run preview
```

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Servidor Vite + HMR |
| `npm run build` | Bundle optimizado en `dist/` |
| `npm run preview` | Sirve `dist/` localmente |
| `npm test` | Tests nativos (`node --test`) |
| `npm run docs:dev` | Documentación web (VitePress) |

---

## 🎮 Controles

| Acción | Tecla / Input |
|--------|---------------|
| Moverse | `W` `A` `S` `D` |
| Apuntar | Ratón (PointerLock) |
| Disparar | Clic izquierdo |
| Cambiar arma | `1` `2` `3` / Rueda ratón |
| Recargar | `R` |
| Saltar | `Espacio` |
| Guardar campaña | `F5` |
| Pausar / Menú | `Esc` (suelta PointerLock) |

> **Armas**: Pistola (hitscan) · AK (automática) · Cuchillo (melee)

---

## 🏗️ Arquitectura (Resumen)

```
src/
├── main.js                 # Composition Root
├── config.js               # Constantes centralizadas
├── contracts.js            # Tipos JSDoc compartidos
├── core/       Game, GameState, Campaign, EventEmitter
├── engine/     Arena, CollisionWorld, Renderer, Skybox
├── input/      InputController, Keyboard, Mouse
├── player/     Player (cámara, movimiento, colisión)
├── weapons/    WeaponSystem + Strategy (Hitscan/Melee)
├── enemies/    Mob, MobFactory, MobSystem (data-driven)
├── fx/         EffectsSystem (partículas, trazas)
├── scenes/     Ship, Props (temas), Door
├── ui/         HUD (DOM overlay)
└── pickups/    PickupSystem (vida, munición)
```

**Principios SOLID aplicados** → ver [`ARCHITECTURE.md#1-como-se-aplica-solid`](ARCHITECTURE.md#1-como-se-aplica-solid)

---

## 📚 Documentación Completa

| Documento | Qué Encuentras |
|-----------|----------------|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Diagramas Mermaid (clases, estados, secuencias), SOLID, flujos |
| [`PROJECT.md`](PROJECT.md) | Visión de producto, MVP, criterios de aceptación, roadmap |
| [`AGENTS.md`](AGENTS.md) | Reglas para agentes IA (workflow, calidad, verificación) |
| [`docs/`](docs/) | Coordinación multi-agente, estado de UI |
| **Web** | `npm run docs:dev` → VitePress con búsqueda, Mermaid renderizado, navegación |

---

## 🧪 Testing & Calidad

```bash
npm test        # Ejecuta tests en test/**/*.test.js
npm run build   # Verifica que compila sin errores (TS-check implícito via JSDoc)
```

**Cobertura actual**: 7 suites (core, enemies, weapons, audio, ui, pickups, engine)

---

## 🗺️ Roadmap / Próximos Experimentos

Ver [`PROJECT.md#próximo-experimento`](PROJECT.md#próximo-experimento)

- [ ] Migrar a TypeScript (contratos JSDoc listos)
- [ ] AudioSystem real (Web Audio API)
- [ ] Navmesh simple para IA
- [ ] Partículas GPU (InstancedMesh + shaders)
- [ ] Deploy automático a GitHub Pages / Netlify

---

## 🤝 Contribuir

1. Lee [`AGENTS.md`](AGENTS.md) — reglas de trabajo
2. `git checkout -b feature/mi-mejora`
3. Cambios **pequeños y verificables** (`npm run build` ✅)
4. PR con: **qué**, **por qué**, **evidencia** (capturas, logs, test output)

---

## 📄 Licencia

MIT — úsalo libremente para aprender, prototipar o derivar.

---

## 🙋 Autor / Contexto

Prototipo educativo **CITT-videojuegoAI** — arquitectura intencionalmente simple para enseñar patrones reales sin frameworks pesados.