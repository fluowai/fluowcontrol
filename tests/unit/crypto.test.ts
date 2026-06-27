import { describe, it, expect } from 'vitest'
import { encryptSecret, decryptSecret } from '../../server/services/crypto.js'

describe('Crypto Service', () => {
  describe('encryptSecret', () => {
    it('returns null for null input', () => {
      expect(encryptSecret(null)).toBeNull()
    })

    it('returns null for undefined input', () => {
      expect(encryptSecret(undefined)).toBeNull()
    })

    it('returns encrypted value in correct format (iv:tag:encrypted)', () => {
      const result = encryptSecret('my-secret-value')
      expect(result).not.toBeNull()
      const parts = result!.split(':')
      expect(parts).toHaveLength(3)
      expect(parts[0]).toBeTruthy()
      expect(parts[1]).toBeTruthy()
      expect(parts[2]).toBeTruthy()
    })

    it('produces different outputs for same input (due to random IV)', () => {
      const a = encryptSecret('same-value')
      const b = encryptSecret('same-value')
      expect(a).not.toBe(b)
    })
  })

  describe('decryptSecret', () => {
    it('returns null for null input', () => {
      expect(decryptSecret(null)).toBeNull()
    })

    it('returns null for undefined input', () => {
      expect(decryptSecret(undefined)).toBeNull()
    })

    it('returns null for invalid format', () => {
      expect(decryptSecret('invalid')).toBeNull()
      expect(decryptSecret('only-two:parts')).toBeNull()
    })

    it('can decrypt what was encrypted', () => {
      const original = 'my-super-secret-password'
      const encrypted = encryptSecret(original)
      expect(encrypted).not.toBeNull()
      const decrypted = decryptSecret(encrypted)
      expect(decrypted).toBe(original)
    })

    it('handles special characters', () => {
      const original = 'p@ssw0rd!$#%&*()_+-=[]{}|;:,.<>?'
      const encrypted = encryptSecret(original)
      const decrypted = decryptSecret(encrypted)
      expect(decrypted).toBe(original)
    })
  })
})
