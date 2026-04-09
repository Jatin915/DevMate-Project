/**
 * FileTree.jsx
 *
 * VS Code–style recursive file tree with right-click context menu.
 *
 * Context menu options:
 *   File  → New File (sibling), Rename, Delete
 *   Folder → New File (inside), New Folder (inside), Rename, Delete Folder
 *   Root  → New File, New Folder
 *
 * Props:
 *   tree          — nested object from buildFileTree()
 *   activeFile    — currently open file path
 *   onFileClick   — (fullPath) => void
 *   onNewFile     — (folderPrefix | null) => void
 *   onNewFolder   — (parentPrefix | null) => void
 *   onRename      — (fullPath) => void
 *   onDelete      — (fullPath) => void
 *   onDeleteFolder— (folderPrefix) => void
 */

import { useEffect, useRef, useState } from 'react'
import { folderContainsActive } from '../../utils/buildFileTree'

// ── VS Code dark palette ──────────────────────────────────────────────────
const VS = {
  text:         '#cccccc',
  textDim:      '#858585',
  textActive:   '#ffffff',
  accent:       '#6366f1',
  border:       '#3e3e42',
  red:          '#f44747',
  folderOpen:   '#e8c07d',
  folderClosed: '#dcb67a',
  menuBg:       '#252526',
  menuHover:    '#094771',
  menuBorder:   '#454545',
}

// ── File icon map ─────────────────────────────────────────────────────────
function fileIcon(filename) {
  const ext = filename.split('.').pop()?.toLowerCase()
  const map = {
    html: '🌐', htm: '🌐',
    css: '🎨', scss: '🎨', less: '🎨',
    js: '📜', jsx: '⚛️', mjs: '📜',
    ts: '📘', tsx: '⚛️',
    json: '📋', py: '🐍', java: '☕',
    md: '📝', txt: '📄', sh: '⚙️', sql: '🗄️',
  }
  return map[ext] || '📄'
}

// ── Context menu ──────────────────────────────────────────────────────────
function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('contextmenu', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('contextmenu', close)
    }
  }, [onClose])

  // Clamp to viewport
  const style = {
    position: 'fixed',
    top:      Math.min(y, window.innerHeight - items.length * 28 - 12),
    left:     Math.min(x, window.innerWidth - 180),
    zIndex:   9999,
    background: VS.menuBg,
    border:   `1px solid ${VS.menuBorder}`,
    borderRadius: 4,
    padding:  '4px 0',
    minWidth: 170,
    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
  }

  return (
    <div ref={ref} style={style}>
      {items.map((item, i) =>
        item === '---' ? (
          <div key={i} style={{ height: 1, background: VS.menuBorder, margin: '3px 0' }} />
        ) : (
          <div
            key={i}
            onClick={() => { item.action(); onClose() }}
            style={{
              padding: '5px 14px', fontSize: 12, color: item.danger ? VS.red : VS.text,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = item.danger ? 'rgba(244,71,71,0.15)' : VS.menuHover }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{ fontSize: 11, width: 14, textAlign: 'center' }}>{item.icon}</span>
            {item.label}
          </div>
        )
      )}
    </div>
  )
}

// ── Tree node ─────────────────────────────────────────────────────────────
function TreeNode({
  name, node, activeFile,
  onFileClick, onNewFile, onNewFolder, onRename, onDelete, onDeleteFolder,
  prefix, depth,
  contextMenu, setContextMenu,
}) {
  const fullPath = prefix ? `${prefix}/${name}` : name
  const isFile   = node === null
  const isActive = isFile && fullPath === activeFile
  const [open, setOpen] = useState(() => !isFile && folderContainsActive(fullPath, activeFile))

  const indent = depth * 12 + 12

  const openMenu = (e, items) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, items })
  }

  if (isFile) {
    const menuItems = [
      { icon: '📄', label: 'New File (sibling)', action: () => onNewFile(prefix || null) },
      '---',
      { icon: '✏️', label: 'Rename',             action: () => onRename(fullPath) },
      { icon: '🗑️', label: 'Delete',             action: () => onDelete(fullPath), danger: true },
    ]

    return (
      <div
        onClick={() => onFileClick(fullPath)}
        onContextMenu={(e) => openMenu(e, menuItems)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: `4px 12px 4px ${indent}px`, cursor: 'pointer',
          background: isActive ? 'rgba(99,102,241,0.2)' : 'transparent',
          borderLeft: isActive ? `2px solid ${VS.accent}` : '2px solid transparent',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
      >
        <span style={{ fontSize: 12, color: isActive ? VS.textActive : VS.text, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, flexShrink: 0 }}>{fileIcon(name)}</span>
          {name}
        </span>
      </div>
    )
  }

  // Folder
  const hasActiveChild = folderContainsActive(fullPath, activeFile)
  const sortedChildren = Object.keys(node).sort((a, b) => {
    const af = node[a] !== null, bf = node[b] !== null
    if (af !== bf) return af ? -1 : 1
    return a.localeCompare(b)
  })

  const folderMenuItems = [
    { icon: '📄', label: 'New File here',   action: () => { setOpen(true); onNewFile(fullPath) } },
    { icon: '📁', label: 'New Folder here', action: () => { setOpen(true); onNewFolder(fullPath) } },
    '---',
    { icon: '✏️', label: 'Rename Folder',   action: () => onRename(fullPath) },
    { icon: '🗑️', label: 'Delete Folder',   action: () => onDeleteFolder(fullPath), danger: true },
  ]

  return (
    <div>
      <div
        onClick={() => setOpen((v) => !v)}
        onContextMenu={(e) => openMenu(e, folderMenuItems)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: `4px 12px 4px ${indent}px`, cursor: 'pointer',
          background: hasActiveChild && !open ? 'rgba(99,102,241,0.08)' : 'transparent',
          transition: 'background 0.1s', userSelect: 'none',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = hasActiveChild && !open ? 'rgba(99,102,241,0.08)' : 'transparent' }}
      >
        <span style={{ fontSize: 9, color: VS.textDim, width: 10, flexShrink: 0 }}>{open ? '▾' : '▸'}</span>
        <span style={{ fontSize: 13, flexShrink: 0 }}>{open ? '📂' : '📁'}</span>
        <span style={{ fontSize: 12, color: open ? VS.folderOpen : VS.folderClosed, fontWeight: 500 }}>{name}</span>
      </div>

      {open && sortedChildren.map((childName) => (
        <TreeNode
          key={childName}
          name={childName}
          node={node[childName]}
          activeFile={activeFile}
          onFileClick={onFileClick}
          onNewFile={onNewFile}
          onNewFolder={onNewFolder}
          onRename={onRename}
          onDelete={onDelete}
          onDeleteFolder={onDeleteFolder}
          prefix={fullPath}
          depth={depth + 1}
          contextMenu={contextMenu}
          setContextMenu={setContextMenu}
        />
      ))}
    </div>
  )
}

// ── Public component ──────────────────────────────────────────────────────
export default function FileTree({
  tree, activeFile,
  onFileClick, onNewFile, onNewFolder, onRename, onDelete, onDeleteFolder,
}) {
  const [contextMenu, setContextMenu] = useState(null)

  const rootMenuItems = [
    { icon: '📄', label: 'New File',   action: () => onNewFile(null) },
    { icon: '📁', label: 'New Folder', action: () => onNewFolder(null) },
  ]

  const sortedRoots = Object.keys(tree).sort((a, b) => {
    const af = tree[a] !== null, bf = tree[b] !== null
    if (af !== bf) return af ? -1 : 1
    return a.localeCompare(b)
  })

  return (
    <>
      <div
        style={{ padding: '2px 0', flex: 1 }}
        onContextMenu={(e) => {
          // Only fire root menu if click landed on the container itself
          if (e.target === e.currentTarget) {
            e.preventDefault()
            setContextMenu({ x: e.clientX, y: e.clientY, items: rootMenuItems })
          }
        }}
      >
        {sortedRoots.length === 0 ? (
          <div style={{ padding: '8px 12px', fontSize: 11, color: VS.textDim, fontStyle: 'italic' }}>
            No files yet. Right-click or click + to add one.
          </div>
        ) : (
          sortedRoots.map((name) => (
            <TreeNode
              key={name}
              name={name}
              node={tree[name]}
              activeFile={activeFile}
              onFileClick={onFileClick}
              onNewFile={onNewFile}
              onNewFolder={onNewFolder}
              onRename={onRename}
              onDelete={onDelete}
              onDeleteFolder={onDeleteFolder}
              prefix=""
              depth={0}
              contextMenu={contextMenu}
              setContextMenu={setContextMenu}
            />
          ))
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  )
}
