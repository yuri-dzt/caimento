import { History, Layers, Scissors, Shirt, Store, UserCog, Users, type LucideIcon } from 'lucide-react'
import type { Me } from '../../types/api'
import { can, canManageUsers, isAdmin, worksInAccount } from '../../utils/permissions'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** aparece na barra inferior do celular */
  mobileTab: boolean
  visible: (me: Me) => boolean
}

export const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Bancada',
    icon: Scissors,
    mobileTab: true,
    visible: (me) => worksInAccount(me) && can(me, 'create'),
  },
  { to: '/historico', label: 'Histórico', icon: History, mobileTab: true, visible: (me) => can(me, 'view') },
  { to: '/tecidos', label: 'Tecidos', icon: Layers, mobileTab: true, visible: (me) => can(me, 'view') },
  { to: '/pecas', label: 'Peças', icon: Shirt, mobileTab: true, visible: (me) => can(me, 'view') },
  { to: '/clientes', label: 'Clientes', icon: Users, mobileTab: true, visible: (me) => can(me, 'view') },
  { to: '/equipe', label: 'Equipe', icon: UserCog, mobileTab: false, visible: (me) => canManageUsers(me) },
  { to: '/lojas', label: 'Lojas', icon: Store, mobileTab: false, visible: (me) => isAdmin(me) },
]

export function visibleNav(me: Me): NavItem[] {
  return NAV_ITEMS.filter((item) => item.visible(me))
}

/** Primeira tela depois do login */
export function homePath(me: Me): string {
  return visibleNav(me)[0]?.to ?? '/conta'
}
