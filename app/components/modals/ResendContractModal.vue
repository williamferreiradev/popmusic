<template>
  <BaseModal 
    :is-open="isOpen" 
    title="Reenviar link de assinatura" 
    max-width="sm"
    @close="$emit('close')"
  >
    <div v-if="contractData" class="flex flex-col gap-4">
      <p class="text-sm text-light-text/70 dark:text-offwhite/70 leading-relaxed">
        Um novo link será enviado para <strong class="text-light-text dark:text-offwhite">{{ contractData.studentName }}</strong> via WhatsApp, válido por 7 dias.
      </p>
      
      <div class="flex justify-end gap-3 mt-2">
        <button 
          class="px-4 py-2 text-sm font-medium text-light-text/70 dark:text-offwhite/70 hover:bg-light-border/50 dark:hover:bg-dark-border/50 rounded-md transition-colors"
          @click="$emit('close')"
        >
          Cancelar
        </button>
        <button 
          class="px-6 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-md transition-colors shadow-sm"
          @click="confirm"
        >
          Reenviar
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseModal from '../BaseModal.vue'
import { useContratos } from '../../composables/useContratos'

const props = defineProps<{
  isOpen: boolean
  contractId: string | null
}>()

const emit = defineEmits(['close', 'confirm'])

const { contractsList } = useContratos()

const contractData = computed(() => {
  return contractsList.value.find(c => c.id === props.contractId)
})

const confirm = () => {
  if (props.contractId) {
    emit('confirm', props.contractId)
  }
}
</script>
