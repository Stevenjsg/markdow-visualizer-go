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
	// startupFile es la ruta absoluta pedida por la CLI (`mrw archivo.md`),
	// o "" si no hubo argumento. La asigna main.go antes de arrancar Wails.
	startupFile string
	// startupViewer refleja el flag -v/--view de la CLI: arrancar en modo
	// visor. También la asigna main.go.
	startupViewer bool
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

	// P5.3 + geometría completa: restaurar tamaño, posición y maximizado de
	// la sesión anterior. Firmas verificadas en wails v2.13.0
	// (pkg/runtime/window.go): WindowSetSize/WindowSetPosition/WindowMaximise.
	cfg, err := a.settings.Load()
	if err != nil {
		return
	}
	if cfg.WindowWidth > 0 && cfg.WindowHeight > 0 {
		runtime.WindowSetSize(ctx, cfg.WindowWidth, cfg.WindowHeight)
	}
	// (-1, -1) es el centinela "sin posición guardada": se deja centrada.
	// Nota: el runtime no expone los límites de cada monitor, así que una
	// posición de un monitor ya desconectado se restaura tal cual (la ventana
	// se recupera con Win+flechas); edge documentado en el checklist.
	if cfg.WindowX != -1 || cfg.WindowY != -1 {
		runtime.WindowSetPosition(ctx, cfg.WindowX, cfg.WindowY)
	}
	if cfg.WindowMaximised {
		runtime.WindowMaximise(ctx)
	}
}

// persistWindowState guarda la geometría de la ventana (tamaño, posición y
// maximizado) en settings al cerrar. Mejor esfuerzo: un fallo aquí nunca debe
// bloquear el cierre de la app.
func (a *App) persistWindowState(ctx context.Context) {
	// Minimizada: la geometría reportada no es representativa; se conserva
	// la última guardada.
	if runtime.WindowIsMinimised(ctx) {
		return
	}

	cfg, err := a.settings.Load()
	if err != nil {
		return
	}

	// Maximizada: solo se registra el estado; el tamaño/posición "normales"
	// previos se conservan para cuando el usuario des-maximice.
	if runtime.WindowIsMaximised(ctx) {
		cfg.WindowMaximised = true
		_ = a.settings.Save(cfg)
		return
	}

	width, height := runtime.WindowGetSize(ctx)
	if width <= 0 || height <= 0 {
		return
	}
	x, y := runtime.WindowGetPosition(ctx)
	cfg.WindowWidth = width
	cfg.WindowHeight = height
	cfg.WindowX = x
	cfg.WindowY = y
	cfg.WindowMaximised = false
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

// StartupFile es el archivo pedido por la línea de comandos (`mrw archivo.md`).
// Path == "" significa que no hubo argumento (arranque normal).
type StartupFile struct {
	Path    string `json:"path"`
	Content string `json:"content"`
	// IsNew indica que el archivo aún no existe: la UI abre un buffer vacío
	// con esa ruta y el archivo se crea en el primer Guardar (como `code`).
	IsNew bool `json:"isNew"`
	// Viewer indica que la CLI pidió arrancar en modo visor (-v/--view),
	// con o sin archivo.
	Viewer bool `json:"viewer"`
}

// GetStartupFile devuelve el archivo pedido por la CLI al arrancar, leyendo
// su contenido si existe (delegado en files.ReadFileIfExists).
func (a *App) GetStartupFile() (StartupFile, error) {
	if a.startupFile == "" {
		return StartupFile{Viewer: a.startupViewer}, nil
	}
	content, exists, err := a.files.ReadFileIfExists(a.startupFile)
	if err != nil {
		return StartupFile{}, err
	}
	return StartupFile{
		Path:    a.startupFile,
		Content: content,
		IsNew:   !exists,
		Viewer:  a.startupViewer,
	}, nil
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
		a.persistWindowState(ctx) // la ventana se va a cerrar de verdad
		return false              // permitir el cierre
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
