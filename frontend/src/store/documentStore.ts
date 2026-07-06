import { create } from 'zustand';

export type Theme = 'light' | 'dark';

// Estado del documento en edición (SDD §5, gestión de estado con Zustand).
// Este store NO conoce wailsjs: los componentes/hooks llaman a los bindings
// y vuelcan aquí los resultados, lo que permite testearlo sin backend.
export interface DocumentState {
  /** Markdown fuente que escribe el usuario. */
  content: string;
  /** HTML renderizado por el backend para el Preview. */
  html: string;
  /** Ruta del archivo abierto, o null si el documento aún no tiene archivo. */
  filePath: string | null;
  /** true si hay cambios sin guardar (RF4). */
  isDirty: boolean;
  /** Tema visual actual (RF5). */
  theme: Theme;

  setContent: (content: string) => void;
  setHtml: (html: string) => void;
  setFilePath: (filePath: string | null) => void;
  markClean: () => void;
  setTheme: (theme: Theme) => void;
}

export const useDocumentStore = create<DocumentState>()((set) => ({
  content: '',
  html: '',
  filePath: null,
  isDirty: false,
  theme: 'dark',

  // Regla de negocio del estado: escribir marca el documento como sucio…
  setContent: (content) => set({ content, isDirty: true }),
  setHtml: (html) => set({ html }),
  setFilePath: (filePath) => set({ filePath }),
  // …y markClean lo limpia (se usa tras guardar o abrir un archivo).
  markClean: () => set({ isDirty: false }),
  setTheme: (theme) => set({ theme }),
}));
