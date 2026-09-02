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
          Você está visualizando o <strong>modelo oficial A4</strong> da Pop Music com dados de exemplo formatados.
        </p>
        <button 
          @click="triggerPrint"
          class="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded shadow transition-colors flex items-center gap-1.5 shrink-0"
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
          @click="$emit('close')"
          class="px-6 py-2 bg-light-surface dark:bg-dark-surface hover:bg-light-bg dark:hover:bg-dark-bg text-light-text dark:text-offwhite border border-light-border dark:border-dark-border text-sm font-bold rounded-md transition-colors"
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

const triggerPrint = () => {
  if (typeof window === 'undefined') return

  const elem = document.getElementById('printable-popmusic-contract')
  if (!elem) {
    window.print()
    return
  }

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (doc) {
    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Contrato Oficial - Pop Music</title>
          <style>
            @page { size: A4 portrait; margin: 8mm 10mm; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: white; color: black; margin: 0; padding: 0; }
            .popmusic-contract-container { width: 100%; max-width: 210mm; margin: 0 auto; background: white; }
            .contract-page { padding: 15px; background: white; color: black; line-height: 1.35; font-size: 11px; }
            .border { border-width: 1px; border-color: #000; }
            .border-t { border-top-width: 1px; border-color: #000; }
            .border-b { border-bottom-width: 1px; border-color: #000; }
            .border-green-300 { border-color: #86efac !important; }
            .border-green-600 { border-color: #16a34a !important; }
            .bg-green-50 { background-color: #f0fdf4 !important; }
            .text-green-900 { color: #14532d !important; }
            .text-green-800 { color: #166534 !important; }
            .text-green-600 { color: #16a34a !important; }
            .font-bold { font-weight: bold; }
            .font-mono { font-family: monospace; }
            .text-center { text-align: center; }
            .text-justify { text-align: justify; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .flex { display: flex; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .gap-3 { gap: 0.75rem; }
            .gap-1 { gap: 0.25rem; }
            .rounded-md { border-radius: 0.375rem; }
            .rounded { border-radius: 0.25rem; }
            .object-cover { object-fit: cover; }
            .w-16 { width: 4rem; }
            .h-16 { height: 4rem; }
            .w-full { width: 100%; }
            .h-full { height: 100%; }
            .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          </style>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
        </head>
        <body>
          <div class="popmusic-contract-container">
            ${elem.innerHTML}
          </div>
        </body>
      </html>
    `)
    doc.close()
    iframe.contentWindow?.focus()
    setTimeout(() => {
      iframe.contentWindow?.print()
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 1500)
    }, 400)
  }
}
</script>
