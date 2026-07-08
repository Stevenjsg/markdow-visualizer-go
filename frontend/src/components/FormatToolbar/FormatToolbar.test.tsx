import { EditorSelection, EditorState, type StateCommand } from '@codemirror/state';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toggleBold } from '../Editor/markdownCommands';
import FormatToolbar, { FORMAT_BUTTONS } from './FormatToolbar';

// Aplica un StateCommand sobre un documento y devuelve el resultado, sin DOM
// (mismo patrón que markdownCommands.test.ts).
function apply(cmd: StateCommand, doc: string, anchor: number, head = anchor): string {
  let result = doc;
  const state = EditorState.create({
    doc,
    selection: EditorSelection.single(anchor, head),
  });
  cmd({
    state,
    dispatch: (tr) => {
      result = tr.state.doc.toString();
    },
  });
  return result;
}

describe('FormatToolbar', () => {
  it('muestra un botón por comando, con su atajo en el title', () => {
    render(<FormatToolbar run={vi.fn()} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(FORMAT_BUTTONS.length);
    expect(screen.getByRole('button', { name: 'Negrita' })).toHaveAttribute(
      'title',
      'Negrita (Ctrl/Cmd+B)',
    );
    expect(screen.getByRole('button', { name: 'Insertar enlace' })).toHaveAttribute(
      'title',
      'Insertar enlace (Ctrl/Cmd+K)',
    );
  });

  it('el botón Negrita despacha exactamente el comando del atajo Ctrl+B', async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    render(<FormatToolbar run={run} />);

    await user.click(screen.getByRole('button', { name: 'Negrita' }));

    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(toggleBold);
  });

  it('los botones de título despachan comandos que aplican el nivel correcto', async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    render(<FormatToolbar run={run} />);

    await user.click(screen.getByRole('button', { name: 'Título 2' }));

    expect(run).toHaveBeenCalledTimes(1);
    const cmd = run.mock.calls[0][0] as StateCommand;
    expect(apply(cmd, 'hola', 0)).toBe('## hola');
  });
});
