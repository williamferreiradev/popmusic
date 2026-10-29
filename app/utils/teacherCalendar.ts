export type CalendarView = 'Dia' | 'Semana' | 'Mês'

export const calendarDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export function calendarDays(date: Date, view: CalendarView): Date[] {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)
  if (view === 'Mês') start.setDate(1)
  if (view !== 'Dia') start.setDate(start.getDate() - (start.getDay() + 6) % 7)
  return Array.from({ length: view === 'Mês' ? 42 : view === 'Semana' ? 7 : 1 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
}

export function shiftCalendarDate(date: Date, view: CalendarView, direction: number): Date {
  const result = new Date(date)
  if (view === 'Mês') {
    const originalDay = result.getDate()
    result.setDate(1)
    result.setMonth(result.getMonth() + direction)
    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()
    result.setDate(Math.min(originalDay, lastDay))
  } else result.setDate(result.getDate() + direction * (view === 'Semana' ? 7 : 1))
  return result
}
