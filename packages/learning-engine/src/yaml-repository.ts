import type {
  ContentItem,
  ContentRevision,
  Category,
  Tag,
  Skill,
} from '@code-trainer/content-schema'
import type { ContentRepository, ContentQuery } from './repository'
import {
  loadSkills,
  loadAllTracks,
  loadAllSections,
  loadAllProjects,
  loadAllInterviewProblems,
  loadAllQuizSets,
} from './loader'

export class YamlContentRepository implements ContentRepository {
  private skillsCache: Skill[] | null = null
  private itemsCache: ContentItem[] | null = null
  private revisionsCache: Map<string, ContentRevision[]> = new Map()

  private init() {
    if (this.itemsCache) return

    this.skillsCache = loadSkills()
    const items: ContentItem[] = []
    const revisionsMap = new Map<string, ContentRevision[]>()

    // Learn sections / lessons / challenges
    const sections = loadAllSections()
    for (const section of sections) {
      for (const lesson of section.lessons) {
        for (const c of lesson.challenges) {
          const item: ContentItem = {
            id: c.id,
            slug: c.id,
            type: 'coding_challenge',
            language: c.language ?? 'javascript',
            status: 'PUBLISHED',
            currentRevisionId: `${c.id}-rev-1`,
            primaryCategoryId: section.id,
            skills: c.skills ?? [],
            categories: [section.id],
            tags: [],
          }
          const rev: ContentRevision = {
            id: `${c.id}-rev-1`,
            contentItemId: c.id,
            revision: 1,
            title: c.title,
            instruction: c.instruction,
            starterCode: c.starterCode,
            solution: (c as any).solution,
            config: {
              checks: c.checks,
              hints: c.hints,
              guidance: c.guidance,
              reward: c.reward,
              evidence: c.evidence,
            },
            difficulty: 'beginner',
          }
          items.push(item)
          revisionsMap.set(c.id, [rev])
        }
      }
    }

    // Projects
    const projects = loadAllProjects()
    for (const proj of projects) {
      for (const m of proj.milestones) {
        const c = m.challenge
        const item: ContentItem = {
          id: c.id,
          slug: c.id,
          type: 'project_step',
          language: c.language ?? 'javascript',
          status: 'PUBLISHED',
          currentRevisionId: `${c.id}-rev-1`,
          primaryCategoryId: proj.id,
          skills: c.skills ?? [],
          categories: [proj.id],
          tags: ['project'],
        }
        const rev: ContentRevision = {
          id: `${c.id}-rev-1`,
          contentItemId: c.id,
          revision: 1,
          title: c.title,
          instruction: c.instruction,
          starterCode: c.starterCode,
          solution: (c as any).solution,
          config: {
            checks: c.checks,
            hints: c.hints,
            guidance: c.guidance,
            reward: c.reward,
          },
          difficulty: 'intermediate',
        }
        items.push(item)
        revisionsMap.set(c.id, [rev])
      }
    }

    // Interview
    const interviews = loadAllInterviewProblems()
    for (const prob of interviews) {
      const c = prob.challenge
      const item: ContentItem = {
        id: c.id,
        slug: c.id,
        type: 'interview_problem',
        language: c.language ?? 'javascript',
        status: 'PUBLISHED',
        currentRevisionId: `${c.id}-rev-1`,
        primaryCategoryId: prob.id,
        skills: c.skills ?? [],
        categories: [prob.id],
        tags: ['interview'],
      }
      const rev: ContentRevision = {
        id: `${c.id}-rev-1`,
        contentItemId: c.id,
        revision: 1,
        title: c.title,
        instruction: c.instruction,
        starterCode: c.starterCode,
        solution: (c as any).solution,
        config: {
          checks: c.checks,
          hints: c.hints,
          guidance: c.guidance,
          reward: c.reward,
        },
        difficulty: 'intermediate',
      }
      items.push(item)
      revisionsMap.set(c.id, [rev])
    }

    // Knowledge
    const quizSets = loadAllQuizSets()
    for (const quiz of quizSets) {
      for (const q of quiz.questions) {
        const item: ContentItem = {
          id: q.id,
          slug: q.id,
          type: 'knowledge_question',
          language: 'javascript',
          status: 'PUBLISHED',
          currentRevisionId: `${q.id}-rev-1`,
          primaryCategoryId: quiz.id,
          skills: q.skills ?? [],
          categories: [quiz.id],
          tags: ['quiz'],
        }
        const rev: ContentRevision = {
          id: `${q.id}-rev-1`,
          contentItemId: q.id,
          revision: 1,
          title: q.prompt,
          instruction: q.prompt,
          config: {
            options: (q as any).options,
            answer: q.answer,
            explanation: (q as any).explanation,
          },
          difficulty: 'beginner',
        }
        items.push(item)
        revisionsMap.set(q.id, [rev])
      }
    }

    this.itemsCache = items
    this.revisionsCache = revisionsMap
  }

  async getItem(id: string): Promise<ContentItem | null> {
    this.init()
    return this.itemsCache?.find((i) => i.id === id) ?? null
  }

  async getItemBySlug(slug: string): Promise<ContentItem | null> {
    this.init()
    return this.itemsCache?.find((i) => i.slug === slug) ?? null
  }

  async getRevision(id: string, revisionNumber?: number): Promise<ContentRevision | null> {
    this.init()
    const revs = this.revisionsCache.get(id) ?? []
    if (revs.length === 0) return null
    if (!revisionNumber) return revs[revs.length - 1] ?? null
    return revs.find((r) => r.revision === revisionNumber) ?? null
  }

  async queryItems(query: ContentQuery): Promise<ContentItem[]> {
    this.init()
    let results = this.itemsCache ?? []
    if (query.type) results = results.filter((i) => i.type === query.type)
    if (query.language) results = results.filter((i) => i.language === query.language)
    if (query.status) results = results.filter((i) => i.status === query.status)
    if (query.search) {
      const q = query.search.toLowerCase()
      results = results.filter((i) => i.slug.toLowerCase().includes(q) || i.id.toLowerCase().includes(q))
    }
    return results
  }

  async listCategories(): Promise<Category[]> {
    const tracks = loadAllTracks()
    const sections = loadAllSections()
    const categories: Category[] = []
    for (const t of tracks) {
      categories.push({
        id: t.id,
        slug: t.id,
        name: t.title,
        kind: 'track',
        sortOrder: 0,
      })
    }
    for (const s of sections) {
      categories.push({
        id: s.id,
        slug: s.id,
        name: s.title,
        kind: 'section',
        sortOrder: (s as any).order ?? 0,
      })
    }
    return categories
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const categories = await this.listCategories()
    return categories.find((c) => c.slug === slug) ?? null
  }

  async listTags(): Promise<Tag[]> {
    return [
      { id: 'tag-project', slug: 'project', name: 'Project' },
      { id: 'tag-interview', slug: 'interview', name: 'Interview' },
      { id: 'tag-quiz', slug: 'quiz', name: 'Quiz' },
    ]
  }

  async listSkills(): Promise<Skill[]> {
    this.init()
    return this.skillsCache ?? []
  }

  async getSkill(id: string): Promise<Skill | null> {
    const skills = await this.listSkills()
    return skills.find((s) => s.id === id) ?? null
  }
}
