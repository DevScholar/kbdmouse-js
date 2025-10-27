import { defineConfig } from 'vite'

export default defineConfig({
  appType: 'mpa',
  publicDir: 'public',
  server: {
    open: true,
    port: 3000
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