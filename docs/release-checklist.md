# Checklist de release — MarkView v0.1

**Objetivo:** validar el binario en un entorno "limpio" (sin toolchain de
desarrollo: sin Go, Node ni Wails) antes de publicar la v0.1.
**Binario a probar:** `build/bin/MarkView.exe` (Windows) o el artefacto del job
`wails build` de CI para otras plataformas.

> Marca cada casilla al verificarla. Si algo falla, anota el detalle al final y
> no publiques hasta resolverlo.

## 0. Entorno

- [ ] Máquina/VM sin Go, Node ni Wails instalados.
- [ ] Windows: WebView2 Runtime presente (Windows 11 lo trae; en Windows 10
      instalarlo desde https://developer.microsoft.com/microsoft-edge/webview2/).
- [ ] Anotar SO y versión probados: __________________

## 1. Arranque

- [ ] La app abre sin errores y sin instalar nada más (dependencia de runtime
      faltante = hallazgo).
- [ ] El icono de MarkView se ve en la ventana y en la barra de tareas.
- [ ] Título de la ventana: "MarkView".
- [ ] Primer arranque: editor vacío con el estado vacío del Preview visible.

## 2. RF1 — Preview en vivo

- [ ] Escribir Markdown actualiza el Preview solo, sin pulsar nada.
- [ ] La actualización tarda <300 ms tras dejar de escribir (sin lag perceptible).
- [ ] GFM se renderiza: tabla, `- [ ]` task list, ~~tachado~~ y bloque de código
      con resaltado de sintaxis en el editor.
- [ ] Pegar `<script>alert(1)</script>` NO ejecuta nada ni aparece como script
      en el Preview (saneado activo).

## 3. RF2 — Abrir

- [ ] "Abrir" (botón y Ctrl/Cmd+O) muestra el diálogo nativo filtrado a
      `*.md;*.markdown`.
- [ ] Abrir un `.md` real carga contenido, renderiza el Preview y muestra la
      ruta en la Toolbar sin indicador ●.
- [ ] Cancelar el diálogo no rompe nada.

## 4. RF3 — Guardar / Guardar como

- [ ] Editar y "Guardar" (Ctrl/Cmd+S) persiste los cambios (verificar reabriendo
      el archivo).
- [ ] "Guardar como" (Ctrl/Cmd+Shift+S) crea un archivo nuevo y la Toolbar pasa
      a mostrar la nueva ruta.
- [ ] Tras guardar, el indicador ● desaparece y aparece el aviso "Guardado en…".
- [ ] Documento nuevo sin ruta + "Guardar" cae automáticamente en "Guardar como".

## 5. RF4 — Cambios sin guardar

- [ ] Con cambios pendientes: ● en la Toolbar y título "● MarkView (sin guardar)".
- [ ] Intentar cerrar con cambios muestra el modal Guardar/Descartar/Cancelar.
- [ ] "Cancelar" mantiene la app abierta; "Descartar" cierra sin guardar;
      "Guardar" guarda y cierra.
- [ ] Sin cambios pendientes, la app cierra directamente.

## 6. RF5 — Tema persistente

- [ ] El toggle 🌙/☀️ cambia el tema al instante (editor y preview incluidos).
- [ ] Cerrar y reabrir la app respeta el último tema elegido.

## 7. Persistencia de sesión

- [ ] Reabrir la app restaura el último archivo abierto.
- [ ] El tamaño de ventana se conserva entre sesiones.
- [ ] La **posición** de la ventana se conserva entre sesiones (moverla,
      cerrar, reabrir). Nota: si la posición pertenecía a un monitor ya
      desconectado, la ventana puede quedar fuera de pantalla; se recupera
      con Win+flechas (limitación documentada: el runtime no expone los
      límites de cada monitor).
- [ ] Cerrar **maximizada** y reabrir: arranca maximizada, y al des-maximizar
      recupera el tamaño/posición normales previos.
- [ ] Borrar/mover el último archivo y reabrir: la app arranca vacía, sin error.
- [ ] `settings.json` aparece en el directorio de config del usuario
      (Windows: `%AppData%\MarkView\settings.json`).

## 8. Seguridad (pendiente de security-review.md #6)

- [ ] Clic en un enlace `https://` del Preview: la ventana NO navega fuera de la
      app (si navega, anotar como hallazgo antes de publicar).

## 9. Varios

- [ ] Paneles redimensionables con el divisor (ratón y flechas con foco).
- [ ] Un error de E/S (p. ej. guardar en ruta protegida como `C:\Windows\`) se
      comunica de forma legible en la barra de estado, sin romper la app.
- [ ] **Cerrar archivo** (✕ o Ctrl/Cmd+W): sin cambios cierra directo; con
      cambios muestra Guardar/Descartar/Cancelar. Tras cerrar y reiniciar, la
      app NO restaura el archivo cerrado.
- [ ] **Ajuste de línea**: Alt+Z y el botón "⤶ Ajuste" lo alternan; con wrap
      desactivado el editor scrollea en horizontal; la preferencia persiste
      tras reiniciar.
- [ ] **Atajos de formato** en el editor: Ctrl+B/I/K, Ctrl+Shift+X y
      Ctrl+Alt+1–3 aplican el Markdown esperado sobre la selección.
- [ ] Documento con una tabla ancha y una URL larguísima: el panel del preview
      NO scrollea en horizontal (la tabla sí, por dentro).
- [ ] **Botonera de formato**: los botones B/I/S/enlace/H1–H3 aplican el
      Markdown sobre la selección sin que el editor pierda la selección;
      "Aa Formato" la colapsa/expande y el estado persiste tras reiniciar.
- [ ] **Abrir con cambios sin guardar**: botón Abrir o Ctrl/Cmd+O con ● activo
      muestra Guardar/Descartar/Cancelar antes del diálogo de apertura.

## 10. CLI `mrw` (Windows)

- [ ] `scripts\install-cli.ps1` instala sin errores y sin pedir administrador;
      en una terminal NUEVA `mrw` está en el PATH.
- [ ] `mrw archivo.md` (ruta relativa) abre el archivo y no bloquea la terminal.
- [ ] `mrw inexistente.md` abre un buffer con esa ruta; al Guardar, el archivo
      se crea en disco.
- [ ] `mrw otro.md` con la app ya abierta: se abre una segunda ventana
      independiente (decisión: sin single-instance).
- [ ] `mrw C:\una\carpeta` muestra un error legible en la barra de estado y la
      app arranca vacía.
- [ ] `scripts\install-cli.ps1 -Uninstall` elimina la carpeta y la entrada del
      PATH de usuario.

---

## Hallazgos

| # | Descripción | Gravedad | Estado |
|---|---|---|---|
|   |   |   |   |

**Resultado:** ☐ Apto para publicar v0.1 · ☐ Requiere correcciones
