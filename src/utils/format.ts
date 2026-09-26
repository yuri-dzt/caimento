const dateTime = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
})

const date = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
})

const relative = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

export function formatDateTime(iso: string | null): string {
  return iso ? dateTime.format(new Date(iso)).replace('.', '') : ''
}

export function formatDate(iso: string | null): string {
  return iso ? date.format(new Date(iso)) : ''
}

/** "há 5 min", "ontem"... cai para data curta depois de uma semana */
export function formatRelative(iso: string | null): string {
  if (!iso) return ''
  const diffSeconds = (new Date(iso).getTime() - Date.now()) / 1000
  const abs = Math.abs(diffSeconds)
  if (abs < 60) return 'agora'
  if (abs < 3600) return relative.format(Math.round(diffSeconds / 60), 'minute')
  if (abs < 86400) return relative.format(Math.round(diffSeconds / 3600), 'hour')
  if (abs < 7 * 86400) return relative.format(Math.round(diffSeconds / 86400), 'day')
  return formatDateTime(iso)
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}
