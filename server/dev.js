import { createServer } from 'vite'

process.env.NODE_ENV = 'development'

// Keep the API and Vite in one Node process. Spawning two child processes here
// caused the launcher to exit early in Git Bash on Windows.
await import('./index.js')

const vite = await createServer({
  server: {
    host: true,
  },
})

await vite.listen()
vite.printUrls()

let stopping = false

async function stop() {
  if (stopping) return
  stopping = true
  await vite.close()
  process.exit(0)
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)
