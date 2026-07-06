package settings

import (
	"os"
	"path/filepath"
	"testing"
)

// Todos los tests usan NewServiceAt(t.TempDir()): nunca tocan el directorio
// de configuración real del usuario (criterio P2.3).

// TestLoadDefaultsWhenMissing: sin archivo previo, Load devuelve los valores
// por defecto sin error.
func TestLoadDefaultsWhenMissing(t *testing.T) {
	svc := NewServiceAt(t.TempDir())

	got, err := svc.Load()
	if err != nil {
		t.Fatalf("Load sin archivo devolvió error: %v", err)
	}
	if got != DefaultSettings() {
		t.Errorf("Load sin archivo = %+v; se esperaban los defaults %+v", got, DefaultSettings())
	}
	if got.Theme != "dark" {
		t.Errorf("el tema por defecto es %q; se esperaba \"dark\"", got.Theme)
	}
}

// TestSaveLoadRoundTrip: Save seguido de Load recupera exactamente los
// mismos valores.
func TestSaveLoadRoundTrip(t *testing.T) {
	svc := NewServiceAt(t.TempDir())
	want := Settings{
		Theme:          "light",
		LastOpenedFile: `C:\notas\readme.md`,
		WindowWidth:    1440,
		WindowHeight:   900,
	}

	if err := svc.Save(want); err != nil {
		t.Fatalf("Save devolvió error: %v", err)
	}
	got, err := svc.Load()
	if err != nil {
		t.Fatalf("Load tras Save devolvió error: %v", err)
	}
	if got != want {
		t.Errorf("round-trip Save->Load = %+v; se esperaba %+v", got, want)
	}
}

// TestSaveIsIdempotent: guardar dos veces los mismos valores no altera el
// resultado de Load.
func TestSaveIsIdempotent(t *testing.T) {
	svc := NewServiceAt(t.TempDir())
	want := DefaultSettings()
	want.Theme = "light"

	if err := svc.Save(want); err != nil {
		t.Fatalf("primer Save devolvió error: %v", err)
	}
	if err := svc.Save(want); err != nil {
		t.Fatalf("segundo Save devolvió error: %v", err)
	}
	got, err := svc.Load()
	if err != nil {
		t.Fatalf("Load devolvió error: %v", err)
	}
	if got != want {
		t.Errorf("Load tras doble Save = %+v; se esperaba %+v", got, want)
	}
}

// TestLoadCorruptFileFallsBackToDefaults: decisión documentada en P2.3 —
// un settings.json corrupto no impide arrancar la app: Load devuelve los
// defaults sin error (el archivo se regenerará en el siguiente Save).
func TestLoadCorruptFileFallsBackToDefaults(t *testing.T) {
	dir := t.TempDir()
	svc := NewServiceAt(dir)

	if err := os.WriteFile(filepath.Join(dir, settingsFileName), []byte("{esto no es json"), 0o644); err != nil {
		t.Fatalf("preparando el archivo corrupto: %v", err)
	}

	got, err := svc.Load()
	if err != nil {
		t.Fatalf("Load con JSON corrupto devolvió error: %v", err)
	}
	if got != DefaultSettings() {
		t.Errorf("Load con JSON corrupto = %+v; se esperaban los defaults", got)
	}
}
