<template>
  <div class="p-8 w-full flex flex-col gap-6 min-h-[calc(100vh-theme(spacing.16))] relative">
    
    <!-- Cabeçalho -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-light-text dark:text-offwhite flex items-center gap-2">
          <CheckSquare class="w-6 h-6 text-primary" />
          Diário de Frequência
        </h1>
        <p class="text-sm text-light-text/70 dark:text-offwhite/70">
          Selecione a turma e a data para registrar a presença dos alunos (a chamada refletirá na agenda e no financeiro).
        </p>
      </div>

      <!-- Seletor Rápido de Data da Chamada -->
      <div class="flex items-center gap-3 bg-light-surface dark:bg-dark-surface p-2.5 rounded-xl border border-light-border dark:border-dark-border shadow-sm">
        <label class="text-xs font-bold text-light-text/70 dark:text-offwhite/70 whitespace-nowrap flex items-center gap-1.5">
          <CalendarIcon class="w-4 h-4 text-primary" />
          Data da Chamada:
        </label>
        <input 
          v-model="selectedDate" 
          type="date"
          @change="handleDateChange"
          class="px-2.5 py-1 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded text-xs font-bold text-light-text dark:text-offwhite focus:outline-none focus:border-primary"
        />
      </div>
    </div>

    <!-- Filtro de Dias da Semana (Pills) -->
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-light-text/60 dark:text-offwhite/60 uppercase tracking-wider">
          Filtrar Turmas por Dia:
        </span>
        <span class="text-xs text-primary font-medium">
          {{ filteredTurmasCards.length }} turma{{ filteredTurmasCards.length === 1 ? '' : 's' }} encontrada{{ filteredTurmasCards.length === 1 ? '' : 's' }}
        </span>
      </div>

      <div class="flex gap-2 overflow-x-auto pb-1">
        <button 
          v-for="pill in dayFilterPills" 
          :key="pill.value"
          @click="activeDayPill = pill.value"
          class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border cursor-pointer"
          :class="activeDayPill === pill.value 
            ? 'bg-primary text-white border-primary shadow-sm' 
            : 'bg-light-surface dark:bg-dark-surface text-light-text/70 dark:text-offwhite/70 border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-bg'"
        >
          {{ pill.label }}
        </button>
      </div>
    </div>

    <!-- Grade Visual de Turmas para Seleção Rápida -->
    <div v-if="filteredTurmasCards.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
      <div 
        v-for="t in filteredTurmasCards" 
        :key="t.id"
        @click="selectTurmaCard(t.id)"
        class="p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden group shadow-sm"
        :class="selectedClass === t.id 
          ? 'bg-primary/10 border-primary shadow-md ring-2 ring-primary/40' 
          : 'bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border hover:border-primary/50 hover:bg-light-bg/40 dark:hover:bg-dark-bg/40'"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <h3 class="font-bold text-sm text-light-text dark:text-offwhite group-hover:text-primary transition-colors">
              {{ t.modalidades?.nome || 'Aula de Música' }}
            </h3>
            <p class="text-xs text-light-text/60 dark:text-offwhite/60 mt-0.5">
              Prof. {{ t.professores?.nome || 'Professor' }}
            </p>
          </div>
          <span 
            class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0"
            :class="selectedClass === t.id ? 'bg-primary text-white' : 'bg-gold-soft text-gold border border-gold/20'"
          >
            {{ fullDayNames[t.dia_semana] || 'Semana' }}
          </span>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-light-border/50 dark:border-dark-border/50 text-xs">
          <span class="font-mono text-light-text/70 dark:text-offwhite/70 font-semibold">
            {{ t.horario_inicio ? t.horario_inicio.substring(0, 5) : '00:00' }} - {{ t.horario_fim ? t.horario_fim.substring(0, 5) : '00:00' }}
          </span>
          <span class="text-light-text/60 dark:text-offwhite/60 font-medium">
            {{ countActiveStudents(t) }} aluno{{ countActiveStudents(t) === 1 ? '' : 's' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Alertas de Data -->
    <div v-if="isRetroactiveDate || isHolidayDate" class="flex flex-col gap-2">
      <p v-if="isRetroactiveDate" class="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
        ℹ️ Você está lançando uma chamada para uma data retroativa ({{ formatDateBR(selectedDate) }}).
      </p>
      <p v-if="isHolidayDate" class="text-xs text-red-500 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20 flex items-center gap-1.5">
        <AlertTriangle class="w-4 h-4" />
        Atenção: esta data é feriado.
      </p>
    </div>

    <!-- ÁREA DE CONTEÚDO DA CHAMADA -->
    
    <!-- 1. Vazio Inicial -->
    <div v-if="currentState === 'initial'" class="flex-1 flex flex-col items-center justify-center text-light-text/40 dark:text-offwhite/40 py-16 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl">
      <Users class="w-14 h-14 mb-3 opacity-40 text-primary" />
      <p class="text-base font-bold text-light-text dark:text-offwhite">Selecione uma turma acima</p>
      <p class="text-xs mt-1 text-light-text/60 dark:text-offwhite/60">
        Clique no card de qualquer turma para carregar os alunos e realizar a chamada de {{ formatDateBR(selectedDate) }}.
      </p>
    </div>

    <!-- 2. Carregando (Skeleton) -->
    <div v-if="currentState === 'loading'" class="flex-1 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl overflow-hidden flex flex-col p-6 gap-4">
      <div class="h-6 w-56 bg-light-border dark:bg-dark-border rounded animate-pulse"></div>
      <div v-for="i in 3" :key="i" class="p-4 flex items-center justify-between border-b border-light-border/40 dark:border-dark-border/40">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-light-border dark:bg-dark-border animate-pulse"></div>
          <div class="h-4 w-32 bg-light-border dark:bg-dark-border rounded animate-pulse"></div>
        </div>
        <div class="flex gap-2">
          <div class="w-10 h-8 rounded bg-light-border dark:bg-dark-border animate-pulse"></div>
          <div class="w-10 h-8 rounded bg-light-border dark:bg-dark-border animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- 3. Turma Sem Alunos Matriculados -->
    <div v-if="currentState === 'empty_class'" class="flex-1 flex flex-col items-center justify-center text-light-text/50 dark:text-offwhite/50 py-16 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl">
      <Users class="w-12 h-12 mb-3 opacity-40" />
      <p class="text-base font-bold text-light-text dark:text-offwhite">Nenhum aluno matriculado nesta turma</p>
      <p class="text-xs mt-1">Matricule novos alunos através do menu Alunos > Nova Matrícula.</p>
    </div>

    <!-- 4. Lista da Chamada Carregada -->
    <div v-if="currentState === 'loaded'" class="flex-1 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl shadow-sm overflow-hidden flex flex-col">
      <!-- Cabeçalho Lista -->
      <div class="px-4 sm:px-6 py-4 border-b border-light-border dark:border-dark-border bg-light-bg/30 dark:bg-dark-bg/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
        <div>
          <h3 class="font-bold text-light-text dark:text-offwhite text-lg flex items-center gap-2">
            <span>{{ selectedClassLabel }}</span>
            <span class="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-mono font-bold">
              {{ formatDateBR(selectedDate) }}
            </span>
          </h3>
          <p class="text-xs text-light-text/60 dark:text-offwhite/60 mt-0.5">
            {{ registeredCount }} de {{ students.length }} alunos registrados &nbsp;|&nbsp; 
            <span class="text-green-600 font-bold">{{ counts.presentes }} Presente(s)</span> &nbsp;•&nbsp; 
            <span class="text-red-500 font-bold">{{ counts.faltas }} Falta(s)</span> &nbsp;•&nbsp; 
            <span class="text-amber-500 font-bold">{{ counts.justificadas }} Justificada(s)</span>
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
        <span v-if="isFinalized" class="px-3 py-2 rounded-md text-xs font-bold bg-green-500/10 text-green-600 border border-green-500/30">Chamada finalizada</span>
        <button
          v-if="isFinalized"
          @click="reopenAttendance"
          :disabled="isReopening"
          class="px-4 py-2 rounded-md text-xs font-bold border border-amber-500/40 text-amber-600 hover:bg-amber-500/10 disabled:opacity-40"
        >
          {{ isReopening ? 'Reabrindo...' : 'Reabrir chamada' }}
        </button>
        <button 
          @click="markAllPresent"
          :disabled="isFinalized"
          class="px-4 py-2 rounded-md text-xs font-bold bg-green-500 hover:bg-green-600 text-white shadow-sm transition-colors cursor-pointer"
        >
          Marcar todos como presentes
        </button>
        </div>
      </div>

      <!-- Alunos -->
      <div class="divide-y divide-light-border/50 dark:divide-dark-border/50 overflow-y-auto flex-1">
        <div 
          v-for="student in students" 
          :key="student.id"
          class="p-4 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-light-bg/20 dark:hover:bg-dark-bg/20 transition-colors"
        >
          <!-- Perfil do Aluno -->
          <div class="flex items-center gap-3 flex-1">
            <div class="w-10 h-10 rounded-full flex items-center justify-center bg-gold-soft text-gold font-bold shrink-0">
              {{ student.name.charAt(0) }}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <p class="font-bold text-light-text dark:text-offwhite text-sm">{{ student.name }}</p>
                <!-- Selo QR Code -->
                <span 
                  v-if="student.qrCheckIn" 
                  class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20 uppercase flex items-center gap-1 cursor-help"
                  :title="`Check-in automático às ${student.qrCheckInTime}`"
                >
                  <CheckSquare class="w-3 h-3" /> QR
                </span>
                <span 
                  v-if="student.isReplacement" 
                  class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase"
                >
                  Reposição
                </span>
              </div>
              <p class="text-xs mt-0.5" :class="student.attendance ? 'text-light-text dark:text-offwhite font-medium' : 'text-light-text/50 dark:text-offwhite/50'">
                {{ getStatusText(student) }}
              </p>
            </div>
          </div>

          <!-- Ações da Chamada -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            
            <div class="flex bg-light-bg dark:bg-dark-bg rounded-lg p-1 border border-light-border dark:border-dark-border shrink-0">
              <!-- Presente -->
              <button 
                @click="markAttendance(student, 'presente')"
                :disabled="isFinalized"
                class="px-4 py-1.5 rounded-md text-xs font-bold transition-all w-14 text-center cursor-pointer"
                :class="student.attendance === 'presente' ? 'bg-green-500 text-white shadow-sm' : 'text-light-text/50 dark:text-offwhite/50 hover:bg-green-500/10 hover:text-green-500 border border-transparent'"
                title="Marcar Presente"
              >
                PRESENTE
              </button>
              
              <!-- Falta -->
              <button 
                @click="markAttendance(student, 'falta')"
                :disabled="isFinalized"
                class="px-4 py-1.5 rounded-md text-xs font-bold transition-all w-14 text-center cursor-pointer"
                :class="student.attendance === 'falta' ? 'bg-red-500 text-white shadow-sm' : 'text-light-text/50 dark:text-offwhite/50 hover:bg-red-500/10 hover:text-red-500 border border-transparent'"
                title="Marcar Falta"
              >
                FALTA
              </button>
            </div>

            <!-- Justificar -->
            <button 
              @click="openJustifyModal(student)"
              :disabled="isFinalized"
              class="px-3 py-1.5 rounded-md text-xs font-semibold border border-light-border dark:border-dark-border hover:bg-light-border/30 dark:hover:bg-dark-border/30 transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
              :class="student.attendance === 'falta_justificada' ? 'border-amber-500 text-amber-500 bg-amber-500/10' : 'text-light-text/70 dark:text-offwhite/70'"
            >
              <span>{{ student.attendance === 'falta_justificada' ? 'Falta Justificada' : 'Justificar' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modais -->
    <JustifyAbsenceModal 
      :is-open="isJustifyModalOpen"
      :student="selectedStudentForJustify"
      :class-date="selectedDate"
      @close="isJustifyModalOpen = false"
      @confirm="handleJustifyConfirm"
    />

    <AlreadyRegisteredModal 
      :is-open="isAlreadyRegisteredModalOpen"
      :class-label="selectedClassLabel"
      :class-date="selectedDate"
      @close="cancelAlreadyRegistered"
      @confirm="proceedAlreadyRegistered"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { CheckSquare, Search, Users, AlertTriangle, Calendar as CalendarIcon } from '@lucide/vue'
import JustifyAbsenceModal from '~/components/modals/JustifyAbsenceModal.vue'
import AlreadyRegisteredModal from '~/components/modals/AlreadyRegisteredModal.vue'

const supabase = useSupabaseClient()
const user = useSupabaseUser()

type AppState = 'initial' | 'loading' | 'loaded' | 'empty_class' | 'error'

const currentState = ref<AppState>('initial')
const selectedClass = ref('')
const selectedDate = ref(new Date().toISOString().split('T')[0])
const activeDayPill = ref<string | number>('todos')

// 1. Carregar turmas reais do Supabase
const { data: rawTurmas } = await useAsyncData('frequencia_turmas_list', async () => {
  const { data } = await supabase
    .from('turmas')
    .select(`
      id,
      dia_semana,
      horario_inicio,
      horario_fim,
      modalidades (nome),
      professores (nome),
      matriculas_turma (id, data_inicio, data_fim)
    `)
    .eq('ativo', true)
    .order('dia_semana')
    .order('horario_inicio')
  return data || []
})

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const fullDayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const dayFilterPills = computed(() => {
  const todayDay = new Date().getDay()
  return [
    { label: 'Todas as Turmas', value: 'todos' },
    { label: `Hoje (${dayNames[todayDay]})`, value: 'hoje' },
    { label: 'Segunda', value: 1 },
    { label: 'Terça', value: 2 },
    { label: 'Quarta', value: 3 },
    { label: 'Quinta', value: 4 },
    { label: 'Sexta', value: 5 },
    { label: 'Sábado', value: 6 }
  ]
})

const filteredTurmasCards = computed(() => {
  const all = rawTurmas.value || []
  if (activeDayPill.value === 'todos') return all

  if (activeDayPill.value === 'hoje') {
    const targetDay = new Date(selectedDate.value + 'T12:00:00').getDay()
    return all.filter((t: any) => t.dia_semana === targetDay)
  }

  return all.filter((t: any) => t.dia_semana === activeDayPill.value)
})

const countActiveStudents = (turma: any) => {
  if (!turma?.matriculas_turma || !Array.isArray(turma.matriculas_turma)) return 0
  const referenceDate = selectedDate.value || todayDate
  return turma.matriculas_turma.filter((m: any) => m.data_inicio <= referenceDate && (!m.data_fim || m.data_fim >= referenceDate)).length
}

const selectedClassLabel = computed(() => {
  const t = (rawTurmas.value || []).find((c: any) => c.id === selectedClass.value)
  if (!t) return 'Turma'
  const modNome = t.modalidades?.nome || 'Aula'
  const profNome = t.professores?.nome || 'Prof'
  const dia = fullDayNames[t.dia_semana] || ''
  const hora = t.horario_inicio ? t.horario_inicio.substring(0, 5) : ''
  return `${modNome} — ${dia} às ${hora} (Prof. ${profNome})`
})

const formatDateBR = (isoStr: string) => {
  if (!isoStr) return '-'
  const [y, m, d] = isoStr.split('-')
  return `${d}/${m}/${y}`
}

const selectTurmaCard = (turmaId: string) => {
  selectedClass.value = turmaId
  executeSearch()
}

const handleDateChange = () => {
  if (selectedClass.value) {
    executeSearch()
  }
}

const todayDate = new Date().toISOString().split('T')[0]

const isRetroactiveDate = computed(() => {
  if (!selectedDate.value) return false
  return selectedDate.value < todayDate
})

// Feriados do banco
const { data: feriadosList } = await useAsyncData('feriados_list', async () => {
  const { data } = await supabase.from('feriados').select('data, nome')
  return data || []
})

const isHolidayDate = computed(() => {
  if (!selectedDate.value) return false
  return (feriadosList.value || []).some((f: any) => f.data === selectedDate.value)
})

// --- Alunos e Presenças ---
type AttendanceStatus = 'presente' | 'falta' | 'falta_justificada' | null

interface StudentRecord {
  id: string
  name: string
  attendance: AttendanceStatus
  attendanceTime: string | null
  justifyReason: string | null
  isReplacement: boolean
  qrCheckIn: boolean
  qrCheckInTime: string | null
  presencaId?: string
}

const students = ref<StudentRecord[]>([])
const isFinalized = ref(false)
const activeClosingId = ref<string | null>(null)
const isReopening = ref(false)

const registeredCount = computed(() => {
  return students.value.filter(s => s.attendance !== null).length
})

const counts = computed(() => {
  return {
    presentes: students.value.filter(s => s.attendance === 'presente').length,
    faltas: students.value.filter(s => s.attendance === 'falta').length,
    justificadas: students.value.filter(s => s.attendance === 'falta_justificada').length
  }
})

// --- Busca de Turma ---
const isAlreadyRegisteredModalOpen = ref(false)

const cancelAlreadyRegistered = () => {
  isAlreadyRegisteredModalOpen.value = false
  currentState.value = 'initial'
}

const proceedAlreadyRegistered = () => {
  isAlreadyRegisteredModalOpen.value = false
  executeSearch(true)
}

const executeSearch = async (prefilled = false) => {
  if (!selectedClass.value) return
  currentState.value = 'loading'
  isFinalized.value = false
  activeClosingId.value = null
  
  try {
    const { data: closing, error: closingError } = await (supabase as any)
      .from('chamadas_aula')
      .select('id, finalizada_em')
      .eq('turma_id', selectedClass.value)
      .eq('data_aula', selectedDate.value)
      .eq('ativa', true)
      .maybeSingle()
    if (closingError) throw closingError
    isFinalized.value = Boolean(closing)
    activeClosingId.value = closing?.id || null

    // 1. Buscar alunos matriculados na turma
    const { data: matriculas, error: matError } = await supabase
      .from('matriculas_turma')
      .select(`
        id,
        aluno_id,
        data_inicio,
        data_fim,
        alunos (id, nome, telefone, status)
      `)
      .eq('turma_id', selectedClass.value)
      .lte('data_inicio', selectedDate.value)
      .or(`data_fim.is.null,data_fim.gte.${selectedDate.value}`)

    if (matError) throw matError

    if (!matriculas || matriculas.length === 0) {
      currentState.value = 'empty_class'
      return
    }

    // 2. Buscar presenças já gravadas para esta turma e data
    const { data: presencasGravadas } = await supabase
      .from('presencas')
      .select('*')
      .eq('turma_id', selectedClass.value)
      .eq('data_aula', selectedDate.value)

    const presencasMap: Record<string, any> = {}
    if (presencasGravadas) {
      presencasGravadas.forEach((p: any) => {
        presencasMap[p.aluno_id] = p
      })
    }

    students.value = matriculas.map((m: any) => {
      const aluno = m.alunos
      const p = presencasMap[aluno.id]

      return {
        id: aluno.id,
        name: aluno.nome,
        attendance: p?.status || null,
        attendanceTime: p?.horario_real || null,
        justifyReason: p?.motivo_justificativa || null,
        isReplacement: p?.tipo_aula === 'reposicao',
        qrCheckIn: p?.origem === 'qr_code',
        qrCheckInTime: p?.origem === 'qr_code' ? p?.horario_real : null,
        presencaId: p?.id
      }
    })

    currentState.value = 'loaded'
  } catch (error) {
    console.error('Erro ao carregar chamada:', error)
    currentState.value = 'error'
  }
}

// --- Chamada e Persistência no Supabase ---
const getStatusText = (student: StudentRecord) => {
  if (student.attendance === 'presente') return `Presente às ${student.attendanceTime}`
  if (student.attendance === 'falta') return `Falta registrada às ${student.attendanceTime}`
  if (student.attendance === 'falta_justificada') return `Falta justificada — ${student.justifyReason}`
  return 'Aguardando registro'
}

const getCurrentTime = () => {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

const markAttendance = async (student: StudentRecord, status: 'presente' | 'falta') => {
  if (isFinalized.value) return
  const time = getCurrentTime()
  student.attendance = status
  student.attendanceTime = time
  student.justifyReason = null

  try {
    if (student.presencaId) {
      await supabase.from('presencas').update({
        status,
        horario_real: time,
        motivo_justificativa: null
      }).eq('id', student.presencaId)
    } else {
      const { data } = await supabase.from('presencas').insert({
        aluno_id: student.id,
        turma_id: selectedClass.value,
        data_aula: selectedDate.value,
        status,
        horario_real: time,
        tipo_aula: 'normal',
        origem: 'manual'
      }).select().single()

      if (data) student.presencaId = data.id
    }
  } catch (error) {
    console.error('Erro ao salvar presença:', error)
  }
}

const markAllPresent = async () => {
  if (isFinalized.value || !confirm('Marcar todos os alunos como presentes?')) return
  for (const s of students.value) {
    if (s.attendance !== 'presente') {
      await markAttendance(s, 'presente')
    }
  }
}

const reopenAttendance = async () => {
  if (!isFinalized.value || !activeClosingId.value || isReopening.value) return
  const reason = prompt('Informe o motivo da reabertura (mínimo de 5 caracteres):')?.trim() || ''
  if (reason.length < 5) {
    if (reason) alert('O motivo precisa ter pelo menos 5 caracteres.')
    return
  }
  if (!confirm('Confirmar a reabertura desta chamada? A ação ficará registrada.')) return

  isReopening.value = true
  try {
    const { error } = await (supabase as any)
      .from('chamadas_aula')
      .update({
        ativa: false,
        reaberta_em: new Date().toISOString(),
        reaberta_por: user.value?.id,
        motivo_reabertura: reason
      })
      .eq('id', activeClosingId.value)
      .eq('ativa', true)
    if (error) throw error
    isFinalized.value = false
    activeClosingId.value = null
  } catch (error: any) {
    console.error('Erro ao reabrir chamada:', error)
    alert(`Não foi possível reabrir a chamada. ${error.message || 'Tente novamente.'}`)
  } finally {
    isReopening.value = false
  }
}

// Justificativa
const isJustifyModalOpen = ref(false)
const selectedStudentForJustify = ref<StudentRecord | null>(null)

const openJustifyModal = (student: StudentRecord) => {
  if (isFinalized.value) return
  selectedStudentForJustify.value = student
  isJustifyModalOpen.value = true
}

const handleJustifyConfirm = async (data: { reason: string, scheduleReplacement: boolean, replacementDate: string }) => {
  if (!selectedStudentForJustify.value) return
  const student = selectedStudentForJustify.value
  const time = getCurrentTime()

  const reasonMap: Record<string, 'atestado_medico' | 'falta_professor' | 'outro'> = {
    atestado: 'atestado_medico',
    atestado_medico: 'atestado_medico',
    falta_professor: 'falta_professor',
    outro: 'outro'
  }
  const reason = reasonMap[data.reason] || 'outro'
  student.attendance = 'falta_justificada'
  student.attendanceTime = time
  student.justifyReason = reason
  isJustifyModalOpen.value = false

  try {
    if (student.presencaId) {
      await supabase.from('presencas').update({
        status: 'falta_justificada',
        horario_real: time,
        motivo_justificativa: reason
      }).eq('id', student.presencaId)
    } else {
      const { data: inserted } = await supabase.from('presencas').insert({
        aluno_id: student.id,
        turma_id: selectedClass.value,
        data_aula: selectedDate.value,
        status: 'falta_justificada',
        horario_real: time,
        motivo_justificativa: reason,
        tipo_aula: 'normal',
        origem: 'manual'
      }).select().single()

      if (inserted) student.presencaId = inserted.id
    }
  } catch (error) {
    console.error('Erro ao justificar falta:', error)
  }
}
</script>
