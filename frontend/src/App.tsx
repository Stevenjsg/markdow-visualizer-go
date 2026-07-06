import { OpenFileDialog } from '../wailsjs/go/main/App';
import Editor from './components/Editor/Editor';
import Preview from './components/Preview/Preview';
import Toolbar from './components/Toolbar/Toolbar';
import { useDebouncedMarkdown } from './hooks/useDebouncedMarkdown';
import { useDocumentStore } from './store/documentStore';

// Raíz de la app: Toolbar + Editor | Preview (SDD §5). El tema vive en el
// store (theme) y se aplica con la clase `dark` en el wrapper.
function App() {
  const theme = useDocumentStore((s) => s.theme);

  // Mantiene store.html sincronizado con store.content vía backend (RF1).
  useDebouncedMarkdown();

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
  const handleSave = () => console.log('TODO(P4.3): guardar archivo');
  const handleSaveAs = () => console.log('TODO(P4.3): guardar como…');

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
      </div>
    </div>
  );
}

export default App;
