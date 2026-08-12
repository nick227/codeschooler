import assert from 'node:assert/strict'
import test from 'node:test'
import { loadAllSections, loadAllTracks, loadSkills } from './loader'
import { validateCatalog } from './validate'

function catalog() {
  return structuredClone({
    skills: loadSkills(),
    tracks: loadAllTracks(),
    sections: loadAllSections(),
  })
}

test('current authored curriculum satisfies cross-document validation', () => {
  assert.deepEqual(validateCatalog(catalog()), [])
})

test('reports duplicate ids and unresolved skill references', () => {
  const content = catalog()
  const firstSkill = content.skills[0]
  const firstChallenge = content.sections[0]?.lessons[0]?.challenges[0]
  assert(firstSkill)
  assert(firstChallenge)
  content.skills.push(structuredClone(firstSkill))
  firstChallenge.skills.push('javascript.missing')

  const errors = validateCatalog(content)
  assert(errors.includes('Duplicate skill id "javascript.output"'))
  assert(errors.some((error) => error.includes('references missing skill "javascript.missing"')))
})

test('reports prerequisite cycles and unordered hint ladders', () => {
  const content = catalog()
  const firstSkill = content.skills[0]
  const secondSkill = content.skills[1]
  const firstChallenge = content.sections[0]?.lessons[0]?.challenges[0]
  assert(firstSkill)
  assert(secondSkill)
  assert(firstChallenge)
  firstSkill.prerequisites = [secondSkill.id]
  secondSkill.prerequisites = [firstSkill.id]
  firstChallenge.hints.reverse()
  firstChallenge.authoring.rejectedSolutions[0]!.source = firstChallenge.authoring.referenceSolution

  const errors = validateCatalog(content)
  assert(errors.some((error) => error.startsWith('Skill prerequisite cycle:')))
  assert(errors.some((error) => error.includes('hints must have unique ascending levels')))
  assert(errors.some((error) => error.includes('is both accepted and rejected')))
})
