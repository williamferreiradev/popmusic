<template>
  <BaseModal :is-open="isOpen" :title="classData ? 'Editar turma' : 'Nova turma'" max-width="xl" @close="close">
    <form class="flex flex-col gap-4" @submit.prevent="save">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseSelect v-model="form.modalidadeId" label="Modalidade" :options="modalityOptions" placeholder="Selecione" />
        <BaseSelect v-model="form.professorId" label="Professor" :options="teacherOptions" placeholder="Selecione" />
        <BaseSelect v-model="form.salaId" label="Sala" :options="roomOptions" placeholder="Selecione" />
        <BaseSelect v-model="form.diaSemana" label="Dia da semana" :options="dayOptions" placeholder="Selecione" />
        <BaseInput v-model="form.horarioInicio" label="Horário inicial" type="time" required />
        <BaseInput v-model="form.horarioFim" label="Horário final" type="time" required />
        <BaseInput v-model="form.capacidade" label="Capacidade máxima" type="number" min="1" required />
      </div>
      <div v-if="conflictMessage" class="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{{ conflictMessage }}</div>
      <div class="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-4 border-t border-light-border dark:border-dark-border">
        <button v-if="classData" type="button" :disabled="saving" class="px-4 py-2 rounded-md text-sm font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-50" @click="deactivate">Desativar turma</button>
        <span v-else/>
        <div class="flex justify-end gap-3">
          <BaseButton type="button" variant="outline" @click="close">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :disabled="!isValid || saving"><Loader2 v-if="saving" class="w-4 h-4 animate-spin" /> Salvar turma</BaseButton>
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
const blankForm = () => ({ modalidadeId: '', professorId: '', salaId: '', diaSemana: '', horarioInicio: '', horarioFim: '', capacidade: '1' })
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
    diaSemana: String(source.dia_semana), horarioInicio: source.horario_inicio?.substring(0, 5) || '',
    horarioFim: source.horario_fim?.substring(0, 5) || '', capacidade: String(source.capacidade_maxima || 1)
  } : blankForm())
}, { immediate: true })

const conflictMessage = computed(() => {
  if (form.diaSemana === '' || !form.horarioInicio || !form.horarioFim) return ''
  const conflict = props.existingClasses.find(item => item.id !== props.classData?.id && item.ativo &&
    Number(item.dia_semana) === Number(form.diaSemana) && form.horarioInicio < item.horario_fim.substring(0, 5) &&
    form.horarioFim > item.horario_inicio.substring(0, 5) && (item.sala_id === form.salaId || item.professor_id === form.professorId))
  if (!conflict) return ''
  return conflict.sala_id === form.salaId ? 'Esta sala já possui outra turma nesse horário.' : 'Este professor já possui outra turma nesse horário.'
})
const isValid = computed(() => Boolean(form.modalidadeId && form.professorId && form.salaId && form.diaSemana !== '' &&
  form.horarioInicio && form.horarioFim > form.horarioInicio && Number(form.capacidade) > 0 && !conflictMessage.value))
const close = () => !props.saving && emit('close')
const save = () => isValid.value && emit('save', { modalidade_id: form.modalidadeId, professor_id: form.professorId, sala_id: form.salaId,
  dia_semana: Number(form.diaSemana), horario_inicio: form.horarioInicio, horario_fim: form.horarioFim, capacidade_maxima: Number(form.capacidade), ativo: true })
const deactivate = () => emit('deactivate', props.classData)
</script>
