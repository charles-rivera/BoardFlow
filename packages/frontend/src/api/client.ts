import type { Lane, Card } from '@kanban/shared'

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(body.error ?? res.statusText)
    ;(err as Error & { status: number }).status = res.status
    throw err
  }
  return res.json()
}

export const api = {
  auth: {
    register: (email: string, password: string) =>
      apiFetch<{ user: { id: string; email: string } }>('/api/auth/register', {
        method: 'POST', body: JSON.stringify({ email, password }),
      }),
    login: (email: string, password: string) =>
      apiFetch<{ user: { id: string; email: string } }>('/api/auth/login', {
        method: 'POST', body: JSON.stringify({ email, password }),
      }),
    logout: () => apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
    me: () => apiFetch<{ user: { id: string; email: string } }>('/api/auth/me'),
  },
  lanes: {
    getAll: () => apiFetch<{ lanes: Lane[] }>('/api/lanes'),
    create: (title: string) =>
      apiFetch<{ lane: Lane }>('/api/lanes', { method: 'POST', body: JSON.stringify({ title }) }),
    rename: (id: string, title: string) =>
      apiFetch<{ lane: Lane }>(`/api/lanes/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) }),
    reorder: (id: string, position: number) =>
      apiFetch<{ ok: boolean }>(`/api/lanes/${id}/reorder`, { method: 'PATCH', body: JSON.stringify({ position }) }),
    delete: (id: string) =>
      apiFetch<{ ok: boolean }>(`/api/lanes/${id}`, { method: 'DELETE' }),
  },
  cards: {
    create: (laneId: string, title: string, description = '') =>
      apiFetch<{ card: Card }>('/api/cards', {
        method: 'POST', body: JSON.stringify({ lane_id: laneId, title, description }),
      }),
    update: (id: string, data: Partial<{ title: string; description: string; lane_id: string; position: number }>) =>
      apiFetch<{ card: Card }>(`/api/cards/${id}`, {
        method: 'PATCH', body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiFetch<{ ok: boolean }>(`/api/cards/${id}`, { method: 'DELETE' }),
  },
}
