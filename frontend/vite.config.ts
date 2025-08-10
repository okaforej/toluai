import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Updated to match our scripts
    host: '0.0.0.0', // Allow external connections
    open: false, // Don't auto-open browser
    hmr: {
      overlay: true, // Show error overlay
    },
    watch: {
      usePolling: true, // Better file watching on some systems
      interval: 100, // Check for changes every 100ms
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying
      }
    }
  },
  build: {
    outDir: '../app/static/react',
    emptyOutDir: true,
    sourcemap: true, // Generate sourcemaps for debugging
  },
  define: {
    // Make sure environment variables are available
    __DEV__: true,
  }
})