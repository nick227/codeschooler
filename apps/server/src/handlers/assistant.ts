import { AssistantService, type HintRequest } from '../services/AssistantService'

const assistantService = new AssistantService()

export async function requestHint(request: any, reply: any) {
  return reply.send({ data: assistantService.getHint(request.body as HintRequest) })
}
