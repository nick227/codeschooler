import { useMutation } from '@tanstack/react-query'
import { getApiClient, unwrap } from '../client'
import type { components } from '../generated/types'

type AssistantHintInput = components['schemas']['AssistantHintInput']

/** Fires an inline-assistant hint request. Callers decide *when* to call this — see docs/09/10 trigger events (pause, parseable line, repeated error, completion). */
export function useAssistantHint() {
  return useMutation({
    mutationFn: async (body: AssistantHintInput) => unwrap(await getApiClient().POST('/assistant/hint', { body })).data,
  })
}
