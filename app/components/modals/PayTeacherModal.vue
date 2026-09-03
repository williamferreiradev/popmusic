<template>
  <BaseModal 
    :is-open="isOpen" 
    title="Registrar pagamento ao professor" 
    max-width="md"
    @close="handleClose"
  >
    <div class="flex flex-col gap-4">
      
      <p class="text-sm font-medium text-light-text/80 dark:text-offwhite/80 bg-light-bg dark:bg-dark-bg p-3 rounded-md border border-light-border dark:border-dark-border">
        Repasse para <span class="font-bold">{{ teacher?.name }}</span> no valor de <span class="text-primary font-bold">R$ {{ teacher?.totalToReceive?.toFixed(2).replace('.', ',') }}</span>.
      </p>

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

      <!-- Conta de Saída -->
      <div>
        <label class="text-sm font-medium text-light-text dark:text-offwhite mb-1.5 block">De qual conta o dinheiro saiu? *</label>
        <BaseSelect 
          v-model="formData.account" 
          :options="accountOptions"
          :class="{'border-red-500': validationErrors.account}"
        />
        <p class="text-xs text-light-text/60 dark:text-offwhite/60 mt-1">Essa saída será registrada automaticamente no fluxo de caixa.</p>
      </div>

      <!-- Footer / Actions -->
      <div class="flex justify-end gap-3 mt-4">
        <button 
          @click="handleClose"
          class="px-4 py-2 text-sm font-medium text-light-text/70 dark:text-offwhite/70 hover:bg-light-border/50 dark:hover:bg-dark-border/50 rounded-md transition-colors"
        >
          Cancelar
        </button>
        <button 
          @click="confirm"
          class="px-6 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-md transition-colors shadow-sm"
        >
          Confirmar repasse
        </button>
      </div>

    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseModal from '../BaseModal.vue'
import BaseSelect from '../BaseSelect.vue'
import BaseInput from '../BaseInput.vue'
import type { Teacher } from '../../composables/useFinanceiro'

const props = defineProps<{
  isOpen: boolean
  teacher: Teacher | null
  accounts: Array<{ id: string, nome: string }>
}>()

const emit = defineEmits(['close', 'confirm'])

const paymentOptions = [
  { label: 'Dinheiro', value: 'Dinheiro' },
  { label: 'Pix manual', value: 'Pix' },
  { label: 'Transferência', value: 'Transferência' }
]

const accountOptions = computed(() => props.accounts.map(account => ({ label: account.nome, value: account.id })))

const formData = ref({
  paymentMethod: '',
  paidAt: '',
  account: ''
})

const validationErrors = ref({
  paymentMethod: false,
  paidAt: false,
  account: false
})

const resetForm = () => {
  formData.value = {
    paymentMethod: '',
    paidAt: new Date().toISOString().slice(0, 10),
    account: accountOptions.value[0]?.value || ''
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
    ...formData.value,
    paymentMethod: paymentOptions.find(p => p.value === formData.value.paymentMethod)?.label || formData.value.paymentMethod
  })
}
</script>
