import type { FastifyReply } from 'fastify'
import type { AuthUser } from '../../app/policies/auth-user'
import type { PublicUser } from '../../domain/entities/user'
import type { Account } from '../../domain/entities/account'
import { AccountType } from '../../domain/enums/account-type'
import { env, isProduction } from '../config/env'

export const SESSION_COOKIE = 'session'
export const CSRF_HEADER = 'x-requested-with'
export const CSRF_HEADER_VALUE = 'caimento'

/** Payload gravado no JWT */
export interface JwtPayload {
  sub: string
  email: string
  name: string
  accountType: AccountType
  accountId: string | null
  accountName: string | null
  role: string
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: AuthUser
  }
}

const UNIT_SECONDS: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 }

/** "7d", "12h", "30m", "3600" → segundos */
export function durationToSeconds(value: string): number {
  const match = /^(\d+)\s*([smhd]?)$/.exec(value.trim())
  if (!match) throw new Error(`Duração inválida: ${value}`)
  return Number(match[1]) * UNIT_SECONDS[match[2] || 's']
}

export function toJwtPayload(user: PublicUser, account: Account | null): JwtPayload {
  return {
    sub: user.id,
    email: user.email,
    name: user.name,
    accountType: user.accountType,
    accountId: user.accountId,
    accountName: account?.name ?? null,
    role: user.role,
  }
}

export function formatAuthUser(payload: JwtPayload): AuthUser {
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    accountType: payload.accountType,
    accountId: payload.accountId,
    accountName: payload.accountName,
    role: payload.role,
  }
}

export async function setSessionCookie(reply: FastifyReply, payload: JwtPayload): Promise<void> {
  const token = await reply.jwtSign(payload, { expiresIn: env.JWT_EXPIRES_IN })
  reply.setCookie(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: durationToSeconds(env.JWT_EXPIRES_IN),
  })
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE, { path: '/', httpOnly: true, sameSite: 'lax', secure: isProduction })
}
