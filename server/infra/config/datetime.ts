// Único lugar do backend que importa dayjs diretamente (CLAUDE.md §6)
import dayjs, { type Dayjs } from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

export const APP_TZ = process.env.APP_TIMEZONE || 'America/Sao_Paulo'

export function nowInTz(): Dayjs {
  return dayjs().tz(APP_TZ)
}

export function toTz(date: Date | string | number): Dayjs {
  return dayjs(date).tz(APP_TZ)
}

/** YYYY-MM-DD no fuso da empresa */
export function toDayString(date: Date | string | number): string {
  return toTz(date).format('YYYY-MM-DD')
}

/** ISO 8601 com offset do fuso da empresa (formato das respostas da API) */
export function toIsoInTz(date: Date | null | undefined): string | null {
  return date ? toTz(date).format() : null
}

export { dayjs }
