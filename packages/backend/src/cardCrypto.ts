import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import type { CardRecord } from './board'

const ENCRYPTED_PAYLOAD_RE = /^v1\.[A-Za-z0-9+/]+=*\.[A-Za-z0-9+/]+=*$/
const IV_LENGTH = 12

function toBase64(value: Buffer): string {
  return value.toString('base64')
}

function fromBase64(value: string): Buffer {
  return Buffer.from(value, 'base64')
}

function getEncryptionKey(): Buffer {
  const secret = process.env.CARD_ENCRYPTION_KEY ?? process.env.JWT_SECRET
  if (!secret) {
    throw new Error('CARD_ENCRYPTION_KEY or JWT_SECRET must be set')
  }
  return createHash('sha256').update(secret).digest()
}

export function encryptCardContent(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return `v1.${toBase64(iv)}.${toBase64(Buffer.concat([ciphertext, authTag]))}`
}

export function decryptCardContent(payload: string): string {
  if (!ENCRYPTED_PAYLOAD_RE.test(payload)) return payload

  const [, ivBase64, encryptedBase64] = payload.split('.')
  const iv = fromBase64(ivBase64)
  const encrypted = fromBase64(encryptedBase64)
  const authTag = encrypted.subarray(encrypted.length - 16)
  const ciphertext = encrypted.subarray(0, encrypted.length - 16)

  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), iv)
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}

export function decryptCardRecord(card: CardRecord): CardRecord {
  return {
    ...card,
    title: decryptCardContent(card.title),
    description: decryptCardContent(card.description),
  }
}
