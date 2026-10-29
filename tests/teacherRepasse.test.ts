import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { summarizeTeacherRepasses, type TeacherRepasseRow } from '../app/utils/teacherRepasse.ts'

const row = (overrides: Partial<TeacherRepasseRow> = {}): TeacherRepasseRow => ({
  valor_total: '150.00', status: 'pago', data_pagamento: '2026-10-28', mes_referencia: '2026-10-01', ...overrides
})

describe('valores exibidos no dashboard do professor', () => {
  it('soma pagamentos complementares sem perder o primeiro pagamento', () => {
    assert.deepEqual(summarizeTeacherRepasses([row(), row({ valor_total: '50.25' })], '2026-10-28'), {
      receivedMonth: 200.25, receivedTotal: 200.25, pending: 0
    })
  })
  it('usa o mês do pagamento real quando a competência é anterior', () => {
    assert.deepEqual(summarizeTeacherRepasses([row({ mes_referencia: '2026-09-01' })], '2026-10-28'), {
      receivedMonth: 150, receivedTotal: 150, pending: 0
    })
  })
  it('mantém o histórico anterior fora do recebido no mês', () => {
    assert.deepEqual(summarizeTeacherRepasses([row({ data_pagamento: '2026-09-30' })], '2026-10-28'), {
      receivedMonth: 0, receivedTotal: 150, pending: 0
    })
  })
  it('não considera data preenchida como confirmação de pagamento pendente ou cancelado', () => {
    assert.deepEqual(summarizeTeacherRepasses([row({ status: 'pendente' }), row({ status: 'cancelado' })], '2026-10-28'), {
      receivedMonth: 0, receivedTotal: 0, pending: 150
    })
  })
  it('não transforma valor inválido em total NaN ou negativo', () => {
    assert.deepEqual(summarizeTeacherRepasses([row({ valor_total: 'inválido' }), row({ valor_total: -10 })], '2026-10-28'), {
      receivedMonth: 0, receivedTotal: 0, pending: 0
    })
  })
})
