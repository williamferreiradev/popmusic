import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isStrongPassword, isValidAuthEmail, normalizeAuthEmail } from '../app/utils/authRules.ts'

describe('regras de autenticação', () => {
  it('exige senha com oito caracteres, maiúscula, minúscula e número', () => {
    assert.equal(isStrongPassword('Senha123'), true)
    assert.equal(isStrongPassword('senha123'), false)
    assert.equal(isStrongPassword('SENHA123'), false)
    assert.equal(isStrongPassword('SenhaForte'), false)
    assert.equal(isStrongPassword('Sen1'), false)
  })

  it('normaliza e valida e-mail sem diferenciar maiúsculas', () => {
    assert.equal(normalizeAuthEmail('  Aluno@Email.COM '), 'aluno@email.com')
    assert.equal(isValidAuthEmail('  Aluno@Email.COM '), true)
    assert.equal(isValidAuthEmail('email-inválido'), false)
  })
})
