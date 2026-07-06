import { EditorSelection, EditorState, type Transaction } from '@codemirror/state';
import type { StateCommand } from '@codemirror/state';
import {
  insertLink,
  setHeading,
  toggleBold,
  toggleItalic,
  toggleStrikethrough,
} from './markdownCommands';

// Aplica un comando sobre un doc con selección (anchor..head) y devuelve el
// estado resultante. Sin DOM: los comandos son StateCommand puros.
function apply(cmd: StateCommand, doc: string, anchor: number, head = anchor): EditorState {
  const state = EditorState.create({ doc, selection: EditorSelection.single(anchor, head) });
  let result = state;
  cmd({
    state,
    dispatch: (tr: Transaction) => {
      result = tr.state;
    },
  });
  return result;
}

describe('toggleBold', () => {
  it('con selección vacía inserta ** ** y deja el cursor dentro', () => {
    const s = apply(toggleBold, 'hola ', 5);
    expect(s.doc.toString()).toBe('hola ****');
    expect(s.selection.main.head).toBe(7);
  });

  it('envuelve la selección con **', () => {
    const s = apply(toggleBold, 'hola mundo', 0, 4);
    expect(s.doc.toString()).toBe('**hola** mundo');
    expect(s.sliceDoc(s.selection.main.from, s.selection.main.to)).toBe('hola');
  });

  it('desenvuelve cuando los marcadores rodean la selección', () => {
    const s = apply(toggleBold, '**hola** mundo', 2, 6);
    expect(s.doc.toString()).toBe('hola mundo');
    expect(s.sliceDoc(s.selection.main.from, s.selection.main.to)).toBe('hola');
  });

  it('desenvuelve cuando la selección incluye los marcadores', () => {
    const s = apply(toggleBold, '**hola** mundo', 0, 8);
    expect(s.doc.toString()).toBe('hola mundo');
    expect(s.sliceDoc(s.selection.main.from, s.selection.main.to)).toBe('hola');
  });
});

describe('toggleItalic', () => {
  it('envuelve con un solo asterisco', () => {
    const s = apply(toggleItalic, 'hola', 0, 4);
    expect(s.doc.toString()).toBe('*hola*');
  });

  it('dentro de negrita añade cursiva (***) en vez de romper la negrita', () => {
    const s = apply(toggleItalic, '**hola**', 2, 6);
    expect(s.doc.toString()).toBe('***hola***');
  });

  it('desenvuelve una cursiva simple', () => {
    const s = apply(toggleItalic, '*hola*', 1, 5);
    expect(s.doc.toString()).toBe('hola');
  });
});

describe('toggleStrikethrough', () => {
  it('envuelve y desenvuelve con ~~', () => {
    const wrapped = apply(toggleStrikethrough, 'fuera', 0, 5);
    expect(wrapped.doc.toString()).toBe('~~fuera~~');

    const unwrapped = apply(toggleStrikethrough, '~~fuera~~', 2, 7);
    expect(unwrapped.doc.toString()).toBe('fuera');
  });
});

describe('insertLink', () => {
  it('con selección usa el texto y deja seleccionada la url', () => {
    const s = apply(insertLink, 'Wails', 0, 5);
    expect(s.doc.toString()).toBe('[Wails](url)');
    expect(s.sliceDoc(s.selection.main.from, s.selection.main.to)).toBe('url');
  });

  it('sin selección inserta la plantilla y deja seleccionado el texto', () => {
    const s = apply(insertLink, '', 0);
    expect(s.doc.toString()).toBe('[texto](url)');
    expect(s.sliceDoc(s.selection.main.from, s.selection.main.to)).toBe('texto');
  });
});

describe('setHeading', () => {
  it('aplica el prefijo en una línea normal', () => {
    const s = apply(setHeading(2), 'hola', 1);
    expect(s.doc.toString()).toBe('## hola');
  });

  it('con el mismo nivel lo quita (toggle)', () => {
    const s = apply(setHeading(2), '## hola', 4);
    expect(s.doc.toString()).toBe('hola');
  });

  it('con otro nivel lo reemplaza', () => {
    const s = apply(setHeading(3), '# hola', 3);
    expect(s.doc.toString()).toBe('### hola');
  });

  it('aplica a todas las líneas de la selección', () => {
    const s = apply(setHeading(1), 'uno\ndos', 0, 7);
    expect(s.doc.toString()).toBe('# uno\n# dos');
  });
});
