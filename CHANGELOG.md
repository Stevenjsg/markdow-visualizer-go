# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/);
versionado según [SemVer](https://semver.org/lang/es/).

## [0.1.0] — pendiente de publicación

Primera versión funcional de **MarkView**: editor de Markdown de escritorio con
vista previa en vivo, 100% local (Go + Wails v2 + React/TypeScript).

### Añadido

- **RF1 — Vista previa en vivo:** el HTML se renderiza en el backend (goldmark
  con GFM: tablas, tachado y task lists) con debounce de ~200 ms; actualización
  <300 ms tras dejar de escribir.
- **RF2 — Abrir:** diálogo nativo filtrado a `*.md;*.markdown` (botón y
  Ctrl/Cmd+O).
- **RF3 — Guardar / Guardar como:** con diálogo nativo de destino, indicador de
  guardado y atajos Ctrl/Cmd+S y Ctrl/Cmd+Shift+S.
- **RF4 — Protección de cambios:** indicador ● en Toolbar y título de ventana,
  y confirmación Guardar/Descartar/Cancelar al cerrar con cambios pendientes.
- **RF5 — Tema claro/oscuro persistente** entre sesiones.
- Editor **CodeMirror 6** con resaltado de sintaxis Markdown y tema sincronizado.
- **Paneles redimensionables** (ratón y teclado) y **restauración de sesión**:
  último archivo abierto y geometría completa de la ventana (tamaño, posición
  y estado maximizado).
- **Seguridad:** saneado del HTML del preview con bluemonday (defensa en
  profundidad sobre el escape por defecto de goldmark), verificado con tests de
  payloads XSS; informe en `docs/security-review.md`.
- Estados de UI (vacío/feedback/error legible), accesibilidad (atajos visibles,
  navegación por teclado, aria) y CI multiplataforma en GitHub Actions.
- **Cerrar archivo** (botón ✕ y Ctrl/Cmd+W) con confirmación si hay cambios;
  al cerrar, la app no restaura ese archivo en el siguiente arranque.
- **Ajuste de línea** del editor conmutable como VS Code (Alt+Z o botón de la
  Toolbar) y persistente; el preview ya no scrollea en horizontal (las tablas
  anchas y los bloques de código scrollean dentro de sí mismos).
- **Atajos de formato Markdown:** negrita Ctrl/Cmd+B, cursiva Ctrl/Cmd+I,
  tachado Ctrl/Cmd+Shift+X, enlace Ctrl/Cmd+K y títulos 1–3 con Ctrl/Cmd+Alt+1–3.
- **Botonera de formato** sobre el editor con los mismos comandos que los
  atajos; se colapsa desde "Aa Formato" en la Toolbar y su visibilidad
  persiste entre sesiones.
- **Confirmación al abrir otro archivo** con cambios sin guardar (mismo modal
  Guardar/Descartar/Cancelar que al cerrar).
- **CLI `mrw`:** `mrw archivo.md` abre MarkView desde la terminal (si el
  archivo no existe, se crea al guardar); instalación por usuario con
  `scripts/install-cli.ps1` (shim `mrw.cmd` + PATH, con `-Uninstall`).

[0.1.0]: https://github.com/Stevenjsg/markdow-visualizer-go/releases/tag/v0.1.0
