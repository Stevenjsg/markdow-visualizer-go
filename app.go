package main

import (
	"context"
	"fmt"

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

// Greet es el método de ejemplo del scaffold (P1.5). Se elimina en P2.5.
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
