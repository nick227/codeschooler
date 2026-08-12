import { describe, expect, it } from 'vitest'
import { buildDomSandboxDocument } from '../domRunner'

describe('DOM sandbox document', () => {
  it('defaults to a restrictive CSP and safely embeds learner source', () => {
    const html = buildDomSandboxDocument('</script><script>parent.hacked=true</script>', {
      network: false, storage: false, timers: false, dom: true,
    }, 1024, 'token')

    expect(html).toContain("default-src 'none'")
    expect(html).toContain("script-src 'unsafe-inline' 'unsafe-eval'")
    expect(html).toContain("connect-src 'none'")
    expect(html).toContain("object-src 'none'")
    expect(html).not.toContain('</script><script>parent.hacked')
    expect(html).toContain('\\u003c/script\\u003e')
  })

  it('only places authored network origins in connect-src', () => {
    const html = buildDomSandboxDocument('', {
      network: ['https://api.example.test'], storage: 'local', timers: true, dom: true,
    }, 1024, 'token')
    expect(html).toContain('connect-src https://api.example.test')
  })
})
