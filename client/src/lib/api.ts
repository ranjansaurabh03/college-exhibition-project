import { API_ENABLED, API_URL } from '../config'
import type { StageKey } from './types'

/** What the connected server can do (GET /api/status). */
export interface ServerStatus {
  ai: { enabled: boolean; model: string | null; provider?: string }
  db: { enabled: boolean }
}

export class ApiError extends Error {
  status: number
  body: unknown
  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

export const apiUrl = (path: string) => `${API_URL}/api${path}`

/** Returns null when there is no API (for example on a static host). */
export async function fetchStatus(signal?: AbortSignal): Promise<ServerStatus | null> {
  if (!API_ENABLED) return null
  try {
    const res = await fetch(apiUrl('/status'), { signal, headers: { Accept: 'application/json' } })
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('application/json')) return null
    return (await res.json()) as ServerStatus
  } catch {
    return null
  }
}

export async function api<T>(
  path: string,
  { method = 'GET', body, token, signal }: { method?: string; body?: unknown; token?: string | null; signal?: AbortSignal } = {},
): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method,
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (res.status === 204) return undefined as T
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new ApiError(data.error ?? `Request failed (${res.status})`, res.status, data)
  return data as T
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Sends the conversation to the co-founder and calls onText for every streamed chunk.
 * Resolves with the stop reason and model once the reply is complete.
 */
export async function streamChat({
  stage,
  project,
  messages,
  signal,
  onText,
}: {
  stage: StageKey
  project: unknown
  messages: ChatTurn[]
  signal?: AbortSignal
  onText: (text: string) => void
}): Promise<{ stopReason?: string; model?: string }> {
  const res = await fetch(apiUrl('/ai/chat'), {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage, project, messages }),
  })
  if (!res.ok || !res.body) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new ApiError(data.error ?? `The co-founder is unavailable (${res.status})`, res.status, data)
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  let result: { stopReason?: string; model?: string } = {}
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += value
    let end: number
    while ((end = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, end)
      buffer = buffer.slice(end + 2)
      const line = frame.split('\n').find((l) => l.startsWith('data: '))
      if (!line) continue
      const event = JSON.parse(line.slice(6)) as { type: string; text?: string; message?: string; stopReason?: string; model?: string }
      if (event.type === 'text' && event.text) onText(event.text)
      else if (event.type === 'error') throw new ApiError(event.message ?? 'The co-founder hit an error.', 502)
      else if (event.type === 'done') result = { stopReason: event.stopReason, model: event.model }
    }
  }
  return result
}
