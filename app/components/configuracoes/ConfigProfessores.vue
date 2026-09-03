<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-light-text dark:text-offwhite">Professores</h1>
        <p class="text-sm text-light-text/60 dark:text-offwhite/60">
          Cadastre professores, modalidades e o valor de repasse por aluno.
        </p>
      </div>
      <BaseButton variant="primary" class="flex items-center gap-2" @click="openModal()">
        <Plus class="w-4 h-4" /> Novo professor
      </BaseButton>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-4">
        <p class="text-xs text-light-text/60 dark:text-offwhite/60">Professores ativos</p>
        <p class="text-2xl font-bold mt-1">{{ activeCount }}</p>
      </div>
      <div class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-4">
        <p class="text-xs text-light-text/60 dark:text-offwhite/60">Modalidades cobertas</p>
        <p class="text-2xl font-bold mt-1">{{ coveredModalities }}</p>
      </div>
      <div class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-4">
        <p class="text-xs text-light-text/60 dark:text-offwhite/60">Turmas vinculadas</p>
        <p class="text-2xl font-bold mt-1">{{ totalClasses }}</p>
      </div>
    </div>

    <div class="overflow-x-auto rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface shadow-sm">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-light-border/30 dark:bg-dark-border/30 border-b border-light-border dark:border-dark-border text-sm text-light-text/70 dark:text-offwhite/70">
            <th class="py-3 px-4">Professor</th>
            <th class="py-3 px-4">Contato</th>
            <th class="py-3 px-4">Modalidades</th>
            <th class="py-3 px-4">Repasse padrão</th>
            <th class="py-3 px-4 text-center">Turmas</th>
            <th class="py-3 px-4 text-center">Status</th>
            <th class="py-3 px-4 text-center">Ações</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          <tr v-if="pending">
            <td colspan="7" class="py-10 text-center"><Loader2 class="w-6 h-6 animate-spin text-primary inline" /></td>
          </tr>
          <tr v-else-if="!teachers?.length">
            <td colspan="7" class="py-10 text-center text-light-text/50 dark:text-offwhite/50">Nenhum professor cadastrado.</td>
          </tr>
          <tr v-for="teacher in teachers" v-else :key="teacher.id" class="border-b border-light-border dark:border-dark-border last:border-0">
            <td class="py-3 px-4">
              <p class="font-semibold">{{ teacher.name }}</p>
              <p class="text-xs text-light-text/50 dark:text-offwhite/50">{{ teacher.cpf || 'CPF não informado' }}</p>
            </td>
            <td class="py-3 px-4">
              <p>{{ teacher.phone || '—' }}</p>
              <p class="text-xs text-light-text/50 dark:text-offwhite/50">{{ teacher.email || '—' }}</p>
            </td>
            <td class="py-3 px-4">
              <div class="flex flex-wrap gap-1.5">
                <BaseBadge v-for="modality in teacher.modalities" :key="modality.id" variant="neutral">{{ modality.name }}</BaseBadge>
                <span v-if="!teacher.modalities.length" class="text-light-text/40 dark:text-offwhite/40">Nenhuma</span>
              </div>
            </td>
            <td class="py-3 px-4 font-medium">{{ formatCommission(teacher) }}</td>
            <td class="py-3 px-4 text-center">{{ teacher.classCount }}</td>
            <td class="py-3 px-4 text-center"><BaseBadge :variant="teacher.active ? 'success' : 'neutral'">{{ teacher.active ? 'Ativo' : 'Inativo' }}</BaseBadge></td>
            <td class="py-3 px-4 text-center">
              <div class="flex items-center justify-center gap-2">
                <button
                  v-if="!teacher.userId"
                  :disabled="isInvitingId === teacher.id || !teacher.email || !teacher.active"
                  class="p-1.5 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                  :title="teacher.email ? 'Enviar convite de acesso' : 'Informe o e-mail para convidar'"
                  @click="inviteTeacher(teacher)"
                >
                  <Loader2 v-if="isInvitingId === teacher.id" class="w-4 h-4 animate-spin" />
                  <MailPlus v-else class="w-4 h-4" />
                </button>
                <button v-else :disabled="isInvitingId === teacher.id || !teacher.active" class="text-[10px] font-bold text-green-600 dark:text-green-400 hover:underline disabled:opacity-40" title="Reenviar acesso/recuperação" @click="resendTeacherAccess(teacher)">REENVIAR ACESSO</button>
                <button class="p-1.5 hover:text-primary" title="Editar" @click="openModal(teacher)"><Pencil class="w-4 h-4" /></button>
                <button class="p-1.5" :class="teacher.active ? 'hover:text-red-500' : 'hover:text-green-500'" :title="teacher.active ? 'Desativar' : 'Ativar'" @click="toggleActive(teacher)">
                  <UserX v-if="teacher.active" class="w-4 h-4" />
                  <UserCheck v-else class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <BaseModal :is-open="isModalOpen" :title="isEditing ? 'Editar professor' : 'Novo professor'" max-width="xl" @close="closeModal">
      <form class="p-5 flex flex-col gap-4" @submit.prevent="save">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BaseInput v-model="form.name" label="Nome completo" placeholder="Ex: João da Silva" required />
          <BaseInput v-model="form.cpf" label="CPF" placeholder="000.000.000-00" mask="cpf" required />
          <BaseInput v-model="form.phone" label="Telefone / WhatsApp" placeholder="(61) 99999-9999" mask="phone" required />
          <BaseInput v-model="form.email" label="E-mail" type="email" placeholder="professor@email.com" required />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BaseSelect v-model="form.commissionType" label="Forma de repasse" :options="commissionOptions" />
          <BaseInput
            v-model="form.commissionValue"
            :label="form.commissionType === 'percentual' ? 'Percentual por aluno (%)' : 'Valor por aluno (R$)'"
            type="number"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-light-text dark:text-offwhite">Modalidades que o professor ensina</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border border-light-border dark:border-dark-border p-3 max-h-52 overflow-y-auto">
            <label v-for="modality in modalities" :key="modality.id" class="flex items-center gap-3 p-2 rounded-md hover:bg-light-bg dark:hover:bg-dark-bg cursor-pointer text-light-text dark:text-offwhite">
              <input v-model="form.modalityIds" type="checkbox" :value="modality.id" class="w-4 h-4 accent-primary shrink-0" >
              <span class="text-sm font-medium">{{ modality.name }}</span>
            </label>
            <p v-if="!modalities.length" class="text-sm text-light-text/50 dark:text-offwhite/50">Cadastre uma modalidade primeiro.</p>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-light-border dark:border-dark-border">
          <BaseButton variant="outline" type="button" @click="closeModal">Cancelar</BaseButton>
          <BaseButton variant="primary" type="submit" :disabled="!isValid || isSaving" class="flex items-center gap-2">
            <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" /> Salvar professor
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Loader2, MailPlus, Pencil, Plus, UserCheck, UserX } from '@lucide/vue'
import BaseBadge from '../BaseBadge.vue'
import BaseButton from '../BaseButton.vue'
import BaseInput from '../BaseInput.vue'
import BaseModal from '../BaseModal.vue'
import BaseSelect from '../BaseSelect.vue'

type CommissionType = 'percentual' | 'valor_fixo'
type TeacherView = {
  id: string
  name: string
  cpf: string | null
  phone: string | null
  email: string | null
  userId: string | null
  active: boolean
  commissionType: CommissionType
  commissionValue: number
  modalities: { id: string; name: string }[]
  classCount: number
}

const supabase = useSupabaseClient()
const isModalOpen = ref(false)
const isEditing = ref(false)
const isSaving = ref(false)
const isInvitingId = ref<string | null>(null)
const emptyForm = () => ({ id: '', name: '', cpf: '', phone: '', email: '', commissionType: 'valor_fixo' as CommissionType, commissionValue: '', modalityIds: [] as string[] })
const form = ref(emptyForm())

const commissionOptions = [
  { label: 'Valor fixo por aluno', value: 'valor_fixo' },
  { label: 'Percentual da mensalidade', value: 'percentual' }
]

const { data: pageData, pending, refresh } = await useAsyncData('gestao_professores', async () => {
  const [{ data: teacherRows, error: teacherError }, { data: modalityRows, error: modalityError }] = await Promise.all([
    supabase.from('professores').select('*, professor_modalidades(modalidade_id, modalidades(id, nome)), turmas(id, ativo)').order('nome'),
    supabase.from('modalidades').select('id, nome').eq('ativo', true).order('nome')
  ])
  if (teacherError) throw teacherError
  if (modalityError) throw modalityError
  const teachers: TeacherView[] = (teacherRows || []).map((teacher: any) => ({
    id: teacher.id,
    name: teacher.nome,
    cpf: teacher.cpf,
    phone: teacher.telefone,
    email: teacher.email,
    userId: teacher.usuario_id,
    active: teacher.ativo,
    commissionType: teacher.comissao_padrao_tipo,
    commissionValue: Number(teacher.comissao_padrao_valor || 0),
    modalities: (teacher.professor_modalidades || []).map((item: any) => item.modalidades).filter(Boolean),
    classCount: teacher.turmas?.filter((turma: any) => turma.ativo).length || 0
  }))
  return { teachers, modalities: (modalityRows || []).map((item: any) => ({ id: item.id, name: item.nome })) }
})

const teachers = computed(() => pageData.value?.teachers || [])
const modalities = computed(() => pageData.value?.modalities || [])
const activeCount = computed(() => teachers.value.filter(item => item.active).length)
const coveredModalities = computed(() => new Set(teachers.value.flatMap(item => item.modalities.map(modality => modality.id))).size)
const totalClasses = computed(() => teachers.value.reduce((total, item) => total + item.classCount, 0))
const isValid = computed(() => form.value.name.trim().length > 2
  && form.value.cpf.replace(/\D/g, '').length === 11
  && form.value.phone.replace(/\D/g, '').length >= 10
  && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email.trim())
  && Number(form.value.commissionValue) >= 0
  && (form.value.commissionType !== 'percentual' || Number(form.value.commissionValue) <= 100)
  && form.value.modalityIds.length > 0)

const formatCommission = (teacher: TeacherView) => teacher.commissionType === 'percentual'
  ? `${teacher.commissionValue.toFixed(2).replace('.', ',')}% por aluno`
  : `${teacher.commissionValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por aluno`

const openModal = (teacher?: TeacherView) => {
  isEditing.value = Boolean(teacher)
  form.value = teacher ? {
    id: teacher.id,
    name: teacher.name,
    cpf: teacher.cpf || '',
    phone: teacher.phone || '',
    email: teacher.email || '',
    commissionType: teacher.commissionType,
    commissionValue: teacher.commissionValue.toString(),
    modalityIds: teacher.modalities.map(item => item.id)
  } : emptyForm()
  isModalOpen.value = true
}

const closeModal = () => {
  if (isSaving.value) return
  isModalOpen.value = false
  form.value = emptyForm()
}

const save = async () => {
  if (!isValid.value || isSaving.value) return
  isSaving.value = true
  try {
    const { error } = await (supabase as any).rpc('salvar_professor', {
      p_id: isEditing.value ? form.value.id : null, p_nome: form.value.name,
      p_cpf: form.value.cpf, p_telefone: form.value.phone, p_email: form.value.email,
      p_comissao_tipo: form.value.commissionType, p_comissao_valor: Number(form.value.commissionValue),
      p_modalidade_ids: form.value.modalityIds
    })
    if (error) throw error

    await refresh()
    closeModal()
  } catch (error: any) {
    console.error('Erro ao salvar professor:', error)
    alert(`Não foi possível salvar o professor. ${error.message || 'Tente novamente.'}`)
  } finally {
    isSaving.value = false
  }
}

const toggleActive = async (teacher: TeacherView) => {
  const action = teacher.active ? 'desativar' : 'ativar'
  if (!confirm(`Deseja ${action} ${teacher.name}?`)) return
  const { error } = await (supabase as any).rpc('alterar_status_professor', { p_professor_id: teacher.id, p_ativo: !teacher.active })
  if (error) {
    alert(`Não foi possível ${action} o professor. ${error.message}`)
    return
  }
  await refresh()
}

const inviteTeacher = async (teacher: TeacherView) => {
  if (!teacher.email || teacher.userId || isInvitingId.value) return
  if (!confirm(`Enviar convite de acesso para ${teacher.email}?`)) return

  isInvitingId.value = teacher.id
  try {
    await $fetch('/api/admin/invite-user', {
      method: 'POST',
      body: {
        nome: teacher.name,
        email: teacher.email,
        papel: 'professor',
        professorId: teacher.id
      }
    })
    await refresh()
    alert(`Convite enviado para ${teacher.email}.`)
  } catch (error: any) {
    console.error('Erro ao convidar professor:', error)
    alert(`Não foi possível enviar o convite. ${error.message || 'Tente novamente.'}`)
  } finally {
    isInvitingId.value = null
  }
}

const resendTeacherAccess = async (teacher: TeacherView) => {
  if (!teacher.email || !teacher.userId || isInvitingId.value) return
  if (!confirm(`Reenviar o acesso para ${teacher.email}?`)) return
  isInvitingId.value = teacher.id
  try {
    await $fetch('/api/admin/resend-access', { method: 'POST', body: {
      userId: teacher.userId, professorId: teacher.id
    } })
    alert(`Link de acesso enviado para ${teacher.email}.`)
  } catch (error: any) {
    alert(`Não foi possível reenviar o acesso. ${error.message || 'Tente novamente.'}`)
  } finally { isInvitingId.value = null }
}
</script>
