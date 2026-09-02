<template>
  <div class="p-8 w-full flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-bold text-light-text dark:text-offwhite">Meu Repasse</h1>
      <p class="text-sm text-light-text/60 dark:text-offwhite/50 mt-1">Acompanhe os valores de repasse pelas suas aulas.</p>
    </header>

    <div v-if="pending" class="flex justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
    <div v-else-if="loadError" class="text-center py-12 bg-red-500/10 rounded-xl border border-red-500/30">
      <p class="text-red-600 dark:text-red-400 font-medium">Não foi possível carregar seus repasses.</p>
    </div>

    <div v-else-if="!repasses || repasses.length === 0" class="text-center py-12 bg-light-surface dark:bg-dark-surface rounded-xl border border-light-border dark:border-dark-border">
      <p class="text-light-text/50 dark:text-offwhite/50">Nenhum repasse registrado.</p>
    </div>

    <div v-else class="bg-light-surface dark:bg-dark-surface rounded-xl border border-light-border dark:border-dark-border overflow-hidden shadow-sm">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-light-border/30 dark:bg-dark-border/30 border-b border-light-border dark:border-dark-border text-sm font-medium text-light-text/70 dark:text-offwhite/70">
            <th class="py-3 px-4">Mês/Ano</th>
            <th class="py-3 px-4">Turma/Detalhe</th>
            <th class="py-3 px-4">Valor</th>
            <th class="py-3 px-4 text-right">Status</th>
          </tr>
        </thead>
        <tbody class="text-sm divide-y divide-light-border/50 dark:divide-dark-border/50">
          <tr 
            v-for="(repasse, idx) in repasses" 
            :key="idx"
            class="hover:bg-light-bg/50 dark:hover:bg-dark-bg/50 transition-colors"
          >
            <td class="py-3 px-4 font-medium text-light-text dark:text-offwhite">
              {{ formatarMes(repasse.mes_referencia || repasse.data_referencia) }}
            </td>
            <td class="py-3 px-4 text-light-text/70 dark:text-offwhite/70">
              {{ repasse.data_pagamento ? `Pago em ${formatarData(repasse.data_pagamento)}` : 'Fechamento da competência' }}
            </td>
            <td class="py-3 px-4 font-medium text-light-text dark:text-offwhite">
              R$ {{ Number(repasse.valor_total || 0).toFixed(2).replace('.', ',') }}
            </td>
            <td class="py-3 px-4 text-right">
              <span 
                class="px-2 py-1 text-xs font-bold rounded"
                :class="getStatusClass(repasse.status)"
              >
                {{ repasse.status || 'Pendente' }}
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

const { data: repasses, pending, error: loadError } = await useAsyncData('professor_repasses', async () => {
  const { data, error } = await supabase
    .from('vw_professor_meu_repasse')
    .select('*')
    .order('mes_referencia', { ascending: false })
    
  if (error) {
    console.error('Erro ao buscar repasses do professor.')
    throw error
  }
  
  return data
})

const formatarMes = (val: string) => {
  if (!val) return '-'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return val
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(d)
  } catch (e) {
    return val
  }
}
const formatarData = (val: string) => new Date(`${val}T12:00:00`).toLocaleDateString('pt-BR')

const getStatusClass = (status: string) => {
  if (!status) return 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
  const s = status.toLowerCase()
  if (s.includes('pago') || s.includes('concluído')) return 'bg-green-500/10 text-green-500 border border-green-500/20'
  if (s.includes('pendente') || s.includes('agendado')) return 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
  return 'bg-light-border dark:bg-dark-border text-light-text dark:text-offwhite'
}
</script>
