<template>
  <div class="flex flex-col gap-1.5 w-full">
    <label v-if="label" class="text-sm font-medium text-light-text dark:text-offwhite">{{ label }}</label>
    <div class="relative">
      <select
        :value="modelValue"
        @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
        class="w-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md px-3 py-2 pr-8 text-light-text dark:text-offwhite focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors appearance-none cursor-pointer"
        :class="{'text-light-text/40 dark:text-offwhite/40': !modelValue}"
      >
        <option value="" disabled selected v-if="placeholder">{{ placeholder }}</option>
        <option v-for="option in options" :key="option.value" :value="option.value" class="text-light-text dark:text-offwhite bg-light-surface dark:bg-dark-surface">
          {{ option.label }}
        </option>
      </select>
      <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-light-text/40 dark:text-offwhite/40">
        <ChevronDown class="w-4 h-4" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'

export interface SelectOption {
  label: string
  value: string | number
}

defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Selecione uma opção'
  },
  options: {
    type: Array as () => SelectOption[],
    default: () => []
  }
})

defineEmits(['update:modelValue'])
</script>
