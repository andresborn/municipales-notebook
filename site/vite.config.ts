import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // Project pages are served from /municipales-notebook/, but local dev uses /.
  base: mode === 'production' ? '/municipales-notebook/' : '/',
  plugins: [react()],
  server: {
    fs: {
      // The source CSVs live in the repository-level src/data/clean folder.
      allow: ['..'],
    },
  },
}))
