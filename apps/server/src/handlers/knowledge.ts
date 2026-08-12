import { KnowledgeService, type AnswerInput } from '../services/KnowledgeService'
import { optionalUser } from '../plugins/security'

const knowledge = new KnowledgeService()

export async function submitKnowledgeAnswer(request: any, reply: any) {
  const input = request.body as AnswerInput
  const user = await optionalUser(request)
  if (!user) return reply.status(201).send({ data: knowledge.grade(input) })
  const result = await knowledge.submit(user.id, input)
  return reply.status(result.duplicate ? 200 : 201).send({ data: result })
}
