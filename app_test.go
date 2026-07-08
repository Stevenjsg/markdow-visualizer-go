package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/Stevenjsg/markdow-visualizer-go/internal/files"
	"github.com/Stevenjsg/markdow-visualizer-go/internal/markdown"
	"github.com/Stevenjsg/markdow-visualizer-go/internal/settings"
)

// newTestApp cablea la fachada igual que main.go pero con settings aislados.
func newTestApp(t *testing.T) *App {
	t.Helper()
	return NewApp(
		markdown.NewGoldmarkRenderer(),
		files.NewService(),
		settings.NewServiceAt(t.TempDir()),
	)
}

// TestAppParseMarkdownEndToEnd (P4.1/RF1): el camino fachada -> renderer
// produce el HTML que consumirá el Preview, incluido GFM.
func TestAppParseMarkdownEndToEnd(t *testing.T) {
	app := newTestApp(t)

	html, err := app.ParseMarkdown("# Hola\n\n- [ ] tarea pendiente")
	if err != nil {
		t.Fatalf("ParseMarkdown devolvió error: %v", err)
	}
	for _, want := range []string{`<h1 id="hola">Hola</h1>`, `type="checkbox"`} {
		if !strings.Contains(html, want) {
			t.Errorf("ParseMarkdown: falta %q en la salida %q", want, html)
		}
	}
}

// TestAppGetStartupFile (CLI): la fachada expone el archivo pedido por la
// línea de comandos — vacío sin argumento, con contenido si existe, y como
// buffer nuevo (IsNew) si aún no existe.
func TestAppGetStartupFile(t *testing.T) {
	app := newTestApp(t)

	// Sin argumento de CLI: valor cero (arranque normal).
	got, err := app.GetStartupFile()
	if err != nil {
		t.Fatalf("GetStartupFile sin argumento devolvió error: %v", err)
	}
	if got.Path != "" {
		t.Errorf("sin argumento se esperaba Path vacío; got %+v", got)
	}

	// Archivo existente: se devuelve su contenido.
	existing := filepath.Join(t.TempDir(), "nota.md")
	if err := os.WriteFile(existing, []byte("# hola"), 0o644); err != nil {
		t.Fatalf("preparando el archivo: %v", err)
	}
	app.startupFile = existing
	got, err = app.GetStartupFile()
	if err != nil {
		t.Fatalf("GetStartupFile con archivo existente devolvió error: %v", err)
	}
	if got.IsNew || got.Content != "# hola" || got.Path != existing {
		t.Errorf("archivo existente mal reportado: %+v", got)
	}

	// Archivo inexistente: buffer nuevo con esa ruta (se crea al guardar).
	app.startupFile = filepath.Join(t.TempDir(), "nuevo.md")
	got, err = app.GetStartupFile()
	if err != nil {
		t.Fatalf("GetStartupFile con archivo inexistente devolvió error: %v", err)
	}
	if !got.IsNew || got.Content != "" || got.Path != app.startupFile {
		t.Errorf("archivo nuevo mal reportado: %+v", got)
	}
}

// TestAppSettingsRoundTrip: la fachada delega Load/Save en el servicio.
func TestAppSettingsRoundTrip(t *testing.T) {
	app := newTestApp(t)

	cfg, err := app.LoadSettings()
	if err != nil {
		t.Fatalf("LoadSettings devolvió error: %v", err)
	}
	cfg.Theme = "light"
	if err := app.SaveSettings(cfg); err != nil {
		t.Fatalf("SaveSettings devolvió error: %v", err)
	}
	got, err := app.LoadSettings()
	if err != nil {
		t.Fatalf("LoadSettings tras guardar devolvió error: %v", err)
	}
	if got.Theme != "light" {
		t.Errorf("el tema no se persistió a través de la fachada: %+v", got)
	}
}
