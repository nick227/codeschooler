import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  useAdminContentList,
  useAdminCategories,
  useAdminSkills,
  useAdminTags,
  useAdminGenerateContent,
  useAdminDeleteContent,
  useAdminCreateCategory,
  useAdminCreateTag,
  useAdminCreateSkill,
} from '@code-trainer/sdk'
import { AppShell } from '../../components/AppShell'

type StudioWorkspace = 'library' | 'generator' | 'taxonomy'
type TaxonomySubTab = 'categories' | 'tags' | 'skills'

const WORKSPACES: { id: StudioWorkspace; path: string; icon: string; label: string; blurb: string }[] = [
  { id: 'library', path: '/admin/content', icon: '📚', label: 'Content Library', blurb: 'Browse, filter, and edit every content item' },
  { id: 'generator', path: '/admin/content/generate', icon: '✨', label: 'AI Generator', blurb: 'Draft new items with AI, then review them' },
  { id: 'taxonomy', path: '/admin/taxonomy', icon: '🗂️', label: 'Taxonomy & Skills', blurb: 'Manage categories, tags, and skills' },
]

export function AdminContentListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialWorkspace: StudioWorkspace = location.pathname.includes('/generate')
    ? 'generator'
    : location.pathname.includes('/taxonomy')
    ? 'taxonomy'
    : 'library'

  const [workspace, setWorkspace] = useState<StudioWorkspace>(initialWorkspace)
  const [taxonomyTab, setTaxonomyTab] = useState<TaxonomySubTab>('categories')

  function goToWorkspace(next: StudioWorkspace, path: string) {
    setWorkspace(next)
    navigate(path, { replace: true })
  }

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

  // Taxonomy "add new" form state
  const [newCategorySlug, setNewCategorySlug] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryKind, setNewCategoryKind] = useState('section')
  const [newCategorySortOrder, setNewCategorySortOrder] = useState('0')
  const [newTagSlug, setNewTagSlug] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [newTagDescription, setNewTagDescription] = useState('')
  const [newSkillId, setNewSkillId] = useState('')
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillDescription, setNewSkillDescription] = useState('')
  const [taxonomyStatusMessage, setTaxonomyStatusMessage] = useState('')

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
  const createCategoryMutation = useAdminCreateCategory()
  const createTagMutation = useAdminCreateTag()
  const createSkillMutation = useAdminCreateSkill()

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
      setGenStatusMessage(`✓ Synthesized ${list.length} draft item${list.length === 1 ? '' : 's'} — review and publish each from the Library.`)
      void refetch()
    } catch (e: any) {
      setGenStatusMessage(`❌ Generation failed: ${e.message}`)
    }
  }

  const handleCreateCategory = async (e: FormEvent) => {
    e.preventDefault()
    if (!newCategorySlug.trim() || !newCategoryName.trim()) return
    setTaxonomyStatusMessage('')
    try {
      await createCategoryMutation.mutateAsync({
        slug: newCategorySlug.trim(),
        name: newCategoryName.trim(),
        kind: newCategoryKind,
        sortOrder: Number(newCategorySortOrder) || 0,
      })
      setNewCategorySlug('')
      setNewCategoryName('')
      setNewCategorySortOrder('0')
      setTaxonomyStatusMessage(`✓ Added category "${newCategoryName.trim()}"`)
    } catch (err: any) {
      setTaxonomyStatusMessage(`❌ Could not add category: ${err.message}`)
    }
  }

  const handleCreateTag = async (e: FormEvent) => {
    e.preventDefault()
    if (!newTagSlug.trim() || !newTagName.trim()) return
    setTaxonomyStatusMessage('')
    try {
      await createTagMutation.mutateAsync({
        slug: newTagSlug.trim(),
        name: newTagName.trim(),
        description: newTagDescription.trim() || undefined,
      })
      setNewTagSlug('')
      setNewTagName('')
      setNewTagDescription('')
      setTaxonomyStatusMessage(`✓ Added tag "${newTagName.trim()}"`)
    } catch (err: any) {
      setTaxonomyStatusMessage(`❌ Could not add tag: ${err.message}`)
    }
  }

  const handleCreateSkill = async (e: FormEvent) => {
    e.preventDefault()
    if (!newSkillId.trim() || !newSkillName.trim()) return
    setTaxonomyStatusMessage('')
    try {
      await createSkillMutation.mutateAsync({
        id: newSkillId.trim(),
        name: newSkillName.trim(),
        description: newSkillDescription.trim(),
      })
      setNewSkillId('')
      setNewSkillName('')
      setNewSkillDescription('')
      setTaxonomyStatusMessage(`✓ Added skill "${newSkillName.trim()}"`)
    } catch (err: any) {
      setTaxonomyStatusMessage(`❌ Could not add skill: ${err.message}`)
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

  const activeWorkspace = WORKSPACES.find((w) => w.id === workspace) ?? WORKSPACES[0]!

  return (
    <AppShell>
      <div className="catalog-page admin-studio">
        <header className="catalog-heading">
          <p className="eyebrow">Admin · Curriculum</p>
          <h1>Content Studio</h1>
          <p className="admin-studio-intro">
            Content Studio is where curriculum content is authored, generated, and organized before it reaches
            learners. Write items by hand or draft them with AI, then organize them with categories, tags, and
            skills. Nothing here is visible to learners until you publish it.
          </p>
          <div className="admin-studio-actions">
            <button onClick={() => void refetch()} className="secondary-button" style={{ minHeight: '40px', padding: '0 14px' }}>
              🔄 Refresh
            </button>
            <Link to="/admin/content/new" className="primary-button" style={{ minHeight: '40px', padding: '0 18px' }}>
              + New Content Item
            </Link>
          </div>
        </header>

        <section className="lesson-map admin-studio-layout" aria-labelledby="studio-workspace-title">
          <div className="section-intro">
            <span className="section-index">Studio</span>
            <h2 id="studio-workspace-title">{activeWorkspace.label}</h2>
            <p>{activeWorkspace.blurb}.</p>

            <nav className="catalog-section-nav admin-studio-nav" aria-label="Content Studio workspaces">
              <p className="catalog-filter-label">Workspaces</p>
              <ul>
                {WORKSPACES.map((w) => (
                  <li key={w.id}>
                    <button
                      type="button"
                      onClick={() => goToWorkspace(w.id, w.path)}
                      className={`catalog-section-link${workspace === w.id ? ' is-active' : ''}`}
                      aria-current={workspace === w.id ? 'page' : undefined}
                    >
                      <span className="section-num" aria-hidden="true">{w.icon}</span>
                      <span className="section-name">
                        <strong>{w.label}</strong>
                        <small>{w.blurb}</small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="admin-studio-side-note">
              <strong>Status flow:</strong> Draft → Validated → Review → Published. Learners only ever see
              Published revisions.
            </div>
          </div>

          <div className="catalog-main">
            {/* Workspace: Content Library */}
            {workspace === 'library' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="admin-toolbar">
                  <input
                    type="search"
                    className="admin-input"
                    placeholder="Search content by title, slug, or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ flex: '1 1 280px' }}
                  />

                  <select className="admin-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="">All Content Types</option>
                    <option value="coding_challenge">Coding Challenge</option>
                    <option value="project_step">Project Milestone</option>
                    <option value="interview_problem">Interview Problem</option>
                    <option value="knowledge_question">Knowledge Question</option>
                  </select>

                  <select className="admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="VALIDATED">Validated</option>
                    <option value="REVIEW">Review</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>

                  <select className="admin-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="">All Categories</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.slug}>
                        {c.name} ({c.kind})
                      </option>
                    ))}
                  </select>
                </div>

                {isLoading ? (
                  <div className="async-state" style={{ minHeight: '220px' }}>
                    <div className="loader" />
                    <span>Loading content library...</span>
                  </div>
                ) : items.length === 0 ? (
                  <div className="admin-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <h3 style={{ font: "650 22px 'Recursive', sans-serif", margin: '0 0 8px' }}>No content items found</h3>
                    <p style={{ color: 'var(--slate)', margin: '0 0 20px' }}>
                      Create a new item by hand, or switch to the AI Generator to synthesize a first batch of drafts.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      <button onClick={() => goToWorkspace('generator', '/admin/content/generate')} className="primary-button">
                        Open AI Generator
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
                                <span className="admin-type-chip">{item.type}</span>
                              </td>
                              <td>
                                <span style={{ fontSize: '14px', color: 'var(--ink)' }}>
                                  {item.primaryCategoryId || 'Uncategorized'}
                                </span>
                              </td>
                              <td>
                                <span className={`admin-badge ${getStatusBadgeClass(item.status)}`}>{item.status}</span>
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
                                  style={{ padding: '4px 10px', fontSize: '12px', color: 'var(--copper)', borderColor: 'var(--copper)' }}
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

            {/* Workspace: AI Generator */}
            {workspace === 'generator' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="admin-card">
                  <div className="admin-card-header">
                    <div>
                      <h2 className="admin-card-title">Generate draft challenges</h2>
                      <p style={{ margin: '4px 0 0', color: 'var(--slate)', fontSize: '14px' }}>
                        Point the AI at a focus area, pick a difficulty, and it drafts working challenges — starter
                        code, checks, and hints included. Every draft lands in the Library as <strong>DRAFT</strong>{' '}
                        for you to review, edit, and publish; nothing is generated straight to learners.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Focus Category</label>
                      <select className="admin-select" value={genCategorySlug} onChange={(e) => setGenCategorySlug(e.target.value)}>
                        <option value="">-- Any category --</option>
                        {categories.map((c: any) => (
                          <option key={c.id} value={c.slug}>
                            {c.name} ({c.kind})
                          </option>
                        ))}
                      </select>
                      <p className="admin-form-help">Leave blank to let the AI draw from the whole curriculum.</p>
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">Focus Skill</label>
                      <select className="admin-select" value={genSkillId} onChange={(e) => setGenSkillId(e.target.value)}>
                        <option value="">-- Any skill --</option>
                        {skills.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <p className="admin-form-help">Optional — narrows generation to one mastery skill.</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Difficulty</label>
                      <select className="admin-select" value={genDifficulty} onChange={(e) => setGenDifficulty(e.target.value)}>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">How many items</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        className="admin-input"
                        value={genCount}
                        onChange={(e) => setGenCount(Number(e.target.value))}
                      />
                      <p className="admin-form-help">Up to 10 per batch.</p>
                    </div>
                  </div>

                  <div className="admin-form-group" style={{ marginBottom: '20px' }}>
                    <label className="admin-form-label">Extra guidance (optional)</label>
                    <textarea
                      rows={3}
                      className="admin-textarea"
                      placeholder="e.g. Focus on ES6 template literals and string concatenation examples..."
                      value={genCustomPrompt}
                      onChange={(e) => setGenCustomPrompt(e.target.value)}
                    />
                  </div>

                  <button onClick={handleGenerate} disabled={generateMutation.isPending} className="primary-button" style={{ width: '100%' }}>
                    {generateMutation.isPending ? '✨ Synthesizing…' : '✨ Generate Batch'}
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
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Draft</th>
                          <th>Type</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generatedItems.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--ink)' }}>
                                {item.revisions?.[0]?.title || item.slug}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--slate)', fontFamily: "'IBM Plex Mono', monospace" }}>
                                {item.id}
                              </div>
                            </td>
                            <td>
                              <span className="admin-type-chip">{item.type}</span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button onClick={() => navigate(`/admin/content/${item.id}`)} className="secondary-button" style={{ minHeight: '34px', padding: '0 12px', fontSize: '13px' }}>
                                Open in Editor ➔
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Workspace: Taxonomy & Skills */}
            {workspace === 'taxonomy' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="admin-card">
                  <div className="admin-card-header">
                    <div>
                      <h2 className="admin-card-title">Taxonomy & Skills</h2>
                      <p style={{ margin: '4px 0 0', color: 'var(--slate)', fontSize: '14px' }}>
                        <strong>Categories</strong> place content in the curriculum tree (pillar → track → section →
                        topic). <strong>Tags</strong> are flat labels used for search and AI filtering.{' '}
                        <strong>Skills</strong> are the mastery nodes learner progress is tracked against — content
                        items reference them directly.
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
                        Tags ({tags.length})
                      </button>
                      <button
                        onClick={() => setTaxonomyTab('skills')}
                        className={`secondary-button ${taxonomyTab === 'skills' ? 'primary-button' : ''}`}
                        style={{ minHeight: '34px', padding: '0 12px', fontSize: '13px' }}
                      >
                        Skills ({skills.length})
                      </button>
                    </div>
                  </div>

                  {taxonomyStatusMessage && (
                    <div
                      style={{
                        marginBottom: '16px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: taxonomyStatusMessage.startsWith('❌') ? 'var(--soft-copper)' : 'var(--soft-green)',
                        color: taxonomyStatusMessage.startsWith('❌') ? 'var(--copper)' : 'var(--spruce)',
                        fontWeight: 600,
                        fontSize: '13px',
                      }}
                    >
                      {taxonomyStatusMessage}
                    </div>
                  )}

                  {taxonomyTab === 'categories' && (
                    <>
                      <form className="admin-inline-form" onSubmit={handleCreateCategory}>
                        <div className="admin-form-group">
                          <label className="admin-form-label">Slug</label>
                          <input className="admin-input" placeholder="e.g. arrays-basics" value={newCategorySlug} onChange={(e) => setNewCategorySlug(e.target.value)} required />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-form-label">Name</label>
                          <input className="admin-input" placeholder="e.g. Arrays Basics" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} required />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-form-label">Kind</label>
                          <select className="admin-select" value={newCategoryKind} onChange={(e) => setNewCategoryKind(e.target.value)}>
                            <option value="pillar">Pillar</option>
                            <option value="track">Track</option>
                            <option value="section">Section</option>
                            <option value="topic">Topic</option>
                            <option value="collection">Collection</option>
                          </select>
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-form-label">Sort Order</label>
                          <input type="number" className="admin-input" value={newCategorySortOrder} onChange={(e) => setNewCategorySortOrder(e.target.value)} />
                        </div>
                        <button type="submit" className="primary-button" disabled={createCategoryMutation.isPending}>
                          + Add Category
                        </button>
                      </form>

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
                                  <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: 'var(--blueprint)' }}>{c.slug}</td>
                                  <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{c.name}</td>
                                  <td><span className="admin-type-chip">{c.kind}</span></td>
                                  <td style={{ fontFamily: "'IBM Plex Mono', monospace", color: 'var(--slate)' }}>{c.sortOrder}</td>
                                </tr>
                              ))}
                              {categories.length === 0 && (
                                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--slate)', padding: '24px' }}>No categories yet — add the first one above.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}

                  {taxonomyTab === 'tags' && (
                    <>
                      <form className="admin-inline-form" onSubmit={handleCreateTag}>
                        <div className="admin-form-group">
                          <label className="admin-form-label">Slug</label>
                          <input className="admin-input" placeholder="e.g. es6" value={newTagSlug} onChange={(e) => setNewTagSlug(e.target.value)} required />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-form-label">Name</label>
                          <input className="admin-input" placeholder="e.g. ES6" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} required />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-form-label">Description (optional)</label>
                          <input className="admin-input" placeholder="Short description" value={newTagDescription} onChange={(e) => setNewTagDescription(e.target.value)} />
                        </div>
                        <button type="submit" className="primary-button" disabled={createTagMutation.isPending}>
                          + Add Tag
                        </button>
                      </form>

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
                                  <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: 'var(--blueprint)' }}>{t.slug}</td>
                                  <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{t.name}</td>
                                  <td style={{ color: 'var(--slate)', fontSize: '14px' }}>{t.description || '—'}</td>
                                </tr>
                              ))}
                              {tags.length === 0 && (
                                <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--slate)', padding: '24px' }}>No tags yet — add the first one above.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}

                  {taxonomyTab === 'skills' && (
                    <>
                      <form className="admin-inline-form" onSubmit={handleCreateSkill}>
                        <div className="admin-form-group">
                          <label className="admin-form-label">Skill ID</label>
                          <input className="admin-input" placeholder="e.g. arrays.push" value={newSkillId} onChange={(e) => setNewSkillId(e.target.value)} required />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-form-label">Name</label>
                          <input className="admin-input" placeholder="e.g. Array.push()" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} required />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-form-label">Description</label>
                          <input className="admin-input" placeholder="What mastering this skill means" value={newSkillDescription} onChange={(e) => setNewSkillDescription(e.target.value)} required />
                        </div>
                        <button type="submit" className="primary-button" disabled={createSkillMutation.isPending}>
                          + Add Skill
                        </button>
                      </form>

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
                                  <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: 'var(--blueprint)' }}>{s.id}</td>
                                  <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{s.name}</td>
                                  <td style={{ color: 'var(--slate)', fontSize: '14px' }}>{s.description || '—'}</td>
                                </tr>
                              ))}
                              {skills.length === 0 && (
                                <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--slate)', padding: '24px' }}>No skills yet — add the first one above.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
