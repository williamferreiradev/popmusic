<template>
  <BaseModal 
    :is-open="isOpen" 
    title="Destrancar Matrícula" 
    max-width="md"
    @close="$emit('close')"
  >
    <div v-if="student" class="flex flex-col gap-4 p-5">
      <div class="flex items-center gap-4 mb-2">
        <div class="w-12 h-12 rounded-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex items-center justify-center shrink-0">
          <span v-if="!student.avatar" class="font-bold text-light-text dark:text-offwhite">{{ student.initials }}</span>
          <img v-else :src="student.avatar" alt="Avatar" class="w-full h-full object-cover rounded-full" >
        </div>
        <div>
          <h3 class="font-bold text-light-text dark:text-offwhite">{{ student.name }}</h3>
          <p class="text-xs text-light-text/60 dark:text-offwhite/60">Trancado há {{ daysLocked }} dias</p>
        </div>
      </div>

      <div class="bg-light-surface dark:bg-dark-surface p-4 rounded-lg border border-light-border dark:border-dark-border flex flex-col gap-3 text-sm">
        <p class="text-light-text dark:text-offwhite">
          O aluno ficou trancado por <strong>{{ daysLocked }} dias</strong>. A validade do contrato será estendida automaticamente para repor esse período sem aulas.
        </p>
        
        <p class="text-xs text-light-text/60 dark:text-offwhite/60">A turma anterior será retomada se continuar ativa e possuir vaga. O contrato será prorrogado pelo período real do trancamento.</p>
      </div>

      <div class="flex items-center justify-end gap-3 pt-4 border-t border-light-border dark:border-dark-border mt-2">
        <BaseButton variant="outline" @click="$emit('close')">Cancelar</BaseButton>
        <BaseButton variant="primary" @click="handleConfirm">Confirmar Destrancamento</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseModal from '../BaseModal.vue'
import BaseButton from '../BaseButton.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  student: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'confirm'])

const daysLocked = computed(() => {
  const raw=props.student?.raw||props.student
  const start=raw?.data_inicio_trancamento
  return start ? Math.max(0,Math.floor((Date.now()-new Date(`${start}T12:00:00`).getTime())/86400000)) : 0
})

const handleConfirm = () => {
  emit('confirm', { id: props.student?.id })
}
</script>
