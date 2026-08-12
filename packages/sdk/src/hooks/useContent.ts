import { useQuery } from '@tanstack/react-query'
import { getApiClient, unwrap } from '../client'

export function useTracks() {
  return useQuery({
    queryKey: ['tracks'],
    queryFn: async () => unwrap(await getApiClient().GET('/tracks')).data,
  })
}

export function useTrack(trackId: string | undefined) {
  return useQuery({
    queryKey: ['track', trackId],
    enabled: Boolean(trackId),
    queryFn: async () =>
      unwrap(await getApiClient().GET('/tracks/{trackId}', { params: { path: { trackId: trackId! } } })).data,
  })
}

export function useSection(sectionId: string | undefined) {
  return useQuery({
    queryKey: ['section', sectionId],
    enabled: Boolean(sectionId),
    queryFn: async () =>
      unwrap(await getApiClient().GET('/sections/{sectionId}', { params: { path: { sectionId: sectionId! } } })).data,
  })
}

export function useChallenge(challengeId: string | undefined) {
  return useQuery({
    queryKey: ['challenge', challengeId],
    enabled: Boolean(challengeId),
    queryFn: async () =>
      unwrap(await getApiClient().GET('/challenges/{challengeId}', { params: { path: { challengeId: challengeId! } } }))
        .data,
  })
}
