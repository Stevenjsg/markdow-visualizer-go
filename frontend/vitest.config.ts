import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Configuración de tests de frontend (P6.2): jsdom + Testing Library.
// Los bindings de wailsjs se mockean en cada test: no hace falta backend.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
