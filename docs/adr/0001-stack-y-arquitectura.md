# ADR-0001 — Stack tecnológico y arquitectura base

**Estado:** Aceptado
**Fecha:** 2026-07-06
**Fuente:** consolida las decisiones ya tomadas en [`docs/SDD.md`](../SDD.md) (§5.1 y §8). No introduce decisiones nuevas.

## Contexto

MarkView es una aplicación de escritorio monousuario y 100% local: un editor de
Markdown con previsualización en vivo del HTML renderizado, multiplataforma
(Windows, macOS, Linux). Es además el proyecto de aprendizaje de Go del autor,
por lo que se priorizan patrones idiomáticos de Go y una arquitectura pequeña y
didáctica sobre soluciones "enterprise". No hay backend remoto, base de datos ni
servicios externos; el único estado persistente es un archivo de configuración y
los `.md` del usuario en disco.

## Decisión

1. **Framework de escritorio: Wails v2** (no v3, no Electron). El backend se
   escribe en Go y el frontend corre en el WebView nativo del sistema; los
   *bindings* generados por Wails exponen métodos Go como funciones JS asíncronas.
2. **Parseo de Markdown en el backend** con Go + [goldmark](https://github.com/yuin/goldmark).
   El frontend nunca parsea Markdown: única fuente de verdad del renderizado.
3. **Persistencia de configuración en JSON local** (`settings.json` en el
   directorio de configuración del usuario) vía `encoding/json`.
4. **Editor de texto: CodeMirror** (v6) integrado en React.
5. **Patrones de arquitectura** (SDD §5.1):
   - **Facade** — el struct `App` es la única superficie bindeada a Wails y
     delega toda la lógica en los servicios (`MarkdownService`, `FileService`,
     `SettingsService`); no implementa lógica de negocio.
   - **Inyección de dependencias por constructor** — wiring explícito en
     `main.go`, sin frameworks de DI.
   - **Strategy** — el renderizado se abstrae tras la interface
     `Renderer { Render(source string) (string, error) }`; `GoldmarkRenderer`
     la implementa y es sustituible/mockeable.
   - **Observer** — cubierto por el sistema de eventos de Wails
     (`EventsEmit`/`EventsOn`) para notificaciones backend → frontend.

## Alternativas consideradas

| Alternativa | Motivo del descarte |
|---|---|
| **Electron** | Binarios mucho más pesados; obligaría a escribir la lógica en Node en lugar de Go (objetivo de aprendizaje). |
| **Wails v3** | Todavía en alfa en el momento de la decisión; v2 es GA desde 2022 y está bien documentado. |
| **Parsear Markdown en el frontend** (marked/markdown-it) | Duplicaría la fuente de verdad del renderizado y quitaría práctica de Go; el viaje JS↔Go con debounce cumple el objetivo de <300ms (SDD §3.2). |
| **Base de datos (SQLite, etc.) para configuración** | Sobredimensionado para cuatro claves de configuración; JSON plano es suficiente y legible. |
| **Framework de DI** (wire, fx, dig) | No idiomático para una app de este tamaño; el wiring manual en `main.go` es explícito y trazable. |
| **Repository pattern** | Pensado para fuentes de datos intercambiables (SQL, APIs). Aquí solo hay archivos planos en disco: añadiría ceremonia sin beneficio real. **Descartado deliberadamente** (SDD §5.1). |

## Consecuencias

- El código de aplicación vive en `internal/` (no importable desde fuera del
  módulo), con la estructura exacta de SDD §5.2; se evita `pkg/` y el layout
  "enterprise".
- Los servicios son testeables de forma aislada (TDD) porque no dependen de la
  GUI: `App` solo delega y las dependencias entran por constructor.
- Sustituir goldmark (u ofrecer renderizadores alternativos) solo requiere otra
  implementación de `Renderer`, sin tocar `App` ni el frontend.
- Quedamos atados al ciclo de vida de Wails v2: una futura migración a v3 será
  un ADR aparte cuando v3 sea estable.
- El HTML generado se inyecta en el WebView, por lo que el saneado (bluemonday,
  plan P4.7) es parte obligatoria del pipeline de renderizado, no un opcional.

## Referencias

- [`docs/SDD.md`](../SDD.md) — §5.1 (patrones), §5.2 (estructura), §8 (decisiones)
- [`docs/plan-desarrollo-ia.md`](../plan-desarrollo-ia.md) — P0.2
- [Documentación de Wails v2](https://wails.io/docs/introduction)
