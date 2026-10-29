<template>
  <div class="flex w-full flex-col gap-5 p-4 text-light-text dark:text-offwhite sm:p-8">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-bold"><CalendarDays class="h-6 w-6 text-primary" /> Minha agenda</h1>
        <p class="mt-1 text-sm opacity-70">Acompanhe os horários de todas as suas modalidades.</p>
      </div>
      <BaseButton variant="outline" :disabled="pending" @click="refresh()">Atualizar agenda</BaseButton>
    </header>

    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <BaseButton variant="outline" @click="currentDate = new Date()">Hoje</BaseButton>
        <button aria-label="Período anterior" class="rounded p-2 hover:bg-light-border dark:hover:bg-dark-border" @click="move(-1)"><ChevronLeft class="h-5 w-5" /></button>
        <h2 class="min-w-36 text-center text-sm font-semibold capitalize" aria-live="polite">{{ periodLabel }}</h2>
        <button aria-label="Próximo período" class="rounded p-2 hover:bg-light-border dark:hover:bg-dark-border" @click="move(1)"><ChevronRight class="h-5 w-5" /></button>
      </div>
      <div class="flex gap-1 rounded-lg border border-light-border bg-light-surface p-1 dark:border-dark-border dark:bg-dark-surface" role="group" aria-label="Visualização da agenda">
        <button v-for="option in views" :key="option" :aria-pressed="view === option" class="rounded-md px-4 py-2 text-sm font-medium" :class="view === option ? 'bg-primary text-white' : 'hover:bg-light-border dark:hover:bg-dark-border'" @click="view = option">{{ option }}</button>
      </div>
    </div>

    <div v-if="pending" class="flex items-center justify-center gap-2 py-16" role="status"><Loader2 class="h-6 w-6 animate-spin" /> Carregando sua agenda...</div>
    <div v-else-if="error" class="rounded-lg border border-red-500/40 p-6 text-red-700 dark:text-red-300" role="alert">Não foi possível carregar sua agenda. Use Atualizar agenda para tentar novamente.</div>
    <div v-else-if="!classes.length" class="rounded-xl border border-dashed border-light-border p-12 text-center dark:border-dark-border">Você ainda não tem turmas ativas. Solicite à gestão o vínculo com suas turmas.</div>
    <template v-else>
      <p class="text-sm opacity-70">{{ todayCount }} aula(s) previstas para hoje · Horários semanais das turmas ativas. Feriados e alterações pontuais devem ser confirmados com a gestão.</p>
      <div class="overflow-x-auto rounded-xl border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface">
        <div :class="view === 'Dia' ? '' : 'grid min-w-[840px] grid-cols-7'">
          <div v-if="view === 'Mês'" class="col-span-7 grid grid-cols-7 border-b border-light-border dark:border-dark-border">
            <span v-for="name in weekNames" :key="name" class="p-3 text-center text-xs font-bold">{{ name }}</span>
          </div>
          <section v-for="day in days" :key="calendarDateKey(day)" class="min-h-40 border-b border-light-border p-2 dark:border-dark-border sm:p-3" :class="[view !== 'Dia' ? 'border-r last:border-r-0' : 'p-5', view === 'Mês' && day.getMonth() !== currentDate.getMonth() ? 'bg-light-bg dark:bg-dark-bg' : '']" :aria-label="fullDate(day)">
            <button class="mb-3 flex items-center gap-2 rounded-full px-2 py-1 text-sm font-semibold" :class="calendarDateKey(day) === today ? 'bg-primary text-white' : 'hover:bg-light-border dark:hover:bg-dark-border'" :aria-label="`Ver dia ${fullDate(day)}`" @click="showDay(day)">
              <span v-if="view !== 'Mês'">{{ day.toLocaleDateString('pt-BR', { weekday: 'short' }) }}</span>{{ day.getDate() }}<span v-if="view === 'Dia'">{{ day.toLocaleDateString('pt-BR', { month: 'long' }) }}</span>
            </button>
            <div class="flex flex-col gap-2">
              <button v-for="item in classesFor(day)" :key="item.turma_id!" class="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-left text-blue-950 transition-colors hover:bg-blue-500/20 dark:text-blue-100" :aria-label="`${item.modalidade}, ${time(item.horario_inicio)} às ${time(item.horario_fim)}, ${item.sala}. Ver aula`" @click="openClass(item, day)">
                <p class="text-xs font-bold">{{ time(item.horario_inicio) }}–{{ time(item.horario_fim) }}</p>
                <p class="mt-1 break-words text-sm font-bold">{{ item.modalidade }}</p>
                <p class="mt-1 text-xs">{{ item.sala || 'Sala não definida' }}</p>
                <p class="mt-1 text-xs opacity-75">{{ item.alunos_matriculados || 0 }}/{{ item.capacidade_maxima }} alunos</p>
              </button>
              <p v-if="!classesFor(day).length" class="py-4 text-xs opacity-60">Sem aulas previstas.</p>
            </div>
          </section>
        </div>
      </div>
    </template>

    <BaseModal :is-open="!!selected" title="Detalhes da aula" @close="selected = null">
      <div v-if="selected" class="flex flex-col gap-4 text-light-text dark:text-offwhite">
        <h3 class="text-lg font-bold">{{ selected.item.modalidade }}</h3>
        <dl class="space-y-2 text-sm">
          <div><dt class="font-semibold">Data prevista</dt><dd class="capitalize">{{ fullDate(selected.day) }}</dd></div>
          <div><dt class="font-semibold">Horário</dt><dd>{{ time(selected.item.horario_inicio) }}–{{ time(selected.item.horario_fim) }}</dd></div>
          <div><dt class="font-semibold">Sala</dt><dd>{{ selected.item.sala || 'Não definida' }}</dd></div>
          <div><dt class="font-semibold">Matrículas ativas atualmente</dt><dd>{{ selected.item.alunos_matriculados || 0 }} aluno(s)</dd></div>
        </dl>
        <NuxtLink :to="{ path: '/professor/chamada', query: { turma: selected.item.turma_id, data: calendarDateKey(selected.day) } }" class="rounded-lg bg-primary px-4 py-3 text-center font-semibold text-white">Abrir chamada desta aula</NuxtLink>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from '@lucide/vue'
import { calendarDateKey, calendarDays, shiftCalendarDate, type CalendarView } from '~/utils/teacherCalendar'
import type { Database } from '~/types/database.types'

type TeacherClass = Database['public']['Views']['vw_professor_agenda']['Row']
const supabase = useSupabaseClient()
const view = ref<CalendarView>('Semana')
const views: CalendarView[] = ['Dia', 'Semana', 'Mês']
const currentDate = ref(new Date())
const today = calendarDateKey(new Date())
const weekNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const selected = ref<{ item: TeacherClass; day: Date } | null>(null)
const { data, pending, error, refresh } = await useAsyncData('professor_calendar', async () => {
  const result = await supabase.from('vw_professor_agenda').select('*').order('dia_semana').order('horario_inicio')
  if (result.error) throw result.error
  return result.data
})
const classes = computed(() => (data.value || []).filter(item => item.turma_id && item.dia_semana !== null))
const days = computed(() => calendarDays(currentDate.value, view.value))
const classesFor = (day: Date) => classes.value.filter(item => item.dia_semana === day.getDay())
const todayCount = computed(() => classesFor(new Date()).length)
const time = (value: string | null) => value?.slice(0, 5) || '—'
const fullDate = (day: Date) => day.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const periodLabel = computed(() => {
  if (view.value === 'Mês') return currentDate.value.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  if (view.value === 'Dia') return fullDate(currentDate.value)
  const format = (day: Date) => day.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  return `${format(days.value[0]!)} – ${format(days.value[6]!)}`
})
const move = (direction: number) => { currentDate.value = shiftCalendarDate(currentDate.value, view.value, direction) }
const showDay = (day: Date) => { currentDate.value = new Date(day); view.value = 'Dia' }
const openClass = (item: TeacherClass, day: Date) => { selected.value = { item, day } }
</script>
