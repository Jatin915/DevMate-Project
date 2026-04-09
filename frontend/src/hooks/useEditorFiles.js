/**
 * useEditorFiles.js
 *
 * Manages the multi-file workspace state for the Monaco editor.
 * Handles:
 *   - files object (filename → content)
 *   - activeFile tracking
 *   - code ↔ files[activeFile] sync
 *   - localStorage persistence on every keystroke
 *   - draft load/restore from backend + localStorage
 *   - add / delete / switch file operations
 */

import { useState } from 'react'
import { apiRequest } from '../utils/api'
import { loadTemplate } from '../templates/loadTemplate'

const FALLBACK_CODE = '// Write your solution here\n'

// ── Helpers ───────────────────────────────────────────────────────────────

function getTaskIdFromStorage() {
  try {
    return JSON.parse(localStorage.getItem('dm-code-eval-context') || 'null')?.taskId || null
  } catch { return null }
}

function readLocalFiles(taskId) {
  if (!taskId) return null
  try {
    const raw = localStorage.getItem(`dm-draft-files-${taskId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) return parsed
  } catch { /* ignore */ }
  return null
}

function writeLocalFiles(taskId, filesObj) {
  if (!taskId) return
  try { localStorage.setItem(`dm-draft-files-${taskId}`, JSON.stringify(filesObj)) } catch { /* storage full */ }
}

export function buildDefaultFiles(language, starterCode) {
  return loadTemplate(language, starterCode)
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useEditorFiles() {
  const [files, setFiles]         = useState({ 'solution.js': FALLBACK_CODE })
  const [activeFile, setActiveFile] = useState('solution.js')
  const [code, setCode]           = useState(FALLBACK_CODE)

  // ── Sync helpers ──────────────────────────────────────────────────────
  /** Called by Monaco onChange — keeps code + files in sync and persists to localStorage */
  const setCodeAndFiles = (val) => {
    const v = val ?? ''
    setCode(v)
    setFiles((prev) => {
      const next = { ...prev, [activeFile]: v }
      writeLocalFiles(getTaskIdFromStorage(), next)
      return next
    })
  }

  /** Initialise the workspace from a files object (e.g. after draft load) */
  const initWorkspace = (filesObj, preferredFile) => {
    setFiles(filesObj)
    const first = preferredFile || Object.keys(filesObj)[0]
    setActiveFile(first)
    setCode(filesObj[first] ?? FALLBACK_CODE)
  }

  // ── File operations ───────────────────────────────────────────────────
  const switchFile = (filename) => {
    setActiveFile(filename)
    setCode(files[filename] ?? '')
  }

  const addFile = (folderPrefix) => {
    // folderPrefix: e.g. "src/hooks" — new file will be created inside it
    const raw = window.prompt(
      folderPrefix
        ? `New file inside "${folderPrefix}/" (name only, e.g. useForm.js):`
        : 'New file name (e.g. helper.js, src/utils/format.js):',
    )
    if (!raw || !raw.trim()) return
    const name = folderPrefix
      ? `${folderPrefix}/${raw.trim()}`
      : raw.trim()
    if (files[name]) { window.alert(`"${name}" already exists.`); return }
    setFiles((prev) => {
      const next = { ...prev, [name]: '' }
      writeLocalFiles(getTaskIdFromStorage(), next)
      return next
    })
    setActiveFile(name)
    setCode('')
  }

  const addFolder = (parentPrefix) => {
    // Creates a placeholder file inside the new folder so it appears in the tree
    const raw = window.prompt(
      parentPrefix
        ? `New folder inside "${parentPrefix}/" (name only):`
        : 'New folder name:',
    )
    if (!raw || !raw.trim()) return
    const folderName = parentPrefix ? `${parentPrefix}/${raw.trim()}` : raw.trim()
    const placeholder = `${folderName}/.gitkeep`
    if (files[placeholder]) { window.alert(`Folder "${folderName}" already exists.`); return }
    setFiles((prev) => {
      const next = { ...prev, [placeholder]: '' }
      writeLocalFiles(getTaskIdFromStorage(), next)
      return next
    })
  }

  const renameFile = (oldPath) => {
    const parts   = oldPath.split('/')
    const oldName = parts[parts.length - 1]
    const newName = window.prompt('Rename to:', oldName)
    if (!newName || !newName.trim() || newName.trim() === oldName) return

    const trimmed = newName.trim()
    const parentPrefix = parts.slice(0, -1).join('/')
    const newPath = parentPrefix ? `${parentPrefix}/${trimmed}` : trimmed

    // ── Detect whether this is a folder or a file ─────────────────────
    // A path is a folder if any file key starts with "oldPath/"
    const isFolder = Object.keys(files).some((f) => f.startsWith(`${oldPath}/`))

    if (isFolder) {
      // ── Folder rename: rewrite every child path ───────────────────
      const conflictExists = Object.keys(files).some(
        (f) => f === newPath || f.startsWith(`${newPath}/`),
      )
      if (conflictExists) { window.alert(`"${newPath}" already exists.`); return }

      let newActiveFile = activeFile
      setFiles((prev) => {
        const next = {}
        Object.keys(prev).forEach((filePath) => {
          if (filePath === oldPath || filePath.startsWith(`${oldPath}/`)) {
            const movedPath = newPath + filePath.slice(oldPath.length)
            next[movedPath] = prev[filePath]
            // Track if the active file moved
            if (filePath === activeFile) newActiveFile = movedPath
          } else {
            next[filePath] = prev[filePath]
          }
        })
        writeLocalFiles(getTaskIdFromStorage(), next)
        return next
      })
      if (newActiveFile !== activeFile) setActiveFile(newActiveFile)
    } else {
      // ── File rename: single key swap ──────────────────────────────
      if (files[newPath]) { window.alert(`"${newPath}" already exists.`); return }
      setFiles((prev) => {
        const next = { ...prev, [newPath]: prev[oldPath] }
        delete next[oldPath]
        writeLocalFiles(getTaskIdFromStorage(), next)
        return next
      })
      if (activeFile === oldPath) setActiveFile(newPath)
    }
  }

  const deleteFile = (filename) => {
    if (Object.keys(files).length <= 1) { window.alert('Cannot delete the last file.'); return }
    if (!window.confirm(`Delete "${filename}"?`)) return
    setFiles((prev) => {
      const next = { ...prev }
      delete next[filename]
      writeLocalFiles(getTaskIdFromStorage(), next)
      return next
    })
    if (activeFile === filename) {
      const remaining = Object.keys(files).filter((f) => f !== filename)
      setActiveFile(remaining[0])
      setCode(files[remaining[0]] ?? '')
    }
  }

  const deleteFolder = (folderPrefix) => {
    // Delete all files whose path starts with folderPrefix/
    const toDelete = Object.keys(files).filter((f) => f === folderPrefix || f.startsWith(`${folderPrefix}/`))
    if (toDelete.length === 0) return
    if (Object.keys(files).length - toDelete.length < 1) { window.alert('Cannot delete the only remaining files.'); return }
    if (!window.confirm(`Delete folder "${folderPrefix}" and all its contents (${toDelete.length} file${toDelete.length !== 1 ? 's' : ''})?`)) return
    setFiles((prev) => {
      const next = { ...prev }
      toDelete.forEach((f) => delete next[f])
      writeLocalFiles(getTaskIdFromStorage(), next)
      return next
    })
    if (toDelete.includes(activeFile)) {
      const remaining = Object.keys(files).filter((f) => !toDelete.includes(f))
      setActiveFile(remaining[0])
      setCode(files[remaining[0]] ?? '')
    }
  }

  // ── Draft load ────────────────────────────────────────────────────────
  /**
   * Load draft for a task. Priority:
   *   1. localStorage (instant, no flash)
   *   2. Backend (authoritative, async)
   *   3. Language template (fallback)
   */
  const loadDraft = (taskId, language, starterCode) => {
    const lsFilesKey = `dm-draft-files-${taskId}`
    const lsKey      = `dm-draft-${taskId}`

    const localFiles = readLocalFiles(taskId)
    if (localFiles) {
      initWorkspace(localFiles)
    } else {
      const initF = buildDefaultFiles(language, starterCode || FALLBACK_CODE)
      initWorkspace(initF)
    }

    apiRequest(`/code/draft/${taskId}`)
      .then((res) => {
        if (res.files && typeof res.files === 'object' && Object.keys(res.files).length > 0) {
          initWorkspace(res.files)
          try { localStorage.setItem(lsFilesKey, JSON.stringify(res.files)) } catch { /* ignore */ }
        } else if (!localFiles && res.code && res.code.trim()) {
          const initF = buildDefaultFiles(language, res.code)
          initWorkspace(initF)
        }
      })
      .catch(() => { /* localStorage version already applied */ })
  }

  return {
    files, setFiles,
    activeFile, setActiveFile,
    code, setCode,
    setCodeAndFiles,
    initWorkspace,
    switchFile,
    addFile,
    addFolder,
    renameFile,
    deleteFile,
    deleteFolder,
    loadDraft,
    readLocalFiles,
    writeLocalFiles,
  }
}
