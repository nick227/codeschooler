import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  useAdminContentItem,
  useAdminCreateContent,
  useAdminUpdateContent,
  useAdminValidateContent,
  useAdminPublishContent,
  useAdminDeleteContent,
  useAdminCategories,
  useAdminSkills,
} from '@code-trainer/sdk'
import type { PublicChallenge } from '../workspace/workspace.types'
import { ChallengeWorkspace } from '../workspace/ChallengeWorkspace'
import { AppShell } from '../../components/AppShell'

export function AdminContentEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()

  const { data: item, isLoading } = useAdminContentItem(isNew ? undefined : id)
  const { data: categories = [] } = useAdminCategories()
  const { data: skills = [] } = useAdminSkills()

  const createMutation = useAdminCreateContent()
  const updateMutation = useAdminUpdateContent()
  const validateMutation = useAdminValidateContent()
  const publishMutation = useAdminPublishContent()
  const deleteMutation = useAdminDeleteContent()

  // Form State
  const [title, setTitle] = useState('')
  const [type, setType] = useState('coding_challenge')
  const [instruction, setInstruction] = useState('')
  const [starterCode, setStarterCode] = useState('')
  const [solution, setSolution] = useState('')
  const [difficulty, setDifficulty] = useState('beginner')
  const [primaryCategory, setPrimaryCategory] = useState('')
  const [checksJson, setChecksJson] = useState('[\n  { "type": "variableExists", "name": "x" }\n]')
  const [hintsJson, setHintsJson] = useState('[\n  { "level": 1, "text": "Declare variable x." }\n]')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [validationReport, setValidationReport] = useState<any>(null)
  const [statusMessage, setStatusMessage] = useState('')

  // Initial State Tracking for Dirty Checking
  const [initialForm, setInitialForm] = useState<any>(null)

  useEffect(() => {
    if (item && !isNew) {
      const it = item as any
      const rev = it.revisions?.[0]
      const initTitle = String(rev?.title || it.slug || '')
      const initType = String(it.type || 'coding_challenge')
      const initInstruction = String(rev?.instruction || '')
      const initStarterCode = String(rev?.starterCode || '')
      const initSolution = String(rev?.solution || '')
      const initDifficulty = String(rev?.difficulty || 'beginner')
      const initPrimaryCategory = String(it.primaryCategoryId || '')
      const initSkills = Array.isArray(it.skills) ? it.skills : []

      const cfg = rev?.config
      const initChecksJson = cfg?.checks ? JSON.stringify(cfg.checks, null, 2) : '[\n  { "type": "variableExists", "name": "x" }\n]'
      const initHintsJson = cfg?.hints ? JSON.stringify(cfg.hints, null, 2) : '[\n  { "level": 1, "text": "Declare variable x." }\n]'

      setTitle(initTitle)
      setType(initType)
      setInstruction(initInstruction)
      setStarterCode(initStarterCode)
      setSolution(initSolution)
      setDifficulty(initDifficulty)
      setPrimaryCategory(initPrimaryCategory)
      setSelectedSkills(initSkills)
      setChecksJson(initChecksJson)
      setHintsJson(initHintsJson)

      setInitialForm({
        title: initTitle,
        type: initType,
        instruction: initInstruction,
        starterCode: initStarterCode,
        solution: initSolution,
        difficulty: initDifficulty,
        primaryCategory: initPrimaryCategory,
        selectedSkills: [...initSkills].sort(),
        checksJson: initChecksJson,
        hintsJson: initHintsJson,
      })
    } else if (isNew) {
      setInitialForm({
        title: '',
        type: 'coding_challenge',
        instruction: '',
        starterCode: '',
        solution: '',
        difficulty: 'beginner',
        primaryCategory: '',
        selectedSkills: [],
        checksJson: '[\n  { "type": "variableExists", "name": "x" }\n]',
        hintsJson: '[\n  { "level": 1, "text": "Declare variable x." }\n]',
      })
    }
  }, [item, isNew])

  const hasChanges = Boolean(
    initialForm &&
      (title !== initialForm.title ||
        type !== initialForm.type ||
        instruction !== initialForm.instruction ||
        starterCode !== initialForm.starterCode ||
        solution !== initialForm.solution ||
        difficulty !== initialForm.difficulty ||
        primaryCategory !== initialForm.primaryCategory ||
        checksJson !== initialForm.checksJson ||
        hintsJson !== initialForm.hintsJson ||
        JSON.stringify([...selectedSkills].sort()) !== JSON.stringify(initialForm.selectedSkills))
  )

  const isPublished = (item as any)?.status === 'PUBLISHED'

  // Parse checks for live ChallengeWorkspace preview
  let parsedChecks = []
  try {
    parsedChecks = JSON.parse(checksJson)
  } catch {
    parsedChecks = []
  }

  let _parsedHints = []
  try {
    _parsedHints = JSON.parse(hintsJson)
  } catch {
    _parsedHints = []
  }

  const it = item as any
  const liveChallenge: PublicChallenge = {
    id: id || 'draft-preview',
    revision: Number(it?.revisions?.[0]?.revision || 1),
    language: 'javascript',
    title: title || 'Untitled Challenge',
    instruction: instruction || 'Enter challenge instructions on the left panel to test execution live.',
    starterCode: starterCode || '// Starter code\n',
    skills: selectedSkills,
    guidance: 'guided',
    checks: Array.isArray(parsedChecks) ? parsedChecks : [],
    reward: { xp: 15 },
    requiresRun: true,
  }

  const handleSave = async () => {
    setStatusMessage('')
    let checksObj = []
    let hintsObj = []
    try {
      checksObj = JSON.parse(checksJson)
    } catch {
      setStatusMessage('⚠️ Invalid Evaluator Checks JSON')
      return
    }
    try {
      hintsObj = JSON.parse(hintsJson)
    } catch {
      setStatusMessage('⚠️ Invalid Hints JSON')
      return
    }

    const payload = {
      slug: isNew ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined,
      type,
      title,
      instruction,
      starterCode,
      solution,
      difficulty,
      primaryCategoryId: primaryCategory || undefined,
      skills: selectedSkills,
      config: {
        checks: checksObj,
        hints: hintsObj,
        reward: { xp: 15 },
      },
    }

    if (isNew) {
      const res: any = await createMutation.mutateAsync(payload)
      if (res?.id) {
        navigate(`/admin/content/${res.id}`)
      }
    } else if (id) {
      await updateMutation.mutateAsync({ id, data: payload })
      setInitialForm({
        title,
        type,
        instruction,
        starterCode,
        solution,
        difficulty,
        primaryCategory,
        selectedSkills: [...selectedSkills].sort(),
        checksJson,
        hintsJson,
      })
      setStatusMessage('✓ Changes saved successfully')
    }
  }

  const handleValidate = async () => {
    if (!id || isNew) return
    setStatusMessage('Validating solution...')
    try {
      const report = await validateMutation.mutateAsync(id)
      setValidationReport(report)
      setStatusMessage('✓ Validation complete')
    } catch (e: any) {
      setStatusMessage(`❌ Validation failed: ${e.message}`)
    }
  }

  const handleTogglePublish = async () => {
    if (!id || isNew) return
    if (isPublished) {
      setStatusMessage('Moving to draft...')
      try {
        await updateMutation.mutateAsync({ id, data: { status: 'DRAFT' } })
        setStatusMessage('✓ Challenge status updated to Draft')
      } catch (e: any) {
        setStatusMessage(`❌ Failed to revert to draft: ${e.message}`)
      }
    } else {
      setStatusMessage('Publishing...')
      try {
        await publishMutation.mutateAsync(id)
        setStatusMessage('🎉 Content revision published to live learners!')
      } catch (e: any) {
        setStatusMessage(`❌ Publish failed: ${e.message}`)
      }
    }
  }

  const handleDelete = async () => {
    if (!id || isNew) return
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${title || id}"? This action cannot be undone.`
    )
    if (!confirmed) return
    setStatusMessage('Deleting content...')
    try {
      await deleteMutation.mutateAsync(id)
      navigate('/admin/content')
    } catch (e: any) {
      setStatusMessage(`❌ Delete failed: ${e.message}`)
    }
  }

  const toggleSkill = (skId: string) => {
    if (selectedSkills.includes(skId)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skId))
    } else {
      setSelectedSkills([...selectedSkills, skId])
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="async-state" style={{ minHeight: '300px' }}>
          <div className="loader" />
          <span>Loading content item...</span>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="admin-page" style={{ minHeight: 'auto', background: 'transparent' }}>
        <main className="admin-container" style={{ padding: '24px 32px 60px', maxWidth: '1600px' }}>
          {/* Header Action Bar inside Stage */}
          <div className="admin-title-row">
            <div>
              <Link to="/admin/content" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--blueprint)' }}>
                ← Back to Content Studio
              </Link>
              <h1 style={{ font: "650 26px 'Recursive', sans-serif", margin: '4px 0 0' }}>
                {isNew ? 'New Content Item' : title || id}
              </h1>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {!isNew && (
                <>
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="secondary-button"
                    style={{
                      minHeight: '38px',
                      padding: '0 14px',
                      fontSize: '13px',
                      color: 'var(--copper)',
                      borderColor: 'var(--copper)',
                    }}
                  >
                    🗑️ Delete
                  </button>
                  <button
                    onClick={handleValidate}
                    disabled={validateMutation.isPending}
                    className="secondary-button"
                    style={{ minHeight: '38px', padding: '0 14px', fontSize: '13px' }}
                  >
                    🧪 Validate Solution
                  </button>
                  <button
                    onClick={handleTogglePublish}
                    disabled={publishMutation.isPending || updateMutation.isPending}
                    className="primary-button"
                    style={{
                      minHeight: '38px',
                      padding: '0 16px',
                      fontSize: '13px',
                      background: isPublished ? 'var(--charcoal)' : 'var(--spruce)',
                    }}
                  >
                    {isPublished ? '📝 Move to Draft' : '🚀 Publish'}
                  </button>
                </>
              )}
              <button
                onClick={handleSave}
                disabled={!hasChanges || createMutation.isPending || updateMutation.isPending}
                className="primary-button"
                style={{
                  minHeight: '38px',
                  padding: '0 18px',
                  fontSize: '14px',
                  opacity: !hasChanges ? 0.5 : 1,
                  cursor: !hasChanges ? 'not-allowed' : 'pointer',
                }}
              >
                💾 Save Changes
              </button>
            </div>
          </div>

          {statusMessage && (
            <div
              style={{
                background: 'var(--soft-blue)',
                color: 'var(--blueprint)',
                padding: '12px 18px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{statusMessage}</span>
              <button onClick={() => setStatusMessage('')} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontWeight: 700 }}>
                ✕
              </button>
            </div>
          )}

          {/* Split-Screen Editor Stage */}
          <div className="admin-editor-layout">
            {/* Form Left Panel */}
            <div className="admin-editor-form">
              <div>
                <span className="eyebrow">Item Configuration</span>
                <h2 style={{ font: "650 20px 'Recursive', sans-serif", margin: '4px 0 0' }}>
                  {isNew ? 'Create New Item' : 'Edit Content Details'}
                </h2>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Title</label>
                <input
                  type="text"
                  className="admin-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Declare a Variable in JavaScript"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Content Type</label>
                  <select className="admin-select" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="coding_challenge">Coding Challenge</option>
                    <option value="project_step">Project Milestone</option>
                    <option value="interview_problem">Interview Problem</option>
                    <option value="knowledge_question">Knowledge Question</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Difficulty</label>
                  <select className="admin-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Primary Category</label>
                <select className="admin-select" value={primaryCategory} onChange={(e) => setPrimaryCategory(e.target.value)}>
                  <option value="">-- Select Primary Category --</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.slug}>
                      {c.name} ({c.kind})
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Instruction / Learner Goal</label>
                <textarea
                  rows={3}
                  className="admin-textarea"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="Describe what the learner needs to write or fix..."
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Starter Code</label>
                <textarea
                  rows={4}
                  className="admin-textarea code-font"
                  value={starterCode}
                  onChange={(e) => setStarterCode(e.target.value)}
                  placeholder="// Starter code presented in the editor"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Reference Solution</label>
                <textarea
                  rows={4}
                  className="admin-textarea code-font"
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="// Complete working solution"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Evaluator Checks (JSON)</label>
                <textarea
                  rows={5}
                  className="admin-textarea code-font"
                  value={checksJson}
                  onChange={(e) => setChecksJson(e.target.value)}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Authored Hints Ladder (JSON)</label>
                <textarea
                  rows={4}
                  className="admin-textarea code-font"
                  value={hintsJson}
                  onChange={(e) => setHintsJson(e.target.value)}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Demonstrated Skills</label>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    maxHeight: '140px',
                    overflowY: 'auto',
                    padding: '10px',
                    border: '1px solid #bfc8cc',
                    borderRadius: '8px',
                    background: 'white',
                  }}
                >
                  {skills.map((sk: any) => {
                    const isSelected = selectedSkills.includes(sk.id)
                    return (
                      <button
                        key={sk.id}
                        type="button"
                        onClick={() => toggleSkill(sk.id)}
                        className={`skill-tag ${isSelected ? 'active' : ''}`}
                        style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {sk.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Validation Report Card */}
              {validationReport && (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: validationReport.passed ? 'var(--soft-green)' : 'var(--soft-copper)',
                    border: `1px solid ${validationReport.passed ? 'var(--spruce)' : 'var(--copper)'}`,
                  }}
                >
                  <div style={{ fontWeight: 700, color: validationReport.passed ? 'var(--spruce)' : 'var(--copper)', marginBottom: '8px' }}>
                    {validationReport.passed ? '✓ Validation Passed' : '❌ Validation Issues Found'}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: 1.5 }}>
                    {validationReport.checks?.map((c: any, i: number) => (
                      <li key={i} style={{ color: c.status === 'pass' ? 'var(--spruce)' : c.status === 'fail' ? 'var(--copper)' : 'var(--slate)' }}>
                        <strong>[{c.status.toUpperCase()}]</strong> {c.name}: {c.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Real ChallengeWorkspace Right Preview */}
            <div className="admin-editor-preview">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--rule)' }}>
                <div>
                  <span className="eyebrow">Real-Time Simulation</span>
                  <h3 style={{ font: "650 16px 'Recursive', sans-serif", margin: '2px 0 0', color: 'var(--ink)' }}>
                    Interactive Code Trainer Preview
                  </h3>
                </div>
                <span className="status-badge status-guest">Live Engine</span>
              </div>

              <div style={{ flex: 1, minHeight: 0, borderRadius: '8px', border: '1px solid var(--rule)' }}>
                <ChallengeWorkspace challenge={liveChallenge as any} trackId="admin" sectionId="preview" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  )
}
