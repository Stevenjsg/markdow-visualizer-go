import { useState } from 'react';
import Editor from './components/Editor/Editor';

// Layout base (P3.1): Toolbar arriba y dos paneles Editor | Preview.
// El tema se conmuta con la clase `dark` en el wrapper (darkMode: 'class');
// la persistencia llega en RF5 (P4.5) y los componentes reales en P3.3-P3.6.
function App() {
  const [dark, setDark] = useState(true);

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="flex h-screen flex-col bg-white text-neutral-900 transition-colors dark:bg-neutral-900 dark:text-neutral-100">
        <header className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2 dark:border-neutral-700">
          <span className="text-sm font-semibold tracking-wide">MarkView</span>
          {/* Toolbar real en P3.6; toggle temporal para verificar la paleta. */}
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            aria-label="Alternar tema claro/oscuro"
            className="ml-auto rounded px-2 py-1 text-sm hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 dark:hover:bg-neutral-700"
          >
            {dark ? '🌙 Oscuro' : '☀️ Claro'}
          </button>
        </header>

        <main className="flex min-h-0 flex-1">
          <section
            aria-label="Editor"
            className="flex-1 overflow-auto border-r border-neutral-200 dark:border-neutral-700"
          >
            <Editor />
          </section>
          <section aria-label="Vista previa" className="flex-1 overflow-auto">
            {/* Preview (P3.4) */}
            <p className="p-4 text-sm text-neutral-400 dark:text-neutral-500">Vista previa…</p>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
