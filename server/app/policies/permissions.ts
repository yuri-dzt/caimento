import { AccountType } from '../../domain/enums/account-type'
import { ALL_PERMISSIONS, Permission } from '../../domain/enums/permission'
import { ForbiddenError, NotFoundError } from '../../domain/errors/app-error'
import type { AuthUser } from './auth-user'

export function parseRole(role: string): Permission[] {
  const parts = role.split(',').map((part) => part.trim().toLowerCase())
  return ALL_PERMISSIONS.filter((permission) => parts.includes(permission))
}

/** Normaliza para CSV ordenado. `view` sempre entra: sem ele o usuário não vê nada. */
export function serializeRole(permissions: readonly Permission[]): string {
  const set = new Set<Permission>([Permission.VIEW, ...permissions])
  return ALL_PERMISSIONS.filter((permission) => set.has(permission)).join(',')
}

export function hasPermission(role: string, required: Permission): boolean {
  return parseRole(role).includes(required)
}

export function isPlatformAdmin(user: AuthUser): boolean {
  return user.accountType === AccountType.ADMIN
}

/** Admin da plataforma ignora role; demais dependem do CSV */
export function can(user: AuthUser, required: Permission): boolean {
  return isPlatformAdmin(user) || hasPermission(user.role, required)
}

export function assertPermission(user: AuthUser, required: Permission): void {
  if (!can(user, required)) throw new ForbiddenError()
}

export function assertPlatformAdmin(user: AuthUser): void {
  if (!isPlatformAdmin(user)) throw new ForbiddenError()
}

/** Filtro de listagem: admin vê todas as lojas (undefined), demais só a própria */
export function accountScope(user: AuthUser): string | undefined {
  if (isPlatformAdmin(user)) return undefined
  if (!user.accountId) throw new ForbiddenError()
  return user.accountId
}

/** Ações que criam dados precisam acontecer dentro de uma loja */
export function requireAccountId(user: AuthUser): string {
  if (!user.accountId) {
    throw new ForbiddenError('Esta ação é feita dentro de uma loja. Entre com um usuário da loja.')
  }
  return user.accountId
}

/** Registro de outra loja responde 404 para não revelar que existe */
export function assertSameAccount(user: AuthUser, resourceAccountId: string): void {
  if (isPlatformAdmin(user)) return
  if (user.accountId !== resourceAccountId) throw new NotFoundError()
}
