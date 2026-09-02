<template>
  <div class="p-8 w-full flex flex-col gap-6 min-h-[calc(100vh-theme(spacing.16))]">
    
    <!-- Cabeçalho Principal e Abas de Navegação -->
    <div class="flex flex-col gap-4 border-b border-light-border dark:border-dark-border pb-4">
      
      <!-- Título -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-light-text dark:text-offwhite flex items-center gap-2">
            <BarChart3 class="w-6 h-6 text-primary" />
            Relatórios
          </h1>
          <p class="text-sm text-light-text/70 dark:text-offwhite/70">
            Acompanhe métricas, alunos e resultados de toda a escola.
          </p>
        </div>
      </div>

      <!-- Abas Horizontais -->
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
        <div v-if="isLoadingTab" class="w-full flex flex-col gap-4 animate-pulse">
          <div class="h-10 w-full bg-light-border dark:bg-dark-border rounded-md"></div>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
             <div class="h-28 w-full bg-light-border dark:bg-dark-border rounded-xl"></div>
             <div class="h-28 w-full bg-light-border dark:bg-dark-border rounded-xl"></div>
             <div class="h-28 w-full bg-light-border dark:bg-dark-border rounded-xl"></div>
             <div class="h-28 w-full bg-light-border dark:bg-dark-border rounded-xl"></div>
          </div>
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
import { BarChart3 } from '@lucide/vue'
import { useRoute, useRouter } from 'vue-router'

import RelatoriosProntos from '~/components/relatorios/RelatoriosProntos.vue'
import RelatoriosConstrutor from '~/components/relatorios/RelatoriosConstrutor.vue'

type TabId = 'prontos' | 'construtor'

const tabs: { id: TabId, label: string, component: any }[] = [
  { id: 'prontos', label: 'Relatórios Prontos', component: RelatoriosProntos },
  { id: 'construtor', label: 'Construtor Personalizado', component: RelatoriosConstrutor }
]

const route = useRoute()
const router = useRouter()

const activeTab = ref<TabId>('prontos')
const isLoadingTab = ref(false)

const activeComponent = computed(() => {
  return tabs.find(t => t.id === activeTab.value)?.component || RelatoriosProntos
})

const switchTab = (tabId: TabId) => {
  if (activeTab.value === tabId) return
  
  router.push({ query: { ...route.query, tab: tabId } })
  
  isLoadingTab.value = true
  activeTab.value = tabId
  
  setTimeout(() => {
    isLoadingTab.value = false
  }, 150)
}

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
