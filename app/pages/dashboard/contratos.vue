<template>
  <div class="p-8 w-full flex flex-col gap-6">
    
    <!-- Cabeçalho Principal -->
    <div>
      <h1 class="text-2xl font-bold text-light-text dark:text-offwhite">Contratos</h1>
      <p class="text-sm text-light-text/70 dark:text-offwhite/70">Acompanhe a situação dos contratos, renove matrículas e configure os termos.</p>
    </div>

    <!-- Navegação por Abas -->
    <div class="border-b border-light-border dark:border-dark-border -mx-8 px-8 overflow-x-auto hide-scrollbar">
      <div class="flex items-center min-w-max">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="px-6 py-4 text-sm font-medium transition-all relative whitespace-nowrap outline-none"
          :class="activeTab === tab.id ? 'text-gold' : 'text-light-text/60 dark:text-offwhite/60 hover:text-light-text dark:hover:text-offwhite'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
          
          <!-- Indicador Dourado Inferior -->
          <div 
            v-if="activeTab === tab.id"
            class="absolute bottom-0 left-0 w-full h-0.5 bg-gold"
          />
        </button>
      </div>
    </div>

    <!-- Conteúdo da Aba com Transição -->
    <div class="flex-1 w-full relative h-full">
      <Transition name="fade" mode="out-in">
        <Suspense>
          
          <template #default>
            <KeepAlive>
              <component :is="activeComponent" />
            </KeepAlive>
          </template>
          
          <template #fallback>
            <!-- Skeleton genérico de carregamento para as abas -->
            <div class="flex-1 w-full animate-pulse flex flex-col gap-6">
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="h-28 bg-light-surface dark:bg-dark-surface rounded-xl border border-light-border dark:border-dark-border"/>
                <div class="h-28 bg-light-surface dark:bg-dark-surface rounded-xl border border-light-border dark:border-dark-border"/>
                <div class="h-28 bg-light-surface dark:bg-dark-surface rounded-xl border border-light-border dark:border-dark-border"/>
                <div class="h-28 bg-light-surface dark:bg-dark-surface rounded-xl border border-light-border dark:border-dark-border"/>
              </div>
              <div class="h-[400px] bg-light-surface dark:bg-dark-surface rounded-xl border border-light-border dark:border-dark-border"/>
            </div>
          </template>
          
        </Suspense>
      </Transition>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Lista de abas
const tabs = [
  { id: 'visao-geral', label: 'Visão Geral' },
  { id: 'historico', label: 'Histórico' },
  { id: 'modelo', label: 'Modelo de Contrato' }
]

// Carregamento Preguiçoso (Lazy Load) dos componentes para otimizar performance
const ContratosOverview = defineAsyncComponent(() => import('~/components/contratos/ContratosOverview.vue'))
const ContratosHistory = defineAsyncComponent(() => import('~/components/contratos/ContratosHistory.vue'))
const ContratosModel = defineAsyncComponent(() => import('~/components/contratos/ContratosModel.vue'))

// Controle da aba ativa, inicializado pela URL se presente
const activeTab = ref(
  (route.query.tab as string) || 'visao-geral'
)

// Computa qual componente renderizar baseado na aba
const activeComponent = computed(() => {
  switch (activeTab.value) {
    case 'visao-geral': return ContratosOverview
    case 'historico': return ContratosHistory
    case 'modelo': return ContratosModel
    default: return ContratosOverview
  }
})

// Sincroniza mudança de aba com a URL (param `tab`)
watch(activeTab, (newTab) => {
  router.push({ query: { ...route.query, tab: newTab } })
})
</script>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
