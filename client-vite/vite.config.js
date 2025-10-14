import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // 👈 đổi port FE tại đây (vd: 3000, 5173,...)
    proxy: {
      '/api': 'http://localhost:5000', // 👈 BE Node.js chạy ở port 5000
    },
  },
})
