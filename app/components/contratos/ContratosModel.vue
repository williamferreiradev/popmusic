<template>
  <div class="flex-1 flex flex-col md:flex-row gap-6">
    
    <!-- Painel do Editor -->
    <div class="flex-1 flex flex-col bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl shadow-sm overflow-hidden">
      
      <!-- Toolbar Simples -->
      <div class="flex items-center justify-between p-3 border-b border-light-border dark:border-dark-border bg-light-bg/50 dark:bg-dark-bg/50">
        <div class="flex items-center gap-2">
          <!-- Botoes Mock de Formatação -->
          <button class="p-1.5 rounded hover:bg-light-border dark:hover:bg-dark-border text-light-text/70 dark:text-offwhite/70 transition-colors font-bold" title="Negrito">B</button>
          <button class="p-1.5 rounded hover:bg-light-border dark:hover:bg-dark-border text-light-text/70 dark:text-offwhite/70 transition-colors italic font-serif" title="Itálico">I</button>
          <div class="w-px h-5 bg-light-border dark:bg-dark-border mx-1"/>
          <button class="p-1.5 rounded hover:bg-light-border dark:hover:bg-dark-border text-light-text/70 dark:text-offwhite/70 transition-colors" title="Alinhar à esquerda"><AlignLeft class="w-4 h-4" /></button>
          <button class="p-1.5 rounded hover:bg-light-border dark:hover:bg-dark-border text-light-text/70 dark:text-offwhite/70 transition-colors" title="Centralizar"><AlignCenter class="w-4 h-4" /></button>
        </div>
        <div class="flex items-center gap-2">
          <button 
            class="px-3 py-1.5 text-xs font-bold text-light-text dark:text-offwhite hover:bg-light-border dark:hover:bg-dark-border rounded border border-light-border dark:border-dark-border transition-colors flex items-center gap-2"
            @click="isPreviewModalOpen = true"
          >
            <Eye class="w-3.5 h-3.5" />
            Pré-visualizar
          </button>
          <button 
            class="px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded transition-colors shadow-sm flex items-center gap-2"
            @click="confirmSave"
          >
            <Save class="w-3.5 h-3.5" />
            Salvar modelo
          </button>
        </div>
      </div>

      <!-- Editor Real -->
      <textarea 
        ref="editorRef"
        v-model="contractModel"
        class="flex-1 w-full p-6 resize-none outline-none bg-transparent text-sm text-light-text dark:text-offwhite leading-relaxed font-sans"
        placeholder="Escreva o texto do contrato aqui..."
      />
      
    </div>

    <!-- Painel Lateral: Variáveis -->
    <div class="w-full md:w-72 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl shadow-sm p-4 flex flex-col gap-4">
      <div class="flex items-center gap-2 text-gold">
        <FileCode2 class="w-5 h-5" />
        <h3 class="font-bold">Variáveis</h3>
      </div>
      <p class="text-xs text-light-text/70 dark:text-offwhite/70">
        Clique em uma variável para inseri-la no contrato onde o cursor estiver posicionado.
      </p>

      <div class="flex flex-col gap-4 overflow-y-auto pr-1 flex-1">
        
        <div v-for="group in variableGroups" :key="group.title">
          <h4 class="text-xs font-bold text-light-text/50 dark:text-offwhite/50 uppercase tracking-wider mb-2">{{ group.title }}</h4>
          <div class="flex flex-col gap-1.5">
            <button 
              v-for="v in group.vars" 
              :key="v"
              class="text-left px-2 py-1.5 rounded bg-light-bg/50 dark:bg-dark-bg/50 hover:bg-gold/10 hover:text-gold text-xs font-mono text-light-text/80 dark:text-offwhite/80 transition-colors border border-transparent hover:border-gold/30"
              @click="insertVariable(v)"
            >
              {{ v }}
            </button>
          </div>
        </div>

      </div>
    </div>

    <PreviewContractModal 
      :is-open="isPreviewModalOpen"
      :model-text="contractModel"
      @close="isPreviewModalOpen = false"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { AlignLeft, AlignCenter, Eye, Save, FileCode2 } from '@lucide/vue'
import { useContratos } from '../../composables/useContratos'
import PreviewContractModal from '../modals/PreviewContractModal.vue'

const { contractModel, fetchModel, saveModel } = useContratos()
const editorRef = ref<HTMLTextAreaElement | null>(null)
const isPreviewModalOpen = ref(false)

onMounted(async () => {
  await fetchModel()
})

const variableGroups = [
  {
    title: 'Contratante / Responsável',
    vars: [
      '{{nome_contratante}}',
      '{{cpf_contratante}}',
      '{{endereco_contratante}}',
      '{{bairro_contratante}}',
      '{{cidade_contratante}}',
      '{{uf_contratante}}',
      '{{telefone_contratante}}',
      '{{cep_contratante}}',
      '{{data_nascimento_contratante}}'
    ]
  },
  {
    title: 'Aluno',
    vars: [
      '{{nome_aluno}}',
      '{{cpf_aluno}}',
      '{{data_nascimento_aluno}}',
      '{{curso}}'
    ]
  },
  {
    title: 'Aulas e Horários',
    vars: [
      '{{dias_semana}}',
      '{{horario_inicio}}',
      '{{horario_fim}}'
    ]
  },
  {
    title: 'Financeiro e Parcelas',
    vars: [
      '{{valor_mensalidade}}',
      '{{valor_mensalidade_extenso}}',
      '{{valor_total}}',
      '{{valor_total_extenso}}',
      '{{numero_parcelas}}',
      '{{numero_parcelas_extenso}}',
      '{{dia_vencimento}}',
      '{{dia_primeira_parcela}}',
      '{{mes_primeira_parcela}}',
      '{{ano_primeira_parcela}}'
    ]
  },
  {
    title: 'Data e Sistema',
    vars: [
      '{{ano_vigencia}}',
      '{{data_dia}}',
      '{{data_mes}}',
      '{{data_ano}}'
    ]
  }
]

const insertVariable = (variable: string) => {
  if (!editorRef.value) return
  const el = editorRef.value
  const start = el.selectionStart
  const end = el.selectionEnd
  const text = contractModel.value

  const before = text.substring(0, start)
  const after = text.substring(end, text.length)

  contractModel.value = before + variable + after

  // Reposiciona o cursor após inserir a variável
  setTimeout(() => {
    el.focus()
    el.setSelectionRange(start + variable.length, start + variable.length)
  }, 0)
}

const confirmSave = () => {
  if (confirm("Salvar novo modelo de contrato?\n\nEsta alteração não afeta contratos já enviados ou aceitos. Todos os novos contratos gerados a partir de agora usarão este texto.")) {
    saveModel(contractModel.value)
    alert("Modelo salvo com sucesso!") // Toast na prática
  }
}
</script>
