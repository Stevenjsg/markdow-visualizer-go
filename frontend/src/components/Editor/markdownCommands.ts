import { EditorSelection, type StateCommand } from '@codemirror/state';

// Comandos de formato Markdown para el editor (mejoras UX, convención
// estándar: Ctrl/Cmd+B, +I, +K…). Son StateCommand puros: operan sobre
// { state, dispatch }, así que se testean sin DOM (markdownCommands.test.ts).

// toggleInline crea un comando que envuelve/desenvuelve la selección con un
// marcador simétrico (**, *, ~~). Reglas por rango:
//  1. La selección ya INCLUYE los marcadores  -> quitarlos.
//  2. Los marcadores RODEAN la selección      -> quitarlos (salvo que sean
//     parte de un marcador doble mayor, p. ej. * dentro de **: se envuelve
//     igualmente y queda ***negrita cursiva***).
//  3. En el resto de casos                     -> envolver; con selección
//     vacía el cursor queda entre los marcadores.
function toggleInline(marker: string): StateCommand {
  return ({ state, dispatch }) => {
    const len = marker.length;

    const changes = state.changeByRange((range) => {
      const { from, to } = range;
      const inner = state.sliceDoc(from, to);
      const before = state.sliceDoc(Math.max(0, from - len), from);
      const after = state.sliceDoc(to, Math.min(state.doc.length, to + len));

      // Caso 1: "**texto**" seleccionado completo.
      if (inner.length >= 2 * len && inner.startsWith(marker) && inner.endsWith(marker)) {
        return {
          changes: [
            { from, to: from + len, insert: '' },
            { from: to - len, to, insert: '' },
          ],
          range: EditorSelection.range(from, to - 2 * len),
        };
      }

      // Caso 2: los marcadores rodean la selección: **|texto|**.
      if (before === marker && after === marker) {
        // Si en realidad son parte de un marcador doble (cursiva dentro de
        // negrita: **|texto|** con marker '*'), no desenvuelve: envuelve.
        const beforeExt = state.sliceDoc(Math.max(0, from - 2 * len), from);
        const afterExt = state.sliceDoc(to, Math.min(state.doc.length, to + 2 * len));
        const partOfDouble = beforeExt === marker + marker && afterExt === marker + marker;

        if (!partOfDouble) {
          return {
            changes: [
              { from: from - len, to: from, insert: '' },
              { from: to, to: to + len, insert: '' },
            ],
            range: EditorSelection.range(from - len, to - len),
          };
        }
      }

      // Caso 3: envolver.
      return {
        changes: [
          { from, insert: marker },
          { from: to, insert: marker },
        ],
        range: EditorSelection.range(from + len, to + len),
      };
    });

    dispatch(state.update(changes, { scrollIntoView: true, userEvent: 'input' }));
    return true;
  };
}

export const toggleBold = toggleInline('**');
export const toggleItalic = toggleInline('*');
export const toggleStrikethrough = toggleInline('~~');

// insertLink inserta [texto](url). Con selección, esta pasa a ser el texto y
// queda seleccionado el hueco "url"; sin selección queda seleccionado "texto".
export const insertLink: StateCommand = ({ state, dispatch }) => {
  const changes = state.changeByRange((range) => {
    const hasSelection = !range.empty;
    const text = hasSelection ? state.sliceDoc(range.from, range.to) : 'texto';
    const url = 'url';
    const start = range.from;

    const selFrom = hasSelection ? start + 1 + text.length + 2 : start + 1;
    const selTo = hasSelection ? selFrom + url.length : selFrom + text.length;

    return {
      changes: { from: range.from, to: range.to, insert: `[${text}](${url})` },
      range: EditorSelection.range(selFrom, selTo),
    };
  });

  dispatch(state.update(changes, { scrollIntoView: true, userEvent: 'input' }));
  return true;
};

const headingRe = /^(#{1,6})\s+/;

// setHeading alterna el prefijo de título en cada línea de la selección:
// mismo nivel -> lo quita; otro nivel o ninguno -> aplica el nuevo.
export function setHeading(level: number): StateCommand {
  return ({ state, dispatch }) => {
    const prefix = '#'.repeat(level) + ' ';
    const changes: { from: number; to: number; insert: string }[] = [];
    const seen = new Set<number>();

    for (const range of state.selection.ranges) {
      const firstLine = state.doc.lineAt(range.from).number;
      const lastLine = state.doc.lineAt(range.to).number;
      for (let n = firstLine; n <= lastLine; n++) {
        if (seen.has(n)) continue;
        seen.add(n);

        const line = state.doc.line(n);
        const match = headingRe.exec(line.text);
        if (match && match[1].length === level) {
          changes.push({ from: line.from, to: line.from + match[0].length, insert: '' });
        } else if (match) {
          changes.push({ from: line.from, to: line.from + match[0].length, insert: prefix });
        } else {
          changes.push({ from: line.from, to: line.from, insert: prefix });
        }
      }
    }

    if (changes.length === 0) return false;
    // La selección se remapea sola a través de los cambios.
    dispatch(state.update({ changes, scrollIntoView: true, userEvent: 'input' }));
    return true;
  };
}
