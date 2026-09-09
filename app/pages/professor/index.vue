<template>
  <div class="w-full p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
    <header class="flex flex-col gap-1">
      <h1 class="text-2xl font-bold text-light-text dark:text-offwhite">Painel do Professor</h1>
      <p class="text-sm text-light-text/60 dark:text-offwhite/60 capitalize">{{ currentDateFormatted }}</p>
    </header>

    <div v-if="pending" class="flex justify-center py-16"><Loader2 class="w-8 h-8 animate-spin text-primary" /></div>
    <div v-else-if="loadError" class="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-600 dark:text-red-400">
      Não foi possível carregar seu painel. Atualize a página ou procure a gestão.
    </div>

    <template v-else>
      <section class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <article v-for="indicator in indicators" :key="indicator.label" class="rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-4">
          <div class="flex items-start justify-between gap-2">
            <p class="text-xs text-light-text/60 dark:text-offwhite/60">{{ indicator.label }}</p>
            <component :is="indicator.icon" class="h-4 w-4 text-primary" />
          </div>
          <p class="mt-2 text-xl sm:text-2xl font-bold text-light-text dark:text-offwhite">{{ indicator.value }}</p>
        </article>
      </section>

      <section class="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
        <article class="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <p class="text-xs font-bold uppercase tracking-wide text-primary">Próxima aula</p>
          <div v-if="nextClass" class="mt-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 class="text-xl font-bold text-light-text dark:text-offwhite">{{ nextClass.modalidade }}</h2>
              <p class="mt-1 text-sm text-light-text/70 dark:text-offwhite/70">{{ dayNames[nextClass.dia_semana] }} · {{ shortTime(nextClass.horario_inicio) }}–{{ shortTime(nextClass.horario_fim) }} · {{ nextClass.sala }}</p>
              <p class="mt-1 text-sm">{{ nextClass.alunos_matriculados || 0 }} aluno(s)</p>
            </div>
            <BaseButton variant="primary" @click="goToChamada(nextClass.turma_id)">Abrir chamada</BaseButton>
          </div>
          <p v-else class="mt-3 text-sm text-light-text/60 dark:text-offwhite/60">Nenhuma aula futura cadastrada.</p>
        </article>

        <article class="rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-5">
          <p class="text-xs font-bold uppercase tracking-wide text-light-text/60 dark:text-offwhite/60">Frequência no mês</p>
          <div class="mt-4 grid grid-cols-3 gap-2 text-center">
            <div><p class="text-xl font-bold text-green-600">{{ attendance.presentes }}</p><p class="text-xs">Presentes</p></div>
            <div><p class="text-xl font-bold text-red-500">{{ attendance.faltas }}</p><p class="text-xs">Faltas</p></div>
            <div><p class="text-xl font-bold text-amber-500">{{ attendance.justificadas }}</p><p class="text-xs">Justificadas</p></div>
          </div>
        </article>
      </section>

      <section class="grid gap-4 xl:grid-cols-[1.4fr_.6fr]">
        <article class="overflow-hidden rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <div class="flex items-center justify-between border-b border-light-border dark:border-dark-border p-4 sm:p-5">
            <div><h2 class="font-bold">Agenda da semana</h2><p class="text-xs text-light-text/60 dark:text-offwhite/60">Todas as suas turmas ativas</p></div>
            <NuxtLink to="/professor/chamada" class="text-xs font-bold text-primary hover:underline">Fazer chamada</NuxtLink>
          </div>
          <div v-if="!weekAgenda.length" class="p-8 text-center text-sm text-light-text/50 dark:text-offwhite/50">Nenhuma turma cadastrada.</div>
          <div v-else class="divide-y divide-light-border dark:divide-dark-border">
            <button v-for="turma in weekAgenda" :key="turma.turma_id" class="w-full p-4 sm:px-5 flex items-center justify-between gap-4 text-left hover:bg-light-bg/50 dark:hover:bg-dark-bg/50" @click="goToChamada(turma.turma_id)">
              <div class="min-w-0"><p class="font-semibold truncate">{{ turma.modalidade }}</p><p class="text-xs text-light-text/60 dark:text-offwhite/60">{{ turma.sala }} · {{ turma.alunos_matriculados || 0 }}/{{ turma.capacidade_maxima }} alunos</p></div>
              <div class="shrink-0 text-right"><p class="text-sm font-semibold">{{ dayNames[turma.dia_semana] }}</p><p class="text-xs text-primary">{{ shortTime(turma.horario_inicio) }}–{{ shortTime(turma.horario_fim) }}</p></div>
            </button>
          </div>
        </article>

        <div class="flex flex-col gap-4">
          <article class="rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-5">
            <div class="flex items-center justify-between"><h2 class="font-bold">Meus repasses</h2><NuxtLink to="/professor/repasse" class="text-xs font-bold text-primary hover:underline">Ver extrato</NuxtLink></div>
            <dl class="mt-4 space-y-3 text-sm">
              <div class="flex justify-between"><dt>Recebido neste mês</dt><dd class="font-bold text-green-600">{{ money(finance.receivedMonth) }}</dd></div>
              <div class="flex justify-between"><dt>Total já recebido</dt><dd class="font-bold">{{ money(finance.receivedTotal) }}</dd></div>
              <div class="flex justify-between"><dt>Pendente</dt><dd class="font-bold text-amber-600">{{ money(finance.pending) }}</dd></div>
            </dl>
          </article>

          <article class="rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-5">
            <h2 class="font-bold">Alertas</h2>
            <div class="mt-3 space-y-2 text-sm">
              <NuxtLink v-if="pendingCalls" to="/professor/chamada" class="block rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-amber-700 dark:text-amber-400">{{ pendingCalls }} chamada(s) de hoje pendente(s).</NuxtLink>
              <div v-for="student in absenceAlerts" :key="student.id" class="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-700 dark:text-red-400">{{ student.name }} tem {{ student.count }} faltas neste mês.</div>
              <p v-if="!pendingCalls && !absenceAlerts.length" class="text-light-text/50 dark:text-offwhite/50">Tudo certo por aqui.</p>
            </div>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BookOpenCheck, CalendarDays, Loader2, Users, Wallet } from '@lucide/vue'

const supabase = useSupabaseClient()
const router = useRouter()
const now = new Date()
const todayIso = now.toISOString().slice(0, 10)
const monthStart = `${todayIso.slice(0, 7)}-01`
const dayNames: Record<number, string> = { 0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado' }
const currentDateFormatted = computed(() => new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(now))

const { data: dashboard, pending, error: loadError } = await useAsyncData('professor_dashboard', async () => {
  const [{ data: agenda, error: agendaError }, { data: students, error: studentsError }, { data: repasses, error: repassesError }, { data: presences, error: presencesError }] = await Promise.all([
    supabase.from('vw_professor_agenda').select('*').order('dia_semana').order('horario_inicio'),
    supabase.from('vw_professor_alunos').select('id,nome'),
    supabase.from('vw_professor_meu_repasse').select('*').order('mes_referencia', { ascending: false }),
    supabase.from('presencas').select('aluno_id,status,data_aula,alunos(nome)').gte('data_aula', monthStart).lte('data_aula', todayIso)
  ])
  if (agendaError || studentsError || repassesError || presencesError) throw agendaError || studentsError || repassesError || presencesError
  const todayClasses = (agenda || []).filter((item: any) => Number(item.dia_semana) === now.getDay())
  const todayIds = todayClasses.map((item: any) => item.turma_id)
  let closed: any[] = []
  if (todayIds.length) {
    const result = await (supabase as any).from('chamadas_aula').select('turma_id').eq('data_aula', todayIso).in('turma_id', todayIds)
    if (result.error) throw result.error
    closed = result.data || []
  }
  return { agenda: agenda || [], students: students || [], repasses: repasses || [], presences: presences || [], todayClasses, closed }
})

const weekAgenda = computed<any[]>(() => dashboard.value?.agenda || [])
const todayClasses = computed<any[]>(() => dashboard.value?.todayClasses || [])
const pendingCalls = computed(() => Math.max(0, todayClasses.value.length - (dashboard.value?.closed.length || 0)))
const attendance = computed(() => (dashboard.value?.presences || []).reduce((acc: any, item: any) => {
  if (item.status === 'presente') acc.presentes++
  else if (item.status === 'falta') acc.faltas++
  else if (item.status === 'falta_justificada') acc.justificadas++
  return acc
}, { presentes: 0, faltas: 0, justificadas: 0 }))
const absenceAlerts = computed(() => {
  const grouped = new Map<string, { id: string; name: string; count: number }>()
  for (const item of dashboard.value?.presences || []) {
    if (item.status !== 'falta') continue
    const current = grouped.get(item.aluno_id) || { id: item.aluno_id, name: item.alunos?.nome || 'Aluno', count: 0 }
    current.count++
    grouped.set(item.aluno_id, current)
  }
  return [...grouped.values()].filter(item => item.count >= 3).sort((a, b) => b.count - a.count).slice(0, 5)
})
const finance = computed(() => (dashboard.value?.repasses || []).reduce((acc: any, item: any) => {
  const value = Number(item.valor_total || 0)
  if (item.data_pagamento || item.status === 'pago') {
    acc.receivedTotal += value
    if (String(item.data_pagamento || item.mes_referencia).slice(0, 7) === todayIso.slice(0, 7)) acc.receivedMonth += value
  } else acc.pending += value
  return acc
}, { receivedMonth: 0, receivedTotal: 0, pending: 0 }))
const nextClass = computed<any | null>(() => {
  if (!weekAgenda.value.length) return null
  const minutes = now.getHours() * 60 + now.getMinutes()
  return [...weekAgenda.value].sort((a, b) => {
    const offset = (Number(a.dia_semana) - now.getDay() + 7) % 7
    const offsetB = (Number(b.dia_semana) - now.getDay() + 7) % 7
    const time = Number(String(a.horario_inicio).slice(0, 2)) * 60 + Number(String(a.horario_inicio).slice(3, 5))
    const timeB = Number(String(b.horario_inicio).slice(0, 2)) * 60 + Number(String(b.horario_inicio).slice(3, 5))
    const score = (offset === 0 && time < minutes ? 7 : offset) * 1440 + time
    const scoreB = (offsetB === 0 && timeB < minutes ? 7 : offsetB) * 1440 + timeB
    return score - scoreB
  })[0]
})
const indicators = computed(() => [
  { label: 'Meus alunos', value: dashboard.value?.students.length || 0, icon: Users },
  { label: 'Alunos hoje', value: todayClasses.value.reduce((sum, item) => sum + Number(item.alunos_matriculados || 0), 0), icon: CalendarDays },
  { label: 'Aulas hoje', value: todayClasses.value.length, icon: BookOpenCheck },
  { label: 'Recebido no mês', value: money(finance.value.receivedMonth), icon: Wallet }
])
const shortTime = (value: string) => String(value || '').slice(0, 5)
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const goToChamada = (turmaId: string) => router.push({ path: '/professor/chamada', query: { turma: turmaId } })
</script>
