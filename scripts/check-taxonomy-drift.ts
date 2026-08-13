import { execFileSync } from 'child_process'
import { mkdirSync, readFileSync } from 'fs'
import { join, resolve } from 'path'

const root = resolve(__dirname, '..')
const committedPath = join(root, 'apps/web/src/utils/skills.ts')
const tempDir = join(root, 'node_modules/.cache/taxonomy-drift')
const tempPath = join(tempDir, `skills-drift-${Date.now()}.ts`)

mkdirSync(tempDir, { recursive: true })

execFileSync(process.execPath, ['--import', 'tsx', join(root, 'scripts/generate-skills-map.ts')], {
  cwd: root,
  env: { ...process.env, TARGET_TS_PATH: tempPath },
  stdio: 'pipe',
})

const committed = readFileSync(committedPath, 'utf8').trim()
const fresh = readFileSync(tempPath, 'utf8').trim()

if (committed !== fresh) {
  console.error('❌  Taxonomy skills map is out of sync with content/skills.yaml or interview patterns.')
  console.error('    Run `pnpm taxonomy:generate` and commit the updated apps/web/src/utils/skills.ts')
  process.exit(1)
}

console.log('✓  Taxonomy skills map matches content')
