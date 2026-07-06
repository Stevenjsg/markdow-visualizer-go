package markdown

import (
	"bytes"
	"fmt"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
)

// GoldmarkRenderer implementa Renderer usando goldmark con la extensión GFM
// (tablas, tachado y task lists) e IDs automáticos en encabezados.
//
// Decisiones (P2.1):
//   - Sin WithUnsafe: el HTML crudo del documento no se emite tal cual
//     (goldmark lo omite/escapa por defecto). El saneado en profundidad con
//     bluemonday se añade en P4.7.
//   - Sin hard wraps: una nueva línea simple no se convierte en <br>, igual
//     que el render de archivos .md en GitHub.
type GoldmarkRenderer struct {
	md goldmark.Markdown
}

// Comprobación en compilación de que GoldmarkRenderer cumple la interface.
var _ Renderer = (*GoldmarkRenderer)(nil)

// NewGoldmarkRenderer construye el renderizador por defecto de la aplicación.
func NewGoldmarkRenderer() *GoldmarkRenderer {
	return &GoldmarkRenderer{
		md: goldmark.New(
			goldmark.WithExtensions(extension.GFM),
			goldmark.WithParserOptions(parser.WithAutoHeadingID()),
		),
	}
}

// Render convierte Markdown a HTML. La entrada vacía devuelve "" sin error.
func (r *GoldmarkRenderer) Render(source string) (string, error) {
	if source == "" {
		return "", nil
	}

	var buf bytes.Buffer
	if err := r.md.Convert([]byte(source), &buf); err != nil {
		return "", fmt.Errorf("convertir markdown a HTML: %w", err)
	}
	return buf.String(), nil
}
