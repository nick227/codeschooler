import { Link } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'

export function HomePage() {
  return (
    <AppShell>
      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow">Your first program starts here</p>
          <h1>See what your code <em>means</em> as you write it.</h1>
          <p className="hero-lede">Type real JavaScript. Run it safely. Get a clear next step when you need one.</p>
          <Link className="primary-button hero-action" to="/learn/javascript-fundamentals/getting-started/js-create-variable-004">
            Start coding <span aria-hidden="true">→</span>
          </Link>
          <p className="hero-note">No account needed · Editable code in under 30 seconds</p>
        </div>
        <div className="hero-demo" aria-label="Example showing a JavaScript variable holding a value">
          <span className="demo-label">A program, translated</span>
          <pre><span className="tok-keyword">const</span> <span className="tok-name">score</span> <span className="tok-operator">=</span> <span className="tok-number">10</span></pre>
          <div className="demo-trace">
            <span>score</span><i /><small>holds</small><i /><strong>10</strong>
          </div>
        </div>
      </section>
      <section className="pillar-row" aria-label="Ways to learn">
        <article><span>01</span><h2>Learn</h2><p>Guided lessons in a real code editor.</p></article>
        <article><span>02</span><h2>Projects</h2><p>Build useful software one milestone at a time.</p></article>
        <article><span>03</span><h2>Interview</h2><p>Practice patterns and reason through tradeoffs.</p></article>
        <article><span>04</span><h2>Knowledge</h2><p>Check what you understand, not what you memorized.</p></article>
      </section>
    </AppShell>
  )
}
