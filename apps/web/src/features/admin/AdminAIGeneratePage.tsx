import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminCategories, useAdminSkills, useAdminGenerateContent } from '@code-trainer/sdk'
import { Brand } from '../../components/Brand'

export function AdminAIGeneratePage() {
  const navigate = useNavigate()
  const { data: categories = [] } = useAdminCategories()
  const { data: skills = [] } = useAdminSkills()
  const generateMutation = useAdminGenerateContent()

  const [categorySlug, setCategorySlug] = useState('')
  const [skillId, setSkillId] = useState('')
  const [count, setCount] = useState(3)
  const [difficulty, setDifficulty] = useState('beginner')
  const [customPrompt, setCustomPrompt] = useState('')

  const [statusMessage, setStatusMessage] = useState('')
  const [generatedItems, setGeneratedItems] = useState<any[]>([])

  const handleGenerate = async () => {
    setStatusMessage('Generating AI curriculum items...')
    setGeneratedItems([])
    try {
      const payload = {
        categorySlug: categorySlug || undefined,
        skillId: skillId || undefined,
        count: Number(count),
        difficulty,
        prompt: customPrompt || undefined,
      }
      const items: any = await generateMutation.mutateAsync(payload)
      setGeneratedItems(Array.isArray(items) ? items : [])
      setStatusMessage(`✓ Generated ${items.length || 0} draft content items`)
    } catch (e: any) {
      setStatusMessage(`❌ Generation failed: ${e.message}`)
    }
  }

  return (
    <div className="admin-page">
      <header className="workspace-header">
        <Brand />
        <div className="workspace-context">
          <strong>Content Studio</strong>
          <small>AI Batch Curriculum Generator</small>
        </div>
        <div className="workspace-meta">
          <Link to="/admin/content" className="secondary-button" style={{ minHeight: '36px', padding: '0 12px', fontSize: '13px' }}>
            ← Content Library
          </Link>
        </div>
      </header>

      <main className="admin-container" style={{ maxWidth: '1000px' }}>
        <div className="admin-title-row">
          <div>
            <span className="eyebrow">Automated Synthesis</span>
            <h1>AI Curriculum Generator</h1>
            <p className="admin-subtitle">
              Synthesize high-quality coding challenges and validation checks with full database provenance tracking.
            </p>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Generation Parameters</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Target Category</label>
              <select
                className="admin-select"
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
              >
                <option value="">-- All Categories --</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.slug}>
                    {c.name} ({c.kind})
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Focus Skill Domain</label>
              <select
                className="admin-select"
                value={skillId}
                onChange={(e) => setSkillId(e.target.value)}
              >
                <option value="">-- All Skills --</option>
                {skills.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Batch Item Count</label>
              <input
                type="number"
                min={1}
                max={10}
                className="admin-input"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Target Difficulty</label>
              <select
                className="admin-select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="admin-form-group" style={{ marginBottom: '20px' }}>
            <label className="admin-form-label">Custom Guidance Prompt (Optional)</label>
            <textarea
              rows={3}
              className="admin-textarea"
              placeholder="e.g. Focus on ES6 template literals and string concatenation examples..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="primary-button"
            style={{ width: '100%' }}
          >
            {generateMutation.isPending ? '✨ Synthesizing Challenges...' : '✨ Generate Batch Items'}
          </button>
        </div>

        {statusMessage && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: generateMutation.isPending ? 'var(--soft-blue)' : 'var(--soft-green)',
              color: generateMutation.isPending ? 'var(--blueprint)' : 'var(--spruce)',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            {statusMessage}
          </div>
        )}

        {generatedItems.length > 0 && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Generated Draft Items ({generatedItems.length})</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {generatedItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid var(--rule)',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--ink)' }}>
                      {item.revisions?.[0]?.title || item.slug}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--slate)', fontFamily: "'IBM Plex Mono', monospace" }}>
                      {item.id} • {item.type}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/admin/content/${item.id}`)}
                    className="secondary-button"
                    style={{ minHeight: '34px', padding: '0 12px', fontSize: '13px' }}
                  >
                    Open in Editor ➔
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
