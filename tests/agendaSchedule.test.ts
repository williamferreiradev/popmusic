import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  dataDaAulaNaSemana,
  ehHorarioAmplo,
  formatarDuracao,
  minutesFromTime,
  toCivilDate,
  turmaVisivelNaData
} from '../app/utils/agendaSchedule.ts'

describe('agenda: data civil sem deslocamento de fuso', () => {
  it('mantém o dia local mesmo no fim do dia', () => {
    const fimDoDia = new Date(2026, 10, 12, 23, 30)
    assert.equal(toCivilDate(fimDoDia), '2026-11-12')
  })

  it('não deixa a string ISO deslocar o dia', () => {
    assert.equal(toCivilDate('2026-11-12T00:00:00.000Z'), '2026-11-12')
  })
})

describe('agenda: turma só aparece a partir da matrícula', () => {
  const hoje = '2026-11-12'

  it('NÃO mostra a turma na semana anterior ao cadastro (bug relatado)', () => {
    // Aluno cadastrado na quinta 12/11; a aula é de quarta.
    const quartaAnterior = '2026-11-11'
    const vinculos = [{ data_inicio: '2026-11-12', data_fim: null }]
    assert.equal(turmaVisivelNaData(quartaAnterior, vinculos, hoje), false)
  })

  it('mostra a turma na mesma semana, depois do início', () => {
    const quartaSeguinte = '2026-11-18'
    const vinculos = [{ data_inicio: '2026-11-12', data_fim: null }]
    assert.equal(turmaVisivelNaData(quartaSeguinte, vinculos, hoje), true)
  })

  it('mostra a turma no próprio dia da matrícula', () => {
    const vinculos = [{ data_inicio: '2026-11-12', data_fim: null }]
    assert.equal(turmaVisivelNaData('2026-11-12', vinculos, hoje), true)
  })

  it('não mostra turma sem aluno vigente', () => {
    assert.equal(turmaVisivelNaData('2026-11-18', [], hoje), false)
    assert.equal(turmaVisivelNaData('2026-11-18', [{ data_inicio: '2026-01-01', data_fim: '2026-06-01' }], hoje), false)
  })

  it('usa a matrícula mais antiga quando há várias', () => {
    const vinculos = [
      { data_inicio: '2026-11-20', data_fim: null },
      { data_inicio: '2026-11-05', data_fim: null }
    ]
    assert.equal(turmaVisivelNaData('2026-11-11', vinculos, hoje), true)
  })
})

describe('agenda: data da aula na semana exibida', () => {
  it('mapeia segunda a domingo corretamente', () => {
    const segunda = new Date(2026, 10, 9) // 09/11/2026 é segunda
    assert.equal(dataDaAulaNaSemana(segunda, 1), '2026-11-09') // segunda
    assert.equal(dataDaAulaNaSemana(segunda, 3), '2026-11-11') // quarta
    assert.equal(dataDaAulaNaSemana(segunda, 0), '2026-11-15') // domingo
  })
})

describe('agenda: horário amplo não vira bloco gigante', () => {
  it('detecta turma de 10 horas como ampla', () => {
    assert.equal(ehHorarioAmplo('08:00', '18:00'), true)
  })

  it('não trata aula de 1 hora como ampla', () => {
    assert.equal(ehHorarioAmplo('14:00', '15:00'), false)
  })

  it('trata 3 horas como limite ainda normal', () => {
    assert.equal(ehHorarioAmplo('08:00', '11:00'), false)
  })
})

describe('agenda: duração legível', () => {
  it('formata horas cheias, meia hora e minutos', () => {
    assert.equal(formatarDuracao('14:00', '15:00'), '1h')
    assert.equal(formatarDuracao('14:00', '15:30'), '1h30')
    assert.equal(formatarDuracao('14:00', '14:45'), '45min')
  })

  it('converte horário em minutos', () => {
    assert.equal(minutesFromTime('08:00'), 480)
    assert.equal(minutesFromTime('18:30:00'), 1110)
  })
})
