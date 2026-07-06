// Manejo centralizado de errores de bindings (P5.4). Wails rechaza las
// promesas con el mensaje del error de Go (string); esto lo normaliza para
// mostrarlo en la StatusBar.
export function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return String(err);
}
