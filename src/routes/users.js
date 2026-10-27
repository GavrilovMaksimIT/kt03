const express = require('express')
const Joi = require('joi')
const { prisma } = require('../config')
const validate = require('../middleware/validate')

const router = express.Router()
const idSchema = Joi.object({ id: Joi.number().integer().positive().required() })
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
})
const createUserSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  name: Joi.string().trim().min(1).max(100).required(),
  role: Joi.string().valid('USER', 'ADMIN').default('USER')
})
const updateUserSchema = Joi.object({
  email: Joi.string().trim().email(),
  name: Joi.string().trim().min(1).max(100),
  role: Joi.string().valid('USER', 'ADMIN')
}).min(1)

router.get('/', validate(paginationSchema, 'query'), async (req, res) => {
  const { page, limit } = req.query
  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count()
  ])

  res.json({ data, meta: { total, page, limit, pages: Math.ceil(total / limit) } })
})

router.get('/:id', validate(idSchema, 'params'), async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      posts: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }
    }
  })

  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(user)
})

router.post('/', validate(createUserSchema), async (req, res) => {
  const user = await prisma.user.create({ data: req.body })
  res.status(201).json(user)
})

router.patch('/:id', validate(idSchema, 'params'), validate(updateUserSchema), async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: req.body
  })

  res.json(user)
})

router.delete('/:id', validate(idSchema, 'params'), async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } })
  res.status(204).send()
})

module.exports = router
