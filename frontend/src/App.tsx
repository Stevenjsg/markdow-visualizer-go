import { useEffect, useRef, useState } from 'react';
import {
  ForceClose,
  GetStartupFile,
  LoadSettings,
  OpenFileDialog,
  ReadFile,
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
import StatusBar from './components/StatusBar/StatusBar';
import Toolbar from './components/Toolbar/Toolbar';
import { useDebouncedMarkdown } from './hooks/useDebouncedMarkdown';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { describeError } from './lib/errors';
import { useDocumentStore } from './store/documentStore';

// Raíz de la app: Toolbar + Editor | Preview (SDD §5). El tema vive en el
// store (theme) y se aplica con la clase `dark` en el wrapper.
function App() {
  const theme = useDocumentStore((s) => s.theme);
  const isDirty = useDocumentStore((s) => s.isDirty);
  const splitRatio = useDocumentStore((s) => s.splitRatio);

  // P5.2: arrastre del divisor Editor|Preview. La proporción vive en el
  // store (clampada al 20–80%) y se aplica como ancho del panel izquierdo.
  const mainRef = useRef<HTMLElement | null>(null);
  const onDividerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const main = mainRef.current;
    if (!main) return;

    const onMove = (ev: PointerEvent) => {
      const rect = main.getBoundingClientRect();
      if (rect.width === 0) return;
      useDocumentStore.getState().setSplitRatio((ev.clientX - rect.left) / rect.width);
    };
    const onUp = () => window.removeEventListener('pointermove', onMove);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  };

  // P5.5: el divisor también se maneja con el teclado (flechas ±5%).
  const onDividerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = 0.05;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const s = useDocumentStore.getState();
    s.setSplitRatio(s.splitRatio + (e.key === 'ArrowLeft' ? -step : step));
  };

  // Mantiene store.html sincronizado con store.content vía backend (RF1).
  useDebouncedMarkdown();

  // P5.4: feedback centralizado en la StatusBar. Los mensajes informativos
  // se autolimpian; los errores permanecen hasta que el usuario los cierra.
  const infoTimer = useRef<number | undefined>(undefined);
  const showInfo = (text: string) => {
    const { setStatus } = useDocumentStore.getState();
    setStatus({ type: 'info', text });
    window.clearTimeout(infoTimer.current);
    infoTimer.current = window.setTimeout(() => setStatus(null), 3000);
  };
  const showError = (prefix: string, err: unknown) => {
    window.clearTimeout(infoTimer.current);
    useDocumentStore
      .getState()
      .setStatus({ type: 'error', text: `${prefix}: ${describeError(err)}` });
  };

  // P5.3: recuerda el último archivo abierto/guardado para la próxima sesión.
  const persistLastOpenedFile = (path: string) => {
    LoadSettings()
      .then((cfg) => SaveSettings(settings.Settings.createFrom({ ...cfg, lastOpenedFile: path })))
      .catch((err: unknown) => console.error('No se pudo recordar el último archivo:', err));
  };

  // RF5 (P4.5) + P5.3: al arrancar se aplica el tema guardado y se restaura
  // el archivo de la CLI o el último abierto; evita persistir hasta terminar
  // la carga inicial (settingsLoaded).
  const settingsLoaded = useRef(false);
  useEffect(() => {
    LoadSettings()
      .then(async (cfg) => {
        if (cfg.theme === 'light' || cfg.theme === 'dark') {
          useDocumentStore.getState().setTheme(cfg.theme);
        }
        useDocumentStore.getState().setWordWrap(cfg.wordWrap);
        useDocumentStore.getState().setFormatToolbar(cfg.formatToolbar);
        useDocumentStore.getState().setViewerMode(cfg.viewerMode);

        // CLI (`mrw archivo.md`): el archivo pedido por la línea de comandos
        // tiene prioridad sobre la restauración del último archivo abierto.
        try {
          const startup = await GetStartupFile();
          // `mrw -v`: el flag de la CLI fuerza el modo visor en este arranque
          // (con o sin archivo), por encima de la preferencia guardada.
          if (startup.viewer) {
            useDocumentStore.getState().setViewerMode(true);
          }
          if (startup.path) {
            const { setContent, setFilePath, markClean } = useDocumentStore.getState();
            setContent(startup.content);
            setFilePath(startup.path);
            markClean();
            persistLastOpenedFile(startup.path);
            showInfo(
              startup.isNew
                ? `Archivo nuevo: ${startup.path} (se creará al guardar)`
                : `Abierto ${startup.path}`,
            );
            return;
          }
        } catch (err: unknown) {
          // P. ej. la ruta es un directorio: se informa y se arranca vacío,
          // sin pisar el error restaurando el último archivo.
          showError('No se pudo abrir el archivo de la línea de comandos', err);
          return;
        }

        if (cfg.lastOpenedFile) {
          try {
            const content = await ReadFile(cfg.lastOpenedFile);
            const { setContent, setFilePath, markClean } = useDocumentStore.getState();
            setContent(content);
            setFilePath(cfg.lastOpenedFile);
            markClean();
          } catch {
            // Archivo borrado o movido: arrancar vacío y olvidar la referencia.
            SaveSettings(settings.Settings.createFrom({ ...cfg, lastOpenedFile: '' })).catch(
              () => undefined,
            );
          }
        }
      })
      .catch((err: unknown) => showError('No se pudo cargar la configuración', err))
      .finally(() => {
        settingsLoaded.current = true;
      });
  }, []);

  // RF5 (P4.5): persistir tema, ajuste de línea, botonera de formato y modo
  // visor cuando el usuario los cambia.
  const wordWrap = useDocumentStore((s) => s.wordWrap);
  const formatToolbar = useDocumentStore((s) => s.formatToolbar);
  const viewerMode = useDocumentStore((s) => s.viewerMode);
  useEffect(() => {
    if (!settingsLoaded.current) return;
    LoadSettings()
      .then((cfg) =>
        SaveSettings(
          settings.Settings.createFrom({ ...cfg, theme, wordWrap, formatToolbar, viewerMode }),
        ),
      )
      .catch((err: unknown) => console.error('SaveSettings falló:', err));
  }, [theme, wordWrap, formatToolbar, viewerMode]);

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
  const doOpen = async () => {
    try {
      const file = await OpenFileDialog();
      if (!file.path) return; // el usuario canceló el diálogo
      const { setContent, setFilePath, markClean } = useDocumentStore.getState();
      setContent(file.content);
      setFilePath(file.path);
      markClean();
      persistLastOpenedFile(file.path);
      showInfo(`Abierto ${file.path}`);
    } catch (err: unknown) {
      showError('No se pudo abrir el archivo', err);
    }
  };

  // Abrir otro archivo reemplaza el documento en esta ventana, así que con
  // cambios sin guardar se confirma primero (mismo modal que cerrar).
  const [openFileRequested, setOpenFileRequested] = useState(false);
  const handleOpen = async () => {
    if (useDocumentStore.getState().isDirty) {
      setOpenFileRequested(true);
      return;
    }
    await doOpen();
  };
  const handleOpenFileSave = async () => {
    await handleSave();
    setOpenFileRequested(false);
    if (!useDocumentStore.getState().isDirty) {
      await doOpen(); // solo se abre si el guardado limpió el documento
    }
  };
  const handleOpenFileDiscard = async () => {
    setOpenFileRequested(false);
    // Descartar = seguir sin guardar; el contenido solo se reemplaza si el
    // usuario elige de verdad un archivo en el diálogo.
    await doOpen();
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
      persistLastOpenedFile(path);
      showInfo(`Guardado en ${path}`);
    } catch (err: unknown) {
      showError('No se pudo guardar el archivo', err);
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
      showInfo(`Guardado en ${filePath}`);
    } catch (err: unknown) {
      showError('No se pudo guardar el archivo', err);
    }
  };

  // Cerrar archivo: sin cambios pendientes cierra directo; con cambios abre
  // su propio modal Guardar/Descartar/Cancelar (reutiliza ConfirmClose).
  const [closeFileRequested, setCloseFileRequested] = useState(false);
  const doCloseFile = () => {
    useDocumentStore.getState().resetDocument();
    setCloseFileRequested(false);
    // Olvida el último archivo: cerrar significa no restaurarlo al reiniciar.
    LoadSettings()
      .then((cfg) => SaveSettings(settings.Settings.createFrom({ ...cfg, lastOpenedFile: '' })))
      .catch(() => undefined);
    showInfo('Archivo cerrado');
  };
  const handleCloseFile = () => {
    if (!useDocumentStore.getState().isDirty) {
      doCloseFile();
      return;
    }
    setCloseFileRequested(true);
  };
  const handleCloseFileSave = async () => {
    await handleSave();
    if (!useDocumentStore.getState().isDirty) {
      doCloseFile();
    } else {
      setCloseFileRequested(false); // el usuario canceló el "Guardar como"
    }
  };

  // P4.6: atajos Ctrl/Cmd+S, Ctrl/Cmd+Shift+S, Ctrl/Cmd+O, Ctrl/Cmd+W y
  // Ctrl/Cmd+Shift+V (modo visor).
  useKeyboardShortcuts({
    onOpen: handleOpen,
    onSave: handleSave,
    onSaveAs: handleSaveAs,
    onClose: handleCloseFile,
    onToggleViewer: () => {
      const s = useDocumentStore.getState();
      s.setViewerMode(!s.viewerMode);
    },
  });

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
        <Toolbar
          onOpen={handleOpen}
          onSave={handleSave}
          onSaveAs={handleSaveAs}
          onClose={handleCloseFile}
        />

        <main ref={mainRef} className="flex min-h-0 flex-1">
          {/* Modo visor: solo el preview, a todo el ancho; el editor no se monta. */}
          {!viewerMode && (
            <>
              <section
                aria-label="Editor"
                style={{ width: `${splitRatio * 100}%` }}
                className="min-w-0 overflow-auto"
              >
                <Editor />
              </section>
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Redimensionar paneles (flechas izquierda/derecha)"
                aria-valuemin={20}
                aria-valuemax={80}
                aria-valuenow={Math.round(splitRatio * 100)}
                tabIndex={0}
                title="Arrastra o usa las flechas para redimensionar"
                onPointerDown={onDividerPointerDown}
                onKeyDown={onDividerKeyDown}
                className="w-1 shrink-0 cursor-col-resize bg-neutral-200 transition-colors hover:bg-sky-500 focus-visible:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 dark:bg-neutral-700 dark:hover:bg-sky-500"
              />
            </>
          )}
          <section
            aria-label="Vista previa"
            className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden"
          >
            <Preview />
          </section>
        </main>

        <StatusBar />

        <ConfirmClose
          open={closeRequested}
          onSave={handleConfirmSave}
          onDiscard={handleConfirmDiscard}
          onCancel={() => setCloseRequested(false)}
        />

        <ConfirmClose
          open={openFileRequested}
          title="¿Guardar los cambios antes de abrir otro archivo?"
          message="Al abrir otro archivo se reemplaza el documento actual. Si descartas los cambios sin guardar, se perderán."
          onSave={handleOpenFileSave}
          onDiscard={handleOpenFileDiscard}
          onCancel={() => setOpenFileRequested(false)}
        />

        <ConfirmClose
          open={closeFileRequested}
          title="¿Guardar los cambios antes de cerrar el archivo?"
          message="El documento tiene cambios sin guardar. Si los descartas, se perderán."
          onSave={handleCloseFileSave}
          onDiscard={doCloseFile}
          onCancel={() => setCloseFileRequested(false)}
        />
      </div>
    </div>
  );
}

export default App;
