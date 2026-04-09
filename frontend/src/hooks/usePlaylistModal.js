/**
 * usePlaylistModal.js
 *
 * Manages the upload / change playlist modal state and API calls.
 * Keeps all playlist mutation logic out of the page component.
 */

import { useState } from 'react'
import { apiRequest } from '../utils/api'

export function usePlaylistModal({ language, applyNewPlaylist }) {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showChangeModal, setShowChangeModal] = useState(false)
  const [newPlaylistUrl,  setNewPlaylistUrl]  = useState('')
  const [changing,        setChanging]        = useState(false)
  const [changeError,     setChangeError]     = useState('')

  const openUpload = () => { setNewPlaylistUrl(''); setChangeError(''); setShowUploadModal(true) }
  const openChange = () => { setNewPlaylistUrl(''); setChangeError(''); setShowChangeModal(true) }

  const handleUploadPlaylist = async () => {
    if (!newPlaylistUrl.trim()) { setChangeError('Please paste a YouTube playlist URL.'); return }
    if (!language)              { setChangeError('No language selected.'); return }
    setChanging(true)
    setChangeError('')
    try {
      const res = await apiRequest('/playlists/load', {
        method: 'POST',
        body: JSON.stringify({ language, playlistUrl: newPlaylistUrl.trim() }),
      })
      applyNewPlaylist(res)
      setShowUploadModal(false)
      setNewPlaylistUrl('')
    } catch (e) {
      setChangeError(e.message || 'Failed to load playlist.')
    } finally {
      setChanging(false)
    }
  }

  const handleChangePlaylist = async () => {
    if (!newPlaylistUrl.trim()) { setChangeError('Please paste a YouTube playlist URL.'); return }
    if (!language)              { setChangeError('No language selected.'); return }
    setChanging(true)
    setChangeError('')
    try {
      const res = await apiRequest('/playlists/change', {
        method: 'PUT',
        body: JSON.stringify({ language, playlistUrl: newPlaylistUrl.trim() }),
      })
      applyNewPlaylist(res)
      setShowChangeModal(false)
      setNewPlaylistUrl('')
    } catch (e) {
      setChangeError(e.message || 'Failed to update playlist.')
    } finally {
      setChanging(false)
    }
  }

  return {
    showUploadModal, setShowUploadModal,
    showChangeModal, setShowChangeModal,
    newPlaylistUrl,  setNewPlaylistUrl,
    changing, changeError,
    openUpload, openChange,
    handleUploadPlaylist,
    handleChangePlaylist,
  }
}
