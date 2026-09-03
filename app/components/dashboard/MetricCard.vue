<template>
  <component 
    :is="to ? NuxtLink : 'div'" 
    :to="to"
    class="p-5 rounded-lg border flex flex-col gap-2 transition-all relative overflow-hidden group"
    :class="[
      variant === 'neutral' ? 'bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border' : '',
      variant === 'alert-red' ? 'bg-[#7A1F1F]/10 border-[#7A1F1F]/40 shadow-[0_0_15px_rgba(122,31,31,0.1)]' : '',
      variant === 'alert-gold' ? 'bg-gold-soft border-gold/40 shadow-[0_0_15px_rgba(201,162,39,0.1)]' : '',
      to ? 'hover:-translate-y-1 hover:shadow-lg cursor-pointer' : ''
    ]"
  >
    <div class="flex items-center justify-between relative z-10">
      <span
class="text-sm font-medium" :class="[
        variant === 'neutral' ? 'text-light-text/70 dark:text-offwhite/70' : '',
        variant === 'alert-red' ? 'text-red-700 dark:text-[#ff8a8a]' : '', 
        variant === 'alert-gold' ? 'text-yellow-700 dark:text-gold' : ''
      ]">{{ title }}</span>
      <slot name="icon"/>
    </div>
    
    <div
class="text-3xl font-bold relative z-10" :class="[
        variant === 'neutral' ? 'text-light-text dark:text-offwhite' : '',
        variant === 'alert-red' ? 'text-red-700 dark:text-[#ff8a8a]' : '',
        variant === 'alert-gold' ? 'text-yellow-700 dark:text-gold' : ''
    ]">{{ value }}</div>
    
    <div
v-if="description" class="text-xs mt-1 relative z-10" :class="[
        variant === 'neutral' ? 'text-light-text/50 dark:text-offwhite/50' : '',
        variant === 'alert-red' ? 'text-red-700/70 dark:text-[#ff8a8a]/70' : '',
        variant === 'alert-gold' ? 'text-yellow-700/70 dark:text-gold/70' : ''
    ]">{{ description }}</div>

    <!-- Sparkline Background -->
    <div class="absolute bottom-0 left-0 w-full h-12 opacity-30 group-hover:opacity-50 transition-opacity pointer-events-none">
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" class="w-full h-full">
        <path 
          :d="chartPath" 
          fill="none" 
          :stroke="chartColor" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
        />
      </svg>
    </div>
  </component>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], required: true },
  description: { type: String, default: '' },
  variant: { type: String, default: 'neutral' }, // 'neutral' | 'alert-red' | 'alert-gold'
  to: { type: String, default: undefined },
  chartData: { type: Array as () => number[], default: () => [] }
})

const chartColor = computed(() => {
  if (props.variant === 'alert-red') return '#ff8a8a'
  if (props.variant === 'alert-gold') return '#C9A227'
  return '#9CA3AF' // Cinza para o neutro (combina com ambos light e dark mode quando a opacidade está baixa)
})

const chartPath = computed(() => {
  const data = props.chartData.length > 0 ? props.chartData : [10, 15, 8, 20, 12, 25, 22]
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100
    // Inverte o eixo Y para o SVG (0 é o topo)
    const y = 30 - (((val - min) / range) * 20 + 5)
    return `${x},${y}`
  })
  
  return `M ${points.join(' L ')}`
})
</script>
