<template>
  <aside class="w-[72px] md:w-[220px] h-screen bg-light-surface dark:bg-dark-surface border-r border-light-border dark:border-dark-border fixed left-0 top-0 flex flex-col font-sans shrink-0 transition-all duration-300 z-40">
    <!-- Logo ou nome da escola -->
    <div class="h-16 hidden md:flex flex-col justify-center px-6 border-b border-light-border dark:border-dark-border">
      <h1 class="text-lg font-bold text-light-text dark:text-offwhite leading-tight">Pop Music</h1>
      <span class="text-[10px] uppercase font-bold text-primary tracking-wider">Área do Professor</span>
    </div>

    <!-- Navegação -->
    <nav class="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
      <NuxtLink 
        v-for="item in menuItems" 
        :key="item.path"
        :to="item.path"
        class="flex items-center justify-center md:justify-start md:gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors"
        :class="[
          route.path === item.path 
            ? 'bg-primary text-white' 
            : 'text-light-text/70 dark:text-offwhite/70 hover:bg-light-bg dark:hover:bg-dark-bg hover:text-light-text dark:hover:text-offwhite'
        ]"
      >
        <component :is="item.icon" class="w-4 h-4" />
        <span class="hidden md:inline">{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <!-- Rodapé: Usuário e Ações -->
    <div class="p-2 md:p-4 border-t border-light-border dark:border-dark-border flex flex-col gap-4">
      
      <!-- Ações rápidas -->
      <div class="flex flex-col md:flex-row items-center gap-2">
        <button 
          @click="toggleTheme" 
          class="flex-1 flex items-center justify-center gap-2 p-2 rounded-md bg-light-bg dark:bg-dark-bg hover:bg-gray-200 dark:hover:bg-[#2A2422] transition-colors text-xs font-medium text-light-text dark:text-offwhite border border-light-border dark:border-dark-border"
          title="Alternar Tema"
        >
          <Sun v-if="colorMode.value === 'dark'" class="w-4 h-4" />
          <Moon v-else class="w-4 h-4" />
          <span class="hidden md:inline">Tema</span>
        </button>
        
        <button 
          @click="handleLogout"
          class="flex-1 flex items-center justify-center gap-2 p-2 rounded-md bg-light-bg dark:bg-dark-bg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-[#ff8a8a] transition-colors text-xs font-medium border border-light-border dark:border-dark-border"
          title="Sair da conta"
        >
          <LogOut class="w-4 h-4" />
          <span class="hidden md:inline">Sair</span>
        </button>
      </div>

      <!-- Perfil -->
      <div class="flex items-center justify-center md:justify-start gap-3">
        <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/30">
          {{ userProfile?.nome ? userProfile.nome.substring(0, 2).toUpperCase() : 'PR' }}
        </div>
        <div class="hidden md:flex flex-col truncate">
          <span class="text-sm font-medium truncate text-light-text dark:text-offwhite">{{ userProfile?.nome || 'Carregando...' }}</span>
          <span class="text-xs text-light-text/60 dark:text-offwhite/50 truncate capitalize">Professor</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useColorMode } from '#imports'
import { 
  CalendarDays, 
  Users, 
  CheckSquare, 
  Wallet,
  Sun,
  Moon,
  LogOut
} from '@lucide/vue'

const route = useRoute()
const colorMode = useColorMode()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const { data: userProfile } = await useAsyncData('user_profile_professor', async () => {
  if (!user.value?.sub) return null
  const { data } = await supabase.from('usuarios').select('nome, papel').eq('id', user.value.sub).single()
  return data
})

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const handleLogout = async () => {
  await supabase.auth.signOut()
  navigateTo('/login')
}

const menuItems = [
  { label: 'Minha Agenda', path: '/professor', icon: CalendarDays },
  { label: 'Meus Alunos', path: '/professor/alunos', icon: Users },
  { label: 'Chamada', path: '/professor/chamada', icon: CheckSquare },
  { label: 'Meu Repasse', path: '/professor/repasse', icon: Wallet },
]
</script>
