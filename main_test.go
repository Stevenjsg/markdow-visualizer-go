package main

import (
	"path/filepath"
	"testing"
)

// TestCLIFilePath: `mrw archivo.md` pasa el primer argumento posicional como
// ruta absoluta; los flags se ignoran (wails dev inyecta los suyos) y sin
// argumentos la app arranca vacía ("").
func TestCLIFilePath(t *testing.T) {
	abs := filepath.Join(t.TempDir(), "nota.md")

	cases := []struct {
		name string
		args []string
		want string
	}{
		{"sin argumentos", nil, ""},
		{"solo flags", []string{"-debug", "--loglevel=info"}, ""},
		{"ruta absoluta", []string{abs}, abs},
		{"ignora flags previos", []string{"-x", abs}, abs},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := cliFilePath(tc.args); got != tc.want {
				t.Errorf("cliFilePath(%v) = %q; se esperaba %q", tc.args, got, tc.want)
			}
		})
	}
}

// TestCLIFilePathRelative: una ruta relativa se resuelve contra el directorio
// de trabajo de la shell que invocó el comando.
func TestCLIFilePathRelative(t *testing.T) {
	got := cliFilePath([]string{"notas.md"})
	if !filepath.IsAbs(got) {
		t.Errorf("cliFilePath con ruta relativa devolvió %q; se esperaba una ruta absoluta", got)
	}
	if filepath.Base(got) != "notas.md" {
		t.Errorf("cliFilePath conservó mal el nombre: %q", got)
	}
}
