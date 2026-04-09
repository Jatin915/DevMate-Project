/**
 * useVideoJourney.js
 *
 * Manages the video learning journey state:
 *   - Loading playlist + videos for a language
 *   - Loading tasks for the active video
 *   - Tracking active video / active task
 *   - Marking a video complete and unlocking the next
 *   - Language completion detection
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../utils/api'

const VALID_OID = /^[a-f\d]{24}$/i

function normalizeLanguage(v) {
  if (v === 'Node.js') return 'Node'
  if (v === 'Express.js') return 'Express'
  return v
}

function getStoredLanguage() {
  // Priority: dedicated language key (most reliable) → onboarding state
  try {
    const direct = localStorage.getItem('dm-current-language')
    if (direct && direct.trim()) return direct.trim()
    const raw = localStorage.getItem('dm-onboarding')
    const parsed = raw ? JSON.parse(raw) : null
    return parsed?.currentLanguage || parsed?.recommendedNextLanguage || null
  } catch { return null }
}

export function useVideoJourney({ languageParam, preferredVideoId, refreshTasksKey }) {
  const navigate = useNavigate()

  // ── Playlist / video state ────────────────────────────────────────────
  const [journeyLoading, setJourneyLoading] = useState(false)
  const [journeyError,   setJourneyError]   = useState('')
  const [playlistId,     setPlaylistId]     = useState(null)
  const [language,       setLanguage]       = useState(null)
  const [videos,         setVideos]         = useState([])
  const [activeVideoId,  setActiveVideoId]  = useState(null)

  // ── Task state ────────────────────────────────────────────────────────
  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasksError,   setTasksError]   = useState('')
  const [tasks,        setTasks]        = useState([])
  const [activeTaskId, setActiveTaskId] = useState(null)

  // ── Language completion ───────────────────────────────────────────────
  const [languageCompleted, setLanguageCompleted] = useState(false)

  useEffect(() => {
    if (videos.length === 0) { setLanguageCompleted(false); return }
    setLanguageCompleted(videos.every((v) => v.completed))
  }, [videos])

  // ── Derived ───────────────────────────────────────────────────────────
  const activeVideo = useMemo(
    () => videos.find((v) => String(v.id) === String(activeVideoId)) || null,
    [videos, activeVideoId],
  )

  const orderedTasks = useMemo(
    () => [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [tasks],
  )

  const completed          = orderedTasks.filter((t) => t.completed).length
  const firstIncompleteIdx = orderedTasks.findIndex((t) => !t.completed)

  const isTaskUnlocked = (idx, task) => {
    if (!task) return false
    if (task.completed) return true
    if (firstIncompleteIdx === -1) return true
    return idx === firstIncompleteIdx
  }

  const activeTask = useMemo(
    () => orderedTasks.find((t) => String(t.id) === String(activeTaskId)) || null,
    [orderedTasks, activeTaskId],
  )

  const activeTaskIndex = useMemo(
    () => activeTaskId ? orderedTasks.findIndex((t) => String(t.id) === String(activeTaskId)) : -1,
    [orderedTasks, activeTaskId],
  )

  const activeTaskUnlocked = activeTask ? isTaskUnlocked(activeTaskIndex, activeTask) : false

  // ── Load playlist + videos ────────────────────────────────────────────
  useEffect(() => {
    const langRaw = languageParam || getStoredLanguage()
    if (!langRaw) return
    const lang = normalizeLanguage(String(langRaw).trim())

    setJourneyLoading(true)
    setJourneyError('')

    apiRequest(`/videos/${encodeURIComponent(lang)}`)
      .then((res) => {
        setLanguage(lang)
        // Persist so navigation without ?language= param restores the correct language
        localStorage.setItem('dm-current-language', lang)
        setPlaylistId(res.playlistId || null)
        setVideos(res.videos || [])

        if ((res.videos || []).length > 0) {
          const unlocked    = res.videos.filter((v) => v.unlocked && !v.completed)
          const firstUnlocked = unlocked[0] || res.videos.find((v) => v.unlocked) || res.videos[0]
          const pick = preferredVideoId
            ? res.videos.find((v) => String(v.id) === String(preferredVideoId)) || firstUnlocked
            : firstUnlocked
          const rawId  = pick?.id != null ? String(pick.id) : null
          const validId = rawId && VALID_OID.test(rawId) ? rawId : null
          if (!validId && rawId) console.warn('[VideoTask] Invalid ObjectId from API:', rawId)
          setActiveVideoId(validId)
        } else {
          setActiveVideoId(null)
        }
      })
      .catch((e) => setJourneyError(e.message))
      .finally(() => setJourneyLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageParam])

  // ── Load tasks for active video ───────────────────────────────────────
  useEffect(() => {
    if (!activeVideoId) return
    if (!VALID_OID.test(String(activeVideoId))) {
      console.warn('[VideoTask] Skipping task load — invalid ObjectId:', activeVideoId)
      return
    }
    setTasksLoading(true)
    setTasksError('')
    apiRequest(`/tasks/${activeVideoId}`)
      .then((res) => setTasks(res.tasks || []))
      .catch((e) => { setTasksError(e.message); setTasks([]) })
      .finally(() => setTasksLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVideoId, refreshTasksKey])

  // ── Keep active task valid after task list changes ────────────────────
  useEffect(() => {
    if (!activeTaskId) {
      const next = orderedTasks.find((t) => !t.completed) || orderedTasks[0] || null
      setActiveTaskId(next?.id ? String(next.id) : null)
      return
    }
    if (!orderedTasks.some((t) => String(t.id) === String(activeTaskId))) {
      const next = orderedTasks.find((t) => !t.completed) || orderedTasks[0] || null
      setActiveTaskId(next?.id ? String(next.id) : null)
      return
    }
    const current = orderedTasks.find((t) => String(t.id) === String(activeTaskId))
    if (current?.completed) {
      const next = orderedTasks.find((t) => !t.completed) || current
      setActiveTaskId(next?.id ? String(next.id) : null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedTasks])

  // ── Mark video complete ───────────────────────────────────────────────
  const markVideoComplete = async () => {
    if (!playlistId || !activeVideoId) return
    setJourneyLoading(true)
    setJourneyError('')
    try {
      const res = await apiRequest('/videos/complete', {
        method: 'POST',
        body: JSON.stringify({ videoId: activeVideoId }),
      })
      if (Array.isArray(res.videos)) setVideos(res.videos)
      if (res.playlistId)            setPlaylistId(res.playlistId)
      if (res.language) {
        setLanguage(res.language)
        localStorage.setItem('dm-current-language', res.language)
      }

      if (res.languageCompleted && res.nextLanguage) {
        navigate(`/journey/playlist?language=${encodeURIComponent(res.nextLanguage)}`)
        return
      }
      if (res.nextUnlockedVideoId) {
        setActiveVideoId(String(res.nextUnlockedVideoId))
      } else {
        const next = res.videos?.find((v) => v.unlocked && !v.completed)
        if (next) setActiveVideoId(String(next.id))
      }
    } catch (e) {
      setJourneyError(e.message)
    } finally {
      setJourneyLoading(false)
    }
  }

  // ── Playlist update helpers (called after upload/change) ──────────────
  const applyNewPlaylist = (res) => {
    setPlaylistId(res.playlistId || null)
    setVideos(res.videos || [])
    setTasks([])
    setActiveTaskId(null)
    const first = (res.videos || []).find((v) => v.unlocked) || res.videos?.[0] || null
    setActiveVideoId(first?.id ? String(first.id) : null)
    // Keep dm-current-language in sync when playlist changes
    if (res.language) localStorage.setItem('dm-current-language', res.language)
  }

  return {
    // state
    journeyLoading, journeyError,
    playlistId, language, videos, activeVideoId, setActiveVideoId,
    tasksLoading, tasksError, tasks,
    activeTaskId, setActiveTaskId,
    languageCompleted,
    // derived
    activeVideo, orderedTasks, completed,
    activeTask, activeTaskUnlocked, isTaskUnlocked,
    // actions
    markVideoComplete,
    applyNewPlaylist,
  }
}
