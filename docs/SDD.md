# SDD — Editor/Previsualizador de Markdown

**Versión:** 0.2 (+ patrones de diseño y estructura de carpetas)
**Fecha:** 2026-06-29
**Estado:** Propuesto
**Documentos relacionados:** [`docs/roadmap.md`](./roadmap.md)

---

## 1. Resumen

Aplicación de escritorio para editar archivos Markdown con previsualización en vivo del HTML renderizado. Es un proyecto personal con doble objetivo: tener una herramienta funcional propia y servir como vehículo de aprendizaje de Go.

## 2. Objetivo y alcance

**Objetivo:** un editor de Markdown ligero, multiplataforma, con preview en tiempo real, sin dependencias de servicios externos (todo corre localmente).

**Dentro del alcance (MVP):**
- Editor de texto con resaltado de sintaxis Markdown
- Preview en vivo (HTML renderizado) sincronizado con el editor
- Abrir / Guardar / Guardar como, sobre archivos `.md` locales
- Indicador de cambios sin guardar
- Tema claro/oscuro y configuración persistente
- Build distribuible para Windows, macOS y Linux

**Fuera de alcance (por ahora — ver Sprint 8 de `roadmap.md`):**
- Exportar a PDF/HTML
- Pestañas múltiples / multi-documento
- Buscar y reemplazar
- Sincronización en la nube o colaboración en tiempo real
- Extensiones de Markdown no estándar (plugins de terceros)

## 3. Requisitos

### 3.1 Funcionales
- RF1: El usuario puede escribir Markdown y ver el HTML resultante actualizarse automáticamente (debounce, no en cada tecla).
- RF2: El usuario puede abrir un archivo `.md` existente desde el disco mediante diálogo nativo.
- RF3: El usuario puede guardar el contenido actual, sobrescribiendo o como archivo nuevo.
- RF4: La app indica visualmente si hay cambios sin guardar y pide confirmación antes de cerrar/descartar.
- RF5: El usuario puede alternar entre tema claro y oscuro, y la preferencia persiste entre sesiones.

### 3.2 No funcionales
- Aplicación monousuario y local; no requiere backend remoto ni base de datos.
- Latencia de actualización del preview objetivo: <300ms tras dejar de escribir.
- Tamaño de binario razonable (criterio de elección de Wails sobre Electron).
- Soporte multiplataforma: Windows, macOS, Linux.
- Código mantenible y didáctico — es también el proyecto de aprendizaje de Go del autor, por lo que se priorizan patrones idiomáticos de Go sobre atajos.

### 3.3 Restricciones
- Stack ya decidido: **Go** (backend) + **Wails v2** + **React + TypeScript** (alternativa válida: Vue 3, intercambiable sin impacto arquitectónico) + **Tailwind CSS**.
- Desarrollador único, sin experiencia previa en Go al iniciar el proyecto.
- Sin fecha límite fija; ritmo de desarrollo ~10-15h/semana (ver `roadmap.md`).

> **Nota:** este documento asume React + TypeScript como frontend por ser la opción primaria del stack habitual del autor. Si se decide usar Vue 3 en su lugar, solo cambia la capa de componentes (sección 5); el resto del diseño no se ve afectado.

## 4. Arquitectura general

```
┌────────────────────────────────┐          ┌──────────────────────────────┐
│      Frontend (WebView)        │          │         Backend (Go)         │
│   React + TS + Tailwind        │          │       Runtime de Wails       │
│                                 │ bindings │                              │
│  - Editor (CodeMirror)         │ <──────> │  - FileService               │
│  - Preview (HTML renderizado)  │  JS↔Go   │  - MarkdownService (goldmark)│
│  - Toolbar / Settings UI       │          │  - SettingsService (JSON)   │
└────────────────────────────────┘          └──────────────┬───────────────┘
                                                            │
                                                            ▼
                                              Sistema de archivos local
                                          (.md del usuario + config JSON)
```

No hay servidor HTTP ni base de datos: Wails empaqueta un WebView nativo y genera *bindings* automáticos que permiten llamar métodos Go exportados directamente desde el frontend como si fueran funciones JS asíncronas.

## 5. Componentes principales

### Backend (Go)
| Componente | Responsabilidad |
|---|---|
| `App` | Punto de entrada, ciclo de vida (`OnStartup`, `OnShutdown`) |
| `MarkdownService` | Envuelve `goldmark`; `ParseMarkdown(contenido string) (string, error)` |
| `FileService` | `OpenFile()`, `SaveFile(path, contenido string) error`, `SaveFileAs()` vía diálogos nativos de Wails |
| `SettingsService` | Lee/escribe `settings.json` en el directorio de config del usuario (tema, último archivo, tamaño de ventana) |

### Frontend (React + TS)
| Componente | Responsabilidad |
|---|---|
| `Editor` | Wrapper sobre CodeMirror con resaltado de sintaxis Markdown |
| `Preview` | Renderiza el HTML recibido del backend |
| `Toolbar` | Acciones: abrir, guardar, cambiar tema |
| `useDebouncedMarkdown` | Hook que llama al backend tras una pausa de escritura |

Gestión de estado: Context API o un store ligero (Zustand) — no se justifica Redux para el tamaño de esta app. Decisión final pendiente, sin impacto arquitectónico relevante.

### 5.1 Patrones de diseño

Se adoptan patrones idiomáticos de Go, evitando frameworks de DI o arquitecturas sobredimensionadas para una app de un solo usuario:

- **Facade** — el struct `App` es la única superficie que Wails expone al frontend (`App.ParseMarkdown()`, `App.OpenFile()`, etc.). Internamente delega toda la lógica a los servicios (`MarkdownService`, `FileService`, `SettingsService`); `App` no implementa lógica de negocio.

  ```go
  func (a *App) ParseMarkdown(content string) (string, error) {
      return a.renderer.Render(content) // delega, no implementa
  }
  ```

- **Inyección de dependencias por constructor** — sin framework de DI (no es idiomático en Go). El wiring se hace explícitamente en `main.go`, pasando las dependencias concretas al constructor de `App`:

  ```go
  renderer := markdown.NewGoldmarkRenderer()
  fileService := files.NewService()
  settingsService := settings.NewService()

  app := NewApp(renderer, fileService, settingsService)
  ```

- **Strategy (vía interfaces)** — el renderizado de Markdown se abstrae detrás de una interfaz pequeña:

  ```go
  type Renderer interface {
      Render(source string) (string, error)
  }
  ```

  `GoldmarkRenderer` la implementa. Permite sustituir la implementación o inyectar un mock en tests sin tocar `App`.

- **Observer** (ya provisto por Wails) — el sistema de eventos `EventsEmit`/`EventsOn` cubre los casos en que el backend necesita notificar al frontend de forma asíncrona (p. ej. archivo modificado externamente).

**Descartado deliberadamente:** Repository pattern — pensado para abstraer fuentes de datos intercambiables (SQL, APIs, etc.). Aquí solo hay archivos planos en disco, así que añadiría ceremonia sin beneficio real.

### 5.2 Estructura de carpetas

```
.
├── main.go                    # Wiring: inyección de dependencias
├── app.go                     # struct App (fachada bindeada a Wails)
├── internal/
│   ├── markdown/
│   │   ├── renderer.go        # interface Renderer
│   │   └── goldmark.go        # implementación con goldmark
│   ├── files/
│   │   └── service.go         # Open/Save/SaveAs
│   └── settings/
│       └── service.go         # Load/Save de settings.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Editor/
│   │   │   ├── Preview/
│   │   │   └── Toolbar/
│   │   ├── hooks/
│   │   │   └── useDebouncedMarkdown.ts
│   │   ├── store/              # Zustand o Context
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── wailsjs/                 # bindings autogenerados — no editar a mano
│   └── package.json
├── docs/
│   ├── roadmap.md
│   ├── SDD.md
│   └── adr/                     # ADRs futuros
├── go.mod
├── go.sum
├── wails.json
└── README.md
```

**Por qué `internal/` y no `pkg/` o carpeta plana:** cualquier paquete dentro de `internal/` no puede importarse desde fuera del módulo — el propio compilador de Go lo impide. Como esto es una aplicación (no una librería pensada para ser importada por terceros), es la opción correcta; evita además la sobreingeniería del layout "enterprise" no oficial (`golang-standards/project-layout`), excesivo para el tamaño de este proyecto.

## 6. Flujo de datos principal (caso de uso: editar y previsualizar)

1. El usuario escribe en el editor.
2. El frontend aplica debounce (~200ms).
3. El frontend invoca `ParseMarkdown(texto)` a través del binding generado por Wails.
4. Go ejecuta `goldmark` y devuelve el HTML resultante.
5. El frontend inyecta el HTML en el panel de preview.

## 7. Modelo de datos / configuración

No existe base de datos. El único estado persistente es un archivo de configuración local:

```json
{
  "theme": "dark",
  "lastOpenedFile": "/home/usuario/notas/readme.md",
  "windowWidth": 1200,
  "windowHeight": 800
}
```

El resto del "modelo de datos" son los propios archivos `.md` del usuario en disco — la app no los transforma de forma destructiva.

## 8. Decisiones de diseño clave

| Decisión | Opción elegida | Motivo |
|---|---|---|
| Framework de escritorio | Wails v2 (no v3, no Electron) | v3 sigue en alfa; Wails produce binarios más ligeros que Electron y permite escribir lógica real en Go |
| Parseo de Markdown | En el backend (Go + `goldmark`) | Maximiza la práctica de Go y mantiene una única fuente de verdad del renderizado |
| Persistencia de configuración | Archivo JSON local vía `encoding/json` | Simplicidad; no se justifica una base de datos para este volumen de datos |
| Editor de texto | CodeMirror | Ligero, con buen soporte de resaltado para Markdown, integrable en React/Vue |

Decisiones más detalladas (con alternativas descartadas y trade-offs) se documentarán como ADRs individuales en `docs/adr/` a medida que surjan.

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Curva de aprendizaje de Go alarga los tiempos | Roadmap dividido en sprints incrementales (`docs/roadmap.md`) |
| Empaquetado multiplataforma (firma de código en macOS, dependencias de WebView2/WebKitGTK) | Probar `wails build` en cada plataforma disponible cuanto antes; dejar firma de código para una fase posterior |
| Falta de experiencia con el patrón de bindings de Wails | Sprint 3 dedicado exclusivamente a esto antes de construir features reales |

## 10. Plan de entrega

Ver el desglose completo por sprints en [`docs/roadmap.md`](./roadmap.md). Resumen de hitos:

- **Hito 1** (Sprints 1-2): Fundamentos de Go
- **Hito 2** (Sprints 3-4): Integración con Wails + preview funcional (MVP interno)
- **Hito 3** (Sprints 5-6): Persistencia de archivos + UI pulida
- **Hito 4** (Sprint 7): Release v0.1 distribuible
- **Hito 5** (Sprint 8, opcional): Extras

## 11. Referencias

- [`docs/roadmap.md`](./roadmap.md)
- [Documentación de Wails v2](https://wails.io/docs/introduction)
- [goldmark](https://github.com/yuin/goldmark)