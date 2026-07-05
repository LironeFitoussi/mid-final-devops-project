import type { Meme, MemeInput, Stats } from './types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export interface MemeQuery {
  status?: string;
  q?: string;
}

export const api = {
  getStats: () => request<Stats>('/api/stats'),

  getMemes: ({ status, q }: MemeQuery = {}) => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    if (q) params.set('q', q);
    const qs = params.toString();
    return request<Meme[]>(`/api/memes${qs ? `?${qs}` : ''}`);
  },

  getCategories: () => request<string[]>('/api/categories'),

  createMeme: (input: MemeInput) =>
    request<Meme>('/api/memes', { method: 'POST', body: JSON.stringify(input) }),

  updateMeme: (id: string, input: MemeInput) =>
    request<Meme>(`/api/memes/${id}`, { method: 'PUT', body: JSON.stringify(input) }),

  deleteMeme: (id: string) => request<Meme>(`/api/memes/${id}`, { method: 'DELETE' }),

  getVersion: () => request<{ version: string }>('/version'),
};
