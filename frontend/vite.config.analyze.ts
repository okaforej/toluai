import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// Vite configuration for bundle analysis
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      template: 'treemap', // or 'sunburst', 'network'
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/bundle-analysis.html',
    }),
  ],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@headlessui/react', '@heroicons/react'],
          'chart-vendor': ['recharts'],
          'utils': ['lodash', 'date-fns', 'axios'],
        },
      },
    },
  },
});