'use client'

export default function LogoutButton() {
  const handleLogout = async () => {
    await fetch('/api/auth/sign-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      credentials: 'include',
    })
    window.location.href = '/'
  }

  return (
    <a href="#" onClick={(e) => { e.preventDefault(); handleLogout() }} style={{ cursor: 'pointer' }}>
      Logout
    </a>
  )
}
