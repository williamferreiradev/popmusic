<template>
  <div class="flex-1 flex flex-col gap-6">
    
    <!-- Se não houver contratos no sistema -->
    <div v-if="contractsList.length === 0" class="flex-1 flex flex-col items-center justify-center bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-12 text-center">
      <FileText class="w-16 h-16 text-light-text/20 dark:text-offwhite/20 mb-4" />
      <h2 class="text-xl font-bold text-light-text dark:text-offwhite mb-2">Nenhum contrato enviado ainda</h2>
      <p class="text-light-text/60 dark:text-offwhite/60 max-w-md mb-6">Você pode iniciar a emissão de contratos no perfil de um aluno ou no momento da matrícula.</p>
      <NuxtLink 
        to="/alunos"
        class="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-md font-bold transition-colors shadow-sm"
      >
        Ir para Alunos
      </NuxtLink>
    </div>

    <!-- Caso existam contratos -->
    <template v-else>
      <!-- Cards Resumo -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div class="bg-light-surface dark:bg-dark-surface p-5 rounded-xl border border-light-border dark:border-dark-border shadow-sm">
          <p class="text-xs font-medium text-light-text/60 dark:text-offwhite/60 mb-2">Aguardando assinatura</p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Clock class="w-5 h-5 text-amber-500" />
            </div>
            <p class="text-2xl font-bold text-light-text dark:text-offwhite">{{ metrics.aguardando }}</p>
          </div>
        </div>
        
        <div class="bg-light-surface dark:bg-dark-surface p-5 rounded-xl border border-light-border dark:border-dark-border shadow-sm">
          <p class="text-xs font-medium text-light-text/60 dark:text-offwhite/60 mb-2">Aceitos este mês</p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 class="w-5 h-5 text-green-500" />
            </div>
            <p class="text-2xl font-bold text-green-500">{{ metrics.aceitosMes }}</p>
          </div>
        </div>
        
        <div class="bg-light-surface dark:bg-dark-surface p-5 rounded-xl border border-light-border dark:border-dark-border shadow-sm border-l-4 border-l-gold">
          <p class="text-xs font-medium text-light-text/60 dark:text-offwhite/60 mb-2">Vencendo em 30 dias</p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
              <AlertCircle class="w-5 h-5 text-gold" />
            </div>
            <p class="text-2xl font-bold text-gold">{{ metrics.vencendo }}</p>
          </div>
        </div>
        
        <div class="bg-light-surface dark:bg-dark-surface p-5 rounded-xl border border-light-border dark:border-dark-border shadow-sm">
          <p class="text-xs font-medium text-light-text/60 dark:text-offwhite/60 mb-2">Taxa de aceite geral</p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <PieChart class="w-5 h-5 text-primary" />
            </div>
            <p class="text-2xl font-bold text-light-text dark:text-offwhite">{{ metrics.taxaAceite }}%</p>
          </div>
        </div>
      </div>

      <!-- Duas Colunas de Listas -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        
        <!-- Aguardando há mais tempo -->
        <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div class="p-4 border-b border-light-border dark:border-dark-border flex justify-between items-center bg-light-bg/50 dark:bg-dark-bg/50">
            <h3 class="font-bold text-light-text dark:text-offwhite flex items-center gap-2">
              <Clock class="w-4 h-4 text-amber-500" /> Aguardando assinatura
            </h3>
            <button class="text-xs font-bold text-primary hover:underline" @click="goToHistory('aguardando')">Ver todos</button>
          </div>
          
          <div class="p-4 flex-1 overflow-y-auto">
            <div v-if="oldestPending.length === 0" class="text-sm text-light-text/50 dark:text-offwhite/50 text-center py-8">
              Nenhum contrato aguardando no momento.
            </div>
            <ul v-else class="space-y-4">
              <li v-for="c in oldestPending" :key="c.id" class="flex items-center justify-between gap-4 p-3 rounded-lg border border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-bg transition-colors">
                <div>
                  <p class="font-bold text-sm text-light-text dark:text-offwhite">{{ c.studentName }}</p>
                  <p class="text-xs text-light-text/60 dark:text-offwhite/60">Enviado em {{ formatDate(c.sentAt) }}</p>
                </div>
                <button 
                  class="shrink-0 px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white rounded transition-colors"
                  @click="selectedContractId = c.id; isResendModalOpen = true"
                >
                  Reenviar link
                </button>
              </li>
            </ul>
          </div>
        </div>

        <!-- Renovações Próximas -->
        <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div class="p-4 border-b border-light-border dark:border-dark-border flex justify-between items-center bg-light-bg/50 dark:bg-dark-bg/50">
            <h3 class="font-bold text-light-text dark:text-offwhite flex items-center gap-2">
              <AlertCircle class="w-4 h-4 text-gold" /> Renovações próximas
            </h3>
            <button class="text-xs font-bold text-gold hover:underline" @click="goToHistory('vencendo')">Ver todos</button>
          </div>
          
          <div class="p-4 flex-1 overflow-y-auto">
            <div v-if="closestExpiring.length === 0" class="text-sm text-light-text/50 dark:text-offwhite/50 text-center py-8">
              Nenhuma renovação prevista para os próximos 30 dias.
            </div>
            <ul v-else class="space-y-4">
              <li v-for="c in closestExpiring" :key="c.id" class="flex items-center justify-between gap-4 p-3 rounded-lg border border-light-border dark:border-dark-border border-l-2 border-l-gold hover:bg-light-bg dark:hover:bg-dark-bg transition-colors">
                <div>
                  <p class="font-bold text-sm text-light-text dark:text-offwhite">{{ c.studentName }}</p>
                  <p class="text-xs text-light-text/60 dark:text-offwhite/60">Vence em {{ formatExpiryDate(c.acceptedAt!) }}</p>
                </div>
                <button 
                  class="shrink-0 px-3 py-1.5 text-xs font-bold text-gold bg-gold/10 hover:bg-gold hover:text-black rounded transition-colors"
                  @click="openRenewModal(c)"
                >
                  Iniciar renovação
                </button>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </template>

    <!-- Modais -->
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FileText, Clock, CheckCircle2, AlertCircle, PieChart } from '@lucide/vue'
import { useContratos, type Contract } from '../../composables/useContratos'
import ResendContractModal from '../modals/ResendContractModal.vue'
import RenewContractModal from '../modals/RenewContractModal.vue'

const router = useRouter()
const { contractsList, metrics, oldestPending, closestExpiring, fetchContracts, fetchModel, resendLink, renewContract } = useContratos()

onMounted(async () => {
  await Promise.all([fetchContracts(), fetchModel()])
})

const goToHistory = (filter: string) => {
  router.push({ query: { tab: 'historico', filter } })
}

const formatDate = (isoStr: string) => {
  if (!isoStr) return '-'
  const d = new Date(isoStr)
  return d.toLocaleDateString('pt-BR')
}

const formatExpiryDate = (acceptedStr: string) => {
  if (!acceptedStr) return '-'
  const d = new Date(acceptedStr)
  d.setFullYear(d.getFullYear() + 1)
  return d.toLocaleDateString('pt-BR')
}

// Lógica de Modais
const isResendModalOpen = ref(false)
const selectedContractId = ref<string | null>(null)

const isRenewModalOpen = ref(false)
const selectedContractForRenew = ref<Contract | null>(null)

const openRenewModal = (c: Contract) => {
  selectedContractForRenew.value = c
  isRenewModalOpen.value = true
}

const handleResendConfirm = async (contractId: string) => {
  const result = await resendLink(contractId)
  isResendModalOpen.value = false
  selectedContractId.value = null
  alert(result.success ? 'Link reenviado por e-mail com sucesso!' : result.message)
}

const handleRenewConfirm = async (data: { id: string, amount: number, day: number }) => {
  const result = await renewContract(data.id, data.amount, data.day)
  isRenewModalOpen.value = false
  selectedContractForRenew.value = null
  alert(result.success ? 'Renovação criada e enviada por e-mail com sucesso!' : result.message)
}
</script>
