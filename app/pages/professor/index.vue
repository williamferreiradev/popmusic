<template>
  <div class="p-8 w-full flex flex-col gap-6">
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-light-text dark:text-offwhite">Minha Agenda</h1>
        <p class="text-sm text-light-text/60 dark:text-offwhite/50 capitalize">{{ currentDateFormatted }}</p>
      </div>
    </header>

    <div v-if="pending" class="flex justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>

    <div v-else-if="loadError" class="text-center py-12 bg-red-500/10 rounded-xl border border-red-500/30">
      <p class="text-red-600 dark:text-red-400 font-medium">Não foi possível carregar sua agenda. Atualize a página ou procure a gestão.</p>
    </div>

    <div v-else-if="!agenda || agenda.length === 0" class="text-center py-12 bg-light-surface dark:bg-dark-surface rounded-xl border border-light-border dark:border-dark-border">
      <p class="text-light-text/50 dark:text-offwhite/50">Nenhuma turma agendada para hoje.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div 
        v-for="turma in agenda" 
        :key="turma.turma_id || `${turma.modalidade}-${turma.horario_inicio}`"
        class="bg-light-surface dark:bg-dark-surface p-5 rounded-xl border border-light-border dark:border-dark-border shadow-sm hover:border-primary/50 cursor-pointer transition-colors"
        @click="turma.turma_id && goToChamada(turma.turma_id)"
      >
        <div class="flex justify-between items-start mb-3">
          <h3 class="font-bold text-light-text dark:text-offwhite">{{ turma.modalidade || 'Modalidade não informada' }}</h3>
          <span class="text-xs font-bold px-2 py-1 bg-light-bg dark:bg-dark-bg rounded text-primary border border-light-border dark:border-dark-border">
            {{ turma.horario_inicio }}{{ turma.horario_fim ? ' - ' + turma.horario_fim : '' }}
          </span>
        </div>
        
        <div class="space-y-2 text-sm text-light-text/70 dark:text-offwhite/70">
          <p class="flex items-center gap-2">
            <Guitar class="w-4 h-4" /> {{ turma.modalidade || 'Modalidade não informada' }}
          </p>
          <p class="flex items-center gap-2">
            <MapPin class="w-4 h-4" /> {{ turma.sala || 'Sala não definida' }}
          </p>
          <p class="flex items-center gap-2">
            <Users class="w-4 h-4" /> {{ turma.alunos_matriculados || 0 }} / {{ turma.capacidade_maxima ?? '—' }} alunos
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Loader2, Users, MapPin, Music as Guitar } from '@lucide/vue'

const supabase = useSupabaseClient()
const router = useRouter()

const currentDateFormatted = computed(() => {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
})

const hoje = new Date().getDay()

const { data: agenda, pending, error: loadError } = await useAsyncData('professor_agenda', async () => {
  const { data, error } = await supabase
    .from('vw_professor_agenda')
    .select('*')
    .eq('dia_semana', hoje)
    .order('horario_inicio')
    
  if (error) {
    console.error('Erro ao buscar agenda do professor.')
    throw error
  }
  
  return data || []
})

const goToChamada = (turmaId: string) => {
  router.push({ path: '/professor/chamada', query: { turma: turmaId } })
}
</script>
