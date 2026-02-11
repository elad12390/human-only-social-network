'use client'

import { useState } from 'react'
import { createEvent } from '@/lib/actions/events'

interface CreateEventFormProps {
  userId: string
}

export default function CreateEventForm({ userId }: CreateEventFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please enter an event name')
      return
    }

    if (name.length > 200) {
      setError('Event name must be 200 characters or less')
      return
    }

    setLoading(true)
    try {
      const result = await createEvent(
        userId,
        name,
        description.trim() || undefined,
        location.trim() || undefined,
        startTime ? new Date(startTime) : undefined,
        endTime ? new Date(endTime) : undefined
      )
      if (result.success) {
        setName('')
        setDescription('')
        setLocation('')
        setStartTime('')
        setEndTime('')
        window.location.reload()
      } else {
        setError(result.error || 'Failed to create event')
      }
    } catch (err) {
      setError('An error occurred while creating the event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create_event_form">
      <div className="grayheader">Create New Event</div>
      <form onSubmit={handleSubmit}>
        <label>Event Name *</label>
        <input
          type="text"
          className="inputtext"
          placeholder="Event Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          maxLength={200}
        />

        <label>Description</label>
        <textarea
          className="inputtext"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />

        <label>Location</label>
        <input
          type="text"
          className="inputtext"
          placeholder="Location (optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={loading}
        />

        <label>Start Time</label>
        <input
          type="datetime-local"
          className="inputtext"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          disabled={loading}
        />

        <label>End Time</label>
        <input
          type="datetime-local"
          className="inputtext"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          disabled={loading}
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
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  )
}
