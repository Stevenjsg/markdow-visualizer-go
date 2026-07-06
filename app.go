package main

import (
	"context"
	"fmt"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/Stevenjsg/markdow-visualizer-go/internal/files"
	"github.com/Stevenjsg/markdow-visualizer-go/internal/markdown"
	"github.com/Stevenjsg/markdow-visualizer-go/internal/settings"
)

// markdownFilters restringe los diálogos nativos a archivos Markdown (RF2/RF3).
var markdownFilters = []runtime.FileFilter{
	{DisplayName: "Markdown (*.md, *.markdown)", Pattern: "*.md;*.markdown"},
}

// App es la fachada bindeada a Wails (SDD §5.1): la única superficie que ve
// el frontend. No implementa lógica de negocio; cada método delega en el
// servicio correspondiente.
type App struct {
	ctx      context.Context
	renderer markdown.Renderer
	files    *files.Service
	settings *settings.Service

	// isDirty refleja si el frontend tiene cambios sin guardar (RF4).
	isDirty bool
	// forceQuit salta la confirmación cuando el usuario ya decidió cerrar.
	forceQuit bool
}

// NewApp recibe sus dependencias por constructor (DI explícita, sin
// frameworks); el cableado vive en main.go.
func NewApp(renderer markdown.Renderer, filesSvc *files.Service, settingsSvc *settings.Service) *App {
	return &App{
		renderer: renderer,
		files:    filesSvc,
		settings: settingsSvc,
	}
}

// startup guarda el context de Wails para poder invocar el runtime
// (diálogos, eventos, ventana) desde los métodos de la fachada.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// P5.3: restaurar el tamaño de ventana de la sesión anterior.
	// Firma verificada en wails v2.13.0 (pkg/runtime/window.go):
	// WindowSetSize(ctx, width, height) / WindowGetSize(ctx) (int, int).
	if cfg, err := a.settings.Load(); err == nil && cfg.WindowWidth > 0 && cfg.WindowHeight > 0 {
		runtime.WindowSetSize(ctx, cfg.WindowWidth, cfg.WindowHeight)
	}
}

// persistWindowSize guarda el tamaño actual de la ventana en settings (P5.3).
// Mejor esfuerzo: un fallo aquí nunca debe bloquear el cierre de la app.
func (a *App) persistWindowSize(ctx context.Context) {
	width, height := runtime.WindowGetSize(ctx)
	if width <= 0 || height <= 0 {
		return
	}
	cfg, err := a.settings.Load()
	if err != nil {
		return
	}
	cfg.WindowWidth = width
	cfg.WindowHeight = height
	_ = a.settings.Save(cfg)
}

// ParseMarkdown convierte Markdown a HTML delegando en el Renderer (RF1).
func (a *App) ParseMarkdown(content string) (string, error) {
	return a.renderer.Render(content)
}

// ReadFile devuelve el contenido del archivo indicado (RF2).
func (a *App) ReadFile(path string) (string, error) {
	return a.files.ReadFile(path)
}

// WriteFile crea o sobrescribe el archivo indicado con el contenido (RF3).
func (a *App) WriteFile(path, content string) error {
	return a.files.WriteFile(path, content)
}

// LoadSettings carga la configuración persistida del usuario (RF5).
func (a *App) LoadSettings() (settings.Settings, error) {
	return a.settings.Load()
}

// SaveSettings persiste la configuración del usuario (RF5).
func (a *App) SaveSettings(cfg settings.Settings) error {
	return a.settings.Save(cfg)
}

// FileContent agrupa la ruta elegida en un diálogo y su contenido (RF2).
type FileContent struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}

// OpenFileDialog muestra el diálogo nativo de apertura filtrado a Markdown,
// lee el archivo elegido y devuelve ruta y contenido. Si el usuario cancela,
// devuelve el valor cero (Path == "") sin error.
// Firma verificada en wails v2.13.0 (pkg/runtime/dialog.go):
// OpenFileDialog(ctx, OpenDialogOptions) (string, error).
func (a *App) OpenFileDialog() (FileContent, error) {
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title:   "Abrir archivo Markdown",
		Filters: markdownFilters,
	})
	if err != nil {
		return FileContent{}, fmt.Errorf("mostrar el diálogo de apertura: %w", err)
	}
	if path == "" {
		return FileContent{}, nil // usuario canceló
	}

	content, err := a.files.ReadFile(path)
	if err != nil {
		return FileContent{}, err
	}
	return FileContent{Path: path, Content: content}, nil
}

// SetDirty sincroniza al backend el estado "cambios sin guardar" del frontend
// y lo refleja en el título de la ventana (RF4).
func (a *App) SetDirty(dirty bool) {
	a.isDirty = dirty
	title := "MarkView"
	if dirty {
		title = "● MarkView (sin guardar)"
	}
	runtime.WindowSetTitle(a.ctx, title)
}

// ForceClose cierra la aplicación saltándose la confirmación: la decisión ya
// se tomó en el modal del frontend (Guardar o Descartar).
func (a *App) ForceClose() {
	a.forceQuit = true
	runtime.Quit(a.ctx)
}

// beforeClose intercepta el cierre de la ventana (OnBeforeClose de Wails).
// Sin cambios pendientes deja cerrar; con cambios emite "close-requested" y
// previene el cierre para que el frontend muestre el modal con
// Guardar / Descartar / Cancelar.
//
// Decisión P4.4: en Windows runtime.MessageDialog usa el MessageBox nativo
// con botones fijos (Yes/No/Ok/Cancel…), sin tres botones personalizados
// (verificado en wails v2.13.0, internal/frontend/desktop/windows/dialog.go),
// así que la confirmación vive en un modal del frontend.
func (a *App) beforeClose(ctx context.Context) bool {
	if a.forceQuit || !a.isDirty {
		a.persistWindowSize(ctx) // P5.3: la ventana se va a cerrar de verdad
		return false             // permitir el cierre
	}
	runtime.EventsEmit(ctx, "close-requested")
	return true // prevenir el cierre; el frontend decide
}

// SaveFileDialog muestra el diálogo nativo "Guardar como" filtrado a Markdown
// y devuelve la ruta elegida ("" si el usuario cancela). La escritura la hace
// el frontend con App.WriteFile (P2.5), que ya delega en files.WriteFile.
// Firma verificada en wails v2.13.0 (pkg/runtime/dialog.go):
// SaveFileDialog(ctx, SaveDialogOptions) (string, error).
func (a *App) SaveFileDialog() (string, error) {
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Guardar archivo Markdown",
		DefaultFilename: "documento.md",
		Filters:         markdownFilters,
	})
	if err != nil {
		return "", fmt.Errorf("mostrar el diálogo de guardado: %w", err)
	}
	return path, nil
}
