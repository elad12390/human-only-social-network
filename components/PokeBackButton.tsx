'use client'

import { useState } from 'react'
import { pokeBack } from '@/lib/actions/poke'

interface PokeBackButtonProps {
  pokeId: string
  currentUserId: string
}

export default function PokeBackButton({ pokeId, currentUserId }: PokeBackButtonProps) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handlePokeBack = async () => {
    setLoading(true)
    try {
      const result = await pokeBack(pokeId, currentUserId)
      if (result.success) {
        setDone(true)
        // Reload page after successful poke back
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }
    } catch (error) {
      console.error('Failed to poke back:', error)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return <span>Poked back!</span>
  }

  return (
    <a
      onClick={handlePokeBack}
      style={{
        color: '#3b5998',
        cursor: 'pointer',
        textDecoration: 'underline',
      }}
    >
      Poke Back
    </a>
  )
}
