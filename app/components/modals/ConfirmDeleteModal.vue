<template>
  <BaseModal 
    :is-open="isOpen" 
    :title="title" 
    max-width="sm"
    @close="$emit('close')"
  >
    <div class="flex flex-col items-center text-center gap-4 py-4">
      <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-[#ff8a8a] flex items-center justify-center">
        <AlertTriangle class="w-6 h-6" />
      </div>
      
      <p class="text-light-text dark:text-offwhite/90">
        {{ message }}
      </p>
      
      <p v-if="warningText" class="text-xs text-light-text/60 dark:text-offwhite/50 bg-light-bg dark:bg-dark-bg p-3 rounded-md w-full border border-light-border dark:border-dark-border">
        <strong>Atenção:</strong> {{ warningText }}
      </p>
    </div>

    <template #footer>
      <button 
        @click="$emit('close')"
        class="px-4 py-2 rounded-md font-medium text-light-text dark:text-offwhite hover:bg-light-border dark:hover:bg-dark-border transition-colors border border-transparent"
        :disabled="isLoading"
      >
        Cancelar
      </button>
      <button 
        @click="$emit('confirm')"
        class="px-4 py-2 rounded-md font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-[#7A1F1F] dark:hover:bg-[#902626] transition-colors flex items-center gap-2 shadow-sm"
        :disabled="isLoading"
      >
        <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
        {{ confirmText }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { AlertTriangle, Loader2 } from '@lucide/vue'
import BaseModal from '../BaseModal.vue'

defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: 'Confirmar exclusão'
  },
  message: {
    type: String,
    required: true
  },
  warningText: {
    type: String,
    default: 'Esta ação não poderá ser desfeita.'
  },
  confirmText: {
    type: String,
    default: 'Sim, excluir'
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close', 'confirm'])
</script>
