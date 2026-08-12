import createClient, { type Middleware } from 'openapi-fetch'
import type { paths } from './generated/types'

type ClientConfig = {
  baseUrl: string
  getToken?: () => string | null  // only for native apps; web uses httpOnly cookies
}

let _client: ReturnType<typeof createClient<paths>> | null = null

export function createApiClient(config: ClientConfig) {
  const client = createClient<paths>({
    baseUrl: config.baseUrl,
    credentials: 'include',  // send httpOnly session cookie automatically
  })

  if (config.getToken) {
    const authMiddleware: Middleware = {
      async onRequest({ request }) {
        const token = config.getToken!()
        if (token) request.headers.set('Authorization', `Bearer ${token}`)
        return request
      },
    }
    client.use(authMiddleware)
  }

  _client = client
  return client
}

export function getApiClient() {
  if (!_client) throw new Error('Call createApiClient() before using hooks.')
  return _client
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Unwraps an openapi-fetch result, throwing ApiError on failure. Written as
 * a standalone generic (rather than destructuring + narrowing `error` at
 * each call site) to sidestep a TS control-flow quirk where narrowing on
 * `error` from openapi-fetch's response union collapses the sibling
 * `response` binding to `never` under this project's strict tsconfig.
 */
export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  const status = result.response.status
  if (result.error !== undefined) {
    const error = result.error
    const message =
      typeof error === 'object' && error !== null && 'error' in error
        ? String((error as { error: unknown }).error)
        : 'Request failed'
    throw new ApiError(status, message)
  }
  return result.data as T
}
