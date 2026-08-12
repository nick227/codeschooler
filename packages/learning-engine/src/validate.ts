import type { Section, Skill, Track } from '@code-trainer/content-schema'
import { loadAllSections, loadAllTracks, loadSkills } from './loader'

export interface ContentCatalog {
  skills: Skill[]
  tracks: Track[]
  sections: Section[]
}

function duplicates(values: string[]): string[] {
  const seen = new Set<string>()
  const duplicateValues = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) duplicateValues.add(value)
    seen.add(value)
  }
  return [...duplicateValues].sort()
}

function reportDuplicates(kind: string, ids: string[], errors: string[]) {
  for (const id of duplicates(ids)) errors.push(`Duplicate ${kind} id "${id}"`)
}

function validateSkillGraph(skills: Skill[], errors: string[]) {
  const skillIds = new Set(skills.map((skill) => skill.id))
  const identityOwners = new Map<string, string>()

  for (const skill of skills) {
    for (const identity of [skill.id, ...skill.aliases]) {
      const owner = identityOwners.get(identity)
      if (owner && owner !== skill.id) {
        errors.push(`Skill identity "${identity}" is shared by "${owner}" and "${skill.id}"`)
      } else {
        identityOwners.set(identity, skill.id)
      }
    }

    for (const prerequisite of skill.prerequisites) {
      if (!skillIds.has(prerequisite)) {
        errors.push(`Skill "${skill.id}" references missing prerequisite "${prerequisite}"`)
      }
      if (prerequisite === skill.id) {
        errors.push(`Skill "${skill.id}" cannot require itself`)
      }
    }

    if (skill.replacementId) {
      if (!skill.deprecated) {
        errors.push(`Skill "${skill.id}" has a replacement but is not deprecated`)
      }
      if (!skillIds.has(skill.replacementId)) {
        errors.push(`Skill "${skill.id}" references missing replacement "${skill.replacementId}"`)
      }
      if (skill.replacementId === skill.id) {
        errors.push(`Skill "${skill.id}" cannot replace itself`)
      }
    }
  }

  const states = new Map<string, 'visiting' | 'visited'>()
  const byId = new Map(skills.map((skill) => [skill.id, skill]))
  function visit(id: string, path: string[]) {
    if (states.get(id) === 'visited') return
    if (states.get(id) === 'visiting') {
      errors.push(`Skill prerequisite cycle: ${[...path, id].join(' -> ')}`)
      return
    }
    states.set(id, 'visiting')
    const skill = byId.get(id)
    for (const prerequisite of skill?.prerequisites ?? []) {
      if (byId.has(prerequisite)) visit(prerequisite, [...path, id])
    }
    states.set(id, 'visited')
  }
  for (const skill of skills) visit(skill.id, [])
}

export function validateCatalog(catalog: ContentCatalog): string[] {
  const errors: string[] = []
  const { skills, tracks, sections } = catalog
  const skillIds = new Set(skills.map((skill) => skill.id))
  const sectionIds = new Set(sections.map((section) => section.id))

  reportDuplicates('skill', skills.map((skill) => skill.id), errors)
  reportDuplicates('track', tracks.map((track) => track.id), errors)
  reportDuplicates('section', sections.map((section) => section.id), errors)
  reportDuplicates('lesson', sections.flatMap((section) => section.lessons.map((lesson) => lesson.id)), errors)
  reportDuplicates(
    'challenge',
    sections.flatMap((section) =>
      section.lessons.flatMap((lesson) => lesson.challenges.map((challenge) => challenge.id)),
    ),
    errors,
  )
  validateSkillGraph(skills, errors)

  for (const track of tracks) {
    for (const duplicateSectionId of duplicates(track.sectionIds)) {
      errors.push(`Track "${track.id}" repeats section "${duplicateSectionId}"`)
    }
    for (const sectionId of track.sectionIds) {
      if (!sectionIds.has(sectionId)) {
        errors.push(`Track "${track.id}" references missing section "${sectionId}"`)
      }
    }
  }

  for (const section of sections) {
    for (const lesson of section.lessons) {
      for (const challenge of lesson.challenges) {
        for (const skillId of challenge.skills) {
          if (!skillIds.has(skillId)) {
            errors.push(`Challenge "${challenge.id}" references missing skill "${skillId}"`)
          }
        }
        for (const duplicateSkillId of duplicates(challenge.skills)) {
          errors.push(`Challenge "${challenge.id}" repeats skill "${duplicateSkillId}"`)
        }

        const hintLevels = challenge.hints.map((hint) => hint.level)
        for (let index = 1; index < hintLevels.length; index++) {
          const currentLevel = hintLevels[index]
          const previousLevel = hintLevels[index - 1]
          if (currentLevel !== undefined && previousLevel !== undefined && currentLevel <= previousLevel) {
            errors.push(`Challenge "${challenge.id}" hints must have unique ascending levels`)
            break
          }
        }

        const fixtureNames = [
          ...challenge.authoring.acceptedSolutions,
          ...challenge.authoring.rejectedSolutions,
        ].map((fixture) => fixture.name)
        for (const duplicateName of duplicates(fixtureNames)) {
          errors.push(`Challenge "${challenge.id}" repeats fixture name "${duplicateName}"`)
        }

        const acceptedSources = new Set([
          challenge.authoring.referenceSolution.trim(),
          ...challenge.authoring.acceptedSolutions.map((fixture) => fixture.source.trim()),
        ])
        for (const rejected of challenge.authoring.rejectedSolutions) {
          if (acceptedSources.has(rejected.source.trim())) {
            errors.push(
              `Challenge "${challenge.id}" fixture "${rejected.name}" is both accepted and rejected`,
            )
          }
        }
      }
    }
  }

  return errors
}

export function loadAndValidateCatalog(): { catalog: ContentCatalog; errors: string[] } {
  const catalog = {
    skills: loadSkills(),
    tracks: loadAllTracks(),
    sections: loadAllSections(),
  }
  return { catalog, errors: validateCatalog(catalog) }
}

function main() {
  const { catalog, errors } = loadAndValidateCatalog()
  for (const error of errors) console.error(`✗ ${error}`)
  if (errors.length > 0) {
    console.error(`\n${errors.length} content error(s) found.`)
    process.exitCode = 1
    return
  }

  const challengeCount = catalog.sections.reduce(
    (count, section) =>
      count + section.lessons.reduce((lessonCount, lesson) => lessonCount + lesson.challenges.length, 0),
    0,
  )
  console.log(
    `✓ Content valid — ${catalog.skills.length} skills, ${catalog.tracks.length} track(s), ${challengeCount} challenge(s)`,
  )
}

if (require.main === module) main()
