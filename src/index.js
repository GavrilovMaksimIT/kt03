const express = require('express')
const { port, prisma } = require('./config')
const usersRouter = require('./routes/users')
const postsRouter = require('./routes/posts')
const { errorHandler, notFound } = require('./middleware/errorHandler')

const app = express()

app.use(express.json({ limit: '1mb' }))
app.get('/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api/users', usersRouter)
app.use('/api/posts', postsRouter)
app.use(notFound)
app.use(errorHandler)

async function shutdown(signal) {
  console.log(`${signal}: shutting down`)
  await prisma.$disconnect()
  process.exit(0)
}

if (require.main === module) {
  app.listen(port, () => {
    console.log(`API is running at http://localhost:${port}`)
  })

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

module.exports = app
