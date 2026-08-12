import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  useAdminContentList,
  useAdminCategories,
  useAdminSkills,
  useAdminTags,
  useAdminGenerateContent,
  useAdminDeleteContent,
} from '@code-trainer/sdk'
import { AppShell } from '../../components/AppShell'

type StudioStageTab = 'library' | 'generator' | 'taxonomy'
type TaxonomySubTab = 'categories' | 'tags' | 'skills'

export function AdminContentListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialStage: StudioStageTab = location.pathname.includes('/generate')
    ? 'generator'
    : location.pathname.includes('/taxonomy')
    ? 'taxonomy'
    : 'library'

  const [activeStage, setActiveStage] = useState<StudioStageTab>(initialStage)
  const [taxonomyTab, setTaxonomyTab] = useState<TaxonomySubTab>('categories')


  // Search & Filter State
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  // AI Generator Form State
  const [genCategorySlug, setGenCategorySlug] = useState('')
  const [genSkillId, setGenSkillId] = useState('')
  const [genCount, setGenCount] = useState(3)
  const [genDifficulty, setGenDifficulty] = useState('beginner')
  const [genCustomPrompt, setGenCustomPrompt] = useState('')
  const [genStatusMessage, setGenStatusMessage] = useState('')
  const [generatedItems, setGeneratedItems] = useState<any[]>([])

  // SDK Data Hooks
  const { data: items = [], isLoading, refetch } = useAdminContentList({
    search: search || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
  })

  const { data: categories = [], isLoading: loadingCategories } = useAdminCategories()
  const { data: tags = [], isLoading: loadingTags } = useAdminTags()
  const { data: skills = [], isLoading: loadingSkills } = useAdminSkills()
  const generateMutation = useAdminGenerateContent()
  const deleteMutation = useAdminDeleteContent()

  const handleDeleteItem = async (itemId: string, itemTitle: string) => {
    const confirmed = window.confirm(`Are you sure you want to permanently delete "${itemTitle}"? This action cannot be undone.`)
    if (!confirmed) return
    try {
      await deleteMutation.mutateAsync(itemId)
    } catch (e: any) {
      alert(`Delete failed: ${e.message}`)
    }
  }

  const handleGenerate = async () => {
    setGenStatusMessage('Generating AI curriculum items...')
    setGeneratedItems([])
    try {
      const payload = {
        categorySlug: genCategorySlug || undefined,
        skillId: genSkillId || undefined,
        count: Number(genCount),
        difficulty: genDifficulty,
        prompt: genCustomPrompt || undefined,
      }
      const result: any = await generateMutation.mutateAsync(payload)
      const list = Array.isArray(result) ? result : []
      setGeneratedItems(list)
      setGenStatusMessage(`✓ Synthesized ${list.length} draft content items`)
      void refetch()
    } catch (e: any) {
      setGenStatusMessage(`❌ Generation failed: ${e.message}`)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'admin-badge-draft'
      case 'VALIDATED': return 'admin-badge-validated'
      case 'REVIEW': return 'admin-badge-review'
      case 'PUBLISHED': return 'admin-badge-published'
      case 'ARCHIVED': return 'admin-badge-archived'
      default: return 'admin-badge-draft'
    }
  }

  return (
    <AppShell>
      <div className="admin-page" style={{ minHeight: 'auto', background: 'transparent' }}>
        <main className="admin-container" style={{ padding: '36px 32px 60px' }}>
          {/* Studio Hero Header */}
          <div className="admin-title-row">
            <div>
              <h1>Content Studio</h1>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => void refetch()} className="secondary-button" style={{ minHeight: '40px', padding: '0 14px' }}>
                🔄 Refresh
              </button>
              <Link to="/admin/content/new" className="primary-button" style={{ minHeight: '40px', padding: '0 18px' }}>
                + New Content Item
              </Link>
            </div>
          </div>

          {/* Stage View Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--rule)', paddingBottom: '14px' }}>
            <button
              onClick={() => setActiveStage('library')}
              className={`secondary-button ${activeStage === 'library' ? 'primary-button' : ''}`}
              style={{ minHeight: '42px', padding: '0 18px', fontSize: '14px' }}
            >
              📚 Content Library ({items.length})
            </button>
            <button
              onClick={() => setActiveStage('generator')}
              className={`secondary-button ${activeStage === 'generator' ? 'primary-button' : ''}`}
              style={{ minHeight: '42px', padding: '0 18px', fontSize: '14px' }}
            >
              ✨ AI Generator
            </button>
            <button
              onClick={() => setActiveStage('taxonomy')}
              className={`secondary-button ${activeStage === 'taxonomy' ? 'primary-button' : ''}`}
              style={{ minHeight: '42px', padding: '0 18px', fontSize: '14px' }}
            >
              🏷️ Taxonomy & Skills ({categories.length} categories, {skills.length} skills)
            </button>
          </div>

          {/* Stage View 1: Content Library */}
          {activeStage === 'library' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Search & Filter Toolbar */}
              <div className="admin-toolbar">
                <input
                  type="search"
                  className="admin-input"
                  placeholder="Search content by title, slug, or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ flex: '1 1 280px' }}
                />

                <select
                  className="admin-select"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">All Content Types</option>
                  <option value="coding_challenge">Coding Challenge</option>
                  <option value="project_step">Project Milestone</option>
                  <option value="interview_problem">Interview Problem</option>
                  <option value="knowledge_question">Knowledge Question</option>
                </select>

                <select
                  className="admin-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="VALIDATED">Validated</option>
                  <option value="REVIEW">Review</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>

                <select
                  className="admin-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.slug}>
                      {c.name} ({c.kind})
                    </option>
                  ))}
                </select>
              </div>

              {/* Items Table / States */}
              {isLoading ? (
                <div className="async-state" style={{ minHeight: '220px' }}>
                  <div className="loader" />
                  <span>Loading content library...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="admin-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <h3 style={{ font: "650 22px 'Recursive', sans-serif", margin: '0 0 8px' }}>No content items found</h3>
                  <p style={{ color: 'var(--slate)', margin: '0 0 20px' }}>
                    Create a new item or switch to the AI Generator stage view to synthesize challenges.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button onClick={() => setActiveStage('generator')} className="primary-button">
                      Open AI Generator View
                    </button>
                    <Link to="/admin/content/new" className="secondary-button">
                      + Create New Item
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Title / Identifier</th>
                        <th>Type</th>
                        <th>Primary Category</th>
                        <th>Status</th>
                        <th>Revision</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((rawItem: any) => {
                        const item = rawItem as any
                        const currentRev = item.revisions?.[0]
                        const displayTitle = String(currentRev?.title || item.slug || item.id)
                        return (
                          <tr key={item.id}>
                            <td>
                              <Link
                                to={`/admin/content/${item.id}`}
                                style={{ fontWeight: 600, color: 'var(--blueprint)', fontSize: '15px' }}
                              >
                                {displayTitle}
                              </Link>
                              <div style={{ fontSize: '12px', color: 'var(--slate)', fontFamily: "'IBM Plex Mono', monospace" }}>
                                {item.id}
                              </div>
                            </td>
                            <td>
                              <span className="admin-type-chip">
                                {item.type}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '14px', color: 'var(--ink)' }}>
                                {item.primaryCategoryId || 'Uncategorized'}
                              </span>
                            </td>
                            <td>
                              <span className={`admin-badge ${getStatusBadgeClass(item.status)}`}>
                                {item.status}
                              </span>
                            </td>
                            <td>
                              <span style={{ font: "500 13px 'IBM Plex Mono', monospace", color: 'var(--slate)' }}>
                                v{currentRev?.revision || 1}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                onClick={() => handleDeleteItem(item.id, displayTitle)}
                                disabled={deleteMutation.isPending}
                                className="secondary-button"
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '12px',
                                  color: 'var(--copper)',
                                  borderColor: 'var(--copper)',
                                }}
                              >
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Stage View 2: AI Batch Generator */}
          {activeStage === 'generator' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h2 className="admin-card-title">AI Curriculum Batch Generator</h2>
                    <p style={{ margin: '4px 0 0', color: 'var(--slate)', fontSize: '14px' }}>
                      Synthesize high-quality coding challenges, test assertions, and hint ladders with full database provenance.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Target Category</label>
                    <select
                      className="admin-select"
                      value={genCategorySlug}
                      onChange={(e) => setGenCategorySlug(e.target.value)}
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
                      value={genSkillId}
                      onChange={(e) => setGenSkillId(e.target.value)}
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
                      value={genCount}
                      onChange={(e) => setGenCount(Number(e.target.value))}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Target Difficulty</label>
                    <select
                      className="admin-select"
                      value={genDifficulty}
                      onChange={(e) => setGenDifficulty(e.target.value)}
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
                    value={genCustomPrompt}
                    onChange={(e) => setGenCustomPrompt(e.target.value)}
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

              {genStatusMessage && (
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
                  {genStatusMessage}
                </div>
              )}

              {generatedItems.length > 0 && (
                <div className="admin-card">
                  <div className="admin-card-header">
                    <h2 className="admin-card-title">Synthesized Draft Items ({generatedItems.length})</h2>
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
            </div>
          )}

          {/* Stage View 3: Taxonomy & Skills */}
          {activeStage === 'taxonomy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h2 className="admin-card-title">Taxonomy & Skills Governance</h2>
                    <p style={{ margin: '4px 0 0', color: 'var(--slate)', fontSize: '14px' }}>
                      Categories, editorial tags, and canonical skill graph definitions.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setTaxonomyTab('categories')}
                      className={`secondary-button ${taxonomyTab === 'categories' ? 'primary-button' : ''}`}
                      style={{ minHeight: '34px', padding: '0 12px', fontSize: '13px' }}
                    >
                      Categories ({categories.length})
                    </button>
                    <button
                      onClick={() => setTaxonomyTab('tags')}
                      className={`secondary-button ${taxonomyTab === 'tags' ? 'primary-button' : ''}`}
                      style={{ minHeight: '34px', padding: '0 12px', fontSize: '13px' }}
                    >
                      Editorial Tags ({tags.length})
                    </button>
                    <button
                      onClick={() => setTaxonomyTab('skills')}
                      className={`secondary-button ${taxonomyTab === 'skills' ? 'primary-button' : ''}`}
                      style={{ minHeight: '34px', padding: '0 12px', fontSize: '13px' }}
                    >
                      Skills Graph ({skills.length})
                    </button>
                  </div>
                </div>

                {taxonomyTab === 'categories' && (
                  <>
                    {loadingCategories ? (
                      <div className="async-state" style={{ minHeight: '150px' }}><div className="loader" /></div>
                    ) : (
                      <div className="admin-table-container">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Slug</th>
                              <th>Category Name</th>
                              <th>Kind</th>
                              <th>Sort Order</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categories.map((c: any) => (
                              <tr key={c.id}>
                                <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: 'var(--blueprint)' }}>
                                  {c.slug}
                                </td>
                                <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{c.name}</td>
                                <td>
                                  <span className="admin-type-chip">{c.kind}</span>
                                </td>
                                <td style={{ fontFamily: "'IBM Plex Mono', monospace", color: 'var(--slate)' }}>
                                  {c.sortOrder}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

                {taxonomyTab === 'tags' && (
                  <>
                    {loadingTags ? (
                      <div className="async-state" style={{ minHeight: '150px' }}><div className="loader" /></div>
                    ) : (
                      <div className="admin-table-container">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Slug</th>
                              <th>Tag Name</th>
                              <th>Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tags.map((t: any) => (
                              <tr key={t.id}>
                                <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: 'var(--blueprint)' }}>
                                  {t.slug}
                                </td>
                                <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{t.name}</td>
                                <td style={{ color: 'var(--slate)', fontSize: '14px' }}>{t.description || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

                {taxonomyTab === 'skills' && (
                  <>
                    {loadingSkills ? (
                      <div className="async-state" style={{ minHeight: '150px' }}><div className="loader" /></div>
                    ) : (
                      <div className="admin-table-container">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Skill ID</th>
                              <th>Skill Name</th>
                              <th>Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {skills.map((s: any) => (
                              <tr key={s.id}>
                                <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: 'var(--blueprint)' }}>
                                  {s.id}
                                </td>
                                <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{s.name}</td>
                                <td style={{ color: 'var(--slate)', fontSize: '14px' }}>{s.description || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </AppShell>
  )
}
