<template>
  <span 
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
    :class="variantClasses"
  >
    <slot></slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'neutral',
    validator: (value: string) => ['success', 'danger', 'warning', 'info', 'neutral'].includes(value)
  }
})

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'success': // Ativo
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50'
    case 'danger': // Inadimplente
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-[#7A1F1F]/20 dark:text-[#ff8a8a] dark:border-[#7A1F1F]/50'
    case 'warning': // Pendente
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-gold-soft dark:text-gold dark:border-gold/30'
    case 'info': // Trancado
      return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/50'
    case 'neutral': // Cancelado
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-dark-surface dark:text-offwhite/70 dark:border-dark-border'
  }
})
</script>
