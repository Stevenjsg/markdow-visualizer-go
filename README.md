# 📝 MarkView — Editor de Markdown con Vista Previa en Vivo

> Aplicación de escritorio para escribir Markdown y ver el resultado renderizado en tiempo real. Proyecto personal construido con Go + Wails — también es el vehículo elegido para aprender Go desde cero.

> **Nombre de la app:** MarkView · **Module path Go:** `github.com/Stevenjsg/markdow-visualizer-go`

🚧 **Estado:** v0.1 candidata — app funcional, empaquetada y con metadata (Fases 0–7 del [plan](./docs/plan-desarrollo-ia.md) completadas en local). Pendiente: validar [`docs/release-checklist.md`](./docs/release-checklist.md) en máquina limpia y publicar el release v0.1.0 ([CHANGELOG](./CHANGELOG.md)).

---

## ✨ Características

- Editor de Markdown con resaltado de sintaxis
- Vista previa en vivo (debounce, sin lag al escribir)
- Abrir / Guardar / Guardar como sobre archivos `.md` locales
- Indicador y confirmación de cambios sin guardar (al cerrar o cambiar de archivo)
- Botonera de formato sobre el editor (colapsable con "Aa Formato")
- Modo visor de solo lectura: el preview a todo el ancho (👁 o `Ctrl/Cmd+Shift+V`)
- CLI `mrw archivo.md` para abrir desde la terminal, como `code` (`-v` = modo visor)
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

### Bindings Go ↔ frontend

Los bindings TypeScript de `frontend/wailsjs/` son **autogenerados — no editarlos a mano**.
Se regeneran automáticamente al correr `wails dev` (o `wails build`), y también se pueden
regenerar manualmente con:

```bash
wails generate module
```

Durante `wails dev` puedes abrir `http://localhost:34115` en un navegador para usar la app
con los bindings activos (útil para depurar con devtools).

### Build de producción

```bash
wails build
```

El ejecutable se genera en `build/bin/` (en Windows: `build/bin/MarkView.exe`, con
icono y metadata de versión embebidos desde `build/appicon.png` y `wails.json`).

Requisitos y particularidades por plataforma:

| Plataforma | Requisito de build | Nota |
|---|---|---|
| Windows | WebView2 Runtime (incluido en Windows 11 / instalable en 10) | `wails build` sin flags |
| Linux | `libgtk-3-dev` y `libwebkit2gtk-4.1-dev` | en distros con WebKitGTK 4.1 (Ubuntu 24.04+): `wails build -tags webkit2_41` |
| macOS | Xcode Command Line Tools (`xcode-select --install`) | `wails build` sin flags |

El workflow de CI ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)) compila
en las tres plataformas en cada push, para detectar problemas multiplataforma pronto.

### Instalar el CLI `mrw`

Instala el comando `mrw` para abrir MarkView desde la terminal, al estilo de `code`.
En una terminal **nueva** tras instalar:

```bash
mrw notas.md   # abre notas.md; si no existe, abre un buffer con esa ruta que se crea al guardar
mrw            # abre MarkView vacío
```

`mrw` no bloquea la terminal y cada invocación abre una ventana independiente.

#### Windows

```powershell
wails build                 # genera build/bin/MarkView.exe
.\scripts\install-cli.ps1   # copia a %LocalAppData%\Programs\MarkView y lo añade al PATH del usuario
```

En una terminal **nueva**:

```powershell
mrw notas.md   # abre notas.md; si no existe, abre un buffer con esa ruta que se crea al guardar
mrw            # abre MarkView vacío
```

`mrw` no bloquea la terminal y cada invocación abre una ventana independiente.
Para revertir: `.\scripts\install-cli.ps1 -Uninstall`. Con un binario de un
release descargado: `.\scripts\install-cli.ps1 -SourceDir C:\ruta\a\la\descarga`.

#### Linux

```bash
wails build -tags webkit2_41   # genera build/bin/MarkView (WebKitGTK 4.1)
./scripts/install-cli.sh       # instala en ~/.local/bin + icono y lanzador .desktop del menú
```

El script instala el binario `MarkView`, el comando `mrw` y una entrada en el menú
de aplicaciones, todo por usuario (sin `sudo`). Si `~/.local/bin` no está en tu
`PATH`, el script te avisa cómo añadirlo. Para revertir:
`./scripts/install-cli.sh --uninstall`. Con un binario descargado de un release:
`./scripts/install-cli.sh --source-dir ~/ruta/a/la/descarga`.

#### macOS

Copia el bundle generado por `wails build` (`build/bin/MarkView.app`) a `/Applications`
y ábrelo desde Launchpad. (El shim `mrw` para macOS aún no está automatizado.)

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

## ⌨️ Atajos de teclado

| Acción | Atajo |
|---|---|
| Abrir archivo | `Ctrl/Cmd+O` |
| Guardar · Guardar como | `Ctrl/Cmd+S` · `Ctrl/Cmd+Shift+S` |
| Cerrar archivo | `Ctrl/Cmd+W` |
| Negrita · Cursiva · Tachado | `Ctrl/Cmd+B` · `Ctrl/Cmd+I` · `Ctrl/Cmd+Shift+X` |
| Insertar enlace | `Ctrl/Cmd+K` |
| Título 1–3 | `Ctrl/Cmd+Alt+1…3` |
| Ajuste de línea del editor | `Alt+Z` |
| Modo visor (solo preview) | `Ctrl/Cmd+Shift+V` |

Los atajos de formato también están disponibles como botones en la **botonera
de formato** sobre el editor (se colapsa desde "Aa Formato" en la Toolbar).

## 📖 Documentación

- [`docs/roadmap.md`](./docs/roadmap.md) — plan de desarrollo por sprints
- [`docs/roadmap-v0.2.md`](./docs/roadmap-v0.2.md) — plan post-v0.1 (modo visor, navegación entre .md + 404, CLI Linux)
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
