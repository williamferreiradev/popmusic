<template>
  <div class="p-4 sm:p-8 w-full min-h-screen flex flex-col">
    <ConfigTurmas />
  </div>
</template>

<script setup lang="ts">
import ConfigTurmas from '~/components/configuracoes/ConfigTurmas.vue'

definePageMeta({ layout: 'dashboard' })
</script>
