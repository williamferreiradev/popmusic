<template>
  <BaseModal 
    :is-open="isOpen" 
    title="Cancelar cobrança" 
    max-width="md"
    @close="handleClose"
  >
    <div class="flex flex-col gap-4">
      
      <p class="text-sm text-light-text dark:text-offwhite leading-relaxed">
        Tem certeza que deseja cancelar a cobrança de <span class="font-bold">{{ charge?.studentName }}</span> no valor de <span class="font-bold text-red-500">R$ {{ charge?.amount?.toFixed(2).replace('.', ',') }}</span>? 
        Essa ação não pode ser desfeita.
      </p>

      <!-- Motivo do Cancelamento -->
      <div>
        <label class="text-sm font-medium text-light-text dark:text-offwhite mb-1.5 block">Motivo do cancelamento *</label>
        <BaseSelect 
          v-model="cancelReason" 
          :options="reasonOptions"
          :class="{'border-red-500': validationError}"
        />
        <p v-if="validationError" class="text-xs text-red-500 mt-1">Por favor, informe o motivo do cancelamento para auditoria.</p>
      </div>

      <!-- Footer / Actions -->
      <div class="flex justify-end gap-3 mt-4">
        <button 
          class="px-4 py-2 text-sm font-medium text-light-text/70 dark:text-offwhite/70 hover:bg-light-border/50 dark:hover:bg-dark-border/50 rounded-md transition-colors"
          @click="handleClose"
        >
          Voltar
        </button>
        <button 
          class="px-6 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-md transition-colors shadow-sm"
          @click="confirm"
        >
          Confirmar cancelamento
        </button>
      </div>

    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '../BaseModal.vue'
import BaseSelect from '../BaseSelect.vue'
import type { Charge } from '../../composables/useFinanceiro'

const props = defineProps<{
  isOpen: boolean
  charge: Charge | null
}>()

const emit = defineEmits(['close', 'confirm'])

const reasonOptions = [
  { label: 'Erro de lançamento', value: 'erro' },
  { label: 'Aluno cancelou matrícula', value: 'cancelou' },
  { label: 'Cortesia/desconto', value: 'cortesia' },
  { label: 'Outro', value: 'outro' }
]

const cancelReason = ref('')
const validationError = ref(false)

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    cancelReason.value = ''
    validationError.value = false
  }
})

const handleClose = () => {
  emit('close')
}

const confirm = () => {
  if (!cancelReason.value) {
    validationError.value = true
    return
  }

  emit('confirm', {
    reason: reasonOptions.find(r => r.value === cancelReason.value)?.label || cancelReason.value
  })
}
</script>
