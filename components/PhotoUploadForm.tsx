'use client'

import { useState, useRef } from 'react'
import { addPhoto } from '@/lib/actions/photos'

interface PhotoUploadFormProps {
  albumId: string
  userId: string
}

export default function PhotoUploadForm({
  albumId,
  userId,
}: PhotoUploadFormProps) {
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        setPreview(null)
        return
      }
      if (file.size > 4 * 1024 * 1024) {
        setError('File must be under 4MB')
        setPreview(null)
        return
      }
      setError('')
      const reader = new FileReader()
      reader.onload = (ev) => setPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setError('Please select a photo to upload')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const data = await uploadRes.json()
        setError(data.error || 'Upload failed')
        setLoading(false)
        return
      }

      const { url } = await uploadRes.json()

      const result = await addPhoto(albumId, userId, url, caption.trim() || undefined)
      if (result.success) {
        setCaption('')
        setPreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        window.location.reload()
      } else {
        setError(result.error || 'Failed to upload photo')
      }
    } catch {
      setError('An error occurred while uploading')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="photo_upload_form">
      <div className="grayheader">Upload Photo</div>
      <form onSubmit={handleSubmit}>
        <div className="form_row">
          <label>Select Photo</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={loading}
            className="inputfile"
            data-testid="photo-file-input"
          />
        </div>
        {preview && (
          <div className="upload_preview">
            <img src={preview} alt="Preview" />
          </div>
        )}
        <div className="form_row">
          <label>Caption (optional)</label>
          <textarea
            className="inputtext"
            placeholder="Add a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            disabled={loading}
            maxLength={1000}
            style={{ width: '100%' }}
          />
        </div>
        {error && (
          <div className="form_error">
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
