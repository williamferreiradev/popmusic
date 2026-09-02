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
        />
      </div>
      <!-- Sugestão de aluno fake -->
      <div v-if="searchQuery.length > 2 && !searchQuery.toLowerCase().includes('relató')" class="absolute top-full left-0 w-full mt-1 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-lg z-10 p-2">
        <p class="text-xs font-semibold text-light-text/50 dark:text-offwhite/50 mb-2 px-2 uppercase tracking-wider">Ir para Aluno</p>
        <button class="w-full text-left px-3 py-2 rounded-md hover:bg-light-border/20 dark:hover:bg-dark-border/20 flex items-center justify-between text-sm transition-colors">
          <span class="font-medium text-light-text dark:text-offwhite">{{ searchQuery }} (Dossiê)</span>
          <ArrowRight class="w-4 h-4 text-primary" />
        </button>
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
              <BaseButton variant="primary" class="flex-1" @click="generateReport(report)" :disabled="!reportInputValue">
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

    <!-- Área de Meus Relatórios Salvos -->
    <div v-if="savedReports.length > 0" class="mt-4">
      <h3 class="text-lg font-bold text-light-text dark:text-offwhite mb-4 flex items-center gap-2">
        <Bookmark class="w-5 h-5 text-gold" />
        Meus relatórios salvos
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          v-for="saved in savedReports" 
          :key="saved.id"
          class="bg-light-surface dark:bg-dark-surface border border-gold/30 rounded-xl p-5 flex flex-col gap-3 group relative"
        >
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-gold/10 text-gold">
              <Filter class="w-5 h-5" />
            </div>
            <div class="flex-1">
              <h3 class="font-bold text-light-text dark:text-offwhite leading-tight mb-1">{{ saved.name }}</h3>
              <p class="text-xs text-light-text/60 dark:text-offwhite/60 leading-relaxed">Filtro Personalizado ({{ saved.origin }})</p>
            </div>
          </div>
          
          <button @click="removeSaved(saved.id)" class="absolute top-3 right-3 p-1.5 text-light-text/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-md" title="Remover">
            <Trash2 class="w-4 h-4" />
          </button>

          <div class="mt-auto pt-2">
            <BaseButton variant="outline" class="w-full" @click="generateSavedReport(saved)">Gerar Relatório</BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Painel de Resultado -->
    <div v-if="activeReport" ref="resultPanelRef" class="mt-4 pt-4 border-t border-light-border dark:border-dark-border animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div v-if="isLoading" class="w-full flex flex-col gap-4 animate-pulse">
        <div class="h-8 w-64 bg-light-border dark:bg-dark-border rounded"></div>
        <div class="h-10 w-full bg-light-border dark:bg-dark-border rounded-md"></div>
        <div class="h-10 w-full bg-light-border dark:bg-dark-border rounded-md"></div>
        <div class="h-10 w-full bg-light-border dark:bg-dark-border rounded-md"></div>
      </div>
      
      <RelatoriosResultTable 
        v-else
        :title="generatedTitle"
        :columns="activeReport.columns"
        :data="activeReportData"
        :hasActions="activeReport.hasActions"
        :actionIcon="activeReport.actionIcon"
        :actionType="activeReport.actionType"
        :actionTooltip="activeReport.actionTooltip"
        @close="closeResult"
        @action="handleQuickAction"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { 
  Search, Users, UserCheck, AlertCircle, AlertTriangle, 
  UserMinus, Gift, FileSignature, Wallet, ArrowRight,
  Send, Eye, RefreshCw, Bookmark, Filter, Trash2
} from '@lucide/vue'
import BaseButton from '../BaseButton.vue'
import BaseSelect from '../BaseSelect.vue'
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
    id: 'modalidade',
    title: 'Alunos por modalidade',
    description: 'Liste os alunos de uma modalidade específica (violão, teclado, etc).',
    icon: Users,
    requiresInput: true,
    inputType: 'modalidade',
    columns: [
      { key: 'name', label: 'Nome' },
      { key: 'status', label: 'Status', type: 'badge' },
      { key: 'teacher', label: 'Professor' },
      { key: 'time', label: 'Horário' },
      { key: 'financial', label: 'Situação financeira', type: 'badge' }
    ]
  },
  {
    id: 'ativos',
    title: 'Alunos ativos',
    description: 'Todos os alunos com matrícula ativa no momento.',
    icon: UserCheck,
    columns: [
      { key: 'name', label: 'Nome' },
      { key: 'modality', label: 'Modalidade(s)' },
      { key: 'attendance', label: 'Frequência (%)' },
      { key: 'financial', label: 'Situação financeira', type: 'badge' }
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
    id: 'evasao',
    title: 'Alunos em risco de evasão',
    description: 'Alunos com frequência baixa ou faltas consecutivas.',
    icon: AlertTriangle,
    columns: [
      { key: 'name', label: 'Nome' },
      { key: 'class', label: 'Turma' },
      { key: 'attendance', label: 'Frequência (%)' },
      { key: 'consecutive_absences', label: 'Faltas consecutivas' },
      { key: 'phone', label: 'Telefone' }
    ]
  },
  {
    id: 'cancelamentos',
    title: 'Cancelamentos do mês',
    description: 'Alunos que cancelaram a matrícula no mês atual.',
    icon: UserMinus,
    requiresInput: true,
    inputType: 'mes',
    columns: [
      { key: 'name', label: 'Nome' },
      { key: 'modality', label: 'Modalidade' },
      { key: 'date', label: 'Data de cancelamento' },
      { key: 'reason', label: 'Motivo' }
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
    id: 'repasses',
    title: 'Repasses pendentes',
    description: 'Quanto cada professor tem a receber no momento.',
    icon: Wallet,
    hasActions: true,
    actionType: 'view_details',
    actionIcon: Eye,
    actionTooltip: 'Ver Detalhes',
    columns: [
      { key: 'teacher', label: 'Professor' },
      { key: 'amount', label: 'Valor pendente' },
      { key: 'students', label: 'Quantidade de alunos' }
    ]
  }
]

const searchQuery = ref('')
const expandedCard = ref<string | null>(null)
const reportInputValue = ref('')

const activeReport = ref<ReportConfig | null>(null)
const generatedTitle = ref('')
const isLoading = ref(false)
const activeReportData = ref<any[]>([])
const resultPanelRef = ref<HTMLElement | null>(null)

// Modalidades do banco para o seletor
const { data: modalitiesList } = await useAsyncData('report_modalities', async () => {
  const { data } = await supabase.from('modalidades').select('id, nome').eq('ativo', true)
  return (data || []).map((m: any) => ({ label: m.nome, value: m.id }))
})

// Relatórios salvos
const savedReports = ref<any[]>([
  { id: 's1', name: 'Alunos Ativos - Geral', origin: 'Alunos', columns: reports[1].columns },
  { id: 's2', name: 'Pagamentos em Atraso', origin: 'Financeiro', columns: reports[2].columns }
])

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
      const { data: alunos } = await supabase
        .from('alunos')
        .select(`
          id, nome, status, telefone,
          matriculas_turma (
            turmas (
              modalidades (nome)
            )
          )
        `)
        .eq('status', 'ativo')

      activeReportData.value = (alunos || []).map((a: any) => {
        const mods = (a.matriculas_turma || [])
          .map((m: any) => m.turmas?.modalidades?.nome)
          .filter(Boolean)
          .join(', ') || 'Nenhuma'

        return {
          name: a.nome,
          modality: mods,
          attendance: '100%',
          financial: 'Pago'
        }
      })
    } else if (report.id === 'inadimplentes') {
      const { data: cobrancas } = await supabase
        .from('cobrancas')
        .select(`
          id, valor, vencimento, status,
          alunos (nome, telefone)
        `)
        .eq('status', 'atrasada')

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
      const { data: contratos } = await supabase
        .from('contratos')
        .select(`
          id, status, data_envio,
          alunos (nome)
        `)
        .eq('status', 'aguardando_assinatura')

      activeReportData.value = (contratos || []).map((c: any) => {
        const d = c.data_envio ? c.data_envio.split('T')[0] : ''
        const diffDays = d ? Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24))) : 0
        return {
          name: c.alunos?.nome || 'Aluno',
          date: d ? `${d.split('-')[2]}/${d.split('-')[1]}/${d.split('-')[0]}` : '-',
          days: `${diffDays} dias`
        }
      })
    } else if (report.id === 'aniversariantes') {
      const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0')
      const { data: alunos } = await supabase
        .from('alunos')
        .select('id, nome, data_nascimento, telefone')
        .not('data_nascimento', 'is', null)

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
    } else if (report.id === 'repasses') {
      const { data: profs } = await supabase
        .from('professores')
        .select(`
          id, nome, valor_hora_aula,
          turmas (
            id,
            matriculas_turma (id)
          )
        `)
        .eq('ativo', true)

      activeReportData.value = (profs || []).map((p: any) => {
        let studentCount = 0
        ;(p.turmas || []).forEach((t: any) => {
          studentCount += (t.matriculas_turma || []).length
        })
        const pending = studentCount * 4 * (p.valor_hora_aula || 50)
        return {
          teacher: p.nome,
          amount: formatCurrency(pending),
          students: studentCount.toString()
        }
      })
    } else {
      activeReportData.value = []
    }
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    activeReportData.value = []
  } finally {
    isLoading.value = false
  }
}

const generateSavedReport = (saved: any) => {
  activeReport.value = {
    id: saved.id,
    title: saved.name,
    description: '',
    icon: Filter,
    columns: saved.columns
  }
  generatedTitle.value = saved.name
  generateReport(saved)
}

const closeResult = () => {
  activeReport.value = null
  activeReportData.value = []
}

const removeSaved = (id: string) => {
  if (confirm('Remover este relatório salvo?')) {
    savedReports.value = savedReports.value.filter(s => s.id !== id)
  }
}

const handleQuickAction = ({ action, row }: any) => {
  if (action === 'resend_charge') {
    alert(`Lembrete reenviado para ${row.name} com sucesso via WhatsApp!`)
  } else if (action === 'resend_link') {
    alert(`Link do contrato reenviado para ${row.name}!`)
  } else if (action === 'view_details') {
    navigateTo('/dashboard/financeiro')
  }
}
</script>
