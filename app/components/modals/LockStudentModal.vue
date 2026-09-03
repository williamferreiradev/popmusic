<template>
  <BaseModal 
    :is-open="isOpen" 
    title="Trancar Matrícula" 
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
          <p class="text-xs text-light-text/60 dark:text-offwhite/60">Contrato ativo até 15/03/2027</p>
        </div>
      </div>

      <div class="bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 p-4 rounded-lg text-sm flex flex-col gap-2">
        <p><strong>Atenção:</strong> Ao trancar a matrícula:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Nenhuma cobrança nova será gerada nos próximos meses.</li>
          <li>A mensalidade do mês atual <strong>já gerada</strong> permanece pendente para pagamento.</li>
          <li>O aluno não contará como "Risco de Evasão".</li>
          <li>A vaga na turma atual será liberada.</li>
        </ul>
      </div>
      <div><label class="text-sm font-semibold">Motivo do trancamento</label><textarea v-model="reason" rows="3" class="mt-1 w-full rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg p-3" placeholder="Informe o motivo (obrigatório)"/></div>

      <div class="flex items-center justify-end gap-3 pt-4 border-t border-light-border dark:border-dark-border mt-2">
        <BaseButton variant="outline" @click="$emit('close')">Cancelar</BaseButton>
        <BaseButton variant="primary" :disabled="reason.trim().length < 5" @click="$emit('confirm', { id: student.id, reason: reason.trim() })">Confirmar Trancamento</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from '../BaseModal.vue'
import BaseButton from '../BaseButton.vue'
import { ref, watch } from 'vue'
const reason = ref('')

defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  student: {
    type: Object,
    default: null
  }
})

defineEmits(['close', 'confirm'])
watch(reason, value => { if (value.length > 500) reason.value = value.slice(0,500) })
</script>
