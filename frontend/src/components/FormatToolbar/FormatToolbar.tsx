import type { StateCommand } from '@codemirror/state';
import {
  insertLink,
  setHeading,
  toggleBold,
  toggleItalic,
  toggleStrikethrough,
} from '../Editor/markdownCommands';

export interface FormatToolbarProps {
  /** Ejecuta un comando de formato sobre el editor (lo cablea Editor.tsx). */
  run: (cmd: StateCommand) => void;
}

// Definición declarativa de la botonera: cada botón reutiliza el mismo
// StateCommand que su atajo de teclado (markdownCommands.ts), así la lógica
// de formato vive en un único sitio ya cubierto por tests.
// Se define a nivel de módulo para que la identidad de los comandos sea
// estable (facilita testear que cada botón despacha el comando correcto).
export const FORMAT_BUTTONS: ReadonlyArray<{
  label: string;
  name: string;
  shortcut: string;
  keys: string;
  cmd: StateCommand;
  labelClass?: string;
}> = [
  {
    label: 'B',
    name: 'Negrita',
    shortcut: 'Ctrl/Cmd+B',
    keys: 'Control+B Meta+B',
    cmd: toggleBold,
    labelClass: 'font-bold',
  },
  {
    label: 'I',
    name: 'Cursiva',
    shortcut: 'Ctrl/Cmd+I',
    keys: 'Control+I Meta+I',
    cmd: toggleItalic,
    labelClass: 'italic',
  },
  {
    label: 'S',
    name: 'Tachado',
    shortcut: 'Ctrl/Cmd+Shift+X',
    keys: 'Control+Shift+X Meta+Shift+X',
    cmd: toggleStrikethrough,
    labelClass: 'line-through',
  },
  {
    label: '🔗',
    name: 'Insertar enlace',
    shortcut: 'Ctrl/Cmd+K',
    keys: 'Control+K Meta+K',
    cmd: insertLink,
  },
  {
    label: 'H1',
    name: 'Título 1',
    shortcut: 'Ctrl/Cmd+Alt+1',
    keys: 'Control+Alt+1 Meta+Alt+1',
    cmd: setHeading(1),
  },
  {
    label: 'H2',
    name: 'Título 2',
    shortcut: 'Ctrl/Cmd+Alt+2',
    keys: 'Control+Alt+2 Meta+Alt+2',
    cmd: setHeading(2),
  },
  {
    label: 'H3',
    name: 'Título 3',
    shortcut: 'Ctrl/Cmd+Alt+3',
    keys: 'Control+Alt+3 Meta+Alt+3',
    cmd: setHeading(3),
  },
];

// Botonera de formato del editor: atajos de markdownCommands en forma de
// botones, solo sobre el panel del editor. Se colapsa desde la Toolbar
// principal ("Aa Formato") y su visibilidad persiste en settings.
function FormatToolbar({ run }: FormatToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Formato de Markdown"
      className="flex items-center gap-0.5 border-b border-neutral-200 px-2 py-1 dark:border-neutral-700"
    >
      {FORMAT_BUTTONS.map((btn) => (
        <button
          key={btn.name}
          type="button"
          aria-label={btn.name}
          aria-keyshortcuts={btn.keys}
          title={`${btn.name} (${btn.shortcut})`}
          // preventDefault en mousedown: el editor no pierde el foco ni la
          // selección al pulsar el botón (el comando actúa sobre la selección).
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run(btn.cmd)}
          className={`min-w-8 rounded px-2 py-0.5 text-sm hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 dark:hover:bg-neutral-700 ${btn.labelClass ?? ''}`}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}

export default FormatToolbar;
