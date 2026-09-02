<template>
  <BaseModal 
    :is-open="isOpen" 
    title="Comprovante de Pagamento - Recibo Oficial" 
    max-width="2xl"
    :hide-on-print="false"
    @close="$emit('close')"
  >
    <div class="flex flex-col gap-4 max-h-[85vh]">
      
      <!-- Barra Superior com Ações Rápidas -->
      <div class="bg-primary/10 border border-primary/20 p-3 rounded-lg flex items-center justify-between">
        <div class="flex items-center gap-2">
          <CheckCircle class="w-5 h-5 text-green-500" />
          <span class="text-xs sm:text-sm font-bold text-light-text dark:text-offwhite">
            Pagamento Confirmado & Recibo Emitido
          </span>
        </div>
        
        <div class="flex items-center gap-2">
          <button 
            @click="triggerPrint"
            class="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded shadow transition-colors flex items-center gap-1.5"
          >
            <Printer class="w-3.5 h-3.5" />
            Imprimir / PDF
          </button>
        </div>
      </div>

      <!-- Recibo Oficial Timbrado Pop Music (Renderizável e Imprimível) -->
      <div class="flex-1 overflow-y-auto bg-gray-100 dark:bg-[#111] p-3 sm:p-5 rounded-lg border border-light-border dark:border-dark-border">
        
        <div 
          id="printable-popmusic-receipt" 
          class="bg-white text-black p-6 sm:p-8 rounded shadow border border-gray-300 font-sans text-xs leading-relaxed max-w-[650px] mx-auto"
        >
          <!-- Cabeçalho Timbrado -->
          <div class="border-b-2 border-black pb-4 mb-4 flex flex-col items-center text-center">
            <div class="text-center font-extrabold tracking-[0.35em] text-[10px] uppercase text-gray-700 flex items-center justify-center gap-2 w-full">
              <span class="h-[1px] bg-gray-400 flex-1"></span>
              <span>A c a d e m i a &nbsp; d e &nbsp; M ú s i c a</span>
              <span class="h-[1px] bg-gray-400 flex-1"></span>
            </div>
            <h1 class="text-2xl font-black italic tracking-widest text-black my-1">POP MUSIC</h1>
            <p class="text-[9px] text-gray-600">
              {{ school.endereco }} &nbsp;|&nbsp; CNPJ: {{ school.cnpj }} &nbsp;|&nbsp; Tel: {{ school.telefone }}
            </p>
          </div>

          <!-- Título do Recibo e Valor -->
          <div class="flex justify-between items-center bg-gray-50 border border-gray-300 p-3 rounded mb-4">
            <div>
              <span class="text-[10px] font-bold text-gray-500 uppercase">Recibo Nº</span>
              <p class="text-base font-bold font-mono text-black">{{ receipt?.id || 'REC-000001' }}</p>
            </div>
            <div class="text-right">
              <span class="text-[10px] font-bold text-gray-500 uppercase">Valor Recebido</span>
              <p class="text-lg font-black text-green-700">{{ formatCurrency(receipt?.amount || 0) }}</p>
            </div>
          </div>

          <!-- Corpo do Recibo -->
          <div class="space-y-3 text-[11px] text-gray-800 text-justify">
            <p>
              Recebemos de <strong>{{ receipt?.studentName || 'Aluno' }}</strong>
              <span v-if="receipt?.studentCpf">, inscrito(a) no CPF sob o nº <strong>{{ receipt.studentCpf }}</strong></span>,
              a quantia de <strong>{{ formatCurrency(receipt?.amount || 0) }}</strong> (<em>{{ valorExtenso }}</em>),
              referente ao pagamento de: <strong>{{ receipt?.description || 'Mensalidade de Aulas de Música - Pop Music' }}</strong>.
            </p>

            <div class="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded border border-gray-200 text-[10px] my-3">
              <div>
                <strong>Forma de Pagamento:</strong> {{ receipt?.paymentMethod || 'PIX' }}
              </div>
              <div>
                <strong>Data da Quitação:</strong> {{ formatDateBR(receipt?.paidAt || '') }}
              </div>
              <div v-if="receipt?.paymentMethod?.toLowerCase() === 'pix' && school.pix_chave">
                <strong>Chave PIX Recebedora:</strong> {{ school.pix_chave }}
              </div>
              <div>
                <strong>Status:</strong> <span class="text-green-700 font-bold">QUITADO / PAGO</span>
              </div>
            </div>

            <p class="text-[10px] text-gray-600 italic">
              Para maior clareza e validade, firmamos o presente recibo dando plena, geral e irrevogável quitação do valor acima especificado.
            </p>
          </div>

          <!-- Local, Data e Assinatura -->
          <div class="mt-8 pt-4 border-t border-gray-300 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left text-[10px]">
            <div>
              <p>Novo Gama – GO, {{ formatDateExtenso(receipt?.paidAt) }}</p>
              <p class="text-gray-500 text-[9px] mt-0.5">Autenticação Digital: POP-{{ Date.now().toString(36).toUpperCase() }}</p>
            </div>
            
            <div class="flex flex-col items-center">
              <div class="w-48 border-t border-black pt-1">
                <p class="font-bold text-black text-[10px]">{{ school.nome }}</p>
                <p class="text-[8px] text-gray-500">CNPJ: {{ school.cnpj }}</p>
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- Rodapé do Modal -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-light-border dark:border-dark-border">
        
        <!-- Reenvio Direto -->
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <button 
            @click="sendWhatsApp"
            class="flex-1 sm:flex-initial px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-1.5 border border-green-500/20"
          >
            <MessageSquare class="w-3.5 h-3.5" />
            WhatsApp
          </button>
          <button 
            @click="sendEmail"
            class="flex-1 sm:flex-initial px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-1.5 border border-primary/20"
          >
            <Mail class="w-3.5 h-3.5" />
            E-mail
          </button>
        </div>

        <button 
          @click="$emit('close')"
          class="w-full sm:w-auto px-6 py-2 bg-light-surface dark:bg-dark-surface hover:bg-light-bg dark:hover:bg-dark-bg text-light-text dark:text-offwhite border border-light-border dark:border-dark-border text-xs font-bold rounded-md transition-colors"
        >
          Fechar
        </button>
      </div>

    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Printer, CheckCircle, MessageSquare, Mail } from '@lucide/vue'
import BaseModal from '../BaseModal.vue'
import type { Receipt } from '../../composables/useFinanceiro'
import { valorMonetarioPorExtenso } from '~/utils/contractFormatter'

const props = defineProps<{
  isOpen: boolean
  receipt: Receipt | null
}>()

const emit = defineEmits(['close', 'sent'])
const { school, loadSchool } = useSchoolSettings()
await loadSchool()

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

const formatDateBR = (isoStr: string) => {
  if (!isoStr) return '-'
  const [y, m, d] = isoStr.split('-')
  return `${d}/${m}/${y}`
}

const formatDateExtenso = (isoStr?: string) => {
  const d = isoStr ? new Date(isoStr.includes('T') ? isoStr : isoStr + 'T12:00:00') : new Date()
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`
}

const valorExtenso = computed(() => {
  const val = props.receipt?.amount || 0
  return valorMonetarioPorExtenso(val)
})

const triggerPrint = () => {
  if (typeof window === 'undefined') return

  const elem = document.getElementById('printable-popmusic-receipt')
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
          <title>Recibo de Pagamento - Pop Music</title>
          <style>
            @page { size: A4 portrait; margin: 15mm 15mm; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: white; color: black; margin: 0; padding: 20px; }
            .border { border: 1px solid #ccc; }
            .border-b-2 { border-bottom: 2px solid #000; }
            .border-t { border-top: 1px solid #000; }
            .font-bold { font-weight: bold; }
            .font-black { font-weight: 900; }
            .font-mono { font-family: monospace; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-justify { text-align: justify; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .flex { display: flex; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .p-3 { padding: 0.75rem; }
            .p-6 { padding: 1.5rem; }
            .p-8 { padding: 2rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mt-8 { margin-top: 2rem; }
            .bg-gray-50 { background-color: #f9fafb !important; }
            .text-green-700 { color: #15803d !important; }
            .text-gray-800 { color: #1f2937 !important; }
            .text-gray-700 { color: #374151 !important; }
            .text-gray-600 { color: #4b5563 !important; }
            .text-gray-500 { color: #6b7280 !important; }
            .rounded { border-radius: 0.25rem; }
            .shadow { box-shadow: none; }
          </style>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
        </head>
        <body>
          <div style="max-width: 650px; margin: 0 auto;">
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

const sendWhatsApp = () => {
  if (!props.receipt) return
  const msg = encodeURIComponent(
    `*POP MUSIC - COMPROVANTE DE PAGAMENTO*\n\n` +
    `Olá, *${props.receipt.studentName}*!\n` +
    `Confirmamos o recebimento de *${formatCurrency(props.receipt.amount)}* referente a sua mensalidade na Pop Music.\n\n` +
    `📄 Recibo Nº: ${props.receipt.id}\n` +
    `📅 Data: ${formatDateBR(props.receipt.paidAt)}\n` +
    `💳 Forma: ${props.receipt.paymentMethod}\n\n` +
    `Agradecemos a confiança e bons estudos musicais!`
  )
  const phone = (props.receipt.studentPhone || '').replace(/\D/g, '')
  const url = phone ? `https://wa.me/55${phone}?text=${msg}` : `https://wa.me/?text=${msg}`
  window.open(url, '_blank')
  emit('sent', 'whatsapp')
}

const sendEmail = () => {
  emit('sent', 'email')
}
</script>
