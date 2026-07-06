# Revisión de seguridad — MarkView (P6.4)

**Fecha:** 2026-07-06
**Alcance:** estado del código al cierre de la Fase 6 (previo al empaquetado v0.1).
**Revisiones previas relacionadas:** saneado XSS de P4.7, tests ampliados de P6.1.

## Modelo de amenazas

Aplicación de escritorio **local y monousuario**, sin red: no hay servidor, base de
datos ni peticiones salientes. Las entradas no confiables son:

1. **Contenido Markdown** — tecleado o cargado desde archivos `.md` arbitrarios
   (potencialmente descargados de internet y abiertos con la app).
2. **Rutas de archivo** — elegidas por el usuario mediante diálogos nativos.
3. **`settings.json`** — editable a mano por el usuario (o corruptible).

La superficie de ejecución es el WebView (WebView2/WebKit) que muestra el preview
y los cinco bindings expuestos por la fachada `App`.

## Hallazgos y estado

| # | Área | Hallazgo | Estado |
|---|------|----------|--------|
| 1 | XSS en preview | El HTML del preview se genera de texto del usuario y se inyecta con `dangerouslySetInnerHTML`. **Mitigado en dos capas:** goldmark sin `WithUnsafe` (el HTML crudo no se emite y las URLs `javascript:`/`data:` de enlaces e imágenes se descartan) y bluemonday `UGCPolicy` ampliada solo con lo imprescindible para GFM (checkbox de task lists, `id` de encabezados, `align` de tablas, `class="language-*"`). Payloads verificados por tests: `<script>`, `onerror`, `onclick`, `onload`/`<svg>`, `<iframe>`, `<object>`, `<form>`, `javascript:`, `data:text/html`, `style=`. | ✅ Sin vulnerabilidades conocidas (`TestRenderSanitizesXSS`, `TestRenderXSSVariants`, `TestRenderGFMSurvivesSanitize`) |
| 2 | Superficie de bindings | `ReadFile`/`WriteFile` aceptan cualquier ruta que les pase el frontend; no validan que provenga de un diálogo. Explotarlo exige código atacante ya ejecutando en el WebView (es decir, un XSS previo, mitigado en #1). Impacto máximo: leer/escribir con los permisos del usuario, igual que cualquier editor. | ⚠️ Aceptado para v0.1 (modelo local). **Mejora futura:** mantener en `App` una lista de rutas legitimadas por diálogos y rechazar el resto. |
| 3 | Symlinks | `os.ReadFile`/`os.WriteFile` siguen enlaces simbólicos. La ruta siempre la elige el usuario en un diálogo nativo, comportamiento idéntico al de cualquier editor de texto; la app no escribe en rutas que el usuario no eligió (verificado: los únicos `WriteFile` salen de "Guardar"/"Guardar como" y `settings.json`). | ✅ Sin cambio requerido |
| 4 | Persistencia (`settings.json`) | Se guarda en `os.UserConfigDir()/MarkView` con permisos 0644/0755. No contiene secretos (tema, última ruta, tamaño de ventana). Un JSON corrupto no impide arrancar: `Load()` cae a defaults (test `TestLoadCorruptFileFallsBackToDefaults`); un JSON parcial deja valores cero inofensivos. La ruta del último archivo abierto es el único dato "sensible" (privacidad leve, estándar en editores con "recientes"). | ✅ OK |
| 5 | Logs | El backend no registra contenido de documentos. Los mensajes de error incluyen la ruta del archivo (necesario para que el usuario entienda el fallo) y se muestran en la StatusBar/consola local; no salen de la máquina. | ✅ OK |
| 6 | Red y navegación | La app no hace peticiones externas; el WebView solo sirve assets embebidos. Los enlaces `http/https` del preview quedan permitidos por la policy; Wails bloquea por defecto la navegación externa del WebView en producción. | ⚠️ Verificar en la pasada manual de release que un clic en un enlace externo no navega el WebView. **Mejora futura:** interceptar clics de enlaces y abrirlos con `BrowserOpenURL`. |
| 7 | Cadena de dependencias | Backend: goldmark, bluemonday y wails v2 (pineadas en `go.sum`). Frontend sin dependencias de red en runtime; `npm audit` sin vulnerabilidades al cierre de la fase. CI ejecuta lint/tests en cada push. | ✅ OK |

## Conclusión

Sin hallazgos bloqueantes para v0.1. Quedan **dos mejoras anotadas** (validación de
rutas en la fachada, apertura de enlaces externos en el navegador del sistema) y una
**comprobación manual** para el checklist de release de la Fase 7 (#6).
