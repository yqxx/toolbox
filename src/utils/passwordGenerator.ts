export interface PasswordOptions {
  length: number
  lowercase: boolean
  uppercase: boolean
  numbers: boolean
  symbols: boolean
  excludeAmbiguous: boolean
}

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const NUMBERS = '0123456789'
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?'
const AMBIGUOUS = new Set(['0', 'O', 'o', '1', 'l', 'I'])

export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  length: 16,
  lowercase: true,
  uppercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
}

function filterAmbiguous(chars: string, exclude: boolean): string {
  if (!exclude) return chars
  return [...chars].filter((ch) => !AMBIGUOUS.has(ch)).join('')
}

function buildCharsets(options: PasswordOptions): string[] {
  const sets: string[] = []
  if (options.lowercase) sets.push(filterAmbiguous(LOWERCASE, options.excludeAmbiguous))
  if (options.uppercase) sets.push(filterAmbiguous(UPPERCASE, options.excludeAmbiguous))
  if (options.numbers) sets.push(filterAmbiguous(NUMBERS, options.excludeAmbiguous))
  if (options.symbols) sets.push(filterAmbiguous(SYMBOLS, options.excludeAmbiguous))
  return sets.filter((set) => set.length > 0)
}

function randomIndex(max: number): number {
  const array = new Uint32Array(1)
  const limit = Math.floor(0x100000000 / max) * max
  let value = 0
  do {
    crypto.getRandomValues(array)
    value = array[0]
  } while (value >= limit)
  return value % max
}

function pickChar(charset: string): string {
  return charset[randomIndex(charset.length)]
}

function shuffle(chars: string[]): string[] {
  const result = [...chars]
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function generatePassword(options: PasswordOptions): string {
  const charsets = buildCharsets(options)
  if (!charsets.length) {
    throw new Error('请至少选择一种字符类型')
  }

  const pool = charsets.join('')
  const length = Math.max(charsets.length, options.length)
  const chars: string[] = []

  for (const charset of charsets) {
    chars.push(pickChar(charset))
  }

  while (chars.length < length) {
    chars.push(pickChar(pool))
  }

  return shuffle(chars).join('')
}

export type PasswordStrength = 'weak' | 'fair' | 'strong' | 'very-strong'

export function estimateStrength(password: string, options: PasswordOptions): PasswordStrength {
  let score = 0
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1
  if (options.lowercase && /[a-z]/.test(password)) score += 1
  if (options.uppercase && /[A-Z]/.test(password)) score += 1
  if (options.numbers && /\d/.test(password)) score += 1
  if (options.symbols && /[^A-Za-z0-9]/.test(password)) score += 1

  if (score <= 2) return 'weak'
  if (score <= 4) return 'fair'
  if (score <= 5) return 'strong'
  return 'very-strong'
}

export const strengthLabels: Record<PasswordStrength, string> = {
  weak: '弱',
  fair: '一般',
  strong: '强',
  'very-strong': '很强',
}
