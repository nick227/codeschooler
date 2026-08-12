import assert from 'node:assert/strict'
import test from 'node:test'
import { loadAllInterviewProblems, loadAllProjects, loadAllQuizSets, loadAllSections, loadAllTracks, loadSkills } from './loader'
import { validateCatalog } from './validate'
import { getQuestionPrivate, getQuizSetPublic, listModeItems, resetContentCache } from './queries'

function catalog() {
  return structuredClone({
    skills: loadSkills(),
    tracks: loadAllTracks(),
    sections: loadAllSections(),
    projects: loadAllProjects(),
    interviewProblems: loadAllInterviewProblems(),
    quizSets: loadAllQuizSets(),
  })
}

test('current authored curriculum satisfies cross-document validation', () => {
  assert.deepEqual(validateCatalog(catalog()), [])
})

test('publishes all four modes without leaking quiz answers', () => {
  resetContentCache()
  for (const mode of ['learn', 'projects', 'interview', 'knowledge'] as const) {
    assert(listModeItems(mode).items.length > 0)
  }
  const publicQuiz = getQuizSetPublic('variables-concept-check')
  assert(publicQuiz)
  assert.equal('answer' in publicQuiz.questions[0]!, false)
  const privateQuestion = getQuestionPrivate('variables-concept-value-001')
  assert(privateQuestion)
  assert.equal('answer' in privateQuestion.question, true)
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

test('keeps guided, transfer, and concept-check skills aligned', () => {
  const content = catalog()
  const transfer = content.sections
    .flatMap((section) => section.lessons)
    .flatMap((lesson) => lesson.challenges)
    .find((challenge) => challenge.evidence?.role === 'transfer')
  assert(transfer)
  transfer.skills.push('javascript.output')

  const errors = validateCatalog(content)
  assert(errors.some((error) => error.includes('must measure the same canonical skills')))
})
