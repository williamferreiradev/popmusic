<template>
  <div class="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-offwhite font-sans transition-colors duration-300">
    <!-- Sidebar Fixa de Gestão -->
    <LayoutDashboardSidebar />

    <!-- Conteúdo Principal -->
    <main class="w-full min-w-0 min-h-screen pl-[72px] transition-[padding] duration-300" :class="sidebarCollapsed ? 'md:pl-[72px]' : 'md:pl-[220px]'">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const sidebarCollapsed = useState('dashboard-sidebar-collapsed', () => false)
// O componente LayoutDashboardSidebar é auto-importado
</script>
