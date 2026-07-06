// MarkView: editor de Markdown de escritorio con previsualización en vivo.
// main cablea las dependencias (DI por constructor, SDD §5.1) y arranca Wails.
package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"

	"github.com/Stevenjsg/markdow-visualizer-go/internal/files"
	"github.com/Stevenjsg/markdow-visualizer-go/internal/markdown"
	"github.com/Stevenjsg/markdow-visualizer-go/internal/settings"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Cableado explícito de dependencias (DI por constructor, SDD §5.1).
	renderer := markdown.NewGoldmarkRenderer()
	fileService := files.NewService()
	settingsService := settings.NewService()

	app := NewApp(renderer, fileService, settingsService)

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
