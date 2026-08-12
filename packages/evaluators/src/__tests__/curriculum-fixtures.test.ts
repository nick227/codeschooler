import { describe, expect, it } from 'vitest'
import { listInterviewProblems, listProjects, listSectionsForTrack } from '@code-trainer/learning-engine'
import { buildProgram, type ExecutionResult } from '@code-trainer/language-javascript'
import { evaluateChecks, isComplete } from '../evaluate'
import { probesForChecks } from '../probes'
import type { Challenge } from '@code-trainer/content-schema'

function installDomMock() {
  type FakeNode = {
    id: string
    tagName: string
    textContent: string
    children: FakeNode[]
    onclick: ((event: { type: string }) => void) | null
    listeners: Record<string, Array<() => void>>
    appendChild: (child: FakeNode) => FakeNode
    setAttribute: (name: string, value: string) => void
    addEventListener: (type: string, handler: () => void) => void
    click: () => void
  }

  const createNode = (tagName: string): FakeNode => {
    const node: FakeNode = {
      id: '',
      tagName,
      textContent: '',
      children: [],
      onclick: null,
      listeners: {},
      appendChild(child) {
        this.children.push(child)
        return child
      },
      setAttribute(name, value) {
        if (name === 'id') this.id = value
      },
      addEventListener(type, handler) {
        this.listeners[type] = this.listeners[type] ?? []
        this.listeners[type].push(handler)
      },
      click() {
        for (const handler of this.listeners.click ?? []) handler()
        this.onclick?.({ type: 'click' })
      },
    }
    return node
  }

  const previewRoot = createNode('div')
  previewRoot.id = 'preview-root'

  const documentMock = {
    getElementById(id: string) {
      if (id === 'preview-root') return previewRoot
      const stack = [...previewRoot.children]
      while (stack.length > 0) {
        const node = stack.pop()
        if (!node) break
        if (node.id === id) return node
        stack.push(...node.children)
      }
      return null
    },
    createElement(tag: string) {
      return createNode(tag)
    },
    querySelector(selector: string) {
      if (selector.startsWith('#')) return this.getElementById(selector.slice(1))
      return null
    },
  }

  const previous = globalThis.document
  Object.defineProperty(globalThis, 'document', { value: documentMock, configurable: true })
  return () => {
    Object.defineProperty(globalThis, 'document', { value: previous, configurable: true })
  }
}

async function evaluate(source: string, challenge: Challenge) {
  const restore = challenge.runtime.environment === 'dom' ? installDomMock() : undefined
  try {
    const program = buildProgram(source, probesForChecks(challenge.checks))
    const run = new Function(program) as () => Promise<{
      logs: string[]
      probes: ExecutionResult['probes']
      outputTruncated: boolean
      runtimeError?: string
    }>
    const raw = await run()
    const execution: ExecutionResult = {
      success: raw.runtimeError === undefined,
      logs: raw.logs,
      probes: raw.probes,
      durationMs: 0,
      outputTruncated: raw.outputTruncated,
      ...(raw.runtimeError ? { error: { message: raw.runtimeError, raw: raw.runtimeError } } : {}),
    }
    return execution.success && isComplete(evaluateChecks(challenge.checks, execution))
  } finally {
    restore?.()
  }
}

describe('authored curriculum solution fixtures', () => {
  const challenges = [
    ...listSectionsForTrack('javascript-fundamentals').flatMap((section) =>
      section.lessons.flatMap((lesson) => lesson.challenges)),
    ...listProjects().flatMap((project) => project.milestones.map((milestone) => milestone.challenge)),
    ...listInterviewProblems().map((problem) => problem.challenge),
  ]

  for (const challenge of challenges) {
      it(`${challenge.id} accepts its reference and alternate solutions`, async () => {
        expect(await evaluate(challenge.authoring.referenceSolution, challenge)).toBe(true)
        for (const fixture of challenge.authoring.acceptedSolutions) {
          expect(await evaluate(fixture.source, challenge), fixture.name).toBe(true)
        }
      })

      it(`${challenge.id} rejects known incorrect solutions`, async () => {
        for (const fixture of challenge.authoring.rejectedSolutions) {
          expect(await evaluate(fixture.source, challenge), fixture.name).toBe(false)
        }
      })
  }
})
