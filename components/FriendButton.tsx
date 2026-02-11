'use client'

import { useState, useEffect } from 'react'
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  unfriend,
  getFriendshipStatus,
} from '@/lib/actions/friends'

interface FriendButtonProps {
  currentUserId: string
  profileUserId: string
  profileUserName: string
}

interface FriendshipRecord {
  id: string
  requesterId: string
  addresseeId: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: Date | null
}

export default function FriendButton({
  currentUserId,
  profileUserId,
  profileUserName,
}: FriendButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipRecord | null>(null)
  const [checked, setChecked] = useState(false)

  // Fetch friendship status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await getFriendshipStatus(currentUserId, profileUserId)
        setFriendshipStatus(status)
        setChecked(true)
      } catch (err) {
        setError('Failed to load friendship status')
        setChecked(true)
      }
    }

    fetchStatus()
  }, [currentUserId, profileUserId])

  const handleSendFriendRequest = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await sendFriendRequest(currentUserId, profileUserId)
      if (result.success) {
        window.location.reload()
      } else {
        setError(result.error || 'Failed to send friend request')
      }
    } catch (err) {
      setError('Failed to send friend request')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptFriendRequest = async () => {
    if (!friendshipStatus) return
    setLoading(true)
    setError(null)
    try {
      const result = await acceptFriendRequest(friendshipStatus.id, currentUserId)
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

  const handleDeclineFriendRequest = async () => {
    if (!friendshipStatus) return
    setLoading(true)
    setError(null)
    try {
      const result = await declineFriendRequest(friendshipStatus.id, currentUserId)
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

  const handleUnfriend = async () => {
    if (!friendshipStatus) return
    setLoading(true)
    setError(null)
    try {
      const result = await unfriend(friendshipStatus.id, currentUserId)
      if (result.success) {
        window.location.reload()
      } else {
        setError(result.error || 'Failed to remove friend')
      }
    } catch (err) {
      setError('Failed to remove friend')
    } finally {
      setLoading(false)
    }
  }

  // While loading initial check
  if (!checked) {
    return <div>Loading...</div>
  }

  return (
    <div>
      {/* No friendship */}
      {friendshipStatus === null && (
        <button
          onClick={handleSendFriendRequest}
          disabled={loading}
          className="inputsubmit"
        >
          {loading ? 'Sending...' : `Add ${profileUserName} as a Friend`}
        </button>
      )}

      {/* Pending, I sent */}
      {friendshipStatus?.status === 'pending' && friendshipStatus.requesterId === currentUserId && (
        <div>Friend Request Sent</div>
      )}

      {/* Pending, they sent */}
      {friendshipStatus?.status === 'pending' && friendshipStatus.addresseeId === currentUserId && (
        <div>
          <div>{profileUserName} wants to be your friend.</div>
          <button
            onClick={handleAcceptFriendRequest}
            disabled={loading}
            className="inputsubmit"
          >
            {loading ? 'Confirming...' : 'Confirm'}
          </button>
          <button
            onClick={handleDeclineFriendRequest}
            disabled={loading}
            className="inputsubmit"
          >
            {loading ? 'Ignoring...' : 'Ignore'}
          </button>
        </div>
      )}

      {/* Accepted */}
      {friendshipStatus?.status === 'accepted' && (
        <div>
          <div>You are friends with {profileUserName}.</div>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handleUnfriend()
            }}
            style={{ color: '#0066cc', cursor: 'pointer', fontSize: '0.9em' }}
          >
            Remove from Friends
          </a>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div style={{ color: 'red', marginTop: '8px' }}>
          {error}
        </div>
      )}
    </div>
  )
}
