const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

// Initialize Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      
      // Special handling for webpack hot update files and webpack-hmr
      if (req.url.includes('.hot-update.json') || 
          req.url.includes('.hot-update.js') || 
          req.url.includes('webpack-hmr')) {
        
        // Set headers to prevent caching
        res.setHeader('Cache-Control', 'no-store, must-revalidate')
        res.setHeader('Pragma', 'no-cache')
        res.setHeader('Expires', '0')
        
        // For webpack-hmr endpoint specifically
        if (req.url.includes('webpack-hmr')) {
          res.setHeader('Content-Type', 'text/event-stream')
          res.setHeader('Connection', 'keep-alive')
          res.write('\n')
          
          // Keep the connection alive
          const interval = setInterval(() => {
            res.write('data: {}\n\n')
          }, 15000)
          
          // Clean up on close
          req.on('close', () => {
            clearInterval(interval)
          })
          
          return
        }
        
        // For hot-update.json files, try to locate them in .next directory
        if (req.url.includes('.hot-update.json')) {
          const fileName = path.basename(req.url)
          const filePath = path.join(process.cwd(), '.next', 'static', 'webpack', fileName)
          
          // If file exists, serve it
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8')
            res.setHeader('Content-Type', 'application/json')
            res.end(content)
            return
          }
        }
      }
      
      // Let Next.js handle all other requests
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling request:', err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log('> HMR enhancement enabled')
  })
})