<template>
  <div class="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-offwhite flex font-sans transition-colors duration-300">
    <!-- Sidebar Fixa de Gestão -->
    <LayoutDashboardSidebar />

    <!-- Conteúdo Principal -->
    <main class="flex-1 min-w-0 min-h-screen ml-[72px] transition-[margin] duration-300" :class="sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-[220px]'">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const sidebarCollapsed = useState('dashboard-sidebar-collapsed', () => false)
// O componente LayoutDashboardSidebar é auto-importado
</script>
