package markdown

// GoldmarkRenderer implementa Renderer usando la librería goldmark.
// Stub de P1.2: la implementación real llega en P2.1 (TDD).
type GoldmarkRenderer struct{}

// NewGoldmarkRenderer construye el renderizador por defecto de la aplicación.
func NewGoldmarkRenderer() *GoldmarkRenderer {
	return &GoldmarkRenderer{}
}

// Render convierte Markdown a HTML. TODO(P2.1): implementar con goldmark + GFM.
func (r *GoldmarkRenderer) Render(_ string) (string, error) {
	return "", nil
}
