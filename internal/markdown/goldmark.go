package markdown

import (
	"bytes"
	"fmt"
	"regexp"

	"github.com/microcosm-cc/bluemonday"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
)

// GoldmarkRenderer implementa Renderer usando goldmark con la extensión GFM
// (tablas, tachado y task lists) e IDs automáticos en encabezados.
//
// Decisiones:
//   - Sin WithUnsafe (P2.1): el HTML crudo del documento no se emite tal cual.
//   - Sin hard wraps (P2.1): una nueva línea simple no se convierte en <br>,
//     igual que el render de archivos .md en GitHub.
//   - Defensa en profundidad (P4.7): toda salida pasa por bluemonday antes de
//     devolverse; el Preview inyecta este HTML con dangerouslySetInnerHTML.
type GoldmarkRenderer struct {
	md     goldmark.Markdown
	policy *bluemonday.Policy
}

// Comprobación en compilación de que GoldmarkRenderer cumple la interface.
var _ Renderer = (*GoldmarkRenderer)(nil)

// newPreviewPolicy construye la política de saneado del preview: UGCPolicy
// (elimina scripts, iframes, handlers on* y URLs javascript:) ampliada con lo
// mínimo para que el GFM de goldmark sobreviva.
func newPreviewPolicy() *bluemonday.Policy {
	p := bluemonday.UGCPolicy()

	// Task lists GFM: goldmark emite <input checked="" disabled="" type="checkbox">.
	p.AllowAttrs("type").Matching(regexp.MustCompile(`^checkbox$`)).OnElements("input")
	p.AllowAttrs("checked", "disabled").
		Matching(regexp.MustCompile(`^(|checked|disabled)$`)).
		OnElements("input")

	// IDs de encabezado (parser.WithAutoHeadingID) para anclas internas.
	p.AllowAttrs("id").
		Matching(regexp.MustCompile(`^[\p{L}\p{N}\-_.]+$`)).
		OnElements("h1", "h2", "h3", "h4", "h5", "h6")

	// Alineación de columnas en tablas GFM.
	p.AllowAttrs("align").
		Matching(regexp.MustCompile(`^(left|center|right)$`)).
		OnElements("th", "td")

	// Clase language-* que goldmark pone en los bloques de código con lenguaje.
	p.AllowAttrs("class").
		Matching(regexp.MustCompile(`^language-[\w+-]+$`)).
		OnElements("code")

	// Preview local de escritorio: rel="nofollow" (pensado para webs con UGC)
	// solo ensucia la salida aquí.
	p.RequireNoFollowOnLinks(false)

	return p
}

// NewGoldmarkRenderer construye el renderizador por defecto de la aplicación.
func NewGoldmarkRenderer() *GoldmarkRenderer {
	return &GoldmarkRenderer{
		md: goldmark.New(
			goldmark.WithExtensions(extension.GFM),
			goldmark.WithParserOptions(parser.WithAutoHeadingID()),
		),
		policy: newPreviewPolicy(),
	}
}

// Render convierte Markdown a HTML saneado. La entrada vacía devuelve ""
// sin error.
func (r *GoldmarkRenderer) Render(source string) (string, error) {
	if source == "" {
		return "", nil
	}

	var buf bytes.Buffer
	if err := r.md.Convert([]byte(source), &buf); err != nil {
		return "", fmt.Errorf("convertir markdown a HTML: %w", err)
	}
	return r.policy.Sanitize(buf.String()), nil
}
