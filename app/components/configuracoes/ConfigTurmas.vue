<template>
  <div class="w-full flex flex-col gap-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-light-text dark:text-offwhite">Turmas</h1>
        <p class="text-sm text-light-text/70 dark:text-offwhite/70">Configure modalidade, professor, sala e horário das aulas.</p>
      </div>
      <BaseButton variant="primary" class="flex items-center gap-2" @click="openForm()"><Plus class="w-4 h-4" /> Nova turma</BaseButton>
    </div>

    <div v-if="feedback" class="rounded-lg border px-4 py-3 text-sm" :class="feedback.type === 'success' ? 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300' : 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300'" role="status">{{ feedback.message }}</div>

    <div class="overflow-x-auto rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface shadow-sm">
      <table class="w-full min-w-[850px] text-left text-sm text-light-text dark:text-offwhite">
        <thead class="bg-light-bg/50 dark:bg-dark-bg/50 border-b border-light-border dark:border-dark-border text-light-text/70 dark:text-offwhite/70">
          <tr><th class="p-4">Modalidade</th><th class="p-4">Professor</th><th class="p-4">Sala</th><th class="p-4">Dia e horário</th><th class="p-4 text-center">Alunos</th><th class="p-4 text-center">Status</th><th class="p-4 text-right">Ações</th></tr>
        </thead>
        <tbody>
          <tr v-if="pending"><td colspan="7" class="p-12 text-center opacity-60">Carregando turmas...</td></tr>
          <tr v-else-if="loadError"><td colspan="7" class="p-12 text-center text-red-600 dark:text-red-400">Não foi possível carregar as turmas.</td></tr>
          <tr v-else-if="!turmas?.length"><td colspan="7" class="p-12 text-center opacity-60">Nenhuma turma cadastrada.</td></tr>
          <template v-else>
          <tr v-for="turma in turmas || []" :key="turma.id" class="border-b border-light-border dark:border-dark-border last:border-0">
            <td class="p-4 font-semibold">{{ turma.modalidades?.nome || '-' }}</td>
            <td class="p-4">{{ turma.professores?.nome || '-' }}</td>
            <td class="p-4">{{ turma.salas?.nome || '-' }}</td>
            <td class="p-4">{{ dayName(turma.dia_semana) }}, {{ shortTime(turma.horario_inicio) }}–{{ shortTime(turma.horario_fim) }}</td>
            <td class="p-4 text-center">{{ activeStudents(turma) }}/{{ turma.capacidade_maxima }}</td>
            <td class="p-4 text-center"><BaseBadge :variant="turma.ativo ? 'success' : 'neutral'">{{ turma.ativo ? 'Ativa' : 'Inativa' }}</BaseBadge></td>
            <td class="p-4"><div class="flex justify-end gap-2"><button class="p-2 hover:text-blue-500" title="Editar turma" @click="openForm(turma)"><Pencil class="w-4 h-4" /></button><button class="p-2 text-red-600 hover:text-red-500" title="Excluir turma" @click="openDelete(turma)"><Trash2 class="w-4 h-4" /></button></div></td>
          </tr>
          </template>
        </tbody>
      </table>
    </div>

    <ClassFormModal :is-open="formOpen" :class-data="editingClass" :modalities="catalogs?.modalities || []" :teachers="catalogs?.teachers || []" :rooms="catalogs?.rooms || []" :existing-classes="turmas || []" :saving="saving" @close="closeForm" @save="saveClass" @deactivate="deactivateClass" />
    <ConfirmDeleteModal :is-open="deleteOpen" title="Excluir turma" :message="`Excluir a turma de ${classToDelete?.modalidades?.nome || 'aula'}?`" warning-text="A exclusão é definitiva e só será permitida se a turma nunca teve alunos, chamadas, presenças ou repasses." confirm-text="Excluir turma" :is-loading="deleting" @close="deleteOpen = false" @confirm="deleteClass" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Pencil, Plus, Trash2 } from '@lucide/vue'
import BaseBadge from '../BaseBadge.vue'
import BaseButton from '../BaseButton.vue'
import ClassFormModal from '../modals/ClassFormModal.vue'
import ConfirmDeleteModal from '../modals/ConfirmDeleteModal.vue'

const supabase = useSupabaseClient()
const route = useRoute()
const formOpen = ref(false)
const deleteOpen = ref(false)
const saving = ref(false)
const deleting = ref(false)
const editingClass = ref<any>(null)
const classToDelete = ref<any>(null)
const feedback = ref<{ type: 'success' | 'error'; message: string } | null>(null)

const { data: catalogs, error: catalogsError } = await useAsyncData('turmas_catalogos', async () => {
  const [modalities, teachers, rooms] = await Promise.all([
    supabase.from('modalidades').select('id, nome').eq('ativo', true).order('nome'),
    supabase.from('professores').select('id, nome').eq('ativo', true).order('nome'),
    supabase.from('salas').select('id, nome, capacidade_padrao').eq('ativo', true).order('nome')
  ])
  if (modalities.error) throw modalities.error
  if (teachers.error) throw teachers.error
  if (rooms.error) throw rooms.error
  return { modalities: modalities.data || [], teachers: teachers.data || [], rooms: rooms.data || [] }
})

const { data: turmas, pending, error: turmasError, refresh } = await useAsyncData('turmas_lista_gestao', async () => {
  const { data, error } = await supabase.from('turmas').select(`id, modalidade_id, professor_id, sala_id, dia_semana, horario_inicio, horario_fim, capacidade_maxima, ativo, modalidades(nome), professores(nome), salas(nome), matriculas_turma(data_fim)`).order('dia_semana').order('horario_inicio')
  if (error) throw error
  return data || []
})
const loadError = computed(() => Boolean(catalogsError.value || turmasError.value))
const dayName = (day: number) => ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][day] || '-'
const shortTime = (time: string) => time?.substring(0, 5) || '-'
const activeStudents = (turma: any) => (turma.matriculas_turma || []).filter((item: any) => !item.data_fim).length
const openForm = (turma?: any) => { editingClass.value = turma || null; feedback.value = null; formOpen.value = true }
const closeForm = (force = false) => { if (force || !saving.value) { formOpen.value = false; editingClass.value = null } }

const saveClass = async (payload: any) => {
  saving.value = true; feedback.value = null
  try {
    const wasEditing = Boolean(editingClass.value)
    const request = wasEditing
      ? (supabase as any).rpc('salvar_turma', { p_id: editingClass.value.id, p_modalidade_id: payload.modalidade_id, p_professor_id: payload.professor_id, p_sala_id: payload.sala_id, p_dia_semana: payload.dia_semana, p_horario_inicio: payload.horario_inicio, p_horario_fim: payload.horario_fim, p_capacidade_maxima: payload.capacidade_maxima })
      : (supabase as any).rpc('salvar_turmas_em_lote', { p_modalidade_id: payload.modalidade_id, p_professor_id: payload.professor_id, p_sala_id: payload.sala_id, p_dias_semana: payload.dias_semana, p_horario_inicio: payload.horario_inicio, p_horario_fim: payload.horario_fim, p_capacidade_maxima: payload.capacidade_maxima })
    const { data, error } = await request
    if (error) throw error
    const total = payload.dias_semana?.length || 1
    if (!wasEditing && (!Array.isArray(data) || data.length !== total)) throw new Error(`O banco confirmou apenas ${Array.isArray(data) ? data.length : 0} de ${total} turmas. Nenhuma confirmação parcial será exibida.`)
    await refresh(); closeForm(true); feedback.value = { type: 'success', message: wasEditing ? 'Turma atualizada com sucesso.' : `${data.length} ${data.length === 1 ? 'turma criada' : 'turmas criadas'} com sucesso.` }
  } catch (error: any) { feedback.value = { type: 'error', message: `Não foi possível salvar a turma. ${error.message || 'Tente novamente.'}` } }
  finally { saving.value = false }
}
const deactivateClass = async (turma: any) => {
  if (!turma?.id) return
  saving.value = true; feedback.value = null
  try { const { error } = await (supabase as any).rpc('inativar_turma', { p_turma_id: turma.id }); if (error) throw error; await refresh(); closeForm(true); feedback.value = { type: 'success', message: 'Turma desativada com sucesso.' } }
  catch (error: any) { feedback.value = { type: 'error', message: `Não foi possível desativar. ${error.message || 'Tente novamente.'}` } }
  finally { saving.value = false }
}
const openDelete = (turma: any) => { classToDelete.value = turma; feedback.value = null; deleteOpen.value = true }
const deleteClass = async () => {
  if (!classToDelete.value?.id || deleting.value) return
  deleting.value = true
  try { const { error } = await (supabase as any).rpc('excluir_turma_definitivamente', { p_turma_id: classToDelete.value.id }); if (error) throw error; deleteOpen.value = false; classToDelete.value = null; await refresh(); feedback.value = { type: 'success', message: 'Turma excluída com sucesso.' } }
  catch (error: any) { feedback.value = { type: 'error', message: `Não foi possível excluir. ${error.message || 'Tente novamente.'}` } }
  finally { deleting.value = false }
}

onMounted(() => {
  const requestedId = String(route.query.editar || '')
  const requestedClass = (turmas.value || []).find((turma: any) => turma.id === requestedId)
  if (requestedClass) openForm(requestedClass)
})
</script>
