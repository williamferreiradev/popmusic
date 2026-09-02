<template>
  <BaseModal 
    :is-open="isOpen" 
    title="Novo lançamento no caixa" 
    max-width="md"
    @close="handleClose"
  >
    <div class="flex flex-col gap-4">
      
      <!-- Tipo (Entrada/Saída) -->
      <div class="flex gap-4">
        <label 
          class="flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition-colors"
          :class="formData.type === 'entrada' ? 'border-green-500 bg-green-500/10 text-green-600 dark:text-green-500 font-bold' : 'border-light-border dark:border-dark-border text-light-text/70 dark:text-offwhite/70 hover:bg-light-bg dark:hover:bg-dark-bg'"
        >
          <input type="radio" v-model="formData.type" value="entrada" class="hidden">
          <ArrowDownLeft class="w-4 h-4" />
          Entrada
        </label>
        <label 
          class="flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition-colors"
          :class="formData.type === 'saida' ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-500 font-bold' : 'border-light-border dark:border-dark-border text-light-text/70 dark:text-offwhite/70 hover:bg-light-bg dark:hover:bg-dark-bg'"
        >
          <input type="radio" v-model="formData.type" value="saida" class="hidden">
          <ArrowUpRight class="w-4 h-4" />
          Saída
        </label>
      </div>

      <!-- Descrição -->
      <div>
        <label class="text-sm font-medium text-light-text dark:text-offwhite mb-1.5 block">Descrição *</label>
        <BaseInput 
          v-model="formData.description" 
          placeholder="Ex: Pagamento de luz, compra de encordoamento..."
          :class="{'border-red-500': validationErrors.description}"
        />
      </div>

      <!-- Valor e Data -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium text-light-text dark:text-offwhite mb-1.5 block">Valor (R$) *</label>
          <BaseInput 
            v-model="formData.amount" 
            type="number"
            step="0.01"
            placeholder="0.00"
            :class="{'border-red-500': validationErrors.amount}"
          />
        </div>
        <div>
          <label class="text-sm font-medium text-light-text dark:text-offwhite mb-1.5 block">Data *</label>
          <BaseInput 
            v-model="formData.date" 
            type="date"
            :class="{'border-red-500': validationErrors.date}"
          />
        </div>
      </div>

      <!-- Conta e Categoria -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium text-light-text dark:text-offwhite mb-1.5 block">Conta *</label>
          <BaseSelect 
            v-model="formData.account" 
            :options="accountOptions"
            :class="{'border-red-500': validationErrors.account}"
          />
        </div>
        <div>
          <label class="text-sm font-medium text-light-text dark:text-offwhite mb-1.5 block">Categoria</label>
          <BaseSelect 
            v-model="formData.category" 
            :options="categoryOptions"
          />
        </div>
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
          Adicionar lançamento
        </button>
      </div>

    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ArrowDownLeft, ArrowUpRight } from '@lucide/vue'
import BaseModal from '../BaseModal.vue'
import BaseSelect from '../BaseSelect.vue'
import BaseInput from '../BaseInput.vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close', 'confirm'])

const accountOptions = [
  { label: 'Dinheiro', value: 'Dinheiro' },
  { label: 'Nubank', value: 'Nubank' },
  { label: 'Itaú', value: 'Itaú' },
  { label: 'Caixa', value: 'Caixa' },
  { label: 'PagBank', value: 'PagBank' }
]

const categoryOptions = [
  { label: 'Geral', value: 'Geral' },
  { label: 'Despesas fixas', value: 'Despesas fixas' },
  { label: 'Materiais', value: 'Materiais' },
  { label: 'Marketing', value: 'Marketing' }
]

const formData = ref({
  type: 'saida' as 'entrada' | 'saida',
  description: '',
  amount: '',
  date: '',
  account: '',
  category: 'Geral'
})

const validationErrors = ref({
  description: false,
  amount: false,
  date: false,
  account: false
})

const resetForm = () => {
  formData.value = {
    type: 'saida',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    account: '',
    category: 'Geral'
  }
  validationErrors.value = { description: false, amount: false, date: false, account: false }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) resetForm()
})

const handleClose = () => {
  emit('close')
}

const confirm = () => {
  validationErrors.value = {
    description: !formData.value.description,
    amount: !formData.value.amount || Number(formData.value.amount) <= 0,
    date: !formData.value.date,
    account: !formData.value.account
  }

  if (Object.values(validationErrors.value).some(v => v)) return

  emit('confirm', {
    ...formData.value,
    amount: Number(formData.value.amount)
  })
}
</script>
