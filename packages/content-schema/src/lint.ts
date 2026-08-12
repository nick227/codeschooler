import fs from 'fs'
import path from 'path'
// lightweight recursive file walker to avoid extra deps


const ROOT = path.resolve(__dirname, '../../..')
const CONTENT_DIR = path.join(ROOT, 'content')

const args = process.argv.slice(2)
const FIX = args.includes('--fix')

function escapeSingleQuotedYaml(s: string) {
  return s.replace(/'/g, "''")
}

function processFile(relPath: string) {
  const abs = path.join(CONTENT_DIR, relPath)
  let text = fs.readFileSync(abs, 'utf8')
  const lines = text.split(/\n/)
  let changed = false
  const warnings: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // referenceSolution: single-line unquoted (not starting with | or ' or ")
    const refMatch = line.match(/^(\s*referenceSolution:\s*)(?![|'"|>])(.+)$/)
    if (refMatch) {
      const prefix = refMatch[1]
      const valueRaw = refMatch[2].trim()
      // skip block scalars and already-quoted values
      if (/^[>'"|]/.test(valueRaw) || valueRaw === '|' || valueRaw === '>') continue
      warnings.push(`${relPath}:${i + 1} referenceSolution appears unquoted: ${valueRaw}`)
      if (FIX) {
        const escaped = escapeSingleQuotedYaml(valueRaw)
        lines[i] = `${prefix}'${escaped}'`
        changed = true
      }
    }

    // value: SOMEWORD (likely intended string) but skip true/false/null and numbers
    const valMatch = line.match(/^(\s*value:\s*)([A-Za-z_][A-Za-z0-9_]*)\s*$/)
    if (valMatch) {
      const prefix = valMatch[1]
      const v = valMatch[2]
      if (!['true', 'false', 'null'].includes(v)) {
        warnings.push(`${relPath}:${i + 1} value appears unquoted string: ${v}`)
        if (FIX) {
          lines[i] = `${prefix}'${escapeSingleQuotedYaml(v)}'`
          changed = true
        }
      }
    }

    // tags: [a, B, C] -> normalize to lowercase tokens
    const tagsMatch = line.match(/^(\s*tags:\s*)\[(.*)\]\s*$/)
    if (tagsMatch) {
      const prefix = tagsMatch[1]
      const inner = tagsMatch[2]
      const parts = inner.split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '').toLowerCase())
      const normalized = parts.join(', ')
      warnings.push(`${relPath}:${i + 1} tags normalized: [${parts.join(', ')}]`)
      if (FIX) {
        lines[i] = `${prefix}[${normalized}]`
        changed = true
      }
    }

    // guidance: trim + lowercase
    const guidanceMatch = line.match(/^(\s*guidance:\s*)(.+)$/)
    if (guidanceMatch) {
      const prefix = guidanceMatch[1]
      let val = guidanceMatch[2].trim()
      val = val.replace(/^['"]|['"]$/g, '').toLowerCase()
      warnings.push(`${relPath}:${i + 1} guidance normalized: ${val}`)
      if (FIX) {
        lines[i] = `${prefix}${val}`
        changed = true
      }
    }
  }

  if (warnings.length > 0) {
    console.log(`\nFile: ${relPath}`)
    for (const w of warnings) console.log('  WARN:', w)
  }

  if (changed) {
    fs.writeFileSync(abs, lines.join('\n'))
    console.log(`  Fixed ${relPath}`)
  }

  return warnings.length
}

function main() {
  function walk(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    const out: string[] = []
    for (const e of entries) {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) out.push(...walk(full))
      else if (e.isFile() && full.endsWith('.yaml')) out.push(path.relative(CONTENT_DIR, full))
    }
    return out
  }

  const files = walk(CONTENT_DIR)
  let total = 0
  for (const f of files) total += processFile(f)
  console.log(`\nScan complete. Issues found: ${total}. Fix mode: ${FIX}`)
  if (total > 0 && !FIX) process.exitCode = 2
}

main()
