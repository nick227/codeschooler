import { readFileSync, readdirSync } from 'fs'
import { join, resolve } from 'path'
import { load as parseYaml } from 'js-yaml'
import { z } from 'zod'
import { SkillSchema, TrackSchema, SectionSchema, type Skill, type Track, type Section } from '@code-trainer/content-schema'

// Curriculum ships as versioned YAML in this repo for V1 (docs/03's content
// portability note: the schema is designed so the same objects can later
// come from a database or CMS without changing callers of this module).
const CONTENT_ROOT = resolve(__dirname, '../../../content')

function readYaml(relativePath: string): unknown {
  const raw = readFileSync(join(CONTENT_ROOT, relativePath), 'utf-8')
  return parseYaml(raw)
}

function listYamlFiles(relativeDir: string): string[] {
  return readdirSync(join(CONTENT_ROOT, relativeDir)).filter((f) => f.endsWith('.yaml'))
}

export function loadSkills(): Skill[] {
  const doc = readYaml('skills.yaml') as { skills: unknown[] }
  return z.array(SkillSchema).parse(doc.skills)
}

export function loadAllTracks(): Track[] {
  return listYamlFiles('javascript/learn/tracks').map((file) =>
    TrackSchema.parse(readYaml(`javascript/learn/tracks/${file}`)),
  )
}

export function loadAllSections(): Section[] {
  return listYamlFiles('javascript/learn/sections').map((file) =>
    SectionSchema.parse(readYaml(`javascript/learn/sections/${file}`)),
  )
}
