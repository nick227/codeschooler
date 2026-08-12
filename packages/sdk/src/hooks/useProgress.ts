import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiClient, unwrap } from '../client'
import type { components } from '../generated/types'

type AttemptInput = components['schemas']['AttemptInput']

export function useProgressList() {
  return useQuery({
    queryKey: ['progress', 'list'],
    queryFn: async () => unwrap(await getApiClient().GET('/progress')).data,
  })
}

export function useProgressSummary() {
  return useQuery({
    queryKey: ['progress', 'summary'],
    queryFn: async () => unwrap(await getApiClient().GET('/progress/summary')).data,
  })
}

export function useSubmitAttempt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: AttemptInput) => unwrap(await getApiClient().POST('/attempts', { body })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] })
    },
  })
}
