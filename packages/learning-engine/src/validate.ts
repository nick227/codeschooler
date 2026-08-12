import type { Challenge, InterviewProblem, Project, Question, QuizSet, Section, Skill, Track } from '@code-trainer/content-schema'
import {
  loadAllInterviewProblems,
  loadAllProjects,
  loadAllQuizSets,
  loadAllSections,
  loadAllTracks,
  loadSkills,
} from './loader'

export interface ContentCatalog {
  skills: Skill[]
  tracks: Track[]
  sections: Section[]
  projects: Project[]
  interviewProblems: InterviewProblem[]
  quizSets: QuizSet[]
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
  const { skills, tracks, sections, projects, interviewProblems, quizSets } = catalog
  const skillIds = new Set(skills.map((skill) => skill.id))
  const sectionIds = new Set(sections.map((section) => section.id))

  reportDuplicates('skill', skills.map((skill) => skill.id), errors)
  reportDuplicates('track', tracks.map((track) => track.id), errors)
  reportDuplicates('section', sections.map((section) => section.id), errors)
  reportDuplicates('project', projects.map((project) => project.id), errors)
  reportDuplicates('interview problem', interviewProblems.map((problem) => problem.id), errors)
  reportDuplicates('quiz set', quizSets.map((quiz) => quiz.id), errors)
  reportDuplicates('lesson', sections.flatMap((section) => section.lessons.map((lesson) => lesson.id)), errors)
  const challenges = [
    ...sections.flatMap((section) => section.lessons.flatMap((lesson) => lesson.challenges)),
    ...projects.flatMap((project) => project.milestones.map((milestone) => milestone.challenge)),
    ...interviewProblems.map((problem) => problem.challenge),
  ]
  reportDuplicates('challenge', challenges.map((challenge) => challenge.id), errors)
  reportDuplicates('project milestone', projects.flatMap((project) => project.milestones.map((milestone) => milestone.id)), errors)
  reportDuplicates('question', quizSets.flatMap((quiz) => quiz.questions.map((question) => question.id)), errors)
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

  function validateChallenge(challenge: Challenge) {
        for (const skillId of challenge.skills) {
          if (!skillIds.has(skillId)) {
            errors.push(`Challenge "${challenge.id}" references missing skill "${skillId}"`)
          }
        }

        if (challenge.runtime.environment === 'worker' && challenge.runtime.capabilities.dom) {
          errors.push(`Challenge "${challenge.id}" cannot grant DOM access in a worker runtime`)
        }
        if (challenge.runtime.environment === 'dom' && !challenge.runtime.capabilities.dom) {
          errors.push(`Challenge "${challenge.id}" uses the DOM runtime without declaring DOM capability`)
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

  for (const challenge of challenges) validateChallenge(challenge)

  for (const project of projects) {
    for (const skillId of project.skills) {
      if (!skillIds.has(skillId)) errors.push(`Project "${project.id}" references missing skill "${skillId}"`)
    }
    const milestoneSkills = new Set(project.milestones.flatMap((milestone) => milestone.challenge.skills))
    for (const skillId of milestoneSkills) {
      if (!project.skills.includes(skillId)) errors.push(`Project "${project.id}" milestone uses undeclared project skill "${skillId}"`)
    }
  }

  function validateQuestion(question: Question, quiz: QuizSet) {
    for (const skillId of question.skills) {
      if (!skillIds.has(skillId)) errors.push(`Question "${question.id}" references missing skill "${skillId}"`)
    }
    for (const duplicateSkillId of duplicates(question.skills)) {
      errors.push(`Question "${question.id}" repeats skill "${duplicateSkillId}"`)
    }
    if ('options' in question) {
      const optionIds = question.options.map((option) => option.id)
      reportDuplicates(`option in question "${question.id}"`, optionIds, errors)
      for (const answerId of question.answer.correctOptionIds) {
        if (!optionIds.includes(answerId)) errors.push(`Question "${question.id}" answer references missing option "${answerId}"`)
      }
    } else if ('items' in question) {
      const itemIds = question.items.map((item) => item.id)
      reportDuplicates(`item in question "${question.id}"`, itemIds, errors)
      if (question.answer.orderedItemIds.length !== itemIds.length || new Set(question.answer.orderedItemIds).size !== itemIds.length || question.answer.orderedItemIds.some((id) => !itemIds.includes(id))) {
        errors.push(`Question "${question.id}" ordering answer must contain every item exactly once`)
      }
    } else if ('left' in question) {
      const leftIdList = question.left.map((item) => item.id)
      const rightIdList = question.right.map((item) => item.id)
      reportDuplicates(`left item in question "${question.id}"`, leftIdList, errors)
      reportDuplicates(`right item in question "${question.id}"`, rightIdList, errors)
      const leftIds = new Set(leftIdList)
      const rightIds = new Set(rightIdList)
      const answerLeftIds = question.answer.pairs.map((pair) => pair.leftId)
      const answerRightIds = question.answer.pairs.map((pair) => pair.rightId)
      if (
        question.answer.pairs.some((pair) => !leftIds.has(pair.leftId) || !rightIds.has(pair.rightId)) ||
        answerLeftIds.length !== leftIds.size || new Set(answerLeftIds).size !== leftIds.size ||
        answerRightIds.length !== rightIds.size || new Set(answerRightIds).size !== rightIds.size
      ) {
        errors.push(`Question "${question.id}" matching answer must pair every item exactly once`)
      }
    }
    if (quiz.purpose === 'concept-check' && !quiz.evidenceSequenceId) {
      errors.push(`Concept check "${quiz.id}" requires an evidence sequence`)
    }
  }
  for (const quiz of quizSets) for (const question of quiz.questions) validateQuestion(question, quiz)

  const transfers = challenges.filter((challenge) => challenge.evidence?.role === 'transfer')
  for (const transfer of transfers) {
    const sequenceId = transfer.evidence?.sequenceId
    const guidedSkills = new Set(challenges
      .filter((challenge) => challenge.evidence?.sequenceId === sequenceId && challenge.evidence?.role === 'guided-practice')
      .flatMap((challenge) => challenge.skills))
    const transferSkills = new Set(transfer.skills)
    for (const skillId of new Set([...guidedSkills, ...transferSkills])) {
      if (!guidedSkills.has(skillId) || !transferSkills.has(skillId)) errors.push(`Transfer challenge "${transfer.id}" and guided sequence "${sequenceId}" must measure the same canonical skills`)
    }
    const conceptCheck = quizSets.find((quiz) => quiz.purpose === 'concept-check' && quiz.evidenceSequenceId === sequenceId)
    if (!conceptCheck) errors.push(`Transfer challenge "${transfer.id}" has no concept check for sequence "${sequenceId}"`)
    else {
      const conceptSkills = new Set(conceptCheck.questions.flatMap((question) => question.skills))
      for (const skillId of new Set([...conceptSkills, ...transferSkills])) {
        if (!conceptSkills.has(skillId) || !transferSkills.has(skillId)) errors.push(`Concept check "${conceptCheck.id}" and transfer challenge "${transfer.id}" must measure the same canonical skills`)
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
    projects: loadAllProjects(),
    interviewProblems: loadAllInterviewProblems(),
    quizSets: loadAllQuizSets(),
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
    `✓ Content valid — ${catalog.skills.length} skills, ${catalog.tracks.length} track(s), ${challengeCount} Learn challenge(s), ${catalog.projects.length} project(s), ${catalog.interviewProblems.length} interview problem(s), ${catalog.quizSets.length} quiz set(s)`,
  )
}

if (require.main === module) main()
