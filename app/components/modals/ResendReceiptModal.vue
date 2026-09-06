<template>
  <BaseModal 
    :is-open="isOpen" 
    title="Reenviar recibo" 
    max-width="sm"
    @close="handleClose"
  >
    <div class="flex flex-col gap-4">
      
      <p class="text-sm text-light-text dark:text-offwhite leading-relaxed">
        Reenviar por e-mail o recibo de <span class="font-bold">{{ receipt?.studentName }}</span>
        (R$ {{ receipt?.amount?.toFixed(2).replace('.', ',') }}, pago em {{ formatDateBR(receipt?.paidAt || '') }}).
      </p>

      <!-- Botões de envio -->
      <div class="mt-2">
        <button 
          :disabled="sending"
          class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary-hover font-bold rounded-lg border border-primary/20 transition-colors disabled:opacity-50" @click="confirm"
        >
          {{ sending ? 'Enviando...' : 'Reenviar por e-mail' }}
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
  sending?: boolean
}>()

const emit = defineEmits(['close', 'confirm'])

const handleClose = () => {
  if (!props.sending) emit('close')
}

const confirm = () => {
  if (!props.sending) emit('confirm')
}

const formatDateBR = (isoStr: string) => {
  if (!isoStr) return ''
  const [y, m, d] = isoStr.split('-')
  return `${d}/${m}/${y}`
}
</script>
