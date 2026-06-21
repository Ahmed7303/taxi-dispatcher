import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// База './' обязательна: Electron грузит файлы по file://, абсолютные пути ломаются
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true },
});
