import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  AccessProvisioningError,
  provisionAccess,
  type AccessProvisioningDependencies,
  type CreateAuthUserInput
} from '../server/services/accessProvisioning.ts'

const userId = '11111111-1111-4111-8111-111111111111'
const orphanId = '22222222-2222-4222-8222-222222222222'
const professorId = '33333333-3333-4333-8333-333333333333'
const actorId = '44444444-4444-4444-8444-444444444444'

const input = {
  actorId,
  nome: 'Joao Professor',
  email: 'joao@popmusic.com',
  papel: 'professor' as const,
  professorId,
  appUrl: 'https://popmusic-beige.vercel.app/',
  temporaryPassword: 'PopMusic1234@'
}

const makeDependencies = (overrides: Partial<AccessProvisioningDependencies> = {}) => {
  const events: string[] = []
  let createPayload: CreateAuthUserInput | null = null
  const deps: AccessProvisioningDependencies = {
    async assertDatabaseReady() {},
    async getProfessor() {
      events.push('get-professor')
      return { id: professorId, email: input.email, usuarioId: null, ativo: true }
    },
    async lookupAuthUser() {
      events.push('lookup-auth')
      return null
    },
    async findAuthUserByEmail() {
      events.push('find-auth-by-email')
      return { id: userId, email: input.email, appRole: 'professor' }
    },
    async repairOrphanProfessor() {
      events.push('repair-orphan')
      return true
    },
    async createAuthUser(payload) {
      events.push('create-auth')
      createPayload = payload
      return { user: { id: userId, email: input.email }, error: null }
    },
    async generateRecoveryLink() {
      events.push('recovery-link')
      return { user: { id: userId, email: input.email }, actionLink: 'https://supabase.test/recovery', error: null }
    },
    async getAccountState() {
      events.push('account-state')
      return { profileRole: 'professor', hasStudentLink: false, otherProfessorId: null }
    },
    async isDatabaseProvisioned() {
      events.push('is-database-provisioned')
      return false
    },
    async updateAuthMetadata() {
      events.push('update-metadata')
      return {
        appMetadata: { papel: 'professor' },
        userMetadata: { nome: input.nome },
        rollbackToken: 'token-de-teste'
      }
    },
    async restoreAuthMetadata() {
      events.push('restore-metadata')
    },
    async finalizeAuthMetadata() {
      events.push('finalize-metadata')
    },
    async provisionDatabase() {
      events.push('provision-database')
    },
    ...overrides
  }
  return { deps, events, createPayload: () => createPayload }
}

const rejectsWith = (statusCode: number, code: string) => (error: unknown) => {
  assert.ok(error instanceof AccessProvisioningError)
  assert.equal(error.statusCode, statusCode)
  assert.equal(error.code, code)
  return true
}

describe('provisionamento de acesso administrativo', () => {
  it('não cria Auth nem altera vínculos quando a migration está ausente', async () => {
    const fixture = makeDependencies({
      async assertDatabaseReady() {
        throw new AccessProvisioningError(503, 'Migration ausente.', 'ACCESS_MIGRATION_MISSING')
      }
    })
    await assert.rejects(provisionAccess(fixture.deps, input), rejectsWith(503, 'ACCESS_MIGRATION_MISSING'))
    assert.deepEqual(fixture.events, [])
  })
  it('cria Auth com senha, papel seguro e depois vincula o professor', async () => {
    const fixture = makeDependencies()
    const result = await provisionAccess(fixture.deps, input)

    assert.deepEqual(fixture.createPayload(), {
      email: input.email,
      password: 'PopMusic1234@',
      emailConfirm: true,
      userMetadata: { nome: input.nome, must_change_password: true },
      appMetadata: { papel: 'professor' }
    })
    assert.deepEqual(fixture.events, ['get-professor', 'create-auth', 'provision-database'])
    assert.equal(result.existingAccount, false)
    assert.equal(result.temporaryPassword, 'PopMusic1234@')
    assert.equal(result.activationLink, 'https://popmusic-beige.vercel.app/login')
  })

  it('cria uma conta de gestao sem exigir vinculo de professor', async () => {
    const fixture = makeDependencies()
    const result = await provisionAccess(fixture.deps, {
      ...input,
      papel: 'gestao',
      professorId: null
    })

    assert.equal(result.success, true)
    assert.ok(!fixture.events.includes('get-professor'))
    assert.deepEqual(fixture.events, ['create-auth', 'provision-database'])
  })

  it('trata uma repeticao sobre professor ja vinculado como operacao idempotente', async () => {
    const fixture = makeDependencies({
      async getProfessor() {
        fixture.events.push('get-professor')
        return { id: professorId, email: input.email, usuarioId: userId, ativo: true }
      },
      async lookupAuthUser() {
        fixture.events.push('lookup-auth')
        return { id: userId, email: input.email }
      }
    })

    const result = await provisionAccess(fixture.deps, input)

    assert.equal(result.existingAccount, true)
    assert.equal(result.temporaryPassword, null)
    assert.equal(result.activationLink, 'https://supabase.test/recovery')
    assert.deepEqual(fixture.events, [
      'get-professor', 'lookup-auth', 'account-state', 'recovery-link',
      'update-metadata', 'provision-database', 'finalize-metadata'
    ])
    assert.ok(!fixture.events.includes('create-auth'))
  })

  it('repara o usuario_id orfao antes de recriar a conta', async () => {
    const fixture = makeDependencies({
      async getProfessor() {
        fixture.events.push('get-professor')
        return { id: professorId, email: input.email, usuarioId: orphanId, ativo: true }
      }
    })

    const result = await provisionAccess(fixture.deps, input)

    assert.equal(result.repairedOrphan, true)
    assert.deepEqual(fixture.events, [
      'get-professor', 'lookup-auth', 'repair-orphan', 'create-auth', 'provision-database'
    ])
  })

  it('interrompe quando o vinculo muda durante o reparo de orfao', async () => {
    const fixture = makeDependencies({
      async getProfessor() {
        fixture.events.push('get-professor')
        return { id: professorId, email: input.email, usuarioId: orphanId, ativo: true }
      },
      async repairOrphanProfessor() {
        fixture.events.push('repair-orphan')
        return false
      }
    })

    await assert.rejects(
      provisionAccess(fixture.deps, input),
      rejectsWith(409, 'ORPHAN_LINK_CHANGED')
    )
    assert.ok(!fixture.events.includes('create-auth'))
  })

  it('promove somente o perfil aluno realmente orfao de uma conta existente', async () => {
    const fixture = makeDependencies({
      async createAuthUser() {
        fixture.events.push('create-auth')
        return { user: null, error: { code: 'email_exists', message: 'User already exists', status: 422 } }
      },
      async findAuthUserByEmail() {
        fixture.events.push('find-auth-by-email')
        return { id: userId, email: input.email, appRole: 'aluno' }
      },
      async getAccountState() {
        fixture.events.push('account-state')
        return { profileRole: 'aluno', hasStudentLink: false, otherProfessorId: null }
      }
    })

    const result = await provisionAccess(fixture.deps, input)

    assert.equal(result.existingAccount, true)
    assert.equal(fixture.events.filter(event => event === 'recovery-link').length, 1)
    assert.ok(fixture.events.indexOf('find-auth-by-email') < fixture.events.indexOf('recovery-link'))
    assert.ok(fixture.events.includes('update-metadata'))
    assert.ok(fixture.events.includes('provision-database'))
  })

  it('nao toma uma conta que esta vinculada a um aluno', async () => {
    const fixture = makeDependencies({
      async createAuthUser() {
        fixture.events.push('create-auth')
        return { user: null, error: { code: 'email_exists', message: 'User already exists', status: 422 } }
      },
      async getAccountState() {
        fixture.events.push('account-state')
        return { profileRole: 'aluno', hasStudentLink: true, otherProfessorId: null }
      }
    })

    await assert.rejects(
      provisionAccess(fixture.deps, input),
      rejectsWith(409, 'ACCOUNT_USED_BY_STUDENT')
    )
    assert.ok(!fixture.events.includes('update-metadata'))
    assert.ok(!fixture.events.includes('provision-database'))
  })

  it('preserva o Auth recuperavel quando a transacao do banco falha', async () => {
    const fixture = makeDependencies({
      async provisionDatabase() {
        fixture.events.push('provision-database')
        throw new AccessProvisioningError(502, 'Falha simulada.', 'SIMULATED_DATABASE_FAILURE')
      }
    })

    await assert.rejects(
      provisionAccess(fixture.deps, input),
      rejectsWith(502, 'SIMULATED_DATABASE_FAILURE')
    )
    assert.deepEqual(fixture.events.slice(-2), ['provision-database', 'is-database-provisioned'])
    assert.ok(!fixture.events.includes('delete-auth'))
  })

  it('reconhece o commit quando apenas a resposta da RPC foi perdida', async () => {
    const fixture = makeDependencies({
      async provisionDatabase() {
        fixture.events.push('provision-database')
        throw new AccessProvisioningError(502, 'Resposta perdida.', 'NETWORK_AFTER_COMMIT')
      },
      async isDatabaseProvisioned() {
        fixture.events.push('is-database-provisioned')
        return true
      }
    })

    const result = await provisionAccess(fixture.deps, input)
    assert.equal(result.success, true)
    assert.equal(result.existingAccount, false)
    assert.deepEqual(fixture.events.slice(-2), ['provision-database', 'is-database-provisioned'])
  })

  it('restaura metadata de conta existente quando o vinculo falha sem commit', async () => {
    const fixture = makeDependencies({
      async getProfessor() {
        fixture.events.push('get-professor')
        return { id: professorId, email: input.email, usuarioId: userId, ativo: true }
      },
      async lookupAuthUser() {
        fixture.events.push('lookup-auth')
        return { id: userId, email: input.email, appRole: 'professor' }
      },
      async provisionDatabase() {
        fixture.events.push('provision-database')
        throw new AccessProvisioningError(502, 'Falha simulada.', 'SIMULATED_DATABASE_FAILURE')
      }
    })

    await assert.rejects(
      provisionAccess(fixture.deps, input),
      rejectsWith(502, 'SIMULATED_DATABASE_FAILURE')
    )
    assert.deepEqual(fixture.events.slice(-3), [
      'provision-database', 'is-database-provisioned', 'restore-metadata'
    ])
  })

  it('preserva metadata quando o estado do commit nao pode ser confirmado', async () => {
    const fixture = makeDependencies({
      async getProfessor() {
        fixture.events.push('get-professor')
        return { id: professorId, email: input.email, usuarioId: userId, ativo: true }
      },
      async lookupAuthUser() {
        fixture.events.push('lookup-auth')
        return { id: userId, email: input.email, appRole: 'professor' }
      },
      async provisionDatabase() {
        fixture.events.push('provision-database')
        throw new AccessProvisioningError(502, 'Falha simulada.', 'SIMULATED_DATABASE_FAILURE')
      },
      async isDatabaseProvisioned() {
        fixture.events.push('is-database-provisioned')
        throw new Error('Banco temporariamente indisponivel')
      }
    })

    await assert.rejects(
      provisionAccess(fixture.deps, input),
      rejectsWith(503, 'PROVISION_STATE_UNKNOWN')
    )
    assert.ok(!fixture.events.includes('restore-metadata'))
  })

  it('bloqueia a conversao de um papel seguro administrativo', async () => {
    const fixture = makeDependencies({
      async createAuthUser() {
        fixture.events.push('create-auth')
        return { user: null, error: { code: 'email_exists', message: 'User already exists', status: 422 } }
      },
      async findAuthUserByEmail() {
        fixture.events.push('find-auth-by-email')
        return { id: userId, email: input.email, appRole: 'gestao' }
      },
      async getAccountState() {
        fixture.events.push('account-state')
        return { profileRole: 'gestao', hasStudentLink: false, otherProfessorId: null }
      }
    })

    await assert.rejects(
      provisionAccess(fixture.deps, input),
      rejectsWith(409, 'AUTH_ROLE_CONFLICT')
    )
    assert.ok(!fixture.events.includes('recovery-link'))
  })

  it('explica especificamente a falha do trigger de auth', async () => {
    const fixture = makeDependencies({
      async createAuthUser() {
        fixture.events.push('create-auth')
        return {
          user: null,
          error: { code: 'unexpected_failure', message: 'Database error creating new user', status: 500 }
        }
      }
    })

    await assert.rejects(
      provisionAccess(fixture.deps, input),
      rejectsWith(503, 'AUTH_DATABASE_TRIGGER_FAILED')
    )
    assert.ok(!fixture.events.includes('provision-database'))
  })

  it('rejeita URL canonica com credenciais ou query antes de chamar o provedor', async () => {
    const fixture = makeDependencies()
    await assert.rejects(
      provisionAccess(fixture.deps, {
        ...input,
        appUrl: 'https://usuario:senha@popmusic.test/?redirect=externo'
      }),
      rejectsWith(500, 'INVALID_APP_URL')
    )
    assert.deepEqual(fixture.events, [])
  })

  it('aceita HTTP apenas em localhost', async () => {
    const fixture = makeDependencies()
    await assert.rejects(
      provisionAccess(fixture.deps, { ...input, appUrl: 'http://popmusic.test' }),
      rejectsWith(500, 'INSECURE_APP_URL')
    )
    assert.deepEqual(fixture.events, [])
  })

  it('nao confunde erro generico already exists com e-mail duplicado', async () => {
    const fixture = makeDependencies({
      async createAuthUser() {
        fixture.events.push('create-auth')
        return { user: null, error: { code: 'unexpected_failure', message: 'Database object already exists', status: 500 } }
      }
    })
    await assert.rejects(
      provisionAccess(fixture.deps, input),
      rejectsWith(502, 'AUTH_CREATE_FAILED')
    )
    assert.ok(!fixture.events.includes('find-auth-by-email'))
  })

  it('nao confunde falha de infraestrutura com vinculo orfao', async () => {
    const fixture = makeDependencies({
      async getProfessor() {
        fixture.events.push('get-professor')
        return { id: professorId, email: input.email, usuarioId: orphanId, ativo: true }
      },
      async lookupAuthUser() {
        fixture.events.push('lookup-auth')
        throw new AccessProvisioningError(502, 'Auth indisponivel.', 'AUTH_LOOKUP_FAILED')
      }
    })

    await assert.rejects(
      provisionAccess(fixture.deps, input),
      rejectsWith(502, 'AUTH_LOOKUP_FAILED')
    )
    assert.ok(!fixture.events.includes('repair-orphan'))
    assert.ok(!fixture.events.includes('create-auth'))
  })
})
