import { useDocumentStore } from '../../store/documentStore';

// Vista previa (P3.4): renderiza el HTML que produce el backend con estilos
// tipográficos de @tailwindcss/typography, legibles en claro y oscuro.
function Preview() {
  const html = useDocumentStore((s) => s.html);

  // P5.4: estado vacío con ayuda mínima cuando no hay documento.
  if (!html) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-neutral-400 dark:text-neutral-500">
        <div>
          <p className="text-base font-medium">Sin contenido</p>
          <p className="mt-2 text-sm">
            Empieza a escribir en el editor o abre un archivo con{' '}
            <kbd className="rounded border border-neutral-300 px-1 py-0.5 text-xs dark:border-neutral-600">
              Ctrl/Cmd+O
            </kbd>
            . La vista previa se actualiza sola mientras escribes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-label="Vista previa renderizada"
      className="prose prose-neutral h-full max-w-none p-4 dark:prose-invert prose-pre:bg-neutral-100 prose-pre:text-neutral-800 dark:prose-pre:bg-neutral-800 dark:prose-pre:text-neutral-100"
      // Seguridad (P4.7): el HTML llega saneado desde el backend — goldmark
      // sin WithUnsafe + bluemonday (UGCPolicy ampliada para GFM) en
      // internal/markdown. Ver tests TestRenderSanitizesXSS.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default Preview;
