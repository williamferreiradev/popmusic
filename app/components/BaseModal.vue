<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition name="modal">
        <div 
          v-if="isOpen" 
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          :class="[hideOnPrint ? 'print:hidden' : 'print:p-0 print:static print:block']"
        >
          <!-- Overlay -->
          <div 
            class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity print:hidden"
            @click="closeOnOutsideClick && $emit('close')"
          />

          <!-- Modal Content -->
          <div 
            class="relative bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl shadow-2xl w-full flex flex-col overflow-hidden transition-all duration-300"
            :class="maxWidthClass"
            role="dialog"
            aria-modal="true"
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-light-border dark:border-dark-border flex justify-between items-center bg-light-bg/30 dark:bg-dark-bg/30">
              <h3 class="text-lg font-bold text-light-text dark:text-offwhite">
                {{ title }}
              </h3>
              <button 
                class="text-light-text/50 hover:text-light-text dark:text-offwhite/50 dark:hover:text-offwhite transition-colors p-1 rounded-md hover:bg-light-border dark:hover:bg-dark-border"
                @click="$emit('close')"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Body -->
            <div class="p-6 overflow-y-auto max-h-[85vh]">
              <slot/>
            </div>

            <!-- Footer -->
            <div v-if="$slots.footer" class="px-6 py-4 border-t border-light-border dark:border-dark-border bg-light-bg/50 dark:bg-dark-bg/50 flex items-center justify-end gap-3">
              <slot name="footer"/>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X } from '@lucide/vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  maxWidth: {
    type: String,
    default: 'md', // sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, full
    validator: (value: string) => ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', 'full'].includes(value)
  },
  closeOnOutsideClick: {
    type: Boolean,
    default: true
  },
  hideOnPrint: {
    type: Boolean,
    default: true
  }
})

defineEmits(['close'])

const maxWidthClass = computed(() => {
  switch (props.maxWidth) {
    case 'sm': return 'max-w-sm'
    case 'lg': return 'max-w-lg'
    case 'xl': return 'max-w-xl'
    case '2xl': return 'max-w-2xl'
    case '3xl': return 'max-w-3xl'
    case '4xl': return 'max-w-4xl'
    case '5xl': return 'max-w-5xl'
    case 'full': return 'max-w-full'
    case 'md':
    default: return 'max-w-md'
  }
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div:nth-child(2) {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.modal-leave-active > div:nth-child(2) {
  transition: all 0.3s ease;
}

.modal-enter-from > div:nth-child(2) {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
.modal-leave-to > div:nth-child(2) {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
