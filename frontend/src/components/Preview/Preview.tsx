import { useDocumentStore } from '../../store/documentStore';

// Vista previa (P3.4): renderiza el HTML que produce el backend con estilos
// tipográficos de @tailwindcss/typography, legibles en claro y oscuro.
function Preview() {
  const html = useDocumentStore((s) => s.html);

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
