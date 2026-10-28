import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({ mode }) => {
  const roleFromMode =
    mode === 'admin'
      ? 'admin'
      : mode === 'officer' || mode === 'petugas'
      ? 'officer'
      : mode === 'passenger' || mode === 'penumpang' || mode === 'pengguna'
      ? 'passenger'
      : process.env.VITE_APP_ROLE || '';

  return {
    define: {
      'import.meta.env.VITE_APP_ROLE': JSON.stringify(roleFromMode),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
