'use client'

import { useState } from 'react'
import { sendPoke } from '@/lib/actions/poke'

interface PokeButtonProps {
  currentUserId: string
  profileUserId: string
  profileUserName: string
}

export default function PokeButton({
  currentUserId,
  profileUserId,
  profileUserName,
}: PokeButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [poked, setPoked] = useState(false)

  const handlePoke = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await sendPoke(currentUserId, profileUserId)
      if (result.success) {
        setPoked(true)
      } else {
        setError(result.error || 'Failed to send poke')
      }
    } catch (err) {
      setError('Failed to send poke')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {poked ? (
        <div>You poked {profileUserName}!</div>
      ) : (
        <>
          <button
            onClick={handlePoke}
            disabled={loading}
            className="inputsubmit"
          >
            {loading ? 'Poking...' : `Poke ${profileUserName}`}
          </button>
          {error && (
            <div style={{ color: 'red', marginTop: '8px' }}>
              {error}
            </div>
          )}
        </>
      )}
    </div>
  )
}
