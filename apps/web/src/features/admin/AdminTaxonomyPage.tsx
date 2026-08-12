import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminCategories, useAdminTags, useAdminSkills } from '@code-trainer/sdk'
import { Brand } from '../../components/Brand'

export function AdminTaxonomyPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'tags' | 'skills'>('categories')

  const { data: categories = [], isLoading: loadingCategories } = useAdminCategories()
  const { data: tags = [], isLoading: loadingTags } = useAdminTags()
  const { data: skills = [], isLoading: loadingSkills } = useAdminSkills()

  return (
    <div className="admin-page">
      <header className="workspace-header">
        <Brand />
        <div className="workspace-context">
          <strong>Content Studio</strong>
          <small>Taxonomy & Knowledge Graph</small>
        </div>
        <div className="workspace-meta">
          <Link to="/admin/content" className="secondary-button" style={{ minHeight: '36px', padding: '0 12px', fontSize: '13px' }}>
            ← Content Library
          </Link>
        </div>
      </header>

      <main className="admin-container" style={{ maxWidth: '1100px' }}>
        <div className="admin-title-row">
          <div>
            <span className="eyebrow">Governance & Structure</span>
            <h1>Curriculum Taxonomy</h1>
            <p className="admin-subtitle">
              Manage hierarchical categories, editorial tags, and canonical skill graph definitions.
            </p>
          </div>
        </div>

        {/* Tab Toolbar */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--rule)', paddingBottom: '12px' }}>
          <button
            onClick={() => setActiveTab('categories')}
            className={`secondary-button ${activeTab === 'categories' ? 'primary-button' : ''}`}
            style={{ minHeight: '38px', padding: '0 16px', fontSize: '14px' }}
          >
            📁 Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            className={`secondary-button ${activeTab === 'tags' ? 'primary-button' : ''}`}
            style={{ minHeight: '38px', padding: '0 16px', fontSize: '14px' }}
          >
            🏷️ Editorial Tags ({tags.length})
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`secondary-button ${activeTab === 'skills' ? 'primary-button' : ''}`}
            style={{ minHeight: '38px', padding: '0 16px', fontSize: '14px' }}
          >
            🎯 Skills Graph ({skills.length})
          </button>
        </div>

        {activeTab === 'categories' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3 className="admin-card-title">Hierarchical Categories</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--slate)', fontSize: '14px' }}>
                  Defines curriculum structural hierarchy (Tracks, Sections, Topics, Collections).
                </p>
              </div>
            </div>

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
          </div>
        )}

        {activeTab === 'tags' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3 className="admin-card-title">Editorial Tags</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--slate)', fontSize: '14px' }}>
                  Flat tags for organization, search discovery, and AI filtering.
                </p>
              </div>
            </div>

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
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3 className="admin-card-title">Canonical Skills Graph</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--slate)', fontSize: '14px' }}>
                  Skills represent learner mastery nodes referenced across all Code Trainer modes.
                </p>
              </div>
            </div>

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
          </div>
        )}
      </main>
    </div>
  )
}
