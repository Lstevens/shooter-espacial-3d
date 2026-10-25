# Workflow y Pull Requests

## Git Flow

```
main (protegida)
  ^
  |-- feature/arma-plasma
  |-- fix/colision-escalones
  |-- docs/guias-arquitectura
```

- `main`: Solo merges via PR, `npm run build` + `npm test` obligatorios en CI
- Ramas: `feature/*`, `fix/*`, `docs/*`, `refactor/*`, `chore/*`

## Convencion de Commits

```
<tipo>(<alcance>): <descripcion corta>

<cuerpo opcional>

<pie opcional>
```

### Tipos

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Correccion de bug |
| `docs` | Documentacion |
| `refactor` | Reorganizacion sin cambio funcional |
| `perf` | Mejora rendimiento |
| `test` | Tests |
| `chore` | Build, deps, tooling |
| `style` | Formato, lint (sin logica) |

### Ejemplos

```
feat(weapons): add plasma rifle with projectile attack

fix(collision): resolve step height for pipes

docs(guide): add architecture diagrams to VitePress

refactor(enemies): extract MobFactory.createSniperModel
```

## Pull Request Template

```markdown
## Que cambia
Descripcion breve del cambio.

## Por que
Motivacion: bug, feature request, deuda tecnica, experimento.

## Como se verifica
- `npm run build` ✅
- `npm test` ✅
- Prueba manual: [pasos concretos]

## Evidencia
- Capturas / GIF / video
- Logs relevantes
- Output de tests

## Riesgos / Deuda
- [ ] Ninguno
- [ ] Conocidos: descripcion

## Checklist
- [ ] `npm run build` pasa
- [ ] `npm test` pasa
- [ ] Documentacion actualizada (si aplica)
- [ ] Sin `console.log` de debug
- [ ] Commits atomicos y mensajes claros
```

## Code Review

### Quien revisa
- Cualquier colaborador puede revisar
- Aprobacion requerida: 1 (minimo)
- Merge: solo tras aprobacion y CI verde

### Qué se revisa
1. **Correctitud**: ¿Resuelve el problema?
2. **Arquitectura**: ¿Respeta SOLID, OCP, DIP?
3. **Tests**: ¿Cubre casos nuevos? ¿Rompe existentes?
4. **Documentacion**: ¿README, ARCHITECTURE, docs/ actualizados?
5. **Estilo**: ¿Convencion commits, JSDoc, naming?

### Comentarios
- `💡 Sugerencia`: Mejora opcional
- `❓ Pregunta`: Aclarar decision
- `🛑 Bloqueo`: Cambio requerido antes de merge
- `✅ Aprobado`: Listo para merge

## CI (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npm run build
      - run: npm test
```

## Versionado

- **SemVer**: `MAJOR.MINOR.PATCH`
- `main` = proxima version
- Tags: `v0.1.0`, `v0.2.0`, `v1.0.0`
- Changelog: `CHANGELOG.md` (Keep a Changelog)

## Release

```bash
# 1. Actualiza version en package.json
npm version patch|minor|major

# 2. Push tags
git push origin main --tags

# 3. GitHub Release (auto via tag push)
# 4. Deploy docs (si workflow configurado)
```

## Issues

### Plantilla Bug

```markdown
## Descripcion
Comportamiento observado vs esperado.

## Pasos para Reproducir
1. ...
2. ...
3. ...

## Entorno
- OS:
- Node:
- Navegador:
- Commit:

## Logs / Capturas
```

### Plantilla Feature

```markdown
## Problema / Oportunidad
Que necesidad resuelve.

## Propuesta
Descripcion de la solucion.

## Alternativas
Otras opciones consideradas.

## Impacto
- Arquitectura:
- Tests:
- Documentacion:
- Rendimiento:
```

## Comunicacion

- Issues: Para bugs, features, preguntas tecnicas
- Discussions (GitHub): Para ideas, diseno, RFC
- PRs: Para cambios concretos con codigo