import { test, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const envPath = join(__dirname, '../../.env')
if (existsSync(envPath)) {
  const envConfig = readFileSync(envPath, 'utf-8')
  for (const line of envConfig.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const equalsIdx = trimmed.indexOf('=')
    if (equalsIdx > 0) {
      const key = trimmed.slice(0, equalsIdx).trim()
      let val = trimmed.slice(equalsIdx + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!process.env[key]) {
        process.env[key] = val
      }
    }
  }
}

import { ContentAdminService } from './services/ContentAdminService'

test('ContentAdminService creates, validates, and publishes draft content', async () => {
  const service = new ContentAdminService()

  // 1. Create content draft
  const draft = await service.createContent({
    slug: `test-admin-item-${Date.now()}`,
    type: 'coding_challenge',
    title: 'Test Admin Challenge',
    instruction: 'Declare a variable x equal to 42',
    starterCode: 'let x = 0;',
    solution: 'let x = 42;',
    config: {
      checks: [{ type: 'variableEquals', name: 'x', value: 42 }],
      hints: [{ level: 1, text: 'Assign 42 to x.' }],
      reward: { xp: 20 },
    },
    difficulty: 'beginner',
    primaryCategoryId: 'getting-started',
    skills: ['javascript.variables'],
  })

  expect(draft).toBeDefined()
  expect(draft.status).toBe('DRAFT')

  // 2. Validate content item
  const report = await service.validateContent(draft.id)
  expect(report).toBeDefined()
  expect(report.checks.some((c) => c.name === 'Reference solution' && c.status === 'pass')).toBe(true)

  // 3. Publish content item
  const published = await service.publishContent(draft.id)
  expect(published?.status).toBe('PUBLISHED')

  // 4. Query list
  const list = await service.listContent({ search: draft.slug })
  expect(list.length).toBeGreaterThan(0)
  expect(list[0]?.id).toBe(draft.id)
})
