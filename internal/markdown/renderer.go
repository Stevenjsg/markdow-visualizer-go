// Package markdown contiene el renderizado de Markdown a HTML.
package markdown

// Renderer abstrae la conversión de Markdown a HTML (patrón Strategy, SDD §5.1).
// Mantenerla pequeña permite sustituir la implementación o inyectar un mock en tests.
type Renderer interface {
	Render(source string) (string, error)
}
