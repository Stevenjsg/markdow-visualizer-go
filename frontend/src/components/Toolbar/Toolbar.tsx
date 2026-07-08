import { useDocumentStore } from '../../store/documentStore';

export interface ToolbarProps {
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onClose: () => void;
}

// Estilo compartido de los botones: foco visible para navegación por teclado.
const buttonClass =
  'rounded px-2.5 py-1 text-sm hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 dark:hover:bg-neutral-700';

// Toolbar (P3.6): Abrir / Guardar / Guardar como + toggle de tema.
// Los callbacks llegan por props como stubs hasta la Fase 4; el indicador ●
// refleja isDirty (RF4) y el toggle opera sobre store.theme (RF5 lo persiste).
function Toolbar({ onOpen, onSave, onSaveAs, onClose }: ToolbarProps) {
  const isDirty = useDocumentStore((s) => s.isDirty);
  const filePath = useDocumentStore((s) => s.filePath);
  const theme = useDocumentStore((s) => s.theme);
  const setTheme = useDocumentStore((s) => s.setTheme);
  const wordWrap = useDocumentStore((s) => s.wordWrap);
  const setWordWrap = useDocumentStore((s) => s.setWordWrap);
  const formatToolbar = useDocumentStore((s) => s.formatToolbar);
  const setFormatToolbar = useDocumentStore((s) => s.setFormatToolbar);

  return (
    <header className="flex items-center gap-1 border-b border-neutral-200 px-3 py-2 dark:border-neutral-700">
      <span className="mr-2 text-sm font-semibold tracking-wide">MarkView</span>

      <button
        type="button"
        className={buttonClass}
        onClick={onOpen}
        aria-label="Abrir archivo"
        aria-keyshortcuts="Control+O Meta+O"
        title="Abrir (Ctrl/Cmd+O)"
      >
        📂 Abrir
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={onSave}
        aria-label="Guardar archivo"
        aria-keyshortcuts="Control+S Meta+S"
        title="Guardar (Ctrl/Cmd+S)"
      >
        💾 Guardar
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={onSaveAs}
        aria-label="Guardar como archivo nuevo"
        aria-keyshortcuts="Control+Shift+S Meta+Shift+S"
        title="Guardar como… (Ctrl/Cmd+Shift+S)"
      >
        📄 Guardar como…
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={onClose}
        aria-label="Cerrar archivo"
        aria-keyshortcuts="Control+W Meta+W"
        title="Cerrar archivo (Ctrl/Cmd+W)"
      >
        ✕ Cerrar
      </button>

      <span className="ml-auto flex items-center gap-3">
        <span
          className="max-w-[40ch] truncate text-xs text-neutral-500 dark:text-neutral-400"
          title={filePath ?? undefined}
        >
          {filePath ?? 'Sin archivo'}
          {isDirty && (
            <span
              className="ml-1 font-bold text-amber-500"
              role="status"
              aria-label="Hay cambios sin guardar"
            >
              ●
            </span>
          )}
        </span>
        <button
          type="button"
          className={`${buttonClass} ${formatToolbar ? 'bg-neutral-200 dark:bg-neutral-700' : ''}`}
          onClick={() => setFormatToolbar(!formatToolbar)}
          aria-label="Botonera de formato"
          aria-pressed={formatToolbar}
          title={`Botonera de formato: ${formatToolbar ? 'visible' : 'oculta'}`}
        >
          Aa Formato
        </button>
        <button
          type="button"
          className={`${buttonClass} ${wordWrap ? 'bg-neutral-200 dark:bg-neutral-700' : ''}`}
          onClick={() => setWordWrap(!wordWrap)}
          aria-label="Ajuste de línea del editor"
          aria-pressed={wordWrap}
          aria-keyshortcuts="Alt+Z"
          title={`Ajuste de línea: ${wordWrap ? 'activado' : 'desactivado'} (Alt+Z)`}
        >
          ⤶ Ajuste
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Alternar tema claro/oscuro"
          title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </span>
    </header>
  );
}

export default Toolbar;
