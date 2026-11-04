import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

const resolvePkg = (pkg: string) => {
  const local = path.resolve(__dirname, 'node_modules', pkg);
  if (fs.existsSync(local)) return local;
  const root = path.resolve(__dirname, '../../node_modules', pkg);
  if (fs.existsSync(root)) return root;
  return pkg;
};

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_ROLE': JSON.stringify('passenger'),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../'),
      'react': resolvePkg('react'),
      'react-dom': resolvePkg('react-dom'),
      'react/jsx-runtime': resolvePkg('react/jsx-runtime'),
    },
    dedupe: ['react', 'react-dom'],
  },
});
