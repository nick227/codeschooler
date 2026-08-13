import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const port = Number(process.env.PORT || 4173)

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/')
  let file = path.normalize(path.join(dist, urlPath === '/' ? 'index.html' : urlPath))
  if (!file.startsWith(dist)) {
    res.writeHead(403).end()
    return
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(dist, 'index.html')
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] ?? 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
}).listen(port, '0.0.0.0', () => {
  console.log(`web listening on 0.0.0.0:${port}`)
})
