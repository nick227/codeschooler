import { db } from '@code-trainer/db'
import type {
  ContentItem,
  ContentRevision,
  Category,
  Tag,
  Skill,
  ContentStatus,
} from '@code-trainer/content-schema'
import type { ContentRepository, ContentQuery } from './repository'

export class PrismaContentRepository implements ContentRepository {
  async getItem(id: string): Promise<ContentItem | null> {
    const raw = await db.contentItem.findUnique({
      where: { id },
      include: {
        revisions: true,
        categories: true,
        tags: true,
        skills: true,
      },
    })
    if (!raw) return null
    return this.mapItem(raw)
  }

  async getItemBySlug(slug: string): Promise<ContentItem | null> {
    const raw = await db.contentItem.findUnique({
      where: { slug },
      include: {
        revisions: true,
        categories: true,
        tags: true,
        skills: true,
      },
    })
    if (!raw) return null
    return this.mapItem(raw)
  }

  async getRevision(id: string, revisionNumber?: number): Promise<ContentRevision | null> {
    if (revisionNumber) {
      const rev = await db.contentRevision.findUnique({
        where: {
          contentItemId_revision: {
            contentItemId: id,
            revision: revisionNumber,
          },
        },
      })
      if (!rev) return null
      return this.mapRevision(rev)
    }

    const rev = await db.contentRevision.findFirst({
      where: { contentItemId: id },
      orderBy: { revision: 'desc' },
    })
    if (!rev) return null
    return this.mapRevision(rev)
  }

  async queryItems(query: ContentQuery): Promise<ContentItem[]> {
    const where: any = {}
    if (query.type) where.type = query.type
    if (query.language) where.language = query.language
    if (query.status) where.status = query.status as any
    if (query.primaryCategoryId) where.primaryCategoryId = query.primaryCategoryId
    if (query.search) {
      where.OR = [
        { slug: { contains: query.search } },
        { revisions: { some: { title: { contains: query.search } } } },
      ]
    }
    if (query.skillId) {
      where.skills = { some: { skillId: query.skillId } }
    }
    if (query.categorySlug) {
      where.categories = { some: { category: { slug: query.categorySlug } } }
    }
    if (query.tagSlug) {
      where.tags = { some: { tag: { slug: query.tagSlug } } }
    }

    const rawList = await db.contentItem.findMany({
      where,
      include: {
        revisions: true,
        categories: true,
        tags: true,
        skills: true,
      },
      orderBy: { updatedAt: 'desc' },
    })
    return rawList.map((raw: any) => this.mapItem(raw))
  }

  async listCategories(): Promise<Category[]> {
    const raw = await db.category.findMany({ orderBy: { sortOrder: 'asc' } })
    return raw.map((c: any) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      parentId: c.parentId,
      kind: c.kind as any,
      sortOrder: c.sortOrder,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }))
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const c = await db.category.findUnique({ where: { slug } })
    if (!c) return null
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      parentId: c.parentId,
      kind: c.kind as any,
      sortOrder: c.sortOrder,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }
  }

  async listTags(): Promise<Tag[]> {
    const raw = await db.tag.findMany({ orderBy: { name: 'asc' } })
    return raw.map((t: any) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }))
  }

  async listSkills(): Promise<Skill[]> {
    const raw = await db.skill.findMany({ orderBy: { name: 'asc' } })
    return raw.map((s: any) => ({
      id: s.id,
      name: s.name,
      category: 'javascript.fundamentals',
      aliases: [],
      prerequisites: [],
      deprecated: !!s.deprecatedAt,
      replacementId: s.replacementSkillId ?? undefined,
    }))
  }

  async getSkill(id: string): Promise<Skill | null> {
    const s = await db.skill.findUnique({ where: { id } })
    if (!s) return null
    return {
      id: s.id,
      name: s.name,
      category: 'javascript.fundamentals',
      aliases: [],
      prerequisites: [],
      deprecated: !!s.deprecatedAt,
      replacementId: s.replacementSkillId ?? undefined,
    }
  }

  private mapItem(raw: any): ContentItem {
    return {
      id: raw.id,
      slug: raw.slug,
      type: raw.type as any,
      language: raw.language,
      status: raw.status as ContentStatus,
      currentRevisionId: raw.currentRevisionId,
      primaryCategoryId: raw.primaryCategoryId,
      createdAt: raw.createdAt.toISOString(),
      updatedAt: raw.updatedAt.toISOString(),
      revisions: raw.revisions?.map((r: any) => this.mapRevision(r)),
      categories: raw.categories?.map((c: any) => c.categoryId),
      tags: raw.tags?.map((t: any) => t.tagId),
      skills: raw.skills?.map((s: any) => s.skillId),
    }
  }

  private mapRevision(raw: any): ContentRevision {
    return {
      id: raw.id,
      contentItemId: raw.contentItemId,
      revision: raw.revision,
      title: raw.title,
      instruction: raw.instruction,
      body: raw.body,
      starterCode: raw.starterCode,
      solution: raw.solution,
      config: (typeof raw.config === 'object' && raw.config !== null) ? raw.config : {},
      difficulty: raw.difficulty as any,
      guidancePolicy: raw.guidancePolicy,
      createdBy: raw.createdBy,
      generationId: raw.generationId,
      publishedAt: raw.publishedAt ? raw.publishedAt.toISOString() : undefined,
      createdAt: raw.createdAt.toISOString(),
    }
  }
}
