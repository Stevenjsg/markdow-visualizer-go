import { useEffect, useRef } from 'react';

export interface ShortcutHandlers {
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
}

// Atajos globales (P4.6): Ctrl/Cmd+S guardar, Ctrl/Cmd+Shift+S guardar como
// y Ctrl/Cmd+O abrir. En macOS el modificador es Cmd (metaKey); en Windows y
// Linux, Ctrl. preventDefault anula los atajos por defecto del WebView.
//
// Solo se interceptan combinaciones con modificador, así la escritura normal
// en el editor no se ve afectada. Los handlers se leen de un ref para no
// re-registrar el listener en cada render.
export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
  const handlersRef = useRef(handlers);

  // El ref se actualiza en un efecto (no durante el render, regla de hooks).
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const isMac = navigator.userAgent.toLowerCase().includes('mac');

    const onKeyDown = (e: KeyboardEvent) => {
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;

      const key = e.key.toLowerCase();
      if (key === 's' && e.shiftKey) {
        e.preventDefault();
        handlersRef.current.onSaveAs();
      } else if (key === 's') {
        e.preventDefault();
        handlersRef.current.onSave();
      } else if (key === 'o') {
        e.preventDefault();
        handlersRef.current.onOpen();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
