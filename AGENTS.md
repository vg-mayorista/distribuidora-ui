# AGENTS

## Proyecto
**VG Mayorista** — Angular 22 + Bootstrap 5.3 + Spring Boot.  
Roles: `ROLE_CUSTOMER`, `ROLE_DISTRIBUTOR`, `ROLE_ADMIN`.

## Módulos
| Ruta | Contenido |
|------|-----------|
| `src/app/features/` | `admin`, `auth`, `cliente`, `descargar-remitos`, `distribuidor`, `landing`, `not-found`, `under-construction` |
| `src/app/core/` | `guards`, `interceptors`, `tokens` |
| `src/app/shared/` | `components`, `ui`, `utils` |
| `src/app/models/` | 10 modelos tipados |
| `src/app/services/` | 13 servicios HTTP |
| `style/` | Guía de estilo local (`guia-de-estilo-vg-mayorista.md`) |

## Convenciones
- **Lenguaje**: código en inglés, UI en español (voseo argentino).
- **Linting**: ESLint.
- **Estilo**: `style/guia-de-estilo-vg-mayorista.md`.

## Testing (futuro)
Sin tests. Plan en `docs/testing-plan.md` — Vitest + coverage 80%.

## Roles
| Rol | Acceso |
|-----|--------|
| `ROLE_CUSTOMER` | Catálogo, carrito, checkout, seguimiento |
| `ROLE_DISTRIBUTOR` | Dashboard, pedidos, stock, categorías, reportes, remitos |
| `ROLE_ADMIN` | Stock, categorías, delivery, usuarios, reportes, remitos |

## Errores conocidos
Consultar **`docs/errors/index.md`** para diagnósticos rápidos por patrón.

## Estado global (futuro)
Decisión pendiente. Ver `docs/state-management-options.md` (Signals / RxJS / NgRx).

## Build & Deploy (futuro)
Sin pipeline. Ver `docs/frontend-ci-cd.md` (GitHub Actions / Vercel).

## Skills & comandos (futuro)
Definir en `.kilo/command/*.md` y `.kilo/agent/*.md`. Base: `impeccable`.

## Impeccable (UI skill)
Skill instalada para UX review y anti-patterns.
- **Skills location**: `.opencode/skills/impeccable/`
- **Project context**: `PRODUCT.md`, `DESIGN.md` at repo root
- **Critique history**: `.impeccable/critique/`

### Slash commands
- `/impeccable shape <feature>` — plan UX/UI before code
- `/impeccable critique [target]` — UX heuristic review + detector
- `/impeccable audit [target]` — technical (a11y, perf, responsive)
- `/impeccable polish [target]` — final quality pass
- `/impeccable harden` — errors, i18n, edge cases
- `/impeccable optimize` — perf

### CLI
```bash
impeccable detect <file-or-dir>   # anti-pattern scan
impeccable install                # (re)install skills into project
impeccable update                 # update skills
impeccable check                  # check for updates
impeccable ignores                # manage detector ignores
```

### Notes
- Init already ran (PRODUCT.md and DESIGN.md exist). Skip `/impeccable init` unless content is stale.
- Critique flow uses two isolated sub-agents (Assessment A: LLM review · B: detector); results synthesized into one report and persisted to `.impeccable/critique/`.

## Referencias
- `PRODUCT.md`, `DESIGN.md` — Documentación.
- `.impeccable/critique/` — Revisiones UX/UI.
- `src/app/features/descargar-remitos/AGENTS.md` — AGENTS.md local del módulo.
