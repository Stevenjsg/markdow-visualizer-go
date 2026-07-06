import { useDocumentStore } from '../../store/documentStore';

// Barra de estado (P5.4): muestra el feedback de operaciones (info) y los
// errores de E/S o bindings de forma legible, con cierre manual.
function StatusBar() {
  const status = useDocumentStore((s) => s.status);
  const setStatus = useDocumentStore((s) => s.setStatus);

  if (!status) return null;

  const isError = status.type === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex items-center gap-2 border-t px-3 py-1.5 text-sm ${
        isError
          ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
          : 'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
      }`}
    >
      <span className="min-w-0 flex-1 truncate" title={status.text}>
        {isError ? '⚠ ' : ''}
        {status.text}
      </span>
      <button
        type="button"
        onClick={() => setStatus(null)}
        aria-label="Cerrar mensaje de estado"
        className="rounded px-1.5 hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 dark:hover:bg-white/10"
      >
        ✕
      </button>
    </div>
  );
}

export default StatusBar;
