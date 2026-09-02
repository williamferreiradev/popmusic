<template>
  <BaseModal 
    :is-open="isOpen" 
    title="Registrar falta justificada" 
    max-width="md"
    @close="handleClose"
  >
    <div v-if="student" class="flex flex-col gap-5">
      <div class="mb-2">
        <p class="text-sm font-medium text-light-text/70 dark:text-offwhite/70">Aluno: <span class="text-light-text dark:text-offwhite font-bold">{{ student.name }}</span></p>
      </div>

      <!-- Motivo -->
      <div>
        <label class="text-sm font-medium text-light-text dark:text-offwhite mb-1.5 block">Motivo</label>
        <BaseSelect 
          v-model="reason" 
          :options="[
            { label: 'Atestado médico', value: 'atestado' },
            { label: 'Falta do professor', value: 'falta_professor' },
            { label: 'Outro', value: 'outro' }
          ]"
        />
      </div>

      <!-- Observação -->
      <div>
        <label class="text-sm font-medium text-light-text dark:text-offwhite mb-1.5 block">Observação <span class="text-xs text-light-text/50">(opcional)</span></label>
        <BaseInput 
          v-model="observation" 
          type="text"
          placeholder="Detalhe o motivo, se necessário."
        />
      </div>

      <!-- Agendar Reposição -->
      <div v-if="allowReplacement" class="mt-2 border border-light-border dark:border-dark-border rounded-lg p-4 bg-light-surface/50 dark:bg-dark-surface/50">
        <label class="flex items-center gap-3 cursor-pointer">
          <input 
            type="checkbox" 
            v-model="scheduleReplacement"
            class="w-4 h-4 rounded border-light-border dark:border-dark-border text-primary focus:ring-primary dark:focus:ring-primary bg-light-bg dark:bg-dark-bg"
          >
          <span class="text-sm font-bold text-light-text dark:text-offwhite">Agendar reposição agora</span>
        </label>

        <!-- Expansão da Reposição -->
        <div v-if="scheduleReplacement" class="mt-4 flex flex-col gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1">
              <label class="text-xs font-medium text-light-text/80 dark:text-offwhite/80 mb-1.5 block">Nova data</label>
              <BaseInput 
                v-model="replacementDate" 
                type="date"
                :class="{'border-red-500': isHoliday}"
              />
              <p v-if="isHoliday" class="text-xs text-red-500 mt-1">Não é possível agendar reposição em feriado.</p>
            </div>
            <div class="w-full sm:w-1/3">
              <label class="text-xs font-medium text-light-text/80 dark:text-offwhite/80 mb-1.5 block">Novo horário</label>
              <BaseInput 
                v-model="replacementTime" 
                type="time"
              />
            </div>
          </div>
          
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1">
              <label class="text-xs font-medium text-light-text/80 dark:text-offwhite/80 mb-1.5 block">Professor</label>
              <BaseSelect 
                v-model="replacementTeacher" 
                :options="teacherOptions"
              />
            </div>
            <div class="flex-1">
              <label class="text-xs font-medium text-light-text/80 dark:text-offwhite/80 mb-1.5 block">Sala</label>
              <BaseSelect 
                v-model="replacementRoom" 
                :options="roomOptions"
              />
            </div>
          </div>
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
          class="px-6 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-md transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!isValid"
        >
          Confirmar falta justificada
        </button>
      </div>

    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '../BaseModal.vue'
import BaseSelect from '../BaseSelect.vue'
import BaseInput from '../BaseInput.vue'

const props = defineProps<{
  isOpen: boolean
  student: any | null
  allowReplacement?: boolean
}>()

const allowReplacement = computed(() => props.allowReplacement !== false)

const emit = defineEmits(['close', 'confirm'])

const reason = ref('')
const observation = ref('')
const scheduleReplacement = ref(false)

const replacementDate = ref('')
const replacementTime = ref('14:00')
const replacementTeacher = ref('joao')
const replacementRoom = ref('sala_1')

const teacherOptions = [
  { label: 'João Gabriel', value: 'joao' },
  { label: 'Marcos Vinícius', value: 'marcos' },
  { label: 'Fabrício Brito', value: 'fabricio' }
]

const roomOptions = [
  { label: 'Sala 1 - Cordas', value: 'sala_1' },
  { label: 'Sala 2 - Teclado', value: 'sala_2' },
  { label: 'Sala 3 - Bateria', value: 'sala_3' }
]

// Mock de Feriado (para teste, qualquer dia 25 de dezembro será bloqueado)
const isHoliday = computed(() => {
  if (!replacementDate.value) return false
  return replacementDate.value.endsWith('-12-25')
})

const isValid = computed(() => {
  if (!reason.value) return false
  if (scheduleReplacement.value) {
    if (!replacementDate.value || !replacementTime.value) return false
    if (isHoliday.value) return false // Bloqueia feriado
  }
  return true
})

// Reseta os campos ao abrir
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    reason.value = ''
    observation.value = ''
    scheduleReplacement.value = false
    replacementDate.value = ''
    replacementTime.value = '14:00'
  }
})

const handleClose = () => {
  emit('close')
}

const confirm = () => {
  if (!isValid.value) return
  emit('confirm', {
    reason: reason.value,
    observation: observation.value,
    scheduleReplacement: scheduleReplacement.value,
    replacement: scheduleReplacement.value ? {
      date: replacementDate.value,
      time: replacementTime.value,
      teacher: replacementTeacher.value,
      room: replacementRoom.value
    } : null
  })
}
</script>
