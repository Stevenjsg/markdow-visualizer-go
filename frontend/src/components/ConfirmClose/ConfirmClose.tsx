import { type KeyboardEvent } from 'react';

export interface ConfirmCloseProps {
  open: boolean;
  /** Título del diálogo; por defecto, el del cierre de la app. */
  title?: string;
  /** Mensaje descriptivo; por defecto, el del cierre de la app. */
  message?: string;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

const baseButton =
  'rounded px-3 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500';

// Modal de confirmación con cambios sin guardar (RF4, P4.4). Reutilizable:
// sirve para cerrar la app y para cerrar el archivo actual (title/message).
// Sustituye al MessageDialog nativo porque en Windows este no admite tres
// botones personalizados (Guardar / Descartar / Cancelar).
function ConfirmClose({
  open,
  title = '¿Guardar los cambios antes de salir?',
  message = 'Hay cambios sin guardar. Si los descartas, se perderán definitivamente.',
  onSave,
  onDiscard,
  onCancel,
}: ConfirmCloseProps) {
  if (!open) return null;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-close-title"
        onKeyDown={onKeyDown}
        className="w-96 max-w-[90vw] rounded-lg border border-neutral-200 bg-white p-5 text-neutral-900 shadow-xl dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
      >
        <h2 id="confirm-close-title" className="text-base font-semibold">
          {title}
        </h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className={`${baseButton} hover:bg-neutral-200 dark:hover:bg-neutral-700`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className={`${baseButton} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950`}
          >
            Descartar
          </button>
          <button
            type="button"
            onClick={onSave}
            className={`${baseButton} bg-sky-600 text-white hover:bg-sky-500`}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmClose;
