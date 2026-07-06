import { act, renderHook } from '@testing-library/react';
import { useDocumentStore } from '../store/documentStore';
import { useDebouncedMarkdown } from './useDebouncedMarkdown';

// Mock del binding de Wails: los tests no necesitan backend real (P6.2).
vi.mock('../../wailsjs/go/main/App', () => ({
  ParseMarkdown: vi.fn((content: string) => Promise.resolve(`<html>${content}</html>`)),
}));

import { ParseMarkdown } from '../../wailsjs/go/main/App';

describe('useDebouncedMarkdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useDocumentStore.setState(useDocumentStore.getInitialState(), true);
    vi.mocked(ParseMarkdown).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('agrupa las llamadas: no llama en cada tecla, solo tras la pausa', async () => {
    renderHook(() => useDebouncedMarkdown());

    // Dos "teclas" seguidas antes de que venza el debounce.
    act(() => {
      useDocumentStore.getState().setContent('# H');
    });
    act(() => {
      useDocumentStore.getState().setContent('# Hola');
    });
    expect(ParseMarkdown).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    // Una única llamada, con el contenido más reciente.
    expect(ParseMarkdown).toHaveBeenCalledTimes(1);
    expect(ParseMarkdown).toHaveBeenCalledWith('# Hola');
  });

  it('vuelca el HTML devuelto por el backend en store.html', async () => {
    renderHook(() => useDebouncedMarkdown());

    act(() => {
      useDocumentStore.getState().setContent('# Hola');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(useDocumentStore.getState().html).toBe('<html># Hola</html>');
  });

  it('un error del binding no rompe la UI: se refleja en status', async () => {
    vi.mocked(ParseMarkdown).mockRejectedValueOnce('render explotó');
    renderHook(() => useDebouncedMarkdown());

    act(() => {
      useDocumentStore.getState().setContent('# Hola');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    const status = useDocumentStore.getState().status;
    expect(status?.type).toBe('error');
    expect(status?.text).toContain('render explotó');
  });
});
