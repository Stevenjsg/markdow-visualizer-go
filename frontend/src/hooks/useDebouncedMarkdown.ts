import { useEffect } from 'react';
import { ParseMarkdown } from '../../wailsjs/go/main/App';
import { useDocumentStore } from '../store/documentStore';

// Pausa de escritura antes de llamar al backend (SDD §6, ~200ms). Junto al
// tiempo de render debe mantener el preview por debajo de los 300ms (SDD §3.2).
const DEBOUNCE_MS = 200;

// useDebouncedMarkdown (P3.5): observa store.content y, tras la pausa de
// escritura, pide a Go el HTML y lo vuelca en store.html.
// - No llama a Go en cada tecla: el timer se reinicia con cada cambio.
// - Cancela el resultado pendiente si llega contenido nuevo o al desmontar.
// - Un error del binding no rompe la UI (se registra en consola; el manejo
//   visible de errores se centraliza en P5.4).
export function useDebouncedMarkdown(): void {
  const content = useDocumentStore((s) => s.content);
  const setHtml = useDocumentStore((s) => s.setHtml);

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      ParseMarkdown(content)
        .then((html) => {
          if (!cancelled) setHtml(html);
        })
        .catch((err: unknown) => {
          if (!cancelled) console.error('ParseMarkdown falló:', err);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [content, setHtml]);
}
