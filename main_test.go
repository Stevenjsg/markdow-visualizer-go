package main

import (
	"path/filepath"
	"testing"
)

// TestParseCLI: `mrw [-v|--view] archivo.md` — el primer argumento posicional
// es la ruta (absoluta) del archivo y -v/--view activa el modo visor. Los
// demás flags se ignoran (wails dev inyecta los suyos) y sin argumentos la
// app arranca vacía ("").
func TestParseCLI(t *testing.T) {
	abs := filepath.Join(t.TempDir(), "nota.md")

	cases := []struct {
		name       string
		args       []string
		wantPath   string
		wantViewer bool
	}{
		{"sin argumentos", nil, "", false},
		{"solo flags ajenos", []string{"-debug", "--loglevel=info"}, "", false},
		{"ruta absoluta", []string{abs}, abs, false},
		{"ignora flags ajenos previos", []string{"-x", abs}, abs, false},
		{"-v sin archivo", []string{"-v"}, "", true},
		{"--view antes del archivo", []string{"--view", abs}, abs, true},
		{"-v despues del archivo", []string{abs, "-v"}, abs, true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			gotPath, gotViewer := parseCLI(tc.args)
			if gotPath != tc.wantPath || gotViewer != tc.wantViewer {
				t.Errorf("parseCLI(%v) = (%q, %v); se esperaba (%q, %v)",
					tc.args, gotPath, gotViewer, tc.wantPath, tc.wantViewer)
			}
		})
	}
}

// TestParseCLIRelative: una ruta relativa se resuelve contra el directorio
// de trabajo de la shell que invocó el comando.
func TestParseCLIRelative(t *testing.T) {
	got, _ := parseCLI([]string{"notas.md"})
	if !filepath.IsAbs(got) {
		t.Errorf("parseCLI con ruta relativa devolvió %q; se esperaba una ruta absoluta", got)
	}
	if filepath.Base(got) != "notas.md" {
		t.Errorf("parseCLI conservó mal el nombre: %q", got)
	}
}
