package markdown

import (
	"strings"
	"testing"
)

// TestRenderEmpty: la entrada vacía devuelve "" sin error (criterio P2.1).
func TestRenderEmpty(t *testing.T) {
	r := NewGoldmarkRenderer()

	got, err := r.Render("")
	if err != nil {
		t.Fatalf("Render(\"\") devolvió error inesperado: %v", err)
	}
	if got != "" {
		t.Errorf("Render(\"\") = %q; se esperaba cadena vacía", got)
	}
}

// TestRender: casos representativos de Markdown estándar y GFM.
// Se comprueba por fragmentos (contains) para no acoplar los tests a detalles
// de espaciado del HTML generado por goldmark.
func TestRender(t *testing.T) {
	r := NewGoldmarkRenderer()

	cases := []struct {
		name     string
		source   string
		contains []string
	}{
		{
			name:     "encabezado con id automático",
			source:   "# Hola Mundo",
			contains: []string{`<h1 id="hola-mundo">Hola Mundo</h1>`},
		},
		{
			name:     "negrita",
			source:   "esto es **importante**",
			contains: []string{"<strong>importante</strong>"},
		},
		{
			name:     "lista no ordenada",
			source:   "- uno\n- dos",
			contains: []string{"<ul>", "<li>uno</li>", "<li>dos</li>"},
		},
		{
			name:     "enlace",
			source:   "[Wails](https://wails.io)",
			contains: []string{`<a href="https://wails.io">Wails</a>`},
		},
		{
			name:     "bloque de código con lenguaje",
			source:   "```go\nfmt.Println(42)\n```",
			contains: []string{`<pre><code class="language-go">`, "fmt.Println(42)"},
		},
		{
			name:     "tabla GFM",
			source:   "| col1 | col2 |\n| --- | --- |\n| a | b |",
			contains: []string{"<table>", "<th>col1</th>", "<td>a</td>"},
		},
		{
			name:     "tachado GFM",
			source:   "esto va ~~fuera~~",
			contains: []string{"<del>fuera</del>"},
		},
		{
			name:     "task list GFM",
			source:   "- [ ] pendiente\n- [x] hecha",
			contains: []string{`type="checkbox"`, "checked", "pendiente", "hecha"},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := r.Render(tc.source)
			if err != nil {
				t.Fatalf("Render(%q) devolvió error: %v", tc.source, err)
			}
			for _, want := range tc.contains {
				if !strings.Contains(got, want) {
					t.Errorf("Render(%q) = %q; falta el fragmento %q", tc.source, got, want)
				}
			}
		})
	}
}

// TestRenderNoRawHTML: sin WithUnsafe, goldmark no emite HTML crudo del
// documento (defensa base previa al saneado con bluemonday de P4.7).
func TestRenderNoRawHTML(t *testing.T) {
	r := NewGoldmarkRenderer()

	got, err := r.Render("hola <script>alert(1)</script>")
	if err != nil {
		t.Fatalf("Render devolvió error: %v", err)
	}
	if strings.Contains(got, "<script>") {
		t.Errorf("la salida contiene <script> sin escapar: %q", got)
	}
}
