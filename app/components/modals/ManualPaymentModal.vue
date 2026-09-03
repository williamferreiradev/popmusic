<template>
  <BaseModal 
    :is-open="isOpen" 
    title="Registrar pagamento manual" 
    max-width="md"
    @close="handleClose"
  >
    <div class="flex flex-col gap-4">
      
      <!-- Subtítulo -->
      <p class="text-sm font-medium text-light-text/80 dark:text-offwhite/80 bg-light-bg dark:bg-dark-bg p-3 rounded-md border border-light-border dark:border-dark-border">
        Cobrança: <span class="font-bold">{{ charge?.description }}</span> — {{ charge?.studentName }} — <span class="text-green-500 font-bold">R$ {{ charge?.amount?.toFixed(2).replace('.', ',') }}</span>
      </p>

      <!-- Forma de pagamento e Data -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium text-light-text dark:text-offwhite mb-1.5 block">Forma de pag. *</label>
          <BaseSelect 
            v-model="formData.paymentMethod" 
            :options="paymentOptions"
            :class="{'border-red-500': validationErrors.paymentMethod}"
          />
        </div>
        <div>
          <label class="text-sm font-medium text-light-text dark:text-offwhite mb-1.5 block">Data do pag. *</label>
          <BaseInput 
            v-model="formData.paidAt" 
            type="date"
            :class="{'border-red-500': validationErrors.paidAt}"
          />
        </div>
      </div>

      <!-- Conta de destino (Apenas se não for dinheiro) -->
      <div>
        <label class="text-sm font-medium text-light-text dark:text-offwhite mb-1.5 block">Em qual conta o dinheiro caiu? *</label>
        <BaseSelect 
          v-model="formData.account" 
          :options="accountOptions"
          :class="{'border-red-500': validationErrors.account}"
        />
      </div>

      <!-- Observação -->
      <div>
        <label class="text-sm font-medium text-light-text dark:text-offwhite mb-1.5 block">Observação (opcional)</label>
        <BaseInput 
          v-model="formData.observation" 
          placeholder="Ex: Pagou em 2 cartões..."
        />
      </div>

      <!-- Footer / Actions -->
      <div class="flex justify-end gap-3 mt-4">
        <button 
          class="px-4 py-2 text-sm font-medium text-light-text/70 dark:text-offwhite/70 hover:bg-light-border/50 dark:hover:bg-dark-border/50 rounded-md transition-colors"
          @click="handleClose"
        >
          Cancelar
        </button>
        <button 
          class="px-6 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-md transition-colors shadow-sm"
          @click="confirm"
        >
          Confirmar pagamento
        </button>
      </div>

    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '../BaseModal.vue'
import BaseSelect from '../BaseSelect.vue'
import BaseInput from '../BaseInput.vue'
import type { Charge } from '../../composables/useFinanceiro'

const props = defineProps<{
  isOpen: boolean
  charge: Charge | null
  accounts?: Array<{ id: string, nome: string }>
}>()

const emit = defineEmits(['close', 'confirm'])

const paymentOptions = [
  { label: 'Pix', value: 'pix' },
  { label: 'Dinheiro', value: 'dinheiro' },
  { label: 'Cartão de Crédito/Débito', value: 'cartao' },
  { label: 'Transferência Bancária', value: 'transferencia' },
  { label: 'Boleto', value: 'boleto' }
]

const accountOptions = computed(() => {
  if (props.accounts && props.accounts.length > 0) {
    return props.accounts.map(a => ({ label: a.nome, value: a.id }))
  }
  return []
})

const formData = ref({
  paymentMethod: '',
  paidAt: '',
  account: '',
  observation: ''
})

const validationErrors = ref({
  paymentMethod: false,
  paidAt: false,
  account: false
})

const resetForm = () => {
  formData.value = {
    paymentMethod: 'pix',
    paidAt: new Date().toISOString().slice(0, 10),
    account: accountOptions.value[0]?.value || '',
    observation: ''
  }
  validationErrors.value = { paymentMethod: false, paidAt: false, account: false }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) resetForm()
})

const handleClose = () => {
  emit('close')
}

const confirm = () => {
  validationErrors.value = {
    paymentMethod: !formData.value.paymentMethod,
    paidAt: !formData.value.paidAt,
    account: !formData.value.account
  }

  if (Object.values(validationErrors.value).some(v => v)) return

  emit('confirm', {
    paymentMethod: formData.value.paymentMethod,
    paidAt: formData.value.paidAt,
    account: formData.value.account,
    observation: formData.value.observation
  })
}
</script>
