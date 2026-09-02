<template>
  <div class="p-8 w-full flex flex-col gap-6 min-h-[calc(100vh-theme(spacing.16))]">
    
    <!-- Cabeçalho Principal e Abas de Navegação -->
    <div class="flex flex-col gap-4 border-b border-light-border dark:border-dark-border pb-4">
      
      <!-- Título -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-light-text dark:text-offwhite flex items-center gap-2">
            <Wallet class="w-6 h-6 text-primary" />
            Financeiro
          </h1>
          <p class="text-sm text-light-text/70 dark:text-offwhite/70">
            Acompanhe a saúde financeira, cobranças, repasses e fluxo de caixa da escola.
          </p>
        </div>
      </div>

      <!-- Abas Horizontais (Scroll no mobile) -->
      <div 
        class="flex gap-6 overflow-x-auto hide-scrollbar relative mask-edges"
        role="tablist"
      >
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          role="tab"
          :aria-selected="activeTab === tab.id"
          @click="switchTab(tab.id)"
          class="pb-2 text-sm transition-all whitespace-nowrap relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-t-md"
          :class="activeTab === tab.id ? 'text-primary dark:text-primary-hover font-bold' : 'text-light-text/60 dark:text-offwhite/60 font-medium hover:text-light-text dark:hover:text-offwhite'"
        >
          {{ tab.label }}
          <!-- Sublinhado Dourado com transição -->
          <span 
            class="absolute bottom-0 left-0 w-full h-[2px] bg-gold rounded-t-sm transition-transform duration-300 origin-left"
            :class="activeTab === tab.id ? 'scale-x-100' : 'scale-x-0'"
          ></span>
        </button>
      </div>
    </div>

    <!-- Área de Conteúdo (Transição Fade) -->
    <div class="flex-1 flex flex-col relative">
      <Transition name="fade" mode="out-in">
        <!-- Mostra Skeleton se estiver carregando a aba, senão o componente real -->
        <div v-if="isLoadingTab" class="w-full flex flex-col gap-4 animate-pulse">
          <div class="h-8 w-48 bg-light-border dark:bg-dark-border rounded"></div>
          <div class="h-32 w-full bg-light-border dark:bg-dark-border rounded-xl"></div>
          <div class="h-64 w-full bg-light-border dark:bg-dark-border rounded-xl"></div>
        </div>
        <KeepAlive v-else>
          <component :is="activeComponent" />
        </KeepAlive>
      </Transition>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Wallet } from '@lucide/vue'
import { useRoute, useRouter } from 'vue-router'

import FinanceiroOverview from '~/components/financeiro/FinanceiroOverview.vue'
import FinanceiroCharges from '~/components/financeiro/FinanceiroCharges.vue'
import FinanceiroReceipts from '~/components/financeiro/FinanceiroReceipts.vue'
import FinanceiroTeachers from '~/components/financeiro/FinanceiroTeachers.vue'
import FinanceiroCashflow from '~/components/financeiro/FinanceiroCashflow.vue'

// Definição das Abas
type TabId = 'overview' | 'charges' | 'receipts' | 'teachers' | 'cashflow'

const tabs: { id: TabId, label: string, component: any }[] = [
  { id: 'overview', label: 'Visão Geral', component: FinanceiroOverview },
  { id: 'charges', label: 'Cobranças', component: FinanceiroCharges },
  { id: 'receipts', label: 'Recibos', component: FinanceiroReceipts },
  { id: 'teachers', label: 'Repasse de Professores', component: FinanceiroTeachers },
  { id: 'cashflow', label: 'Fluxo de Caixa', component: FinanceiroCashflow }
]

const route = useRoute()
const router = useRouter()

const activeTab = ref<TabId>('overview')
const isLoadingTab = ref(false)

const activeComponent = computed(() => {
  return tabs.find(t => t.id === activeTab.value)?.component || FinanceiroOverview
})

// Trocar de aba com efeito de loading rápido e URL sync
const switchTab = (tabId: TabId) => {
  if (activeTab.value === tabId) return
  
  // Seta na URL
  router.push({ query: { ...route.query, tab: tabId } })
  
  // Efeito de skeleton
  isLoadingTab.value = true
  activeTab.value = tabId
  
  setTimeout(() => {
    isLoadingTab.value = false
  }, 150) // fake load delay
}

// Sincroniza a URL na carga inicial e mudanças no histórico (botão voltar)
onMounted(() => {
  if (route.query.tab && tabs.some(t => t.id === route.query.tab)) {
    activeTab.value = route.query.tab as TabId
  }
})

watch(() => route.query.tab, (newTab) => {
  if (newTab && newTab !== activeTab.value && tabs.some(t => t.id === newTab)) {
    activeTab.value = newTab as TabId
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Esconde a barra de rolagem mas mantém funcionando */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Sombra leve para indicar rolagem nas bordas no mobile */
.mask-edges {
  mask-image: linear-gradient(to right, transparent, black 10px, black calc(100% - 10px), transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 10px, black calc(100% - 10px), transparent);
}
</style>
