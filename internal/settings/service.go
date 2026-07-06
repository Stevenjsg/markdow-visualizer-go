// Package settings persiste la configuración de la aplicación en JSON local.
package settings

// Service carga y guarda settings.json en el directorio de config del usuario.
// Stub de P1.2: la implementación real llega en P2.3 (TDD).
type Service struct{}

// NewService construye el servicio de configuración.
func NewService() *Service {
	return &Service{}
}

// TODO(P2.3): struct Settings {Theme, LastOpenedFile, WindowWidth, WindowHeight}
// TODO(P2.3): Load() (Settings, error) con defaults si no existe el archivo.
// TODO(P2.3): Save(s Settings) error, con directorio base inyectable para tests.
