const path = require('node:path')
const dotenv = require('dotenv')
const { PrismaClient } = require('@prisma/client')

dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true })

const port = Number.parseInt(process.env.PORT || '3000', 10)

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535')
}

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
})

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port,
  prisma
}
