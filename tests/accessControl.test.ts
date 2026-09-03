import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { canRoleAccessPath, isPublicPath, isUserRole, roleDestination } from '../app/utils/accessControl.ts'

const authMiddleware = readFileSync(new URL('../app/middleware/auth.global.ts', import.meta.url), 'utf8')

describe('controle de acesso às rotas', () => {
  it('reconhece apenas os três papéis permitidos', () => {
    assert.equal(isUserRole('gestao'), true)
    assert.equal(isUserRole('professor'), true)
    assert.equal(isUserRole('aluno'), true)
    assert.equal(isUserRole('administrador'), false)
    assert.equal(isUserRole(undefined), false)
  })

  it('direciona cada papel ao painel correto', () => {
    assert.deepEqual(roleDestination, {
      gestao: '/dashboard',
      professor: '/professor',
      aluno: '/aluno'
    })
  })

  it('permite apenas as rotas públicas sem perfil', () => {
    assert.equal(isPublicPath('/login'), true)
    assert.equal(isPublicPath('/confirm'), true)
    assert.equal(isPublicPath('/assinar/token-seguro'), true)
    assert.equal(isPublicPath('/dashboard'), false)
  })

  it('impede professor de acessar gestão e aluno', () => {
    assert.equal(canRoleAccessPath('professor', '/professor/chamada'), true)
    assert.equal(canRoleAccessPath('professor', '/dashboard/financeiro'), false)
    assert.equal(canRoleAccessPath('professor', '/aluno/financeiro'), false)
  })

  it('impede aluno de acessar gestão e professor', () => {
    assert.equal(canRoleAccessPath('aluno', '/aluno/contrato'), true)
    assert.equal(canRoleAccessPath('aluno', '/dashboard/alunos'), false)
    assert.equal(canRoleAccessPath('aluno', '/professor/repasse'), false)
  })

  it('impede gestão de entrar nos portais pessoais', () => {
    assert.equal(canRoleAccessPath('gestao', '/dashboard/configuracoes'), true)
    assert.equal(canRoleAccessPath('gestao', '/professor'), false)
    assert.equal(canRoleAccessPath('gestao', '/aluno'), false)
  })

  it('nega por padrão uma rota interna desconhecida', () => {
    assert.equal(canRoleAccessPath('gestao', '/interno/desconhecido'), false)
  })
  it('valida a sessão no servidor antes de liberar uma rota interna', () => {
    const sessionValidation = authMiddleware.indexOf('supabase.auth.getUser()')
    const profileLookup = authMiddleware.indexOf(".from('usuarios')")

    assert.ok(sessionValidation >= 0)
    assert.ok(profileLookup > sessionValidation)
    assert.match(authMiddleware, /login\?erro=sessao-expirada/)
  })
})
