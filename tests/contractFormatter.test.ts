import assert from 'node:assert/strict'
import { it } from 'node:test'
import { registerHooks } from 'node:module'

// Nuxt resolve imports sem extensão; o runner nativo exige a extensão TS.
const formatterUrl = new URL('../app/utils/contractFormatter.ts', import.meta.url).href
const resolver = registerHooks({ resolve(specifier, context, nextResolve) {
  return nextResolve(specifier === './businessRules' && context.parentURL === formatterUrl ? './businessRules.ts' : specifier, context)
} })
const { buildPopMusicContractData, formatDateBR } = await import(formatterUrl)
resolver.deregister()

it('preserva a data civil do aluno sem retroceder um dia por conversão UTC', () => {
  assert.equal(formatDateBR('2003-01-29'), '29/01/2003')
  assert.equal(formatDateBR('2024-02-29'), '29/02/2024')
})
it('usa nome, turma, valores e data da assinatura mesmo após editar o cadastro', () => {
  const snapshot = {
    aluno: { nome: 'Nome assinado', data_nascimento: '2000-01-29' },
    contrato: { valor_mensalidade: 180, dia_vencimento: 10, data_inicio_vigencia: '2026-10-29' },
    turmas: [{ dia_semana: 3, horario_inicio: '08:00:00', horario_fim: '09:00:00', modalidades: { nome: 'Teclado' } }],
    escola: { nome: 'Escola assinada' }
  }
  const data = buildPopMusicContractData({ nome: 'Nome alterado' }, { valor_mensalidade: 999, documento_assinado_snapshot: snapshot }, [{ dia_semana: 4, horario_inicio: '14:00:00', modalidades: { nome: 'Violão' } }])
  assert.equal(data.nome_aluno, 'Nome assinado')
  assert.equal(data.curso, 'Teclado')
  assert.equal(data.dias_semana, 'Quarta-feira')
  assert.equal(data.horario_inicio, '08:00')
  assert.equal(data.horario_fim, '09:00')
  assert.equal(data.valor_mensalidade, '180,00')
  assert.equal(data.data_dia, '29')
  assert.equal(data.escola_nome, 'Escola assinada')
})
