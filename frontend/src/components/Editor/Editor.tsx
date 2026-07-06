import { type ChangeEvent } from 'react';
import { useDocumentStore } from '../../store/documentStore';

// Editor de texto plano (paso intermedio de P3.3).
// Contrato del componente: lee y escribe store.content, nada más. Gracias a
// eso CodeMirror (P5.1) podrá sustituir este textarea sin tocar el resto.
function Editor() {
  const content = useDocumentStore((s) => s.content);
  const setContent = useDocumentStore((s) => s.setContent);

  const onChange = (e: ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value);

  return (
    <textarea
      value={content}
      onChange={onChange}
      aria-label="Editor de Markdown"
      spellCheck={false}
      placeholder="Escribe tu Markdown aquí…"
      className="h-full w-full resize-none bg-transparent p-4 font-mono text-sm leading-relaxed text-neutral-800 outline-none placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-600"
    />
  );
}

export default Editor;
