import type {
  Skill,
  Track,
  Section,
  Lesson,
  Challenge,
  Project,
  InterviewProblem,
  QuizSet,
  Question,
} from '@code-trainer/content-schema'
import {
  loadSkills,
  loadAllTracks,
  loadAllSections,
  loadAllProjects,
  loadAllInterviewProblems,
  loadAllQuizSets,
} from './loader'

export type ContentMode = 'learn' | 'projects' | 'interview' | 'knowledge'
export interface PublicModeItem {
  id: string
  title: string
  summary: string
  challengeId?: string
}
export interface PublicModeCatalog {
  mode: ContentMode
  title: string
  description: string
  items: PublicModeItem[]
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, Extract<keyof T, K>> : never
export type PublicQuestion = DistributiveOmit<Question, 'answer'>
export type PublicQuizSet = Omit<QuizSet, 'questions'> & { questions: PublicQuestion[] }

// Loaded once per process and cached in memory — content is static within a
// deploy. A future CMS-backed version replaces this module's internals only;
// callers (the server's ContentService) never change.
let cache: {
  skills: Skill[]
  tracks: Track[]
  sections: Section[]
  projects: Project[]
  interviewProblems: InterviewProblem[]
  quizSets: QuizSet[]
} | null = null

function getCache() {
  if (!cache) {
    cache = {
      skills: loadSkills(),
      tracks: loadAllTracks(),
      sections: loadAllSections(),
      projects: loadAllProjects(),
      interviewProblems: loadAllInterviewProblems(),
      quizSets: loadAllQuizSets(),
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
  for (const project of getCache().projects) {
    const challenge = project.milestones.find((milestone) => milestone.challenge.id === id)?.challenge
    if (challenge) return challenge
  }
  const interviewChallenge = getCache().interviewProblems.find((problem) => problem.challenge.id === id)?.challenge
  if (interviewChallenge) return interviewChallenge
  return undefined
}

export function listProjects(): Project[] {
  return getCache().projects
}

export function getProject(id: string): Project | undefined {
  return getCache().projects.find((project) => project.id === id)
}

export function listInterviewProblems(): InterviewProblem[] {
  return getCache().interviewProblems
}

export function getInterviewProblem(id: string): InterviewProblem | undefined {
  return getCache().interviewProblems.find((problem) => problem.id === id)
}

export function listQuizSets(): QuizSet[] {
  return getCache().quizSets
}

/** Private authoring/answer query for authoritative server-side grading only. */
export function getQuizSet(id: string): QuizSet | undefined {
  return getCache().quizSets.find((quiz) => quiz.id === id)
}

export function getQuestionPrivate(id: string): { quizSet: QuizSet; question: Question } | undefined {
  for (const quizSet of getCache().quizSets) {
    const question = quizSet.questions.find((candidate) => candidate.id === id)
    if (question) return { quizSet, question }
  }
  return undefined
}

function toPublicQuestion(question: Question): PublicQuestion {
  const { answer: _answer, ...publicQuestion } = question
  return publicQuestion
}

/** Learner-safe quiz projection. Correct answers and explanations stay server-side. */
export function getQuizSetPublic(id: string): PublicQuizSet | undefined {
  const quiz = getQuizSet(id)
  if (!quiz) return undefined
  return { ...quiz, questions: quiz.questions.map(toPublicQuestion) }
}

export function listModeItems(mode: ContentMode): PublicModeCatalog {
  if (mode === 'learn') {
    return {
      mode,
      title: 'Learn',
      description: 'Guided JavaScript lessons and independent transfer practice.',
      items: getCache().sections.flatMap((section) => section.lessons.flatMap((lesson) =>
        lesson.challenges.map((challenge) => ({ id: challenge.id, title: challenge.title, summary: lesson.summary, challengeId: challenge.id })))),
    }
  }
  if (mode === 'projects') {
    return {
      mode,
      title: 'Projects',
      description: 'Build working software one functional milestone at a time.',
      items: getCache().projects.map((project) => ({
        id: project.id,
        title: project.title,
        summary: project.description,
        challengeId: project.milestones[0]?.challenge.id,
      })),
    }
  }
  if (mode === 'interview') {
    return {
      mode,
      title: 'Interview',
      description: 'Practice reusable problem-solving patterns with executable checks.',
      items: getCache().interviewProblems.map((problem) => ({ id: problem.id, title: problem.title, summary: problem.summary, challengeId: problem.challenge.id })),
    }
  }
  return {
    mode,
    title: 'Knowledge',
    description: 'Test conceptual understanding with focused question sets.',
    items: getCache().quizSets.map((quiz) => ({ id: quiz.id, title: quiz.title, summary: quiz.description })),
  }
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
