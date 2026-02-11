'use client'

import { useState } from 'react'
import { createWallPost } from '@/lib/actions/wall'

interface WallPostFormProps {
  authorId: string
  profileOwnerId: string
  onPostCreated: () => void
}

export default function WallPostForm({
  authorId,
  profileOwnerId,
  onPostCreated,
}: WallPostFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!content.trim()) {
      setError('Please write something before posting')
      return
    }

    if (content.length > 5000) {
      setError('Wall post cannot exceed 5000 characters')
      return
    }

    setLoading(true)
    try {
      const result = await createWallPost(authorId, profileOwnerId, content)
      if (result.success) {
        setContent('')
        onPostCreated()
      } else {
        setError(result.error || 'Failed to create wall post')
      }
    } catch (err) {
      setError('An error occurred while posting')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="wall_post_form">
      <form onSubmit={handleSubmit}>
        <textarea
          className="inputtext"
          placeholder="Write something on this wall..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading}
          maxLength={5000}
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
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  )
}
