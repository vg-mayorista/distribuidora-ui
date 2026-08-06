# AGENTS

## Impeccable (UI design skill)

Impeccable v3.5.0 (CLI) / skill v4.0.4 is installed in this project for UI design review and anti-pattern detection.

- **Skills location**: `.opencode/skills/impeccable/`
- **Project context**: `PRODUCT.md`, `DESIGN.md` at repo root
- **Critique history**: `.impeccable/critique/`

### Slash commands (type in opencode prompt)
- `/impeccable shape <feature>` — plan UX/UI before code
- `/impeccable critique [target]` — UX heuristic review + detector
- `/impeccable audit [target]` — technical (a11y, perf, responsive)
- `/impeccable polish [target]` — final quality pass
- `/impeccable clarify` — UX copy
- `/impeccable typeset` — typography
- `/impeccable layout` — spacing/hierarchy
- `/impeccable colorize` — add strategic color
- `/impeccable animate` — purposeful motion
- `/impeccable adapt` — responsive/native
- `/impeccable harden` — errors, i18n, edge cases
- `/impeccable distill` / `/impeccable bolder` / `/impeccable quieter`
- `/impeccable onboard` — first-run flows
- `/impeccable delight` / `/impeccable overdrive`
- `/impeccable optimize` — perf
- `/impeccable live` — visual iteration in browser
- `/impeccable document` — generate DESIGN.md from code
- `/impeccable extract [target]` — pull tokens/components into design system
- `/impeccable hooks <on|off|status>` — auto-detector after UI edits

### CLI
```bash
impeccable detect <file-or-dir>   # anti-pattern scan
impeccable install                # (re)install skills into project
impeccable update                  # update skills
impeccable check                   # check for updates
impeccable ignores                 # manage detector ignores
```

### Notes
- Init already ran (PRODUCT.md and DESIGN.md exist). Skip `/impeccable init` unless content is stale.
- Critique flow uses two isolated sub-agents (Assessment A: LLM review · B: detector); results synthesized into one report and persisted to `.impeccable/critique/`.
