import { useParams } from 'react-router-dom'
import { useChallenge, useSection } from '@code-trainer/sdk'
import { ErrorState, LoadingState } from '../../components/AsyncState'
import { ChallengeWorkspace } from './ChallengeWorkspace'
import type { PublicChallenge } from './workspace.types'

export function ChallengeWorkspacePage() {
  const { trackId = 'javascript-fundamentals', sectionId = 'getting-started', challengeId } = useParams()
  const challenge = useChallenge(challengeId)
  const section = useSection(sectionId)
  const challengeIds = section.data?.lessons.flatMap((lesson) => lesson.challenges.map((item) => item.id)) ?? []
  const index = challengeId ? challengeIds.indexOf(challengeId) : -1
  const nextChallengeId = index >= 0 ? challengeIds[index + 1] : undefined

  if (challenge.isLoading) return <div className="workspace-loading"><LoadingState label="Preparing your editor…" /></div>
  if (challenge.isError || !challenge.data) return <div className="workspace-loading"><ErrorState message="The challenge could not be loaded. Your local code is safe." retry={() => void challenge.refetch()} /></div>

  return <ChallengeWorkspace
    key={challenge.data.id}
    challenge={challenge.data as PublicChallenge}
    trackId={trackId}
    sectionId={sectionId}
    sectionTitle={section.data?.title}
    position={index >= 0 ? `${index + 1} of ${challengeIds.length}` : undefined}
    continueTo={nextChallengeId ? `/learn/${trackId}/${sectionId}/${nextChallengeId}` : `/learn/${trackId}/${sectionId}`}
  />
}
