import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // The source CSVs live in the repository-level src/data/clean folder.
      allow: ['..'],
    },
  },
})
