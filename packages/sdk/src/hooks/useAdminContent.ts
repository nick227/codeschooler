import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiClient, unwrap } from '../client'

export function useAdminContentList(filters?: { type?: string; status?: string; category?: string; search?: string }) {
  return useQuery({
    queryKey: ['adminContent', filters],
    queryFn: async () => {
      const client = getApiClient()
      const res: any = await client.GET('/admin/content', { params: { query: filters as any } })
      const data = unwrap(res)
      return (data as any)?.data ?? []
    },
  })
}

export function useAdminContentItem(id?: string) {
  return useQuery({
    queryKey: ['adminContent', id],
    queryFn: async () => {
      if (!id) return null
      const client = getApiClient()
      const res: any = await client.GET('/admin/content/{id}', { params: { path: { id } } })
      const data = unwrap(res)
      return (data as any)?.data ?? null
    },
    enabled: !!id,
  })
}

export function useAdminCreateContent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: any) => {
      const client = getApiClient()
      const res: any = await client.POST('/admin/content', { body: input })
      const data = unwrap(res)
      return (data as any)?.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['adminContent'] })
    },
  })
}

export function useAdminUpdateContent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const client = getApiClient()
      const res: any = await client.PATCH('/admin/content/{id}', { params: { path: { id } }, body: data })
      const result = unwrap(res)
      return (result as any)?.data
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['adminContent'] })
      void queryClient.invalidateQueries({ queryKey: ['adminContent', variables.id] })
    },
  })
}

export function useAdminValidateContent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const client = getApiClient()
      const res: any = await client.POST('/admin/content/{id}/validate', { params: { path: { id } } })
      const data = unwrap(res)
      return (data as any)?.data
    },
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: ['adminContent'] })
      void queryClient.invalidateQueries({ queryKey: ['adminContent', id] })
    },
  })
}

export function useAdminPublishContent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const client = getApiClient()
      const res: any = await client.POST('/admin/content/{id}/publish', { params: { path: { id } } })
      const data = unwrap(res)
      return (data as any)?.data
    },
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: ['adminContent'] })
      void queryClient.invalidateQueries({ queryKey: ['adminContent', id] })
    },
  })
}

export function useAdminDeleteContent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const client = getApiClient()
      const res: any = await client.DELETE('/admin/content/{id}', { params: { path: { id } } })
      const data = unwrap(res)
      return (data as any)?.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['adminContent'] })
    },
  })
}

export function useAdminGenerateContent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: any) => {
      const client = getApiClient()
      const res: any = await client.POST('/admin/content/generate', { body: input })
      const data = unwrap(res)
      return (data as any)?.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['adminContent'] })
    },
  })
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ['adminCategories'],
    queryFn: async () => {
      const client = getApiClient()
      const res: any = await client.GET('/admin/categories')
      const data = unwrap(res)
      return (data as any)?.data ?? []
    },
  })
}

export function useAdminTags() {
  return useQuery({
    queryKey: ['adminTags'],
    queryFn: async () => {
      const client = getApiClient()
      const res: any = await client.GET('/admin/tags')
      const data = unwrap(res)
      return (data as any)?.data ?? []
    },
  })
}

export function useAdminSkills() {
  return useQuery({
    queryKey: ['adminSkills'],
    queryFn: async () => {
      const client = getApiClient()
      const res: any = await client.GET('/admin/skills')
      const data = unwrap(res)
      return (data as any)?.data ?? []
    },
  })
}
