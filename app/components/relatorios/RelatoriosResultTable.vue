<template>
  <div class="w-full flex flex-col gap-4">
    <!-- Tabela Header / Ações -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-bold text-light-text dark:text-offwhite">{{ title }} <span class="text-sm font-normal opacity-70">— {{ data.length }} resultados</span></h3>
      <div class="flex items-center gap-2">
        <BaseButton variant="outline" size="sm" @click="exportCSV" class="flex items-center gap-2">
          <Download class="w-4 h-4" /> CSV
        </BaseButton>
        <BaseButton variant="outline" size="sm" @click="exportPDF" class="flex items-center gap-2">
          <FileText class="w-4 h-4" /> PDF
        </BaseButton>
        <button @click="$emit('close')" class="ml-2 p-1.5 text-light-text/60 dark:text-offwhite/60 hover:text-primary dark:hover:text-primary-hover rounded-md transition-colors" title="Fechar resultado">
          <X class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Tabela -->
    <div class="overflow-x-auto rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface shadow-sm">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-light-border/30 dark:bg-dark-border/30 border-b border-light-border dark:border-dark-border text-sm font-medium text-light-text/70 dark:text-offwhite/70">
            <th v-for="col in columns" :key="col.key" class="py-3 px-4">{{ col.label }}</th>
            <th v-if="hasActions" class="py-3 px-4 w-12 text-center"></th>
          </tr>
        </thead>
        <tbody class="text-sm">
          <tr v-if="data.length === 0">
            <td :colspan="columns.length + (hasActions ? 1 : 0)" class="py-8 text-center text-light-text/50 dark:text-offwhite/50">
              <div class="flex flex-col items-center gap-2">
                <Filter class="w-6 h-6 opacity-50" />
                <span>Nenhum resultado encontrado para este relatório.</span>
              </div>
            </td>
          </tr>
          <tr 
            v-for="(row, i) in data" 
            :key="i"
            class="border-b border-light-border dark:border-dark-border last:border-0 hover:bg-light-border/20 dark:hover:bg-dark-border/20 transition-colors"
          >
            <td v-for="col in columns" :key="col.key" class="py-3 px-4 text-light-text dark:text-offwhite whitespace-nowrap">
              <template v-if="col.type === 'badge'">
                <BaseBadge :variant="getBadgeVariant(row[col.key])">{{ row[col.key] }}</BaseBadge>
              </template>
              <template v-else>
                {{ row[col.key] }}
              </template>
            </td>
            <!-- Ações rápidas -->
            <td v-if="hasActions" class="py-3 px-4 text-center">
              <button @click="$emit('action', { action: actionType, row })" class="p-1.5 text-light-text/60 dark:text-offwhite/60 hover:text-primary dark:hover:text-primary transition-colors" :title="actionTooltip">
                <component :is="actionIcon" class="w-4 h-4" v-if="actionIcon" />
                <Settings v-else class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Download, FileText, X, Settings, Filter } from '@lucide/vue'
import BaseButton from '../BaseButton.vue'
import BaseBadge from '../BaseBadge.vue'

export interface TableColumn {
  key: string
  label: string
  type?: 'text' | 'badge'
}

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  columns: {
    type: Array as () => TableColumn[],
    required: true
  },
  data: {
    type: Array as () => any[],
    required: true
  },
  hasActions: {
    type: Boolean,
    default: false
  },
  actionIcon: {
    type: Object,
    default: null
  },
  actionType: {
    type: String,
    default: 'edit'
  },
  actionTooltip: {
    type: String,
    default: 'Ação rápida'
  }
})

const emit = defineEmits(['close', 'action'])

const getBadgeVariant = (value: string) => {
  const val = value?.toLowerCase() || ''
  if (val.includes('ativo') || val.includes('pago') || val.includes('aceito')) return 'success'
  if (val.includes('inadimplente') || val.includes('cancelado') || val.includes('atraso') || val.includes('expirado')) return 'danger'
  if (val.includes('pendente') || val.includes('aguardando') || val.includes('vencendo')) return 'warning'
  return 'neutral'
}

const exportPDF = () => {
  alert('Simulação: Gerando arquivo PDF com cabeçalho, tabelas formatadas e contagem total de linhas.')
}

const exportCSV = () => {
  if (props.data.length === 0) return
  
  const headers = props.columns.map(c => c.label).join(';')
  
  const rows = props.data.map(row => {
    return props.columns.map(c => {
      let cell = row[c.key] || ''
      cell = String(cell).replace(/"/g, '""')
      return `"${cell}"`
    }).join(';')
  })
  
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + "\n" + rows.join("\n")
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  
  const dateStr = new Date().toISOString().split('T')[0]
  const safeName = props.title.toLowerCase().replace(/[^a-z0-9]/g, '_')
  link.setAttribute("download", `relatorio_${safeName}_${dateStr}.csv`)
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>
