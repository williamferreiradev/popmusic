<template>
  <div class="p-4 sm:p-8 w-full flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-bold text-light-text dark:text-offwhite">Frequência</h1>
      <p class="text-sm text-light-text/60 dark:text-offwhite/50 mt-1">Acompanhe seu histórico de faltas e presenças.</p>
    </header>

    <div v-if="pending" class="flex justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>

    <div v-else-if="loadError" class="text-center py-12 bg-red-500/10 rounded-xl border border-red-500/30">
      <p class="font-medium text-red-600 dark:text-red-400">Não foi possível carregar sua frequência. Tente novamente.</p>
    </div>
    <div v-else-if="!frequencias || frequencias.length === 0" class="text-center py-12 bg-light-surface dark:bg-dark-surface rounded-xl border border-light-border dark:border-dark-border">
      <p class="text-light-text/50 dark:text-offwhite/50">Nenhum registro de frequência encontrado.</p>
    </div>

    <div v-else class="bg-light-surface dark:bg-dark-surface rounded-xl border border-light-border dark:border-dark-border overflow-x-auto shadow-sm">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-light-border/30 dark:bg-dark-border/30 border-b border-light-border dark:border-dark-border text-sm font-medium text-light-text/70 dark:text-offwhite/70">
            <th class="py-3 px-4">Data</th>
            <th class="py-3 px-4">Turma / Modalidade</th>
            <th class="py-3 px-4">Status</th>
          </tr>
        </thead>
        <tbody class="text-sm divide-y divide-light-border/50 dark:divide-dark-border/50">
          <tr 
            v-for="(freq, idx) in frequencias" 
            :key="idx"
            class="hover:bg-light-bg/50 dark:hover:bg-dark-bg/50 transition-colors"
          >
            <td class="py-3 px-4 text-light-text dark:text-offwhite font-medium">
              {{ formatarData(freq.data_aula) }}
            </td>
            <td class="py-3 px-4">
              <span class="block text-light-text dark:text-offwhite">{{ freq.modalidade || 'Aula' }}</span>
              <span class="text-xs text-light-text/60 dark:text-offwhite/60">{{ formatarTipoAula(freq.tipo_aula) }}</span>
            </td>
            <td class="py-3 px-4">
              <span 
                class="px-2 py-1 text-xs font-bold rounded flex items-center gap-1 w-max"
                :class="getStatusClass(freq.status)"
              >
                {{ freq.status || 'Não registrado' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loader2 } from '@lucide/vue'

const supabase = useSupabaseClient()

const { data: frequencias, pending, error: loadError } = await useAsyncData('aluno_frequencia', async () => {
  const { data, error } = await supabase
    .from('vw_aluno_minha_frequencia')
    .select('*')
    .order('data_aula', { ascending: false })
    
  if (error) throw error
  
  return data
})

const formatarData = (val: string | null) => {
  if (!val) return '-'
  try {
    const d = new Date(val + 'T12:00:00Z') // Hack timezone
    if (isNaN(d.getTime())) return val
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
  } catch {
    return val
  }
}

const formatarTipoAula = (tipo: string | null) => tipo === 'reposicao' ? 'Reposição' : 'Aula normal'

const getStatusClass = (status: string | null) => {
  if (!status) return 'bg-light-border dark:bg-dark-border text-light-text dark:text-offwhite'
  const s = status.toLowerCase()
  if (s.includes('presente')) return 'bg-green-500/10 text-green-500 border border-green-500/20'
  if (s.includes('falta') && !s.includes('justificada')) return 'bg-red-500/10 text-red-500 border border-red-500/20'
  if (s.includes('justificada')) return 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
  return 'bg-light-border dark:bg-dark-border text-light-text dark:text-offwhite'
}
</script>
