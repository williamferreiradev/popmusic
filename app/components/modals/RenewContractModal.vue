<template>
  <BaseModal 
    :is-open="isOpen" 
    title="Renovar contrato" 
    max-width="md"
    @close="$emit('close')"
  >
    <div v-if="contract" class="flex flex-col gap-4">
      
      <div class="bg-light-bg/50 dark:bg-dark-bg/50 p-3 rounded-lg border border-light-border dark:border-dark-border mb-2">
        <p class="font-bold text-light-text dark:text-offwhite text-sm">{{ contract.studentName }}</p>
        <p class="text-xs text-light-text/60 dark:text-offwhite/60">
          Contrato atual {{ isAlreadyExpired ? 'venceu' : 'vence' }} em {{ formatExpiryDate(contract.validityEnd || contract.acceptedAt!) }}
        </p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium text-light-text dark:text-offwhite mb-1.5 block">Novo valor da mensalidade (R$)</label>
          <BaseInput 
            v-model="newAmount" 
            type="number"
            step="0.01"
          />
        </div>
        <div>
          <label class="text-sm font-medium text-light-text dark:text-offwhite mb-1.5 block">Novo dia de vencimento</label>
          <BaseInput 
            v-model="newDay" 
            type="number"
            min="1"
            max="28"
          />
        </div>
      </div>

      <div class="bg-amber-500/10 border-l-4 border-amber-500 p-3 rounded mt-2">
        <p class="text-sm text-light-text/80 dark:text-offwhite/80 leading-relaxed">
          Um novo contrato será gerado com os dados atuais do aluno e enviado para novo aceite eletrônico. O histórico do contrato anterior será mantido.
        </p>
      </div>
      
      <div class="flex justify-end gap-3 mt-4">
        <button 
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-light-text/70 dark:text-offwhite/70 hover:bg-light-border/50 dark:hover:bg-dark-border/50 rounded-md transition-colors"
        >
          Cancelar
        </button>
        <button 
          @click="confirm"
          class="px-6 py-2 bg-gold hover:bg-yellow-400 text-black text-sm font-bold rounded-md transition-colors shadow-sm"
        >
          Gerar e enviar novo contrato
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '../BaseModal.vue'
import BaseInput from '../BaseInput.vue'
import type { Contract } from '../../composables/useContratos'

const props = defineProps<{
  isOpen: boolean
  contract: Contract | null
}>()

const emit = defineEmits(['close', 'confirm'])

const newAmount = ref('')
const newDay = ref('')

const isAlreadyExpired = computed(() => {
  if (!props.contract) return false
  const expDate = expiryDate(props.contract.validityEnd || props.contract.acceptedAt)
  return new Date() > expDate
})

const expiryDate = (value?: string | null) => {
  const d = new Date(value || Date.now())
  if (!props.contract?.validityEnd) d.setFullYear(d.getFullYear() + 1)
  return d
}
const formatExpiryDate = (value: string) => {
  return expiryDate(value).toLocaleDateString('pt-BR')
}

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.contract) {
    newAmount.value = String(props.contract.valor)
    newDay.value = String(props.contract.diaVencimento)
  }
})

const confirm = () => {
  if (props.contract) {
    const amount = Number(newAmount.value)
    const day = Number(newDay.value)
    if (!Number.isFinite(amount) || amount <= 0) return alert('Informe um valor de mensalidade maior que zero.')
    if (!Number.isInteger(day) || day < 1 || day > 28) return alert('Informe um dia de vencimento entre 1 e 28.')
    emit('confirm', {
      id: props.contract.id,
      amount,
      day
    })
  }
}
</script>
