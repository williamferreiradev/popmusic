<template>
  <div class="flex-1 flex flex-col gap-6">
    
    <!-- Barra de Filtros e Ações -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      
      <!-- Mês / Período Atual -->
      <div class="flex items-center gap-2">
        <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border px-4 py-2 rounded-md font-bold text-sm text-light-text dark:text-offwhite flex items-center gap-2">
          <Calendar class="w-4 h-4 text-primary" />
          <span>{{ currentMonthLabel }}</span>
        </div>
        <span class="text-xs text-light-text/60 dark:text-offwhite/60">
          ({{ filteredReceipts.length }} recibo{{ filteredReceipts.length === 1 ? '' : 's' }} emitido{{ filteredReceipts.length === 1 ? '' : 's' }})
        </span>
      </div>

      <!-- Busca -->
      <div class="relative w-full sm:max-w-xs">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-light-text/50 dark:text-offwhite/50" />
        <input 
          type="text" 
          v-model="searchQuery"
          placeholder="Buscar aluno ou recibo..." 
          class="w-full pl-9 pr-4 py-2 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md text-sm text-light-text dark:text-offwhite focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        >
      </div>

    </div>

    <!-- Tabela -->
    <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-light-bg/50 dark:bg-dark-bg/50 border-b border-light-border dark:border-dark-border">
              <th class="p-4 text-xs font-bold text-light-text/60 dark:text-offwhite/60 uppercase tracking-wider">Recibo Nº</th>
              <th class="p-4 text-xs font-bold text-light-text/60 dark:text-offwhite/60 uppercase tracking-wider">Aluno</th>
              <th class="p-4 text-xs font-bold text-light-text/60 dark:text-offwhite/60 uppercase tracking-wider">Valor</th>
              <th class="p-4 text-xs font-bold text-light-text/60 dark:text-offwhite/60 uppercase tracking-wider">Data Pagamento</th>
              <th class="p-4 text-xs font-bold text-light-text/60 dark:text-offwhite/60 uppercase tracking-wider">Forma de Pag.</th>
              <th class="p-4 text-xs font-bold text-light-text/60 dark:text-offwhite/60 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-light-border/50 dark:divide-dark-border/50">
            
            <tr 
              v-for="receipt in filteredReceipts" 
              :key="receipt.id"
              class="hover:bg-light-bg/50 dark:hover:bg-dark-bg/50 transition-colors group"
            >
              <td class="p-4 text-xs font-mono font-bold text-primary">
                {{ receipt.id }}
                <span v-if="receipt.refunded" class="ml-2 rounded bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-500">ESTORNADO</span>
              </td>
              <td class="p-4 text-sm font-bold text-light-text dark:text-offwhite">
                {{ receipt.studentName }}
              </td>
              <td class="p-4 text-sm font-bold text-green-500">
                {{ formatCurrency(receipt.amount) }}
              </td>
              <td class="p-4 text-sm text-light-text/80 dark:text-offwhite/80">
                {{ formatDateBR(receipt.paidAt) }}
              </td>
              <td class="p-4 text-sm text-light-text/80 dark:text-offwhite/80">
                <span class="px-2 py-0.5 rounded text-xs font-bold bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border">
                  {{ receipt.paymentMethod }}
                </span>
              </td>
              <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button 
                    @click="openViewReceiptModal(receipt)"
                    class="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-md transition-colors text-xs font-bold flex items-center gap-1.5"
                    title="Visualizar e Imprimir Recibo Oficial"
                  >
                    <Printer class="w-3.5 h-3.5" />
                    <span>Ver / Imprimir</span>
                  </button>
                  <button 
                    @click="openResendModal(receipt)"
                    :disabled="receipt.refunded"
                    class="p-2 text-primary hover:bg-primary/10 rounded-md transition-colors"
                    :class="receipt.refunded && 'cursor-not-allowed opacity-40'"
                    :title="receipt.refunded ? 'Recibo estornado: reenvio bloqueado' : 'Reenviar Recibo'"
                  >
                    <Send class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
            
            <!-- Estado Vazio -->
            <tr v-if="filteredReceipts.length === 0">
              <td colspan="6" class="p-12 text-center text-light-text/50 dark:text-offwhite/50">
                <FileText class="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p class="font-medium text-lg text-light-text dark:text-offwhite">Nenhum recibo emitido encontrado.</p>
                <p class="text-xs text-light-text/60 dark:text-offwhite/60 mt-1">Ao marcar uma mensalidade como paga, o recibo aparecerá aqui automaticamente.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modais -->
    <ViewReceiptModal 
      :is-open="isViewModalOpen"
      :receipt="selectedReceipt"
      :sending="isSendingReceipt"
      @close="isViewModalOpen = false; selectedReceipt = null"
      @sent="handleSent"
    />

    <ResendReceiptModal 
      :is-open="isResendModalOpen"
      :receipt="selectedReceipt"
      :sending="isSendingReceipt"
      @close="isResendModalOpen = false; selectedReceipt = null"
      @confirm="handleResend"
    />

    <!-- Toast flutuante -->
    <div 
      class="fixed bottom-6 right-6 bg-light-surface dark:bg-dark-surface border-l-4 border-green-500 shadow-xl rounded-r-md px-6 py-3 transition-all duration-300 z-50 flex flex-col"
      :class="toastVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'"
    >
      <p class="text-sm font-bold text-light-text dark:text-offwhite">{{ toastMessage }}</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, Printer, Send, FileText, Calendar } from '@lucide/vue'
import { useFinanceiro, type Receipt } from '../../composables/useFinanceiro'
import ResendReceiptModal from '../modals/ResendReceiptModal.vue'
import ViewReceiptModal from '../modals/ViewReceiptModal.vue'

const { receipts, fetchReceipts } = useFinanceiro()
const searchQuery = ref('')

onMounted(async () => {
  await fetchReceipts()
})

const currentMonthLabel = computed(() => {
  const d = new Date()
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^./, str => str.toUpperCase())
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const formatDateBR = (isoStr: string) => {
  if (!isoStr) return '-'
  const raw = isoStr.slice(0, 10)
  const [y, m, d] = raw.split('-')
  return `${d}/${m}/${y}`
}

const filteredReceipts = computed(() => {
  if (!searchQuery.value) return receipts.value
  const q = searchQuery.value.toLowerCase()
  return receipts.value.filter(r => 
    r.studentName.toLowerCase().includes(q) ||
    r.id.toLowerCase().includes(q) ||
    (r.paymentMethod && r.paymentMethod.toLowerCase().includes(q))
  )
})

// Modais e Toasts
const isViewModalOpen = ref(false)
const isResendModalOpen = ref(false)
const selectedReceipt = ref<Receipt | null>(null)

const openViewReceiptModal = (receipt: Receipt) => {
  selectedReceipt.value = receipt
  isViewModalOpen.value = true
}

const openResendModal = (receipt: Receipt) => {
  selectedReceipt.value = receipt
  isResendModalOpen.value = true
}

const isSendingReceipt = ref(false)
const handleSent = async (method: string) => {
  if (method === 'whatsapp') { showToast('WhatsApp aberto para envio manual do recibo.'); return }
  if (!selectedReceipt.value || isSendingReceipt.value) return
  isSendingReceipt.value = true
  try {
    await $fetch('/api/send-receipt-email',{method:'POST',body:{chargeId:selectedReceipt.value.chargeId}})
    showToast('Recibo enviado por e-mail com sucesso!')
  } catch (error:any) {
    alert(`Não foi possível enviar o recibo. ${error?.data?.statusMessage||error?.message||'Tente novamente.'}`)
  } finally { isSendingReceipt.value=false }
}

const handleResend = async (method: 'whatsapp' | 'email') => {
  isResendModalOpen.value = false
  await handleSent(method)
}

const toastVisible = ref(false)
const toastMessage = ref('')
let toastTimer: any = null

const showToast = (msg: string) => {
  toastMessage.value = msg
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, 3000)
}
</script>
