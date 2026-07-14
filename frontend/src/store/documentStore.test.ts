import { useDocumentStore } from './documentStore';

// Reglas de negocio del estado (P3.2) verificadas en P6.2.
describe('documentStore', () => {
  beforeEach(() => {
    useDocumentStore.setState(useDocumentStore.getInitialState(), true);
  });

  it('setContent actualiza el contenido y marca isDirty', () => {
    useDocumentStore.getState().setContent('# Hola');

    const state = useDocumentStore.getState();
    expect(state.content).toBe('# Hola');
    expect(state.isDirty).toBe(true);
  });

  it('markClean limpia isDirty sin tocar el contenido', () => {
    useDocumentStore.getState().setContent('# Hola');
    useDocumentStore.getState().markClean();

    const state = useDocumentStore.getState();
    expect(state.isDirty).toBe(false);
    expect(state.content).toBe('# Hola');
  });

  it('setTheme alterna entre claro y oscuro', () => {
    useDocumentStore.getState().setTheme('light');
    expect(useDocumentStore.getState().theme).toBe('light');
  });

  it('resetDocument vuelve al estado vacío y limpio en un solo paso', () => {
    const s = useDocumentStore.getState();
    s.setContent('# algo');
    s.setHtml('<h1>algo</h1>');
    s.setFilePath('C:\\notas\\algo.md');

    useDocumentStore.getState().resetDocument();

    const state = useDocumentStore.getState();
    expect(state.content).toBe('');
    expect(state.html).toBe('');
    expect(state.filePath).toBeNull();
    expect(state.isDirty).toBe(false);
  });

  it('setViewerMode alterna el modo visor (desactivado por defecto)', () => {
    expect(useDocumentStore.getState().viewerMode).toBe(false);
    useDocumentStore.getState().setViewerMode(true);
    expect(useDocumentStore.getState().viewerMode).toBe(true);
  });

  it('setWordWrap alterna el ajuste de línea', () => {
    expect(useDocumentStore.getState().wordWrap).toBe(true);
    useDocumentStore.getState().setWordWrap(false);
    expect(useDocumentStore.getState().wordWrap).toBe(false);
  });

  it('setSplitRatio clampa la proporción al rango 0.2–0.8', () => {
    useDocumentStore.getState().setSplitRatio(0.05);
    expect(useDocumentStore.getState().splitRatio).toBe(0.2);

    useDocumentStore.getState().setSplitRatio(0.95);
    expect(useDocumentStore.getState().splitRatio).toBe(0.8);

    useDocumentStore.getState().setSplitRatio(0.6);
    expect(useDocumentStore.getState().splitRatio).toBe(0.6);
  });
});
