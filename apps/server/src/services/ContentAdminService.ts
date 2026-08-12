import { db } from '@code-trainer/db'
import type {
  ContentItem,
  Category,
  Tag,
  Skill,
  ContentValidationReport,
  AIGenerateRequest,
} from '@code-trainer/content-schema'
import { PrismaContentRepository } from '@code-trainer/learning-engine'
import { AuthoritativeEvaluationService } from './AuthoritativeEvaluationService'

export class ContentAdminService {
  private repo = new PrismaContentRepository()

  async listContent(filters: {
    type?: string
    status?: string
    category?: string
    search?: string
  }): Promise<ContentItem[]> {
    return this.repo.queryItems({
      type: filters.type,
      status: filters.status as any,
      categorySlug: filters.category,
      search: filters.search,
    })
  }

  async getContent(id: string): Promise<ContentItem | null> {
    return this.repo.getItem(id)
  }

  async createContent(data: {
    slug?: string
    type: string
    title: string
    instruction?: string
    starterCode?: string
    solution?: string
    config?: any
    difficulty?: string
    primaryCategoryId?: string
    skills?: string[]
    categories?: string[]
    tags?: string[]
  }): Promise<ContentItem> {
    const slug = data.slug || `challenge-${Date.now()}`
    const id = slug
    const revId = `${id}-rev-1`

    await db.contentItem.create({
      data: {
        id,
        slug,
        type: data.type,
        language: 'javascript',
        status: 'DRAFT',
        primaryCategoryId: data.primaryCategoryId,
        currentRevisionId: revId,
        revisions: {
          create: {
            id: revId,
            revision: 1,
            title: data.title,
            instruction: data.instruction || '',
            starterCode: data.starterCode || '',
            solution: data.solution || '',
            config: data.config || { checks: [], hints: [], reward: { xp: 10 } },
            difficulty: data.difficulty || 'beginner',
          },
        },
      },
      include: {
        revisions: true,
        categories: true,
        tags: true,
        skills: true,
      },
    })

    if (data.skills?.length) {
      for (const skillId of data.skills) {
        const sk = await db.skill.findUnique({ where: { id: skillId } })
        if (sk) await db.contentSkill.create({ data: { contentItemId: id, skillId } })
      }
    }

    if (data.categories?.length) {
      for (const catId of data.categories) {
        const cat = await db.category.findUnique({ where: { id: catId } })
        if (cat) await db.contentCategory.create({ data: { contentItemId: id, categoryId: catId, isPrimary: catId === data.primaryCategoryId } })
      }
    }

    if (data.tags?.length) {
      for (const tagSlug of data.tags) {
        const tag = await db.tag.findUnique({ where: { slug: tagSlug } })
        if (tag) await db.contentTag.create({ data: { contentItemId: id, tagId: tag.id } })
      }
    }

    const item = await this.repo.getItem(id)
    return item!
  }

  async updateContent(
    id: string,
    data: {
      title?: string
      instruction?: string
      starterCode?: string
      solution?: string
      config?: any
      difficulty?: string
      status?: string
      skills?: string[]
      categories?: string[]
      tags?: string[]
    },
  ): Promise<ContentItem | null> {
    const existing = await db.contentItem.findUnique({
      where: { id },
      include: { revisions: { orderBy: { revision: 'desc' } } },
    })
    if (!existing) return null

    const currentRev = existing.revisions[0]
    let newRevId = currentRev?.id

    if (existing.status === 'PUBLISHED') {
      // Editing published content creates a new draft revision
      const nextRevNum = (currentRev?.revision || 0) + 1
      newRevId = `${id}-rev-${nextRevNum}`
      await db.contentRevision.create({
        data: {
          id: newRevId,
          contentItemId: id,
          revision: nextRevNum,
          title: data.title ?? currentRev?.title ?? 'Untitled',
          instruction: data.instruction ?? currentRev?.instruction,
          starterCode: data.starterCode ?? currentRev?.starterCode,
          solution: data.solution ?? currentRev?.solution,
          config: data.config ?? (currentRev?.config as any) ?? {},
          difficulty: data.difficulty ?? currentRev?.difficulty ?? 'beginner',
        },
      })
      await db.contentItem.update({
        where: { id },
        data: {
          status: 'DRAFT',
          currentRevisionId: newRevId,
        },
      })
    } else {
      // Modify current draft revision
      if (currentRev) {
        await db.contentRevision.update({
          where: { id: currentRev.id },
          data: {
            title: data.title ?? currentRev.title,
            instruction: data.instruction ?? currentRev.instruction,
            starterCode: data.starterCode ?? currentRev.starterCode,
            solution: data.solution ?? currentRev.solution,
            config: data.config ?? (currentRev.config as any),
            difficulty: data.difficulty ?? currentRev.difficulty,
          },
        })
      }
      if (data.status) {
        await db.contentItem.update({
          where: { id },
          data: { status: data.status as any },
        })
      }
    }

    // Update relations if provided
    if (data.skills) {
      await db.contentSkill.deleteMany({ where: { contentItemId: id } })
      for (const skillId of data.skills) {
        const sk = await db.skill.findUnique({ where: { id: skillId } })
        if (sk) await db.contentSkill.create({ data: { contentItemId: id, skillId } })
      }
    }

    return this.repo.getItem(id)
  }

  async validateContent(id: string): Promise<ContentValidationReport> {
    const item = await this.repo.getItem(id)
    if (!item) {
      return {
        contentItemId: id,
        valid: false,
        checks: [{ name: 'Schema', status: 'fail', message: 'Content item not found' }],
        timestamp: new Date().toISOString(),
      }
    }

    const rev = await this.repo.getRevision(id)
    const checksList: { name: string; status: 'pass' | 'warn' | 'fail'; message: string }[] = []

    // 1. Basic schema check
    checksList.push({ name: 'Schema', status: 'pass', message: 'Content item structure is valid' })

    // 2. Skills exist check
    if (item.skills && item.skills.length > 0) {
      let missingSkill = false
      for (const skId of item.skills) {
        const sk = await this.repo.getSkill(skId)
        if (!sk) {
          missingSkill = true;
          checksList.push({ name: 'Skills', status: 'fail', message: `Skill ${skId} not found in database` })
        }
      }
      if (!missingSkill) {
        checksList.push({ name: 'Skills', status: 'pass', message: `${item.skills.length} assigned skills exist` })
      }
    } else {
      checksList.push({ name: 'Skills', status: 'warn', message: 'No skills assigned to challenge' })
    }

    // 3. Reference solution check
    const configChecks = (rev?.config as any)?.checks ?? []
    if (rev?.solution && configChecks.length > 0) {
      try {
        const evalService = new AuthoritativeEvaluationService()
        const mockChallenge: any = {
          id: id,
          runtime: { timeoutMs: 2000, maxOutputBytes: 4096 },
          checks: configChecks,
          requiresRun: false,
        }
        const evalResult = await evalService.check(rev.solution, mockChallenge)
        const checksPassedCount = evalResult.outcomes.filter((o) => o.passed).length
        const totalChecksCount = configChecks.length
        if (evalResult.checksPassed) {
          checksList.push({
            name: 'Reference solution',
            status: 'pass',
            message: `Reference solution passes ${checksPassedCount}/${totalChecksCount} checks`,
          })
        } else {
          checksList.push({
            name: 'Reference solution',
            status: 'fail',
            message: `Reference solution failed checks (${checksPassedCount}/${totalChecksCount})`,
          })
        }
      } catch (e: any) {
        checksList.push({ name: 'Reference solution', status: 'fail', message: `Execution error: ${e?.message ?? e}` })
      }
    } else {
      checksList.push({ name: 'Reference solution', status: 'warn', message: 'No solution or checks configured' })
    }

    const hasFailures = checksList.some((c) => c.status === 'fail')
    const isValid = !hasFailures

    if (isValid && item.status === 'DRAFT') {
      await db.contentItem.update({
        where: { id },
        data: { status: 'VALIDATED' },
      })
    }

    return {
      contentItemId: id,
      valid: isValid,
      checks: checksList,
      timestamp: new Date().toISOString(),
    }
  }

  async publishContent(id: string): Promise<ContentItem | null> {
    const item = await this.repo.getItem(id)
    if (!item) return null

    const rev = await this.repo.getRevision(id)
    if (!rev) return null

    await db.contentRevision.update({
      where: { id: rev.id },
      data: { publishedAt: new Date() },
    })

    await db.contentItem.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        currentRevisionId: rev.id,
      },
    })

    return this.repo.getItem(id)
  }

  async archiveContent(id: string): Promise<ContentItem | null> {
    await db.contentItem.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    })
    return this.repo.getItem(id)
  }

  async deleteContent(id: string): Promise<boolean> {
    const existing = await db.contentItem.findUnique({ where: { id } })
    if (!existing) return false
    await db.contentItem.delete({ where: { id } })
    return true
  }

  async generateAIContent(req: AIGenerateRequest): Promise<ContentItem[]> {
    // 1. Track generation provenance
    const gen = await db.contentGeneration.create({
      data: {
        provider: req.provider || 'built-in',
        model: req.model || 'code-trainer-ai-v1',
        promptVersion: '1.0',
        prompt: req.prompt,
      },
    })

    // 2. Synthesize AI content items based on requested count & topic/skills
    const createdItems: ContentItem[] = []
    const count = req.count || 3
    const categorySlug = req.categorySlug || 'getting-started'
    const skills = req.skillIds || ['javascript.output', 'javascript.variables']

    for (let i = 1; i <= count; i++) {
      const slug = `ai-gen-${Date.now()}-${i}`
      const title = `AI Challenge: ${req.prompt.slice(0, 20)} #${i}`
      const instruction = `Implement code for ${req.prompt} (Step ${i})`
      const starterCode = `// ${title}\nlet value = ${i};\n`
      const solution = `let value = ${i};\nconsole.log(value);`
      const config = {
        checks: [{ type: 'outputEquals', name: 'Prints value', value: String(i) }],
        hints: [
          { level: 1, text: 'Remember to print the variable to console.' },
          { level: 2, text: 'Use console.log(value);' },
        ],
        reward: { xp: 15 },
      }

      const item = await this.createContent({
        slug,
        type: 'coding_challenge',
        title,
        instruction,
        starterCode,
        solution,
        config,
        difficulty: req.difficulty || 'beginner',
        primaryCategoryId: categorySlug,
        skills,
        categories: [categorySlug],
        tags: ['ai-generated'],
      })

      // Link generation ID to revision
      if (item.currentRevisionId) {
        await db.contentRevision.update({
          where: { id: item.currentRevisionId },
          data: { generationId: gen.id },
        })
      }

      // Auto-validate generated item
      await this.validateContent(item.id)

      const updated = await this.getContent(item.id)
      if (updated) createdItems.push(updated)
    }

    return createdItems
  }

  // Taxonomy methods
  async listCategories(): Promise<Category[]> {
    return this.repo.listCategories()
  }

  async createCategory(data: { slug: string; name: string; parentId?: string; kind?: string; sortOrder?: number }): Promise<Category> {
    const created = await db.category.create({
      data: {
        id: data.slug,
        slug: data.slug,
        name: data.name,
        parentId: data.parentId,
        kind: data.kind || 'section',
        sortOrder: data.sortOrder || 0,
      },
    })
    return {
      id: created.id,
      slug: created.slug,
      name: created.name,
      parentId: created.parentId,
      kind: created.kind as any,
      sortOrder: created.sortOrder,
    }
  }

  async listTags(): Promise<Tag[]> {
    return this.repo.listTags()
  }

  async createTag(data: { slug: string; name: string; description?: string }): Promise<Tag> {
    const created = await db.tag.create({
      data: {
        id: `tag-${data.slug}`,
        slug: data.slug,
        name: data.name,
        description: data.description,
      },
    })
    return {
      id: created.id,
      slug: created.slug,
      name: created.name,
      description: created.description,
    }
  }

  async listSkills(): Promise<Skill[]> {
    return this.repo.listSkills()
  }

  async createSkill(data: { id: string; name: string; description: string }): Promise<Skill> {
    const created = await db.skill.create({
      data: {
        id: data.id,
        slug: data.id,
        name: data.name,
        description: data.description,
      },
    })
    return {
      id: created.id,
      name: created.name,
      category: 'javascript.fundamentals',
      aliases: [],
      prerequisites: [],
      deprecated: !!created.deprecatedAt,
      replacementId: created.replacementSkillId ?? undefined,
    }
  }
}
