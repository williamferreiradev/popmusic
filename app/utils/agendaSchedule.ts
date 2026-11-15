/**
 * Regras de exibição da agenda do ADM.
 *
 * Duas decisões que a agenda precisa acertar:
 * 1. Uma turma só aparece a partir da data em que o primeiro aluno começou a
 *    frequentá-la. Sem isso, um aluno cadastrado na quinta aparecia na aula de
 *    quarta da semana anterior — o bug relatado (matricula.data_inicio era
 *    ignorada e a grade desenhava a turma em toda semana).
 * 2. Turmas com faixa horária ampla (ex.: 08:00–18:00) não podem virar um bloco
 *    de 10 horas na tela. Elas são desenhadas compactas e rotuladas como
 *    "horário amplo".
 */

export const LIMITE_HORARIO_AMPLO_MINUTOS = 180

/** Data civil local (YYYY-MM-DD) a partir de Date ou string ISO. */
export const toCivilDate = (value: Date | string): string => {
  if (typeof value === 'string') return value.slice(0, 10)
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Converte "HH:MM" ou "HH:MM:SS" em minutos desde a meia-noite. */
export const minutesFromTime = (time: string): number => {
  const [hour = 0, minute = 0] = String(time).split(':').map(Number)
  return hour * 60 + minute
}

/** Data civil da aula na semana exibida, a partir do dia da semana da turma. */
export const dataDaAulaNaSemana = (weekStart: Date, diaSemana: number): string => {
  const offset = diaSemana === 0 ? 6 : diaSemana - 1
  const data = new Date(weekStart.getTime() + offset * 86_400_000)
  return toCivilDate(data)
}

/**
 * A turma tem aula visível na semana?
 * Só aparece se houver aluno com vínculo vigente E a data da aula já tiver
 * alcançado o início da matrícula mais antiga ainda vigente.
 */
export const turmaVisivelNaData = (
  dataDaAula: string,
  vinculos: Array<{ data_inicio?: string | null, data_fim?: string | null }>,
  hoje: string
): boolean => {
  const vigentes = vinculos.filter(v => !v.data_fim)
  if (!vigentes.length) return false
  const inicio = vigentes
    .map(v => (v.data_inicio ? toCivilDate(v.data_inicio) : hoje))
    .sort()[0]
  return inicio <= dataDaAula
}

/** Faixa ampla: desenhar compacto em vez de ocupar a faixa inteira. */
export const ehHorarioAmplo = (inicio: string, fim: string): boolean => {
  const duracao = minutesFromTime(fim) - minutesFromTime(inicio)
  return duracao > LIMITE_HORARIO_AMPLO_MINUTOS
}

/** Duração legível: "1h", "1h30" ou "45min". */
export const formatarDuracao = (inicio: string, fim: string): string => {
  const minutos = Math.max(0, minutesFromTime(fim) - minutesFromTime(inicio))
  if (minutos < 60) return `${minutos}min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto === 0 ? `${horas}h` : `${horas}h${String(resto).padStart(2, '0')}`
}
