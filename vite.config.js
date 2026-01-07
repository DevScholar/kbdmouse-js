import { defineConfig } from 'vite'

export default defineConfig(({ command, mode }) => {
  const isLibraryBuild = mode === 'library'
  const isNoPackagingBuild = mode === 'noPackaging'
  
  if (isNoPackagingBuild) {
    // No packaging build mode: TS->JS without mangling, includes CSS
    return {
      build: {
        lib: {
          entry: 'src/kbdmouse.ts',
          name: 'KbdMouseJs',
          fileName: (format) => `kbdmouse-js.${format}.js`,
          formats: ['es', 'cjs'] // Generate both ES modules and CommonJS
        },
        rollupOptions: {
          external: [],
          output: {
            globals: {},
            // Preserve original module names and structure
            preserveModules: true,
            preserveModulesRoot: 'src',
            // No minification or mangling
            compact: false,
            minifyInternalExports: false,
            // Ensure clean module names
            entryFileNames: '[name].js',
            chunkFileNames: '[name].js'
          },
          // Preserve module IDs
          preserveEntrySignatures: 'strict',
          // Include CSS files
          plugins: [
            {
              name: 'css-exporter',
              generateBundle(options, bundle) {
                // Find and extract CSS
                for (const file in bundle) {
                  if (file.endsWith('.css')) {
                    // CSS will be automatically extracted by Vite
                    console.log(`Extracted CSS: ${file}`);
                  }
                }
              }
            }
          ]
        },
        // Disable minification completely
        minify: false,
        // Generate source maps for debugging
        sourcemap: true,
        // Copy CSS files as-is
        copyPublicDir: true
      },
      css: {
        // Extract CSS to separate files
        extract: {
          filename: 'kbdmouse-js.css'
        }
      }
    }
  }
  
  if (isLibraryBuild) {
    // Library mode: minified build for production
    return {
      build: {
        lib: {
          entry: 'src/kbdmouse.ts',
          name: 'KbdMouseJs',
          fileName: (format) => `kbdmouse-js.${format}.js`
        },
        rollupOptions: {
          external: [],
          output: {
            globals: {}
          }
        }
      }
    }
  }
  
  // Development mode: includes demo page
  return {
    // Default config includes index.html
  }
})