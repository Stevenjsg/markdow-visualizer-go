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
