import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base path so the built app works from any GitHub Pages
// subpath (https://username.github.io/repo-name/) without hardcoding
// the repo name. Combined with HashRouter, this makes deep links and
// hard refreshes work correctly with zero server-side rewrite rules.
export default defineConfig({
  plugins: [react()],
  base: './',
})
