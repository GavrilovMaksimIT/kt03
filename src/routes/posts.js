const express = require('express')
const Joi = require('joi')
const { prisma } = require('../config')
const validate = require('../middleware/validate')

const router = express.Router()
const idSchema = Joi.object({ id: Joi.number().integer().positive().required() })
const tagsSchema = Joi.array().items(Joi.string().trim().min(1).max(50)).unique().default([])
const listPostsSchema = Joi.object({
  search: Joi.string().trim().allow('').default(''),
  published: Joi.boolean(),
  authorId: Joi.number().integer().positive(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
})
const createPostSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  content: Joi.string().allow(null, '').default(null),
  published: Joi.boolean().default(false),
  authorId: Joi.number().integer().positive().required(),
  tags: tagsSchema
})
const updatePostSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200),
  content: Joi.string().allow(null, ''),
  published: Joi.boolean(),
  authorId: Joi.number().integer().positive(),
  tags: Joi.array().items(Joi.string().trim().min(1).max(50)).unique()
}).min(1)

function connectOrCreateTags(tags) {
  return tags.map((name) => ({ where: { name }, create: { name } }))
}

router.get('/', validate(listPostsSchema, 'query'), async (req, res) => {
  const { search, published, authorId, page, limit } = req.query
  const where = {}

  // SQLite implements Prisma's contains filter with LIKE, which is
  // case-insensitive for ASCII text by default.
  if (search) where.title = { contains: search }
  if (published !== undefined) where.published = published
  if (authorId !== undefined) where.authorId = authorId

  const [data, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      include: { author: true, tags: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
    }),
    prisma.post.count({ where })
  ])

  res.json({ data, meta: { total, page, limit, pages: Math.ceil(total / limit) } })
})

router.get('/:id', validate(idSchema, 'params'), async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: { author: true, tags: true }
  })

  if (!post) return res.status(404).json({ error: 'Post not found' })
  res.json(post)
})

router.post('/', validate(createPostSchema), async (req, res) => {
  const { tags, ...postData } = req.body
  const post = await prisma.post.create({
    data: {
      ...postData,
      tags: { connectOrCreate: connectOrCreateTags(tags) }
    },
    include: { author: true, tags: true }
  })

  res.status(201).json(post)
})

router.patch('/:id', validate(idSchema, 'params'), validate(updatePostSchema), async (req, res) => {
  const { tags, ...postData } = req.body
  const data = { ...postData }

  if (tags !== undefined) {
    data.tags = {
      set: [],
      connectOrCreate: connectOrCreateTags(tags)
    }
  }

  const post = await prisma.post.update({
    where: { id: req.params.id },
    data,
    include: { author: true, tags: true }
  })

  res.json(post)
})

router.delete('/:id', validate(idSchema, 'params'), async (req, res) => {
  await prisma.post.delete({ where: { id: req.params.id } })
  res.status(204).send()
})

module.exports = router
