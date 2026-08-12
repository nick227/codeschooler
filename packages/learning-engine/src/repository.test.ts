import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const envPath = join(__dirname, '../../../.env')
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

import { YamlContentRepository } from './yaml-repository'
import { PrismaContentRepository } from './prisma-repository'

test('YamlContentRepository loads items, skills, and categories', async () => {
  const repo = new YamlContentRepository()
  const skills = await repo.listSkills()
  assert.ok(skills.length > 0)
  assert.ok(skills.some((s) => s.id === 'javascript.variables'))

  const categories = await repo.listCategories()
  assert.ok(categories.length > 0)

  const item = await repo.getItem('js-create-variable-004')
  assert.ok(item)
  assert.equal(item?.type, 'coding_challenge')

  const rev = await repo.getRevision('js-create-variable-004')
  assert.ok(rev)
  assert.equal(rev?.revision, 1)
})

test('PrismaContentRepository queries seeded database content', async () => {
  const repo = new PrismaContentRepository()
  const skills = await repo.listSkills()
  assert.ok(skills.length > 0)

  const items = await repo.queryItems({ type: 'coding_challenge' })
  assert.ok(items.length > 0)
  assert.ok(items.every((i) => i.type === 'coding_challenge'))
})
