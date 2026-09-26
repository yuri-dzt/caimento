import type { AccountType, FabricType, Permission, SimulationStatus, SimulationType } from './api'

export const FABRIC_TYPE_LABEL: Record<FabricType, string> = {
  COTTON: 'Algodão',
  LINEN: 'Linho',
  KNIT: 'Malha',
  SILK: 'Seda',
  SATIN: 'Cetim',
  CREPE: 'Crepe',
  CHIFFON: 'Chiffon',
  DENIM: 'Jeans',
  LACE: 'Renda',
  VISCOSE: 'Viscose',
  WOOL: 'Lã',
  LEATHER: 'Couro',
  OTHER: 'Outro',
}

/** Cor do carretel de cada tipo de tecido (classe Tailwind do token) */
export const FABRIC_TYPE_THREAD: Record<FabricType, string> = {
  COTTON: 'bg-thread-sky',
  LINEN: 'bg-thread-flax',
  KNIT: 'bg-thread-violet',
  SILK: 'bg-thread-rose',
  SATIN: 'bg-thread-plum',
  CREPE: 'bg-thread-teal',
  CHIFFON: 'bg-thread-lilac',
  DENIM: 'bg-thread-indigo',
  LACE: 'bg-thread-blush',
  VISCOSE: 'bg-thread-orange',
  WOOL: 'bg-thread-moss',
  LEATHER: 'bg-thread-brown',
  OTHER: 'bg-thread-slate',
}

export const SIMULATION_TYPE_LABEL: Record<SimulationType, string> = {
  FABRIC_SWAP: 'Troca de tecido',
  TRY_ON: 'Provador',
}

export const SIMULATION_STATUS_LABEL: Record<SimulationStatus, string> = {
  PENDING: 'Na fila',
  PROCESSING: 'Costurando',
  DONE: 'Pronta',
  FAILED: 'Falhou',
}

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  ADMIN: 'Administrador',
  OWNER: 'Responsável',
  EMPLOYEE: 'Funcionária',
}

export const PERMISSION_LABEL: Record<Permission, string> = {
  view: 'Ver',
  create: 'Criar',
  edit: 'Editar',
  delete: 'Excluir',
}
