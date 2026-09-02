<template>
  <div class="p-8 w-full flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-bold text-light-text dark:text-offwhite">Financeiro</h1>
      <p class="text-sm text-light-text/60 dark:text-offwhite/50 mt-1">Consulte o status das suas mensalidades e outras cobranças.</p>
    </header>

    <div v-if="pending" class="flex justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>

    <div v-else-if="!cobrancas || cobrancas.length === 0" class="text-center py-12 bg-light-surface dark:bg-dark-surface rounded-xl border border-light-border dark:border-dark-border">
      <p class="text-light-text/50 dark:text-offwhite/50">Nenhuma cobrança registrada.</p>
    </div>

    <div v-else class="bg-light-surface dark:bg-dark-surface rounded-xl border border-light-border dark:border-dark-border overflow-hidden shadow-sm">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-light-border/30 dark:bg-dark-border/30 border-b border-light-border dark:border-dark-border text-sm font-medium text-light-text/70 dark:text-offwhite/70">
            <th class="py-3 px-4">Referência / Vencimento</th>
            <th class="py-3 px-4">Descrição</th>
            <th class="py-3 px-4">Valor</th>
            <th class="py-3 px-4 text-right">Status</th>
          </tr>
        </thead>
        <tbody class="text-sm divide-y divide-light-border/50 dark:divide-dark-border/50">
          <tr 
            v-for="(cobranca, idx) in cobrancas" 
            :key="idx"
            class="hover:bg-light-bg/50 dark:hover:bg-dark-bg/50 transition-colors"
          >
            <td class="py-3 px-4">
              <span class="block text-light-text dark:text-offwhite font-medium">{{ formatarData(cobranca.data_vencimento || cobranca.vencimento) }}</span>
              <span class="text-xs text-light-text/60 dark:text-offwhite/60">{{ formatarMes(cobranca.mes_referencia || cobranca.data_vencimento || cobranca.vencimento) }}</span>
            </td>
            <td class="py-3 px-4 text-light-text/70 dark:text-offwhite/70">
              {{ cobranca.descricao || 'Mensalidade' }}
            </td>
            <td class="py-3 px-4 font-medium text-light-text dark:text-offwhite">
              R$ {{ Number(cobranca.valor || 0).toFixed(2).replace('.', ',') }}
            </td>
            <td class="py-3 px-4 text-right">
              <span 
                class="px-2 py-1 text-xs font-bold rounded"
                :class="getStatusClass(cobranca.status)"
              >
                {{ cobranca.status || 'Pendente' }}
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

const { data: cobrancas, pending } = await useAsyncData('aluno_financeiro', async () => {
  const { data, error } = await supabase
    .from('vw_aluno_minhas_cobrancas')
    .select('*')
    .order('data_vencimento', { ascending: true })
    
  if (error) {
    console.error('Erro ao buscar financeiro do aluno:', error)
    return []
  }
  
  return data
})

const formatarData = (val: string) => {
  if (!val) return '-'
  try {
    const d = new Date(val + 'T12:00:00Z')
    if (isNaN(d.getTime())) return val
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
  } catch {
    return val
  }
}

const formatarMes = (val: string) => {
  if (!val) return '-'
  try {
    const d = new Date(val + 'T12:00:00Z')
    if (isNaN(d.getTime())) return val
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(d)
  } catch {
    return val
  }
}

const getStatusClass = (status: string) => {
  if (!status) return 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
  const s = status.toLowerCase()
  if (s.includes('pag')) return 'bg-green-500/10 text-green-500 border border-green-500/20'
  if (s.includes('atras') || s.includes('vencid')) return 'bg-red-500/10 text-red-500 border border-red-500/20'
  return 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
}
</script>
