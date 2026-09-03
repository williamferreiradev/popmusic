<template>
  <div class="flex-1 flex flex-col gap-6">
    
    <!-- Cards Resumo -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-light-surface dark:bg-dark-surface p-4 rounded-xl border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-center">
        <p class="text-xs font-medium text-light-text/60 dark:text-offwhite/60 mb-1">Entradas (Mês)</p>
        <p class="text-lg font-bold text-green-500">{{ formatCurrency(resumo.entradas) }}</p>
      </div>
      <div class="bg-light-surface dark:bg-dark-surface p-4 rounded-xl border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-center">
        <p class="text-xs font-medium text-light-text/60 dark:text-offwhite/60 mb-1">Saídas (Mês)</p>
        <p class="text-lg font-bold text-red-500">{{ formatCurrency(resumo.saidas) }}</p>
      </div>
      <div class="bg-light-surface dark:bg-dark-surface p-4 rounded-xl border shadow-sm flex flex-col justify-center relative overflow-hidden" :class="resumo.saldo >= 0 ? 'border-green-500/30 dark:border-green-500/30' : 'border-red-500/30 dark:border-red-500/30'">
        <div class="absolute top-0 left-0 w-1 h-full" :class="resumo.saldo >= 0 ? 'bg-green-500' : 'bg-red-500'"></div>
        <p class="text-xs font-medium text-light-text/60 dark:text-offwhite/60 mb-1 ml-2">Saldo do Mês</p>
        <p class="text-lg font-bold ml-2" :class="resumo.saldo >= 0 ? 'text-green-500' : 'text-red-500'">
          {{ formatCurrency(resumo.saldo) }}
        </p>
      </div>
      <!-- Saldo por Conta (Mini lista) -->
      <div class="bg-light-surface dark:bg-dark-surface p-3 rounded-xl border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-center gap-1.5 overflow-y-auto max-h-24">
        <div v-for="(saldo, conta) in saldoPorConta" :key="conta" class="flex justify-between items-center text-xs">
          <span class="text-light-text/70 dark:text-offwhite/70">{{ conta }}:</span>
          <span class="font-bold text-light-text dark:text-offwhite">{{ formatCurrency(saldo) }}</span>
        </div>
      </div>
    </div>

    <!-- Barra de Filtros e Ações -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      
      <!-- Filtros em Pills de Contas -->
      <div class="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar mask-edges max-w-[60vw]">
        <button 
          v-for="pill in accountFilters" 
          :key="pill"
          @click="activeAccountFilter = pill"
          class="px-4 py-1.5 rounded-full text-sm font-bold transition-colors whitespace-nowrap border"
          :class="activeAccountFilter === pill ? 'bg-primary text-white border-primary' : 'bg-transparent border-light-border dark:border-dark-border text-light-text/70 dark:text-offwhite/70 hover:bg-light-surface dark:hover:bg-dark-surface'"
        >
          {{ pill }}
        </button>
      </div>

      <div class="flex items-center gap-3 shrink-0">
        <!-- Mês Atual (Mock) -->
        <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border px-4 py-2 rounded-md font-bold text-sm text-light-text dark:text-offwhite">
          Julho 2026
        </div>

        <!-- Novo Lançamento -->
        <button 
          @click="isNewEntryModalOpen = true"
          class="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-md transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <Plus class="w-4 h-4" />
          <span class="hidden sm:inline">Novo lançamento</span>
        </button>
      </div>

    </div>

    <!-- Tabela -->
    <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-light-bg/50 dark:bg-dark-bg/50 border-b border-light-border dark:border-dark-border">
              <th class="p-4 text-xs font-bold text-light-text/60 dark:text-offwhite/60 uppercase tracking-wider">Data</th>
              <th class="p-4 text-xs font-bold text-light-text/60 dark:text-offwhite/60 uppercase tracking-wider">Descrição</th>
              <th class="p-4 text-xs font-bold text-light-text/60 dark:text-offwhite/60 uppercase tracking-wider">Categoria</th>
              <th class="p-4 text-xs font-bold text-light-text/60 dark:text-offwhite/60 uppercase tracking-wider">Conta</th>
              <th class="p-4 text-xs font-bold text-light-text/60 dark:text-offwhite/60 uppercase tracking-wider text-right">Valor</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-light-border/50 dark:divide-dark-border/50">
            
            <tr 
              v-for="item in filteredTransactions" 
              :key="item.id"
              class="hover:bg-light-bg/50 dark:hover:bg-dark-bg/50 transition-colors group cursor-pointer"
              @click="item.isAuto ? openReadonlyModal(item) : null"
            >
              <td class="p-4 text-sm text-light-text/80 dark:text-offwhite/80 whitespace-nowrap">
                {{ formatDateBR(item.date) }}
              </td>
              <td class="p-4 text-sm font-medium text-light-text dark:text-offwhite flex items-center gap-2">
                {{ item.description }}
                <span v-if="item.isAuto" class="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase" title="Lançamento automático via sistema">Auto</span>
              </td>
              <td class="p-4 text-sm text-light-text/60 dark:text-offwhite/60">
                <span class="px-2 py-1 bg-light-border/50 dark:bg-dark-border/50 rounded text-xs">{{ item.category }}</span>
              </td>
              <td class="p-4 text-sm font-medium text-light-text dark:text-offwhite">
                {{ item.account }}
              </td>
              <td class="p-4 text-sm font-bold text-right" :class="item.type === 'entrada' ? 'text-green-500' : 'text-red-500'">
                {{ item.type === 'entrada' ? '+' : '-' }} {{ formatCurrency(item.amount) }}
              </td>
            </tr>
            
            <!-- Estado Vazio -->
            <tr v-if="filteredTransactions.length === 0">
              <td colspan="5" class="p-12 text-center text-light-text/50 dark:text-offwhite/50">
                <FileX class="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p class="font-medium text-lg text-light-text dark:text-offwhite">Nenhum lançamento neste período.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modais -->
    <CashflowEntryModal 
      :is-open="isNewEntryModalOpen"
      @close="isNewEntryModalOpen = false"
      @confirm="handleNewEntry"
    />

    <ReadonlyTransactionModal 
      :is-open="isReadonlyModalOpen"
      :transaction="selectedTransaction"
      @close="isReadonlyModalOpen = false"
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
import { ref, computed, onMounted } from 'vue'
import { Plus, FileX } from '@lucide/vue'
import { useFinanceiro, type CashflowEntry } from '../../composables/useFinanceiro'

import CashflowEntryModal from '../modals/CashflowEntryModal.vue'
import ReadonlyTransactionModal from '../modals/ReadonlyTransactionModal.vue'

const { cashflow, accounts, fetchCashflow, fetchAccounts, addCashflowEntry } = useFinanceiro()

onMounted(async () => {
  await Promise.all([fetchCashflow(), fetchAccounts()])
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const formatDateBR = (isoStr: string) => {
  if (!isoStr) return '-'
  const [y, m, d] = isoStr.split('-')
  return `${d}/${m}/${y}`
}

// Filtros
const accountFilters = computed(() => {
  const list = accounts.value.map(a => a.nome)
  return ['Todas as contas', ...list]
})
const activeAccountFilter = ref('Todas as contas')

const filteredTransactions = computed(() => {
  let list = [...cashflow.value].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  if (activeAccountFilter.value !== 'Todas as contas') {
    list = list.filter(t => t.account === activeAccountFilter.value)
  }
  return list
})

// Cards Resumo
const resumo = computed(() => {
  let entradas = 0
  let saidas = 0
  
  filteredTransactions.value.forEach(t => {
    if (t.type === 'entrada') entradas += t.amount
    else saidas += t.amount
  })
  
  return { entradas, saidas, saldo: entradas - saidas }
})

const saldoPorConta = computed(() => {
  const saldos: Record<string, number> = {}
  
  accounts.value.forEach(acc => {
    saldos[acc.nome] = acc.saldo_inicial
  })

  cashflow.value.forEach(t => {
    if (saldos[t.account] !== undefined) {
      const currentBalance = saldos[t.account] ?? 0
      saldos[t.account] = t.type === 'entrada' ? currentBalance + t.amount : currentBalance - t.amount
    }
  })
  return saldos
})

// Modais
const isNewEntryModalOpen = ref(false)
const isReadonlyModalOpen = ref(false)
const selectedTransaction = ref<CashflowEntry | null>(null)

const openReadonlyModal = (t: CashflowEntry) => {
  selectedTransaction.value = t
  isReadonlyModalOpen.value = true
}

const handleNewEntry = async (data: any) => {
  const conta = accounts.value.find(a => a.nome === data.account) || accounts.value[0]
  if (!conta) return

  await addCashflowEntry({
    tipo: data.type,
    descricao: data.description,
    valor: data.amount,
    data: data.date,
    conta_id: conta.id,
    categoria: data.category
  })
  isNewEntryModalOpen.value = false
  showToast('Lançamento adicionado com sucesso!')
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

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.mask-edges {
  mask-image: linear-gradient(to right, transparent, black 10px, black calc(100% - 10px), transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 10px, black calc(100% - 10px), transparent);
}
</style>
