import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { isStrongPassword, isValidAuthEmail, normalizeAuthEmail } from '../app/utils/authRules.ts'

const confirmationPage = readFileSync(new URL('../app/pages/confirm.vue', import.meta.url), 'utf8')

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

describe('confirmação de convite e recuperação', () => {
  it('valida o token no servidor e não depende apenas da sessão em cache', () => {
    assert.match(confirmationPage, /supabase\.auth\.getUser\(\)/)
    assert.doesNotMatch(confirmationPage, /supabase\.auth\.getSession\(\)/)
    assert.match(confirmationPage, /invalidLink\.value = !confirmedUserId\.value/)
  })

  it('usa o usuário confirmado ao consultar o destino após definir a senha', () => {
    assert.match(confirmationPage, /destination\(confirmedUserId\.value\)/)
    assert.doesNotMatch(confirmationPage, /user\.value!/)
  })
})
