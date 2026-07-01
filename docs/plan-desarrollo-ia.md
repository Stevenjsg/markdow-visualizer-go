# Plan de desarrollo asistido por IA — Editor/Previsualizador de Markdown

**Versión:** 1.0
**Fecha:** 2026-06-30
**Estado:** Listo para ejecutar
**Documentos fuente (verdad del proyecto):** [`docs/SDD.md`](./SDD.md) · [`docs/roadmap.md`](./roadmap.md) · [`README.md`](../README.md)

> Este documento es la guía operativa para construir la aplicación **por completo con agentes de IA** siguiendo *Spec-Driven Development* (SDD). No reemplaza al SDD: lo ejecuta. Cada tarea es un **prompt atómico, autocontenido y verificable** que se pega tal cual en el agente (Claude Code, Cursor, etc.). El orden es lineal; cada prompt produce un incremento que compila, pasa tests y se puede commitear.

---

## Cómo usar este documento

1. **Configura una sola vez** el [Contrato del Agente](#contrato-del-agente-preámbulo-global) como reglas del proyecto (p. ej. `CLAUDE.md`, `.cursorrules` o el system prompt del agente). Se asume aplicado en **todas** las tareas; los prompts no lo repiten.
2. **Ejecuta los prompts en orden** (`P1.1`, `P1.2`, …). Cada uno indica de qué depende.
3. Tras cada prompt, **verifica los criterios de aceptación** antes de pasar al siguiente. Si fallan, devuélveselos al agente como feedback en lugar de avanzar.
4. **Respeta los puntos de control humano** (🔶) marcados entre fases: son decisiones o validaciones que no debe tomar el agente solo.
5. Commitea al cerrar cada prompt (un prompt ≈ un commit con *Conventional Commits*).

### Enfoque

Plan de **construcción puro**: se descartan los sprints de aprendizaje de Go del roadmap (el agente no necesita aprender) y se reorganiza el trabajo en fases de *build* reales. La columna "Hito" de cada fase mantiene la trazabilidad con el roadmap original.

### Leyenda de la plantilla de tarea

Cada tarea tiene esta forma:

- **Encabezado** con ID + título.
- **Metadatos:** `Depende de` · `Refs` (sección del SDD / requisito funcional RF) · `Hito` (roadmap).
- **Prompt** en bloque de código → es lo que se pega en el agente.
- **Verificación** → comandos y comprobaciones manuales del humano.

---

## Índice

- [Contrato del Agente (preámbulo global)](#contrato-del-agente-preámbulo-global)
- [Tablero de progreso](#tablero-de-progreso)
- [Fase 0 — Decisiones previas y base del repo](#fase-0--decisiones-previas-y-base-del-repo)
- [Fase 1 — Scaffold del proyecto Wails](#fase-1--scaffold-del-proyecto-wails)
- [Fase 2 — Backend Go: dominio y servicios (TDD)](#fase-2--backend-go-dominio-y-servicios-tdd)
- [Fase 3 — Frontend: estructura, estado y componentes](#fase-3--frontend-estructura-estado-y-componentes)
- [Fase 4 — Integración de funcionalidades (RF1–RF5)](#fase-4--integración-de-funcionalidades-rf1rf5)
- [Fase 5 — Editor avanzado y pulido UI/UX](#fase-5--editor-avanzado-y-pulido-uiux)
- [Fase 6 — Calidad: tests, CI y seguridad](#fase-6--calidad-tests-ci-y-seguridad)
- [Fase 7 — Empaquetado y release v0.1](#fase-7--empaquetado-y-release-v01)
- [Fase 8 — Extras (opcional)](#fase-8--extras-opcional)
- [Matriz de trazabilidad](#matriz-de-trazabilidad-prompt--rf--sdd--roadmap)
- [Orden de ejecución y puntos de control](#orden-de-ejecución-y-puntos-de-control)

---

## Contrato del Agente (preámbulo global)

> Pega esto como reglas permanentes del proyecto (`CLAUDE.md` / `.cursorrules`). Aplica a **todas** las tareas.

```text
ROL
Eres un ingeniero senior de Go + Wails v2 + React/TypeScript. Construyes una app
de escritorio: editor de Markdown con previsualización en vivo del HTML renderizado,
100% local, multiplataforma (Windows, macOS, Linux).

FUENTE DE VERDAD
- docs/SDD.md y docs/roadmap.md mandan. No contradigas el SDD.
- Si una decisión no está en el SDD, propónla, justifícala y ESPERA confirmación
  humana antes de implementarla. Si es una decisión de arquitectura, documéntala
  como un ADR en docs/adr/NNNN-titulo.md.
- No inventes APIs. Si dudas de una firma de Wails v2, goldmark, CodeMirror, etc.,
  consúltala en la documentación oficial ANTES de usarla y cítala en tu respuesta.

STACK FIJO (no sustituir sin aprobación)
- Backend: Go 1.26, Wails v2 (NO v3), goldmark, bluemonday.
- Frontend: React + TypeScript (estricto), Tailwind CSS, CodeMirror 6, Zustand.

PATRONES Y ESTRUCTURA (SDD §5)
- App es una Facade: única superficie expuesta a Wails; delega en los servicios,
  no implementa lógica de negocio.
- Inyección de dependencias por constructor, cableada explícitamente en main.go.
  Sin frameworks de DI.
- Renderer es una interface (Strategy); GoldmarkRenderer la implementa.
- Estructura de carpetas EXACTAMENTE como SDD §5.2. Código de aplicación en
  internal/. No uses pkg/ ni layout "enterprise".

FORMA DE TRABAJAR
- Incrementos pequeños y reversibles: un prompt = un entregable = un commit.
- TDD en el backend: cuando haya lógica, escribe el test primero, luego la
  implementación, y deja el test en verde.
- Todo debe compilar y pasar lint/tests antes de declararse hecho:
  go build ./... · go vet ./... · go test ./... · (frontend) npm run lint · npm test
- No edites frontend/wailsjs/ (es autogenerado por Wails).
- Comentarios y documentación en español; identificadores de código en inglés.
- Commits con Conventional Commits (feat:, fix:, test:, chore:, docs:, refactor:).

AL TERMINAR CADA TAREA, REPORTA
1. Lista de archivos creados/modificados.
2. Comandos exactos para verificar (build, test, lint, wails dev).
3. Checklist de criterios de aceptación de la tarea, marcado.
4. Mensaje de commit sugerido.
Si algo te bloquea o el criterio de aceptación es ambiguo, PREGUNTA en vez de asumir.
```

---

## Tablero de progreso

| Fase | Prompts | Resultado | Hito (roadmap) |
|---|---|---|---|
| 0 | P0.1–P0.2 | Repo listo, nombre y módulo definidos | — |
| 1 | P1.1–P1.5 | Scaffold Wails + Tailwind + tooling | 3 |
| 2 | P2.1–P2.5 | Servicios Go testeados + App bindeada | 1–2, 4 |
| 3 | P3.1–P3.6 | UI base, store y componentes | 4 |
| 4 | P4.1–P4.7 | RF1–RF5 funcionando end-to-end | 4–5 |
| 5 | P5.1–P5.5 | CodeMirror, paneles, persistencia de sesión | 6 |
| 6 | P6.1–P6.4 | Tests, CI y revisión de seguridad | 6 |
| 7 | P7.1–P7.4 | Binarios firmables + release v0.1 | 7 |
| 8 | P8.1–P8.5 | Extras opcionales | 8 |

---

## Fase 0 — Decisiones previas y base del repo

🔶 **Control humano:** antes de P0.1 decide el **nombre definitivo** de la app (el README lo marca como pendiente). Afecta al `wails init -n`, al *module path* de Go y al título de las ventanas.

### P0.1 — Fijar nombre, module path y limpiar el placeholder

**Depende de:** —   ·   **Refs:** README (nota de nombre), SDD §5.2   ·   **Hito:** —

```text
Contexto: el repo arranca con un main.go de "Hello, World!" y go.mod con
"module main", placeholders previos al scaffold. Vamos a fijar identidad del proyecto.

Tarea:
1. Usa el nombre de app <NOMBRE_APP> y el module path github.com/stevenjsg/<NOMBRE_APP>
   (pregúntame si no te he dado el nombre; NO lo inventes).
2. Actualiza README.md: sustituye el título y las referencias al "nombre pendiente"
   por <NOMBRE_APP>, y cambia el badge de estado a "Sprint/Fase actual".
3. NO ejecutes el scaffold de Wails todavía (eso es P1.1). Solo deja documentado
   en un comentario al final de docs/roadmap.md que el build real lo guía
   docs/plan-desarrollo-ia.md.

Criterios de aceptación:
- [ ] README sin referencias a "nombre pendiente".
- [ ] Nombre y module path acordados y escritos en el README.
- [ ] No se ha roto la compilación del placeholder (go build ./...).

DoD: commit "docs: fijar nombre del proyecto y module path".
```

**Verificación:** `go build ./...` sigue compilando; revisar README a ojo.

### P0.2 — Crear ADR-0001 con las decisiones ya tomadas en el SDD

**Depende de:** P0.1   ·   **Refs:** SDD §8 (decisiones), §5.1 (patrones)   ·   **Hito:** —

```text
Tarea: crea docs/adr/0001-stack-y-arquitectura.md consolidando como ADR las
decisiones YA tomadas en el SDD (no inventes nuevas):
- Wails v2 sobre v3/Electron.
- Parseo de Markdown en backend (Go + goldmark).
- Persistencia de config en JSON local.
- CodeMirror como editor.
- Patrones: Facade + DI por constructor + Strategy; Repository descartado.
Usa el formato ADR estándar: Contexto, Decisión, Alternativas consideradas,
Consecuencias. Enlaza al SDD. Estado: "Aceptado".

Criterios de aceptación:
- [ ] docs/adr/0001-stack-y-arquitectura.md existe y es coherente con SDD §8.
- [ ] No introduce decisiones nuevas no presentes en el SDD.

DoD: commit "docs: ADR-0001 stack y arquitectura".
```

**Verificación:** leer el ADR y contrastar con SDD §8.

---

## Fase 1 — Scaffold del proyecto Wails

**Hito roadmap:** 3 (Wails: conectar Go ↔ frontend).

### P1.1 — Inicializar proyecto Wails v2 (template react-ts)

**Depende de:** P0.1   ·   **Refs:** SDD §4, §5.2; roadmap Sprint 3   ·   **Hito:** 3

```text
Contexto: repo existente con git, README, docs/ y un main.go placeholder. Hay que
integrar el scaffold de Wails v2 SIN perder docs/ ni el historial git.

Tarea:
1. Genera el scaffold de Wails v2 con el template react-ts para <NOMBRE_APP>
   (equivalente a `wails init -n <NOMBRE_APP> -t react-ts`).
2. Intégralo en este repo: reemplaza el main.go placeholder por el de Wails,
   conserva docs/ y README.md, y fija el module path acordado en P0.1.
3. Asegura wails.json con el nombre correcto y app.go con el struct App,
   OnStartup(ctx) que guarda el context, y un método de ejemplo Greet (temporal).
4. Añade/ajusta .gitignore para build/bin, node_modules y frontend/dist.

Criterios de aceptación:
- [ ] `wails doctor` no reporta dependencias críticas faltantes.
- [ ] `wails dev` levanta la app y el frontend carga.
- [ ] La estructura coincide con el esqueleto de SDD §5.2 (aún sin internal/).
- [ ] docs/ y README.md intactos.

DoD: commit "feat: scaffold Wails v2 con template react-ts".
```

**Verificación:** `wails doctor`; `wails dev` abre ventana; el botón de ejemplo llama a `Greet`.

### P1.2 — Crear la estructura `internal/` del SDD

**Depende de:** P1.1   ·   **Refs:** SDD §5.2   ·   **Hito:** 3

```text
Tarea: crea la estructura de paquetes vacía (con stubs mínimos que compilen) según
SDD §5.2:
  internal/markdown/renderer.go   (solo la interface Renderer)
  internal/markdown/goldmark.go   (stub GoldmarkRenderer que devuelve "" , nil)
  internal/files/service.go       (stub Service con TODOs)
  internal/settings/service.go    (stub Service con TODOs)
Define la interface Renderer { Render(source string) (string, error) }.
No implementes lógica todavía (eso son P2.x). Solo que `go build ./...` pase.

Criterios de aceptación:
- [ ] Árbol de carpetas == SDD §5.2.
- [ ] `go build ./...` y `go vet ./...` pasan.
- [ ] Renderer declarada como interface pequeña.

DoD: commit "chore: estructura internal/ según SDD".
```

**Verificación:** `go build ./...`; comparar árbol con SDD §5.2.

### P1.3 — Configurar Tailwind CSS en el frontend

**Depende de:** P1.1   ·   **Refs:** SDD §3.3, §5; README (stack)   ·   **Hito:** 3

```text
Tarea: instala y configura Tailwind CSS en frontend/ (compatible con la versión de
Vite que trae el template de Wails). Configura content paths, directivas base en el
CSS global, y deja preparada la estrategia de tema oscuro con `darkMode: 'class'`.
Verifica con una utilidad Tailwind aplicada en App.tsx.

Criterios de aceptación:
- [ ] `npm run dev` (o `wails dev`) compila con Tailwind activo.
- [ ] Una clase Tailwind visible confirma que funciona.
- [ ] darkMode configurado como 'class' (preparado para RF5).

DoD: commit "feat: configurar Tailwind CSS".
```

**Verificación:** clase de Tailwind aplica estilos en `wails dev`.

### P1.4 — Tooling de calidad (lint, formato, EditorConfig)

**Depende de:** P1.2, P1.3   ·   **Refs:** SDD §3.2 (mantenibilidad)   ·   **Hito:** 3

```text
Tarea: estandariza calidad de código:
- Go: confirma gofmt; añade configuración de golangci-lint (.golangci.yml) con un
  set razonable de linters (govet, staticcheck, errcheck, revive).
- Frontend: ESLint + Prettier para React/TS, con scripts `npm run lint` y
  `npm run format`. TS en modo estricto (strict: true en tsconfig).
- Añade .editorconfig en la raíz (indentación, charset, EOL).
Documenta en README cómo correr lint/format.

Criterios de aceptación:
- [ ] `golangci-lint run` pasa (sin errores) en el código actual.
- [ ] `npm run lint` pasa.
- [ ] tsconfig con strict: true.

DoD: commit "chore: tooling de lint y formato".
```

**Verificación:** correr ambos linters; revisar `.editorconfig`.

### P1.5 — Smoke test de bindings Go ↔ React

**Depende de:** P1.1   ·   **Refs:** SDD §4 (bindings); roadmap Sprint 3   ·   **Hito:** 3

```text
Tarea: valida el puente Wails extremo a extremo. Usando el método Greet de ejemplo
(o uno equivalente), llama a Go desde un botón en React y muestra el resultado.
Confirma que los bindings se regeneran en frontend/wailsjs/ tras `wails generate
module` o `wails dev`. Cuando funcione, deja una nota en el README sobre cómo se
regeneran los bindings.

Criterios de aceptación:
- [ ] Un clic en React ejecuta código Go real y muestra la respuesta.
- [ ] frontend/wailsjs/ contiene los bindings generados (no editados a mano).

DoD: commit "test: smoke test de bindings Go-React".
```

**Verificación:** interacción manual en `wails dev`.

🔶 **Control humano:** confirma que `wails dev` funciona en tu SO antes de la Fase 2. Si el empaquetado multiplataforma preocupa (SDD §9), ejecuta un `wails build` temprano aquí.

## Fase 2 — Backend Go: dominio y servicios (TDD)

**Hito roadmap:** 1–2 (fundamentos reconvertidos en código real) + 4. Cada servicio se construye con test primero (Contrato del Agente). El cableado final usa DI por constructor (SDD §5.1).

### P2.1 — `MarkdownService`: interface Renderer + GoldmarkRenderer (TDD)

**Depende de:** P1.2   ·   **Refs:** SDD §5 (MarkdownService), §5.1 (Strategy), §6; RF1   ·   **Hito:** 4

```text
Tarea (TDD): implementa internal/markdown.
1. Test primero (goldmark_test.go): casos de Render() para encabezados, negrita,
   listas, enlaces, bloques de código y GFM (tablas, tachado, task lists `- [ ]`).
   Incluye un caso de entrada vacía (debe devolver "" sin error).
2. Implementa GoldmarkRenderer en goldmark.go:
   - goldmark.New con la extensión GFM y opciones de parser/render razonables
     (autoheading IDs, hardwraps si procede).
   - NO habilites HTML crudo inseguro (no WithUnsafe). El escapado seguro por
     defecto de goldmark se mantiene; el saneado adicional llega en P4.7.
   - Render(source string) (string, error) cumple la interface Renderer.
3. GoldmarkRenderer debe construirse con un constructor NewGoldmarkRenderer().

Criterios de aceptación:
- [ ] `go test ./internal/markdown/...` en verde, con los casos listados.
- [ ] GoldmarkRenderer implementa Renderer (verificado en compilación).
- [ ] Entrada vacía → ("", nil).
- [ ] GFM (tablas y task lists) renderiza correctamente.

DoD: commit "feat(markdown): GoldmarkRenderer con tests".
```

**Verificación:** `go test ./internal/markdown/... -v`.

### P2.2 — `FileService`: leer/escribir `.md` (TDD)

**Depende de:** P1.2   ·   **Refs:** SDD §5 (FileService), §7; RF2, RF3; roadmap Sprint 5   ·   **Hito:** 4

```text
Tarea (TDD): implementa internal/files con lógica pura de E/S desacoplada de los
diálogos de Wails (los diálogos nativos se añaden en Fase 4; aquí solo el acceso a
disco testeable).
1. Test primero (service_test.go) usando t.TempDir():
   - ReadFile(path) devuelve el contenido de un .md existente.
   - WriteFile(path, content) crea/sobrescribe y el contenido coincide al releer.
   - ReadFile sobre ruta inexistente devuelve un error claro (envuelto con %w).
2. Implementa Service con NewService(); usa el paquete os.
3. Errores explícitos y envueltos (fmt.Errorf("...: %w", err)); sin panics.

Criterios de aceptación:
- [ ] `go test ./internal/files/...` en verde (incluido el caso de error).
- [ ] Round-trip write→read conserva el contenido byte a byte.
- [ ] Sin dependencias de Wails en este paquete (debe testearse sin GUI).

DoD: commit "feat(files): servicio de lectura/escritura con tests".
```

**Verificación:** `go test ./internal/files/... -v`.

### P2.3 — `SettingsService`: persistir `settings.json` (TDD)

**Depende de:** P1.2   ·   **Refs:** SDD §5, §7 (modelo de config); RF5; roadmap Sprint 6   ·   **Hito:** 4

```text
Tarea (TDD): implementa internal/settings.
1. Define el struct Settings con: Theme string, LastOpenedFile string,
   WindowWidth int, WindowHeight int (tags json como en SDD §7).
2. Test primero (service_test.go), con directorio de config inyectable (no escribas
   en el HOME real durante los tests):
   - Load() sin archivo previo devuelve valores por defecto (p. ej. theme "dark"),
     sin error.
   - Save(settings) seguido de Load() recupera exactamente los mismos valores.
   - JSON corrupto → error claro (o fallback a defaults, decídelo y documéntalo).
3. Implementa con encoding/json; resuelve el directorio con os.UserConfigDir() en
   producción, pero permite inyectar la ruta base para los tests.

Criterios de aceptación:
- [ ] `go test ./internal/settings/...` en verde.
- [ ] Defaults aplicados cuando no hay archivo.
- [ ] Round-trip Save→Load idempotente.
- [ ] Los tests NO tocan el directorio de config real del usuario.

DoD: commit "feat(settings): persistencia JSON con tests".
```

**Verificación:** `go test ./internal/settings/... -v`.

### P2.4 — `App` como Facade + wiring por DI en `main.go`

**Depende de:** P2.1, P2.2, P2.3   ·   **Refs:** SDD §5.1 (Facade, DI), ejemplo de `main.go`   ·   **Hito:** 4

```text
Tarea: convierte App en la fachada del SDD §5.1.
1. App recibe sus dependencias por constructor:
   NewApp(renderer markdown.Renderer, files *files.Service, settings *settings.Service) *App
2. App guarda el context en OnStartup(ctx) y NO implementa lógica de negocio:
   cada método delega en el servicio correspondiente.
3. Cablea todo explícitamente en main.go (sin framework de DI), tal cual el snippet
   del SDD §5.1:
     renderer := markdown.NewGoldmarkRenderer()
     fileService := files.NewService()
     settingsService := settings.NewService()
     app := NewApp(renderer, fileService, settingsService)
4. Mantén el Bind de Wails apuntando a app.

Criterios de aceptación:
- [ ] App no contiene lógica de negocio (solo delegación).
- [ ] DI cableada en main.go, sin libs de DI.
- [ ] `go build ./...` y `wails dev` siguen funcionando.

DoD: commit "refactor(app): App como Facade con DI por constructor".
```

**Verificación:** revisar que los métodos de `App` solo delegan; `wails dev` arranca.

### P2.5 — Métodos bindeados del backend (superficie pública)

**Depende de:** P2.4   ·   **Refs:** SDD §5 (métodos), §6 (flujo)   ·   **Hito:** 4

```text
Tarea: expón en App los métodos que el frontend necesitará, todos delegando:
- ParseMarkdown(content string) (string, error)  -> renderer.Render
- ReadFile(path string) (string, error)          -> files.ReadFile
- WriteFile(path, content string) error           -> files.WriteFile
- LoadSettings() (settings.Settings, error)       -> settings.Load
- SaveSettings(s settings.Settings) error         -> settings.Save
(Los diálogos nativos Open/Save y el dirty-state se añaden en Fase 4.)
Regenera los bindings y confirma que aparecen tipados en frontend/wailsjs/.
Elimina el método Greet de ejemplo si ya no se usa.

Criterios de aceptación:
- [ ] Los 5 métodos existen, delegan y compilan.
- [ ] Bindings TS generados y tipados en frontend/wailsjs/.
- [ ] `go vet ./...` limpio.

DoD: commit "feat(app): exponer métodos bindeados de markdown/archivos/settings".
```

**Verificación:** inspeccionar `frontend/wailsjs/go/main/App.d.ts`.

🔶 **Control humano:** revisa la cobertura de tests del backend (`go test ./... -cover`) antes de la Fase 3. El núcleo de negocio debería quedar cubierto aquí.

## Fase 3 — Frontend: estructura, estado y componentes

**Hito roadmap:** 4. Se construye la UI con componentes desacoplados y un store ligero (Zustand, SDD §5). Los componentes se montan con datos simulados; el cableado real a los bindings se cierra en Fase 4.

### P3.1 — Layout de dos paneles + sistema de tema

**Depende de:** P1.3   ·   **Refs:** SDD §4 (arquitectura), §5 (frontend)   ·   **Hito:** 4

```text
Tarea: crea el layout base en App.tsx:
- Dos paneles horizontales: Editor (izquierda) | Preview (derecha), con una barra
  superior (Toolbar) reservada.
- Maquetado 100% con Tailwind, responsive al tamaño de ventana.
- Prepara las clases para tema claro/oscuro usando la estrategia darkMode:'class'
  (un wrapper con clase `dark` conmutable). Aún sin lógica de persistencia.

Criterios de aceptación:
- [ ] Editor y Preview se ven lado a lado, con Toolbar arriba.
- [ ] Alternar la clase `dark` manualmente cambia la paleta.
- [ ] Sin warnings de TS/ESLint.

DoD: commit "feat(ui): layout de dos paneles con soporte de tema".
```

**Verificación:** `wails dev`; alternar `dark` en el DOM cambia colores.

### P3.2 — Store de estado del documento (Zustand)

**Depende de:** P3.1   ·   **Refs:** SDD §5 (gestión de estado)   ·   **Hito:** 4

```text
Tarea: crea frontend/src/store/ con un store Zustand para el estado del documento:
- content: string
- html: string (preview renderizado)
- filePath: string | null
- isDirty: boolean
- theme: 'light' | 'dark'
Acciones: setContent, setHtml, setFilePath, markClean, setTheme.
Reglas de negocio del estado: setContent marca isDirty=true; markClean lo pone a
false (se usará tras guardar). Tipa todo estrictamente. No llames a Go todavía.

Criterios de aceptación:
- [ ] Store tipado y exportado como hook.
- [ ] setContent activa isDirty; markClean lo limpia.
- [ ] Sin dependencias a wailsjs en el store.

DoD: commit "feat(state): store del documento con Zustand".
```

**Verificación:** test rápido o uso temporal en un componente.

### P3.3 — Componente `Editor` (textarea controlado)

**Depende de:** P3.2   ·   **Refs:** SDD §5 (Editor); roadmap Sprint 4   ·   **Hito:** 4

```text
Tarea: crea components/Editor/ con un <textarea> controlado por el store
(content / setContent). Estilado con Tailwind, fuente monoespaciada, ocupa todo el
panel izquierdo, con scroll. Es un paso intermedio: CodeMirror llega en P5.1, así
que aísla bien la interfaz del componente para poder sustituirlo sin tocar el resto.

Criterios de aceptación:
- [ ] Escribir actualiza store.content e isDirty.
- [ ] Interfaz del componente desacoplada (props/estado claros) para sustituirlo luego.

DoD: commit "feat(ui): componente Editor (textarea)".
```

**Verificación:** escribir actualiza el estado (visible en devtools/Preview).

### P3.4 — Componente `Preview`

**Depende de:** P3.2   ·   **Refs:** SDD §5 (Preview), §6   ·   **Hito:** 4

```text
Tarea: crea components/Preview/ que renderiza store.html en el panel derecho.
- Aplica estilos tipográficos al HTML resultante (encabezados, listas, código,
  tablas, citas) con Tailwind (p. ej. clases tipo "prose" o equivalentes propias).
- Como el HTML viene del backend, inyéctalo de forma controlada; deja un TODO
  explícito apuntando a la sanitización de P4.7 (no asumas que ya es seguro).

Criterios de aceptación:
- [ ] store.html se renderiza con estilos legibles en claro y oscuro.
- [ ] TODO de seguridad (P4.7) presente en el punto de inyección de HTML.

DoD: commit "feat(ui): componente Preview".
```

**Verificación:** fijar `html` de prueba en el store y verlo renderizado.

### P3.5 — Hook `useDebouncedMarkdown`

**Depende de:** P2.5, P3.2   ·   **Refs:** SDD §5 (hook), §6 (flujo, debounce); RF1; roadmap Sprint 4   ·   **Hito:** 4

```text
Tarea: crea hooks/useDebouncedMarkdown.ts:
- Observa store.content; tras una pausa de ~200ms (debounce, SDD §6) llama al binding
  ParseMarkdown(content) de wailsjs.
- Guarda el HTML resultante en store.setHtml. Maneja errores (no rompas la UI).
- Cancela llamadas pendientes al desmontar o si llega contenido nuevo.

Criterios de aceptación:
- [ ] Escribir NO llama a Go en cada tecla; solo tras la pausa (~200ms).
- [ ] El HTML del store se actualiza con la salida real de goldmark.
- [ ] Errores del binding se capturan sin romper la app.

DoD: commit "feat(ui): hook useDebouncedMarkdown".
```

**Verificación:** observar en red/console que las llamadas se agrupan; ver objetivo de <300ms del SDD §3.2.

### P3.6 — `Toolbar` con acciones (cableado en Fase 4)

**Depende de:** P3.1   ·   **Refs:** SDD §5 (Toolbar)   ·   **Hito:** 4

```text
Tarea: crea components/Toolbar/ con botones: Abrir, Guardar, Guardar como y un
toggle de tema. Por ahora disparan callbacks stub (console.log / no-op) y reflejan
estado (p. ej. mostrar "●" cuando isDirty). El cableado real a backend es Fase 4.
Accesible: cada botón con aria-label y foco visible.

Criterios de aceptación:
- [ ] Toolbar con los 4 controles y el indicador dirty.
- [ ] Botones accesibles (aria-label, foco).

DoD: commit "feat(ui): Toolbar con acciones stub".
```

**Verificación:** revisar Toolbar y el indicador dirty en `wails dev`.

🔶 **Control humano:** valida el aspecto general (claro/oscuro, dos paneles) antes de cablear funcionalidades.

---

## Fase 4 — Integración de funcionalidades (RF1–RF5)

**Hito roadmap:** 4–5. Aquí cada requisito funcional del SDD §3.1 se cierra end-to-end. Antes de cada prompt, verifica el RF correspondiente.

### P4.1 — RF1: preview en vivo end-to-end

**Depende de:** P3.3, P3.4, P3.5   ·   **Refs:** RF1; SDD §3.2 (<300ms), §6   ·   **Hito:** 4

```text
Tarea: conecta Editor → store → useDebouncedMarkdown → ParseMarkdown (Go) → Preview,
funcionando de extremo a extremo. Ajusta el debounce para cumplir el objetivo del
SDD §3.2 (preview actualizado <300ms tras dejar de escribir).

Criterios de aceptación:
- [ ] Escribir Markdown actualiza el Preview automáticamente, sin lag perceptible.
- [ ] Latencia percibida del preview <300ms tras la última tecla.
- [ ] GFM (tablas, task lists) se ve correctamente en el Preview.

DoD: commit "feat: RF1 preview en vivo con debounce".
```

**Verificación:** prueba manual con un documento variado.

### P4.2 — RF2: abrir archivo con diálogo nativo

**Depende de:** P2.5, P3.6   ·   **Refs:** RF2; SDD §5 (FileService); roadmap Sprint 5   ·   **Hito:** 5

```text
Tarea: implementa "Abrir":
1. Backend: añade App.OpenFileDialog() que use runtime.OpenFileDialog con filtro
   para *.md;*.markdown, lea el archivo (files.ReadFile) y devuelva {path, content}.
   Consulta la firma exacta en la doc de Wails v2 antes de usarla.
2. Frontend: el botón Abrir llama al binding, vuelca content y filePath al store y
   hace markClean (recién abierto = limpio).

Criterios de aceptación:
- [ ] El botón Abrir muestra el diálogo nativo filtrado a Markdown.
- [ ] Al elegir un .md, su contenido aparece en el Editor y se renderiza el Preview.
- [ ] filePath se fija e isDirty queda en false.
- [ ] Cancelar el diálogo no rompe nada.

DoD: commit "feat: RF2 abrir archivo .md".
```

**Verificación:** abrir un `.md` real del disco.

### P4.3 — RF3: guardar y guardar como

**Depende de:** P4.2   ·   **Refs:** RF3; SDD §5; roadmap Sprint 5   ·   **Hito:** 5

```text
Tarea: implementa "Guardar" y "Guardar como":
1. Backend: App.SaveFile(path, content) (usa files.WriteFile) y App.SaveFileDialog()
   con runtime.SaveFileDialog para elegir destino (consulta la firma en la doc).
2. Frontend:
   - Guardar: si hay filePath, escribe ahí; si no, cae en Guardar como.
   - Guardar como: pide ruta con el diálogo, escribe, actualiza filePath.
   - Tras guardar con éxito: markClean (isDirty=false).

Criterios de aceptación:
- [ ] Guardar sobre un archivo abierto persiste los cambios en disco.
- [ ] Guardar como crea un archivo nuevo y pasa a apuntar a él.
- [ ] Tras guardar, el indicador dirty desaparece.

DoD: commit "feat: RF3 guardar y guardar como".
```

**Verificación:** editar → guardar → reabrir y confirmar cambios.

### P4.4 — RF4: indicador de cambios + confirmación al cerrar

**Depende de:** P4.3   ·   **Refs:** RF4; SDD §5.1 (Observer/eventos)   ·   **Hito:** 5

```text
Tarea: implementa la protección de datos sin guardar:
1. Indicador visual de isDirty en la Toolbar y/o título de ventana (p. ej. "● sin
   guardar").
2. Sincroniza el estado dirty al backend: añade App.SetDirty(bool) que el frontend
   llama cuando cambia isDirty.
3. Intercepta el cierre con la opción OnBeforeClose(ctx) bool de Wails: si hay
   cambios sin guardar, muestra un runtime.MessageDialog (Question) con
   Guardar / Descartar / Cancelar; devuelve true (prevenir cierre) salvo que el
   usuario confirme descartar o tras guardar. Consulta firmas en la doc de Wails.

Criterios de aceptación:
- [ ] Con cambios pendientes, intentar cerrar muestra el diálogo de confirmación.
- [ ] "Cancelar" mantiene la app abierta; "Descartar" cierra; "Guardar" guarda y cierra.
- [ ] Sin cambios pendientes, la app cierra directamente.

DoD: commit "feat: RF4 indicador dirty y confirmación al cerrar".
```

**Verificación:** editar sin guardar e intentar cerrar la ventana.

### P4.5 — RF5: tema claro/oscuro persistente

**Depende de:** P2.5, P3.1   ·   **Refs:** RF5; SDD §7 (settings.theme); roadmap Sprint 6   ·   **Hito:** 5

```text
Tarea: cierra el tema de punta a punta:
1. El toggle de la Toolbar cambia store.theme y aplica/quita la clase `dark`.
2. Persiste con SaveSettings (campo theme); al arrancar (OnStartup/primer render)
   llama a LoadSettings y aplica el tema guardado.

Criterios de aceptación:
- [ ] El toggle cambia el tema al instante.
- [ ] Al reiniciar la app, se respeta el último tema elegido.
- [ ] Editor y Preview se ven correctos en ambos temas.

DoD: commit "feat: RF5 tema claro/oscuro persistente".
```

**Verificación:** cambiar tema, cerrar y reabrir; debe persistir.

### P4.6 — Atajos de teclado

**Depende de:** P4.3, P4.2   ·   **Refs:** roadmap Sprint 5 (atajos)   ·   **Hito:** 5

```text
Tarea: añade atajos globales en el frontend:
- Ctrl/Cmd+S → Guardar (Ctrl/Cmd+Shift+S → Guardar como)
- Ctrl/Cmd+O → Abrir
- Detecta macOS para usar Cmd en lugar de Ctrl.
Evita conflictos con el foco del editor; previene el comportamiento por defecto del
navegador embebido.

Criterios de aceptación:
- [ ] Los atajos disparan las acciones correctas en Windows/Linux (Ctrl) y macOS (Cmd).
- [ ] No interfieren con la escritura normal en el editor.

DoD: commit "feat: atajos de teclado guardar/abrir".
```

**Verificación:** probar cada atajo en `wails dev`.

### P4.7 — Seguridad: sanitizar el HTML del preview (XSS)

**Depende de:** P4.1   ·   **Refs:** SDD §3.2 (no funcional), §6; RF1   ·   **Hito:** 5

```text
Contexto: el Preview inyecta HTML generado desde texto del usuario. Aunque goldmark
escapa HTML crudo por defecto, añadimos defensa en profundidad antes de inyectarlo.

Tarea: integra bluemonday en el backend:
- En GoldmarkRenderer.Render (o en un paso posterior dentro de markdown), pasa el
  HTML por una policy de bluemonday (UGCPolicy) antes de devolverlo.
- Añade un test que confirme que un payload tipo <script>alert(1)</script> o
  onerror=... se neutraliza en la salida.
- Quita el TODO de seguridad dejado en el Preview (P3.4).

Criterios de aceptación:
- [ ] Test de XSS pasa: scripts/handlers peligrosos eliminados de la salida.
- [ ] Markdown legítimo (incl. GFM) sigue renderizando bien tras el saneado.
- [ ] El Preview ya no asume HTML "confiable" sin sanear.

DoD: commit "feat(security): sanear HTML del preview con bluemonday".
```

**Verificación:** `go test ./internal/markdown/...`; probar un `.md` con `<script>`.

🔶 **Control humano:** en este punto el **MVP está funcional** (RF1–RF5). Haz una pasada manual con un documento real antes de seguir.

---

## Fase 5 — Editor avanzado y pulido UI/UX

**Hito roadmap:** 6. Se sustituye el textarea por CodeMirror y se pule la experiencia.

### P5.1 — Sustituir textarea por CodeMirror 6

**Depende de:** P3.3, P4.1   ·   **Refs:** SDD §8 (CodeMirror), §5; roadmap Sprint 6   ·   **Hito:** 6

```text
Tarea: reemplaza el <textarea> del Editor por CodeMirror 6 (@uiw/react-codemirror)
con resaltado de Markdown (@codemirror/lang-markdown):
- Mantén el contrato del componente Editor (lee/escribe store.content) para no tocar
  el resto.
- Tema de CodeMirror sincronizado con store.theme (claro/oscuro).
- Conserva el debounce/preview de RF1 sin regresiones.

Criterios de aceptación:
- [ ] El editor resalta sintaxis Markdown.
- [ ] El tema del editor sigue al tema de la app.
- [ ] RF1 sigue cumpliéndose (preview en vivo sin lag).

DoD: commit "feat(editor): integrar CodeMirror 6 con resaltado Markdown".
```

**Verificación:** escribir Markdown y ver resaltado + preview.

### P5.2 — Paneles redimensionables

**Depende de:** P3.1   ·   **Refs:** roadmap Sprint 6 (paneles redimensionables)   ·   **Hito:** 6

```text
Tarea: haz redimensionable la división Editor/Preview con un divisor arrastrable.
Guarda la proporción elegida en el store (y, opcionalmente, en settings para
persistir). Respeta mínimos razonables por panel.

Criterios de aceptación:
- [ ] El usuario arrastra el divisor y ambos paneles se ajustan con fluidez.
- [ ] La proporción no rompe en ventanas pequeñas.

DoD: commit "feat(ui): paneles redimensionables".
```

**Verificación:** arrastrar el divisor en `wails dev`.

### P5.3 — Restaurar sesión: último archivo y tamaño de ventana

**Depende de:** P4.5, P2.3   ·   **Refs:** SDD §7 (lastOpenedFile, windowWidth/Height); roadmap Sprint 6   ·   **Hito:** 6

```text
Tarea: usa SettingsService para restaurar la sesión:
- Al cerrar/guardar settings, persiste lastOpenedFile y el tamaño de ventana.
- Al arrancar, si lastOpenedFile existe y es legible, ábrelo automáticamente; aplica
  el tamaño de ventana guardado (runtime de Wails). Maneja el caso de archivo
  borrado/movido sin romper el arranque.

Criterios de aceptación:
- [ ] Reabrir la app restaura el último archivo (si sigue existiendo).
- [ ] El tamaño de ventana se conserva entre sesiones.
- [ ] Si el último archivo ya no existe, la app abre vacía sin error.

DoD: commit "feat: restaurar última sesión (archivo y ventana)".
```

**Verificación:** abrir archivo, redimensionar, reiniciar app.

### P5.4 — Estados de UI: vacío, cargando y error

**Depende de:** P4.2, P4.3   ·   **Refs:** SDD §3.2 (mantenibilidad/UX)   ·   **Hito:** 6

```text
Tarea: añade estados de interfaz claros:
- Estado vacío (sin documento) con ayuda mínima.
- Feedback al abrir/guardar (breve indicador) y mensajes de error legibles cuando
  una operación de archivo falla (no toasts genéricos: explica qué pasó).
Centraliza el manejo de errores de los bindings.

Criterios de aceptación:
- [ ] Sin documento, la UI muestra un estado vacío útil.
- [ ] Un error de E/S (p. ej. permisos) se comunica de forma comprensible.

DoD: commit "feat(ux): estados vacío, carga y error".
```

**Verificación:** forzar un error de guardado (ruta protegida).

### P5.5 — Accesibilidad y atajos visibles

**Depende de:** P3.6, P4.6   ·   **Refs:** SDD §3.2   ·   **Hito:** 6

```text
Tarea: pasada de accesibilidad:
- Navegación por teclado completa (foco visible, orden lógico).
- aria-labels en controles; contraste suficiente en ambos temas.
- Tooltips o leyenda con los atajos disponibles.

Criterios de aceptación:
- [ ] Toda acción principal es alcanzable por teclado.
- [ ] Contraste AA en claro y oscuro (revisión rápida).

DoD: commit "feat(a11y): accesibilidad y atajos visibles".
```

**Verificación:** recorrer la app solo con teclado.

🔶 **Control humano:** la app debería verse "terminada" (no prototipo). Revisa UX antes de Fase 6.

## Fase 6 — Calidad: tests, CI y seguridad

**Hito roadmap:** 6 (consolidación). Blinda el proyecto antes de empaquetar.

### P6.1 — Completar la suite de tests de backend

**Depende de:** P2.x, P4.7   ·   **Refs:** SDD §3.2; Contrato del Agente (TDD)   ·   **Hito:** 6

```text
Tarea: revisa y completa los tests de Go:
- markdown: casos límite (HTML peligroso, entradas grandes, GFM completo).
- files: rutas inexistentes, permisos, sobrescritura.
- settings: archivo corrupto, defaults, round-trip.
Apunta a una cobertura alta del paquete internal/ (reporta el % con -cover).

Criterios de aceptación:
- [ ] `go test ./... -cover` en verde con cobertura razonable de internal/.
- [ ] Casos de error cubiertos, no solo el camino feliz.

DoD: commit "test: completar suite de backend".
```

**Verificación:** `go test ./... -cover`.

### P6.2 — Tests de frontend (Vitest + Testing Library)

**Depende de:** P3.x, P4.x   ·   **Refs:** SDD §5 (frontend)   ·   **Hito:** 6

```text
Tarea: configura Vitest + @testing-library/react (+ jsdom) y escribe tests de:
- Store: setContent marca dirty; markClean lo limpia.
- useDebouncedMarkdown: agrupa llamadas (con timers simulados) y vuelca HTML.
- Toolbar: dispara los callbacks correctos y refleja el estado dirty.
Mockea los bindings de wailsjs (no necesitan backend real).

Criterios de aceptación:
- [ ] `npm test` en verde.
- [ ] El debounce está testeado con fake timers.

DoD: commit "test(frontend): Vitest + Testing Library".
```

**Verificación:** `npm test` en `frontend/`.

### P6.3 — CI con GitHub Actions

**Depende de:** P6.1, P6.2, P1.4   ·   **Refs:** SDD §9 (empaquetado); README   ·   **Hito:** 6

```text
Tarea: crea .github/workflows/ci.yml que en cada push/PR:
- Configure Go 1.26 y Node 18+.
- Ejecute: golangci-lint, go vet, go test ./..., npm ci + npm run lint + npm test.
- (Opcional) Job de build con wails build en una matriz de SO (ubuntu/macos/windows)
  para detectar pronto problemas multiplataforma (SDD §9). Instala dependencias del
  sistema necesarias (WebKitGTK en Linux).

Criterios de aceptación:
- [ ] El workflow corre lint + tests de Go y frontend y queda en verde.
- [ ] (Si se incluye) el build multiplataforma compila o reporta el problema claramente.

DoD: commit "ci: pipeline de lint, tests y build".
```

**Verificación:** abrir un PR de prueba y ver el check en verde.

### P6.4 — Revisión de seguridad

**Depende de:** P4.7, P4.2, P4.3   ·   **Refs:** SDD §3.2, §9   ·   **Hito:** 6

```text
Tarea: revisión de seguridad enfocada:
- Confirma el saneado XSS del preview (P4.7) con un set ampliado de payloads.
- Revisa las operaciones de archivo: validación de rutas, manejo de symlinks,
  errores de permisos; evita escrituras fuera de lo que el usuario eligió.
- Revisa que no se registren contenidos sensibles en logs.
Entrega un breve informe (docs/security-review.md) con hallazgos y mitigaciones.

Criterios de aceptación:
- [ ] docs/security-review.md con hallazgos y estado.
- [ ] Sin vulnerabilidades XSS conocidas en el preview.

DoD: commit "docs(security): informe de revisión de seguridad".
```

**Verificación:** leer el informe; reejecutar tests de XSS.

🔶 **Control humano:** decide si firmas código en macOS/Windows ahora o lo difieres (SDD §9 lo permite diferir). Afecta a P7.x.

---

## Fase 7 — Empaquetado y release v0.1

**Hito roadmap:** 7. Genera un ejecutable distribuible.

### P7.1 — Icono, metadata y `wails.json`

**Depende de:** Fase 6   ·   **Refs:** roadmap Sprint 7   ·   **Hito:** 7

```text
Tarea: prepara la identidad de build:
- Añade el icono de la app (build/appicon.png) y los assets por plataforma que Wails
  espera (build/windows, build/darwin).
- Completa wails.json y la info de la app (nombre <NOMBRE_APP>, autor, versión 0.1.0,
  identificador).

Criterios de aceptación:
- [ ] El icono aparece en la ventana/binario.
- [ ] Metadata (nombre, versión, autor) correcta.

DoD: commit "chore(build): icono y metadata de la app".
```

**Verificación:** `wails build` y revisar el binario.

### P7.2 — Build de producción multiplataforma

**Depende de:** P7.1   ·   **Refs:** SDD §9; roadmap Sprint 7   ·   **Hito:** 7

```text
Tarea: genera binarios de producción con `wails build` para las plataformas
disponibles. Documenta en README los comandos y requisitos por SO (WebView2 en
Windows, WebKitGTK en Linux, Xcode CLT en macOS). Si una plataforma no es accesible
localmente, apóyate en el job de CI (P6.3).

Criterios de aceptación:
- [ ] Binario(s) generados en build/bin/.
- [ ] README documenta el proceso de build por plataforma.

DoD: commit "build: binarios de producción v0.1".
```

**Verificación:** ejecutar el binario generado.

### P7.3 — Prueba en máquina limpia (checklist de release)

**Depende de:** P7.2   ·   **Refs:** SDD §9 (riesgo de empaquetado); roadmap Sprint 7   ·   **Hito:** 7

```text
Tarea: valida el binario en un entorno "limpio" (sin toolchain de desarrollo) y
redacta docs/release-checklist.md cubriendo: arranque, RF1–RF5, persistencia de
settings, abrir/guardar reales y cierre con cambios. Anota cualquier dependencia de
runtime faltante.

Criterios de aceptación:
- [ ] El binario arranca y cumple RF1–RF5 en máquina limpia.
- [ ] docs/release-checklist.md completado.

DoD: commit "docs: checklist de release v0.1".
```

**Verificación:** seguir el checklist en una VM/equipo limpio.

### P7.4 — Publicar release v0.1 y actualizar el README

**Depende de:** P7.3   ·   **Refs:** README; roadmap (Hito 4)   ·   **Hito:** 7

```text
Tarea: prepara la entrega:
- Etiqueta v0.1.0 y, si usas GitHub, crea el Release adjuntando binarios.
- Redacta notas de versión (CHANGELOG.md) con las features incluidas (RF1–RF5).
- Actualiza el badge de estado del README a "v0.1 publicada" y enlaza el release.

Criterios de aceptación:
- [ ] Tag v0.1.0 creado y CHANGELOG con las features.
- [ ] README refleja el estado v0.1.

DoD: commit "docs: release v0.1.0".
```

**Verificación:** revisar el release y el README.

🔶 **Control humano:** validación final de la v0.1 antes de anunciarla. Decide alcance de la Fase 8.

---

## Fase 8 — Extras (opcional)

**Hito roadmap:** 8. Fuera del MVP (SDD §2). Elige según interés; cada uno es un mini-ciclo SDD (spec breve → test → implementación). Prompts más ligeros:

### P8.1 — Exportar a HTML / PDF

```text
Tarea: añade exportación del documento renderizado a HTML autocontenido y/o PDF.
Backend genera el archivo (diálogo de guardado nativo). Define primero el alcance
(¿estilos embebidos? ¿qué motor de PDF?) y propónmelo antes de implementar.
Criterios: el archivo exportado refleja fielmente el preview. DoD: commit "feat: exportar a HTML/PDF".
```

### P8.2 — Pestañas múltiples / multi-documento

```text
Tarea: soporta varios documentos abiertos en pestañas. Refactoriza el store para una
colección de documentos (cada uno con content/filePath/isDirty). Cuida que RF4
(confirmación) funcione por pestaña. Propón el diseño del estado antes de codificar.
Criterios: abrir/editar/cerrar varias pestañas sin perder cambios. DoD: commit "feat: pestañas múltiples".
```

### P8.3 — Buscar y reemplazar

```text
Tarea: añade buscar/reemplazar en el editor (aprovecha las extensiones de búsqueda de
CodeMirror 6). Atajos Ctrl/Cmd+F y Ctrl/Cmd+H.
Criterios: buscar resalta coincidencias; reemplazar (uno/todos) funciona. DoD: commit "feat: buscar y reemplazar".
```

### P8.4 — Sincronizar scroll editor ↔ preview

```text
Tarea: sincroniza el scroll entre editor y preview de forma proporcional/por bloques.
Criterios: desplazar uno desplaza el otro sin saltos bruscos. DoD: commit "feat: scroll sincronizado".
```

### P8.5 — Soporte ampliado de GFM en la UI

```text
Tarea: pule el render de tablas y task lists (`- [ ]`) con estilos dedicados y, si
procede, checkboxes interactivos que reescriban el Markdown. Define alcance antes.
Criterios: tablas y task lists legibles y (opcional) interactivas. DoD: commit "feat: soporte GFM ampliado".
```

---

## Matriz de trazabilidad (prompt → RF → SDD → roadmap)

| Prompt | Requisito / objetivo | SDD | Hito roadmap |
|---|---|---|---|
| P0.1–P0.2 | Identidad del proyecto, ADR base | §5.2, §8 | — |
| P1.1–P1.5 | Scaffold, Tailwind, tooling, bindings | §4, §5.2 | 3 |
| P2.1 | Render de Markdown | §5, §5.1, §6 / RF1 | 4 |
| P2.2 | E/S de archivos | §5, §7 / RF2, RF3 | 4 |
| P2.3 | Persistencia de settings | §5, §7 / RF5 | 4 |
| P2.4–P2.5 | Facade + DI + superficie bindeada | §5.1 | 4 |
| P3.1–P3.6 | UI base, store, componentes | §5 | 4 |
| P4.1 | Preview en vivo | §3.2, §6 / RF1 | 4 |
| P4.2 | Abrir archivo | §5 / RF2 | 5 |
| P4.3 | Guardar / Guardar como | §5 / RF3 | 5 |
| P4.4 | Indicador dirty + confirmación | §5.1 / RF4 | 5 |
| P4.5 | Tema persistente | §7 / RF5 | 5 |
| P4.6 | Atajos de teclado | — | 5 |
| P4.7 | Saneado XSS | §3.2 / RF1 | 5 |
| P5.1–P5.5 | CodeMirror, paneles, sesión, UX, a11y | §5, §7, §8 | 6 |
| P6.1–P6.4 | Tests, CI, seguridad | §3.2, §9 | 6 |
| P7.1–P7.4 | Empaquetado y release | §9 | 7 |
| P8.1–P8.5 | Extras | §2 (fuera de alcance) | 8 |

**Cobertura de requisitos funcionales:** RF1 → P2.1, P4.1, P4.7 · RF2 → P2.2, P4.2 · RF3 → P2.2, P4.3 · RF4 → P4.4 · RF5 → P2.3, P4.5.

---

## Orden de ejecución y puntos de control

**Secuencia lineal recomendada:**

```
P0.1 → P0.2 →
P1.1 → P1.2 → P1.3 → P1.4 → P1.5 → 🔶
P2.1 → P2.2 → P2.3 → P2.4 → P2.5 → 🔶
P3.1 → P3.2 → P3.3 → P3.4 → P3.5 → P3.6 → 🔶
P4.1 → P4.2 → P4.3 → P4.4 → P4.5 → P4.6 → P4.7 → 🔶 (MVP funcional)
P5.1 → P5.2 → P5.3 → P5.4 → P5.5 → 🔶
P6.1 → P6.2 → P6.3 → P6.4 → 🔶
P7.1 → P7.2 → P7.3 → P7.4 → 🔶 (v0.1)
P8.x (opcional)
```

**Paralelización posible** (si usas varios agentes/ramas): dentro de la Fase 2 los servicios P2.1/P2.2/P2.3 son independientes entre sí (convergen en P2.4). En la Fase 3, P3.3/P3.4/P3.6 pueden ir en paralelo tras P3.2. El resto es mayormente secuencial por dependencias.

**Criterio de "MVP terminado"** (validar tras P4.7, contra SDD §2 y §3.1): escribir Markdown con preview en vivo <300ms; abrir, editar y guardar `.md` reales; aviso de cambios sin guardar; tema claro/oscuro persistente; todo local, sin servicios externos.

**Definición de hecho global por prompt:** compila (`go build ./...`, frontend build) · tests y lint en verde · criterios de aceptación marcados · commit con Conventional Commits · sin editar `frontend/wailsjs/` a mano.



