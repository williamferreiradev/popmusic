<template>
  <BaseModal :is-open="isOpen" title="Estornar pagamento" max-width="md" @close="emit('close')">
    <div class="flex flex-col gap-4">
      <p class="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-light-text dark:text-offwhite">
        Será registrada uma saída de <strong>{{ formattedAmount }}</strong> no caixa. O recibo original e o histórico do pagamento serão preservados para auditoria.
      </p>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-light-text dark:text-offwhite">Conta da devolução *</label>
          <BaseSelect v-model="form.account" :options="accountOptions" />
          <p v-if="errors.account" class="mt-1 text-xs text-red-500">Selecione uma conta financeira.</p>
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-light-text dark:text-offwhite">Data do estorno *</label>
          <BaseInput v-model="form.refundedAt" type="date" :max="today" />
          <p v-if="errors.refundedAt" class="mt-1 text-xs text-red-500">Informe uma data válida, não futura.</p>
        </div>
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-light-text dark:text-offwhite">Motivo do estorno *</label>
        <textarea
          v-model="form.reason"
          rows="3"
          maxlength="500"
          placeholder="Ex.: pagamento lançado por engano"
          class="w-full resize-none rounded-md border border-light-border bg-light-surface px-3 py-2 text-light-text outline-none focus:border-gold focus:ring-1 focus:ring-gold dark:border-dark-border dark:bg-dark-surface dark:text-offwhite"
        />
        <p v-if="errors.reason" class="mt-1 text-xs text-red-500">Informe um motivo com pelo menos 5 caracteres.</p>
      </div>

      <div class="mt-2 flex justify-end gap-3">
        <button class="rounded-md px-4 py-2 text-sm font-medium text-light-text/70 hover:bg-light-border/50 dark:text-offwhite/70 dark:hover:bg-dark-border/50" @click="emit('close')">Voltar</button>
        <button class="rounded-md bg-red-600 px-6 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-700" @click="confirm">Confirmar estorno</button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import BaseModal from '../BaseModal.vue'
import BaseSelect from '../BaseSelect.vue'
import BaseInput from '../BaseInput.vue'
import type { Charge } from '../../composables/useFinanceiro'

const props = defineProps<{
  isOpen: boolean
  charge: Charge | null
  accounts: Array<{ id: string, nome: string }>
}>()
const emit = defineEmits(['close', 'confirm'])
const today = new Date().toISOString().split('T')[0]
const accountOptions = computed(() => props.accounts.map(account => ({ label: account.nome, value: account.id })))
const formattedAmount = computed(() => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(props.charge?.amount || 0))
const form = reactive({ account: '', refundedAt: today, reason: '' })
const errors = reactive({ account: false, refundedAt: false, reason: false })

watch(() => props.isOpen, open => {
  if (!open) return
  form.account = accountOptions.value[0]?.value || ''
  form.refundedAt = today
  form.reason = ''
  errors.account = errors.refundedAt = errors.reason = false
})

const confirm = () => {
  errors.account = !form.account
  errors.refundedAt = !form.refundedAt || form.refundedAt > today
  errors.reason = form.reason.trim().length < 5
  if (errors.account || errors.refundedAt || errors.reason) return
  emit('confirm', { account: form.account, refundedAt: form.refundedAt, reason: form.reason.trim() })
}
</script>
