import type { Skill, Track, Section, Lesson, Challenge } from '@code-trainer/content-schema'
import { loadSkills, loadAllTracks, loadAllSections } from './loader'

// Loaded once per process and cached in memory — content is static within a
// deploy. A future CMS-backed version replaces this module's internals only;
// callers (the server's ContentService) never change.
let cache: {
  skills: Skill[]
  tracks: Track[]
  sections: Section[]
} | null = null

function getCache() {
  if (!cache) {
    cache = {
      skills: loadSkills(),
      tracks: loadAllTracks(),
      sections: loadAllSections(),
    }
  }
  return cache
}

/** Clears the in-memory content cache. Test-only. */
export function resetContentCache() {
  cache = null
}

export function listSkills(): Skill[] {
  return getCache().skills
}

export function getSkill(id: string): Skill | undefined {
  return getCache().skills.find((s) => s.id === id)
}

export function listTracks(): Track[] {
  return getCache().tracks
}

export function getTrack(id: string): Track | undefined {
  return getCache().tracks.find((t) => t.id === id)
}

export function listSectionsForTrack(trackId: string): Section[] {
  const track = getTrack(trackId)
  if (!track) return []
  return getCache().sections.filter((s) => track.sectionIds.includes(s.id))
}

export function getSection(id: string): Section | undefined {
  return getCache().sections.find((s) => s.id === id)
}

export function listLessonsForSection(sectionId: string): Lesson[] {
  return getSection(sectionId)?.lessons ?? []
}

export function getLesson(id: string): Lesson | undefined {
  for (const section of getCache().sections) {
    const lesson = section.lessons.find((l) => l.id === id)
    if (lesson) return lesson
  }
  return undefined
}

export function getChallenge(id: string): Challenge | undefined {
  for (const section of getCache().sections) {
    for (const lesson of section.lessons) {
      const challenge = lesson.challenges.find((c) => c.id === id)
      if (challenge) return challenge
    }
  }
  return undefined
}

/** The lesson + section a challenge belongs to, for building "next" links. */
export function getChallengeContext(
  challengeId: string,
): { section: Section; lesson: Lesson; challenge: Challenge } | undefined {
  for (const section of getCache().sections) {
    for (const lesson of section.lessons) {
      const challenge = lesson.challenges.find((c) => c.id === challengeId)
      if (challenge) return { section, lesson, challenge }
    }
  }
  return undefined
}
