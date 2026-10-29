<template>
  <fieldset class="flex flex-col gap-3 rounded-lg border border-light-border p-3 text-light-text dark:border-dark-border dark:text-offwhite">
    <legend class="px-1 text-sm font-bold">Endereço do aluno</legend>
    <p class="text-xs opacity-70">Este endereço será usado no contrato. Para menores, informe o endereço residencial do aluno e responsável.</p>
    <BaseInput :model-value="modelValue.logradouro" label="Rua / avenida / quadra" placeholder="Ex: Quadra 3, Conjunto B" required @update:model-value="update('logradouro', $event)" />
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <BaseInput :model-value="modelValue.numero" label="Número / lote" placeholder="Ex: 9 ou S/N" required @update:model-value="update('numero', $event)" />
      <BaseInput :model-value="modelValue.complemento" label="Complemento (opcional)" placeholder="Casa, apartamento, bloco..." @update:model-value="update('complemento', $event)" />
    </div>
    <BaseInput :model-value="modelValue.bairro" label="Bairro / setor" required @update:model-value="update('bairro', $event)" />
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_100px]">
      <BaseInput :model-value="modelValue.cidade" label="Cidade" required @update:model-value="update('cidade', $event)" />
      <BaseSelect :model-value="modelValue.uf" label="UF" :options="states" placeholder="UF" @update:model-value="update('uf', $event)" />
    </div>
    <BaseInput :model-value="modelValue.cep" label="CEP" mask="cep" placeholder="00000-000" required @update:model-value="update('cep', $event)" />
  </fieldset>
</template>
<script setup lang="ts">
import { brazilianStates, type StudentAddress } from '~/utils/studentAddress'
const props = defineProps<{ modelValue: StudentAddress }>()
const emit = defineEmits<{ 'update:modelValue': [StudentAddress] }>()
const states = brazilianStates.map(uf => ({ label: uf, value: uf }))
const update = (field: keyof StudentAddress, value: string | number) => emit('update:modelValue', { ...props.modelValue, [field]: String(value) })
</script>
