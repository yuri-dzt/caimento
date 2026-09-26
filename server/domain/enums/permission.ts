export const Permission = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
} as const

export type Permission = (typeof Permission)[keyof typeof Permission]

export const ALL_PERMISSIONS: readonly Permission[] = Object.values(Permission)
