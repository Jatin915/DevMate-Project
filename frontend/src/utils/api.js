const API_BASE = '/api'

export function getAuthToken() {
  return localStorage.getItem('dm-token') || ''
}

export function setAuthSession(payload) {
  if (payload?.token) localStorage.setItem('dm-token', payload.token)
  if (payload?.user) localStorage.setItem('dm-user', JSON.stringify(payload.user))
  if (payload?.onboarding) localStorage.setItem('dm-onboarding', JSON.stringify(payload.onboarding))
}

export function clearAuthSession() {
  localStorage.removeItem('dm-token')
  localStorage.removeItem('dm-user')
  localStorage.removeItem('dm-onboarding')
}

export function readOnboarding() {
  try {
    const raw = localStorage.getItem('dm-onboarding')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function apiRequest(path, options = {}) {
  const token = getAuthToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || `Request failed with ${res.status}`)
  }
  return data
}
