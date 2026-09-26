export const AccountType = {
  ADMIN: 'ADMIN',
  OWNER: 'OWNER',
  EMPLOYEE: 'EMPLOYEE',
} as const

export type AccountType = (typeof AccountType)[keyof typeof AccountType]
