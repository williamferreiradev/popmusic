<template>
  <BaseModal 
    :is-open="isOpen" 
    title="Perfil do Aluno" 
    max-width="2xl"
    @close="$emit('close')"
  >
    <div v-if="student" class="flex flex-col gap-6">
      
      <!-- Cabeçalho do Perfil -->
      <div class="flex items-start sm:items-center gap-4 border-b border-light-border dark:border-dark-border pb-6">
        <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-light-border dark:bg-dark-border flex items-center justify-center overflow-hidden shrink-0 border-2 border-primary">
          <span v-if="!studentAvatar" class="text-2xl font-bold text-light-text/50 dark:text-offwhite/50">{{ student.initials }}</span>
          <img v-else :src="studentAvatar" alt="Avatar" class="w-full h-full object-cover" />
        </div>
        
        <div class="flex-1 flex flex-col gap-1">
          <div class="flex items-center gap-3">
            <h2 class="text-2xl font-bold text-light-text dark:text-offwhite">{{ student.name }}</h2>
            <BaseBadge :variant="student.statusVariant">{{ student.statusLabel }}</BaseBadge>
          </div>
          <p class="text-sm text-light-text/70 dark:text-offwhite/70">
            {{ formatEnrollmentDate(student.raw?.data_matricula || student.raw?.criado_em) }}
          </p>
          <div class="flex flex-wrap gap-2 mt-2">
            <span 
              v-for="mod in studentModalities" 
              :key="mod"
              class="px-2.5 py-1 bg-gold-soft text-gold text-xs font-semibold rounded-md border border-gold/20"
            >
              {{ mod }}
            </span>
          </div>
        </div>
      </div>

      <!-- Grade de Informações -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- Coluna Esquerda: Dados Pessoais e Contato -->
        <div class="flex flex-col gap-4">
          <div class="bg-light-bg/50 dark:bg-dark-bg/50 p-4 rounded-lg border border-light-border dark:border-dark-border">
            <h3 class="text-sm font-bold text-light-text dark:text-offwhite mb-3 flex items-center gap-2">
              <User class="w-4 h-4 text-primary" /> Informações Pessoais
            </h3>
            <ul class="space-y-3 text-sm">
              <li class="flex flex-col">
                <span class="text-xs text-light-text/50 dark:text-offwhite/50">CPF</span> 
                <span class="font-medium text-light-text dark:text-offwhite">{{ formatCPF(student.raw?.cpf || student.cpf) }}</span>
              </li>
              <li class="flex flex-col">
                <span class="text-xs text-light-text/50 dark:text-offwhite/50">Telefone / WhatsApp</span> 
                <span class="font-medium text-light-text dark:text-offwhite">{{ formatPhone(student.raw?.telefone || student.phone) }}</span>
              </li>
              <li class="flex flex-col">
                <span class="text-xs text-light-text/50 dark:text-offwhite/50">E-mail</span> 
                <span class="font-medium text-light-text dark:text-offwhite">{{ student.raw?.email || student.email || 'Não informado' }}</span>
              </li>
              <li class="flex flex-col">
                <span class="text-xs text-light-text/50 dark:text-offwhite/50">Data de Nascimento</span> 
                <span class="font-medium text-light-text dark:text-offwhite">{{ formatBirthDate(student.raw?.data_nascimento || student.birthDate) }}</span>
              </li>
            </ul>
          </div>

          <!-- Responsável Legal (se houver) -->
          <div v-if="student.raw?.responsavel_nome" class="bg-light-bg/50 dark:bg-dark-bg/50 p-4 rounded-lg border border-light-border dark:border-dark-border">
            <h3 class="text-sm font-bold text-gold mb-3 flex items-center gap-2">
              <UserCheck class="w-4 h-4 text-gold" /> Responsável Legal
            </h3>
            <ul class="space-y-3 text-sm">
              <li class="flex flex-col">
                <span class="text-xs text-light-text/50 dark:text-offwhite/50">Nome do Responsável</span>
                <span class="font-medium text-light-text dark:text-offwhite">{{ student.raw.responsavel_nome }}</span>
              </li>
              <li v-if="student.raw.responsavel_cpf" class="flex flex-col">
                <span class="text-xs text-light-text/50 dark:text-offwhite/50">CPF do Responsável</span>
                <span class="font-medium text-light-text dark:text-offwhite">{{ formatCPF(student.raw.responsavel_cpf) }}</span>
              </li>
              <li v-if="student.raw.responsavel_telefone" class="flex flex-col">
                <span class="text-xs text-light-text/50 dark:text-offwhite/50">Telefone do Responsável</span>
                <span class="font-medium text-light-text dark:text-offwhite">{{ formatPhone(student.raw.responsavel_telefone) }}</span>
              </li>
            </ul>
          </div>

          <!-- Emergência -->
          <div v-if="student.raw?.emergencia_nome || student.raw?.tipo_sanguineo" class="bg-light-bg/50 dark:bg-dark-bg/50 p-4 rounded-lg border border-light-border dark:border-dark-border">
            <h3 class="text-sm font-bold text-light-text dark:text-offwhite mb-3 flex items-center gap-2">
              <HeartPulse class="w-4 h-4 text-red-500" /> Saúde e Emergência
            </h3>
            <ul class="space-y-3 text-sm">
              <li v-if="student.raw?.tipo_sanguineo" class="flex flex-col">
                <span class="text-xs text-light-text/50 dark:text-offwhite/50">Tipo Sanguíneo</span> 
                <span class="font-medium font-mono text-red-500">{{ student.raw.tipo_sanguineo }}</span>
              </li>
              <li v-if="student.raw?.emergencia_nome" class="flex flex-col">
                <span class="text-xs text-light-text/50 dark:text-offwhite/50">Contato de Emergência</span> 
                <span class="font-medium text-light-text dark:text-offwhite">
                  {{ student.raw.emergencia_nome }} {{ student.raw.emergencia_telefone ? `(${formatPhone(student.raw.emergencia_telefone)})` : '' }}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Coluna Direita: Acadêmico e Histórico -->
        <div class="flex flex-col gap-4">
          <div class="bg-light-bg/50 dark:bg-dark-bg/50 p-4 rounded-lg border border-light-border dark:border-dark-border">
            <h3 class="text-sm font-bold text-light-text dark:text-offwhite mb-3 flex items-center gap-2">
              <Calendar class="w-4 h-4 text-primary" /> Turmas e Horários
            </h3>
            <ul class="space-y-3 text-sm">
              <li class="flex flex-col gap-2">
                <span class="text-xs font-semibold text-light-text/50 dark:text-offwhite/50">Turmas Matriculadas:</span>
                <div v-if="studentClasses.length > 0" class="flex flex-col gap-2">
                  <div 
                    v-for="cls in studentClasses" 
                    :key="cls"
                    class="flex items-center gap-2 bg-light-surface dark:bg-dark-surface p-2.5 rounded-md border border-light-border dark:border-dark-border"
                  >
                    <Clock class="w-4 h-4 text-gold shrink-0" />
                    <span class="font-medium text-light-text dark:text-offwhite text-xs sm:text-sm">{{ cls }}</span>
                  </div>
                </div>
                <div v-else class="text-xs text-light-text/50 dark:text-offwhite/50 italic">
                  {{ student.mainClass !== '-' ? student.mainClass : 'Nenhuma turma ativa vinculada' }}
                </div>
              </li>
            </ul>
          </div>

          <div class="bg-light-bg/50 dark:bg-dark-bg/50 p-4 rounded-lg border border-light-border dark:border-dark-border flex-1 flex flex-col justify-between">
            <div>
              <h3 class="text-sm font-bold text-light-text dark:text-offwhite mb-2 flex items-center gap-2">
                <FileText class="w-4 h-4 text-primary" /> Situação Cadastral & Contrato
              </h3>
              <p class="text-xs text-light-text/70 dark:text-offwhite/70 leading-relaxed">
                Contrato oficial da Pop Music disponível para conferência, assinatura ou impressão física em formato A4.
              </p>
            </div>

            <div class="mt-4 pt-3 border-t border-light-border dark:border-dark-border flex items-center justify-between">
              <button 
                type="button"
                @click="openContractModal"
                class="px-3.5 py-1.5 bg-primary/10 hover:bg-primary hover:text-white text-primary text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer class="w-3.5 h-3.5" />
                Visualizar / Imprimir Contrato
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Modal de Contrato Oficial do Aluno -->
    <PreviewContractModal 
      :is-open="isContractModalOpen"
      :custom-data="studentContractData"
      :signed-info="studentSignedInfo"
      @close="isContractModalOpen = false"
    />

    <template #footer>
      <div class="w-full flex items-center justify-between">
        <div class="flex items-center gap-2">
          <button 
            v-if="student?.statusLabel === 'Trancado'"
            @click="$emit('unlock', student.id)"
            class="px-4 py-2 rounded-md font-medium text-light-text dark:text-offwhite hover:bg-light-border dark:hover:bg-dark-border transition-colors border border-transparent flex items-center gap-2"
          >
            <Unlock class="w-4 h-4" />
            Destrancar Matrícula
          </button>
          <button 
            v-else-if="student?.statusLabel === 'Ativo'"
            @click="$emit('lock', student.id)"
            class="px-4 py-2 rounded-md font-medium text-light-text dark:text-offwhite hover:bg-light-border dark:hover:bg-dark-border transition-colors border border-transparent flex items-center gap-2"
          >
            <Lock class="w-4 h-4" />
            Trancar Matrícula
          </button>
        </div>

        <div class="flex items-center gap-2">
          <button 
            @click="$emit('edit', student.id)"
            class="px-4 py-2 rounded-md font-medium text-light-text dark:text-offwhite hover:bg-light-border dark:hover:bg-dark-border transition-colors border border-transparent flex items-center gap-2"
          >
            <Edit2 class="w-4 h-4" />
            Editar Cadastro
          </button>
          <button 
            @click="$emit('close')"
            class="px-4 py-2 rounded-md font-medium text-white bg-primary hover:bg-primary-hover transition-colors shadow-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { User, UserCheck, Calendar, FileText, HeartPulse, Clock, Edit2, Lock, Unlock, Printer } from '@lucide/vue'
import BaseModal from '../BaseModal.vue'
import BaseBadge from '../BaseBadge.vue'
import PreviewContractModal from './PreviewContractModal.vue'
import { buildPopMusicContractData } from '~/utils/contractFormatter'
import type { PopMusicContractData, SignedContractInfo } from '../contratos/PopMusicContractDocument.vue'

const supabase = useSupabaseClient()

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  student: {
    type: Object,
    default: null
  }
})

defineEmits(['close', 'edit', 'lock', 'unlock'])

const isContractModalOpen = ref(false)
const studentSignedInfo = ref<SignedContractInfo | null>(null)

const openContractModal = async () => {
  await fetchStudentContract()
  isContractModalOpen.value = true
}

const fetchStudentContract = async () => {
  const raw = props.student?.raw || props.student
  const alunoId = raw?.id
  if (!alunoId) return

  try {
    const { data: contract } = await supabase
      .from('contratos')
      .select('*')
      .eq('aluno_id', alunoId)
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (contract) {
      const photo = contract.foto_assinatura_url || raw.foto_url || props.student?.avatar
      const isSigned = contract.status === 'aceito' || contract.status === 'assinado' || !!contract.data_aceite || !!contract.foto_assinatura_url

      if (isSigned || photo) {
        studentSignedInfo.value = {
          signerName: raw.responsavel_nome || raw.nome || props.student?.name || 'Signatário',
          signerCpf: raw.responsavel_cpf || raw.cpf || '',
          acceptedAt: contract.data_aceite 
            ? new Date(contract.data_aceite).toLocaleString('pt-BR') 
            : new Date(contract.criado_em || Date.now()).toLocaleString('pt-BR'),
          token: contract.token || contract.aceite_hash || 'AUTH-DIGITAL',
          ip: contract.aceite_ip || '127.0.0.1 (Assinatura Segura)',
          signerPhoto: photo
        }
      }
    }
  } catch (err) {
    console.warn('Aviso ao carregar contrato no perfil:', err)
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.student) {
    fetchStudentContract()
  }
})

const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

const studentContractData = computed<PopMusicContractData>(() => {
  const raw = props.student?.raw || props.student
  if (!raw) return {}

  const turmasList: any[] = []
  if (raw.matriculas_turma && Array.isArray(raw.matriculas_turma)) {
    raw.matriculas_turma.forEach((m: any) => {
      if (m.turmas) turmasList.push(m.turmas)
    })
  }

  return buildPopMusicContractData(raw, { valor_mensalidade: 180, dia_vencimento: 10 }, turmasList)
})

const studentAvatar = computed(() => {
  return props.student?.avatar || props.student?.raw?.foto_url || props.student?.raw?.avatar_url || props.student?.foto_url || null
})

const studentModalities = computed(() => {
  const raw = props.student?.raw || props.student
  if (!raw) return []
  const mods: string[] = []
  if (raw.matriculas_turma && Array.isArray(raw.matriculas_turma)) {
    raw.matriculas_turma.forEach((m: any) => {
      const nome = m.turmas?.modalidades?.nome
      if (nome && !mods.includes(nome)) mods.push(nome)
    })
  }
  if (mods.length === 0 && props.student?.mainClass && props.student.mainClass !== '-') {
    mods.push(props.student.mainClass)
  }
  return mods
})

const studentClasses = computed(() => {
  const raw = props.student?.raw || props.student
  if (!raw || !raw.matriculas_turma) return []
  return raw.matriculas_turma.map((m: any) => {
    const t = m.turmas
    if (!t) return ''
    const mod = t.modalidades?.nome || 'Aula'
    const dia = dayNames[t.dia_semana] || ''
    const horaInicio = t.horario_inicio ? t.horario_inicio.substring(0, 5) : ''
    const horaFim = t.horario_fim ? t.horario_fim.substring(0, 5) : ''
    return `${mod} - ${dia} das ${horaInicio} às ${horaFim}`
  }).filter(Boolean)
})

const formatEnrollmentDate = (dateStr?: string) => {
  if (!dateStr) return 'Matrícula recente'
  const d = new Date(dateStr)
  return `Matriculado desde ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`
}

const formatBirthDate = (dateStr?: string) => {
  if (!dateStr) return 'Não informado'
  const d = new Date(dateStr)
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
  return `${d.toLocaleDateString('pt-BR')} (${age} anos)`
}

const formatCPF = (cpf?: string) => {
  if (!cpf) return 'Não informado'
  const clean = cpf.replace(/\D/g, '')
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  return cpf
}

const formatPhone = (phone?: string) => {
  if (!phone) return 'Não informado'
  const clean = phone.replace(/\D/g, '')
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return phone
}
</script>
