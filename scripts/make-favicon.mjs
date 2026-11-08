// Regenerate the Huaihua Drama favicon from the brand mark (header logo).
// Usage: node scripts/make-favicon.mjs   (sharp is resolved from backend/node_modules)
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(path.join(root, 'backend', 'package.json'))
const sharp = require('sharp')

// Brand mark: rounded square, magenta -> gold gradient (145deg), white huai-leaf glyph.
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.574" y2="0.819">
      <stop offset="0" stop-color="#FF2E88"/>
      <stop offset="1" stop-color="#FFC033"/>
    </linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.26"/>
      <stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <rect width="512" height="512" rx="112" fill="url(#shine)"/>
  <g transform="translate(101 47) scale(12.5)" fill="none" stroke="#FFFFFF"
     stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 21c0-5 3-9 8-10-1 6-4 9-8 10z"/>
    <path d="M12 21c0-5-3-9-8-10 1 6 4 9 8 10z"/>
    <path d="M12 21v-7"/>
  </g>
</svg>`

const targets = [
  path.join(root, 'frontend', 'app', 'public', 'favicon.png'),
  path.join(root, 'frontend', 'public', 'favicon.png'),
]

for (const target of targets) {
  await sharp(Buffer.from(svg)).resize(512, 512).png().toFile(target)
  console.log(`[ok] ${path.relative(root, target)}`)
}
