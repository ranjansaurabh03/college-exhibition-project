// Vercel entry point: the whole Express API (server/) runs as one function at /api/*.
// MongoDB connects lazily on the first request that needs it and is reused while the instance is warm.
import { createApp } from '../server/src/app.js'

export default createApp()
