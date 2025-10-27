import { defineConfig } from 'vite'

export default defineConfig({
  appType: 'mpa',
  publicDir: 'public',
  server: {
    open: true,
    port: 3000,
    host: '0.0.0.0' // Listen on all network interfaces for mobile access
  },
  build: {
    lib: {
      entry: './src/main.ts',
      name: 'kbdmouse-js',
      formats: ['es', 'cjs'], // Use modern formats only, remove UMD
      fileName: (format) => `kbdmouse-js.${format === 'es' ? 'mjs' : 'js'}`
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    },
    outDir: 'dist',
    assetsDir: 'assets',
    copyPublicDir: true,
    target: 'es2022' // Use modern browser syntax
  }
})