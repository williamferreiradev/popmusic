<template>
  <BaseModal :is-open="isOpen" :title="classData ? 'Editar turma' : 'Nova turma'" max-width="xl" @close="close">
    <form class="flex flex-col gap-4" @submit.prevent="save">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BaseSelect v-model="form.modalidadeId" label="Modalidade" :options="modalityOptions" placeholder="Selecione" />
        <BaseSelect v-model="form.professorId" label="Professor" :options="teacherOptions" placeholder="Selecione" />
        <BaseSelect v-model="form.salaId" label="Sala" :options="roomOptions" placeholder="Selecione" />
        <BaseSelect v-if="classData" v-model="form.diaSemana" label="Dia da semana" :options="dayOptions" placeholder="Selecione" />

        <fieldset v-else class="sm:col-span-2">
          <legend class="mb-2 text-sm font-semibold text-light-text dark:text-offwhite">Dias da semana</legend>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Selecione um ou mais dias da semana">
            <button
              v-for="day in dayOptions"
              :key="day.value"
              type="button"
              class="flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors"
              :class="isDaySelected(Number(day.value))
                ? 'border-primary bg-primary/15 text-primary dark:text-red-300'
                : 'border-light-border bg-light-bg text-light-text hover:border-primary/60 dark:border-dark-border dark:bg-dark-bg dark:text-offwhite'"
              :aria-pressed="isDaySelected(Number(day.value))"
              @click="toggleDay(Number(day.value))"
            >
              <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded border" :class="isDaySelected(Number(day.value)) ? 'border-primary bg-primary text-white' : 'border-current/40'">
                <span v-if="isDaySelected(Number(day.value))" aria-hidden="true">✓</span>
              </span>
              {{ day.label }}
            </button>
          </div>
          <p class="mt-2 text-xs text-light-text/60 dark:text-offwhite/60">As mesmas configurações serão usadas em todos os dias selecionados.</p>
        </fieldset>

        <BaseInput v-model="form.horarioInicio" label="Horário inicial" type="time" required />
        <BaseInput v-model="form.horarioFim" label="Horário final" type="time" required />
        <BaseInput v-model="form.capacidade" label="Capacidade máxima" type="number" min="1" required />
      </div>
      <div v-if="conflictMessage" class="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{{ conflictMessage }}</div>
      <div v-else-if="capacityMessage" class="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{{ capacityMessage }}</div>
      <div class="flex flex-col-reverse gap-3 border-t border-light-border pt-4 dark:border-dark-border sm:flex-row sm:justify-between">
        <button v-if="classData" type="button" :disabled="saving" class="rounded-md px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-50" @click="deactivate">Desativar turma</button>
        <span v-else />
        <div class="flex justify-end gap-3">
          <BaseButton type="button" variant="outline" @click="close">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :disabled="!isValid || saving"><Loader2 v-if="saving" class="h-4 w-4 animate-spin" /> {{ submitLabel }}</BaseButton>
        </div>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { Loader2 } from '@lucide/vue'
import BaseButton from '../BaseButton.vue'
import BaseInput from '../BaseInput.vue'
import BaseModal from '../BaseModal.vue'
import BaseSelect from '../BaseSelect.vue'

const props = defineProps<{ isOpen: boolean; classData?: any; modalities: any[]; teachers: any[]; rooms: any[]; existingClasses: any[]; saving?: boolean }>()
const emit = defineEmits(['close', 'save', 'deactivate'])
const blankForm = () => ({ modalidadeId: '', professorId: '', salaId: '', diaSemana: '', diasSemana: [] as number[], horarioInicio: '', horarioFim: '', capacidade: '1' })
const form = reactive(blankForm())
const dayOptions = [
  { label: 'Segunda-feira', value: 1 }, { label: 'Terça-feira', value: 2 }, { label: 'Quarta-feira', value: 3 },
  { label: 'Quinta-feira', value: 4 }, { label: 'Sexta-feira', value: 5 }, { label: 'Sábado', value: 6 }, { label: 'Domingo', value: 0 }
]
const modalityOptions = computed(() => props.modalities.map(item => ({ label: item.nome, value: item.id })))
const teacherOptions = computed(() => props.teachers.map(item => ({ label: item.nome, value: item.id })))
const roomOptions = computed(() => props.rooms.map(item => ({ label: item.nome, value: item.id })))

watch(() => [props.isOpen, props.classData], () => {
  const source = props.classData
  Object.assign(form, source ? {
    modalidadeId: source.modalidade_id, professorId: source.professor_id, salaId: source.sala_id,
    diaSemana: String(source.dia_semana), diasSemana: [Number(source.dia_semana)], horarioInicio: source.horario_inicio?.substring(0, 5) || '',
    horarioFim: source.horario_fim?.substring(0, 5) || '', capacidade: String(source.capacidade_maxima || 1)
  } : blankForm())
}, { immediate: true })

const selectedDays = computed(() => props.classData
  ? (form.diaSemana === '' ? [] : [Number(form.diaSemana)])
  : [...new Set(form.diasSemana.map(Number))])
const isDaySelected = (day: number) => form.diasSemana.includes(day)
const toggleDay = (day: number) => {
  const index = form.diasSemana.indexOf(day)
  if (index >= 0) form.diasSemana.splice(index, 1)
  else form.diasSemana.push(day)
}
const conflictMessage = computed(() => {
  if (!selectedDays.value.length || !form.horarioInicio || !form.horarioFim) return ''
  const conflict = props.existingClasses.find(item => item.id !== props.classData?.id && item.ativo &&
    selectedDays.value.includes(Number(item.dia_semana)) && form.horarioInicio < item.horario_fim.substring(0, 5) &&
    form.horarioFim > item.horario_inicio.substring(0, 5) && (item.sala_id === form.salaId || item.professor_id === form.professorId))
  if (!conflict) return ''
  const day = dayOptions.find(item => Number(item.value) === Number(conflict.dia_semana))?.label
  return conflict.sala_id === form.salaId ? `Esta sala já possui outra turma na ${day}, nesse horário.` : `Este professor já possui outra turma na ${day}, nesse horário.`
})
const capacityMessage = computed(() => {
  const room = props.rooms.find(item => item.id === form.salaId)
  if (!room || !form.capacidade) return ''
  return Number(form.capacidade) > Number(room.capacidade_padrao)
    ? `A capacidade máxima desta sala é ${room.capacidade_padrao} aluno(s).`
    : ''
})
const isValid = computed(() => Boolean(form.modalidadeId && form.professorId && form.salaId && selectedDays.value.length &&
  form.horarioInicio && form.horarioFim > form.horarioInicio && Number.isInteger(Number(form.capacidade)) &&
  Number(form.capacidade) > 0 && !conflictMessage.value && !capacityMessage.value))
const submitLabel = computed(() => {
  if (props.classData) return 'Salvar alterações'
  return selectedDays.value.length > 1 ? `Criar ${selectedDays.value.length} turmas` : 'Criar turma'
})
const close = () => !props.saving && emit('close')
const save = () => isValid.value && emit('save', {
  modalidade_id: form.modalidadeId, professor_id: form.professorId, sala_id: form.salaId,
  dia_semana: props.classData ? Number(form.diaSemana) : undefined,
  dias_semana: props.classData ? undefined : selectedDays.value,
  horario_inicio: form.horarioInicio, horario_fim: form.horarioFim,
  capacidade_maxima: Number(form.capacidade), ativo: true
})
const deactivate = () => emit('deactivate', props.classData)
</script>
