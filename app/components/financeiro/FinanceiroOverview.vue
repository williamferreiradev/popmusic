<template>
  <div class="flex-1 flex flex-col gap-6">
    
    <!-- 5 Cards de Métrica -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      
      <!-- A receber este mês -->
      <div class="bg-light-surface dark:bg-dark-surface p-4 rounded-xl border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-center">
        <p class="text-xs font-medium text-light-text/60 dark:text-offwhite/60 mb-1">A receber este mês</p>
        <p class="text-lg font-bold text-light-text dark:text-offwhite">{{ formatCurrency(aReceberMes) }}</p>
      </div>

      <!-- Recebido este mês -->
      <div class="bg-light-surface dark:bg-dark-surface p-4 rounded-xl border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-center">
        <p class="text-xs font-medium text-light-text/60 dark:text-offwhite/60 mb-1">Recebido este mês</p>
        <p class="text-lg font-bold text-green-500">{{ formatCurrency(recebidoMes) }}</p>
      </div>

      <!-- Em atraso -->
      <div class="bg-light-surface dark:bg-dark-surface p-4 rounded-xl border border-red-500/30 dark:border-red-500/30 shadow-sm flex flex-col justify-center relative overflow-hidden">
        <div class="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
        <p class="text-xs font-medium text-light-text/60 dark:text-offwhite/60 mb-1 ml-2">Em atraso</p>
        <p class="text-lg font-bold text-red-500 ml-2">{{ formatCurrency(emAtraso) }}</p>
      </div>

      <!-- A pagar professores -->
      <div class="bg-light-surface dark:bg-dark-surface p-4 rounded-xl border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-center">
        <p class="text-xs font-medium text-light-text/60 dark:text-offwhite/60 mb-1">A pagar profs.</p>
        <p class="text-lg font-bold text-light-text dark:text-offwhite">{{ formatCurrency(aPagarProfs) }}</p>
      </div>

      <!-- Saldo em caixa -->
      <div class="bg-light-surface dark:bg-dark-surface p-4 rounded-xl border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-center relative overflow-hidden">
        <div class="absolute top-0 left-0 w-1 h-full bg-gold"></div>
        <p class="text-xs font-medium text-light-text/60 dark:text-offwhite/60 mb-1 ml-2">Saldo em caixa</p>
        <p class="text-lg font-bold text-light-text dark:text-offwhite ml-2">{{ formatCurrency(saldoCaixa) }}</p>
      </div>

    </div>

    <!-- Gráfico Dinâmico de Entradas x Saídas -->
    <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-6 shadow-sm">
      <h3 class="font-bold text-light-text dark:text-offwhite mb-6">Entradas x Saídas (Últimos 6 meses)</h3>
      <div class="flex items-end justify-between h-48 gap-2">
        <div v-for="month in chartMonthsData" :key="month.label" class="flex flex-col items-center flex-1 gap-2">
          <!-- Saldo acima da barra -->
          <span class="text-[10px] font-bold text-light-text/60 dark:text-offwhite/60">
            {{ formatCurrencyCompact(month.entrada - month.saida) }}
          </span>
          <div class="flex items-end justify-center gap-1 w-full h-32">
            <!-- Barra Verde (Entrada) -->
            <div 
              class="w-1/3 max-w-[20px] bg-green-500 rounded-t-sm transition-all duration-300" 
              :style="{ height: `${Math.max(month.entrada > 0 ? 10 : 2, (month.entrada / maxChartValue) * 100)}%` }"
              :title="`Entrada: ${formatCurrency(month.entrada)}`"
            ></div>
            <!-- Barra Vermelha (Saída) -->
            <div 
              class="w-1/3 max-w-[20px] bg-red-500 rounded-t-sm transition-all duration-300" 
              :style="{ height: `${Math.max(month.saida > 0 ? 10 : 2, (month.saida / maxChartValue) * 100)}%` }"
              :title="`Saída: ${formatCurrency(month.saida)}`"
            ></div>
          </div>
          <span class="text-xs text-light-text/50 dark:text-offwhite/50">{{ month.label }}</span>
        </div>
      </div>
    </div>

    <!-- Listas Inferiores -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- Próximos Vencimentos -->
      <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl shadow-sm flex flex-col">
        <div class="p-4 sm:px-6 border-b border-light-border dark:border-dark-border flex justify-between items-center">
          <h3 class="font-bold text-light-text dark:text-offwhite">Próximos Vencimentos</h3>
          <button class="text-xs font-bold text-primary hover:text-primary-hover">Ver todas</button>
        </div>
        <div class="divide-y divide-light-border/50 dark:divide-dark-border/50 flex-1">
          <div v-for="charge in proximosVencimentos" :key="charge.id" class="p-4 sm:px-6 flex items-center justify-between">
            <div>
              <p class="font-bold text-sm text-light-text dark:text-offwhite">{{ charge.studentName }}</p>
              <p class="text-xs text-light-text/60 dark:text-offwhite/60 mt-0.5">Vence em {{ formatDateBR(charge.dueDate) }}</p>
            </div>
            <p class="font-bold text-sm text-light-text dark:text-offwhite">{{ formatCurrency(charge.amount) }}</p>
          </div>
          <div v-if="proximosVencimentos.length === 0" class="p-8 text-center text-light-text/50 dark:text-offwhite/50 text-sm">
            Nenhum vencimento próximo.
          </div>
        </div>
      </div>

      <!-- Repasses Pendentes -->
      <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl shadow-sm flex flex-col">
        <div class="p-4 sm:px-6 border-b border-light-border dark:border-dark-border flex justify-between items-center">
          <h3 class="font-bold text-light-text dark:text-offwhite">Repasses Pendentes</h3>
          <button class="text-xs font-bold text-primary hover:text-primary-hover">Ver todos</button>
        </div>
        <div class="divide-y divide-light-border/50 dark:divide-dark-border/50 flex-1">
          <div v-for="teacher in repassesPendentes" :key="teacher.id" class="p-4 sm:px-6 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-light-border dark:bg-dark-border flex items-center justify-center font-bold text-xs">
                {{ teacher.name.charAt(0) }}
              </div>
              <p class="font-bold text-sm text-light-text dark:text-offwhite">{{ teacher.name }}</p>
            </div>
            <p class="font-bold text-sm text-light-text dark:text-offwhite">{{ formatCurrency(teacher.totalToReceive) }}</p>
          </div>
          <div v-if="repassesPendentes.length === 0" class="p-8 text-center text-light-text/50 dark:text-offwhite/50 text-sm">
            Nenhum repasse pendente.
          </div>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useFinanceiro } from '../../composables/useFinanceiro'

const { charges, teachers, cashflow, accounts, fetchCharges, fetchTeachers, fetchCashflow, fetchAccounts } = useFinanceiro()

onMounted(async () => {
  await Promise.all([fetchCharges(), fetchTeachers(), fetchCashflow(), fetchAccounts()])
})

// Utilitários de formatação
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const formatCurrencyCompact = (value: number) => {
  const formatter = new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 })
  return 'R$ ' + formatter.format(value)
}

const formatDateBR = (isoStr: string) => {
  if (!isoStr) return '-'
  const [y, m, d] = isoStr.split('-')
  return `${d}/${m}/${y}`
}

// 1. Cálculos dos Cards (Restritos ao mês corrente)
const aReceberMes = computed(() => {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  return charges.value
    .filter(c => {
      if (c.status !== 'pendente') return false
      if (!c.dueDate) return false
      const parts = c.dueDate.split('-')
      if (parts.length >= 2) {
        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        return year === y && month === m
      }
      return false
    })
    .reduce((acc, curr) => acc + curr.amount, 0)
})

const recebidoMes = computed(() => {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  return charges.value
    .filter(c => {
      const isPago = c.status === 'paga' || (c.status as any) === 'pago'
      if (!isPago) return false
      const dateToCheck = c.paidAt || c.dueDate
      if (!dateToCheck) return false
      const rawDate = dateToCheck.split('T')[0]
      const parts = rawDate.split('-')
      if (parts.length >= 2) {
        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        return year === y && month === m
      }
      return false
    })
    .reduce((acc, curr) => acc + curr.amount, 0)
})

const emAtraso = computed(() => {
  return charges.value
    .filter(c => c.status === 'atrasada' || (c.status as any) === 'atrasado')
    .reduce((acc, curr) => acc + curr.amount, 0)
})

const aPagarProfs = computed(() => {
  return teachers.value.reduce((acc, curr) => acc + curr.totalToReceive, 0)
})

const saldoCaixa = computed(() => {
  const initialBalance = accounts.value.reduce((acc, curr) => acc + (curr.saldo_inicial || 0), 0)
  const movimentacoes = cashflow.value.reduce((acc, curr) => {
    return curr.type === 'entrada' ? acc + curr.amount : acc - curr.amount
  }, 0)
  return initialBalance + movimentacoes
})

// 2. Gráfico Dinâmico dos Últimos 6 Meses
const chartMonthsData = computed(() => {
  const months = []
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth()
    const label = monthNames[m]
    
    let entrada = 0
    let saida = 0

    cashflow.value.forEach(item => {
      if (item.date) {
        const itemDate = new Date(item.date)
        if (itemDate.getFullYear() === y && itemDate.getMonth() === m) {
          if (item.type === 'entrada') entrada += item.amount
          else saida += item.amount
        }
      }
    })

    months.push({ label, entrada, saida, year: y, monthIndex: m })
  }

  return months
})

const maxChartValue = computed(() => {
  const values = chartMonthsData.value.flatMap(d => [d.entrada, d.saida])
  const max = Math.max(...values)
  return max > 0 ? max : 1000
})

// 3. Listas Inferiores
const proximosVencimentos = computed(() => {
  return charges.value
    .filter(c => c.status === 'pendente' || c.status === 'atrasada')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5)
})

const repassesPendentes = computed(() => {
  return teachers.value
    .filter(t => t.totalToReceive > 0)
    .sort((a, b) => b.totalToReceive - a.totalToReceive)
    .slice(0, 5)
})
</script>
