<template>
  <button
    class="px-4 py-2 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg"
    :class="[
      variant === 'primary' ? 'bg-primary text-offwhite hover:bg-primary-hover focus:ring-primary' : '',
      variant === 'outline' ? 'border border-gold text-gold hover:bg-gold-soft focus:ring-gold' : '',
    ]"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps({
  variant: {
    type: String,
    default: 'primary' // 'primary' | 'outline'
  }
})
defineEmits(['click'])
</script>
