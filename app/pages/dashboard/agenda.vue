<template>
  <div class="p-8 w-full flex flex-col gap-6 h-[calc(100vh-theme(spacing.16))]">
    <!-- Cabeçalho e Controles -->
    <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-light-text dark:text-offwhite flex items-center gap-2">
          <CalendarIcon class="w-6 h-6 text-primary" />
          Agenda
        </h1>
        <p class="text-sm text-light-text/70 dark:text-offwhite/70">{{ appointmentsTodayCount }} agendamentos hoje</p>
      </div>

      <div class="flex flex-wrap items-center gap-6">
        <BaseButton variant="primary" class="flex items-center gap-2" @click="openClassForm()">
          <Plus class="w-4 h-4" /> Nova turma
        </BaseButton>
        <!-- Legenda -->
        <div class="flex items-center gap-4 text-xs font-medium text-light-text dark:text-offwhite">
          <div class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-blue-500"/> Agendado</div>
          <div class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-green-500"/> Concluído</div>
          <div class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-red-500"/> Cancelado</div>
          <div class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-orange-500"/> Faltou</div>
        </div>

        <div class="flex items-center gap-4">
          <!-- Botão Hoje -->
          <button 
            class="px-4 py-1.5 rounded-md text-sm font-medium border border-light-border dark:border-dark-border text-primary hover:bg-light-border dark:hover:bg-dark-border transition-colors"
            @click="goToToday"
          >
            Hoje
          </button>
          
          <!-- Controles Navegação -->
          <div class="flex items-center gap-2">
            <button class="p-1 rounded-md text-light-text/60 dark:text-offwhite/60 hover:text-light-text dark:hover:text-offwhite hover:bg-light-border dark:hover:bg-dark-border transition-colors" @click="prev">
              <ChevronLeft class="w-5 h-5" />
            </button>
            <span class="text-sm font-medium text-light-text dark:text-offwhite min-w-[120px] text-center">
              {{ currentPeriodLabel }}
            </span>
            <button class="p-1 rounded-md text-light-text/60 dark:text-offwhite/60 hover:text-light-text dark:hover:text-offwhite hover:bg-light-border dark:hover:bg-dark-border transition-colors" @click="next">
              <ChevronRight class="w-5 h-5" />
            </button>
          </div>
          
          <!-- View Toggle -->
          <div class="flex bg-light-surface dark:bg-dark-surface rounded-md border border-light-border dark:border-dark-border p-1">
            <button 
              v-for="v in ['Dia', 'Semana', 'Mês']" 
              :key="v"
              class="px-3 py-1 text-sm font-medium rounded-md transition-colors"
              :class="view === v ? 'bg-light-border dark:bg-dark-border text-light-text dark:text-offwhite' : 'text-light-text/50 dark:text-offwhite/50 hover:text-light-text dark:hover:text-offwhite'"
              @click="view = v"
            >
              {{ v }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Área da Agenda -->
    <div class="flex-1 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-sm overflow-hidden flex flex-col">
      
      <!-- Cabeçalho dos Dias (Semana) -->
      <div v-if="view === 'Semana'" class="grid grid-cols-[60px_repeat(7,1fr)] border-b border-light-border dark:border-dark-border">
        <div class="border-r border-light-border dark:border-dark-border"/> <!-- Célula Vazia pros Horários -->
        <div 
          v-for="day in currentWeekDays" 
          :key="day.date" 
          class="flex flex-col items-center justify-center py-3 border-r last:border-r-0 border-light-border dark:border-dark-border text-center"
        >
          <span class="text-xs font-bold text-light-text/50 dark:text-offwhite/50 uppercase tracking-wider">{{ day.shortName }}</span>
          <span 
            class="text-lg font-bold mt-1 w-8 h-8 flex items-center justify-center rounded-full"
            :class="isToday(day.fullDate) ? 'bg-primary text-white' : 'text-light-text dark:text-offwhite'"
          >
            {{ day.date }}
          </span>
        </div>
      </div>

      <!-- Corpo da Agenda (Semana) -->
      <div v-if="view === 'Semana'" class="flex-1 overflow-y-auto relative">
        <div class="grid grid-cols-[60px_repeat(7,1fr)] relative min-w-[800px]">
          
          <!-- Linhas de Horário -->
          <div class="col-span-full grid grid-cols-[60px_1fr] relative mt-4">
            <div class="flex flex-col w-full absolute inset-0 pointer-events-none">
              <div v-for="hour in hours" :key="hour" class="h-20 border-b border-light-border/50 dark:border-dark-border/50 flex w-full relative">
                <span class="absolute -top-3 left-2 text-xs text-light-text/50 dark:text-offwhite/50 bg-light-surface dark:bg-dark-surface px-1">{{ hour }}</span>
              </div>
            </div>
            
            <!-- Colunas Verticais -->
            <div class="col-start-2 w-full h-[1120px] grid grid-cols-7 relative">
              <div v-for="i in 7" :key="i" class="border-r border-light-border/50 dark:border-dark-border/50 last:border-r-0 relative">
                
                <!-- Blocos de Agendamento -->
                <div 
                  v-for="apt in getAppointmentsForDayIndex(i - 1)" 
                  :key="apt.id"
                  class="absolute left-1 right-1 rounded-md p-2 text-xs border border-blue-500/30 cursor-pointer hover:brightness-110 transition-all flex flex-col gap-1 overflow-hidden"
                  :style="getStyleForAppointment(apt)"
                  :class="getBgColorClass(apt.status)"
                  @click="openAppointment(apt)"
                >
                  <div class="flex items-center justify-between font-bold text-blue-900 dark:text-blue-100">
                    <span class="flex items-center gap-1.5 truncate">
                      <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="getDotColorClass(apt.status)"/>
                      <span class="truncate">{{ apt.className }}</span>
                    </span>
                    <span class="text-[10px] bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded shrink-0">{{ apt.capacity === 1 ? 'Individual' : `${apt.students.length}/${apt.capacity}` }}</span>
                  </div>
                  <div class="text-blue-800/80 dark:text-blue-200/80 leading-tight">
                    Prof: {{ apt.teacherName }}
                  </div>
                  <div class="text-blue-800/60 dark:text-blue-200/60 mt-auto">
                    {{ apt.time }} - {{ apt.duration }}
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      <div v-else-if="view === 'Dia'" class="flex-1 overflow-y-auto p-4 sm:p-6">
        <p class="mb-1 text-lg font-bold capitalize">{{ currentDayLabel }}</p>
        <p class="mb-4 text-sm opacity-60">{{ dayAppointments.length }} aula(s)</p>
        <div class="grid gap-3">
          <button v-for="apt in dayAppointments" :key="apt.id" class="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-left hover:brightness-110" @click="openAppointment(apt)">
            <div class="flex justify-between gap-3"><div><p class="font-bold">{{ apt.time }} · {{ apt.className }}</p><p class="text-sm opacity-70">{{ apt.teacherName }} · {{ apt.roomName }}</p></div><span class="text-sm font-semibold text-primary">{{ apt.students.length }}/{{ apt.capacity }} alunos</span></div>
          </button>
          <p v-if="!dayAppointments.length" class="rounded-lg border border-dashed p-12 text-center opacity-50">Nenhuma aula programada para este dia.</p>
        </div>
      </div>
      <div v-else class="flex-1 overflow-auto p-4">
        <div class="grid min-w-[760px] grid-cols-7 border-l border-t border-light-border dark:border-dark-border">
          <div v-for="name in ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']" :key="name" class="border-b border-r p-2 text-center text-xs font-bold">{{ name }}</div>
          <div v-for="cell in monthCells" :key="cell.key" class="min-h-28 border-b border-r p-2" :class="cell.inMonth ? '' : 'opacity-40'">
            <span class="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm" :class="cell.isToday ? 'bg-primary text-white font-bold' : ''">{{ cell.day }}</span>
            <button v-for="apt in cell.appointments.slice(0,3)" :key="apt.id" class="mt-1 block w-full truncate rounded bg-blue-500/10 px-2 py-1 text-left text-xs" @click="openAppointment(apt)">{{ apt.time }} {{ apt.className }}</button>
            <p v-if="cell.appointments.length > 3" class="text-[11px] opacity-50">+{{ cell.appointments.length - 3 }} aula(s)</p>
          </div>
        </div>
      </div>

    </div>
    
    <AgendaDetailModal 
      :is-open="isModalOpen"
      :appointment="selectedAppointment"
      @close="isModalOpen = false"
      @update:status="handleStatusUpdate"
      @edit="openClassForm"
    />
    <ClassFormModal
      :is-open="isClassFormOpen"
      :class-data="editingClass"
      :modalities="catalogs?.modalities || []"
      :teachers="catalogs?.teachers || []"
      :rooms="catalogs?.rooms || []"
      :existing-classes="rawTurmas || []"
      :saving="isSavingClass"
      @close="closeClassForm"
      @save="saveClass"
      @deactivate="deactivateClass"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from '@lucide/vue'
import AgendaDetailModal from '~/components/modals/AgendaDetailModal.vue'
import ClassFormModal from '~/components/modals/ClassFormModal.vue'
import BaseButton from '~/components/BaseButton.vue'

const supabase = useSupabaseClient()

const view = ref('Semana')
const currentDate = ref(new Date())

const isModalOpen = ref(false)
const selectedAppointment = ref(null)
const isClassFormOpen = ref(false)
const editingClass = ref<any>(null)
const isSavingClass = ref(false)

const hours = [
  '08:00', '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
]

const { data: catalogs } = await useAsyncData('agenda_catalogos', async () => {
  const [modalities, teachers, rooms] = await Promise.all([
    supabase.from('modalidades').select('id, nome').eq('ativo', true).order('nome'),
    supabase.from('professores').select('id, nome').eq('ativo', true).order('nome'),
    supabase.from('salas').select('id, nome').eq('ativo', true).order('nome')
  ])
  if (modalities.error) throw modalities.error
  if (teachers.error) throw teachers.error
  if (rooms.error) throw rooms.error
  return { modalities: modalities.data || [], teachers: teachers.data || [], rooms: rooms.data || [] }
})

// Carregamento de Turmas Reais do Supabase
const { data: rawTurmas, refresh: refreshTurmas } = await useAsyncData('agenda_turmas', async () => {
  const { data, error } = await supabase
    .from('turmas')
    .select(`
      id,
      dia_semana,
      horario_inicio,
      horario_fim,
      capacidade_maxima,
      ativo,
      modalidades (id, nome, cor_calendario),
      professores (id, nome),
      salas (id, nome),
      matriculas_turma (
        id,
        aluno_id,
        data_fim,
        alunos (
          id,
          nome,
          telefone,
          contratos (foto_assinatura_url, status, criado_em),
          cobrancas (status, vencimento)
        )
      )
    `)
    .eq('ativo', true)

  if (error) {
    console.error('Erro ao buscar turmas na agenda:', error)
    return []
  }
  return data || []
})

const appointments = computed(() => {
  return (rawTurmas.value || []).map((t: any) => {
    const startH = t.horario_inicio ? t.horario_inicio.substring(0, 5) : '10:00'
    const endH = t.horario_fim ? t.horario_fim.substring(0, 5) : '11:00'
    
    // Duração em horas
    const [h1, m1] = startH.split(':').map(Number)
    const [h2, m2] = endH.split(':').map(Number)
    const durationHours = Math.max(0.5, ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60)

    // Ajuste dia_semana do Postgres (0 = Dom, 1 = Seg, ..., 6 = Sáb)
    // para o índice da grade (0 = Seg, 1 = Ter, ..., 5 = Sáb, 6 = Dom)
    const dateOffset = t.dia_semana === 0 ? 6 : t.dia_semana - 1

    const today = new Date().toISOString().slice(0, 10)
    const matriculados = (t.matriculas_turma || []).filter((m: any) => !m.data_fim).map((m: any) => {
      const contracts = [...(m.alunos?.contratos || [])].sort((a: any, b: any) => String(b.criado_em).localeCompare(String(a.criado_em)))
      const pendingPayments = (m.alunos?.cobrancas || []).filter((c: any) =>
        c.status === 'atrasada' || (c.status === 'pendente' && c.vencimento < today)
      ).length
      return {
        id: m.alunos?.id || m.id,
        name: m.alunos?.nome || 'Aluno',
        photo: contracts.find((c: any) => c.foto_assinatura_url)?.foto_assinatura_url || '',
        financialStatus: pendingPayments > 0 ? 'pendente' : 'em_dia',
        pendingPayments,
        status: 'agendado'
      }
    })

    return {
      id: t.id,
      raw: t,
      className: t.modalidades?.nome || 'Aula',
      teacherName: t.professores?.nome || 'Professor',
      roomName: t.salas?.nome || 'Sala',
      capacity: t.capacidade_maxima || 5,
      dateOffset,
      time: startH,
      duration: `${durationHours}h`,
      durationHours,
      status: 'agendado',
      students: matriculados
    }
  })
})

const appointmentsTodayCount = computed(() => {
  // Simplificação: no mock real, filtraríamos por 'today'
  const today = new Date().getDay()
  const gridIndex = today === 0 ? 6 : today - 1
  return appointments.value.filter(a => a.dateOffset === gridIndex).length
})

const gridIndexForDate = (date: Date) => date.getDay() === 0 ? 6 : date.getDay() - 1
const dayAppointments = computed(() => appointments.value.filter(a => a.dateOffset === gridIndexForDate(currentDate.value)).sort((a, b) => a.time.localeCompare(b.time)))
const currentDayLabel = computed(() => currentDate.value.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }))
const monthCells = computed(() => {
  const year = currentDate.value.getFullYear(), month = currentDate.value.getMonth()
  const first = new Date(year, month, 1), start = new Date(first)
  start.setDate(first.getDate() - gridIndexForDate(first))
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start); date.setDate(start.getDate() + index)
    return { key: date.toISOString().slice(0, 10), day: date.getDate(), inMonth: date.getMonth() === month, isToday: isToday(date), appointments: appointments.value.filter(a => a.dateOffset === gridIndexForDate(date)) }
  })
})

const getStartOfWeek = (d: Date) => {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // ajusta pra começar na segunda-feira
  return new Date(date.setDate(diff))
}

const currentWeekStart = computed(() => getStartOfWeek(currentDate.value))

const currentWeekDays = computed(() => {
  const days = []
  const shortNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  const start = new Date(currentWeekStart.value)
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push({
      shortName: shortNames[i],
      date: d.getDate(),
      fullDate: d
    })
  }
  return days
})

const currentPeriodLabel = computed(() => {
  if (view.value === 'Dia') return currentDate.value.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  if (view.value === 'Mês') return currentDate.value.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const start = currentWeekDays.value[0]?.fullDate ?? new Date()
  const end = currentWeekDays.value[6]?.fullDate ?? start
  
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} – ${end.getDate()} ${monthNames[start.getMonth()]} ${start.getFullYear()}`
  } else {
    return `${start.getDate()} ${monthNames[start.getMonth()]} – ${end.getDate()} ${monthNames[end.getMonth()]} ${end.getFullYear()}`
  }
})

const isToday = (date: Date) => {
  const today = new Date()
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
}

const prev = () => {
  const d = new Date(currentDate.value)
  if (view.value === 'Semana') d.setDate(d.getDate() - 7)
  else if (view.value === 'Mês') d.setMonth(d.getMonth() - 1)
  else d.setDate(d.getDate() - 1)
  currentDate.value = d
}

const next = () => {
  const d = new Date(currentDate.value)
  if (view.value === 'Semana') d.setDate(d.getDate() + 7)
  else if (view.value === 'Mês') d.setMonth(d.getMonth() + 1)
  else d.setDate(d.getDate() + 1)
  currentDate.value = d
}

const goToToday = () => {
  currentDate.value = new Date()
}

// Helpers para Grade
const getAppointmentsForDayIndex = (index: number) => {
  // No mundo real, faríamos um parse da data do agendamento para ver se cai neste dia.
  // Como estamos com mock, vamos usar o dateOffset (0 = seg, 6 = dom).
  return appointments.value.filter(a => a.dateOffset === index)
}

const getStyleForAppointment = (apt: any) => {
  const [h, m] = apt.time.split(':').map(Number)
  const startHour = 8 // nosso calendário começa às 08:00
  const rowHeight = 80 // 5rem = 80px (h-20 do tailwind)
  
  const offsetHours = h - startHour + (m / 60)
  const top = offsetHours * rowHeight
  
  const height = apt.durationHours * rowHeight
  
  return {
    top: `${top}px`,
    height: `${height}px`
  }
}

const getBgColorClass = (status: string) => {
  // Fundo super clarinho e azulado (estilo Google Calendar / Print)
  switch (status) {
    case 'concluido': return 'bg-green-500/10 dark:bg-green-500/20 border-green-500/30'
    case 'cancelado': return 'bg-red-500/10 dark:bg-red-500/20 border-red-500/30'
    case 'faltou': return 'bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/30'
    case 'agendado': 
    default: return 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30'
  }
}

const getDotColorClass = (status: string) => {
  switch (status) {
    case 'concluido': return 'bg-green-500'
    case 'cancelado': return 'bg-red-500'
    case 'faltou': return 'bg-orange-500'
    case 'agendado': 
    default: return 'bg-blue-500'
  }
}

const openAppointment = (apt: any) => {
  selectedAppointment.value = apt
  isModalOpen.value = true
}

const openClassForm = (appointment?: any) => {
  editingClass.value = appointment?.raw || null
  isModalOpen.value = false
  isClassFormOpen.value = true
}

const closeClassForm = () => {
  isClassFormOpen.value = false
  editingClass.value = null
}

const saveClass = async (payload: any) => {
  isSavingClass.value = true
  try {
    const { error } = await (supabase as any).rpc('salvar_turma', {
      p_id: editingClass.value?.id || null,
      p_modalidade_id: payload.modalidade_id,
      p_professor_id: payload.professor_id,
      p_sala_id: payload.sala_id,
      p_dia_semana: payload.dia_semana,
      p_horario_inicio: payload.horario_inicio,
      p_horario_fim: payload.horario_fim,
      p_capacidade_maxima: payload.capacidade_maxima
    })
    if (error) throw error
    await refreshTurmas()
    closeClassForm()
  } catch (error: any) {
    alert(`Não foi possível salvar a turma. ${error.message || 'Tente novamente.'}`)
  } finally {
    isSavingClass.value = false
  }
}

const deactivateClass = async (classData: any) => {
  if (!classData?.id || !confirm('Desativar esta turma? Os históricos e matrículas serão preservados.')) return
  isSavingClass.value = true
  const { error } = await (supabase as any).rpc('inativar_turma', { p_turma_id: classData.id })
  isSavingClass.value = false
  if (error) {
    alert(`Não foi possível desativar a turma. ${error.message}`)
    return
  }
  await refreshTurmas()
  closeClassForm()
}

const handleStatusUpdate = ({ id, studentId, status }: { id: string | number, studentId: string | number, status: string }) => {
  const index = appointments.value.findIndex(a => a.id === id)
  if (index !== -1) {
    const student = appointments.value[index]?.students.find((s: any) => s.id === studentId)
    if (student) {
      student.status = status
    }
  }
}
</script>
