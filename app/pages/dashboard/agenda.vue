<template>
  <div class="p-4 sm:p-8 w-full flex flex-col gap-6 min-h-[calc(100vh-theme(spacing.16))]">
    <!-- Cabeçalho e Controles -->
    <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-light-text dark:text-offwhite flex items-center gap-2">
          <CalendarIcon class="w-6 h-6 text-primary" />
          Agenda
        </h1>
        <p class="text-sm text-light-text/70 dark:text-offwhite/70">
          <template v-if="hojeTemAula">
            <span class="font-semibold text-green-600 dark:text-green-400">{{ appointmentsTodayCount }} aula(s) hoje</span>
            <span class="opacity-60"> · {{ totalAlunosHoje }} aluno(s) esperado(s)</span>
          </template>
          <template v-else>
            <span class="opacity-60">Nenhuma aula hoje</span>
            <span v-if="proximaAulaTexto" class="opacity-60"> · próxima {{ proximaAulaTexto }}</span>
          </template>
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-4">
        <!-- Legenda -->
        <div class="flex items-center gap-4 text-xs font-medium text-light-text dark:text-offwhite">
          <div class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-blue-500"/> Agendado</div>
          <div class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-green-500"/> Concluído</div>
          <div class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-red-500"/> Cancelado</div>
          <div class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-orange-500"/> Faltou</div>
        </div>

        <!-- Navegação -->
        <div class="flex items-center gap-1.5">
          <button
            class="px-3 py-1.5 rounded-md text-sm font-semibold border border-light-border dark:border-dark-border text-primary hover:bg-primary/10 transition-colors"
            @click="goToToday"
          >
            Hoje
          </button>
          <button class="p-1.5 rounded-md text-light-text/60 dark:text-offwhite/60 hover:text-light-text dark:hover:text-offwhite hover:bg-light-border dark:hover:bg-dark-border transition-colors" aria-label="Período anterior" @click="prev">
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span class="text-sm font-semibold text-light-text dark:text-offwhite min-w-[150px] text-center capitalize">
            {{ currentPeriodLabel }}
          </span>
          <button class="p-1.5 rounded-md text-light-text/60 dark:text-offwhite/60 hover:text-light-text dark:hover:text-offwhite hover:bg-light-border dark:hover:bg-dark-border transition-colors" aria-label="Próximo período" @click="next">
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

        <!-- View Toggle -->
        <div class="flex bg-light-surface dark:bg-dark-surface rounded-md border border-light-border dark:border-dark-border p-1">
          <button
            v-for="v in ['Dia', 'Semana', 'Mês']"
            :key="v"
            class="px-3 py-1 text-sm font-medium rounded-md transition-colors"
            :class="view === v ? 'bg-primary text-white shadow-sm' : 'text-light-text/50 dark:text-offwhite/50 hover:text-light-text dark:hover:text-offwhite'"
            @click="view = v"
          >
            {{ v }}
          </button>
        </div>
      </div>
    </div>

    <!-- Área da Agenda -->
    <div v-if="turmasError" class="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-6 text-center text-sm text-red-700 dark:text-red-300">
      Não foi possível carregar a agenda completa. Atualize a página e tente novamente.
    </div>

    <div v-if="!turmasError" class="flex-1 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-sm overflow-hidden flex flex-col">
      
      <!-- Cabeçalho dos Dias (Semana) -->
      <div v-if="view === 'Semana'" class="grid grid-cols-[64px_repeat(7,1fr)] border-b border-light-border dark:border-dark-border bg-light-bg/50 dark:bg-dark-bg/40">
        <div class="border-r border-light-border dark:border-dark-border"/>
        <div
          v-for="day in currentWeekDays"
          :key="day.date"
          class="flex flex-col items-center justify-center gap-1 py-2.5 border-r last:border-r-0 border-light-border dark:border-dark-border text-center"
          :class="isToday(day.fullDate) ? 'bg-primary/5' : ''"
        >
          <span class="text-[11px] font-bold uppercase tracking-wider" :class="isToday(day.fullDate) ? 'text-primary' : 'text-light-text/50 dark:text-offwhite/50'">{{ day.shortName }}</span>
          <span
            class="text-base font-bold w-8 h-8 flex items-center justify-center rounded-full"
            :class="isToday(day.fullDate) ? 'bg-primary text-white' : 'text-light-text dark:text-offwhite'"
          >
            {{ day.date }}
          </span>
          <span v-if="aulasNoDia(day.fullDate)" class="text-[10px] font-semibold text-light-text/45 dark:text-offwhite/45">
            {{ aulasNoDia(day.fullDate) }} aula(s)
          </span>
        </div>
      </div>

      <!-- Corpo da Agenda (Semana) -->
      <div v-if="view === 'Semana'" class="flex-1 overflow-auto">
        <div class="grid grid-cols-[64px_repeat(7,1fr)] min-w-[860px]">

          <!-- Coluna de horários -->
          <div class="border-r border-light-border dark:border-dark-border">
            <div v-for="hour in hours" :key="hour" class="h-16 relative">
              <span class="absolute -top-2 right-2 text-[11px] font-medium tabular-nums text-light-text/40 dark:text-offwhite/40">{{ hour }}</span>
            </div>
          </div>

          <!-- Colunas dos dias -->
          <div
            v-for="(day, dayIndex) in currentWeekDays"
            :key="day.date"
            class="relative border-r last:border-r-0 border-light-border dark:border-dark-border"
            :class="isToday(day.fullDate) ? 'bg-primary/[0.03]' : ''"
          >
            <!-- Linhas de hora -->
            <div class="absolute inset-0 pointer-events-none">
              <div v-for="hour in hours" :key="hour" class="h-16 border-b border-light-border/40 dark:border-dark-border/40"/>
            </div>

            <!-- Blocos de aula -->
            <div
              v-for="apt in getAppointmentsForDayIndex(dayIndex)"
              :key="apt.id"
              class="group absolute z-10 rounded-lg border-l-[3px] px-2 py-1.5 text-left cursor-pointer transition-all duration-150 overflow-hidden shadow-sm hover:z-30 hover:shadow-md hover:brightness-105 focus-visible:z-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              :style="getStyleForAppointment(apt, dayIndex)"
              :class="getBgColorClass(apt.status)"
              :title="`${apt.time}–${apt.endTime} · ${apt.className} · ${apt.teacherName} · ${apt.roomName}`"
              tabindex="0"
              @click="openAppointment(apt)"
              @keydown.enter="openAppointment(apt)"
              @keydown.space.prevent="openAppointment(apt)"
            >
              <p class="truncate text-[13px] font-bold leading-tight">{{ apt.className }}</p>
              <p class="truncate text-[11px] leading-tight opacity-75">{{ apt.teacherName }}</p>
              <p class="truncate text-[11px] font-semibold leading-tight opacity-90 tabular-nums">
                {{ apt.time }}–{{ apt.endTime }}
              </p>
              <p v-if="apt.semHorarioDefinido" class="truncate text-[10px] leading-tight opacity-60">
                horário amplo · {{ apt.roomName }}
              </p>
              <p v-else class="truncate text-[10px] leading-tight opacity-60">{{ apt.roomName }}</p>
              <span class="mt-1 inline-flex items-center gap-1 rounded bg-black/10 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-bold">
                <Users class="w-3 h-3" />
                {{ apt.students.length }}/{{ apt.capacity }}
              </span>
            </div>

            <!-- Estado vazio do dia -->
            <div
              v-if="!getAppointmentsForDayIndex(dayIndex).length"
              class="absolute inset-x-2 top-1/2 -translate-y-1/2 text-center"
            >
              <p class="text-[11px] font-medium text-light-text/25 dark:text-offwhite/25">Sem aulas</p>
            </div>
          </div>

        </div>
      </div>

      <div v-else-if="view === 'Dia'" class="flex-1 overflow-y-auto p-4 sm:p-6">
        <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <p class="text-lg font-bold capitalize">{{ currentDayLabel }}</p>
          <p class="text-sm text-light-text/60 dark:text-offwhite/60">
            {{ dayAppointments.length }} aula(s) · {{ dayAlunosTotal }} aluno(s)
          </p>
        </div>
        <div class="grid gap-3">
          <button
            v-for="apt in dayAppointments"
            :key="apt.id"
            class="flex items-center gap-4 rounded-lg border-l-4 p-4 text-left transition-all hover:shadow-md hover:brightness-105"
            :class="getBgColorClass(apt.status)"
            @click="openAppointment(apt)"
          >
            <div class="w-20 shrink-0 text-center">
              <p class="text-sm font-bold tabular-nums">{{ apt.time }}</p>
              <p class="text-[11px] opacity-60 tabular-nums">{{ apt.endTime }}</p>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate font-bold">{{ apt.className }}</p>
              <p class="truncate text-sm opacity-75">{{ apt.teacherName }} · {{ apt.roomName }}</p>
              <p v-if="apt.semHorarioDefinido" class="text-[11px] opacity-60">Horário amplo (turma sem faixa definida)</p>
            </div>
            <span class="shrink-0 rounded-full bg-black/10 dark:bg-white/10 px-3 py-1 text-xs font-bold">
              {{ apt.students.length }}/{{ apt.capacity }} alunos
            </span>
          </button>
          <div v-if="!dayAppointments.length" class="rounded-lg border border-dashed border-light-border dark:border-dark-border p-12 text-center">
            <p class="text-sm font-medium text-light-text/50 dark:text-offwhite/50">Nenhuma aula programada para este dia.</p>
          </div>
        </div>
      </div>
      <div v-else class="flex-1 overflow-auto p-4">
        <div class="grid min-w-[760px] grid-cols-7 border-l border-t border-light-border dark:border-dark-border">
          <div v-for="name in ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']" :key="name" class="border-b border-r border-light-border dark:border-dark-border bg-light-bg/50 dark:bg-dark-bg/40 p-2 text-center text-[11px] font-bold uppercase tracking-wider text-light-text/60 dark:text-offwhite/60">{{ name }}</div>
          <div
            v-for="cell in monthCells"
            :key="cell.key"
            class="min-h-28 border-b border-r border-light-border dark:border-dark-border p-2"
            :class="[cell.inMonth ? '' : 'opacity-40', cell.isToday ? 'bg-primary/5' : '']"
          >
            <span class="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm" :class="cell.isToday ? 'bg-primary text-white font-bold' : 'font-medium'">{{ cell.day }}</span>
            <button
              v-for="apt in cell.appointments.slice(0,3)"
              :key="apt.id"
              class="mt-1 block w-full truncate rounded border-l-2 px-2 py-1 text-left text-[11px] font-medium transition-colors hover:brightness-110"
              :class="getBgColorClass(apt.status)"
              @click="openAppointment(apt)"
            >
              {{ apt.time }} {{ apt.className }}
            </button>
            <p v-if="cell.appointments.length > 3" class="mt-1 text-[11px] font-medium opacity-50">+{{ cell.appointments.length - 3 }} aula(s)</p>
          </div>
        </div>
      </div>

    </div>
    
    <AgendaDetailModal 
      :is-open="isModalOpen"
      :appointment="selectedAppointment"
      @close="isModalOpen = false"
      @update:status="handleStatusUpdate"
      @edit="openClassManager"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users } from '@lucide/vue'
import AgendaDetailModal from '~/components/modals/AgendaDetailModal.vue'
import {
  dataDaAulaNaSemana,
  ehHorarioAmplo,
  formatarDuracao,
  minutesFromTime,
  toCivilDate,
  turmaVisivelNaData
} from '~/utils/agendaSchedule'

const supabase = useSupabaseClient()

const view = ref('Semana')
const currentDate = ref(new Date())

const isModalOpen = ref(false)
const selectedAppointment = ref(null)

const hours = [
  '08:00', '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
]

// Carregamento de Turmas Reais do Supabase
const { data: rawTurmas, error: turmasError } = await useAsyncData('agenda_turmas', async () => {
  const { data, error } = await supabase
    .from('turmas')
    .select(`
      id,
      modalidade_id,
      professor_id,
      sala_id,
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

  if (error) throw error
  return data || []
})

// Fotos privadas: converte caminhos do bucket em URLs assinadas uma vez por carga.
const signedPhotos = ref<Record<string, string>>({})
watch(rawTurmas, (turmas) => {
  const pendentes: Array<{ alunoId: string, path: string }> = []
  for (const t of turmas || []) {
    for (const m of t.matriculas_turma || []) {
      if (m.data_fim || !m.alunos?.contratos?.length) continue
      const alunoId = m.alunos?.id || m.id
      const contracts = [...m.alunos.contratos].sort((a: any, b: any) => String(b.criado_em).localeCompare(String(a.criado_em)))
      const photoPath = contracts.find((c: any) => c.foto_assinatura_url)?.foto_assinatura_url
      if (photoPath && !signedPhotos.value[alunoId]) pendentes.push({ alunoId, path: photoPath })
    }
  }
  for (const { alunoId, path } of pendentes) {
    supabase.storage.from('fotos_alunos').createSignedUrl(path, 300).then(({ data }) => {
      if (data?.signedUrl) signedPhotos.value[alunoId] = data.signedUrl
    }).catch(() => { /* foto ausente ou caminho inválido: mantém avatar vazio */ })
  }
}, { immediate: true })

const appointments = computed(() => {
  const todayCivil = toCivilDate(new Date())

  return (rawTurmas.value || []).map((t: any) => {
    const startH = t.horario_inicio ? t.horario_inicio.substring(0, 5) : '10:00'
    const endH = t.horario_fim ? t.horario_fim.substring(0, 5) : '11:00'

    const durationMinutes = Math.max(30, minutesFromTime(endH) - minutesFromTime(startH))
    const durationHours = durationMinutes / 60

    // dia_semana do Postgres (0 = Dom … 6 = Sáb) → índice da grade (0 = Seg … 6 = Dom)
    const dateOffset = t.dia_semana === 0 ? 6 : t.dia_semana - 1
    const dataDaAula = dataDaAulaNaSemana(currentWeekStart.value, t.dia_semana)

    // A turma só aparece a partir da matrícula mais antiga vigente: impede o
    // aluno cadastrado numa quinta de surgir na aula de quarta da semana
    // anterior. Regra testada em tests/agendaSchedule.test.ts.
    const vinculosAtivos = (t.matriculas_turma || []).filter((m: any) => !m.data_fim)
    const visivel = turmaVisivelNaData(dataDaAula, t.matriculas_turma || [], todayCivil)

    const matriculados = vinculosAtivos.map((m: any) => {
      const contracts = [...(m.alunos?.contratos || [])].sort((a: any, b: any) => String(b.criado_em).localeCompare(String(a.criado_em)))
      const pendingPayments = (m.alunos?.cobrancas || []).filter((c: any) =>
        c.status === 'atrasada' || (c.status === 'pendente' && c.vencimento < todayCivil)
      ).length
      const photoPath = contracts.find((c: any) => c.foto_assinatura_url)?.foto_assinatura_url || ''
      return {
        id: m.alunos?.id || m.id,
        name: m.alunos?.nome || 'Aluno',
        photoPath,
        photo: signedPhotos.value[m.alunos?.id || m.id] || '',
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
      dataDaAula,
      visivel,
      // Faixa de 10h (08:00–18:00) desenha compacta em vez de ocupar a tela.
      semHorarioDefinido: ehHorarioAmplo(startH, endH),
      time: startH,
      endTime: endH,
      duration: formatarDuracao(startH, endH),
      durationHours,
      durationMinutes,
      status: 'agendado',
      students: matriculados
    }
  })
})

const appointmentsTodayCount = computed(() => {
  const hoje = toCivilDate(new Date())
  return appointments.value.filter(a => a.visivel && a.dataDaAula === hoje).length
})

const hojeTemAula = computed(() => appointmentsTodayCount.value > 0)

const totalAlunosHoje = computed(() => {
  const hoje = toCivilDate(new Date())
  return appointments.value
    .filter(a => a.visivel && a.dataDaAula === hoje)
    .reduce((soma, a) => soma + a.students.length, 0)
})

// Próxima aula a partir de hoje (para o cabeçalho quando não há aula hoje).
const proximaAulaTexto = computed(() => {
  const hoje = toCivilDate(new Date())
  const futuras = appointments.value
    .filter(a => a.visivel && a.dataDaAula > hoje)
    .sort((a, b) => a.dataDaAula.localeCompare(b.dataDaAula) || a.time.localeCompare(b.time))
  const proxima = futuras[0]
  if (!proxima) return ''
  const [ano, mes, dia] = proxima.dataDaAula.split('-').map(Number)
  const data = new Date(ano, mes - 1, dia)
  const rotulo = data.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })
  return `${rotulo} às ${proxima.time}`
})

const gridIndexForDate = (date: Date) => date.getDay() === 0 ? 6 : date.getDay() - 1
const dayAlunosTotal = computed(() => dayAppointments.value.reduce((s, a) => s + a.students.length, 0))
const dayAppointments = computed(() => {
  const civil = toCivilDate(currentDate.value)
  return appointments.value
    .filter(a => a.visivel && a.dataDaAula === civil)
    .sort((a, b) => a.time.localeCompare(b.time))
})
const currentDayLabel = computed(() => currentDate.value.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }))
const monthCells = computed(() => {
  const year = currentDate.value.getFullYear(), month = currentDate.value.getMonth()
  const first = new Date(year, month, 1), start = new Date(first)
  start.setDate(first.getDate() - gridIndexForDate(first))
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start); date.setDate(start.getDate() + index)
    const civil = toCivilDate(date)
    return {
      key: civil,
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      isToday: isToday(date),
      appointments: appointments.value.filter(a => a.visivel && a.dataDaAula === civil)
    }
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
  return appointments.value.filter(a => a.visivel && a.dateOffset === index)
}

const aulasNoDia = (date: Date) => {
  const civil = toCivilDate(date)
  return appointments.value.filter(a => a.visivel && a.dataDaAula === civil).length
}

const ROW_HEIGHT = 64 // h-16 do Tailwind: 1 hora = 64px
const START_HOUR = 8

const getStyleForAppointment = (apt: any, dayIndex: number) => {
  const start = minutesFromTime(apt.time)
  const end = minutesFromTime(apt.endTime)

  // Turma com horário amplo (ex.: 08:00–18:00) não representa uma aula de 10h:
  // desenha um bloco compacto no início da faixa, com o rótulo "horário amplo".
  const alturaMinutos = apt.semHorarioDefinido ? 60 : apt.durationMinutes
  const top = ((start - START_HOUR * 60) / 60) * ROW_HEIGHT
  const height = (alturaMinutos / 60) * ROW_HEIGHT

  // Aulas que disputam o mesmo intervalo dividem a largura da coluna.
  const simultaneous = getAppointmentsForDayIndex(dayIndex)
    .filter(item => minutesFromTime(item.time) < end && minutesFromTime(item.endTime) > start)
    .sort((a, b) => a.time.localeCompare(b.time) || String(a.id).localeCompare(String(b.id)))
  const column = Math.max(0, simultaneous.findIndex(item => item.id === apt.id))
  const columns = Math.max(1, simultaneous.length)
  const gap = 2

  return {
    top: `${Math.max(0, top)}px`,
    height: `${Math.max(height, 46)}px`,
    left: `calc(${(column / columns) * 100}% + ${gap}px)`,
    width: `calc(${100 / columns}% - ${gap * 2}px)`
  }
}

const getBgColorClass = (status: string) => {
  switch (status) {
    case 'concluido': return 'bg-green-500/15 dark:bg-green-500/20 border-green-500 text-green-900 dark:text-green-100'
    case 'cancelado': return 'bg-red-500/15 dark:bg-red-500/20 border-red-500 text-red-900 dark:text-red-100'
    case 'faltou': return 'bg-orange-500/15 dark:bg-orange-500/20 border-orange-500 text-orange-900 dark:text-orange-100'
    case 'agendado':
    default: return 'bg-blue-500/15 dark:bg-blue-500/20 border-blue-500 text-blue-900 dark:text-blue-100'
  }
}

const openAppointment = (apt: any) => {
  selectedAppointment.value = apt
  isModalOpen.value = true
}

const openClassManager = (appointment: any) => {
  navigateTo({ path: '/dashboard/turmas', query: { editar: String(appointment.id) } })
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
