<template>
  <div class="p-8 w-full flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-bold text-light-text dark:text-offwhite">Minhas Aulas</h1>
      <p class="text-sm text-light-text/60 dark:text-offwhite/50 mt-1">Veja as turmas em que você está matriculado(a).</p>
    </header>

    <div v-if="pending" class="flex justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>

    <div v-else-if="!aulas || aulas.length === 0" class="text-center py-12 bg-light-surface dark:bg-dark-surface rounded-xl border border-light-border dark:border-dark-border">
      <p class="text-light-text/50 dark:text-offwhite/50">Você ainda não está matriculado(a) em nenhuma turma.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div 
        v-for="aula in aulas" 
        :key="aula.turma_id || `${aula.modalidade}-${aula.horario_inicio}`"
        class="bg-light-surface dark:bg-dark-surface p-5 rounded-xl border border-light-border dark:border-dark-border shadow-sm"
      >
        <div class="flex justify-between items-start mb-3">
          <h3 class="font-bold text-light-text dark:text-offwhite">{{ aula.modalidade || 'Aula de Música' }}</h3>
          <span class="text-xs font-bold px-2 py-1 bg-light-bg dark:bg-dark-bg rounded text-primary border border-light-border dark:border-dark-border">
            {{ aula.horario_inicio || 'Horário a definir' }}{{ aula.horario_fim ? ' - ' + aula.horario_fim : '' }}
          </span>
        </div>
        
        <div class="space-y-2 text-sm text-light-text/70 dark:text-offwhite/70">
          <p class="flex items-center gap-2">
            <Guitar class="w-4 h-4" /> {{ aula.modalidade || 'Música' }}
          </p>
          <p class="flex items-center gap-2">
            <User class="w-4 h-4" /> Professor: {{ aula.professor || 'A definir' }}
          </p>
          <p class="flex items-center gap-2">
            <MapPin class="w-4 h-4" /> {{ aula.sala || 'Sala a definir' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loader2, User, MapPin, Music as Guitar } from '@lucide/vue'

const supabase = useSupabaseClient()

const { data: aulas, pending } = await useAsyncData('aluno_aulas', async () => {
  const { data, error } = await supabase
    .from('vw_aluno_minhas_turmas')
    .select('*')
    
  if (error) {
    console.error('Erro ao buscar turmas do aluno:', error)
    return []
  }
  
  return data
})
</script>
