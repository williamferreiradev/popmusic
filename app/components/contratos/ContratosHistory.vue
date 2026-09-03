<template>
  <div class="flex-1 flex flex-col gap-6">

    <!-- Barra de Filtros e Busca -->
    <div class="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">

      <!-- Pills de Status -->
      <div class="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar mask-edges w-full md:w-auto">
        <button
          v-for="pill in statusFilters"
          :key="pill.value"
          class="px-4 py-1.5 rounded-full text-sm font-bold transition-colors whitespace-nowrap border"
          :class="activeStatus === pill.value ? 'bg-primary text-white border-primary' : 'bg-transparent border-light-border dark:border-dark-border text-light-text/70 dark:text-offwhite/70 hover:bg-light-surface dark:hover:bg-dark-surface'"
          @click="activeStatus = pill.value"
        >
          {{ pill.label }}
        </button>
      </div>

      <!-- Busca -->
      <div class="w-full md:w-64 shrink-0">
        <BaseInput
          v-model="searchQuery"
          placeholder="Buscar aluno..."
          type="text"
        >
          <template #icon>
            <Search class="w-4 h-4" />
          </template>
        </BaseInput>
      </div>
    </div>

    <div class="flex items-center justify-between text-sm text-light-text/60 dark:text-offwhite/60">
      <span>Mostrando {{ contractHistoryTotal ? (currentPage - 1) * pageSize + 1 : 0 }} a {{ Math.min((currentPage - 1) * pageSize + filteredContracts.length, contractHistoryTotal) }} de {{ contractHistoryTotal }}</span>
      <div class="flex gap-2">
        <button class="px-4 py-2 rounded-md border border-light-border dark:border-dark-border disabled:opacity-40" :disabled="currentPage === 1" @click="currentPage--">Anterior</button>
        <button class="px-4 py-2 rounded-md border border-light-border dark:border-dark-border disabled:opacity-40" :disabled="currentPage >= totalPages" @click="currentPage++">Próximo</button>
      </div>
    </div>

    <!-- Tabela -->
    <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl shadow-sm flex flex-col flex-1">
      <div class="overflow-x-auto min-h-[300px] pb-16">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-light-bg/50 dark:bg-dark-bg/50 border-b border-light-border dark:border-dark-border">
              <th class="p-4 text-xs font-bold text-light-text/60 dark:text-offwhite/60 uppercase tracking-wider">Aluno</th>
              <th class="p-4 text-xs font-bold text-light-text/60 dark:text-offwhite/60 uppercase tracking-wider">Data de Envio</th>
              <th class="p-4 text-xs font-bold text-light-text/60 dark:text-offwhite/60 uppercase tracking-wider">Status</th>
              <th class="p-4 text-xs font-bold text-light-text/60 dark:text-offwhite/60 uppercase tracking-wider">Aceite / Expiração</th>
              <th class="p-4 text-xs font-bold text-light-text/60 dark:text-offwhite/60 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-light-border/50 dark:divide-dark-border/50">

            <tr
              v-for="item in filteredContracts"
              :key="item.id"
              class="hover:bg-light-bg/50 dark:hover:bg-dark-bg/50 transition-colors group relative"
            >
              <td class="p-4">
                <p class="text-sm font-bold text-light-text dark:text-offwhite" :class="{'line-through opacity-50': item.status === 'expirado'}">{{ item.studentName }}</p>
                <p class="text-xs text-light-text/50 dark:text-offwhite/50">Contrato {{ item.id.slice(0, 8).toUpperCase() }}</p>
              </td>
              <td class="p-4 text-sm text-light-text/80 dark:text-offwhite/80">
                {{ formatDateTime(item.sentAt) }}
              </td>
              <td class="p-4">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold"
                  :class="getStatusBadgeClass(item.status)"
                >
                  <Clock v-if="item.status === 'aguardando'" class="w-3.5 h-3.5" />
                  <CheckCircle2 v-else-if="item.status === 'aceito'" class="w-3.5 h-3.5" />
                  <AlertCircle v-else-if="item.status === 'vencendo' || item.status === 'vencido'" class="w-3.5 h-3.5" />
                  <XCircle v-else class="w-3.5 h-3.5" />
                  {{ getStatusLabel(item.status) }}
                </span>
              </td>
              <td class="p-4 text-sm text-light-text/80 dark:text-offwhite/80">
                <template v-if="item.status === 'aceito' || item.status === 'renovado' || item.status === 'vencendo' || item.status === 'vencido'">
                  <span class="text-green-600 dark:text-green-500 font-medium">{{ formatDateTime(item.acceptedAt!) }}</span>
                </template>
                <template v-else-if="item.status === 'aguardando'">
                  <span class="text-light-text/50 dark:text-offwhite/50">Expira: {{ formatDate(item.expiresAt) }}</span>
                </template>
                <template v-else>
                  <span class="text-light-text/40 dark:text-offwhite/40">Expirado em {{ formatDate(item.expiresAt) }}</span>
                </template>
              </td>
              <td class="p-4 text-right">

                <button
                  class="p-2 rounded-md text-light-text/50 dark:text-offwhite/50 hover:bg-light-bg dark:hover:bg-dark-bg hover:text-light-text dark:hover:text-offwhite transition-colors focus:outline-none"
                  :class="openMenuId === item.id ? 'bg-light-bg dark:bg-dark-bg text-light-text dark:text-offwhite' : ''"
                  @click.stop="toggleMenu(item.id)"
                >
                  <MoreHorizontal class="w-4 h-4" />
                </button>

                <!-- Dropdown Menu -->
                <div
                  v-if="openMenuId === item.id"
                  class="absolute right-8 top-full mt-1 w-56 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-2xl overflow-hidden z-50 py-1.5 ring-1 ring-black/10"
                  @click.stop
                >
                  <button class="w-full text-left px-4 py-2.5 text-sm hover:bg-light-bg dark:hover:bg-dark-bg text-light-text dark:text-offwhite transition-colors flex items-center gap-2.5 font-medium" @click="openViewContract(item)">
                    <FileText class="w-4 h-4 text-primary" /> Ver contrato
                  </button>

                  <button v-if="item.status === 'aguardando' || item.status === 'expirado'" class="w-full text-left px-4 py-2.5 text-sm hover:bg-light-bg dark:hover:bg-dark-bg text-light-text dark:text-offwhite transition-colors flex items-center gap-2.5 font-medium" @click="openResendLink(item)">
                    <Send class="w-4 h-4 text-gold" /> Reenviar link
                  </button>

                  <button v-if="item.status === 'aceito' || item.status === 'vencendo' || item.status === 'vencido'" class="w-full text-left px-4 py-2.5 text-sm hover:bg-light-bg dark:hover:bg-dark-bg text-light-text dark:text-offwhite transition-colors flex items-center gap-2.5 font-medium" @click="downloadReceipt(item)">
                    <Download class="w-4 h-4 text-green-500" /> Baixar comprovante
                  </button>

                  <button v-if="item.status === 'vencendo' || item.status === 'vencido'" class="w-full text-left px-4 py-2.5 text-sm hover:bg-gold/10 dark:hover:bg-gold/20 text-gold transition-colors flex items-center gap-2.5 font-medium" @click="openRenewContract(item)">
                    <RefreshCw class="w-4 h-4" /> Iniciar renovação
                  </button>
                </div>
              </td>
            </tr>

            <!-- Estado Vazio -->
            <tr v-if="filteredContracts.length === 0">
              <td colspan="5" class="p-12 text-center text-light-text/50 dark:text-offwhite/50">
                <FileX class="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p class="font-medium text-lg text-light-text dark:text-offwhite">
                  {{ activeStatus === 'todos' ? 'Nenhum contrato encontrado.' : 'Nenhum contrato neste status no momento.' }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ResendContractModal
      :is-open="isResendModalOpen"
      :contract-id="selectedContractId"
      @close="isResendModalOpen = false; selectedContractId = null"
      @confirm="handleResendConfirm"
    />

    <RenewContractModal
      :is-open="isRenewModalOpen"
      :contract="selectedContractForRenew"
      @close="isRenewModalOpen = false; selectedContractForRenew = null"
      @confirm="handleRenewConfirm"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, MoreHorizontal, FileText, Send, Download, RefreshCw, Clock, CheckCircle2, AlertCircle, XCircle, FileX } from '@lucide/vue'
import BaseInput from '../BaseInput.vue'
import ResendContractModal from '../modals/ResendContractModal.vue'
import RenewContractModal from '../modals/RenewContractModal.vue'
import { useContratos, type Contract } from '../../composables/useContratos'

const route = useRoute()
const router = useRouter()
const { contractHistory, contractHistoryTotal, fetchContractHistory, resendLink, renewContract } = useContratos()

const currentPage = ref(1)
const pageSize = 10
const totalPages = computed(() => Math.max(1, Math.ceil(contractHistoryTotal.value / pageSize)))

onMounted(async () => {
  await fetchContractHistory(currentPage.value, pageSize, activeStatus.value, searchQuery.value)
})

const statusFilters = [
  { label: 'Todos', value: 'todos' },
  { label: 'Aguardando assinatura', value: 'aguardando' },
  { label: 'Aceitos', value: 'aceito' },
  { label: 'Expirados', value: 'expirado' },
  { label: 'Vencendo em 30 dias', value: 'vencendo' }
]

const activeStatus = ref(
  (route.query.filter as string) || 'todos'
)
const searchQuery = ref('')

// Sincroniza filtro com URL (opcional para UX)
watch(activeStatus, (newVal) => {
  const q = { ...route.query, filter: newVal === 'todos' ? undefined : newVal }
  router.push({ query: q })
})

const filteredContracts = computed(() => {
  return contractHistory.value
})

watch([activeStatus, searchQuery], async () => {
  currentPage.value = 1
  await fetchContractHistory(1, pageSize, activeStatus.value, searchQuery.value)
})

watch(currentPage, async page => {
  await fetchContractHistory(page, pageSize, activeStatus.value, searchQuery.value)
})

// Formatadores
const formatDateTime = (isoStr: string) => {
  const d = new Date(isoStr)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
const formatDate = (isoStr: string) => {
  const d = new Date(isoStr)
  return d.toLocaleDateString('pt-BR')
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    aguardando: 'Aguardando',
    aceito: 'Aceito',
    expirado: 'Expirado',
    vencendo: 'Vencendo',
    vencido: 'Vencido',
    renovado: 'Renovado'
  }
  return map[status] || status
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'aguardando': return 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20'
    case 'aceito': return 'bg-green-500/10 text-green-600 dark:text-green-500 border border-green-500/20'
    case 'vencendo': return 'bg-gold/10 text-gold border border-gold/20'
    case 'vencido': return 'bg-red-500/10 text-red-500 border border-red-500/20'
    case 'expirado': return 'bg-light-border dark:bg-dark-border text-light-text/60 dark:text-offwhite/60'
    case 'renovado': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
    default: return ''
  }
}

// Menu de Ações
const openMenuId = ref<string | null>(null)
const toggleMenu = (id: string) => {
  openMenuId.value = openMenuId.value === id ? null : id
}
const closeMenu = () => {
  openMenuId.value = null
}
onMounted(() => window.addEventListener('click', closeMenu))
onUnmounted(() => window.removeEventListener('click', closeMenu))

// Ações
const openViewContract = (c: Contract) => {
  window.open(`/assinar/${c.token}`, '_blank')
  closeMenu()
}

const isResendModalOpen = ref(false)
const selectedContractId = ref<string | null>(null)
const openResendLink = (c: Contract) => {
  selectedContractId.value = c.id
  isResendModalOpen.value = true
  closeMenu()
}
const handleResendConfirm = async (contractId: string) => {
  const result = await resendLink(contractId)
  await fetchContractHistory(currentPage.value, pageSize, activeStatus.value, searchQuery.value)
  isResendModalOpen.value = false
  selectedContractId.value = null
  alert(result.success ? 'Link reenviado por e-mail com sucesso!' : result.message)
}

const downloadReceipt = (c: Contract) => {
  window.open(`/assinar/${c.token}`, '_blank')
  closeMenu()
}

const isRenewModalOpen = ref(false)
const selectedContractForRenew = ref<Contract | null>(null)
const openRenewContract = (c: Contract) => {
  selectedContractForRenew.value = c
  isRenewModalOpen.value = true
  closeMenu()
}
const handleRenewConfirm = async (data: { id: string, amount: number, day: number }) => {
  const result = await renewContract(data.id, data.amount, data.day)
  await fetchContractHistory(currentPage.value, pageSize, activeStatus.value, searchQuery.value)
  isRenewModalOpen.value = false
  selectedContractForRenew.value = null
  alert(result.success ? 'Renovação criada e enviada por e-mail com sucesso!' : result.message)
}
</script>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.mask-edges {
  mask-image: linear-gradient(to right, transparent, black 10px, black calc(100% - 10px), transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 10px, black calc(100% - 10px), transparent);
}
</style>
