'use client'

import { useState } from 'react'
import { rsvpEvent } from '@/lib/actions/events'

interface RsvpButtonsProps {
  eventId: string
  userId: string
  currentStatus: string | null
}

export default function RsvpButtons({
  eventId,
  userId,
  currentStatus,
}: RsvpButtonsProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRsvp = async (status: 'attending' | 'maybe' | 'declined') => {
    setLoading(true)
    setError('')
    try {
      const result = await rsvpEvent(userId, eventId, status)
      if (result.success) {
        window.location.reload()
      } else {
        setError(result.error || 'Failed to RSVP')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="event_rsvp">
      {currentStatus && (
        <div className="rsvp_status">
          Your RSVP: <strong>{currentStatus}</strong>
        </div>
      )}
      <div className="rsvp_buttons">
        <button
          type="button"
          className="inputsubmit"
          disabled={loading || currentStatus === 'attending'}
          onClick={() => handleRsvp('attending')}
        >
          Attending
        </button>
        <button
          type="button"
          className="inputsubmit"
          disabled={loading || currentStatus === 'maybe'}
          onClick={() => handleRsvp('maybe')}
        >
          Maybe
        </button>
        <button
          type="button"
          className="inputsubmit"
          disabled={loading || currentStatus === 'declined'}
          onClick={() => handleRsvp('declined')}
        >
          Declined
        </button>
      </div>
      {error && (
        <div style={{ color: '#d00', fontSize: '11px', marginTop: '4px' }}>
          {error}
        </div>
      )}
    </div>
  )
}
