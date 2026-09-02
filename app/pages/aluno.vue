<template>
  <div class="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-offwhite flex font-sans transition-colors duration-300">
    <!-- Sidebar Fixa do Aluno -->
    <LayoutAlunoSidebar />

    <!-- Conteúdo Principal -->
    <main class="flex-1 min-w-0 ml-[72px] md:ml-[220px] min-h-screen">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
// O componente LayoutAlunoSidebar é auto-importado
</script>
