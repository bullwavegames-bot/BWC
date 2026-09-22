export const PASSWORD_HINT = 'at least 6 characters, with uppercase, lowercase, a number, and a special character'

export function nationalPhoneDigits(raw) {
  return String(raw || '').replace(/\D/g, '')
}

export function isTenDigitPhone(raw) {
  const digits = nationalPhoneDigits(raw)
  if (digits.length === 10) return true
  if (digits.length >= 11 && digits.length <= 15) {
    return [1, 2, 3].some((codeLen) => digits.length - codeLen === 10)
  }
  return false
}

export function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/.test(String(password || ''))
}

export function passwordError(password) {
  if (!isStrongPassword(password)) {
    return `Password must be ${PASSWORD_HINT}.`
  }
  return null
}
