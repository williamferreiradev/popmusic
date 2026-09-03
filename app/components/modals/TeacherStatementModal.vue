<template>
  <BaseModal 
    :is-open="isOpen" 
    title="Gerar demonstrativo" 
    max-width="2xl"
    @close="handleClose"
  >
    <div class="flex flex-col gap-6">
      
      <!-- Pré-visualização do PDF -->
      <div class="bg-white text-black p-8 rounded border border-gray-200 shadow-inner max-h-[60vh] overflow-y-auto">
        <!-- Cabeçalho -->
        <div class="text-center mb-8 border-b border-gray-300 pb-6">
          <h2 class="text-2xl font-bold uppercase tracking-wider mb-2">{{ school.nome }}</h2>
          <p class="text-sm text-gray-600">CNPJ: {{ school.cnpj }}</p>
          <p class="text-sm text-gray-600">Demonstrativo de Repasse - Julho 2026</p>
        </div>

        <!-- Dados do Professor -->
        <div class="mb-6">
          <p><strong>Professor:</strong> {{ teacher?.name }}</p>
          <p><strong>Data de Emissão:</strong> {{ today }}</p>
        </div>

        <!-- Tabela -->
        <table class="w-full text-left mb-6 border-collapse">
          <thead>
            <tr class="border-b-2 border-gray-300">
              <th class="py-2 px-1">Aluno</th>
              <th class="py-2 px-1 text-center">Aulas</th>
              <th class="py-2 px-1 text-right">Valor un.</th>
              <th class="py-2 px-1 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="item in teacher?.students" 
              :key="item.studentName"
              class="border-b border-gray-100"
            >
              <td class="py-2 px-1">{{ item.studentName }}</td>
              <td class="py-2 px-1 text-center">{{ item.classesGiven }}</td>
              <td class="py-2 px-1 text-right">{{ formatCurrency(item.amountPerClass) }}</td>
              <td class="py-2 px-1 text-right font-medium">{{ formatCurrency(item.total) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t-2 border-gray-300 font-bold text-lg">
              <td colspan="3" class="py-4 text-right">Total a Pagar:</td>
              <td class="py-4 text-right">{{ formatCurrency(teacher?.totalToReceive || 0) }}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Assinatura/Declaração -->
        <div class="mt-12 text-center text-sm text-gray-600">
          <p>___________________________________________________</p>
          <p class="mt-2">Declaro ter recebido a importância supra descrita.</p>
        </div>
      </div>

      <!-- Ações -->
      <div class="flex justify-between items-center mt-2">
        <button 
          class="px-4 py-2 text-sm font-medium text-light-text/70 dark:text-offwhite/70 hover:bg-light-border/50 dark:hover:bg-dark-border/50 rounded-md transition-colors"
          @click="handleClose"
        >
          Fechar
        </button>
        <div class="flex gap-3">
          <button 
            class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-md transition-colors flex items-center gap-2"
            @click="confirm('whatsapp')"
          >
            Enviar por WhatsApp
          </button>
          <button 
            class="px-6 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-md transition-colors shadow-sm flex items-center gap-2"
            @click="confirm('pdf')"
          >
            Baixar PDF
          </button>
        </div>
      </div>

    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseModal from '../BaseModal.vue'
import type { Teacher } from '../../composables/useFinanceiro'

defineProps<{
  isOpen: boolean
  teacher: Teacher | null
}>()

const emit = defineEmits(['close', 'confirm'])
const { school, loadSchool } = useSchoolSettings()
await loadSchool()

const today = computed(() => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const handleClose = () => {
  emit('close')
}

const confirm = (action: 'whatsapp' | 'pdf') => {
  emit('confirm', action)
}
</script>
