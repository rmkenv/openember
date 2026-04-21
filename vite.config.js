import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import jurisdictionConfigPlugin from './vite-plugin-jurisdiction.js'

export default defineConfig({
  plugins: [
    jurisdictionConfigPlugin(),  // runs build-config.js before every build/dev start
    react(),
  ],
  server: { port: 3000 }
})
