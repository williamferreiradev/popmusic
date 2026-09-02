import { ref } from 'vue'

export interface Modality {
  id: string
  name: string
  price: number
  color: string
  activeStudents: number
}

export interface Room {
  id: string
  name: string
  defaultModality: string
  capacity: number
  activeClasses: number
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: 'Gestão' | 'Secretaria'
  status: 'Ativo' | 'Inativo'
}

export interface ConfigFinancialAccount {
  id: string
  name: string
  type: 'Banco' | 'Carteira digital' | 'Dinheiro físico'
  initialBalance: number
  hasTransactions: boolean
}

export interface BillingConfig {
  courseDurationMonths: number
  extensionMonths: number
  cancelClassAdvanceHours: number
  extraClassPrice: number
  linkValidityDays: number
  requireImageConsent: boolean
  dueDateReminderDays: number
  lateFee: number
  interestPerDay: number
  secondCopyFee: number
  autoDisconnectDays: number
  lockBillingCutoffDay?: number
}

export interface AttendanceConfig {
  consecutiveAbsencesRisk: number
  minAttendancePercentage: number
  qrCodeToleranceMinutes: number
  blockNationalHolidays: boolean
  blockMunicipalHolidays: boolean
}

// Estado Global Simulado
const modalities = ref<Modality[]>([
  { id: '1', name: 'Violão', price: 150, color: '#C9A227', activeStudents: 24 },
  { id: '2', name: 'Teclado', price: 150, color: '#7A1F1F', activeStudents: 18 }
])

const rooms = ref<Room[]>([
  { id: '1', name: 'Sala 1 - Cordas', defaultModality: 'Violão', capacity: 5, activeClasses: 3 },
  { id: '2', name: 'Sala 2 - Teclas', defaultModality: 'Teclado', capacity: 3, activeClasses: 0 },
  { id: '3', name: 'Uso Geral', defaultModality: 'Uso geral', capacity: 10, activeClasses: 1 }
])

const team = ref<TeamMember[]>([
  { id: '1', name: 'João Silva', email: 'joao@escola.com', role: 'Gestão', status: 'Ativo' },
  { id: '2', name: 'Maria Souza', email: 'maria@escola.com', role: 'Secretaria', status: 'Ativo' }
])

const financialAccounts = ref<ConfigFinancialAccount[]>([
  { id: '1', name: 'Nubank', type: 'Banco', initialBalance: 1000, hasTransactions: true },
  { id: '2', name: 'Caixa', type: 'Banco', initialBalance: 500, hasTransactions: false }
])

const billingConfig = ref<BillingConfig>({
  courseDurationMonths: 12,
  extensionMonths: 6,
  cancelClassAdvanceHours: 2,
  extraClassPrice: 50.00,
  linkValidityDays: 7,
  requireImageConsent: true,
  dueDateReminderDays: 3,
  lateFee: 5.00,
  interestPerDay: 0.20,
  secondCopyFee: 30.00,
  autoDisconnectDays: 30,
  lockBillingCutoffDay: 10
})

const attendanceConfig = ref<AttendanceConfig>({
  consecutiveAbsencesRisk: 3,
  minAttendancePercentage: 70,
  qrCodeToleranceMinutes: 15,
  blockNationalHolidays: true,
  blockMunicipalHolidays: false
})

export const useConfiguracoes = () => {
  return {
    modalities,
    rooms,
    team,
    financialAccounts,
    billingConfig,
    attendanceConfig
  }
}
