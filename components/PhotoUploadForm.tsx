'use client'

import { useState } from 'react'
import { addPhoto } from '@/lib/actions/photos'

interface PhotoUploadFormProps {
  albumId: string
  userId: string
}

export default function PhotoUploadForm({
  albumId,
  userId,
}: PhotoUploadFormProps) {
  const [photoUrl, setPhotoUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!photoUrl.trim()) {
      setError('Please enter a photo URL')
      return
    }

    setLoading(true)
    try {
      const result = await addPhoto(albumId, userId, photoUrl.trim(), caption.trim() || undefined)
      if (result.success) {
        setPhotoUrl('')
        setCaption('')
        window.location.reload()
      } else {
        setError(result.error || 'Failed to upload photo')
      }
    } catch (err) {
      setError('An error occurred while uploading')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="photo_upload_form">
      <div className="grayheader">Upload Photo</div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="inputtext"
          placeholder="Photo URL (https://example.com/photo.jpg)"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          disabled={loading}
        />
        <textarea
          className="inputtext"
          placeholder="Add a caption (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          disabled={loading}
          maxLength={1000}
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
            {loading ? 'Uploading...' : 'Upload Photo'}
          </button>
        </div>
      </form>
    </div>
  )
}
