<template>
  <div class="flex-1 flex flex-col gap-6">

    <!-- Cards Resumo -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-light-surface dark:bg-dark-surface p-4 rounded-xl border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-center">
        <p class="text-xs font-medium text-light-text/60 dark:text-offwhite/60 mb-1">Total a receber</p>
        <p class="text-lg font-bold text-light-text dark:text-offwhite">{{ formatCurrency(resumo.aReceber) }}</p>
      </div>
      <div class="bg-light-surface dark:bg-dark-surface p-4 rounded-xl border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-center">
        <p class="text-xs font-medium text-light-text/60 dark:text-offwhite/60 mb-1">Total recebido</p>
        <p class="text-lg font-bold text-green-500">{{ formatCurrency(resumo.recebido) }}</p>
      </div>
      <div class="bg-light-surface dark:bg-dark-surface p-4 rounded-xl border border-red-500/30 dark:border-red-500/30 shadow-sm flex flex-col justify-center relative overflow-hidden">
        <div class="absolute top-0 left-0 w-1 h-full bg-red-500"/>
        <p class="text-xs font-medium text-light-text/60 dark:text-offwhite/60 mb-1 ml-2">Total em atraso</p>
        <p class="text-lg font-bold text-red-500 ml-2">{{ formatCurrency(resumo.atrasado) }}</p>
      </div>
    </div>

    <div class="flex items-center justify-between text-sm text-light-text/60 dark:text-offwhite/60">
      <span>Mostrando {{ pagedChargesTotal ? (currentPage - 1) * pageSize + 1 : 0 }} a {{ Math.min((currentPage - 1) * pageSize + filteredCharges.length, pagedChargesTotal) }} de {{ pagedChargesTotal }}</span>
      <div class="flex gap-2">
        <button class="px-4 py-2 rounded-md border border-light-border dark:border-dark-border disabled:opacity-40" :disabled="currentPage === 1" @click="currentPage--">Anterior</button>
        <button class="px-4 py-2 rounded-md border border-light-border dark:border-dark-border disabled:opacity-40" :disabled="currentPage >= totalPages" @click="currentPage++">Próximo</button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 rounded-xl border border-light-border bg-light-surface p-4 dark:border-dark-border dark:bg-dark-surface sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label class="mb-1 block text-xs font-bold text-light-text/60 dark:text-offwhite/60">Vencimento inicial</label>
        <input v-model="startDate" type="date" :max="endDate || undefined" class="w-full rounded-md border border-light-border bg-light-surface px-3 py-2 text-sm text-light-text outline-none focus:border-primary dark:border-dark-border dark:bg-dark-surface dark:text-offwhite">
      </div>
      <div>
        <label class="mb-1 block text-xs font-bold text-light-text/60 dark:text-offwhite/60">Vencimento final</label>
        <input v-model="endDate" type="date" :min="startDate || undefined" class="w-full rounded-md border border-light-border bg-light-surface px-3 py-2 text-sm text-light-text outline-none focus:border-primary dark:border-dark-border dark:bg-dark-surface dark:text-offwhite">
      </div>
      <div>
        <label class="mb-1 block text-xs font-bold text-light-text/60 dark:text-offwhite/60">Forma de pagamento</label>
        <select v-model="paymentMethodFilter" class="w-full rounded-md border border-light-border bg-light-surface px-3 py-2 text-sm text-light-text outline-none focus:border-primary dark:border-dark-border dark:bg-dark-surface dark:text-offwhite">
          <option value="">Todas as formas</option>
          <option value="pix">Pix</option>
          <option value="dinheiro">Dinheiro</option>
          <option value="cartao">Cartão</option>
          <option value="transferencia">Transferência</option>
          <option value="boleto">Boleto</option>
        </select>
      </div>
      <div class="flex items-end">
        <button :disabled="!hasAdvancedFilters" class="w-full rounded-md border border-light-border px-4 py-2 text-sm font-bold text-light-text transition-colors hover:bg-light-bg disabled:cursor-not-allowed disabled:opacity-40 dark:border-dark-border dark:text-offwhite dark:hover:bg-dark-bg" @click="clearAdvancedFilters">
          Limpar filtros avançados
        </button>
      </div>
    </div>

    <!-- Banner de Chave PIX Padrão da Escola -->
    <div v-if="pixKeySchool" class="bg-primary/10 border border-primary/20 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-primary text-black flex items-center justify-center font-bold text-xs shrink-0">
          PIX
        </div>
        <div>
          <p class="text-xs font-bold text-light-text dark:text-offwhite">Chave PIX Oficial para Recebimento de Mensalidades</p>
          <p class="text-xs font-mono text-primary">{{ pixKeySchool }}</p>
        </div>
      </div>
      <button
        class="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 self-end sm:self-auto cursor-pointer"
        @click="copySchoolPix"
      >
        <Copy class="w-3.5 h-3.5" />
        {{ copiedSchoolPix ? 'Chave Copiada!' : 'Copiar Chave PIX' }}
      </button>
    </div>

    <!-- Barra de Filtros e Ações -->
    <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">

      <div class="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
        <!-- Filtros em Pills -->
        <div class="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          <button
            v-for="pill in filterPills"
            :key="pill.value"
            class="px-4 py-1.5 rounded-full text-sm font-bold transition-colors whitespace-nowrap border"
            :class="activeFilter === pill.value ? 'bg-primary text-white border-primary' : 'bg-transparent border-light-border dark:border-dark-border text-light-text/70 dark:text-offwhite/70 hover:bg-light-surface dark:hover:bg-dark-surface'"
            @click="activeFilter = pill.value"
          >
            {{ pill.label }}
          </button>
        </div>

        <!-- Busca -->
        <div class="relative w-full sm:max-w-xs">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-light-text/50 dark:text-offwhite/50" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar aluno..."
            class="w-full pl-9 pr-4 py-2 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md text-sm text-light-text dark:text-offwhite focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          >
        </div>
      </div>

      <!-- Nova Cobrança -->
      <button
        class="px-6 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-md transition-colors shadow-sm flex items-center justify-center gap-2 shrink-0"
        @click="isNewChargeOpen = true"
      >
        <Plus class="w-4 h-4" />
        Nova cobrança avulsa
      </button>

    </div>

    <!-- Tabela -->
    <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl shadow-sm flex flex-col flex-1">
      <div class="overflow-x-auto min-h-[300px] pb-16">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-light-bg/50 dark:bg-dark-bg/50 border-b border-light-border dark:border-dark-border">
              <th class="p-4 text-xs font-bold text-light-text/60 dark:text-offwhite/60 uppercase tracking-wider">Aluno</th>
              <th class="p-4 text-xs font-bold text-light-text/60 dark:text-offwhite/60 uppercase tracking-wider">Descrição</th>
              <th class="p-4 text-xs font-bold text-light-text/60 dark:text-offwhite/60 uppercase tracking-wider">Valor</th>
              <th class="p-4 text-xs font-bold text-light-text/60 dark:text-offwhite/60 uppercase tracking-wider">Vencimento</th>
              <th class="p-4 text-xs font-bold text-light-text/60 dark:text-offwhite/60 uppercase tracking-wider">Status</th>
              <th class="p-4 text-xs font-bold text-light-text/60 dark:text-offwhite/60 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-light-border/50 dark:divide-dark-border/50">

            <tr
              v-for="charge in filteredCharges"
              :key="charge.id"
              class="group transition-colors"
              :class="getRowClass(charge.status)"
            >
              <td class="p-4 text-sm font-bold" :class="charge.status === 'cancelada' ? 'text-light-text/50 dark:text-offwhite/50' : 'text-light-text dark:text-offwhite'">
                {{ charge.studentName }}
              </td>
              <td class="p-4 text-sm text-light-text/80 dark:text-offwhite/80" :class="charge.status === 'cancelada' && 'opacity-50 line-through'">
                {{ charge.description }}
              </td>
              <td class="p-4 text-sm font-bold" :class="charge.status === 'cancelada' ? 'text-light-text/50 dark:text-offwhite/50' : 'text-light-text dark:text-offwhite'">
                {{ formatCurrency(charge.amount) }}
              </td>
              <td class="p-4 text-sm text-light-text/80 dark:text-offwhite/80" :class="charge.status === 'cancelada' && 'opacity-50'">
                {{ formatDateBR(charge.dueDate) }}
              </td>
              <td class="p-4 text-sm">
                <span class="px-2 py-1 rounded text-xs font-bold" :class="getStatusBadgeClass(charge.status)">
                  {{ charge.status.charAt(0).toUpperCase() + charge.status.slice(1) }}
                </span>
              </td>
              <td class="p-4 text-right">

                <!-- Menu de Ações -->
                <div v-click-outside="() => activeDropdown = null" class="relative inline-block text-left">
                  <button
                    class="p-2 rounded-md hover:bg-light-border/50 dark:hover:bg-dark-border/50 transition-colors text-light-text/60 dark:text-offwhite/60"
                    @click.stop="toggleDropdown(charge.id)"
                  >
                    <MoreVertical class="w-4 h-4" />
                  </button>

                  <!-- Dropdown Interno -->
                  <div
                    v-if="activeDropdown === charge.id"
                    class="absolute right-0 mt-1 w-48 rounded-lg shadow-2xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border z-50 py-1.5 ring-1 ring-black/10"
                    @click.stop
                  >
                    <button
                      v-if="charge.status !== 'cancelada'"
                      class="flex items-center w-full px-4 py-2 text-sm text-light-text dark:text-offwhite hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
                      @click="resendCharge(charge); activeDropdown = null"
                    >
                      Reenviar cobrança
                    </button>
                    <button
                      v-if="charge.status === 'pendente' || charge.status === 'atrasada'"
                      class="flex items-center w-full px-4 py-2 text-sm text-green-500 hover:bg-light-bg dark:hover:bg-dark-bg transition-colors font-medium"
                      @click="openPaymentModal(charge); activeDropdown = null"
                    >
                      Marcar como pago
                    </button>
                    <!-- Editar estático para o protótipo -->
                    <button
                      v-if="charge.status !== 'cancelada' && charge.status !== 'paga'"
                      class="flex items-center w-full px-4 py-2 text-sm text-light-text dark:text-offwhite hover:bg-light-bg dark:hover:bg-dark-bg transition-colors opacity-50 cursor-not-allowed"
                      title="Editar indisponível no protótipo"
                    >
                      Editar
                    </button>
                    <button
                      v-if="charge.status !== 'cancelada' && charge.status !== 'paga'"
                      class="flex items-center w-full px-4 py-2 text-sm text-red-500 hover:bg-light-bg dark:hover:bg-dark-bg transition-colors font-medium"
                      @click="openCancelModal(charge); activeDropdown = null"
                    >
                      Cancelar cobrança
                    </button>
                    <button
                      v-if="charge.status === 'paga'"
                      class="flex w-full items-center px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-light-bg dark:hover:bg-dark-bg"
                      @click="openRefundModal(charge); activeDropdown = null"
                    >
                      Estornar pagamento
                    </button>
                  </div>
                </div>

              </td>
            </tr>

            <!-- Estado Vazio -->
            <tr v-if="filteredCharges.length === 0">
              <td colspan="6" class="p-12 text-center text-light-text/50 dark:text-offwhite/50">
                <FileX class="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p class="font-medium text-lg text-light-text dark:text-offwhite">Nenhuma cobrança encontrada</p>
                <p class="text-sm mt-1">Tente ajustar seus filtros ou realizar uma nova busca.</p>
                <button
                  v-if="activeFilter !== 'todas' || searchQuery !== '' || hasAdvancedFilters"
                  class="mt-4 px-4 py-2 text-sm text-primary font-bold hover:bg-primary/10 rounded-md transition-colors"
                  @click="clearAllFilters"
                >
                  Limpar filtros
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modais -->
    <NewChargeModal
      :is-open="isNewChargeOpen"
      @close="isNewChargeOpen = false"
      @confirm="handleNewCharge"
    />

    <ManualPaymentModal
      :is-open="isPaymentModalOpen"
      :charge="selectedCharge"
      :accounts="accounts"
      @close="isPaymentModalOpen = false"
      @confirm="handlePayment"
    />

    <CancelChargeModal
      :is-open="isCancelModalOpen"
      :charge="selectedCharge"
      @close="isCancelModalOpen = false"
      @confirm="handleCancel"
    />

    <RefundChargeModal
      :is-open="isRefundModalOpen"
      :charge="selectedCharge"
      :accounts="accounts"
      @close="isRefundModalOpen = false"
      @confirm="handleRefund"
    />

    <!-- Toast flutuante -->
    <div
      class="fixed bottom-6 right-6 bg-light-surface dark:bg-dark-surface border-l-4 shadow-xl rounded-r-md px-6 py-3 transition-all duration-300 z-50 flex flex-col"
      :class="[
        toastVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none',
        toastType === 'success' ? 'border-green-500' : 'border-primary'
      ]"
    >
      <p class="text-sm font-bold text-light-text dark:text-offwhite">{{ toastMessage }}</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Search, Plus, MoreVertical, FileX, Copy } from '@lucide/vue'
import { useFinanceiro, type Charge } from '../../composables/useFinanceiro'
import type { ChargeStatus } from '~/utils/businessRules'

// Modais
import NewChargeModal from '../modals/NewChargeModal.vue'
import ManualPaymentModal from '../modals/ManualPaymentModal.vue'
import CancelChargeModal from '../modals/CancelChargeModal.vue'
import RefundChargeModal from '../modals/RefundChargeModal.vue'

const { school, loadSchool } = useSchoolSettings()
await loadSchool()
const pixKeySchool = computed(() => school.value.pix_chave)
const copiedSchoolPix = ref(false)

const copySchoolPix = async () => {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    if (pixKeySchool.value) await navigator.clipboard.writeText(pixKeySchool.value)
    copiedSchoolPix.value = true
    setTimeout(() => { copiedSchoolPix.value = false }, 2500)
  }
}

// Diretiva v-click-outside simplificada
const vClickOutside = {
  mounted(el: any, binding: any) {
    el.clickOutsideEvent = (event: Event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value()
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el: any) {
    document.removeEventListener('click', el.clickOutsideEvent)
  }
}

const { pagedCharges, pagedChargesTotal, chargeSummary, accounts, fetchPagedCharges, fetchChargeSummary, fetchAccounts, createCharge, payCharge, cancelCharge, refundCharge } = useFinanceiro()

const currentPage = ref(1)
const pageSize = 10
const totalPages = computed(() => Math.max(1, Math.ceil(pagedChargesTotal.value / pageSize)))

// Formatadores
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const formatDateBR = (isoStr: string) => {
  if (!isoStr) return '-'
  const [y, m, d] = isoStr.split('-')
  return `${d}/${m}/${y}`
}

// Cards de Resumo
const resumo = computed(() => chargeSummary.value)

// Filtros e Busca
const activeFilter = ref('abertas')
const searchQuery = ref('')
const startDate = ref('')
const endDate = ref('')
const paymentMethodFilter = ref('')
const activeDropdown = ref<string | null>(null)

const loadPage = () => fetchPagedCharges({
  page: currentPage.value, pageSize, status: activeFilter.value, search: searchQuery.value,
  startDate: startDate.value, endDate: endDate.value, paymentMethod: paymentMethodFilter.value
})

onMounted(async () => { await Promise.all([loadPage(), fetchChargeSummary(), fetchAccounts()]) })
watch([activeFilter, searchQuery, startDate, endDate, paymentMethodFilter], async () => {
  currentPage.value = 1
  await loadPage()
})
watch(currentPage, loadPage)

const hasAdvancedFilters = computed(() => Boolean(startDate.value || endDate.value || paymentMethodFilter.value))
const clearAdvancedFilters = () => {
  startDate.value = ''
  endDate.value = ''
  paymentMethodFilter.value = ''
}
const clearAllFilters = () => {
  activeFilter.value = 'todas'
  searchQuery.value = ''
  clearAdvancedFilters()
}

const filterPills = [
  { label: 'Em Aberto / Mês Atual', value: 'abertas' },
  { label: 'Do Mês & Atrasadas', value: 'mes_atual' },
  { label: 'Pagas (Quitadas)', value: 'paga' },
  { label: 'Pendentes Futuras', value: 'pendente' },
  { label: 'Atrasadas', value: 'atrasada' },
  { label: 'Todas as Cobranças', value: 'todas' },
  { label: 'Canceladas', value: 'cancelada' }
]

const toggleDropdown = (id: string) => {
  activeDropdown.value = activeDropdown.value === id ? null : id
}

const filteredCharges = computed(() => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const list = pagedCharges.value.filter(c => {
    // Aplica busca por aluno ou descrição
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const matchStudent = c.studentName.toLowerCase().includes(q)
      const matchDesc = c.description.toLowerCase().includes(q)
      if (!matchStudent && !matchDesc) return false
    }

    if (startDate.value && (!c.dueDate || c.dueDate < startDate.value)) return false
    if (endDate.value && (!c.dueDate || c.dueDate > endDate.value)) return false
    if (paymentMethodFilter.value && c.paymentMethod !== paymentMethodFilter.value) return false

    const isPago = c.status === 'paga' || (c.status as any) === 'pago'
    const isAtrasado = c.status === 'atrasada' || (c.status as any) === 'atrasado'
    const isPendente = c.status === 'pendente'

    let isCurrentMonth = false
    if (c.dueDate) {
      const d = new Date(c.dueDate + 'T12:00:00Z')
      if (!isNaN(d.getTime())) {
        isCurrentMonth = d.getFullYear() === currentYear && d.getMonth() === currentMonth
      }
    }

    // Filtros
    if (activeFilter.value === 'abertas') {
      // Exibe apenas as abertas (não pagas e não canceladas)
      return !isPago && c.status !== 'cancelada'
    } else if (activeFilter.value === 'mes_atual') {
      // Exibe apenas as do mês atual ou que estejam atrasadas
      return (isCurrentMonth || isAtrasado) && !isPago && c.status !== 'cancelada'
    } else if (activeFilter.value === 'paga') {
      return isPago
    } else if (activeFilter.value === 'atrasada') {
      return isAtrasado
    } else if (activeFilter.value === 'pendente') {
      return isPendente
    } else if (activeFilter.value === 'cancelada') {
      return c.status === 'cancelada'
    }

    return true // 'todas'
  })

  // Ordenação inteligente:
  // 1. Atrasadas primeiro
  // 2. Parcela do mês atual
  // 3. Próximas parcelas por data de vencimento crescente (1, 2, 3, 4...)
  // 4. Pagas (se exibidas)
  // 5. Canceladas
  return list.sort((a, b) => {
    const isPagoA = a.status === 'paga' || (a.status as any) === 'pago'
    const isPagoB = b.status === 'paga' || (b.status as any) === 'pago'
    const isAtrasadoA = a.status === 'atrasada' || (a.status as any) === 'atrasado'
    const isAtrasadoB = b.status === 'atrasada' || (b.status as any) === 'atrasado'

    const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0
    const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0

    const isCurrentA = a.dueDate ? (new Date(a.dueDate + 'T12:00:00Z').getFullYear() === currentYear && new Date(a.dueDate + 'T12:00:00Z').getMonth() === currentMonth) : false
    const isCurrentB = b.dueDate ? (new Date(b.dueDate + 'T12:00:00Z').getFullYear() === currentYear && new Date(b.dueDate + 'T12:00:00Z').getMonth() === currentMonth) : false

    const getRank = (charge: Charge, isPago: boolean, isAtrasado: boolean, isCurrent: boolean) => {
      if (isAtrasado) return 1
      if (isCurrent && !isPago) return 2
      if (!isPago && charge.status !== 'cancelada') return 3
      if (isPago) return 4
      return 5
    }

    const rankA = getRank(a, isPagoA, isAtrasadoA, isCurrentA)
    const rankB = getRank(b, isPagoB, isAtrasadoB, isCurrentB)

    if (rankA !== rankB) {
      return rankA - rankB
    }

    // Se estiver na aba de pagas, ordena pelas mais recentemente pagas ou vencimento
    if (activeFilter.value === 'paga') {
      const paidA = a.paidAt ? new Date(a.paidAt).getTime() : dateA
      const paidB = b.paidAt ? new Date(b.paidAt).getTime() : dateB
      return paidB - paidA
    }

    // Para as pendentes/futuras, ordena por vencimento crescente (1, 2, 3, 4...)
    return dateA - dateB
  })
})

// Classes Visuais
const getStatusBadgeClass = (status: ChargeStatus) => {
  switch (status as string) {
    case 'pago':
    case 'paga': return 'bg-green-500/10 text-green-500 border border-green-500/20'
    case 'pendente': return 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
    case 'atrasado':
    case 'atrasada': return 'bg-red-500/10 text-red-500 border border-red-500/20'
    case 'cancelada': return 'bg-light-border dark:bg-dark-border text-light-text/60 dark:text-offwhite/60 border border-light-border dark:border-dark-border'
    default: return ''
  }
}

const getRowClass = (status: ChargeStatus) => {
  if (status === 'atrasada' || (status as string) === 'atrasado') {
    return 'bg-red-500/5 hover:bg-red-500/10'
  }
  return 'hover:bg-light-bg/50 dark:hover:bg-dark-bg/50'
}

// Estados dos Modais
const isNewChargeOpen = ref(false)
const isPaymentModalOpen = ref(false)
const isCancelModalOpen = ref(false)
const isRefundModalOpen = ref(false)
const selectedCharge = ref<Charge | null>(null)

const openPaymentModal = (charge: Charge) => {
  selectedCharge.value = charge
  isPaymentModalOpen.value = true
}

const openCancelModal = (charge: Charge) => {
  selectedCharge.value = charge
  isCancelModalOpen.value = true
}

const openRefundModal = (charge: Charge) => {
  selectedCharge.value = charge
  isRefundModalOpen.value = true
}

// Funções de Ação
const handleNewCharge = async (data: any) => {
  try {
    await createCharge({
      aluno_id: data.studentId || data.aluno_id,
      descricao: data.description,
      valor: data.amount,
      vencimento: data.dueDate
    })
    await loadPage()
    isNewChargeOpen.value = false
    showToast('Cobrança avulsa criada!')
  } catch (error: any) {
    alert(`Não foi possível criar a cobrança. ${error.message || 'Tente novamente.'}`)
  }
}

const handlePayment = async (data: any) => {
  if (selectedCharge.value) {
    try {
      await payCharge(selectedCharge.value.id, data.paymentMethod, data.account, data.paidAt, data.observation)
      await loadPage()
      isPaymentModalOpen.value = false
      showToast('Pagamento registrado. Recibo e caixa gerados!', 'success')
    } catch (error: any) {
      console.error('Erro ao registrar pagamento manual:', error)
      alert(`Não foi possível registrar o pagamento. ${error.message || 'Tente novamente.'}`)
    }
  }
}

const handleCancel = async (data: any) => {
  if (selectedCharge.value) {
    try {
      await cancelCharge(selectedCharge.value.id, data.reason)
      await loadPage()
      isCancelModalOpen.value = false
      showToast('Cobrança cancelada com sucesso.')
    } catch (error: any) {
      alert(`Não foi possível cancelar a cobrança. ${error.message || 'Tente novamente.'}`)
    }
  }
}

const handleRefund = async (data: any) => {
  if (!selectedCharge.value) return
  try {
    await refundCharge(selectedCharge.value.id, data.account, data.refundedAt, data.reason)
    await loadPage()
    isRefundModalOpen.value = false
    showToast('Pagamento estornado e saída registrada no caixa.', 'success')
  } catch (error: any) {
    console.error('Erro ao estornar pagamento:', error)
    alert(`Não foi possível estornar o pagamento. ${error.message || 'Tente novamente.'}`)
  }
}

const resendCharge = (_charge: Charge) => {
  showToast('WhatsApp automático ainda não está configurado. Faça o envio manual pelo cadastro do aluno.', 'info')
}

// Toast
const toastVisible = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'info'>('success')
let toastTimer: any = null

const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  toastVisible.value = true

  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, 3000)
}
</script>
