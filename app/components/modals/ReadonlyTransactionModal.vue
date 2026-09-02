<template>
  <BaseModal 
    :is-open="isOpen" 
    title="Detalhes do Lançamento" 
    max-width="sm"
    @close="handleClose"
  >
    <div class="flex flex-col gap-4">
      
      <div class="p-4 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg flex flex-col gap-3">
        <div class="flex items-center gap-2 text-sm text-light-text/60 dark:text-offwhite/60">
          <Info class="w-4 h-4 text-primary" />
          Lançamento Automático
        </div>
        
        <p class="text-sm font-medium text-light-text dark:text-offwhite leading-relaxed">
          {{ transaction?.description }}
        </p>

        <div class="flex justify-between items-center mt-2 pt-2 border-t border-light-border dark:border-dark-border">
          <span class="text-sm text-light-text/60 dark:text-offwhite/60">Valor:</span>
          <span 
            class="font-bold text-lg"
            :class="transaction?.type === 'entrada' ? 'text-green-500' : 'text-red-500'"
          >
            {{ transaction?.type === 'entrada' ? '+' : '-' }} {{ formatCurrency(transaction?.amount || 0) }}
          </span>
        </div>
        
        <div class="flex justify-between items-center">
          <span class="text-sm text-light-text/60 dark:text-offwhite/60">Data:</span>
          <span class="text-sm font-medium text-light-text dark:text-offwhite">{{ formatDateBR(transaction?.date || '') }}</span>
        </div>
      </div>

      <p class="text-xs text-light-text/50 dark:text-offwhite/50 text-center">
        Lançamentos automáticos gerados pelo sistema não podem ser editados ou excluídos manualmente no fluxo de caixa. Eles são amarrados à sua origem (Cobrança ou Repasse).
      </p>

      <div class="flex justify-end mt-2">
        <button 
          @click="handleClose"
          class="px-6 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-md transition-colors shadow-sm"
        >
          Entendi
        </button>
      </div>

    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { Info } from '@lucide/vue'
import BaseModal from '../BaseModal.vue'
import type { CashflowTransaction } from '../../composables/useFinanceiro'

const props = defineProps<{
  isOpen: boolean
  transaction: CashflowTransaction | null
}>()

const emit = defineEmits(['close'])

const handleClose = () => {
  emit('close')
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const formatDateBR = (isoStr: string) => {
  if (!isoStr) return ''
  const [y, m, d] = isoStr.split('-')
  return `${d}/${m}/${y}`
}
</script>
