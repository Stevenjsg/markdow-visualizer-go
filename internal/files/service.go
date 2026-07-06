// Package files encapsula la E/S de archivos Markdown en disco.
//
// Este paquete solo hace acceso a disco testeable: los diálogos nativos de
// Wails (Open/Save) viven en la fachada App (Fase 4), nunca aquí, para poder
// testear sin GUI (criterio P2.2).
package files

import (
	"fmt"
	"os"
)

// Service ofrece lectura y escritura de archivos .md.
type Service struct{}

// NewService construye el servicio de archivos.
func NewService() *Service {
	return &Service{}
}

// ReadFile devuelve el contenido del archivo en path.
// El error del sistema se envuelve con contexto (%w) para poder inspeccionarlo
// con errors.Is (p. ej. os.ErrNotExist).
func (s *Service) ReadFile(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("leer el archivo %q: %w", path, err)
	}
	return string(data), nil
}

// WriteFile crea o sobrescribe el archivo en path con el contenido dado.
func (s *Service) WriteFile(path, content string) error {
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		return fmt.Errorf("escribir el archivo %q: %w", path, err)
	}
	return nil
}
