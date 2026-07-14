import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDocumentStore } from '../../store/documentStore';
import Toolbar from './Toolbar';

function renderToolbar() {
  const handlers = { onOpen: vi.fn(), onSave: vi.fn(), onSaveAs: vi.fn(), onClose: vi.fn() };
  render(<Toolbar {...handlers} />);
  return handlers;
}

describe('Toolbar', () => {
  beforeEach(() => {
    useDocumentStore.setState(useDocumentStore.getInitialState(), true);
  });

  it('dispara los callbacks correctos de cada botón', async () => {
    const user = userEvent.setup();
    const handlers = renderToolbar();

    await user.click(screen.getByRole('button', { name: 'Abrir archivo' }));
    expect(handlers.onOpen).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Guardar archivo' }));
    expect(handlers.onSave).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Guardar como archivo nuevo' }));
    expect(handlers.onSaveAs).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Cerrar archivo' }));
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });

  it('muestra el indicador ● solo cuando hay cambios sin guardar', () => {
    renderToolbar();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    act(() => {
      useDocumentStore.getState().setContent('cambio');
    });
    expect(screen.getByRole('status')).toHaveAccessibleName('Hay cambios sin guardar');

    act(() => {
      useDocumentStore.getState().markClean();
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('muestra la ruta del archivo abierto o "Sin archivo"', () => {
    renderToolbar();
    expect(screen.getByText('Sin archivo')).toBeInTheDocument();

    act(() => {
      useDocumentStore.getState().setFilePath('C:\\notas\\readme.md');
    });
    expect(screen.getByText('C:\\notas\\readme.md')).toBeInTheDocument();
  });

  it('el toggle de tema alterna store.theme', async () => {
    const user = userEvent.setup();
    renderToolbar();

    await user.click(screen.getByRole('button', { name: 'Alternar tema claro/oscuro' }));
    expect(useDocumentStore.getState().theme).toBe('light');
  });

  it('el toggle "👁 Visor" alterna store.viewerMode y oculta los toggles del editor', async () => {
    const user = userEvent.setup();
    renderToolbar();

    const toggle = screen.getByRole('button', { name: 'Modo visor' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false'); // edición por defecto
    expect(screen.getByRole('button', { name: 'Botonera de formato' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ajuste de línea del editor' })).toBeInTheDocument();

    await user.click(toggle);
    expect(useDocumentStore.getState().viewerMode).toBe(true);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    // En modo visor los toggles que solo afectan al editor desaparecen.
    expect(screen.queryByRole('button', { name: 'Botonera de formato' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Ajuste de línea del editor' }),
    ).not.toBeInTheDocument();
  });

  it('el toggle "Aa Formato" alterna store.formatToolbar y su aria-pressed', async () => {
    const user = userEvent.setup();
    renderToolbar();

    const toggle = screen.getByRole('button', { name: 'Botonera de formato' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true'); // visible por defecto

    await user.click(toggle);
    expect(useDocumentStore.getState().formatToolbar).toBe(false);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });
});
