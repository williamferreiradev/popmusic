<template>
  <div class="flex flex-col gap-6 relative">
    
    <!-- Busca Livre -->
    <div class="w-full relative">
      <div class="relative flex items-center">
        <Search class="absolute left-3 w-5 h-5 text-light-text/40 dark:text-offwhite/40 pointer-events-none" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Buscar um relatório ou aluno..."
          class="w-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg py-3 pl-10 pr-4 text-light-text dark:text-offwhite placeholder:text-light-text/40 dark:placeholder:text-offwhite/40 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors shadow-sm"
        >
      </div>
    </div>

    <!-- Grade de Relatórios -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div 
        v-for="report in filteredReports" 
        :key="report.id"
        class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-5 flex flex-col gap-3 transition-all duration-300"
        :class="{ 'ring-2 ring-primary border-transparent': activeReport?.id === report.id }"
      >
        <div class="flex items-start gap-3">
          <div class="p-2 rounded-lg bg-light-border/30 dark:bg-dark-border/30 text-primary">
            <component :is="report.icon" class="w-5 h-5" />
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-light-text dark:text-offwhite leading-tight mb-1">{{ report.title }}</h3>
            <p class="text-xs text-light-text/60 dark:text-offwhite/60 leading-relaxed">{{ report.description }}</p>
          </div>
        </div>

        <div class="mt-auto pt-2 flex flex-col gap-3">
          <!-- Expansão para Seletores Específicos -->
          <template v-if="expandedCard === report.id && report.requiresInput">
            <div class="animate-in fade-in slide-in-from-top-2 duration-200">
              <BaseSelect 
                v-if="report.inputType === 'modalidade'"
                v-model="reportInputValue"
                placeholder="Escolha a modalidade"
                :options="[ {label: 'Violão', value: 'violao'}, {label: 'Teclado', value: 'teclado'}, {label: 'Canto', value: 'canto'} ]"
              />
              <BaseSelect 
                v-if="report.inputType === 'mes'"
                v-model="reportInputValue"
                placeholder="Selecione o mês"
                :options="[ {label: 'Julho', value: '07'}, {label: 'Agosto', value: '08'} ]"
              />
            </div>
            <div class="flex items-center gap-2">
              <BaseButton variant="primary" class="flex-1" :disabled="!reportInputValue" @click="generateReport(report)">
                Gerar
              </BaseButton>
              <BaseButton variant="outline" @click="expandedCard = null">
                Cancelar
              </BaseButton>
            </div>
          </template>
          
          <template v-else>
            <BaseButton 
              variant="outline" 
              class="w-full border-light-border dark:border-dark-border hover:border-primary dark:hover:border-primary-hover hover:text-primary dark:hover:text-primary-hover transition-colors"
              @click="handleReportClick(report)"
            >
              {{ report.requiresInput ? 'Configurar e Gerar' : 'Gerar Relatório' }}
            </BaseButton>
          </template>
        </div>
      </div>
    </div>

    <!-- Painel de Resultado -->
    <div v-if="activeReport" ref="resultPanelRef" class="mt-4 pt-4 border-t border-light-border dark:border-dark-border animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div v-if="isLoading" class="w-full flex flex-col gap-4 animate-pulse">
        <div class="h-8 w-64 bg-light-border dark:bg-dark-border rounded"/>
        <div class="h-10 w-full bg-light-border dark:bg-dark-border rounded-md"/>
        <div class="h-10 w-full bg-light-border dark:bg-dark-border rounded-md"/>
        <div class="h-10 w-full bg-light-border dark:bg-dark-border rounded-md"/>
      </div>
      
      <RelatoriosResultTable 
        v-else
        :title="generatedTitle"
        :columns="activeReport.columns"
        :data="activeReportData"
        :has-actions="activeReport.hasActions"
        :action-icon="activeReport.actionIcon"
        :action-type="activeReport.actionType"
        :action-tooltip="activeReport.actionTooltip"
        @close="closeResult"
        @action="handleQuickAction"
      />
    </div>

    <div v-if="reportError" class="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300" role="alert">
      {{ reportError }}
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { 
  Search, UserCheck, AlertCircle,
  Gift, FileSignature, Send, RefreshCw, FileX2
} from '@lucide/vue'
import BaseButton from '../BaseButton.vue'
import RelatoriosResultTable, { type TableColumn } from './RelatoriosResultTable.vue'

const supabase = useSupabaseClient()

// --- DADOS DOS RELATÓRIOS ---
interface ReportConfig {
  id: string
  title: string
  description: string
  icon: any
  requiresInput?: boolean
  inputType?: 'modalidade' | 'mes'
  columns: TableColumn[]
  hasActions?: boolean
  actionType?: string
  actionIcon?: any
  actionTooltip?: string
}

const reports: ReportConfig[] = [
  {
    id: 'ativos',
    title: 'Alunos ativos',
    description: 'Todos os alunos com matrícula ativa no momento.',
    icon: UserCheck,
    columns: [
      { key: 'name', label: 'Nome' },
      { key: 'modality', label: 'Modalidade(s)' },
      { key: 'status', label: 'Status', type: 'badge' },
      { key: 'phone', label: 'Telefone' }
    ]
  },
  {
    id: 'inadimplentes',
    title: 'Alunos inadimplentes',
    description: 'Alunos com pelo menos uma cobrança em atraso.',
    icon: AlertCircle,
    hasActions: true,
    actionType: 'resend_charge',
    actionIcon: RefreshCw,
    actionTooltip: 'Reenviar Cobrança',
    columns: [
      { key: 'name', label: 'Nome' },
      { key: 'amount', label: 'Valor em atraso' },
      { key: 'days', label: 'Dias de atraso' },
      { key: 'phone', label: 'Telefone' }
    ]
  },
  {
    id: 'aniversariantes',
    title: 'Aniversariantes do mês',
    description: 'Alunos que fazem aniversário este mês.',
    icon: Gift,
    columns: [
      { key: 'name', label: 'Nome' },
      { key: 'birthdate', label: 'Data de nascimento' },
      { key: 'age', label: 'Idade que completa' },
      { key: 'phone', label: 'Telefone' }
    ]
  },
  {
    id: 'contratos',
    title: 'Contratos aguardando',
    description: 'Contratos enviados e ainda não aceitos.',
    icon: FileSignature,
    hasActions: true,
    actionType: 'resend_link',
    actionIcon: Send,
    actionTooltip: 'Reenviar Link',
    columns: [
      { key: 'name', label: 'Nome' },
      { key: 'date', label: 'Data de envio' },
      { key: 'days', label: 'Dias aguardando' }
    ]
  },
  {
    id: 'contratos_cancelados',
    title: 'Contratos cancelados',
    description: 'Histórico de contratos encerrados por cancelamento.',
    icon: FileX2,
    columns: [
      { key: 'name', label: 'Nome' },
      { key: 'date', label: 'Data do contrato' },
      { key: 'amount', label: 'Mensalidade' },
      { key: 'status', label: 'Status', type: 'badge' }
    ]
  }
]

const searchQuery = ref('')
const expandedCard = ref<string | null>(null)
const reportInputValue = ref('')

const activeReport = ref<ReportConfig | null>(null)
const generatedTitle = ref('')
const isLoading = ref(false)
const reportError = ref('')
const activeReportData = ref<any[]>([])
const resultPanelRef = ref<HTMLElement | null>(null)

const filteredReports = computed(() => {
  if (!searchQuery.value) return reports
  const query = searchQuery.value.toLowerCase()
  return reports.filter(r => r.title.toLowerCase().includes(query) || r.description.toLowerCase().includes(query))
})

const handleReportClick = (report: ReportConfig) => {
  if (report.requiresInput) {
    expandedCard.value = expandedCard.value === report.id ? null : report.id
    if (report.inputType === 'mes') {
      const month = new Date().getMonth() + 1
      reportInputValue.value = month.toString().padStart(2, '0')
    } else {
      reportInputValue.value = ''
    }
  } else {
    expandedCard.value = null
    generateReport(report)
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const generateReport = async (report: ReportConfig) => {
  activeReport.value = report
  expandedCard.value = null
  isLoading.value = true
  reportError.value = ''
  
  if (report.requiresInput) {
    const inputLabel = report.inputType === 'modalidade' ? 'Modalidade' : 'Mês'
    generatedTitle.value = `${report.title} — ${inputLabel}`
  } else {
    generatedTitle.value = report.title
  }

  nextTick(() => {
    if (resultPanelRef.value) {
      resultPanelRef.value.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  })

  try {
    if (report.id === 'ativos') {
      const { data: alunos, error } = await supabase
        .from('alunos')
        .select(`
          id, nome, status, telefone,
          matriculas_turma (data_fim,
            turmas (
              modalidades (nome)
            )
          )
        `)
        .eq('status', 'ativo')
      if (error) throw error

      activeReportData.value = (alunos || []).map((a: any) => {
        const mods = (a.matriculas_turma || [])
          .filter((m: any) => !m.data_fim)
          .map((m: any) => m.turmas?.modalidades?.nome)
          .filter(Boolean)
          .join(', ') || 'Nenhuma'

        return {
          name: a.nome,
          modality: mods,
          status: 'Ativo',
          phone: a.telefone || '-'
        }
      })
    } else if (report.id === 'inadimplentes') {
      const { data: cobrancas, error } = await supabase
        .from('cobrancas')
        .select(`
          id, valor, vencimento, status,
          alunos (nome, telefone)
        `)
        .eq('status', 'atrasada')
      if (error) throw error

      activeReportData.value = (cobrancas || []).map((c: any) => {
        const diffDays = Math.max(0, Math.floor((Date.now() - new Date(c.vencimento).getTime()) / (1000 * 60 * 60 * 24)))
        return {
          name: c.alunos?.nome || 'Aluno',
          amount: formatCurrency(c.valor),
          days: `${diffDays} dias`,
          phone: c.alunos?.telefone || '-'
        }
      })
    } else if (report.id === 'contratos') {
      const { data: contratos, error } = await supabase
        .from('contratos')
        .select(`
          id, status, data_envio,
          alunos (nome)
        `)
        .eq('status', 'aguardando_assinatura')
      if (error) throw error

      activeReportData.value = (contratos || []).map((c: any) => {
        const d = c.data_envio ? c.data_envio.split('T')[0] : ''
        const diffDays = d ? Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24))) : 0
        return {
          name: c.alunos?.nome || 'Aluno',
          date: d ? `${d.split('-')[2]}/${d.split('-')[1]}/${d.split('-')[0]}` : '-',
          days: `${diffDays} dias`
        }
      })
    } else if (report.id === 'contratos_cancelados') {
      const { data: contratos, error } = await supabase
        .from('contratos')
        .select(`
          id, criado_em, valor_mensalidade, status,
          alunos (nome)
        `)
        .eq('status', 'cancelado')
        .order('criado_em', { ascending: false })
      if (error) throw error

      activeReportData.value = (contratos || []).map((c: any) => ({
        name: c.alunos?.nome || 'Aluno removido',
        date: c.criado_em ? new Date(c.criado_em).toLocaleDateString('pt-BR') : '-',
        amount: formatCurrency(Number(c.valor_mensalidade || 0)),
        status: 'Cancelado'
      }))
    } else if (report.id === 'aniversariantes') {
      const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0')
      const { data: alunos, error } = await supabase
        .from('alunos')
        .select('id, nome, data_nascimento, telefone')
        .not('data_nascimento', 'is', null)
      if (error) throw error

      const aniversariantes = (alunos || []).filter((a: any) => {
        if (!a.data_nascimento) return false
        const m = a.data_nascimento.split('-')[1]
        return m === currentMonth
      })

      activeReportData.value = aniversariantes.map((a: any) => {
        const [y, m, d] = a.data_nascimento.split('-')
        const age = new Date().getFullYear() - Number(y)
        return {
          name: a.nome,
          birthdate: `${d}/${m}/${y}`,
          age: `${age} anos`,
          phone: a.telefone || '-'
        }
      })
    } else {
      activeReportData.value = []
    }
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    activeReportData.value = []
    reportError.value = 'Não foi possível gerar o relatório. Verifique sua conexão e tente novamente.'
  } finally {
    isLoading.value = false
  }
}

const closeResult = () => {
  activeReport.value = null
  activeReportData.value = []
  reportError.value = ''
}

const handleQuickAction = ({ action }: any) => {
  if (action === 'resend_charge') {
    alert('O envio automático por WhatsApp ainda não está configurado. Abra o Financeiro para copiar os dados e enviar manualmente.')
    navigateTo('/dashboard/financeiro')
  } else if (action === 'resend_link') {
    alert('Abra Contratos para reenviar o link por e-mail e conferir o resultado real do envio.')
    navigateTo('/dashboard/contratos')
  } else if (action === 'view_details') {
    navigateTo('/dashboard/financeiro')
  }
}
</script>
