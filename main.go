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

// cliFilePath devuelve la ruta absoluta del primer argumento posicional de la
// CLI (`mrw archivo.md`), o "" si no hay ninguno. Los flags (-…) se ignoran:
// wails dev inyecta los suyos. La ruta relativa se resuelve contra el cwd de
// la shell que invocó el comando.
func cliFilePath(args []string) string {
	for _, arg := range args {
		if arg == "" || strings.HasPrefix(arg, "-") {
			continue
		}
		abs, err := filepath.Abs(arg)
		if err != nil {
			return arg
		}
		return abs
	}
	return ""
}

func main() {
	// Cableado explícito de dependencias (DI por constructor, SDD §5.1).
	renderer := markdown.NewGoldmarkRenderer()
	fileService := files.NewService()
	settingsService := settings.NewService()

	app := NewApp(renderer, fileService, settingsService)
	// CLI (mrw): un argumento posicional abre ese archivo al arrancar. Cada
	// invocación es una ventana independiente (decisión: sin single instance;
	// settings.json lo escribe la última ventana en cerrarse).
	app.startupFile = cliFilePath(os.Args[1:])

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
