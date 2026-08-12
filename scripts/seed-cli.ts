import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Load .env if present
const envPath = join(__dirname, '../.env')
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

import { seedContentDatabase } from '../packages/learning-engine/src/seed'

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const replace = args.includes('--replace')
  const fileArg = args.find((a) => a.startsWith('--file='))
  const fileFilter = fileArg ? fileArg.split('=')[1] : undefined

  console.log('🌱 Starting Code Trainer content seed pipeline...')
  if (dryRun) console.log('🔍 DRY RUN MODE — No database mutations will be executed.')

  try {
    const report = await seedContentDatabase({ dryRun, replace, fileFilter })

    console.log('\n--- Seed Execution Summary ---')
    console.log(`Skills:       ${report.skillsInserted} inserted / ${report.skillsUnchanged} unchanged`)
    console.log(`Categories:   ${report.categoriesInserted} inserted / ${report.categoriesUnchanged} unchanged`)
    console.log(`Tags:         ${report.tagsInserted} inserted`)
    console.log(`Content:      ${report.contentInserted} inserted / ${report.contentUpdated} updated`)
    console.log(`Errors:       ${report.errors.length}`)

    if (report.errors.length > 0) {
      report.errors.forEach((err) => console.error(`  - ${err}`))
      process.exit(1)
    }

    console.log('\n✅ Content seed pipeline completed successfully.')
    process.exit(0)
  } catch (err) {
    console.error('❌ Content seed failed:', err)
    process.exit(1)
  }
}

void main()
