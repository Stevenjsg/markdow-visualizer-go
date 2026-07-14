// MarkView: editor de Markdown de escritorio con previsualización en vivo.
// main cablea las dependencias (DI por constructor, SDD §5.1) y arranca Wails.
package main

import (
	"embed"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"

	"github.com/Stevenjsg/markdow-visualizer-go/internal/files"
	"github.com/Stevenjsg/markdow-visualizer-go/internal/markdown"
	"github.com/Stevenjsg/markdow-visualizer-go/internal/settings"
)

//go:embed all:frontend/dist
var assets embed.FS

// parseCLI interpreta los argumentos de `mrw [-v|--view] [archivo.md]`: el
// primer argumento posicional es la ruta del archivo a abrir (absoluta, se
// resuelve contra el cwd de la shell que invocó el comando) y -v/--view
// activa el modo visor. Los demás flags (-…) se ignoran: wails dev inyecta
// los suyos.
func parseCLI(args []string) (path string, viewer bool) {
	for _, arg := range args {
		switch {
		case arg == "-v" || arg == "--view":
			viewer = true
		case arg == "" || strings.HasPrefix(arg, "-"):
			// flag ajeno (p. ej. los de wails dev): se ignora
		case path == "":
			abs, err := filepath.Abs(arg)
			if err != nil {
				path = arg
			} else {
				path = abs
			}
		}
	}
	return path, viewer
}

func main() {
	// Cableado explícito de dependencias (DI por constructor, SDD §5.1).
	renderer := markdown.NewGoldmarkRenderer()
	fileService := files.NewService()
	settingsService := settings.NewService()

	app := NewApp(renderer, fileService, settingsService)
	// CLI (mrw): un argumento posicional abre ese archivo al arrancar y
	// -v/--view fuerza el modo visor. Cada invocación es una ventana
	// independiente (decisión: sin single instance; settings.json lo escribe
	// la última ventana en cerrarse).
	app.startupFile, app.startupViewer = parseCLI(os.Args[1:])

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "MarkView",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		OnBeforeClose:    app.beforeClose,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
