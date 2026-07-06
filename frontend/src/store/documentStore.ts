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
  /** Proporción del ancho que ocupa el editor (0.2–0.8, P5.2). */
  splitRatio: number;

  setContent: (content: string) => void;
  setHtml: (html: string) => void;
  setFilePath: (filePath: string | null) => void;
  markClean: () => void;
  setTheme: (theme: Theme) => void;
  setSplitRatio: (ratio: number) => void;
}

// Límites del divisor: ningún panel baja del 20% del ancho.
const MIN_SPLIT = 0.2;
const MAX_SPLIT = 0.8;

export const useDocumentStore = create<DocumentState>()((set) => ({
  content: '',
  html: '',
  filePath: null,
  isDirty: false,
  theme: 'dark',
  splitRatio: 0.5,

  // Regla de negocio del estado: escribir marca el documento como sucio…
  setContent: (content) => set({ content, isDirty: true }),
  setHtml: (html) => set({ html }),
  setFilePath: (filePath) => set({ filePath }),
  // …y markClean lo limpia (se usa tras guardar o abrir un archivo).
  markClean: () => set({ isDirty: false }),
  setTheme: (theme) => set({ theme }),
  setSplitRatio: (ratio) => set({ splitRatio: Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, ratio)) }),
}));
