import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { calendarDateKey, calendarDays, shiftCalendarDate } from '../app/utils/teacherCalendar.ts'

describe('calendário do professor', () => {
  it('mantém a data civil local mesmo no fim do dia', () => {
    assert.equal(calendarDateKey(new Date(2026, 9, 29, 23, 59)), '2026-10-29')
  })
  it('mostra segunda a domingo ao selecionar um domingo', () => {
    const days = calendarDays(new Date(2026, 10, 1), 'Semana')
    assert.equal(days.length, 7)
    assert.equal(calendarDateKey(days[0]!), '2026-10-26')
    assert.equal(calendarDateKey(days[6]!), '2026-11-01')
  })
  it('preenche o mês incluindo os dias das semanas nas bordas', () => {
    const days = calendarDays(new Date(2026, 10, 30), 'Mês')
    assert.equal(days.length, 42)
    assert.equal(calendarDateKey(days[0]!), '2026-10-26')
    assert.equal(calendarDateKey(days[41]!), '2026-12-06')
    assert.equal(days.filter(day => day.getMonth() === 10).length, 30)
  })
  it('avança de janeiro para fevereiro sem pular um mês em dias 29 a 31', () => {
    assert.equal(calendarDateKey(shiftCalendarDate(new Date(2026, 0, 31), 'Mês', 1)), '2026-02-28')
    assert.equal(calendarDateKey(shiftCalendarDate(new Date(2024, 0, 31), 'Mês', 1)), '2024-02-29')
    assert.equal(calendarDateKey(shiftCalendarDate(new Date(2026, 2, 31), 'Mês', -1)), '2026-02-28')
  })
  it('navega dias e semanas atravessando anos sem alterar a origem', () => {
    const origin = new Date(2026, 11, 31)
    assert.equal(calendarDateKey(shiftCalendarDate(origin, 'Dia', 1)), '2027-01-01')
    assert.equal(calendarDateKey(shiftCalendarDate(origin, 'Semana', 1)), '2027-01-07')
    assert.equal(calendarDateKey(origin), '2026-12-31')
    assert.equal(calendarDays(origin, 'Dia').length, 1)
  })
})
