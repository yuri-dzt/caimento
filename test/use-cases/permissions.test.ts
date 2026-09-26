import {
  accountScope,
  assertSameAccount,
  can,
  hasPermission,
  parseRole,
  requireAccountId,
  serializeRole,
} from '../../server/app/policies/permissions'
import { ForbiddenError, NotFoundError } from '../../server/domain/errors/app-error'
import { adminActor, employeeActor, makeActor, OTHER_ACCOUNT_ID } from '../helpers/factories'

describe('permissions', () => {
  it('parseRole ignora valores desconhecidos, espaços e maiúsculas', () => {
    expect(parseRole(' VIEW, create ,hack')).toEqual(['view', 'create'])
  })

  it('serializeRole sempre inclui view e mantém ordem fixa', () => {
    expect(serializeRole(['delete', 'create'])).toBe('view,create,delete')
    expect(serializeRole([])).toBe('view')
  })

  it('hasPermission lê o CSV', () => {
    expect(hasPermission('view,create', 'create')).toBe(true)
    expect(hasPermission('view,create', 'delete')).toBe(false)
  })

  it('admin da plataforma ignora role', () => {
    expect(can({ ...adminActor(), role: '' }, 'delete')).toBe(true)
  })

  it('funcionária depende do role', () => {
    expect(can(employeeActor('view'), 'create')).toBe(false)
  })

  it('accountScope: admin vê tudo, demais só a própria loja', () => {
    expect(accountScope(adminActor())).toBeUndefined()
    expect(accountScope(makeActor())).toBe('acc-1')
  })

  it('requireAccountId bloqueia admin sem loja', () => {
    expect(() => requireAccountId(adminActor())).toThrow(ForbiddenError)
  })

  it('assertSameAccount responde 404 para outra loja', () => {
    expect(() => assertSameAccount(makeActor(), OTHER_ACCOUNT_ID)).toThrow(NotFoundError)
    expect(() => assertSameAccount(adminActor(), OTHER_ACCOUNT_ID)).not.toThrow()
  })
})
