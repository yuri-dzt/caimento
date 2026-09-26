// Cliente HTTP da SPA: cookie de sessão same-origin, header CSRF e 401 → /login

const CSRF_HEADER = { 'X-Requested-With': 'caimento' }

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** não redireciona para /login no 401 (usado pelo carregamento da sessão) */
  skipAuthRedirect?: boolean
}

function redirectToLogin(): void {
  if (window.location.pathname !== '/login') {
    const next = encodeURIComponent(window.location.pathname + window.location.search)
    window.location.assign(`/login?next=${next}`)
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET'
  const headers: Record<string, string> = {}
  let body: BodyInit | undefined

  if (method !== 'GET') Object.assign(headers, CSRF_HEADER)
  if (options.body instanceof FormData) {
    body = options.body
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  let response: Response
  try {
    response = await fetch(`/api${path}`, { method, headers, body, credentials: 'same-origin' })
  } catch {
    throw new ApiError('Sem conexão com o servidor. Verifique a internet.', 0, 'NETWORK')
  }

  if (response.status === 401 && !options.skipAuthRedirect) {
    redirectToLogin()
  }

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string; code?: string } | null
    throw new ApiError(data?.message ?? 'Algo deu errado. Tente novamente.', response.status, data?.code)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) => request<T>(path, options),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T = void>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Algo deu errado. Tente novamente.'
}
