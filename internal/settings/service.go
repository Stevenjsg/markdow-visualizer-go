// Package settings persiste la configuración de la aplicación en un JSON
// local (SDD §7): tema, último archivo abierto y tamaño de ventana.
package settings

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
)

// settingsFileName es el nombre del archivo dentro del directorio de config.
const settingsFileName = "settings.json"

// appConfigDirName es la carpeta de la app dentro de os.UserConfigDir().
const appConfigDirName = "MarkView"

// Settings es el modelo de configuración persistente (tags según SDD §7,
// ampliado con wordWrap y con la geometría completa de la ventana).
type Settings struct {
	Theme          string `json:"theme"`
	LastOpenedFile string `json:"lastOpenedFile"`
	WindowWidth    int    `json:"windowWidth"`
	WindowHeight   int    `json:"windowHeight"`
	// WindowX/WindowY usan (-1, -1) como centinela "sin posición guardada"
	// (la ventana se centra). Una posición real puede ser negativa con varios
	// monitores, pero exactamente (-1, -1) es un caso despreciable.
	WindowX int `json:"windowX"`
	WindowY int `json:"windowY"`
	// WindowMaximised restaura el maximizado sin pisar la geometría "normal".
	WindowMaximised bool `json:"windowMaximised"`
	WordWrap        bool `json:"wordWrap"`
	// FormatToolbar controla la visibilidad de la botonera de formato del editor.
	FormatToolbar bool `json:"formatToolbar"`
	// ViewerMode oculta el editor y muestra solo el preview (modo lectura).
	ViewerMode bool `json:"viewerMode"`
}

// DefaultSettings devuelve la configuración inicial de la app.
func DefaultSettings() Settings {
	return Settings{
		Theme:           "dark",
		LastOpenedFile:  "",
		WindowWidth:     1200,
		WindowHeight:    800,
		WindowX:         -1,
		WindowY:         -1,
		WindowMaximised: false,
		WordWrap:        true,
		FormatToolbar:   true,
		ViewerMode:      false,
	}
}

// Service carga y guarda la configuración. En producción resuelve el
// directorio con os.UserConfigDir(); en tests se inyecta con NewServiceAt.
type Service struct {
	baseDir string
}

// NewService construye el servicio usando el directorio de config del usuario
// (p. ej. %AppData% en Windows, ~/.config en Linux), resuelto perezosamente.
func NewService() *Service {
	return &Service{}
}

// NewServiceAt construye el servicio sobre un directorio concreto.
// Pensado para tests: evita tocar la configuración real del usuario.
func NewServiceAt(dir string) *Service {
	return &Service{baseDir: dir}
}

// dir devuelve el directorio de configuración, resolviéndolo si hace falta.
func (s *Service) dir() (string, error) {
	if s.baseDir != "" {
		return s.baseDir, nil
	}
	base, err := os.UserConfigDir()
	if err != nil {
		return "", fmt.Errorf("resolver el directorio de configuración: %w", err)
	}
	return filepath.Join(base, appConfigDirName), nil
}

// Load lee settings.json. Si el archivo no existe o está corrupto devuelve
// los defaults sin error (decisión P2.3: la app siempre debe poder arrancar;
// un archivo corrupto se regenera en el siguiente Save).
func (s *Service) Load() (Settings, error) {
	dir, err := s.dir()
	if err != nil {
		return DefaultSettings(), err
	}

	data, err := os.ReadFile(filepath.Join(dir, settingsFileName))
	if errors.Is(err, fs.ErrNotExist) {
		return DefaultSettings(), nil
	}
	if err != nil {
		return DefaultSettings(), fmt.Errorf("leer settings.json: %w", err)
	}

	// Se deserializa SOBRE los defaults: un settings.json de una versión
	// anterior (sin campos nuevos, p. ej. wordWrap) conserva el valor por
	// defecto en lo ausente en lugar del valor cero.
	cfg := DefaultSettings()
	if err := json.Unmarshal(data, &cfg); err != nil {
		return DefaultSettings(), nil // corrupto -> defaults, sin error
	}
	return cfg, nil
}

// Save escribe la configuración en settings.json, creando el directorio si
// no existe.
func (s *Service) Save(cfg Settings) error {
	dir, err := s.dir()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("crear el directorio de configuración %q: %w", dir, err)
	}

	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return fmt.Errorf("serializar la configuración: %w", err)
	}
	if err := os.WriteFile(filepath.Join(dir, settingsFileName), data, 0o644); err != nil {
		return fmt.Errorf("escribir settings.json: %w", err)
	}
	return nil
}
