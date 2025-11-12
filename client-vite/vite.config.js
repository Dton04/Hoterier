import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, //  FE port
    proxy: {
      '/api': 'http://localhost:5000', //  BE Node.js
      '/socket.io': {                  //   WebSocket Socket.IO
        target: 'http://localhost:5000', // BE Socket.IO URL
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
