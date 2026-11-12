<template>
  <div class="p-8 w-full flex flex-col gap-8">
    
    <!-- Cabeçalho -->
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-light-text dark:text-offwhite">Visão geral</h2>
        <p class="text-sm text-light-text/60 dark:text-offwhite/50 capitalize">{{ currentDateFormatted }}</p>
      </div>
      
      <button 
        class="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors cursor-pointer"
        @click="isCreateModalOpen = true"
      >
        <Plus class="w-4 h-4" />
        Nova matrícula
      </button>
    </header>

    <!-- Grade de 4 cards de métrica -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <DashboardMetricCard
        title="Alunos ativos"
        :value="alunosAtivosCount?.toString() || '0'"
        to="/dashboard/alunos"
        variant="neutral"
      >
        <template #icon><Users class="w-4 h-4 text-light-text/50 dark:text-offwhite/50" /></template>
      </DashboardMetricCard>

      <DashboardMetricCard
        title="Turmas hoje"
        :value="turmasHojeCount?.toString() || '0'"
        to="/dashboard/agenda"
        variant="neutral"
      >
        <template #icon><CalendarDays class="w-4 h-4 text-light-text/50 dark:text-offwhite/50" /></template>
      </DashboardMetricCard>

      <DashboardMetricCard
        title="Inadimplência"
        :value="inadimplenciaCount?.toString() || '0'"
        description="cobranças em atraso"
        to="/dashboard/financeiro"
        variant="alert-red"
      >
        <template #icon><AlertCircle class="w-4 h-4 text-[#ff8a8a]" /></template>
      </DashboardMetricCard>

      <DashboardMetricCard
        title="Alunos trancados"
        :value="trancadosCount?.toString() || '0'"
        description="matrículas pausadas"
        to="/dashboard/alunos"
        variant="alert-gold"
      >
        <template #icon><AlertTriangle class="w-4 h-4 text-gold" /></template>
      </DashboardMetricCard>
    </div>

    <!-- Tabela de próximas turmas -->
    <DashboardUpcomingClassesTable />

    <StudentCreateModal 
      :is-open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @created="handleStudentCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Users, CalendarDays, AlertCircle, AlertTriangle } from '@lucide/vue'
import StudentCreateModal from '~/components/modals/StudentCreateModal.vue'

const supabase = useSupabaseClient()
const isCreateModalOpen = ref(false)

const currentDateFormatted = computed(() => {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
})

const { data: alunosAtivosCount, refresh: refreshAlunos } = await useAsyncData('alunosAtivosCount', async () => {
  const { count } = await supabase
    .from('alunos')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ativo')
  return count || 0
})

const { data: turmasHojeCount, refresh: refreshTurmas } = await useAsyncData('turmasHojeCount', async () => {
  const { count } = await supabase
    .from('turmas')
    .select('*', { count: 'exact', head: true })
    .eq('dia_semana', new Date().getDay())
    .eq('ativo', true)
  return count || 0
})

const { data: inadimplenciaCount, refresh: refreshInadimplencia } = await useAsyncData('inadimplenciaCount', async () => {
  const { count } = await supabase
    .from('cobrancas')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'atrasada')
  return count || 0
})

const { data: trancadosCount, refresh: refreshTrancados } = await useAsyncData('trancadosCount', async () => {
  const { count } = await supabase
    .from('alunos')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'trancado')
  return count || 0
})

const handleStudentCreated = async () => {
  await Promise.all([refreshAlunos(), refreshTurmas(), refreshInadimplencia(), refreshTrancados()])
}
</script>
