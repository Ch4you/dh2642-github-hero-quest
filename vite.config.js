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

  // 1. 在 Vite 中，对应的配置项叫 base，而不是 publicPath
  base: process.env.NODE_ENV === 'production' 
    ? '/dh2642-github-hero-quest/' 
    : '/',

  build: {
    // 2. 在 Vite 中，修改输出目录的参数在 build 内部，叫 outDir
    outDir: 'docs',
  },
  
  // 注意：transpileDependencies 是 Vue CLI 的参数，Vite 不需要这个，可以删掉
});