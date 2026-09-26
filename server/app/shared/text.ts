/** Trim + string vazia vira null */
export function optionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export const MIN_PASSWORD_LENGTH = 8
