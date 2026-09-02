<template>
  <BaseModal 
    :is-open="isOpen" 
    title="Reenviar recibo" 
    max-width="sm"
    @close="handleClose"
  >
    <div class="flex flex-col gap-4">
      
      <p class="text-sm text-light-text dark:text-offwhite leading-relaxed">
        Enviar o recibo de <span class="font-bold">{{ receipt?.studentName }}</span> 
        (R$ {{ receipt?.amount?.toFixed(2).replace('.', ',') }}, pago em {{ formatDateBR(receipt?.paidAt || '') }}) por:
      </p>

      <!-- Botões de envio -->
      <div class="grid grid-cols-2 gap-3 mt-2">
        <button 
          @click="confirm('whatsapp')"
          class="flex items-center justify-center gap-2 px-4 py-3 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-500 font-bold rounded-lg border border-green-500/20 transition-colors"
        >
          WhatsApp
        </button>
        <button 
          @click="confirm('email')"
          class="flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary-hover font-bold rounded-lg border border-primary/20 transition-colors"
        >
          E-mail
        </button>
      </div>

    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from '../BaseModal.vue'
import type { Receipt } from '../../composables/useFinanceiro'

const props = defineProps<{
  isOpen: boolean
  receipt: Receipt | null
}>()

const emit = defineEmits(['close', 'confirm'])

const handleClose = () => {
  emit('close')
}

const confirm = (method: 'whatsapp' | 'email') => {
  emit('confirm', method)
}

const formatDateBR = (isoStr: string) => {
  if (!isoStr) return ''
  const [y, m, d] = isoStr.split('-')
  return `${d}/${m}/${y}`
}
</script>
