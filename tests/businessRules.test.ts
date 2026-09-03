import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  calculateAge,
  calculateContractTotals,
  calculateTeacherCommission,
  isMinorOn,
  resolveChargeStatus
} from '../app/utils/businessRules.ts'

describe('maioridade e responsável contratual', () => {
  it('considera menor até o dia anterior ao aniversário de 18 anos', () => {
    assert.equal(calculateAge('2008-09-04', '2026-09-03'), 17)
    assert.equal(isMinorOn('2008-09-04', '2026-09-03'), true)
  })

  it('considera maior exatamente no aniversário de 18 anos', () => {
    assert.equal(calculateAge('2008-09-03', '2026-09-03'), 18)
    assert.equal(isMinorOn('2008-09-03', '2026-09-03'), false)
  })

  it('rejeita datas inválidas ou futuras', () => {
    assert.equal(calculateAge('data-inválida', '2026-09-03'), null)
    assert.equal(calculateAge('2030-01-01', '2026-09-03'), null)
  })
})

describe('valores e vencimentos', () => {
  it('calcula o total padrão de doze mensalidades', () => {
    assert.deepEqual(calculateContractTotals(180), { monthlyFee: 180, installments: 12, total: 2160 })
  })

  it('marca apenas cobrança pendente vencida como atrasada', () => {
    assert.equal(resolveChargeStatus('pendente', '2026-09-02', '2026-09-03'), 'atrasada')
    assert.equal(resolveChargeStatus('pendente', '2026-09-03', '2026-09-03'), 'pendente')
    assert.equal(resolveChargeStatus('paga', '2026-09-02', '2026-09-03'), 'paga')
  })
})

describe('repasse do professor', () => {
  it('calcula repasse percentual sobre quatro aulas mensais', () => {
    assert.deepEqual(calculateTeacherCommission(200, 4, 'percentual', 50), {
      classValue: 50,
      amountPerClass: 25,
      total: 100
    })
  })

  it('calcula repasse fixo por aula realizada', () => {
    assert.deepEqual(calculateTeacherCommission(200, 3, 'fixo', 30), {
      classValue: 50,
      amountPerClass: 30,
      total: 90
    })
  })
})
