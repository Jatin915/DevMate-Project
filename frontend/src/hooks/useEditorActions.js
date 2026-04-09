/**
 * useEditorActions.js
 *
 * Handles all async actions in the code editor:
 *   - handleSave  — draft save (task or mini project)
 *   - handleEvaluate — AI evaluation
 *   - handleSubmitTask — final task submission after passing
 *
 * Receives the current editor state as parameters so it stays
 * stateless and reusable.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../utils/api'

export function useEditorActions({ ctx, code, files, activeFile, setTasks }) {
  const navigate = useNavigate()

  const [saving, setSaving]         = useState(false)
  const [saveResult, setSaveResult] = useState(null)
  const [evaluating, setEvaluating] = useState(false)
  const [aiResult, setAiResult]     = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // ── Save draft ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!ctx?.taskId && !ctx?.miniProjectId) {
      setSaveResult({ success: false, message: 'No task selected.' })
      return
    }
    setSaving(true)
    setSaveResult(null)

    if (ctx.miniProjectId) {
      try {
        await apiRequest('/mini-projects/save-code', {
          method: 'POST',
          body: JSON.stringify({ language: ctx.miniProjectLang, projectId: ctx.miniProjectId, code }),
        })
        const stored = (() => { try { return JSON.parse(localStorage.getItem('dm-code-eval-context') || 'null') } catch { return null } })()
        if (stored) localStorage.setItem('dm-code-eval-context', JSON.stringify({ ...stored, starterCode: code }))
        setSaveResult({ success: true, message: 'Draft saved ✅' })
      } catch (e) {
        setSaveResult({ success: false, message: e.message || 'Save failed.' })
      } finally {
        setSaving(false)
      }
      return
    }

    const lsKey      = `dm-draft-${ctx.taskId}`
    const lsFilesKey = `dm-draft-files-${ctx.taskId}`
    try { localStorage.setItem(lsKey, code) } catch { /* storage full */ }
    try { localStorage.setItem(lsFilesKey, JSON.stringify(files)) } catch { /* storage full */ }

    try {
      await apiRequest('/code/draft', {
        method: 'POST',
        body: JSON.stringify({ taskId: ctx.taskId, videoId: ctx.videoId || '', code, files }),
      })
      setSaveResult({ success: true, message: 'Draft saved ✅' })
    } catch {
      setSaveResult({ success: true, message: 'Draft saved locally (offline backup)' })
    } finally {
      setSaving(false)
    }
  }

  // ── AI Evaluate ───────────────────────────────────────────────────────
  const handleEvaluate = async (setActiveTab) => {
    const FALLBACK_CODE = '// Write your solution here\n'
    if (!code.trim() || code.trim() === FALLBACK_CODE.trim()) {
      setAiResult({ error: 'Write some code before evaluating.' })
      setActiveTab('feedback')
      return
    }
    setEvaluating(true)
    setAiResult(null)
    setActiveTab('feedback')
    try {
      const res = await apiRequest('/ai/evaluate', {
        method: 'POST',
        body: JSON.stringify({
          code,
          files,
          taskId:          ctx?.taskId          || '',
          videoId:         ctx?.videoId         || '',
          taskTitle:       ctx?.taskTitle        || '',
          taskDescription: ctx?.taskDescription  || ctx?.problemDescription || '',
        }),
      })
      if (!res.success) {
        setAiResult({ error: res.error || 'AI evaluation failed. Please try again.' })
        return
      }
      setAiResult({
        score:         res.score,
        feedback:      res.feedback,
        errors:        res.errors        || [],
        suggestions:   res.suggestions   || [],
        optimizedCode: res.optimizedCode || null,
        passed:        res.passed,
      })
    } catch (e) {
      setAiResult({ error: e.message || 'AI evaluation failed. Please try again.' })
    } finally {
      setEvaluating(false)
    }
  }

  // ── Submit task ───────────────────────────────────────────────────────
  const handleSubmitTask = async () => {
    if (!ctx?.taskId || !aiResult?.passed) return
    setSubmitting(true)
    const submittedCode = Object.keys(files).length > 1
      ? Object.entries(files).map(([name, content]) => `// FILE: ${name}\n${content}`).join('\n\n')
      : code
    try {
      await apiRequest('/tasks/complete', {
        method: 'POST',
        body: JSON.stringify({ taskId: ctx.taskId, submittedCode, aiScore: aiResult.score }),
      })
      navigate(
        `/video-task?language=${encodeURIComponent(ctx.language || '')}&videoId=${encodeURIComponent(ctx.videoId || '')}&refreshTasks=${Date.now()}`,
      )
    } catch (e) {
      setSaveResult({ success: false, message: e.message || 'Submission failed.' })
    } finally {
      setSubmitting(false)
    }
  }

  const goBack = () => {
    if (ctx?.videoId && ctx?.language) {
      navigate(`/video-task?language=${encodeURIComponent(ctx.language)}&videoId=${encodeURIComponent(ctx.videoId)}`)
    } else {
      navigate('/video-task')
    }
  }

  return {
    saving, saveResult, setSaveResult,
    evaluating,
    aiResult, setAiResult,
    submitting,
    handleSave,
    handleEvaluate,
    handleSubmitTask,
    goBack,
  }
}
