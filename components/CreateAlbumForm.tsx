'use client'

import { useState } from 'react'
import { createAlbum } from '@/lib/actions/photos'

interface CreateAlbumFormProps {
  userId: string
}

export default function CreateAlbumForm({ userId }: CreateAlbumFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please enter an album name')
      return
    }

    if (name.length > 200) {
      setError('Album name must be 200 characters or less')
      return
    }

    setLoading(true)
    try {
      const result = await createAlbum(
        userId,
        name,
        description.trim() || undefined
      )
      if (result.success) {
        setName('')
        setDescription('')
        window.location.reload()
      } else {
        setError(result.error || 'Failed to create album')
      }
    } catch (err) {
      setError('An error occurred while creating the album')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create_album_form">
      <div className="grayheader">Create New Album</div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="inputtext"
          placeholder="Album Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          maxLength={200}
        />
        <textarea
          className="inputtext"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />
        {error && (
          <div
            style={{
              color: '#d00',
              fontSize: '11px',
              marginTop: '4px',
              marginBottom: '4px',
            }}
          >
            {error}
          </div>
        )}
        <div className="formbuttons">
          <button
            type="submit"
            className="inputsubmit"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Album'}
          </button>
        </div>
      </form>
    </div>
  )
}
