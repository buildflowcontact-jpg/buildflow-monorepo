// apps/frontend/vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    // The IFC engine is intentionally isolated in an async chunk and only loads on demand.
    chunkSizeWarningLimit: 3000,
    modulePreload: {
      resolveDependencies(_url, deps, context) {
        if (context.hostType === 'html') {
          return deps.filter((dep) => {
            return !dep.includes('pdfHighlighter')
              && !dep.includes('ifcCore')
              && !dep.includes('ifcViewer')
              && !dep.includes('ifcThree')
              && !dep.includes('ifcControls')
              && !dep.includes('ifcBvh')
              && !dep.includes('threeVendor')
              && !dep.includes('imageViewer');
          });
        }

        return deps;
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@tanstack/react-query')) {
            return 'dataVendor';
          }

          if (id.includes('@supabase/supabase-js')) {
            return 'supabaseVendor';
          }

          if (id.includes('react-quick-pinch-zoom')) {
            return 'imageViewer';
          }

          if (id.includes('camera-controls')) {
            return 'ifcControls';
          }

          if (id.includes('three-mesh-bvh')) {
            return 'ifcBvh';
          }

          if (id.includes('web-ifc-viewer')) {
            return 'ifcViewer';
          }

          if (id.includes('web-ifc-three')) {
            return 'ifcThree';
          }

          if (id.includes('web-ifc')) {
            return 'ifcCore';
          }

          if (id.includes('/three/')) {
            return 'threeVendor';
          }
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
