// Package files encapsula la E/S de archivos Markdown en disco.
package files

// Service ofrece lectura/escritura de archivos .md.
// Stub de P1.2: la implementación real llega en P2.2 (TDD).
// Los diálogos nativos de Wails NO viven aquí (se añaden en Fase 4 sobre App):
// este paquete debe poder testearse sin GUI.
type Service struct{}

// NewService construye el servicio de archivos.
func NewService() *Service {
	return &Service{}
}

// TODO(P2.2): ReadFile(path string) (string, error)
// TODO(P2.2): WriteFile(path, content string) error
