export interface TeacherRepasseRow {
  valor_total: number | string | null
  status: string | null
  data_pagamento: string | null
  mes_referencia: string | null
}

// O pagamento é um registro manual. A data, isoladamente, não confirma quitação.
export function summarizeTeacherRepasses(rows: TeacherRepasseRow[], referenceDate: string) {
  return rows.reduce((summary, row) => {
    const value = Number(row.valor_total || 0)
    if (!Number.isFinite(value) || value < 0) return summary
    if (row.status === 'pago') {
      summary.receivedTotal += value
      if (String(row.data_pagamento || row.mes_referencia).slice(0, 7) === referenceDate.slice(0, 7)) {
        summary.receivedMonth += value
      }
    } else if (row.status === 'pendente') {
      summary.pending += value
    }
    return summary
  }, { receivedMonth: 0, receivedTotal: 0, pending: 0 })
}
