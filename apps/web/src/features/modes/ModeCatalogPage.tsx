import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { ErrorState, LoadingState } from '../../components/AsyncState'
import { ChallengeWorkspace } from '../workspace/ChallengeWorkspace'
import type { PublicChallenge } from '../workspace/workspace.types'

type Mode = 'project' | 'interview' | 'knowledge'
interface ModeProjection { mode: Mode; title: string; description: string; items: Array<{ id: string; title: string; summary: string; challengeId?: string }> }
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export function ModeCatalogPage({ mode }: { mode: Mode }) {
  const catalog = useQuery({
    queryKey: ['mode', mode],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/modes/${mode === 'project' ? 'projects' : mode}`)
      if (!response.ok) throw new Error('Mode catalog unavailable')
      return (await response.json() as { data: ModeProjection }).data
    },
  })
  if (catalog.isLoading) return <AppShell><div className="catalog-page"><LoadingState label={`Loading ${mode}…`} /></div></AppShell>
  if (!catalog.data) return <AppShell><div className="catalog-page"><ErrorState message={`The ${mode} catalog could not be loaded.`} retry={() => void catalog.refetch()} /></div></AppShell>
  const routeBase = mode === 'project' ? 'projects' : mode
  return <AppShell><div className="catalog-page mode-catalog">
    <header className="catalog-heading"><p className="eyebrow">One engine · a different learning mode</p><h1>{catalog.data.title}</h1><p>{catalog.data.description}</p></header>
    <ol className="mode-item-list">
      {catalog.data.items.map((item, index) => {
        const target = mode === 'knowledge' ? `/${routeBase}/quiz/${item.id}` : `/${routeBase}/${item.challengeId ?? item.id}`
        return <li key={item.id}><Link to={target}><span className="lesson-number">{String(index + 1).padStart(2, '0')}</span><span className="lesson-copy"><strong>{item.title}</strong><small>{item.summary}</small></span><span className="lesson-arrow">→</span></Link></li>
      })}
    </ol>
  </div></AppShell>
}

export function ModeChallengePage({ mode }: { mode: Exclude<Mode, 'knowledge'> }) {
  const { challengeId } = useParams()
  const routeBase = mode === 'project' ? 'projects' : mode
  const challenge = useQuery({
    queryKey: ['challenge', challengeId], enabled: Boolean(challengeId),
    queryFn: async () => {
      const response = await fetch(`${API_URL}/challenges/${challengeId}`)
      if (!response.ok) throw new Error('Challenge unavailable')
      return (await response.json() as { data: PublicChallenge }).data
    },
  })
  if (challenge.isLoading) return <div className="workspace-loading"><LoadingState label="Preparing your editor…" /></div>
  if (!challenge.data) return <div className="workspace-loading"><ErrorState message="This challenge could not be loaded." retry={() => void challenge.refetch()} /></div>
  return <ChallengeWorkspace challenge={challenge.data} trackId={mode} sectionId="" sectionTitle={mode === 'project' ? 'Project milestone' : 'Interview practice'} returnToOverride={`/${routeBase}`} />
}
