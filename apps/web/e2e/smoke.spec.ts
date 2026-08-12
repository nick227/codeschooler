import { expect, test } from '@playwright/test'

test('visitor reaches the variables editor without signing in', async ({ page }) => {
  await page.route('**/challenges/js-create-variable-004', async (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: {
      id: 'js-create-variable-004', revision: 1, language: 'javascript', title: 'Create a Score',
      instruction: 'Create a variable named score and give it the value 10.', starterCode: '',
      skills: ['javascript.variables'], guidance: 'guided', requiresRun: false,
      checks: [{ type: 'variableExists', name: 'score' }, { type: 'variableEquals', name: 'score', value: 10 }],
      reward: { xp: 20 },
    } }),
  }))
  await page.route('**/sections/getting-started', async (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: { id: 'getting-started', title: 'Getting Started', description: 'Start here.', lessons: [{ id: 'variables', title: 'Variables', summary: 'Store a value.', challenges: [{ id: 'js-create-variable-004', title: 'Create a Score' }] }] } }),
  }))

  await page.goto('/learn/javascript-fundamentals/getting-started/js-create-variable-004')
  await expect(page.getByRole('heading', { name: /create a variable named score/i })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'JavaScript code editor' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^run$/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /^check$/i })).toBeVisible()
})

test('mobile keeps the goal, editor, symbols, and actions in document flow', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const page = await context.newPage()
  await page.route('**/challenges/js-create-variable-004', async (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: {
      id: 'js-create-variable-004', revision: 1, language: 'javascript', title: 'Create a Score',
      instruction: 'Create a variable named score and give it the value 10.', starterCode: '',
      skills: ['javascript.variables'], guidance: 'guided', requiresRun: false,
      checks: [{ type: 'variableExists', name: 'score' }, { type: 'variableEquals', name: 'score', value: 10 }],
      reward: { xp: 20 },
    } }),
  }))
  await page.route('**/sections/getting-started', async (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: { id: 'getting-started', title: 'Getting Started', description: 'Start here.', lessons: [{ id: 'variables', title: 'Variables', summary: 'Store a value.', challenges: [{ id: 'js-create-variable-004', title: 'Create a Score' }] }] } }),
  }))

  await page.goto('/learn/javascript-fundamentals/getting-started/js-create-variable-004')
  const goal = page.locator('.mobile-goal')
  await expect(goal).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'JavaScript code editor' })).toBeVisible()
  await expect(page.locator('.coding-row')).toBeVisible()
  await page.getByRole('button', { name: /^check$/i }).scrollIntoViewIfNeeded()
  await expect(page.getByRole('button', { name: /^run$/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /^check$/i })).toBeVisible()
  await context.close()
})

test('beginner runtime denies network, storage, timers, and nested workers', async ({ page }) => {
  await page.goto('/')
  const capabilities = await page.evaluate(async () => {
    const workerUrl = new URL('/src/../../packages/language-javascript/src/worker.ts', window.location.origin)
    // Exercise the actual bundled worker through the public runner instead of
    // relying on generated-function tests.
    const { execute } = await import('/@fs/home/administrator/web/codeschooled/packages/language-javascript/src/runner.ts')
    void workerUrl
    return execute('console.log(typeof fetch, typeof XMLHttpRequest, typeof WebSocket, typeof indexedDB, typeof setTimeout, typeof Worker)')
  })
  expect(capabilities.success).toBe(true)
  expect(capabilities.logs).toEqual(['undefined undefined undefined undefined undefined undefined'])
})

test('DOM runtime uses an opaque sandbox, CSP, caps, and tears down', async ({ page }) => {
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const frames: Array<{ sandbox: string | null; srcdoc: string }> = []
    const observer = new MutationObserver(() => {
      for (const frame of document.querySelectorAll('iframe[title="Isolated code preview runtime"]')) {
        frames.push({ sandbox: frame.getAttribute('sandbox'), srcdoc: (frame as HTMLIFrameElement).srcdoc })
      }
    })
    observer.observe(document.body, { childList: true })
    const { executeDom } = await import('/@fs/home/administrator/web/codeschooled/packages/language-javascript/src/domRunner.ts')
    const execution = await executeDom('console.log(document.querySelector("#preview-root") !== null, typeof setTimeout, typeof fetch, typeof XMLHttpRequest); try { localStorage.getItem("x") } catch (error) { console.log(error.name) }', { timeoutMs: 1000, maxOutputBytes: 512, capabilities: { dom: true } })
    await new Promise((resolve) => setTimeout(resolve, 0))
    observer.disconnect()
    return { execution, frames, remaining: document.querySelectorAll('iframe[title="Isolated code preview runtime"]').length }
  })
  expect(result.execution.success, JSON.stringify(result)).toBe(true)
  expect(result.execution.logs).toEqual(['true undefined undefined undefined', 'TypeError'])
  expect(result.frames.some((frame) => frame.sandbox === 'allow-scripts')).toBe(true)
  expect(result.frames.some((frame) => frame.srcdoc.includes("default-src 'none'"))).toBe(true)
  expect(result.remaining).toBe(0)
})

test('creating an account merges local progress once without sending XP', async ({ page }) => {
  await page.route('**/auth/me', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Unauthorized' }) }))
  await page.route('**/auth/register', (route) => route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ data: { id: 'u1', email: 'learner@example.com', displayName: 'Learner', createdAt: new Date().toISOString() } }) }))
  let mergeBody: Record<string, unknown> | undefined
  await page.route('**/progress/merge', async (route) => {
    mergeBody = route.request().postDataJSON() as Record<string, unknown>
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { alreadyMerged: false, draftsMerged: 1, evidenceMerged: 1, rewardsGranted: 1 } }) })
  })
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.setItem('code-trainer:draft:v1:transfer', JSON.stringify({ schemaVersion: 1, challengeId: 'transfer', contentRevision: 1, source: 'const total = 3', updatedAt: new Date().toISOString() }))
    localStorage.setItem('code-trainer:evidence:v1:event-1', JSON.stringify({ clientEventId: 'event-1', challengeId: 'transfer', contentRevision: 1, kind: 'TRANSFER', result: 'INDEPENDENT_SUCCESS', hintsUsed: 0, attempts: 1, occurredAt: new Date().toISOString() }))
  })
  await page.getByRole('button', { name: 'Save progress' }).click()
  await page.getByLabel('Display name').fill('Learner')
  await page.getByLabel('Email').fill('learner@example.com')
  await page.getByLabel('Password').fill('a-secure-password')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect.poll(() => mergeBody).toBeTruthy()
  expect(JSON.stringify(mergeBody)).not.toContain('xpAwarded')
  expect(JSON.stringify(mergeBody)).not.toContain('"xp"')
  expect(await page.evaluate(() => localStorage.getItem('code-trainer:draft:v1:transfer'))).toBeNull()
})

test('Interview and Projects reuse the same challenge workspace contract', async ({ page }) => {
  const challenge = {
    id: 'mode-challenge', revision: 1, language: 'javascript', title: 'Reusable challenge',
    instruction: 'Return the first matching index.', starterCode: 'function findTarget() {}',
    skills: ['javascript.functions'], guidance: 'independent', requiresRun: false,
    checks: [{ type: 'functionExists', name: 'findTarget' }], reward: { xp: 25 },
    runtime: { environment: 'worker', timeoutMs: 1000, maxOutputBytes: 4096, capabilities: { network: false, storage: false, timers: false, dom: false } },
  }
  await page.route('**/challenges/mode-challenge', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: challenge }) }))
  for (const route of ['/interview/mode-challenge', '/projects/mode-challenge']) {
    await page.goto(route)
    await expect(page.getByRole('textbox', { name: 'JavaScript code editor' })).toBeVisible()
    await expect(page.getByText('Independent')).toBeVisible()
    await expect(page.getByRole('button', { name: /^check$/i })).toBeVisible()
  }
})

test('Knowledge renders answer-free quiz content and checks answers authoritatively', async ({ page }) => {
  await page.route('**/quiz-sets/variables-concept-check', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: {
    id: 'variables-concept-check', revision: 1, title: 'Variables Concept Check', description: 'Check your understanding.', purpose: 'concept-check',
    questions: [{ id: 'q1', revision: 1, type: 'multiple-choice', prompt: 'What value is stored?', skills: ['javascript.variables'], options: [{ id: 'eight', label: '8' }, { id: 'six', label: '6' }] }],
  } }) }))
  let submitted: Record<string, unknown> | undefined
  await page.route('**/knowledge/answers', async (route) => {
    submitted = route.request().postDataJSON() as Record<string, unknown>
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ data: { correct: true, explanation: 'A computed value.', duplicate: false } }) })
  })
  await page.goto('/knowledge/quiz/variables-concept-check')
  await page.getByLabel('8').check()
  await page.getByRole('button', { name: 'Check my understanding' }).click()
  await expect(page.getByRole('heading', { name: '1 of 1' })).toBeVisible()
  expect(submitted?.selectedOptionIds).toEqual(['eight'])
  expect(submitted).not.toHaveProperty('correct')
})
