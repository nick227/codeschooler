import type {
  ContentItem,
  ContentRevision,
  Category,
  Tag,
  Skill,
  ContentStatus,
} from '@code-trainer/content-schema'

export interface ContentQuery {
  pillar?: string
  language?: string
  type?: string
  categorySlug?: string
  primaryCategoryId?: string
  tagSlug?: string
  skillId?: string
  difficulty?: string
  status?: ContentStatus
  search?: string
}

export interface ContentRepository {
  getItem(id: string): Promise<ContentItem | null>
  getItemBySlug(slug: string): Promise<ContentItem | null>
  getRevision(id: string, revisionNumber?: number): Promise<ContentRevision | null>
  queryItems(query: ContentQuery): Promise<ContentItem[]>
  
  // Taxonomy
  listCategories(): Promise<Category[]>
  getCategoryBySlug(slug: string): Promise<Category | null>
  listTags(): Promise<Tag[]>
  listSkills(): Promise<Skill[]>
  getSkill(id: string): Promise<Skill | null>
}
