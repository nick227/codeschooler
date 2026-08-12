import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiClient, unwrap } from '../client'
import type { components } from '../generated/types'

type RegisterInput = components['schemas']['RegisterInput']
type LoginInput = components['schemas']['LoginInput']

export function useCurrentUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => unwrap(await getApiClient().GET('/auth/me')).data,
    retry: false,
    staleTime: 60_000,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: LoginInput) => unwrap(await getApiClient().POST('/auth/login', { body })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: RegisterInput) => unwrap(await getApiClient().POST('/auth/register', { body })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => unwrap(await getApiClient().POST('/auth/logout')),
    onSuccess: () => {
      queryClient.clear()
    },
  })
}
