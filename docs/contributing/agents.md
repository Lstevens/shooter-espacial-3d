# Reglas para Agentes de IA

Este repositorio es un prototipo educativo. El objetivo es avanzar rapido sin perder comprension ni mantenibilidad.

## Principios

1. **Inspecciona primero**: Antes de editar, inspecciona el repositorio y `PROJECT.md`.
2. **Cambio minimo verificable**: Convierte la intencion en el cambio mas pequeno que se pueda probar.
3. **Sin frameworks innecesarios**: No agregues dependencias o abstracciones sin necesidad concreta.
4. **Cambios pequenos y reversibles**: Facilita rollback y revision.
5. **Transparencia**: No ocultes errores; explica causa, cambio y evidencia.
6. **Verifica siempre**: Despues de modificar codigo, ejecuta `npm run build`.
7. **Deuda tecnica explicita**: Si una solucion crece, senala riesgos antes de expandir.
8. **Roles claros**: El estudiante decide producto, estetica y prioridades. El agente implementa, explica y audita.

## Formato de Respuesta

Al terminar, responde con:

- **Resultado**: Que se logro
- **Archivos cambiados**: Lista concreta
- **Verificacion realizada**: `npm run build`, `npm test`, prueba manual
- **Deuda o riesgos encontrados**: Tecnicos, de diseno, de rendimiento
- **Siguiente movimiento opcional**: Propuesta concreta o pregunta al estudiante

## Workflow de Desarrollo

```bash
# 1. Rama de feature
git checkout -b feature/mi-mejora

# 2. Cambios pequenos
# Edita archivos...

# 3. Verificacion local
npm run build   # Debe pasar sin errores
npm test        # Tests deben pasar

# 4. Commit atomico
git add -A
git commit -m "feat: descripcion corta"

# 5. Pull Request
# Incluye: que, por que, evidencia (capturas, logs, test output)
```

## Estilo de Codigo

- **ES Modules** (`type: "module"` en package.json)
- **JSDoc** para tipos (ver `contracts.js`)
- **Sin TypeScript** por ahora (migracion futura)
- **Preferir composicion sobre herencia**
- **Strategy Pattern** para comportamientos intercambiables
- **Data-driven**: config en `config.js`, logica en modulos

## Testing

- Tests nativos: `node --test` (archivos `test/**/*.test.js`)
- Cobertura objetivo: nucleo (Game, GameState, Campaign), armas, enemigos, motor
- Tests rapidos, deterministas, sin dependencias externas

## Documentacion

- `ARCHITECTURE.md`: Tecnico (diagramas Mermaid, SOLID, flujos)
- `PROJECT.md`: Producto (vision, MVP, roadmap)
- `README.md`: Usuario (arranque, controles, estructura)
- `docs/`: Web VitePress (guias, referencia, tutoriales)
- Actualiza docs junto con codigo