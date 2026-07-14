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
		// Posición negativa legítima: monitor secundario a la izquierda.
		WindowX:         -1920,
		WindowY:         42,
		WindowMaximised: true,
		WordWrap:        false, // valor no-default: debe sobrevivir el round-trip
		FormatToolbar:   false, // valor no-default: debe sobrevivir el round-trip
		ViewerMode:      true,  // valor no-default: debe sobrevivir el round-trip
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

// TestSaveCreatesConfigDirectory (P6.1): Save crea el directorio de config
// si no existe (primer arranque en una máquina limpia).
func TestSaveCreatesConfigDirectory(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "anidado", "config")
	svc := NewServiceAt(dir)

	if err := svc.Save(DefaultSettings()); err != nil {
		t.Fatalf("Save con directorio inexistente devolvió error: %v", err)
	}
	if _, err := os.Stat(filepath.Join(dir, settingsFileName)); err != nil {
		t.Errorf("settings.json no se creó: %v", err)
	}
}

// TestSaveFailsWhenDirIsFile (P6.1): si la ruta de config está ocupada por
// un archivo, Save devuelve un error claro en lugar de un panic.
func TestSaveFailsWhenDirIsFile(t *testing.T) {
	parent := t.TempDir()
	blocker := filepath.Join(parent, "ocupado")
	if err := os.WriteFile(blocker, []byte("soy un archivo"), 0o644); err != nil {
		t.Fatalf("preparando el bloqueo: %v", err)
	}

	svc := NewServiceAt(blocker)
	if err := svc.Save(DefaultSettings()); err == nil {
		t.Fatalf("Save sobre una ruta-archivo devolvió nil; se esperaba error")
	}
}

// TestLoadPartialJSONKeepsDefaults: un JSON válido pero incompleto (p. ej.
// escrito por una versión anterior de la app) conserva los defaults en los
// campos ausentes: se deserializa sobre DefaultSettings().
func TestLoadPartialJSONKeepsDefaults(t *testing.T) {
	dir := t.TempDir()
	svc := NewServiceAt(dir)

	if err := os.WriteFile(filepath.Join(dir, settingsFileName), []byte(`{"theme":"light"}`), 0o644); err != nil {
		t.Fatalf("preparando el archivo parcial: %v", err)
	}

	got, err := svc.Load()
	if err != nil {
		t.Fatalf("Load con JSON parcial devolvió error: %v", err)
	}
	if got.Theme != "light" {
		t.Errorf("Theme = %q; se esperaba \"light\" (presente en el JSON)", got.Theme)
	}
	def := DefaultSettings()
	if got.WindowWidth != def.WindowWidth || got.WindowHeight != def.WindowHeight {
		t.Errorf("el tamaño de ventana ausente debe conservar defaults: %+v", got)
	}
	if got.WindowX != def.WindowX || got.WindowY != def.WindowY {
		t.Errorf("la posición ausente debe conservar el centinela (-1,-1): %+v", got)
	}
	if got.WordWrap != def.WordWrap {
		t.Errorf("wordWrap ausente debe conservar el default %v: %+v", def.WordWrap, got)
	}
	if got.FormatToolbar != def.FormatToolbar {
		t.Errorf("formatToolbar ausente debe conservar el default %v: %+v", def.FormatToolbar, got)
	}
	if got.ViewerMode != def.ViewerMode {
		t.Errorf("viewerMode ausente debe conservar el default %v: %+v", def.ViewerMode, got)
	}
}
