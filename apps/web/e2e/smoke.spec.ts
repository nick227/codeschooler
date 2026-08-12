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
