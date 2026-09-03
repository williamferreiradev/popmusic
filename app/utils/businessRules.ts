export type ChargeStatus = 'pendente' | 'paga' | 'atrasada' | 'cancelada'
export type CommissionType = 'percentual' | 'fixo'

const parseDateOnly = (value: string | Date): Date => {
  if (value instanceof Date) return new Date(value.getTime())
  const dateOnly = value.slice(0, 10)
  return new Date(`${dateOnly}T12:00:00`)
}

export const calculateAge = (birthDate: string | Date, referenceDate: string | Date = new Date()): number | null => {
  const birth = parseDateOnly(birthDate)
  const reference = parseDateOnly(referenceDate)
  if (Number.isNaN(birth.getTime()) || Number.isNaN(reference.getTime()) || birth > reference) return null

  let age = reference.getFullYear() - birth.getFullYear()
  const birthdayOccurred = reference.getMonth() > birth.getMonth()
    || (reference.getMonth() === birth.getMonth() && reference.getDate() >= birth.getDate())
  if (!birthdayOccurred) age--
  return age
}

export const isMinorOn = (birthDate: string | Date, referenceDate: string | Date = new Date()): boolean | null => {
  const age = calculateAge(birthDate, referenceDate)
  return age === null ? null : age < 18
}

export const calculateContractTotals = (monthlyFee: number, installments = 12) => {
  const validFee = Number.isFinite(monthlyFee) && monthlyFee >= 0 ? monthlyFee : 0
  const validInstallments = Number.isInteger(installments) && installments > 0 ? installments : 12
  return { monthlyFee: validFee, installments: validInstallments, total: validFee * validInstallments }
}

export const resolveChargeStatus = (
  status: ChargeStatus | null | undefined,
  dueDate: string | null | undefined,
  referenceDate: string | Date = new Date()
): ChargeStatus => {
  const currentStatus = status || 'pendente'
  if (currentStatus !== 'pendente' || !dueDate) return currentStatus
  const reference = referenceDate instanceof Date
    ? `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}-${String(referenceDate.getDate()).padStart(2, '0')}`
    : referenceDate.slice(0, 10)
  return dueDate.slice(0, 10) < reference ? 'atrasada' : 'pendente'
}

export const calculateTeacherCommission = (
  monthlyFee: number,
  classesGiven: number,
  commissionType: CommissionType,
  commissionValue: number
) => {
  const classCount = Math.max(0, Math.trunc(classesGiven))
  const classValue = classCount > 0 ? Math.max(0, monthlyFee) / 4 : 0
  const amountPerClass = commissionType === 'percentual'
    ? classValue * (Math.max(0, commissionValue) / 100)
    : Math.max(0, commissionValue)
  return { classValue, amountPerClass, total: amountPerClass * classCount }
}
