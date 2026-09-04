<template>
  <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg flex flex-col shadow-sm transition-colors duration-300">
    <div class="overflow-x-auto min-h-[300px] pb-16">
      <table class="w-full text-left text-sm text-light-text dark:text-offwhite">
        <thead class="bg-light-bg/50 dark:bg-dark-bg/50 border-b border-light-border dark:border-dark-border text-light-text/70 dark:text-offwhite/70">
          <tr>
            <th class="px-5 py-3 font-medium">Nome do Aluno</th>
            <th class="px-5 py-3 font-medium">Turma Principal</th>
            <th class="px-5 py-3 font-medium">Telefone</th>
            <th class="px-5 py-3 font-medium">Status</th>
            <th class="px-5 py-3 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody v-if="!pending && students.length > 0">
          <tr
            v-for="aluno in students"
            :key="aluno.id"
            class="border-b border-light-border dark:border-dark-border last:border-0 hover:bg-light-bg/40 dark:hover:bg-dark-bg/40 transition-colors group"
          >
            <td class="px-5 py-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-light-border dark:bg-dark-border flex items-center justify-center overflow-hidden shrink-0">
                  <span v-if="!aluno.avatar" class="text-xs font-bold">{{ aluno.initials }}</span>
                  <img v-else :src="aluno.avatar" alt="Avatar" class="w-full h-full object-cover" >
                </div>
                <div>
                  <div class="font-medium">{{ aluno.name }}</div>
                  <div class="text-xs text-light-text/50 dark:text-offwhite/50">{{ aluno.email }}</div>
                </div>
              </div>
            </td>
            <td class="px-5 py-4">{{ aluno.mainClass }}</td>
            <td class="px-5 py-4">{{ aluno.phone }}</td>
            <td class="px-5 py-4">
              <BaseBadge :variant="aluno.statusVariant">
                {{ aluno.statusLabel }}
              </BaseBadge>
            </td>
            <td class="px-5 py-4 text-right relative">
              <button
                class="p-2 rounded-md text-light-text/50 dark:text-offwhite/50 hover:bg-light-bg dark:hover:bg-dark-bg hover:text-light-text dark:hover:text-offwhite transition-colors focus:outline-none focus:ring-2 focus:ring-gold"
                :class="openMenuId === aluno.id ? 'bg-light-bg dark:bg-dark-bg text-light-text dark:text-offwhite' : ''"
                @click.stop="toggleMenu(aluno.id)"
              >
                <MoreHorizontal class="w-4 h-4" />
              </button>

              <!-- Dropdown Menu -->
              <div
                v-if="openMenuId === aluno.id"
                class="absolute right-5 top-full mt-1 w-44 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-2xl overflow-hidden z-50 py-1.5 ring-1 ring-black/10"
                @click.stop
              >
                <button class="w-full text-left px-4 py-2.5 text-sm hover:bg-light-bg dark:hover:bg-dark-bg text-light-text dark:text-offwhite transition-colors flex items-center gap-2.5 font-medium" @click="openProfile(aluno)">
                  <Eye class="w-4 h-4 text-primary" /> Ver Perfil
                </button>
                <button class="w-full text-left px-4 py-2.5 text-sm hover:bg-light-bg dark:hover:bg-dark-bg text-light-text dark:text-offwhite transition-colors flex items-center gap-2.5 font-medium" @click="openContract(aluno)">
                  <FileText class="w-4 h-4 text-gold" /> Ver Contrato
                </button>
                <button class="w-full text-left px-4 py-2.5 text-sm hover:bg-light-bg dark:hover:bg-dark-bg text-light-text dark:text-offwhite transition-colors flex items-center gap-2.5 font-medium" @click="openEdit(aluno)">
                  <Edit2 class="w-4 h-4 text-blue-500" /> Editar
                </button>
                <button class="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-[#ff8a8a] transition-colors flex items-center gap-2.5 font-medium" @click="openDelete(aluno)">
                  <Trash2 class="w-4 h-4" /> Cancelar matrícula
                </button>
              </div>
            </td>
          </tr>
        </tbody>
        <!-- Empty State -->
        <tbody v-else-if="!pending && (!props.students || props.students.length === 0)">
          <tr>
            <td colspan="5" class="px-5 py-12 text-center text-light-text/50 dark:text-offwhite/50">
              Nenhum aluno encontrado.
            </td>
          </tr>
        </tbody>
        <!-- Loading State -->
        <tbody v-else>
          <tr>
            <td colspan="5" class="px-5 py-12 text-center">
              <div class="flex justify-center items-center">
                <div class="animate-spin w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full"/>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Footer com Paginação Simples -->
    <div class="p-4 border-t border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-light-text/70 dark:text-offwhite/70 rounded-b-lg">
      <span>Mostrando {{ totalCount ? (currentPage - 1) * itemsPerPage + 1 : 0 }} a {{ Math.min((currentPage - 1) * itemsPerPage + students.length, totalCount) }} de {{ totalCount }} alunos</span>
      <div class="flex gap-2">
        <button
          :disabled="currentPage === 1"
          class="px-4 py-1.5 rounded-md border border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          @click="prevPage"
        >
          Anterior
        </button>
        <button
          :disabled="currentPage === totalPages"
          class="px-4 py-1.5 rounded-md border border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          @click="nextPage"
        >
          Próximo
        </button>
      </div>
    </div>

    <!-- Modal de Perfil do Aluno -->
    <StudentProfileModal
      :is-open="isProfileModalOpen"
      :student="selectedStudent"
      @close="isProfileModalOpen = false"
      @edit="handleProfileEdit"
      @lock="openLockModal"
      @unlock="openUnlockModal"
    />

    <!-- Modal de Edição -->
    <StudentEditModal
      :is-open="isEditModalOpen"
      :student="selectedStudent"
      @close="isEditModalOpen = false"
      @saved="handleStudentUpdated"
    />

    <!-- Modal de Confirmação de Exclusão -->
    <CancelStudentModal
      :is-open="isDeleteModalOpen"
      :student="selectedStudent"
      :is-loading="isCancelling"
      :error-message="cancelError"
      @close="closeCancelModal"
      @confirm="handleStudentDeleted"
    />

    <!-- Modais de Trancamento -->
    <LockStudentModal
      :is-open="isLockModalOpen"
      :student="selectedStudent"
      @close="isLockModalOpen = false"
      @confirm="handleStudentLocked"
    />

    <!-- Modal de Contrato Oficial do Aluno -->
    <PreviewContractModal
      :is-open="isContractModalOpen"
      :custom-data="selectedContractData"
      :signed-info="selectedSignedInfo"
      @close="isContractModalOpen = false; selectedStudentForContract = null; selectedSignedInfo = null"
    />

    <UnlockStudentModal
      :is-open="isUnlockModalOpen"
      :student="selectedStudent"
      @close="isUnlockModalOpen = false"
      @confirm="handleStudentUnlocked"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { MoreHorizontal, Eye, Edit2, Trash2, FileText } from '@lucide/vue'
import BaseBadge from '../BaseBadge.vue'
import StudentProfileModal from '../modals/StudentProfileModal.vue'
import StudentEditModal from '../modals/StudentEditModal.vue'
import CancelStudentModal from '../modals/CancelStudentModal.vue'
import LockStudentModal from '../modals/LockStudentModal.vue'
import UnlockStudentModal from '../modals/UnlockStudentModal.vue'
import PreviewContractModal from '../modals/PreviewContractModal.vue'
import { buildPopMusicContractData } from '~/utils/contractFormatter'
import type { PopMusicContractData, SignedContractInfo } from '../contratos/PopMusicContractDocument.vue'

const supabase = useSupabaseClient()

const props = defineProps({
  students: {
    type: Array as () => any[],
    required: true
  },
  pending: {
    type: Boolean,
    default: false
  },
  currentPage: {
    type: Number,
    default: 1
  },
  itemsPerPage: {
    type: Number,
    default: 8
  },
  totalCount: {
    type: Number,
    default: 0
  }
})

// Controle do Menu de Ações e Perfil
const openMenuId = ref<string | null>(null)
const isProfileModalOpen = ref(false)
const isEditModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const isCancelling = ref(false)
const cancelError = ref('')
const isLockModalOpen = ref(false)
const isUnlockModalOpen = ref(false)
const isContractModalOpen = ref(false)
const selectedStudent = ref<any>(null)
const selectedStudentForContract = ref<any>(null)
const selectedSignedInfo = ref<SignedContractInfo | null>(null)
const selectedContract = ref<any>(null)

const selectedContractData = computed<PopMusicContractData>(() => {
  const raw = selectedStudentForContract.value?.raw || selectedStudentForContract.value
  if (!raw) return {}

  const turmasList: any[] = []
  if (raw.matriculas_turma && Array.isArray(raw.matriculas_turma)) {
    raw.matriculas_turma.forEach((m: any) => {
      if (m.turmas) turmasList.push(m.turmas)
    })
  }

  return buildPopMusicContractData(raw, selectedContract.value || {}, turmasList)
})

const openContract = async (aluno: any) => {
  selectedStudentForContract.value = aluno
  selectedSignedInfo.value = null
  selectedContract.value = null
  isContractModalOpen.value = true
  closeMenu()

  const raw = aluno?.raw || aluno
  const alunoId = raw?.id
  if (alunoId) {
    try {
      const { data: contract } = await supabase
        .from('contratos')
        .select('*')
        .eq('aluno_id', alunoId)
        .order('criado_em', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (contract) {
        selectedContract.value = contract
        const photo = contract.foto_assinatura_url || raw.foto_url || aluno.avatar
        const isSigned = contract.status === 'aceito' || !!contract.data_aceite || !!contract.foto_assinatura_url

        if (isSigned || photo) {
          selectedSignedInfo.value = {
            signerName: raw.responsavel_nome || raw.nome || aluno.name,
            signerCpf: raw.responsavel_cpf || raw.cpf || '',
            acceptedAt: contract.data_aceite
              ? new Date(contract.data_aceite).toLocaleString('pt-BR')
              : new Date(contract.criado_em || Date.now()).toLocaleString('pt-BR'),
            token: contract.token || contract.aceite_hash || 'AUTH-DIGITAL',
            ip: typeof contract.aceite_ip === 'string' ? contract.aceite_ip : 'Não informado',
            signerPhoto: photo
          }
        }
      }
    } catch (err) {
      console.warn('Aviso ao carregar contrato do aluno:', err)
    }
  }
}

const toggleMenu = (id: string) => {
  openMenuId.value = openMenuId.value === id ? null : id
}

const closeMenu = () => {
  openMenuId.value = null
}

const openProfile = (aluno: any) => {
  selectedStudent.value = aluno
  isProfileModalOpen.value = true
  closeMenu()
}

const openEdit = (aluno: any) => {
  selectedStudent.value = aluno
  isEditModalOpen.value = true
  closeMenu()
}

const openDelete = (aluno: any) => {
  selectedStudent.value = aluno
  cancelError.value = ''
  isDeleteModalOpen.value = true
  closeMenu()
}

const closeCancelModal = () => {
  if (!isCancelling.value) isDeleteModalOpen.value = false
}

const handleProfileEdit = () => {
  isProfileModalOpen.value = false
  setTimeout(() => {
    isEditModalOpen.value = true
  }, 300) // Aguarda o fechamento do perfil
}

const openLockModal = () => {
  isProfileModalOpen.value = false
  setTimeout(() => {
    isLockModalOpen.value = true
  }, 300)
}

const openUnlockModal = () => {
  isProfileModalOpen.value = false
  setTimeout(() => {
    isUnlockModalOpen.value = true
  }, 300)
}

const emit = defineEmits(['refresh', 'page-change'])

const handleStudentLocked = async (data: { id:string, reason:string }) => {
  try {
    const { error } = await (supabase as any).rpc('trancar_aluno',{p_aluno_id:data.id,p_motivo:data.reason})
    if(error) throw error
  } catch (e:any) {
    alert(`Não foi possível trancar. ${e.message||''}`)
  }
  isLockModalOpen.value = false
  emit('refresh')
}

const handleStudentUnlocked = async (data: { id: string }) => {
  try {
    const { error }=await (supabase as any).rpc('destrancar_aluno',{p_aluno_id:data.id})
    if(error) throw error
  } catch (e:any) {
    alert(`Não foi possível destrancar. ${e.message||''}`)
  }
  isUnlockModalOpen.value = false
  emit('refresh')
}

const handleStudentUpdated = (_data: any) => {
  isEditModalOpen.value = false
  emit('refresh')
}

const handleStudentDeleted = async (data: { id: string, reason: string }) => {
  isCancelling.value = true
  cancelError.value = ''
  try {
    const { error } = await (supabase as any).rpc('cancelar_aluno', { p_aluno_id: data.id, p_motivo: data.reason })
    if (error) throw error
    isDeleteModalOpen.value = false
    emit('refresh')
  } catch (e: any) {
    console.error('Erro ao cancelar aluno:', e)
    cancelError.value = `Não foi possível cancelar. ${e.message || 'Tente novamente.'}`
  } finally {
    isCancelling.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', closeMenu)
})

onUnmounted(() => {
  window.removeEventListener('click', closeMenu)
})

const totalPages = computed(() => Math.max(1, Math.ceil(props.totalCount / props.itemsPerPage)))

const nextPage = () => {
  if (props.currentPage < totalPages.value) emit('page-change', props.currentPage + 1)
}

const prevPage = () => {
  if (props.currentPage > 1) emit('page-change', props.currentPage - 1)
}
</script>
