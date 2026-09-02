<template>
  <div class="flex flex-col gap-1.5 w-full">
    <label v-if="label" class="text-sm font-medium text-light-text dark:text-offwhite">{{ label }}</label>
    <div class="relative flex items-center">
      <div v-if="$slots.icon" class="absolute left-3 text-light-text/40 dark:text-offwhite/40 pointer-events-none flex items-center justify-center">
        <slot name="icon"></slot>
      </div>
      <input
        :value="modelValue"
        @input="handleInput"
        :type="type"
        :placeholder="placeholder"
        :max="max"
        :required="required"
        class="w-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md py-2 text-light-text dark:text-offwhite placeholder:text-light-text/40 dark:placeholder:text-offwhite/40 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
        :class="[$slots.icon ? 'pl-10 pr-3' : 'px-3']"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: ''
  },
  mask: {
    type: String,
    default: 'none',
    validator: (value: string) => ['none', 'cpf', 'phone'].includes(value)
  },
  max: {
    type: String,
    default: undefined
  },
  required: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['update:modelValue'])

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  let val = target.value
  
  if (props.mask === 'cpf') {
    let v = val.replace(/\D/g, '').slice(0, 11)
    v = v.replace(/(\d{3})(\d)/, '$1.$2')
    v = v.replace(/(\d{3})(\d)/, '$1.$2')
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    val = v
    target.value = val
  } else if (props.mask === 'phone') {
    let v = val.replace(/\D/g, '').slice(0, 11)
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2')
    v = v.replace(/(\d)(\d{4})$/, '$1-$2')
    val = v
    target.value = val
  }
  
  emit('update:modelValue', val)
}
</script>
