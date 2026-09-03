<template>
  <div class="p-8 w-full flex flex-col gap-6 min-h-[calc(100vh-theme(spacing.16))] relative">
    
    <!-- Cabeçalho Principal e Abas de Navegação -->
    <div class="flex flex-col gap-4 border-b border-light-border dark:border-dark-border pb-4">
      
      <!-- Título -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-light-text dark:text-offwhite flex items-center gap-2">
            <Settings class="w-6 h-6 text-primary" />
            Configurações
          </h1>
          <p class="text-sm text-light-text/70 dark:text-offwhite/70">
            Ajuste as regras de negócio, dados padrão e permissões de acesso do sistema.
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
          class="pb-2 text-sm transition-all whitespace-nowrap relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-t-md"
          :class="activeTab === tab.id ? 'text-primary dark:text-primary-hover font-bold' : 'text-light-text/60 dark:text-offwhite/60 font-medium hover:text-light-text dark:hover:text-offwhite'"
          @click="requestTabSwitch(tab.id)"
        >
          {{ tab.label }}
          <span 
            class="absolute bottom-0 left-0 w-full h-[2px] bg-gold rounded-t-sm transition-transform duration-300 origin-left"
            :class="activeTab === tab.id ? 'scale-x-100' : 'scale-x-0'"
          />
        </button>
      </div>
    </div>

    <!-- Área de Conteúdo (Transição Fade) -->
    <div class="flex-1 flex flex-col relative pb-20">
      <Transition name="fade" mode="out-in">
        <div v-if="isLoadingTab" class="w-full flex flex-col gap-4 animate-pulse">
          <div class="h-10 w-48 bg-light-border dark:bg-dark-border rounded"/>
          <div class="h-64 w-full bg-light-border dark:bg-dark-border rounded-xl"/>
        </div>
        <KeepAlive v-else>
          <component :is="activeComponent" @unsaved-changes="handleUnsavedChanges" />
        </KeepAlive>
      </Transition>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Settings } from '@lucide/vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'

import ConfigEquipe from '~/components/configuracoes/ConfigEquipe.vue'
import ConfigCobrancaContrato from '~/components/configuracoes/ConfigCobrancaContrato.vue'
import ConfigFrequencia from '~/components/configuracoes/ConfigFrequencia.vue'
import ConfigContas from '~/components/configuracoes/ConfigContas.vue'

type TabId = 'equipe' | 'cobranca' | 'frequencia' | 'contas'

const tabs: { id: TabId, label: string, component: any }[] = [
  { id: 'equipe', label: 'Equipe', component: ConfigEquipe },
  { id: 'cobranca', label: 'Cobrança e Contrato', component: ConfigCobrancaContrato },
  { id: 'frequencia', label: 'Frequência', component: ConfigFrequencia },
  { id: 'contas', label: 'Contas Financeiras', component: ConfigContas }
]

const route = useRoute()
const router = useRouter()

const activeTab = ref<TabId>('equipe')
const isLoadingTab = ref(false)
const hasUnsavedChanges = ref(false)

const activeComponent = computed(() => {
  return tabs.find(t => t.id === activeTab.value)?.component || ConfigEquipe
})

const handleUnsavedChanges = (status: boolean) => {
  hasUnsavedChanges.value = status
}

const checkUnsavedAndProceed = (callback: () => void) => {
  if (hasUnsavedChanges.value) {
    const confirmLeave = confirm('Você tem alterações não salvas nesta aba. Deseja sair mesmo assim e perder as alterações?')
    if (confirmLeave) {
      hasUnsavedChanges.value = false
      callback()
    }
  } else {
    callback()
  }
}

const requestTabSwitch = (tabId: TabId) => {
  if (activeTab.value === tabId) return
  
  checkUnsavedAndProceed(() => {
    switchTab(tabId)
  })
}

const switchTab = (tabId: TabId) => {
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
    // We assume if URL changed via back/forward, we should check unsaved as well
    // But since watch doesn't block the actual URL change, we just accept it here or redirect back.
    // For simplicity, we just change the tab. Real navigation guards handle route changes.
    activeTab.value = newTab as TabId
  }
})

// Guarda de Rota para prevenir sair da PÁGINA inteira sem salvar
onBeforeRouteLeave((to, from, next) => {
  if (hasUnsavedChanges.value) {
    const confirmLeave = confirm('Você tem alterações não salvas. Deseja sair mesmo assim e perder as alterações?')
    if (confirmLeave) {
      next()
    } else {
      next(false)
    }
  } else {
    next()
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
