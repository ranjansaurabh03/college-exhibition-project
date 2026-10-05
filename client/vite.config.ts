import { gzipSync } from 'node:zlib'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * Writes build-stats.json next to the built site: the real raw and gzip size of every
 * JS/CSS chunk. The project report page reads it, so its numbers are measured, not claimed.
 */
function buildStats(): Plugin {
  return {
    name: 'build-stats',
    apply: 'build',
    generateBundle(_options, bundle) {
      // Chunks downloaded on first visit: the entry plus everything it imports statically.
      const initial = new Set<string>()
      const visit = (fileName: string) => {
        const c = bundle[fileName]
        if (!c || c.type !== 'chunk' || initial.has(fileName)) return
        initial.add(fileName)
        c.imports.forEach(visit)
      }
      Object.values(bundle).forEach((c) => c.type === 'chunk' && c.isEntry && visit(c.fileName))

      const files = Object.values(bundle)
        .filter((f) => /\.(js|css)$/.test(f.fileName))
        .map((f) => {
          const source = f.type === 'chunk' ? f.code : f.source
          const buf = Buffer.from(typeof source === 'string' ? source : new Uint8Array(source))
          return {
            file: f.fileName,
            name: f.type === 'chunk' ? f.name : f.fileName.replace(/^assets\//, '').replace(/-[\w-]{8}\.css$/, '.css'),
            kind: f.type === 'chunk' ? (f.isEntry ? 'entry' : f.isDynamicEntry ? 'lazy' : 'shared') : 'css',
            initial: f.type === 'asset' || initial.has(f.fileName),
            bytes: buf.length,
            gzip: gzipSync(buf, { level: 9 }).length,
          }
        })
        .sort((a, b) => b.gzip - a.gzip)
      this.emitFile({
        type: 'asset',
        fileName: 'build-stats.json',
        source: JSON.stringify({ builtAt: new Date().toISOString(), files }, null, 2),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the same build works at any path
  // (GitHub Pages serves it from /college-exhibition-project/).
  base: './',
  plugins: [react(), tailwindcss(), buildStats()],
})
