import type { Me, Permission } from '../types/api'

// Mesma regra do backend (server/app/policies/permissions.ts): admin ignora permissões

export function isAdmin(me: Me | null): boolean {
  return me?.user.accountType === 'ADMIN'
}

export function isOwner(me: Me | null): boolean {
  return me?.user.accountType === 'OWNER'
}

export function can(me: Me | null, permission: Permission): boolean {
  if (!me) return false
  return isAdmin(me) || me.user.permissions.includes(permission)
}

/** Ações da loja (cadastrar tecido, gerar simulação) exigem estar dentro de uma loja */
export function worksInAccount(me: Me | null): boolean {
  return Boolean(me?.user.accountId)
}

export function canManageUsers(me: Me | null): boolean {
  return isAdmin(me) || isOwner(me)
}
