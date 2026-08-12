import {
  listTracks as engineListTracks,
  getTrack as engineGetTrack,
  listSectionsForTrack,
  getSection as engineGetSection,
  getChallenge as engineGetChallenge,
  getQuizSetPublic,
  listModeItems,
  type ContentMode,
} from '@code-trainer/learning-engine'

// Thin translation layer: learning-engine returns pure content objects (or
// undefined); this service adds HTTP-shaped 404s and trims fields the
// client doesn't need (e.g. hints, which the assistant looks up server-side
// so they never ship to the browser as an answer key).

export class ContentService {
  getMode(mode: string) {
    if (!['learn', 'projects', 'interview', 'knowledge'].includes(mode)) {
      throw { statusCode: 404, message: 'Mode not found' }
    }
    return listModeItems(mode as ContentMode)
  }

  getQuizSet(id: string) {
    const quiz = getQuizSetPublic(id)
    if (!quiz) throw { statusCode: 404, message: 'Quiz set not found' }
    return quiz
  }
  listTracks() {
    return engineListTracks().map((t) => ({ id: t.id, title: t.title, description: t.description }))
  }

  getTrack(trackId: string) {
    const track = engineGetTrack(trackId)
    if (!track) throw { statusCode: 404, message: 'Track not found' }

    const sections = listSectionsForTrack(trackId).map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      lessonCount: s.lessons.length,
    }))

    return { id: track.id, title: track.title, description: track.description, sections }
  }

  getSection(sectionId: string) {
    const section = engineGetSection(sectionId)
    if (!section) throw { statusCode: 404, message: 'Section not found' }

    return {
      id: section.id,
      title: section.title,
      description: section.description,
      lessons: section.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        summary: l.summary,
        challenges: l.challenges.map((c) => ({ id: c.id, title: c.title })),
      })),
    }
  }

  getChallenge(challengeId: string) {
    const challenge = engineGetChallenge(challengeId)
    if (!challenge) throw { statusCode: 404, message: 'Challenge not found' }

    // Hints are intentionally omitted — the assistant reads them
    // server-side (AssistantService) so the client never receives the
    // answer ladder up front.
    const { hints: _hints, authoring: _authoring, ...publicChallenge } = challenge
    return publicChallenge
  }
}
