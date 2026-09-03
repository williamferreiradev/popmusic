<template>
  <BaseModal 
    :is-open="isOpen" 
    title="Esta chamada já foi registrada" 
    max-width="md"
    @close="handleClose"
  >
    <div class="flex flex-col gap-4">
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
          <AlertTriangle class="w-6 h-6" />
        </div>
        <p class="text-sm text-light-text dark:text-offwhite leading-relaxed">
          A chamada de <span class="font-bold">{{ className }}</span> em <span class="font-bold">{{ date }}</span> já foi feita por <span class="font-bold">{{ registeredBy }}</span> às <span class="font-bold">{{ registeredAt }}</span>. O que você deseja fazer?
        </p>
      </div>

      <!-- Footer / Actions -->
      <div class="flex flex-col sm:flex-row justify-end gap-3 mt-2">
        <button 
          class="px-4 py-2 text-sm font-medium text-light-text/70 dark:text-offwhite/70 hover:bg-light-border/50 dark:hover:bg-dark-border/50 rounded-md transition-colors w-full sm:w-auto"
          @click="handleClose"
        >
          Cancelar
        </button>
        <button 
          class="px-6 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-md transition-colors shadow-sm w-full sm:w-auto"
          @click="confirm"
        >
          Ver e editar chamada
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { AlertTriangle } from '@lucide/vue'
import BaseModal from '../BaseModal.vue'

defineProps<{
  isOpen: boolean
  className: string
  date: string
  registeredBy: string
  registeredAt: string
}>()

const emit = defineEmits(['close', 'confirm'])

const handleClose = () => {
  emit('close')
}

const confirm = () => {
  emit('confirm')
}
</script>
