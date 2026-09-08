<template>
  <div class="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-offwhite flex font-sans transition-colors duration-300">
    <!-- Sidebar Fixa de Gestão -->
    <LayoutDashboardSidebar />

    <!-- Conteúdo Principal -->
    <main class="flex-1 min-w-0 min-h-screen">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
// O componente LayoutDashboardSidebar é auto-importado
</script>
