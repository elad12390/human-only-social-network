'use client'

import { useState } from 'react'
import { sendMessage } from '@/lib/actions/messages'

interface ComposeMessageFormProps {
  currentUserId: string
  prefillRecipientId?: string
  prefillSubject?: string
}

export default function ComposeMessageForm({
  currentUserId,
  prefillRecipientId = '',
  prefillSubject = '',
}: ComposeMessageFormProps) {
  const [recipientId, setRecipientId] = useState(prefillRecipientId)
  const [subject, setSubject] = useState(prefillSubject)
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!recipientId.trim()) {
      setError('Please enter a recipient user ID')
      return
    }

    if (!subject.trim()) {
      setError('Please enter a subject')
      return
    }

    if (!body.trim()) {
      setError('Please enter a message body')
      return
    }

    setLoading(true)
    try {
      const result = await sendMessage(
        currentUserId,
        recipientId.trim(),
        subject.trim(),
        body.trim()
      )
      if (result.success) {
        window.location.href = '/inbox'
      } else {
        setError(result.error || 'Failed to send message')
      }
    } catch (err) {
      setError('An error occurred while sending the message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="compose_form">
      <form onSubmit={handleSubmit}>
        <div className="form_row">
          <label>Recipient User ID</label>
          <input
            type="text"
            className="inputtext"
            placeholder="Recipient User ID"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form_row">
          <label>Subject</label>
          <input
            type="text"
            className="inputtext"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form_row">
          <label>Message</label>
          <textarea
            className="inputtext"
            placeholder="Write your message..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={loading}
            style={{ height: '150px' }}
          />
        </div>

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

        <button type="submit" className="inputsubmit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  )
}
