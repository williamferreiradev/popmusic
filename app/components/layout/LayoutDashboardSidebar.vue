<template>
  <aside class="h-screen w-[72px] bg-light-surface dark:bg-dark-surface border-r border-light-border dark:border-dark-border fixed left-0 top-0 flex flex-col font-sans shrink-0 transition-all duration-300 z-40" :class="sidebarCollapsed ? 'md:w-[72px]' : 'md:w-[220px]'">
    <!-- Logo ou nome da escola -->
    <div class="h-16 flex items-center border-b border-light-border dark:border-dark-border" :class="sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'">
      <h1 v-if="!sidebarCollapsed" class="hidden md:block text-lg font-bold text-light-text dark:text-offwhite">Pop Music</h1>
      <span class="font-black text-primary" :class="sidebarCollapsed ? '' : 'md:hidden'">PM</span>
      <button @click="sidebarCollapsed = !sidebarCollapsed" class="hidden md:block p-2 rounded-md text-light-text/60 dark:text-offwhite/60 hover:bg-light-bg dark:hover:bg-dark-bg" :title="sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'">
        <PanelLeftOpen v-if="sidebarCollapsed" class="w-4 h-4" />
        <PanelLeftClose v-else class="w-4 h-4" />
      </button>
    </div>

    <!-- Navegação -->
    <nav class="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
      <NuxtLink 
        v-for="item in menuItems" 
        :key="item.path"
        :to="item.path"
        class="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors"
        :title="sidebarCollapsed ? item.label : undefined"
        :class="[
          sidebarCollapsed ? 'justify-center' : 'justify-center md:justify-start md:gap-3',
          route.path === item.path 
            ? 'bg-primary text-white' 
            : 'text-light-text/70 dark:text-offwhite/70 hover:bg-light-bg dark:hover:bg-dark-bg hover:text-light-text dark:hover:text-offwhite'
        ]"
      >
        <component :is="item.icon" class="w-4 h-4" />
        <span v-if="!sidebarCollapsed" class="hidden md:inline">{{ item.label }}</span>
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
          <span v-if="!sidebarCollapsed" class="hidden md:inline">Tema</span>
        </button>
        
        <button 
          @click="handleLogout"
          class="flex-1 flex items-center justify-center gap-2 p-2 rounded-md bg-light-bg dark:bg-dark-bg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-[#ff8a8a] transition-colors text-xs font-medium border border-light-border dark:border-dark-border"
          title="Sair da conta"
        >
          <LogOut class="w-4 h-4" />
          <span v-if="!sidebarCollapsed" class="hidden md:inline">Sair</span>
        </button>
      </div>

      <!-- Perfil -->
      <div class="flex items-center justify-center md:justify-start gap-3">
        <div class="w-10 h-10 rounded-full bg-gold-soft text-gold flex items-center justify-center font-bold text-sm shrink-0 border border-gold/30">
          {{ userProfile?.nome ? userProfile.nome.substring(0, 2).toUpperCase() : 'US' }}
        </div>
        <div v-if="!sidebarCollapsed" class="hidden md:flex flex-col truncate">
          <span class="text-sm font-medium truncate text-light-text dark:text-offwhite">{{ userProfile?.nome || 'Carregando...' }}</span>
          <span class="text-xs text-light-text/60 dark:text-offwhite/50 truncate capitalize">{{ userProfile?.papel || 'Gestão' }}</span>
        </div>
      </div>

    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useColorMode } from '#imports'
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  CheckSquare, 
  Wallet, 
  FileText, 
  BarChart3, 
  Settings,
  GraduationCap,
  Music2,
  DoorOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  LogOut
} from '@lucide/vue'

const route = useRoute()
const colorMode = useColorMode()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const sidebarCollapsed = useState('dashboard-sidebar-collapsed', () => false)

const { data: userProfile } = await useAsyncData('user_profile', async () => {
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
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Alunos', path: '/dashboard/alunos', icon: Users },
  { label: 'Professores', path: '/dashboard/professores', icon: GraduationCap },
  { label: 'Modalidades', path: '/dashboard/modalidades', icon: Music2 },
  { label: 'Salas', path: '/dashboard/salas', icon: DoorOpen },
  { label: 'Turmas e agenda', path: '/dashboard/agenda', icon: CalendarDays },
  { label: 'Frequência', path: '/dashboard/frequencia', icon: CheckSquare },
  { label: 'Financeiro', path: '/dashboard/financeiro', icon: Wallet },
  { label: 'Contratos', path: '/dashboard/contratos', icon: FileText },
  { label: 'Relatórios', path: '/dashboard/relatorios', icon: BarChart3 },
  { label: 'Configurações', path: '/dashboard/configuracoes', icon: Settings },
]
</script>
