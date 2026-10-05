import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the same build works at any path
  // (GitHub Pages serves it from /college-exhibition-project/).
  base: './',
  plugins: [react(), tailwindcss()],
})
