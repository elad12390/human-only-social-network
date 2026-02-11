'use client'

import { useState } from 'react'
import { createGroup } from '@/lib/actions/groups'

interface CreateGroupFormProps {
  userId: string
}

export default function CreateGroupForm({ userId }: CreateGroupFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please enter a group name')
      return
    }

    if (name.length > 200) {
      setError('Group name must be 200 characters or less')
      return
    }

    setLoading(true)
    try {
      const result = await createGroup(
        userId,
        name,
        description.trim() || undefined
      )
      if (result.success) {
        setName('')
        setDescription('')
        window.location.reload()
      } else {
        setError(result.error || 'Failed to create group')
      }
    } catch (err) {
      setError('An error occurred while creating the group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create_group_form">
      <div className="grayheader">Create New Group</div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="inputtext"
          placeholder="Group Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          maxLength={200}
        />
        <textarea
          className="inputtext"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </form>
    </div>
  )
}
