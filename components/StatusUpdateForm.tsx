'use client'

import { useState } from 'react'
import { createStatusUpdate } from '@/lib/actions/status'

interface StatusUpdateFormProps {
  userId: string
  userName: string
  onStatusCreated?: () => void
}

export default function StatusUpdateForm({
  userId,
  userName,
  onStatusCreated,
}: StatusUpdateFormProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!content.trim()) {
      setError('Status cannot be empty')
      return
    }

    if (content.length > 255) {
      setError('Status cannot exceed 255 characters')
      return
    }

    setLoading(true)
    try {
      const result = await createStatusUpdate(userId, content)
      if (result.success) {
        setContent('')
        onStatusCreated?.()
        // Reload page to show updated status
        window.location.reload()
      } else {
        setError(result.error || 'Failed to update status')
      }
    } catch (err) {
      setError('Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="status_update_form">
      <div className="status_input_wrapper">
        <span className="status_prefix">{userName} is</span>
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          maxLength={255}
          disabled={loading}
          className="inputtext status_input"
        />
      </div>
      <div className="status_form_footer">
        <span className="char_count">
          {content.length}/255
        </span>
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="inputsubmit"
        >
          {loading ? 'Updating...' : 'Update'}
        </button>
      </div>
      {error && (
        <div id="error" className="status_error">
          {error}
        </div>
      )}
    </form>
  )
}
