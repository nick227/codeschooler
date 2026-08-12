import { db } from '@code-trainer/db'
import {
  loadSkills,
  loadAllTracks,
  loadAllSections,
  loadAllProjects,
  loadAllInterviewProblems,
  loadAllQuizSets,
} from './loader'

export interface SeedOptions {
  dryRun?: boolean
  fileFilter?: string
  replace?: boolean
}

export interface SeedReport {
  skillsInserted: number
  skillsUnchanged: number
  categoriesInserted: number
  categoriesUnchanged: number
  tagsInserted: number
  contentInserted: number
  contentUpdated: number
  errors: string[]
}

export async function seedContentDatabase(options: SeedOptions = {}): Promise<SeedReport> {
  const report: SeedReport = {
    skillsInserted: 0,
    skillsUnchanged: 0,
    categoriesInserted: 0,
    categoriesUnchanged: 0,
    tagsInserted: 0,
    contentInserted: 0,
    contentUpdated: 0,
    errors: [],
  }

  const dryRun = options.dryRun ?? false

  // 1. Seed Skills
  const skills = loadSkills()
  for (const s of skills) {
    if (options.fileFilter && !options.fileFilter.includes('skills')) continue
    const existing = await db.skill.findUnique({ where: { id: s.id } })
    if (!existing) {
      report.skillsInserted++
      if (!dryRun) {
        await db.skill.create({
          data: {
            id: s.id,
            slug: s.id,
            name: s.name,
            description: (s as any).description ?? s.name,
          },
        })
      }
    } else {
      report.skillsUnchanged++
      if (!dryRun) {
        await db.skill.update({
          where: { id: s.id },
          data: {
            name: s.name,
            description: (s as any).description ?? s.name,
          },
        })
      }
    }
  }

  // 2. Seed Categories (Tracks & Sections)
  const tracks = loadAllTracks()
  for (const t of tracks) {
    const existing = await db.category.findUnique({ where: { slug: t.id } })
    if (!existing) {
      report.categoriesInserted++
      if (!dryRun) {
        await db.category.create({
          data: {
            id: t.id,
            slug: t.id,
            name: t.title,
            kind: 'track',
            sortOrder: 0,
          },
        })
      }
    } else {
      report.categoriesUnchanged++
    }
  }

  const sections = loadAllSections()
  for (const s of sections) {
    const existing = await db.category.findUnique({ where: { slug: s.id } })
    if (!existing) {
      report.categoriesInserted++
      if (!dryRun) {
        await db.category.create({
          data: {
            id: s.id,
            slug: s.id,
            name: s.title,
            kind: 'section',
            sortOrder: (s as any).order ?? 0,
          },
        })
      }
    } else {
      report.categoriesUnchanged++
    }
  }

  const projectsForCat = loadAllProjects()
  for (const p of projectsForCat) {
    const existing = await db.category.findUnique({ where: { slug: p.id } })
    if (!existing) {
      report.categoriesInserted++
      if (!dryRun) {
        await db.category.create({
          data: {
            id: p.id,
            slug: p.id,
            name: p.title,
            kind: 'collection',
            sortOrder: 0,
          },
        })
      }
    } else {
      report.categoriesUnchanged++
    }
  }

  const interviewsForCat = loadAllInterviewProblems()
  for (const p of interviewsForCat) {
    const existing = await db.category.findUnique({ where: { slug: p.id } })
    if (!existing) {
      report.categoriesInserted++
      if (!dryRun) {
        await db.category.create({
          data: {
            id: p.id,
            slug: p.id,
            name: p.title,
            kind: 'collection',
            sortOrder: 0,
          },
        })
      }
    } else {
      report.categoriesUnchanged++
    }
  }

  const quizSetsForCat = loadAllQuizSets()
  for (const q of quizSetsForCat) {
    const existing = await db.category.findUnique({ where: { slug: q.id } })
    if (!existing) {
      report.categoriesInserted++
      if (!dryRun) {
        await db.category.create({
          data: {
            id: q.id,
            slug: q.id,
            name: q.title,
            kind: 'collection',
            sortOrder: 0,
          },
        })
      }
    } else {
      report.categoriesUnchanged++
    }
  }

  // 3. Seed Canonical Tags
  const defaultTags = [
    { slug: 'guided', name: 'Guided Lesson' },
    { slug: 'independent', name: 'Independent Transfer' },
    { slug: 'project', name: 'Project Milestone' },
    { slug: 'interview', name: 'Interview Question' },
    { slug: 'quiz', name: 'Knowledge Quiz' },
  ]
  for (const tag of defaultTags) {
    const existing = await db.tag.findUnique({ where: { slug: tag.slug } })
    if (!existing) {
      report.tagsInserted++
      if (!dryRun) {
        await db.tag.create({
          data: {
            id: `tag-${tag.slug}`,
            slug: tag.slug,
            name: tag.name,
          },
        })
      }
    }
  }

  // 4. Seed Content Items & Revisions
  // Learn Challenges
  for (const section of sections) {
    for (const lesson of section.lessons) {
      for (const c of lesson.challenges) {
        if (options.fileFilter && !c.id.includes(options.fileFilter)) continue
        const itemRes = await upsertContentItem(
          {
            id: c.id,
            slug: c.id,
            type: 'coding_challenge',
            language: c.language ?? 'javascript',
            status: 'PUBLISHED',
            primaryCategoryId: section.id,
            skills: c.skills ?? [],
            categories: [section.id],
            tags: [c.guidance ?? 'guided'],
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
          },
          dryRun,
        )
        if (itemRes.isNew) report.contentInserted++
        else report.contentUpdated++
      }
    }
  }

  // Projects
  const projects = loadAllProjects()
  for (const proj of projects) {
    for (const m of proj.milestones) {
      const c = m.challenge
      if (options.fileFilter && !c.id.includes(options.fileFilter)) continue
      const itemRes = await upsertContentItem(
        {
          id: c.id,
          slug: c.id,
          type: 'project_step',
          language: c.language ?? 'javascript',
          status: 'PUBLISHED',
          primaryCategoryId: proj.id,
          skills: c.skills ?? [],
          categories: [proj.id],
          tags: ['project'],
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
        },
        dryRun,
      )
      if (itemRes.isNew) report.contentInserted++
      else report.contentUpdated++
    }
  }

  // Interview
  const interviews = loadAllInterviewProblems()
  for (const prob of interviews) {
    const c = prob.challenge
    if (options.fileFilter && !c.id.includes(options.fileFilter)) continue
    const itemRes = await upsertContentItem(
      {
        id: c.id,
        slug: c.id,
        type: 'interview_problem',
        language: c.language ?? 'javascript',
        status: 'PUBLISHED',
        primaryCategoryId: prob.id,
        skills: c.skills ?? [],
        categories: [prob.id],
        tags: ['interview'],
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
      },
      dryRun,
    )
    if (itemRes.isNew) report.contentInserted++
    else report.contentUpdated++
  }

  // Knowledge
  const quizSets = loadAllQuizSets()
  for (const quiz of quizSets) {
    for (const q of quiz.questions) {
      if (options.fileFilter && !q.id.includes(options.fileFilter)) continue
      const itemRes = await upsertContentItem(
        {
          id: q.id,
          slug: q.id,
          type: 'knowledge_question',
          language: 'javascript',
          status: 'PUBLISHED',
          primaryCategoryId: quiz.id,
          skills: q.skills ?? [],
          categories: [quiz.id],
          tags: ['quiz'],
          title: q.prompt,
          instruction: q.prompt,
          config: {
            options: (q as any).options,
            answer: q.answer,
            explanation: (q as any).explanation,
          },
        },
        dryRun,
      )
      if (itemRes.isNew) report.contentInserted++
      else report.contentUpdated++
    }
  }

  return report
}

async function upsertContentItem(
  data: {
    id: string
    slug: string
    type: string
    language: string
    status: 'PUBLISHED' | 'DRAFT'
    primaryCategoryId?: string
    skills: string[]
    categories: string[]
    tags: string[]
    title: string
    instruction?: string
    starterCode?: string
    solution?: string
    config: any
  },
  dryRun: boolean,
): Promise<{ isNew: boolean }> {
  const existing = await db.contentItem.findUnique({
    where: { id: data.id },
    include: { revisions: true },
  })

  const isNew = !existing
  if (dryRun) return { isNew }

  if (!existing) {
    const revId = `${data.id}-rev-1`
    await db.contentItem.create({
      data: {
        id: data.id,
        slug: data.slug,
        type: data.type,
        language: data.language,
        status: data.status as any,
        primaryCategoryId: data.primaryCategoryId,
        currentRevisionId: revId,
        revisions: {
          create: {
            id: revId,
            revision: 1,
            title: data.title,
            instruction: data.instruction,
            starterCode: data.starterCode,
            solution: data.solution,
            config: data.config,
            publishedAt: new Date(),
          },
        },
      },
    })
  } else {
    // Update existing item revision
    const revCount = existing.revisions.length
    const nextRev = revCount + 1
    const revId = `${data.id}-rev-${nextRev}`
    await db.contentRevision.create({
      data: {
        id: revId,
        contentItemId: data.id,
        revision: nextRev,
        title: data.title,
        instruction: data.instruction,
        starterCode: data.starterCode,
        solution: data.solution,
        config: data.config,
        publishedAt: new Date(),
      },
    })
    await db.contentItem.update({
      where: { id: data.id },
      data: {
        currentRevisionId: revId,
        status: data.status as any,
      },
    })
  }

  // Connect skills
  for (const skillId of data.skills) {
    const skillExists = await db.skill.findUnique({ where: { id: skillId } })
    if (skillExists) {
      await db.contentSkill.upsert({
        where: {
          contentItemId_skillId: {
            contentItemId: data.id,
            skillId,
          },
        },
        create: {
          contentItemId: data.id,
          skillId,
        },
        update: {},
      })
    }
  }

  // Connect categories
  for (const catId of data.categories) {
    const catExists = await db.category.findUnique({ where: { id: catId } })
    if (catExists) {
      await db.contentCategory.upsert({
        where: {
          contentItemId_categoryId: {
            contentItemId: data.id,
            categoryId: catId,
          },
        },
        create: {
          contentItemId: data.id,
          categoryId: catId,
          isPrimary: catId === data.primaryCategoryId,
        },
        update: {
          isPrimary: catId === data.primaryCategoryId,
        },
      })
    }
  }

  // Connect tags
  for (const tagSlug of data.tags) {
    const tag = await db.tag.findUnique({ where: { slug: tagSlug } })
    if (tag) {
      await db.contentTag.upsert({
        where: {
          contentItemId_tagId: {
            contentItemId: data.id,
            tagId: tag.id,
          },
        },
        create: {
          contentItemId: data.id,
          tagId: tag.id,
        },
        update: {},
      })
    }
  }

  return { isNew }
}
