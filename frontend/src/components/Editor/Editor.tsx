import { markdown as markdownLang, markdownLanguage } from '@codemirror/lang-markdown';
import CodeMirror from '@uiw/react-codemirror';
import { useCallback } from 'react';
import { useDocumentStore } from '../../store/documentStore';

// Editor con CodeMirror 6 y resaltado de Markdown (P5.1).
// Mantiene el contrato de P3.3 — lee y escribe store.content — por lo que el
// resto de la app no cambió al sustituir el textarea.
function Editor() {
  const content = useDocumentStore((s) => s.content);
  const theme = useDocumentStore((s) => s.theme);

  // onChange solo se dispara con ediciones del usuario: los cambios
  // programáticos de `value` (abrir archivo) no lo invocan, así que no
  // ensucian el documento recién abierto.
  const onChange = useCallback((value: string) => {
    useDocumentStore.getState().setContent(value);
  }, []);

  return (
    <div aria-label="Editor de Markdown" className="h-full">
      <CodeMirror
        value={content}
        onChange={onChange}
        theme={theme}
        extensions={[markdownLang({ base: markdownLanguage })]}
        height="100%"
        placeholder="Escribe tu Markdown aquí…"
        className="h-full text-sm"
        basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true }}
      />
    </div>
  );
}

export default Editor;
