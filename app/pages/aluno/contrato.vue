<template>
  <div class="p-8 w-full flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-bold text-light-text dark:text-offwhite">Meu Contrato</h1>
      <p class="text-sm text-light-text/60 dark:text-offwhite/50 mt-1">Veja os detalhes do seu contrato de matrícula ativo.</p>
    </header>

    <div v-if="pending" class="flex justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>

    <div v-else-if="!contrato" class="text-center py-12 bg-light-surface dark:bg-dark-surface rounded-xl border border-light-border dark:border-dark-border">
      <p class="text-light-text/50 dark:text-offwhite/50">Nenhum contrato ativo encontrado.</p>
    </div>

    <div v-else class="flex flex-col md:flex-row gap-6">
      <div class="flex-1 bg-light-surface dark:bg-dark-surface p-6 rounded-xl border border-light-border dark:border-dark-border shadow-sm flex flex-col gap-4">
        <h2 class="text-lg font-bold text-light-text dark:text-offwhite border-b border-light-border dark:border-dark-border pb-3">Resumo do Plano</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div>
            <label class="text-xs font-bold text-light-text/60 dark:text-offwhite/50 uppercase tracking-wider">Plano</label>
            <p class="font-medium text-light-text dark:text-offwhite">{{ contrato.plano_nome || 'Mensal Padrão' }}</p>
          </div>
          <div>
            <label class="text-xs font-bold text-light-text/60 dark:text-offwhite/50 uppercase tracking-wider">Valor Mensal</label>
            <p class="font-medium text-light-text dark:text-offwhite">R$ {{ Number(contrato.valor_mensalidade || 0).toFixed(2).replace('.', ',') }}</p>
          </div>
          <div>
            <label class="text-xs font-bold text-light-text/60 dark:text-offwhite/50 uppercase tracking-wider">Data de Início</label>
            <p class="font-medium text-light-text dark:text-offwhite">{{ formatarData(contrato.data_inicio || contrato.data_envio || contrato.data_aceite) }}</p>
          </div>
          <div>
            <label class="text-xs font-bold text-light-text/60 dark:text-offwhite/50 uppercase tracking-wider">Fim Previsto</label>
            <p class="font-medium text-light-text dark:text-offwhite">{{ formatarData(contrato.data_fim || contrato.data_fim_vigencia) || '12 meses (Renovável)' }}</p>
          </div>
          <div>
            <label class="text-xs font-bold text-light-text/60 dark:text-offwhite/50 uppercase tracking-wider">Dia de Vencimento</label>
            <p class="font-medium text-light-text dark:text-offwhite">Dia {{ contrato.dia_vencimento || '10' }}</p>
          </div>
          <div>
            <label class="text-xs font-bold text-light-text/60 dark:text-offwhite/50 uppercase tracking-wider">Status</label>
            <p class="font-medium text-green-500">
              {{ contrato.status || 'Ativo' }}
            </p>
          </div>
        </div>
      </div>
      
      <div class="w-full md:w-80 bg-light-surface dark:bg-dark-surface p-6 rounded-xl border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-center items-center text-center gap-4">
        <FileText class="w-12 h-12 text-primary opacity-80" />
        <div>
          <h3 class="font-bold text-light-text dark:text-offwhite">Termos do Contrato</h3>
          <p class="text-xs text-light-text/60 dark:text-offwhite/60 mt-1 mb-4">Para acessar o documento completo assinado, clique abaixo.</p>
        </div>
        <button class="w-full py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border hover:border-primary/50 text-sm font-bold text-light-text dark:text-offwhite rounded-md transition-colors shadow-sm">
          Baixar PDF
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loader2, FileText } from '@lucide/vue'

const supabase = useSupabaseClient()

const { data: contrato, pending } = await useAsyncData('aluno_contrato', async () => {
  const { data, error } = await supabase
    .from('vw_aluno_meu_contrato')
    .select('*')
    .limit(1)
    .maybeSingle()
    
  if (error) {
    console.error('Erro ao buscar contrato do aluno:', error)
    return null
  }
  
  return data
})

const formatarData = (val: string) => {
  if (!val) return ''
  try {
    const d = new Date(val + 'T12:00:00Z')
    if (isNaN(d.getTime())) return val
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
  } catch {
    return val
  }
}
</script>
