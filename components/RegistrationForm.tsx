'use client'

import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function RegistrationForm() {
  const router = useRouter()
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    isHuman: false,
    noAiContent: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.firstName.trim()) {
      setError('First name is required')
      return
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required')
      return
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }
    if (!formData.password) {
      setError('Password is required')
      return
    }
    if (!formData.confirmPassword) {
      setError('Please confirm your password')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!formData.isHuman) {
      setError('You must confirm that you are human')
      return
    }
    if (!formData.noAiContent) {
      setError('You must agree not to post AI-generated content')
      return
    }

    setLoading(true)
    try {
      const result = await authClient.signUp.email({
        email: formData.email,
        password: formData.password,
        name: `${formData.firstName} ${formData.lastName}`,
      })

      if (result.error) {
        setError(result.error.message || 'Sign up failed')
        setLoading(false)
        return
      }

      // Success - redirect to home
      router.push('/home.php')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div id="welcome">
      {error && <div id="error">{error}</div>}

      <div className="left_column">
        <h1>Welcome to HumanBook</h1>
        <div className="welcome_message">
          HumanBook is a social utility that connects you with the people around you.
        </div>
      </div>

      <div className="right_column">
        <div className="register_form">
          <h2>Sign Up</h2>
          <form onSubmit={handleSubmit}>
            <div className="form_row">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                className="inputtext"
                value={formData.firstName}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form_row">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                className="inputtext"
                value={formData.lastName}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form_row">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="inputtext"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form_row">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className="inputtext"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form_row">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="inputtext"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="checkbox_row">
              <input
                type="checkbox"
                id="isHuman"
                name="isHuman"
                className="inputcheckbox"
                checked={formData.isHuman}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="isHuman">I am a human being</label>
            </div>

            <div className="checkbox_row">
              <input
                type="checkbox"
                id="noAiContent"
                name="noAiContent"
                className="inputcheckbox"
                checked={formData.noAiContent}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="noAiContent">I will not post AI-generated content</label>
            </div>

            <div className="form_row">
              <button
                type="submit"
                className="inputsubmit"
                disabled={loading}
              >
                {loading ? 'Signing up...' : 'Sign Up'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="clearfix"></div>
    </div>
  )
}
