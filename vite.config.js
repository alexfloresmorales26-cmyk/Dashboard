import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      input: 'index.html'
    }
  },
  server: {
    open: true,
    port: 5173
  }
});
