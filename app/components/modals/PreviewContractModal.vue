<template>
  <BaseModal 
    :is-open="isOpen" 
    title="Pré-visualização do Contrato Oficial - Pop Music" 
    max-width="4xl"
    :hide-on-print="false"
    @close="$emit('close')"
  >
    <div class="flex flex-col gap-4 max-h-[82vh]">
      
      <div class="bg-amber-500/10 border-l-4 border-amber-500 p-3 rounded flex items-center justify-between">
        <p class="text-xs sm:text-sm text-amber-800 dark:text-amber-400">
          {{ customData ? 'Confira os dados do contrato antes de imprimir.' : 'Você está visualizando o modelo oficial A4 da Pop Music com dados de exemplo.' }}
        </p>
        <button 
          class="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded shadow transition-colors flex items-center gap-1.5 shrink-0"
          @click="triggerPrint"
        >
          <Printer class="w-3.5 h-3.5" />
          Imprimir / PDF
        </button>
      </div>

      <div class="flex-1 overflow-y-auto bg-gray-100 dark:bg-[#111] p-2 sm:p-4 rounded-lg border border-light-border dark:border-dark-border">
        <PopMusicContractDocument 
          :data="previewData" 
          :signed-info="signedInfo"
          :show-print-button="false"
        />
      </div>

      <div class="flex justify-end gap-3 pt-2 border-t border-light-border dark:border-dark-border">
        <button 
          class="px-6 py-2 bg-light-surface dark:bg-dark-surface hover:bg-light-bg dark:hover:bg-dark-bg text-light-text dark:text-offwhite border border-light-border dark:border-dark-border text-sm font-bold rounded-md transition-colors"
          @click="$emit('close')"
        >
          Fechar
        </button>
      </div>

    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Printer } from '@lucide/vue'
import { printContract } from '~/utils/printContract'
import BaseModal from '../BaseModal.vue'
import PopMusicContractDocument, { type PopMusicContractData, type SignedContractInfo } from '../contratos/PopMusicContractDocument.vue'

const props = defineProps<{
  isOpen: boolean
  modelText?: string
  customData?: PopMusicContractData
  signedInfo?: SignedContractInfo | null
}>()

defineEmits(['close'])

const previewData = computed<PopMusicContractData>(() => {
  if (props.customData) return props.customData

  return {
    nome_contratante: 'Carlos Eduardo da Silva',
    cpf_contratante: '123.456.789-00',
    endereco_contratante: 'Endereço de exemplo do contratante',
    bairro_contratante: 'Pedregal',
    cidade_contratante: 'Novo Gama',
    uf_contratante: 'GO',
    telefone_contratante: '(00) 90000-0000',
    cep_contratante: '72860-000',
    data_nascimento_contratante: '15/04/1985',

    nome_aluno: 'Lucas Silva Pereira',
    data_nascimento_aluno: '20/08/2010',
    cpf_aluno: '987.654.321-11',
    curso: 'Violão & Teclado',

    dias_semana: 'Segunda-feira e Quarta-feira',
    horario_inicio: '14:00',
    horario_fim: '15:00',

    valor_total: '2.160,00',
    valor_total_extenso: 'dois mil cento e sessenta reais',
    numero_parcelas: '12',
    numero_parcelas_extenso: 'doze',
    valor_mensalidade: '180,00',
    valor_mensalidade_extenso: 'cento e oitenta reais',

    dia_primeira_parcela: '12',
    mes_primeira_parcela: 'agosto',
    ano_primeira_parcela: '26',
    dia_vencimento: '10',

    ano_vigencia: '2026',
    data_dia: '12',
    data_mes: 'agosto',
    data_ano: '26'
  }
})

const triggerPrint = async () => {
  const element = document.getElementById('printable-popmusic-contract')
  if (!element) return
  try { await printContract(element) }
  catch (error) { alert(error instanceof Error ? error.message : 'Não foi possível preparar a impressão.') }
}
</script>
