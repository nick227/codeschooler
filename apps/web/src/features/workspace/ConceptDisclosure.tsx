import type { PublicChallenge } from './workspace.types'

function lessonContentForChallenge(challenge: PublicChallenge): { topic: string; summary: string; keyTakeaway: string } {
  const skills = challenge.skills ?? []
  const title = challenge.title.toLowerCase()
  const instruction = challenge.instruction.toLowerCase()

  if (title.includes('variable') || instruction.includes('variable') || skills.includes('variables')) {
    return {
      topic: 'Variables & Value Binding',
      summary: 'In JavaScript, variables store data under a descriptive name so you can reuse and reference values throughout your program.',
      keyTakeaway: 'Declarations bind values to names. Clear variable naming makes your code self-documenting.',
    }
  }

  if (title.includes('function') || instruction.includes('function') || skills.includes('functions')) {
    return {
      topic: 'Functions & Reusable Logic',
      summary: 'Functions group code into reusable blocks that accept arguments, execute steps, and return computed results.',
      keyTakeaway: 'Functions isolate logic into clean, modular building blocks that can be tested independently.',
    }
  }

  if (title.includes('print') || title.includes('output') || instruction.includes('console')) {
    return {
      topic: 'Output & Program Observation',
      summary: "Outputting values lets you observe your program's execution state in real-time.",
      keyTakeaway: 'Observing exact outputs verifies your calculations match expected results.',
    }
  }

  return {
    topic: 'JavaScript Fundamentals',
    summary: `This challenge reinforces core skills in ${challenge.title} through active coding and instant validation.`,
    keyTakeaway: 'Writing real syntax directly in the editor builds muscular memory and problem-solving confidence.',
  }
}

export function ConceptDisclosure({ challenge }: { challenge: PublicChallenge }) {
  const lesson = lessonContentForChallenge(challenge)
  return (
    <details className="concept-disclosure" open>
      <summary className="concept-summary-toggle">
        <span className="hud-label">What You're Learning</span>
        <span className="concept-topic">{lesson.topic}</span>
      </summary>
      <div className="concept-box">
        <p className="concept-summary">{lesson.summary}</p>
        <div className="concept-takeaway">
          <span className="takeaway-label">Key Takeaway</span>
          <p>{lesson.keyTakeaway}</p>
        </div>
      </div>
    </details>
  )
}
