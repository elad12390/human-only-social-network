'use client'

import { acceptFriendRequest, declineFriendRequest } from '@/lib/actions/friends'
import { useState } from 'react'

interface FriendRequestActionsProps {
  friendshipId: string
  currentUserId: string
}

export default function FriendRequestActions({
  friendshipId,
  currentUserId,
}: FriendRequestActionsProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await acceptFriendRequest(friendshipId, currentUserId)
      if (result.success) {
        window.location.reload()
      } else {
        setError(result.error || 'Failed to accept friend request')
      }
    } catch (err) {
      setError('Failed to accept friend request')
    } finally {
      setLoading(false)
    }
  }

  const handleIgnore = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await declineFriendRequest(friendshipId, currentUserId)
      if (result.success) {
        window.location.reload()
      } else {
        setError(result.error || 'Failed to decline friend request')
      }
    } catch (err) {
      setError('Failed to decline friend request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="friend_request_actions">
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="inputsubmit"
      >
        {loading ? 'Confirming...' : 'Confirm'}
      </button>
      <button
        onClick={handleIgnore}
        disabled={loading}
        className="inputsubmit"
      >
        {loading ? 'Ignoring...' : 'Ignore'}
      </button>
      {error && <div style={{ color: 'red', marginTop: '8px' }}>{error}</div>}
    </div>
  )
}
