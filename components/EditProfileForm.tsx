'use client'

import { useState, useRef } from 'react'
import { updateProfile } from '@/lib/actions/profile'

interface EditProfileFormProps {
  userId: string
  currentBio: string
  currentPhotoUrl: string
}

export default function EditProfileForm({ userId, currentBio, currentPhotoUrl }: EditProfileFormProps) {
  const [bio, setBio] = useState(currentBio)
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setMessage('File must be under 4MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    setMessage('')
    try {
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const data = await uploadRes.json()
        setMessage(data.error || 'Upload failed')
        setUploading(false)
        return
      }

      const { url } = await uploadRes.json()
      setPhotoUrl(url)
      setMessage('Photo uploaded!')
    } catch {
      setMessage('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const result = await updateProfile(userId, bio, photoUrl)
    setLoading(false)
    if (result.success) {
      setMessage('Profile updated!')
      setTimeout(() => { window.location.href = '/profile.php' }, 1000)
    } else {
      setMessage(result.error || 'Failed to update')
    }
  }

  return (
    <div style={{ padding: '15px 20px' }}>
      <form onSubmit={handleSubmit}>
        <div className="form_row">
          <label>Profile Photo</label>
          {preview && (
            <div className="upload_preview" style={{ marginBottom: '8px' }}>
              <img src={preview} alt="Profile preview" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={loading || uploading}
            className="inputfile"
            data-testid="profile-photo-input"
          />
          {uploading && <span style={{ fontSize: '11px', color: '#666', marginLeft: '8px' }}>Uploading...</span>}
        </div>
        <div className="form_row">
          <label>About Me</label>
          <textarea
            className="inputtext"
            placeholder="Tell people about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={loading}
            style={{ width: '100%', height: '100px' }}
          />
        </div>
        {message && (
          <div style={{ fontSize: '11px', color: message.includes('updated') || message.includes('uploaded') ? '#080' : '#d00', marginBottom: '8px' }}>
            {message}
          </div>
        )}
        <button type="submit" className="inputsubmit" disabled={loading || uploading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
