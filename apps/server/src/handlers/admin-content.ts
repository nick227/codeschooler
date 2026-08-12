import type { FastifyRequest, FastifyReply } from 'fastify'
import { ContentAdminService } from '../services/ContentAdminService'

const adminService = new ContentAdminService()

export async function adminListContent(req: FastifyRequest, reply: FastifyReply) {
  const query = (req.query as any) || {}
  const items = await adminService.listContent(query)
  return reply.send({ data: items })
}

export async function adminGetContent(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const item = await adminService.getContent(id)
  if (!item) return reply.status(404).send({ error: 'Content item not found' })
  return reply.send({ data: item })
}

export async function adminCreateContent(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as any
  const item = await adminService.createContent(body)
  return reply.status(201).send({ data: item })
}

export async function adminUpdateContent(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const body = req.body as any
  const updated = await adminService.updateContent(id, body)
  if (!updated) return reply.status(404).send({ error: 'Content item not found' })
  return reply.send({ data: updated })
}

export async function adminValidateContent(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const report = await adminService.validateContent(id)
  return reply.send({ data: report })
}

export async function adminPublishContent(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const published = await adminService.publishContent(id)
  if (!published) return reply.status(404).send({ error: 'Content item not found' })
  return reply.send({ data: published })
}

export async function adminDeleteContent(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const success = await adminService.deleteContent(id)
  if (!success) return reply.status(404).send({ error: 'Content item not found' })
  return reply.send({ data: { success: true } })
}

export async function adminGenerateContent(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as any
  const generated = await adminService.generateAIContent(body)
  return reply.send({ data: generated })
}

export async function adminListCategories(_req: FastifyRequest, reply: FastifyReply) {
  const categories = await adminService.listCategories()
  return reply.send({ data: categories })
}

export async function adminCreateCategory(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as any
  const category = await adminService.createCategory(body)
  return reply.status(201).send({ data: category })
}

export async function adminListTags(_req: FastifyRequest, reply: FastifyReply) {
  const tags = await adminService.listTags()
  return reply.send({ data: tags })
}

export async function adminCreateTag(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as any
  const tag = await adminService.createTag(body)
  return reply.status(201).send({ data: tag })
}

export async function adminListSkills(_req: FastifyRequest, reply: FastifyReply) {
  const skills = await adminService.listSkills()
  return reply.send({ data: skills })
}

export async function adminCreateSkill(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as any
  const skill = await adminService.createSkill(body)
  return reply.status(201).send({ data: skill })
}
