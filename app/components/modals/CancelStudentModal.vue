<template>
  <BaseModal :is-open="isOpen" title="Cancelar matrícula" max-width="md" @close="close">
    <form v-if="student" class="flex flex-col gap-4 p-5" @submit.prevent="confirm">
      <div>
        <h3 class="font-bold text-light-text dark:text-offwhite">{{ student.name }}</h3>
        <p class="text-sm text-light-text/60 dark:text-offwhite/60">Esta operação encerra o vínculo, mas preserva todo o histórico.</p>
      </div>
      <div class="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
        <p class="font-semibold">Regra do cancelamento sem fidelidade</p>
        <ul class="mt-2 list-disc space-y-1 pl-5">
          <li>Mensalidades pagas não são devolvidas.</li>
          <li>Cobranças vencidas continuam em aberto.</li>
          <li>Se houve aula no mês, a mensalidade atual continua devida.</li>
          <li>As cobranças futuras elegíveis serão canceladas.</li>
          <li>O contrato, as turmas e o acesso do aluno serão encerrados.</li>
        </ul>
      </div>
      <div>
        <label for="cancel-reason" class="text-sm font-semibold text-light-text dark:text-offwhite">Motivo do cancelamento</label>
        <textarea id="cancel-reason" v-model="reason" rows="3" maxlength="500" required class="mt-1 w-full rounded-lg border border-light-border bg-light-bg p-3 dark:border-dark-border dark:bg-dark-bg" placeholder="Informe o motivo (mínimo de 5 caracteres)" />
        <p v-if="errorMessage" class="mt-2 text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
      </div>
      <div class="flex justify-end gap-3 border-t border-light-border pt-4 dark:border-dark-border">
        <BaseButton type="button" variant="outline" :disabled="isLoading" @click="close">Voltar</BaseButton>
        <BaseButton type="submit" variant="primary" :disabled="isLoading || reason.trim().length < 5">
          {{ isLoading ? 'Cancelando...' : 'Confirmar cancelamento' }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '../BaseModal.vue'
import BaseButton from '../BaseButton.vue'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  student: { type: Object, default: null },
  isLoading: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' }
})
const emit = defineEmits(['close', 'confirm'])
const reason = ref('')

watch(() => props.isOpen, (open) => { if (open) reason.value = '' })
const close = () => { if (!props.isLoading) emit('close') }
const confirm = () => {
  const value = reason.value.trim()
  if (value.length >= 5) emit('confirm', { id: props.student.id, reason: value })
}
</script>
