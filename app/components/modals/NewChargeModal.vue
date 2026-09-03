<template>
  <BaseModal 
    :is-open="isOpen" 
    title="Nova cobrança avulsa" 
    max-width="md"
    @close="handleClose"
  >
    <div class="flex flex-col gap-4">
      
      <!-- Aluno -->
      <div>
        <label class="text-sm font-medium text-light-text dark:text-offwhite mb-1.5 block">Aluno *</label>
        <BaseSelect 
          v-model="formData.studentName" 
          :options="studentOptions"
          :class="{'border-red-500': validationErrors.studentName}"
        />
      </div>

      <!-- Descrição -->
      <div>
        <label class="text-sm font-medium text-light-text dark:text-offwhite mb-1.5 block">Descrição *</label>
        <BaseInput 
          v-model="formData.description" 
          placeholder="Ex: 2ª via de carnê, aula extra..."
          :class="{'border-red-500': validationErrors.description}"
        />
      </div>

      <!-- Valor & Vencimento -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium text-light-text dark:text-offwhite mb-1.5 block">Valor (R$) *</label>
          <BaseInput 
            v-model="formData.amount" 
            type="number"
            step="0.01"
            placeholder="0,00"
            :class="{'border-red-500': validationErrors.amount}"
          />
        </div>
        <div>
          <label class="text-sm font-medium text-light-text dark:text-offwhite mb-1.5 block">Vencimento *</label>
          <BaseInput 
            v-model="formData.dueDate" 
            type="date"
            :class="{'border-red-500': validationErrors.dueDate}"
          />
        </div>
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
          class="px-6 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-md transition-colors shadow-sm"
          @click="confirm"
        >
          Criar cobrança
        </button>
      </div>

    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '../BaseModal.vue'
import BaseSelect from '../BaseSelect.vue'
import BaseInput from '../BaseInput.vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close', 'confirm'])

// Mock students
const studentOptions = [
  { label: 'Ana Carolina Silva', value: 'Ana Carolina Silva' },
  { label: 'Carlos Eduardo', value: 'Carlos Eduardo' },
  { label: 'Fabrício Brito', value: 'Fabrício Brito' },
  { label: 'Izabel Godoi', value: 'Izabel Godoi' },
  { label: 'Marcos Vinícius', value: 'Marcos Vinícius' },
  { label: 'Raquel Gomes', value: 'Raquel Gomes' }
]

const formData = ref({
  studentName: '',
  description: '',
  amount: '',
  dueDate: ''
})

const validationErrors = ref({
  studentName: false,
  description: false,
  amount: false,
  dueDate: false
})

const resetForm = () => {
  formData.value = {
    studentName: '',
    description: '',
    amount: '',
    dueDate: ''
  }
  validationErrors.value = { studentName: false, description: false, amount: false, dueDate: false }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) resetForm()
})

const handleClose = () => {
  emit('close')
}

const confirm = () => {
  validationErrors.value = {
    studentName: !formData.value.studentName,
    description: !formData.value.description,
    amount: !formData.value.amount || Number(formData.value.amount) <= 0,
    dueDate: !formData.value.dueDate
  }

  if (Object.values(validationErrors.value).some(v => v)) return

  emit('confirm', {
    ...formData.value,
    amount: Number(formData.value.amount)
  })
}
</script>
