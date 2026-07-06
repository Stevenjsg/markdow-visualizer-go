import { useEffect, useRef, useState } from 'react';
import {
  ForceClose,
  LoadSettings,
  OpenFileDialog,
  SaveFileDialog,
  SaveSettings,
  SetDirty,
  WriteFile,
} from '../wailsjs/go/main/App';
import { settings } from '../wailsjs/go/models';
import { EventsOn } from '../wailsjs/runtime/runtime';
import ConfirmClose from './components/ConfirmClose/ConfirmClose';
import Editor from './components/Editor/Editor';
import Preview from './components/Preview/Preview';
import Toolbar from './components/Toolbar/Toolbar';
import { useDebouncedMarkdown } from './hooks/useDebouncedMarkdown';
import { useDocumentStore } from './store/documentStore';

// Raíz de la app: Toolbar + Editor | Preview (SDD §5). El tema vive en el
// store (theme) y se aplica con la clase `dark` en el wrapper.
function App() {
  const theme = useDocumentStore((s) => s.theme);
  const isDirty = useDocumentStore((s) => s.isDirty);

  // Mantiene store.html sincronizado con store.content vía backend (RF1).
  useDebouncedMarkdown();

  // RF5 (P4.5): al arrancar se aplica el tema guardado; evita persistir
  // hasta que la carga inicial termina (settingsLoaded).
  const settingsLoaded = useRef(false);
  useEffect(() => {
    LoadSettings()
      .then((cfg) => {
        if (cfg.theme === 'light' || cfg.theme === 'dark') {
          useDocumentStore.getState().setTheme(cfg.theme);
        }
      })
      .catch((err: unknown) => console.error('LoadSettings falló:', err))
      .finally(() => {
        settingsLoaded.current = true;
      });
  }, []);

  // RF5 (P4.5): persistir el tema cuando el usuario lo cambia.
  useEffect(() => {
    if (!settingsLoaded.current) return;
    LoadSettings()
      .then((cfg) => SaveSettings(settings.Settings.createFrom({ ...cfg, theme })))
      .catch((err: unknown) => console.error('SaveSettings falló:', err));
  }, [theme]);

  // RF4 (P4.4): el backend refleja isDirty en el título de la ventana y lo
  // usa en OnBeforeClose para decidir si interceptar el cierre.
  useEffect(() => {
    SetDirty(isDirty).catch((err: unknown) => console.error('SetDirty falló:', err));
  }, [isDirty]);

  // RF4 (P4.4): con cambios pendientes, el backend previene el cierre y emite
  // "close-requested"; aquí se abre el modal Guardar/Descartar/Cancelar.
  const [closeRequested, setCloseRequested] = useState(false);
  useEffect(() => {
    const unsubscribe = EventsOn('close-requested', () => setCloseRequested(true));
    return unsubscribe;
  }, []);

  // RF2 (P4.2): diálogo nativo -> contenido y ruta al store, recién abierto = limpio.
  const handleOpen = async () => {
    try {
      const file = await OpenFileDialog();
      if (!file.path) return; // el usuario canceló el diálogo
      const { setContent, setFilePath, markClean } = useDocumentStore.getState();
      setContent(file.content);
      setFilePath(file.path);
      markClean();
    } catch (err: unknown) {
      console.error('No se pudo abrir el archivo:', err); // P5.4: feedback visual
    }
  };
  // RF3 (P4.3): Guardar como pide destino con el diálogo nativo y actualiza la ruta.
  const handleSaveAs = async () => {
    try {
      const { content, setFilePath, markClean } = useDocumentStore.getState();
      const path = await SaveFileDialog();
      if (!path) return; // el usuario canceló el diálogo
      await WriteFile(path, content);
      setFilePath(path);
      markClean();
    } catch (err: unknown) {
      console.error('No se pudo guardar el archivo:', err); // P5.4: feedback visual
    }
  };

  // RF3 (P4.3): Guardar escribe sobre filePath; sin archivo cae en Guardar como.
  const handleSave = async () => {
    const { content, filePath, markClean } = useDocumentStore.getState();
    if (!filePath) {
      await handleSaveAs();
      return;
    }
    try {
      await WriteFile(filePath, content);
      markClean();
    } catch (err: unknown) {
      console.error('No se pudo guardar el archivo:', err); // P5.4: feedback visual
    }
  };

  // RF4: acciones del modal de cierre. Guardar solo cierra si el guardado
  // realmente limpió el documento (p. ej. no se canceló el "Guardar como").
  const handleConfirmSave = async () => {
    await handleSave();
    if (!useDocumentStore.getState().isDirty) {
      ForceClose().catch((err: unknown) => console.error('ForceClose falló:', err));
    } else {
      setCloseRequested(false);
    }
  };
  const handleConfirmDiscard = () => {
    ForceClose().catch((err: unknown) => console.error('ForceClose falló:', err));
  };

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="flex h-screen flex-col bg-white text-neutral-900 transition-colors dark:bg-neutral-900 dark:text-neutral-100">
        <Toolbar onOpen={handleOpen} onSave={handleSave} onSaveAs={handleSaveAs} />

        <main className="flex min-h-0 flex-1">
          <section
            aria-label="Editor"
            className="flex-1 overflow-auto border-r border-neutral-200 dark:border-neutral-700"
          >
            <Editor />
          </section>
          <section aria-label="Vista previa" className="flex-1 overflow-auto">
            <Preview />
          </section>
        </main>

        <ConfirmClose
          open={closeRequested}
          onSave={handleConfirmSave}
          onDiscard={handleConfirmDiscard}
          onCancel={() => setCloseRequested(false)}
        />
      </div>
    </div>
  );
}

export default App;
