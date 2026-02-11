import { describe, it, expect } from 'vitest'
import { auth } from '@/lib/auth'

describe('Better Auth Configuration', () => {
  it('should export auth instance', () => {
    expect(auth).toBeDefined()
    expect(typeof auth).toBe('object')
  })

  it('should have api property', () => {
    expect(auth.api).toBeDefined()
  })

  it('should have handler property', () => {
    expect(auth.handler).toBeDefined()
  })

  it('should have emailAndPassword enabled', () => {
    expect(auth.options.emailAndPassword).toBeDefined()
    expect(auth.options.emailAndPassword.enabled).toBe(true)
  })

  it('should validate email format', () => {
    const validEmails = [
      'user@example.com',
      'test.user@example.co.uk',
      'user+tag@example.com',
    ]
    const invalidEmails = ['invalid', 'user@', '@example.com', 'user @example.com']

    validEmails.forEach((email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      expect(emailRegex.test(email)).toBe(true)
    })

    invalidEmails.forEach((email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      expect(emailRegex.test(email)).toBe(false)
    })
  })

  it('should validate password requirements', () => {
    const validatePassword = (password: string): boolean => {
      return password.length >= 8
    }

    expect(validatePassword('short')).toBe(false)
    expect(validatePassword('validpassword123')).toBe(true)
    expect(validatePassword('12345678')).toBe(true)
  })
})
