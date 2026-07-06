package files

import (
	"errors"
	"os"
	"path/filepath"
	"testing"
)

// TestReadFile: lee el contenido exacto de un .md existente.
func TestReadFile(t *testing.T) {
	svc := NewService()
	dir := t.TempDir()
	path := filepath.Join(dir, "nota.md")
	want := "# Título\n\nContenido con acentos y emoji ✍️\n"

	if err := os.WriteFile(path, []byte(want), 0o644); err != nil {
		t.Fatalf("preparando el archivo de prueba: %v", err)
	}

	got, err := svc.ReadFile(path)
	if err != nil {
		t.Fatalf("ReadFile devolvió error inesperado: %v", err)
	}
	if got != want {
		t.Errorf("ReadFile = %q; se esperaba %q", got, want)
	}
}

// TestWriteFileRoundTrip: escribir y releer conserva el contenido byte a byte,
// y WriteFile sobrescribe archivos existentes.
func TestWriteFileRoundTrip(t *testing.T) {
	svc := NewService()
	dir := t.TempDir()
	path := filepath.Join(dir, "salida.md")

	first := "primera versión\n"
	if err := svc.WriteFile(path, first); err != nil {
		t.Fatalf("WriteFile devolvió error inesperado: %v", err)
	}

	// Sobrescritura: la segunda escritura reemplaza a la primera.
	want := "## Segunda versión\n\n- [x] con GFM\n"
	if err := svc.WriteFile(path, want); err != nil {
		t.Fatalf("WriteFile (sobrescritura) devolvió error: %v", err)
	}

	got, err := svc.ReadFile(path)
	if err != nil {
		t.Fatalf("ReadFile tras escribir devolvió error: %v", err)
	}
	if got != want {
		t.Errorf("round-trip write->read = %q; se esperaba %q", got, want)
	}
}

// TestReadFileNotFound: una ruta inexistente devuelve un error claro que
// envuelve el error original del sistema (%w).
func TestReadFileNotFound(t *testing.T) {
	svc := NewService()
	path := filepath.Join(t.TempDir(), "no-existe.md")

	got, err := svc.ReadFile(path)
	if err == nil {
		t.Fatalf("ReadFile sobre ruta inexistente devolvió nil; se esperaba error")
	}
	if !errors.Is(err, os.ErrNotExist) {
		t.Errorf("el error no envuelve os.ErrNotExist: %v", err)
	}
	if got != "" {
		t.Errorf("ReadFile con error devolvió contenido %q; se esperaba \"\"", got)
	}
}

// TestReadFileOnDirectory (P6.1): leer una ruta que es un directorio falla
// con error claro en lugar de devolver contenido basura.
func TestReadFileOnDirectory(t *testing.T) {
	svc := NewService()
	dir := t.TempDir()

	if _, err := svc.ReadFile(dir); err == nil {
		t.Fatalf("ReadFile sobre un directorio devolvió nil; se esperaba error")
	}
}

// TestWriteFileToMissingDirectory (P6.1): escribir dentro de un directorio
// inexistente devuelve error envuelto (WriteFile no crea directorios: el
// destino siempre proviene de un diálogo nativo que sí existe).
func TestWriteFileToMissingDirectory(t *testing.T) {
	svc := NewService()
	path := filepath.Join(t.TempDir(), "subdir-inexistente", "salida.md")

	err := svc.WriteFile(path, "contenido")
	if err == nil {
		t.Fatalf("WriteFile en directorio inexistente devolvió nil; se esperaba error")
	}
	if !errors.Is(err, os.ErrNotExist) {
		t.Errorf("el error no envuelve os.ErrNotExist: %v", err)
	}
}

// TestWriteFileEmptyContent (P6.1): guardar contenido vacío trunca el archivo
// (caso válido: el usuario borró todo y guardó).
func TestWriteFileEmptyContent(t *testing.T) {
	svc := NewService()
	path := filepath.Join(t.TempDir(), "vacio.md")

	if err := svc.WriteFile(path, "algo previo"); err != nil {
		t.Fatalf("WriteFile inicial devolvió error: %v", err)
	}
	if err := svc.WriteFile(path, ""); err != nil {
		t.Fatalf("WriteFile con contenido vacío devolvió error: %v", err)
	}
	got, err := svc.ReadFile(path)
	if err != nil {
		t.Fatalf("ReadFile devolvió error: %v", err)
	}
	if got != "" {
		t.Errorf("el archivo debía quedar vacío; contiene %q", got)
	}
}
