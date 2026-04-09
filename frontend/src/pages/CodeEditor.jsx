/**
 * CodeEditor.jsx — VS Code–style multi-file Monaco editor.
 *
 * This file is intentionally thin: it wires together hooks and components.
 *
 * Logic lives in:
 *   hooks/useEditorFiles.js    — file state, persistence, add/delete/switch
 *   hooks/useEditorActions.js  — save, AI evaluate, submit
 *
 * UI components:
 *   components/Editor/EditorTaskPanel.jsx — right panel (task/feedback/hints)
 */

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import MonacoEditor from '@monaco-editor/react'
import { apiRequest } from '../utils/api'
import { useEditorFiles, buildDefaultFiles } from '../hooks/useEditorFiles'
import { useEditorActions } from '../hooks/useEditorActions'
import EditorTaskPanel from '../components/Editor/EditorTaskPanel'
import FileTree from '../components/Editor/FileTree'
import { buildFileTree } from '../utils/buildFileTree'

const FALLBACK_CODE = '// Write your solution here\n'

// ── Helpers ───────────────────────────────────────────────────────────────

function diffBadge(d) {
  if (!d) return 'badge-cyan'
  if (d === 'easy') return 'badge-green'
  if (d === 'hard') return 'badge-orange'
  return 'badge-cyan'
}

function langFromFilename(filename) {
  if (!filename) return 'javascript'
  const ext = filename.split('.').pop()?.toLowerCase()
  const map = {
    html: 'html', htm: 'html',
    css: 'css', scss: 'css', less: 'css',
    js: 'javascript', jsx: 'javascript', mjs: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    json: 'json', py: 'python', java: 'java',
    cpp: 'cpp', c: 'c', md: 'markdown', sql: 'sql', sh: 'shell',
  }
  return map[ext] || 'javascript'
}

// VS Code colour palette
const VS = {
  bg: '#1e1e1e', sidebar: '#252526', explorer: '#252526',
  activityBar: '#333333', tab: '#2d2d2d', tabActive: '#1e1e1e',
  border: '#3e3e42', text: '#cccccc', textDim: '#858585',
  textActive: '#ffffff', accent: '#6366f1', green: '#4ec9b0',
  red: '#f44747', toolbar: '#3c3c3c',
}

// ── Component ─────────────────────────────────────────────────────────────

export default function CodeEditor() {
  const [params] = useSearchParams()

  // ── Context (task metadata from localStorage / URL) ───────────────────
  const [ctx, setCtx] = useState(null)

  // ── File workspace hook ───────────────────────────────────────────────
  const {
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
  } = useEditorFiles()

  // ── Action hook ───────────────────────────────────────────────────────
  const {
    saving, saveResult, setSaveResult,
    evaluating,
    aiResult, setAiResult,
    submitting,
    handleSave,
    handleEvaluate,
    handleSubmitTask,
    goBack,
  } = useEditorActions({ ctx, code, files, activeFile, setTasks: () => {} })

  // ── Panel visibility — activity bar controls left panel ─────────────
  // activeLeftPanel: 'explorer' | 'tasks' | null
  // rightOpen: controlled by the 📝 icon in the activity bar bottom
  const [activeLeftPanel, setActiveLeftPanel] = useState(
    () => localStorage.getItem('dm-editor-left-panel') ?? 'explorer'
  )
  const [rightOpen, setRightOpen] = useState(
    () => localStorage.getItem('dm-editor-right') !== 'false'
  )

  const toggleLeftPanel = (panel) => {
    setActiveLeftPanel((prev) => {
      const next = prev === panel ? null : panel
      localStorage.setItem('dm-editor-left-panel', next ?? '')
      return next
    })
  }
  const toggleRight = () => setRightOpen((v) => {
    const n = !v
    localStorage.setItem('dm-editor-right', String(n))
    return n
  })

  // ── Panel tab state ───────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('task')
  const [tasks, setTasks]           = useState([])
  const [tasksLoading, setTasksLoading] = useState(false)

  useEffect(() => {
    if (!ctx?.videoId) return
    setTasksLoading(true)
    apiRequest(`/tasks/${ctx.videoId}`)
      .then((r) => setTasks(r.tasks || []))
      .catch(() => setTasks([]))
      .finally(() => setTasksLoading(false))
  }, [ctx?.videoId])

  const orderedTasks = useMemo(
    () => [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [tasks],
  )

  // ── Context load + draft restore ──────────────────────────────────────
  useEffect(() => {
    const stored = (() => {
      try { return JSON.parse(localStorage.getItem('dm-code-eval-context') || 'null') } catch { return null }
    })()
    const taskId   = params.get('taskId')   || stored?.taskId   || null
    const videoId  = params.get('videoId')  || stored?.videoId  || null
    const language = params.get('language') || stored?.language || null
    const resolved = {
      taskId, videoId, language,
      taskTitle:          stored?.taskTitle          || '',
      taskDescription:    stored?.taskDescription    || stored?.problemDescription || '',
      difficulty:         stored?.difficulty         || 'medium',
      hints:              Array.isArray(stored?.hints) ? stored.hints : [],
      starterCode:        stored?.starterCode        || FALLBACK_CODE,
      problemDescription: stored?.problemDescription || '',
      miniProjectId:      stored?.miniProjectId      || null,
      miniProjectLang:    stored?.miniProjectLang    || null,
    }
    setCtx(resolved)

    if (resolved.miniProjectId) {
      const initCode = resolved.starterCode || FALLBACK_CODE
      setCode(initCode)
      const initF = buildDefaultFiles(resolved.language, initCode)
      initWorkspace(initF)
      return
    }

    if (taskId) {
      loadDraft(taskId, resolved.language, resolved.starterCode)
    } else {
      const initF = buildDefaultFiles(resolved.language, resolved.starterCode || FALLBACK_CODE)
      initWorkspace(initF)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Switch task ───────────────────────────────────────────────────────
  const switchTask = (t) => {
    const problem = [
      t.title, t.description || '',
      t.expectedOutput ? `Expected output:\n${t.expectedOutput}` : '',
    ].filter(Boolean).join('\n')

    const next = {
      taskId: t.id, videoId: ctx?.videoId, language: ctx?.language,
      taskTitle: t.title, taskDescription: t.description || '',
      difficulty: t.difficulty || 'medium', hints: t.hints || [],
      starterCode: t.starterCode || FALLBACK_CODE, problemDescription: problem,
    }
    localStorage.setItem('dm-code-eval-context', JSON.stringify(next))
    setCtx(next)
    setSaveResult(null)
    setAiResult(null)
    setActiveTab('task')
    window.history.replaceState(null, '',
      `/code-editor?taskId=${encodeURIComponent(String(t.id))}&videoId=${encodeURIComponent(String(ctx?.videoId || ''))}&language=${encodeURIComponent(ctx?.language || '')}`,
    )
    loadDraft(t.id, t.language || ctx?.language, t.starterCode || FALLBACK_CODE)
  }

  if (!ctx) return null

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: VS.bg, color: VS.text, overflow: 'hidden' }}>

      {/* Title bar */}
      <div style={{ height: 36, background: VS.toolbar, borderBottom: `1px solid ${VS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', flexShrink: 0, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button onClick={goBack} style={{ padding: '3px 10px', borderRadius: 4, fontSize: 11, background: 'rgba(255,255,255,0.08)', border: `1px solid ${VS.border}`, cursor: 'pointer', color: VS.text, flexShrink: 0 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}>
            ← Back
          </button>
          {/* Panel toggles */}
          <button onClick={toggleRight} title={rightOpen ? 'Hide Task Panel' : 'Show Task Panel'}
            style={{ padding: '3px 7px', borderRadius: 4, fontSize: 13, background: rightOpen ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)', border: `1px solid ${rightOpen ? VS.accent : VS.border}`, cursor: 'pointer', color: rightOpen ? VS.textActive : VS.textDim, flexShrink: 0, transition: 'background 0.15s, border-color 0.15s' }}>
            📝
          </button>
          <span style={{ fontSize: 12, color: VS.textDim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {ctx.taskTitle || 'Code Editor'}
            {ctx.language && <span style={{ marginLeft: 6 }}>— {ctx.language}</span>}
          </span>
          {ctx.difficulty && <span className={`badge ${diffBadge(ctx.difficulty)}`} style={{ fontSize: 10, flexShrink: 0 }}>{ctx.difficulty}</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {aiResult?.passed && ctx?.taskId && (
            <button onClick={handleSubmitTask} disabled={submitting || evaluating || saving}
              style={{ padding: '4px 12px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', opacity: submitting ? 0.75 : 1 }}>
              {submitting ? 'Submitting…' : '✅ Submit Task'}
            </button>
          )}
          <button onClick={handleSave} disabled={saving || evaluating}
            style={{ padding: '4px 12px', borderRadius: 4, fontSize: 11, background: 'rgba(255,255,255,0.08)', border: `1px solid ${VS.border}`, color: VS.text, cursor: 'pointer', opacity: saving ? 0.75 : 1 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}>
            {saving ? 'Saving…' : '💾 Save'}
          </button>
          <button onClick={() => handleEvaluate(setActiveTab)} disabled={evaluating || saving}
            style={{ padding: '4px 12px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: VS.accent, color: '#fff', border: 'none', cursor: 'pointer', opacity: evaluating ? 0.75 : 1 }}>
            {evaluating ? '⏳ Evaluating…' : '✨ Evaluate with AI'}
          </button>
        </div>
      </div>

      {/* Save banner */}
      {saveResult && (
        <div style={{ padding: '6px 16px', fontSize: 12, fontWeight: 500, flexShrink: 0, background: saveResult.success ? '#14532d' : '#7f1d1d', borderBottom: `1px solid ${VS.border}`, color: saveResult.success ? '#86efac' : '#fca5a5', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{saveResult.success ? '✅' : '❌'}</span>
          <span>{saveResult.message}</span>
        </div>
      )}

      {/* Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Activity bar — icons control which left panel is visible */}
        <div style={{ width: 48, background: VS.activityBar, borderRight: `1px solid ${VS.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, gap: 2, flexShrink: 0 }}>
          {[
            { icon: '📁', panel: 'explorer', title: 'Explorer' },
            { icon: '🧠', panel: 'tasks',    title: 'Video Tasks' },
          ].map(({ icon, panel, title }) => {
            const isActive = activeLeftPanel === panel
            return (
              <div
                key={panel}
                title={title}
                onClick={() => toggleLeftPanel(panel)}
                style={{
                  width: 36, height: 36, borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 16,
                  background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                  borderLeft: isActive ? `2px solid ${VS.accent}` : '2px solid transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.12)' : 'transparent' }}
              >
                {icon}
              </div>
            )
          })}
          {/* Right panel toggle at the bottom */}
          <div style={{ marginTop: 'auto', marginBottom: 8 }}>
            <div
              title={rightOpen ? 'Hide Task Panel' : 'Show Task Panel'}
              onClick={toggleRight}
              style={{
                width: 36, height: 36, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 16,
                background: rightOpen ? 'rgba(255,255,255,0.12)' : 'transparent',
                borderLeft: rightOpen ? `2px solid ${VS.accent}` : '2px solid transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = rightOpen ? 'rgba(255,255,255,0.12)' : 'transparent' }}
            >
              📝
            </div>
          </div>
        </div>

        {/* Left panel — content switches based on activeLeftPanel */}
        <div style={{ width: activeLeftPanel ? 220 : 0, background: VS.explorer, borderRight: activeLeftPanel ? `1px solid ${VS.border}` : 'none', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden', transition: 'width 0.25s ease' }}>

          {/* Explorer panel */}
          {activeLeftPanel === 'explorer' && (<>
            <div style={{ padding: '8px 12px 6px', fontSize: 10, fontWeight: 700, color: VS.textDim, letterSpacing: 1, textTransform: 'uppercase', borderBottom: `1px solid ${VS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Explorer</span>
              <button onClick={addFile} title="New file"
                style={{ fontSize: 16, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', color: VS.textDim, padding: '0 2px' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = VS.textActive }}
                onMouseLeave={(e) => { e.currentTarget.style.color = VS.textDim }}>+</button>
            </div>
            <div style={{ padding: '6px 12px 4px', fontSize: 10, fontWeight: 700, color: VS.textDim, letterSpacing: 0.5 }}>
              {ctx.language?.toUpperCase() || 'PROJECT'}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '2px 0' }}>
              <FileTree
                tree={buildFileTree(files)}
                activeFile={activeFile}
                onFileClick={switchFile}
                onNewFile={addFile}
                onNewFolder={addFolder}
                onRename={renameFile}
                onDelete={deleteFile}
                onDeleteFolder={deleteFolder}
              />
            </div>
          </>)}

          {/* Tasks panel */}
          {activeLeftPanel === 'tasks' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px 6px', fontSize: 10, fontWeight: 700, color: VS.textDim, letterSpacing: 1, textTransform: 'uppercase', borderBottom: `1px solid ${VS.border}` }}>
                Video Tasks
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
                {tasksLoading && <div style={{ padding: '4px 12px', fontSize: 11, color: VS.textDim }}>Loading…</div>}
                {orderedTasks.map((t, idx) => {
                  const isActive = String(t.id) === String(ctx.taskId)
                  return (
                    <div key={t.id} onClick={() => switchTask(t)}
                      style={{ padding: '5px 12px', cursor: 'pointer', fontSize: 11, background: isActive ? 'rgba(99,102,241,0.2)' : 'transparent', color: t.completed ? VS.textDim : VS.text, textDecoration: t.completed ? 'line-through' : 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = isActive ? 'rgba(99,102,241,0.2)' : 'transparent' }}>
                      <span style={{ fontSize: 9, color: t.completed ? VS.green : VS.textDim, flexShrink: 0 }}>{t.completed ? '✓' : `${idx + 1}.`}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                    </div>
                  )
                })}
                {!tasksLoading && orderedTasks.length === 0 && (
                  <div style={{ padding: '4px 12px', fontSize: 11, color: VS.textDim }}>No tasks found.</div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Editor area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Tabs */}
          <div style={{ height: 35, background: VS.tab, borderBottom: `1px solid ${VS.border}`, display: 'flex', alignItems: 'flex-end', overflowX: 'auto', flexShrink: 0 }}>
            {Object.keys(files).map((filename) => {
              const isActive = filename === activeFile
              return (
                <button key={filename} onClick={() => switchFile(filename)}
                  style={{ padding: '0 16px', height: '100%', fontSize: 12, fontFamily: 'monospace', background: isActive ? VS.tabActive : 'transparent', color: isActive ? VS.textActive : VS.textDim, border: 'none', borderTop: isActive ? `1px solid ${VS.accent}` : '1px solid transparent', borderRight: `1px solid ${VS.border}`, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = VS.text }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = VS.textDim }}>
                  {filename.split('/').pop()}
                </button>
              )
            })}
          </div>
          {/* Monaco */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <MonacoEditor
              height="100%"
              theme="vs-dark"
              language={langFromFilename(activeFile)}
              value={files[activeFile] ?? ''}
              onChange={setCodeAndFiles}
              options={{ fontSize: 14, fontFamily: 'ui-monospace, Consolas, "Courier New", monospace', lineHeight: 1.75, minimap: { enabled: false }, automaticLayout: true, scrollBeyondLastLine: false, wordWrap: 'on', tabSize: 2, renderLineHighlight: 'line', smoothScrolling: true, cursorBlinking: 'smooth', padding: { top: 16, bottom: 16 } }}
            />
          </div>
          {/* Status bar */}
          <div style={{ height: 22, background: VS.accent, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 16, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: '#fff' }}>{langFromFilename(activeFile).toUpperCase()}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{activeFile}</span>
            {evaluating && <span style={{ fontSize: 11, color: '#fff', marginLeft: 'auto' }}>⏳ Evaluating…</span>}
            {saveResult?.success && !evaluating && <span style={{ fontSize: 11, color: '#fff', marginLeft: 'auto' }}>✅ Saved</span>}
          </div>
        </div>

        {/* Right task panel */}
        <div style={{ width: rightOpen ? 300 : 0, flexShrink: 0, overflow: 'hidden', transition: 'width 0.25s ease', borderLeft: rightOpen ? `1px solid ${VS.border}` : 'none' }}>
          <EditorTaskPanel
            ctx={ctx}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            evaluating={evaluating}
            aiResult={aiResult}
            submitting={submitting}
            handleEvaluate={handleEvaluate}
            handleSubmitTask={handleSubmitTask}
            setCode={setCode}
            setFiles={setFiles}
            activeFile={activeFile}
          />
        </div>
      </div>
    </div>
  )
}
