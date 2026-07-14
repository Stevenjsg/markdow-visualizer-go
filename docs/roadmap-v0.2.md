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
| M1 | Página 404 — "archivo no encontrado" | S | Alta |
| M2 | Modo visor (solo visualizar `.md`) | M | Alta |
| M3 | CLI `mrw` para Linux/macOS | S | Media |
| M4 | Extras del backlog (elegir) | variable | Baja |

Cada hito sigue la forma de trabajar del contrato: incrementos pequeños,
TDD en el backend, un entregable = un commit, verificación completa
(`go build/vet/test`, `golangci-lint`, `npm run lint`, `npm test`) antes de
declararse hecho.

---

## M1 — Página 404: archivo no encontrado

**Problema actual:** cuando el archivo que la app intenta abrir no está
disponible, la reacción es silenciosa o mínima:

- `lastOpenedFile` borrado/movido entre sesiones → la app arranca vacía sin
  explicar por qué.
- Ruta ilegible o directorio pasado a `mrw` → solo un aviso en la barra de
  estado.

**Propuesta:** un estado de UI dedicado, estilo "404", que ocupe el área del
preview cuando el archivo solicitado no se pudo cargar.

- Componente `FileNotFound` (React) con: código "404" grande, la ruta que
  falló, el motivo legible (no existe / es un directorio / sin permisos) y dos
  acciones: **"Abrir otro archivo…"** (dispara el diálogo de abrir) y
  **"Nuevo documento"** (limpia el estado y va al editor vacío).
- Backend: `GetStartupFile` y la restauración de `lastOpenedFile` ya
  distinguen los casos (`ReadFileIfExists` devuelve `exists`/error); solo hay
  que propagar el motivo al frontend en lugar de tragarlo.
- El caso `mrw inexistente.md` NO cambia: sigue abriendo un buffer nuevo que
  se crea al guardar (decisión tomada en v0.1, estilo `code`). El 404 aplica a
  rutas **ilegibles** (directorio, sin permisos, E/S) y al `lastOpenedFile`
  desaparecido.
- Tema claro/oscuro, accesible (`role="alert"`), textos en español.

**Criterios de aceptación**

- [ ] Borrar el último archivo abierto y reabrir la app → se muestra el 404
      con la ruta y el motivo; "Abrir otro archivo…" funciona.
- [ ] `mrw C:\una\carpeta` → 404 con motivo "es un directorio" (además del
      aviso actual o en su lugar).
- [ ] "Nuevo documento" deja la app en el estado vacío normal y el 404 no
      reaparece al reiniciar.
- [ ] Tests: Vitest del componente y de la rama de estado; Go para la
      propagación del motivo.

**Decisión a confirmar:** ¿el 404 reemplaza el aviso de la barra de estado o
conviven ambos? (propuesta: lo reemplaza; la barra queda para errores de
guardado).

---

## M2 — Modo visor: solo visualizar `.md`

**Objetivo:** usar MarkView como *lector* de Markdown, no solo como editor —
el preview a pantalla completa, sin el panel del editor.

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
   (fuera de alcance de M2; anotar como backlog si interesa).

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

---

## Orden sugerido y commits

1. `feat(ui): página 404 de archivo no encontrado` (M1)
2. `feat: modo visor de solo lectura` (M2, UI + settings)
3. `feat(cli): flag -v para abrir en modo visor` (M2, CLI)
4. `feat(cli): instalador mrw para Linux/macOS` (M3)
5. Backlog: un commit por extra elegido.

Antes de empezar M1: confirmar las decisiones marcadas y publicar v0.1.0
para que estos cambios entren limpios en la 0.2.0 del CHANGELOG.
