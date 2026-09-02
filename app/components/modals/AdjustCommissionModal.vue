<template>
  <BaseModal 
    :is-open="isOpen" 
    title="Ajustar Comissão" 
    max-width="sm"
    @close="handleClose"
  >
    <div class="flex flex-col gap-4">
      
      <p class="text-sm text-light-text dark:text-offwhite">
        Ajuste de valor por aula para <strong>{{ item?.name }}</strong>.
      </p>

      <div>
        <label class="text-sm font-medium text-light-text dark:text-offwhite mb-1.5 block">Novo Valor Fixo por Aula (R$)</label>
        <BaseInput 
          v-model="newRate" 
          type="number"
          step="0.01"
          placeholder="0.00"
        />
      </div>

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
          Salvar
        </button>
      </div>

    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '../BaseModal.vue'
import BaseInput from '../BaseInput.vue'

const props = defineProps<{
  isOpen: boolean
  item: any
}>()

const emit = defineEmits(['close', 'confirm'])

const newRate = ref('')

watch(() => props.isOpen, (val) => {
  if (val && props.item) {
    newRate.value = props.item.ratePerClass.toString()
  }
})

const handleClose = () => {
  emit('close')
}

const confirm = () => {
  emit('confirm', Number(newRate.value))
}
</script>
