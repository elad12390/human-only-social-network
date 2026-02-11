'use client'

import { useState } from 'react'
import { tagUserInPhoto } from '@/lib/actions/photos'

interface PhotoTagFormProps {
  photoId: string
  currentUserId: string
  friends: Array<{ friendId: string; friendName: string | null }>
}

export default function PhotoTagForm({
  photoId,
  currentUserId,
  friends,
}: PhotoTagFormProps) {
  const [selectedFriendId, setSelectedFriendId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedFriendId.trim()) {
      setError('Please select a friend to tag')
      return
    }

    setLoading(true)
    try {
      const result = await tagUserInPhoto(photoId, selectedFriendId, currentUserId)
      if (result.success) {
        setSelectedFriendId('')
        window.location.reload()
      } else {
        setError(result.error || 'Failed to tag user in photo')
      }
    } catch (err) {
      setError('An error occurred while tagging')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '10px 0' }}>
      <form onSubmit={handleSubmit}>
        <label>Tag a friend:</label>
        <select
          className="inputtext"
          value={selectedFriendId}
          onChange={(e) => setSelectedFriendId(e.target.value)}
          disabled={loading}
        >
          <option value="">Select a friend to tag...</option>
          {friends.map((friend) => (
            <option key={friend.friendId} value={friend.friendId}>
              {friend.friendName}
            </option>
          ))}
        </select>
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
        <div style={{ marginTop: '8px' }}>
          <button
            type="submit"
            className="inputsubmit"
            disabled={loading}
          >
            {loading ? 'Tagging...' : 'Tag'}
          </button>
        </div>
      </form>
    </div>
  )
}
