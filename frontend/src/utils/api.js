/**
 * api.js — centralised API client for DevMate frontend.
 *
 * Routing strategy:
 *   Development (npm run dev):
 *     API_BASE = '/api'
 *     Vite dev server proxies /api → http://localhost:5000
 *     No CORS issues, no need for VITE_API_URL at runtime.
 *
 *   Production (Vercel build):
 *     API_BASE = 'https://devmate-project.onrender.com/api'
 *     import.meta.env.PROD is true, VITE_API_URL must be set in Vercel env vars.
 *
 * Token storage:
 *   JWT stored under 'dm-token' in localStorage.
 *   Automatically attached as  Authorization: Bearer <token>  on every request.
 *
 * Error logging:
 *   Every failed request logs: [API] <status> <method> <url> <message>
 */

// ── Environment safety check ──────────────────────────────────────────────
const VITE_API_URL = import.meta.env.VITE_API_URL

if (import.meta.env.PROD && !VITE_API_URL) {
  console.error(
    '[DevMate] ERROR: Missing VITE_API_URL. ' +
    'Add VITE_API_URL=https://devmate-project.onrender.com to your Vercel environment variables.',
  )
}

// In production use the absolute URL; in dev use the Vite proxy path.
// This prevents double-routing when VITE_API_URL is also set in .env during dev.
const API_BASE = import.meta.env.PROD
  ? `${VITE_API_URL}/api`
  : '/api'

// ── Auth helpers ──────────────────────────────────────────────────────────

/** Read the stored JWT. Returns empty string if not logged in. */
export function getAuthToken() {
  return localStorage.getItem('dm-token') || ''
}

/**
 * Persist the full auth payload returned by /auth/login or /auth/signup.
 * Stores token, user object, and onboarding state separately so any
 * component can read them without an extra API call.
 */
export function setAuthSession(payload) {
  if (payload?.token)      localStorage.setItem('dm-token',      payload.token)
  if (payload?.user)       localStorage.setItem('dm-user',       JSON.stringify(payload.user))
  if (payload?.onboarding) localStorage.setItem('dm-onboarding', JSON.stringify(payload.onboarding))
}

/** Remove all auth data — called on logout. */
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

export function readUser() {
  try {
    const raw = localStorage.getItem('dm-user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// ── Core request function ─────────────────────────────────────────────────

/**
 * Make an authenticated JSON request to the backend.
 *
 * @param {string} path   - API path, e.g. '/auth/login'  (no /api prefix needed)
 * @param {object} options - fetch options (method, body, headers, …)
 * @returns {Promise<object>} Parsed JSON response body
 * @throws {Error} On network failure or non-2xx response
 *
 * Usage:
 *   const data = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({...}) })
 */
export async function apiRequest(path, options = {}) {
  const token = getAuthToken()

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  // Attach JWT automatically if present
  if (token) headers.Authorization = `Bearer ${token}`

  const url    = `${API_BASE}${path}`
  const method = options.method || 'GET'

  let res
  try {
    res = await fetch(url, { ...options, headers })
  } catch (networkErr) {
    console.error(`[API] Network error | ${method} ${url}`, networkErr.message)
    throw new Error('Network error — check your connection or the server may be down.')
  }

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    console.error(`[API] ${res.status} ${method} ${url}`, data.message || 'No message')
    throw new Error(data.message || `Request failed with ${res.status}`)
  }

  return data
}
