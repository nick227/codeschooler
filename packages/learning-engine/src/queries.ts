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
import type { ContentRepository } from './repository'
import { YamlContentRepository } from './yaml-repository'

export type ContentMode = 'learn' | 'projects' | 'interview' | 'knowledge'
export interface PublicModeItem {
  id: string
  title: string
  summary: string
  challengeId?: string
  // Filter metadata — present only on modes that carry these fields
  difficulty?: 'beginner' | 'easy' | 'medium' | 'hard'
  pattern?: string
  progression?: 'intro' | 'standard' | 'transfer' | 'advanced'
  skills?: string[]
  mode?: 'practice' | 'checkpoint' | 'interview-review'
  purpose?: 'knowledge' | 'concept-check'
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

let repositoryInstance: ContentRepository = new YamlContentRepository()

export function setContentRepository(repo: ContentRepository) {
  repositoryInstance = repo
}

export function getContentRepository(): ContentRepository {
  return repositoryInstance
}

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
      description: 'Structured step-by-step coding lessons from beginner to advanced.',
      items: getCache().sections.flatMap((section) => section.lessons.flatMap((lesson) =>
        lesson.challenges.map((challenge) => ({ id: challenge.id, title: challenge.title, summary: lesson.summary, challengeId: challenge.id })))),
    }
  }
  if (mode === 'projects') {
    return {
      mode,
      title: 'Projects',
      description: 'Build real-world browser and utility projects step by step.',
      items: getCache().projects.map((project) => ({
        id: project.id,
        title: project.title,
        summary: project.description,
        challengeId: project.milestones[0]?.challenge.id,
        skills: project.skills,
      })),
    }
  }
  if (mode === 'interview') {
    return {
      mode,
      title: 'Interview',
      description: 'Master canonical software engineering interview patterns with automated evaluation.',
      items: getCache().interviewProblems.map((problem) => ({
        id: problem.id,
        title: problem.title,
        summary: problem.summary,
        challengeId: problem.challenge.id,
        difficulty: problem.difficulty,
        pattern: problem.pattern,
        progression: problem.progression,
        skills: problem.challenge.skills,
      })),
    }
  }
  return {
    mode,
    title: 'Knowledge',
    description: 'Test and reinforce core software concepts with targeted practice sets.',
    items: getCache().quizSets.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      summary: quiz.description,
      mode: quiz.mode,
      purpose: quiz.purpose,
    })),
  }
}

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
