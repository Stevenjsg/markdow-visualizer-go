# Roadmap — MarkView v0.2 (post-release v0.1.0)

**Estado:** propuesta pendiente de confirmación humana (contrato del agente:
las decisiones que no están en el SDD se proponen antes de implementarse).
**Prerrequisito:** publicar v0.1.0 (checklist en [`release-checklist.md`](./release-checklist.md)).

Este roadmap continúa donde termina [`plan-desarrollo-ia.md`](./plan-desarrollo-ia.md)
(Fases 0–7). El [`roadmap.md`](./roadmap.md) original queda como referencia
histórica de aprendizaje de Go.

---

## Vista rápida

| Hito | Entregable | Tamaño | Prioridad |
|---|---|---|---|
| M1 | Modo visor (solo visualizar `.md`) | M | Alta |
| M2 | Navegación entre `.md` enlazados + página 404 (solo en visor) | M | Alta |
| M3 | CLI `mrw` para Linux/macOS | S | Media |
| M4 | Extras del backlog (elegir) | variable | Baja |

> **Decisión (2026-07-14):** los enlaces a otros `.md` navegan **solo en modo
> visor**. En modo edición el clic sobre un enlace no navega (el preview se
> queda quieto mientras escribes). Por eso el visor (M1) va antes que la
> navegación (M2).

Cada hito sigue la forma de trabajar del contrato: incrementos pequeños,
TDD en el backend, un entregable = un commit, verificación completa
(`go build/vet/test`, `golangci-lint`, `npm run lint`, `npm test`) antes de
declararse hecho.

---

## M1 — Modo visor: solo visualizar `.md`

**Objetivo:** usar MarkView como *lector* de Markdown, no solo como editor —
el preview a pantalla completa, sin el panel del editor. Es el prerrequisito
de la navegación entre archivos (M2).

**Propuesta:**

- **Toggle en la Toolbar** ("👁 Visor" con `aria-pressed`) y atajo
  `Ctrl/Cmd+Shift+V` (el de "abrir preview" en VS Code): oculta el editor y
  la botonera de formato, y el preview ocupa el 100% del ancho.
- **Estado en el store** (`viewerMode: boolean`) + persistencia en
  `settings.json` (`viewerMode`), mismo patrón que `wordWrap` y
  `formatToolbar`: campo nuevo deserializado sobre `DefaultSettings()`.
- **CLI:** `mrw -v archivo.md` (o `--view`) abre directamente en modo visor.
  `cliFilePath` hoy ignora los flags `-…`, así que hay que parsearlos de
  verdad (pequeño refactor con test).
- En modo visor el documento es intocable: no hay editor montado, así que no
  puede haber cambios sin guardar nuevos; si se activa con cambios pendientes,
  estos se conservan (el ● sigue visible) y vuelven a ser editables al salir.
- Abrir/Guardar siguen disponibles (guardar solo tiene sentido si había
  cambios previos).

**Criterios de aceptación**

- [ ] Toggle y atajo alternan el modo; el preview ocupa todo el ancho y el
      editor desaparece (no solo se encoge).
- [ ] El modo persiste entre sesiones.
- [ ] `mrw -v notas.md` abre en visor con el archivo renderizado.
- [ ] Con cambios sin guardar, entrar y salir del visor no pierde nada y el
      indicador ● se mantiene.
- [ ] Tests: store, Toolbar, parseo de flags del CLI (Go), settings round-trip.

**Decisiones a confirmar:**

1. ¿`viewerMode` persistente entre sesiones o solo por ventana? (propuesta:
   persistente, coherente con el resto de preferencias).
2. Nombre del flag del CLI: `-v/--view` vs `--viewer`.
3. ¿Asociar `mrw` como "Abrir con…" de Windows para `.md` en modo visor?
   (fuera de alcance de M1; anotar como backlog si interesa).

---

## M2 — Navegación entre `.md` enlazados + página 404 (solo en visor)

**Objetivo:** que, **en modo visor**, los enlaces relativos del preview
(`[otro doc](./otro.md)`) naveguen al archivo enlazado, como en un wiki; y si
la ruta no resuelve, mostrar una **página 404** en el área del preview.

**Decisión ya tomada (2026-07-14):** en modo edición los enlaces a `.md` NO
navegan — el clic mientras se escribe no debe cambiar de documento. La
experiencia wiki pertenece al modo lectura. (VS Code/Obsidian navegan siempre
desde el preview; aquí se prefiere el editor predecible.)

Hoy el preview no sigue enlaces a otros archivos: la navegación está bloqueada
por seguridad (security-review #6) y no hay resolución de rutas relativas.

**Propuesta:**

- **Interceptar clics** en los enlaces del preview (un solo listener delegado
  en el contenedor):
  - En **modo visor**, enlace relativo a `.md`/`.markdown` → resolver contra
    el **directorio del archivo actual** (backend: `filepath.Join(dir, href)`
    + `filepath.Clean`) y abrirlo en la app.
  - En **modo edición**, ese mismo clic no navega (sin efecto).
  - Ancla `#seccion` → scroll dentro del preview actual (ambos modos).
  - `http(s)://` → abrir en el **navegador del sistema**
    (`runtime.BrowserOpenURL`), nunca navegar la ventana (ambos modos).
  - Cualquier otro esquema (`file:`, `javascript:` ya lo quita bluemonday) →
    ignorar.
- **Página 404** (`FileNotFound`, React) cuando la ruta enlazada no existe o
  es ilegible: código "404" grande, la ruta que falló y el motivo (no existe /
  es un directorio / sin permisos), con acciones **"← Volver"** (regresa al
  documento desde el que se hizo clic, que sigue cargado) y
  **"Abrir otro archivo…"**. Tema claro/oscuro, `role="alert"`, español.
- **Cambios sin guardar:** si al entrar al visor venían cambios pendientes,
  navegar a otro `.md` reutiliza la confirmación Guardar/Descartar/Cancelar
  existente de "abrir otro archivo".
- Backend: nuevo método de la fachada `ResolveLink(currentPath, href)` que
  valida y resuelve; reutiliza `ReadFileIfExists`. TDD: casos de ruta
  relativa, `..`, ancla, ruta rota, directorio.

**Criterios de aceptación**

- [ ] En visor, clic en `[b](./b.md)` con `b.md` existente → carga `b.md` y
      la Toolbar muestra la nueva ruta.
- [ ] En modo edición, ese mismo clic NO navega.
- [ ] Enlace a `.md` inexistente (en visor) → página 404 con la ruta y el
      motivo; el documento actual no se pierde y "← Volver" lo restaura.
- [ ] Enlace `https://` → se abre en el navegador del sistema; la ventana de
      MarkView no navega (en ambos modos).
- [ ] Ancla `#titulo` → scroll dentro del preview, sin recarga.
- [ ] Con cambios sin guardar, navegar pide Guardar/Descartar/Cancelar.
- [ ] Tests: Go (resolución de rutas), Vitest (interceptor por modo +
      componente 404).

**Decisiones a confirmar:**

1. ¿Historial de navegación con "atrás/adelante" (botones ⬅➡ tipo navegador)
   o solo el "← Volver" del 404? (propuesta: solo "← Volver" en M2; historial
   completo al backlog).
2. Enlaces relativos a archivos NO Markdown (imágenes ya se renderizan;
   ¿un `.txt` o `.pdf` enlazado?) → propuesta: ignorar en M2; "abrir con la
   app del sistema" al backlog.

---

## M3 — CLI para Linux/macOS

`scripts/install-cli.sh`: instala `mrw` como lanzador en `~/.local/bin`
(symlink o wrapper con `nohup … &` para no bloquear la terminal), con
`--uninstall`. Documentar en README junto a la sección de Windows.
Ya existe la receta probada para Arch (build con `-tags webkit2_41`).

- [ ] `mrw archivo.md` funciona en Linux sin bloquear la terminal.
- [ ] `--uninstall` revierte limpio.

---

## M4 — Backlog (elegir por interés)

Heredado del Sprint 8 del roadmap original, más lo surgido en v0.1:

- Exportar a PDF/HTML.
- Sincronizar scroll entre editor y preview.
- Buscar/reemplazar en el editor.
- Pestañas múltiples (implicaría revisar la decisión de "sin single-instance").
- "Abrir con MarkView" en el menú contextual de Windows (registro) y
  asociación de extensión `.md`.
- Contador de palabras/caracteres en la barra de estado.
- Modo visor: seguir cambios del archivo en disco (auto-recarga tipo `tail`).
- Historial de navegación atrás/adelante entre `.md` enlazados (extiende M2).
- Enlaces relativos a archivos no Markdown (`.txt`, `.pdf`…): abrir con la
  app por defecto del sistema.
- Reutilizar la página 404 cuando `lastOpenedFile` fue borrado/movido (hoy la
  app arranca vacía en silencio).

---

## Orden sugerido y commits

1. `feat: modo visor de solo lectura` (M1, UI + settings)
2. `feat(cli): flag -v para abrir en modo visor` (M1, CLI)
3. `feat(preview): navegar enlaces .md en modo visor` (M2, interceptor + ResolveLink)
4. `feat(ui): página 404 de enlace roto` (M2)
5. `feat(cli): instalador mrw para Linux/macOS` (M3)
6. Backlog: un commit por extra elegido.

Antes de empezar M1: confirmar las decisiones aún marcadas y publicar v0.1.0
para que estos cambios entren limpios en la 0.2.0 del CHANGELOG.
