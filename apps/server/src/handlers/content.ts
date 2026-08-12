import { ContentService } from '../services/ContentService'

const contentService = new ContentService()

export async function listTracks(_request: any, reply: any) {
  return reply.send({ data: contentService.listTracks() })
}

export async function getTrack(request: any, reply: any) {
  return reply.send({ data: contentService.getTrack(request.params.trackId) })
}

export async function getSection(request: any, reply: any) {
  return reply.send({ data: contentService.getSection(request.params.sectionId) })
}

export async function getChallenge(request: any, reply: any) {
  return reply.send({ data: contentService.getChallenge(request.params.challengeId) })
}
