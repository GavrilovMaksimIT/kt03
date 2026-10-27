const { Prisma } = require('@prisma/client')

function notFound(req, res) {
  res.status(404).json({ error: 'Route not found' })
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'A record with this unique value already exists' })
    }

    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Record not found' })
    }

    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Related record does not exist' })
    }
  }

  console.error(error)
  res.status(500).json({ error: 'Internal server error' })
}

module.exports = { errorHandler, notFound }
