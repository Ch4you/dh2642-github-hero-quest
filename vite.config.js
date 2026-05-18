import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Project Pages: https://<user>.github.io/<repo>/  → CI sets VITE_BASE_PATH=/<repo>/
// Local dev: omit VITE_BASE_PATH (defaults to "/").
function viteBase() {
  const raw = process.env.VITE_BASE_PATH;
  if (raw == null || raw === '' || raw === '/') return '/';
  const t = raw.trim();
  const withLeading = t.startsWith('/') ? t : `/${t}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}
const base = viteBase();

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    minify: false,
  },
});