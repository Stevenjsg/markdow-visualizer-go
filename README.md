# 📝 MarkView — Editor de Markdown con Vista Previa en Vivo

> Aplicación de escritorio para escribir Markdown y ver el resultado renderizado en tiempo real. Proyecto personal construido con Go + Wails — también es el vehículo elegido para aprender Go desde cero.

> **Nombre de la app:** MarkView · **Module path Go:** `github.com/Stevenjsg/markdow-visualizer-go`

🚧 **Estado:** Fase 1 — scaffold Wails. El build lo guía [`docs/plan-desarrollo-ia.md`](./docs/plan-desarrollo-ia.md); ver también [`docs/roadmap.md`](./docs/roadmap.md).

---

## ✨ Características

- Editor de Markdown con resaltado de sintaxis
- Vista previa en vivo (debounce, sin lag al escribir)
- Abrir / Guardar / Guardar como sobre archivos `.md` locales
- Indicador de cambios sin guardar
- Tema claro/oscuro con preferencia persistente
- Multiplataforma: Windows, macOS y Linux

## 🧱 Stack

| Capa | Tecnología |
|---|---|
| Backend | Go + [Wails v2](https://wails.io) |
| Parseo de Markdown | [goldmark](https://github.com/yuin/goldmark) |
| Frontend | React + TypeScript *(o Vue 3)* + Tailwind CSS |
| Editor de texto | CodeMirror |

## 📂 Estructura del proyecto

```
.
├── main.go              # Punto de entrada de la app
├── app.go                # Struct App, lifecycle y métodos expuestos al frontend
├── frontend/             # React/Vue + Tailwind
│   ├── src/
│   ├── wailsjs/          # Bindings autogenerados (no editar a mano)
│   └── ...
├── docs/
│   ├── roadmap.md        # Plan de desarrollo por sprints
│   └── SDD.md            # Documento de diseño del software
├── go.mod
└── README.md
```

## 🚀 Primeros pasos

### Requisitos previos

- [Go](https://go.dev/dl/) 1.26 o superior
- [Node.js](https://nodejs.org/) 18+ (npm o pnpm)
- Wails CLI:
  ```bash
  go install github.com/wailsapp/wails/v2/cmd/wails@latest
  ```
- Verificar dependencias del sistema:
  ```bash
  wails doctor
  ```
  (WebView2 en Windows, WebKitGTK en Linux, Xcode Command Line Tools en macOS)

### Instalación y desarrollo

```bash
git clone https://github.com/Stevenjsg/markdow-visualizer-go.git
cd markdow-visualizer-go
wails dev
```

`wails dev` levanta la app en modo desarrollo con hot-reload tanto del frontend como del backend Go.

### Build de producción

```bash
wails build
```

El ejecutable se genera en `build/bin/`.

### Lint y formato

```bash
# Go (requiere golangci-lint: go install github.com/golangci/golangci-lint/v2/cmd/golangci-lint@latest)
golangci-lint run

# Frontend
cd frontend
npm run lint          # ESLint (flat config, TS estricto)
npm run format        # Prettier (escribe cambios)
npm run format:check  # Prettier (solo verifica)
```

La configuración vive en `.golangci.yml`, `frontend/eslint.config.js`, `frontend/.prettierrc` y `.editorconfig`.

## 📖 Documentación

- [`docs/roadmap.md`](./docs/roadmap.md) — plan de desarrollo por sprints
- [`docs/SDD.md`](./docs/SDD.md) — decisiones de arquitectura y diseño

## 🗺️ Roadmap (resumen)

| Hito | Sprints | Contenido |
|---|---|---|
| 1 | 1-2 | Fundamentos de Go |
| 2 | 3-4 | Integración con Wails + preview funcional |
| 3 | 5-6 | Persistencia de archivos + UI pulida |
| 4 | 7 | Release v0.1 distribuible |
| 5 | 8 (opcional) | Extras |

Detalle completo en [`docs/roadmap.md`](./docs/roadmap.md).

## 🤝 Contribuir

Proyecto personal de aprendizaje — no se esperan contribuciones externas por ahora, pero issues y sugerencias son bienvenidas.



## 👤 Autor

**Steven Jose Silva Gomez** — [stevenjsg.com](https://stevenjsg.com)
