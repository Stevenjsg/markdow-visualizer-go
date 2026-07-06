package main

import (
	"context"

	"github.com/Stevenjsg/markdow-visualizer-go/internal/files"
	"github.com/Stevenjsg/markdow-visualizer-go/internal/markdown"
	"github.com/Stevenjsg/markdow-visualizer-go/internal/settings"
)

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
