<template>
  <div class="flex flex-col md:flex-row gap-6 items-start">
    
    <!-- Painel de Filtros (Esquerda) -->
    <div class="w-full md:w-80 flex-shrink-0 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-5 flex flex-col gap-5">
      
      <div>
        <h3 class="font-bold text-lg text-light-text dark:text-offwhite mb-1 flex items-center gap-2">
          <Filter class="w-5 h-5 text-primary" />
          Filtros
        </h3>
        <p class="text-xs text-light-text/60 dark:text-offwhite/60">Combine critérios para gerar relatórios personalizados.</p>
      </div>

      <!-- Passo 1: Origem dos Dados -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-semibold text-light-text dark:text-offwhite">Origem dos dados <span class="text-primary">*</span></label>
        <div class="flex flex-col gap-2">
          <label v-for="origin in origins" :key="origin.id" class="flex items-center gap-3 p-2 rounded-md hover:bg-light-border/20 dark:hover:bg-dark-border/20 cursor-pointer transition-colors" :class="{ 'bg-primary/10 dark:bg-primary/20': selectedOrigin === origin.id }">
            <input 
              type="radio" 
              name="origin" 
              :value="origin.id" 
              v-model="selectedOrigin"
              class="text-primary focus:ring-primary h-4 w-4"
              @change="clearFilters"
            />
            <span class="text-sm font-medium text-light-text dark:text-offwhite">{{ origin.label }}</span>
          </label>
        </div>
      </div>

      <div class="h-px w-full bg-light-border dark:bg-dark-border"></div>

      <!-- Passo 2: Filtros Condicionais -->
      <div class="flex flex-col gap-4 min-h-[250px]" v-if="selectedOrigin">
        
        <!-- Filtros de Alunos -->
        <template v-if="selectedOrigin === 'alunos'">
          <BaseSelect v-model="filters.status" label="Status" :options="[ {label: 'Ativo', value: 'ativo'}, {label: 'Pendente', value: 'pendente'}, {label: 'Inadimplente', value: 'inadimplente'}, {label: 'Cancelado', value: 'cancelado'} ]" />
          <BaseSelect v-model="filters.modality" label="Modalidade" :options="[ {label: 'Violão', value: 'violao'}, {label: 'Teclado', value: 'teclado'} ]" />
          <BaseSelect v-model="filters.teacher" label="Professor" :options="[ {label: 'Carlos', value: 'carlos'}, {label: 'Marina', value: 'marina'} ]" />
        </template>

        <!-- Filtros de Frequência -->
        <template v-if="selectedOrigin === 'frequencia'">
          <BaseSelect v-model="filters.class" label="Turma" :options="[ {label: 'Violão Iniciante', value: '1'}, {label: 'Teclado Avançado', value: '2'} ]" />
          <BaseSelect v-model="filters.teacher" label="Professor" :options="[ {label: 'Carlos', value: 'carlos'} ]" />
          <BaseSelect v-model="filters.percentage" label="Faixa de Presença" :options="[ {label: 'Menor que 50%', value: '<50'}, {label: 'Entre 50% e 75%', value: '50-75'}, {label: 'Maior que 75%', value: '>75'} ]" />
        </template>

        <!-- Filtros de Financeiro -->
        <template v-if="selectedOrigin === 'financeiro'">
          <BaseSelect v-model="filters.status" label="Status da cobrança" :options="[ {label: 'Paga', value: 'paga'}, {label: 'Atrasada', value: 'atrasada'}, {label: 'Pendente', value: 'pendente'} ]" />
          <BaseSelect v-model="filters.paymentMethod" label="Forma de pagamento" :options="[ {label: 'Pix', value: 'pix'}, {label: 'Boleto', value: 'boleto'}, {label: 'Cartão', value: 'cartao'} ]" />
        </template>

        <!-- Filtros de Contratos -->
        <template v-if="selectedOrigin === 'contratos'">
          <BaseSelect v-model="filters.status" label="Status" :options="[ {label: 'Aguardando', value: 'aguardando'}, {label: 'Aceito', value: 'aceito'}, {label: 'Expirado', value: 'expirado'} ]" />
        </template>

        <!-- Filtros de Repasses -->
        <template v-if="selectedOrigin === 'repasses'">
          <BaseSelect v-model="filters.teacher" label="Professor" :options="[ {label: 'Carlos', value: 'carlos'}, {label: 'Marina', value: 'marina'} ]" />
          <BaseSelect v-model="filters.status" label="Status" :options="[ {label: 'Pago', value: 'pago'}, {label: 'Pendente', value: 'pendente'} ]" />
        </template>

      </div>
      
      <div v-else class="min-h-[250px] flex items-center justify-center text-center text-sm text-light-text/40 dark:text-offwhite/40 px-4">
        Selecione uma origem de dados para ver os filtros disponíveis.
      </div>

      <!-- Ações -->
      <div class="mt-auto pt-4 flex flex-col gap-2">
        <BaseButton variant="primary" class="w-full" @click="generateReport" :disabled="!selectedOrigin">
          Gerar relatório
        </BaseButton>
        <BaseButton variant="outline" class="w-full border-transparent" @click="clearFilters">
          Limpar filtros
        </BaseButton>
      </div>

    </div>

    <!-- Área de Resultados (Direita) -->
    <div class="flex-1 w-full flex flex-col min-h-[400px]">
      
      <!-- Estado Inicial -->
      <div v-if="!hasGenerated" class="flex-1 bg-light-surface/50 dark:bg-dark-surface/50 border border-dashed border-light-border dark:border-dark-border rounded-xl flex items-center justify-center p-8 transition-colors">
        <div class="flex flex-col items-center gap-4 text-light-text/40 dark:text-offwhite/40 text-center max-w-sm">
          <Filter class="w-12 h-12" />
          <p class="font-medium text-lg text-light-text/60 dark:text-offwhite/60">Monte os filtros ao lado e clique em "Gerar relatório".</p>
          <p class="text-sm">Os resultados aparecerão aqui e poderão ser exportados.</p>
        </div>
      </div>

      <!-- Painel de Resultado -->
      <div v-else class="animate-in fade-in slide-in-from-right-4 duration-500 w-full flex flex-col gap-4">
        
        <div v-if="isLoading" class="w-full flex flex-col gap-4 animate-pulse">
          <div class="h-8 w-64 bg-light-border dark:bg-dark-border rounded"></div>
          <div class="h-10 w-full bg-light-border dark:bg-dark-border rounded-md"></div>
          <div class="h-10 w-full bg-light-border dark:bg-dark-border rounded-md"></div>
          <div class="h-10 w-full bg-light-border dark:bg-dark-border rounded-md"></div>
        </div>

        <template v-else>
          <div class="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-primary text-white rounded-md">
                <Bookmark class="w-4 h-4" />
              </div>
              <div>
                <p class="text-sm font-semibold text-light-text dark:text-offwhite">Salvar este filtro como relatório rápido?</p>
                <p class="text-xs text-light-text/60 dark:text-offwhite/60">Ele aparecerá na aba "Relatórios Prontos" para fácil acesso futuro.</p>
              </div>
            </div>
            <BaseButton variant="outline" size="sm" @click="showSaveModal = true" class="whitespace-nowrap">
              Salvar Filtro
            </BaseButton>
          </div>

          <RelatoriosResultTable 
            :title="`Relatório Personalizado (${originLabel})`"
            :columns="tableColumns"
            :data="tableData"
            @close="hasGenerated = false"
          />
        </template>
      </div>

    </div>

    <!-- Modal Salvar Filtro -->
    <BaseModal :isOpen="showSaveModal" title="Salvar Relatório Rápido" @close="showSaveModal = false">
      <div class="p-5 flex flex-col gap-6">
        <p class="text-sm text-light-text/70 dark:text-offwhite/70">Dê um nome a este relatório para encontrá-lo facilmente depois.</p>
        <BaseInput v-model="newReportName" label="Nome do Relatório" placeholder="Ex: Inadimplentes Violão Manhã" />
        <div class="flex items-center justify-end gap-3 pt-4">
          <BaseButton variant="outline" @click="showSaveModal = false">Cancelar</BaseButton>
          <BaseButton variant="primary" @click="saveFilter" :disabled="!newReportName">Salvar</BaseButton>
        </div>
      </div>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Filter, Bookmark } from '@lucide/vue'
import BaseSelect from '../BaseSelect.vue'
import BaseButton from '../BaseButton.vue'
import BaseInput from '../BaseInput.vue'
import BaseModal from '../BaseModal.vue'
import RelatoriosResultTable, { type TableColumn } from './RelatoriosResultTable.vue'

const origins = [
  { id: 'alunos', label: 'Alunos' },
  { id: 'frequencia', label: 'Frequência' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'contratos', label: 'Contratos' },
  { id: 'repasses', label: 'Repasses' }
]

const selectedOrigin = ref('')
const filters = ref<Record<string, any>>({})
const hasGenerated = ref(false)
const isLoading = ref(false)

const showSaveModal = ref(false)
const newReportName = ref('')

const originLabel = computed(() => {
  return origins.find(o => o.id === selectedOrigin.value)?.label || ''
})

const clearFilters = () => {
  filters.value = {}
  hasGenerated.value = false
}

// Configurações de colunas mockadas por origem
const columnsMap: Record<string, TableColumn[]> = {
  alunos: [
    { key: 'name', label: 'Nome' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'modality', label: 'Modalidade' },
    { key: 'date', label: 'Data de Matrícula' },
    { key: 'age', label: 'Idade' }
  ],
  frequencia: [
    { key: 'name', label: 'Nome' },
    { key: 'class', label: 'Turma' },
    { key: 'teacher', label: 'Professor' },
    { key: 'percentage', label: '% de presença' },
    { key: 'absences', label: 'Faltas no período' }
  ],
  financeiro: [
    { key: 'name', label: 'Aluno' },
    { key: 'amount', label: 'Valor' },
    { key: 'dueDate', label: 'Vencimento' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'method', label: 'Forma de pagamento' }
  ],
  contratos: [
    { key: 'name', label: 'Aluno' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'sent', label: 'Data de envio' },
    { key: 'accepted', label: 'Data de aceite' }
  ],
  repasses: [
    { key: 'teacher', label: 'Professor' },
    { key: 'name', label: 'Aluno' },
    { key: 'classes', label: 'Aulas no período' },
    { key: 'amount', label: 'Valor' }
  ]
}

const tableColumns = ref<TableColumn[]>([])
const tableData = ref<any[]>([])

const generateReport = () => {
  if (!selectedOrigin.value) return
  
  hasGenerated.value = true
  isLoading.value = true
  tableColumns.value = columnsMap[selectedOrigin.value] || []

  setTimeout(() => {
    // Dados mockados genéricos para demonstração
    tableData.value = [
      { name: 'João Silva', status: 'Ativo', modality: 'Violão', date: '01/05/2026', age: 24, class: 'Violão Básico', teacher: 'Carlos', percentage: '90%', absences: 1, amount: 'R$ 150,00', dueDate: '10/07/2026', method: 'Pix', sent: '05/05/2026', accepted: '06/05/2026', classes: 4 },
      { name: 'Maria Souza', status: 'Pendente', modality: 'Teclado', date: '10/06/2026', age: 18, class: 'Teclado Iniciante', teacher: 'Marina', percentage: '100%', absences: 0, amount: 'R$ 180,00', dueDate: '15/07/2026', method: 'Boleto', sent: '10/06/2026', accepted: '-', classes: 2 }
    ]
    isLoading.value = false
  }, 600)
}

const saveFilter = () => {
  alert(`Filtro "${newReportName.value}" salvo com sucesso! (Aparecerá na aba de Relatórios Prontos)`)
  showSaveModal.value = false
  newReportName.value = ''
}
</script>
