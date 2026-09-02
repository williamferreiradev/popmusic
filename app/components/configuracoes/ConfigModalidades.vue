<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-light-text dark:text-offwhite">Modalidades</h2>
        <p class="text-sm text-light-text/60 dark:text-offwhite/60">Cursos oferecidos pela escola, usados em matrículas e no calendário.</p>
      </div>
      <BaseButton variant="primary" @click="openModal()" class="flex items-center gap-2">
        <Plus class="w-4 h-4" /> Nova modalidade
      </BaseButton>
    </div>

    <!-- Tabela -->
    <div class="overflow-x-auto rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface shadow-sm">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-light-border/30 dark:bg-dark-border/30 border-b border-light-border dark:border-dark-border text-sm font-medium text-light-text/70 dark:text-offwhite/70">
            <th class="py-3 px-4">Nome</th>
            <th class="py-3 px-4">Valor Padrão</th>
            <th class="py-3 px-4">Cor no Calendário</th>
            <th class="py-3 px-4 text-center">Alunos Vinculados</th>
            <th class="py-3 px-4 w-24 text-center">Ações</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          <tr v-if="pending">
            <td colspan="5" class="py-8 text-center">
              <div class="flex justify-center"><Loader2 class="w-6 h-6 animate-spin text-primary" /></div>
            </td>
          </tr>
          <tr v-else-if="!modalities || modalities.length === 0">
            <td colspan="5" class="py-8 text-center text-light-text/50 dark:text-offwhite/50">Nenhuma modalidade cadastrada ainda.</td>
          </tr>
          <tr 
            v-else
            v-for="mod in modalities" 
            :key="mod.id"
            class="border-b border-light-border dark:border-dark-border last:border-0 hover:bg-light-border/20 dark:hover:bg-dark-border/20 transition-colors"
          >
            <td class="py-3 px-4 font-medium text-light-text dark:text-offwhite">{{ mod.name }}</td>
            <td class="py-3 px-4 text-light-text dark:text-offwhite">R$ {{ mod.price.toFixed(2) }}</td>
            <td class="py-3 px-4">
              <div class="flex items-center gap-2 text-light-text dark:text-offwhite">
                <span class="w-4 h-4 rounded-full border border-light-border/50" :style="{ backgroundColor: mod.color }"></span>
                {{ mod.color }}
              </div>
            </td>
            <td class="py-3 px-4 text-center text-light-text dark:text-offwhite">{{ mod.activeStudents }}</td>
            <td class="py-3 px-4 text-center">
              <div class="flex items-center justify-center gap-2">
                <button @click="openModal(mod)" class="p-1.5 text-light-text/60 dark:text-offwhite/60 hover:text-primary transition-colors" title="Editar">
                  <Pencil class="w-4 h-4" />
                </button>
                <button @click="confirmDelete(mod)" class="p-1.5 text-light-text/60 dark:text-offwhite/60 hover:text-red-500 transition-colors" title="Excluir">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Nova/Editar -->
    <BaseModal :isOpen="isModalOpen" :title="isEditing ? 'Editar modalidade' : 'Nova modalidade'" @close="closeModal">
      <div class="p-5 flex flex-col gap-4">
        <BaseInput v-model="formData.name" label="Nome da Modalidade" placeholder="Ex: Violão" required />
        
        <BaseInput v-model="formData.price" label="Valor padrão de mensalidade (R$)" type="number" placeholder="Ex: 150" required />
        
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-light-text dark:text-offwhite">Cor no Calendário</label>
          <div class="flex items-center gap-3 flex-wrap">
            <button 
              v-for="color in availableColors" 
              :key="color"
              @click="formData.color = color"
              class="w-8 h-8 rounded-full border-2 transition-all focus:outline-none"
              :class="formData.color === color ? 'border-light-text dark:border-offwhite scale-110' : 'border-transparent hover:scale-105'"
              :style="{ backgroundColor: color }"
            ></button>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-light-border dark:border-dark-border">
          <BaseButton variant="outline" @click="closeModal">Cancelar</BaseButton>
          <BaseButton variant="primary" @click="save" :disabled="!isFormValid || isLoadingSave" class="flex items-center gap-2">
            <Loader2 v-if="isLoadingSave" class="w-4 h-4 animate-spin" />
            Salvar
          </BaseButton>
        </div>
      </div>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Pencil, Trash2, Loader2 } from '@lucide/vue'
import BaseButton from '../BaseButton.vue'
import BaseModal from '../BaseModal.vue'
import BaseInput from '../BaseInput.vue'

const emit = defineEmits(['unsaved-changes'])
const supabase = useSupabaseClient()

const { data: modalities, pending, refresh } = await useAsyncData('config_modalidades', async () => {
  const { data, error } = await supabase
    .from('modalidades')
    .select(`
      *,
      turmas (
        matriculas_turma ( id, data_fim )
      )
    `)
    .order('nome')

  if (error) {
    console.error('Erro ao buscar modalidades:', error)
    return []
  }

  return (data || []).map((mod: any) => {
    let activeCount = 0
    if (mod.turmas) {
      mod.turmas.forEach((t: any) => {
        if (t.matriculas_turma) {
          activeCount += t.matriculas_turma.filter((m: any) => !m.data_fim).length
        }
      })
    }
    return {
      id: mod.id,
      name: mod.nome,
      price: mod.valor_padrao_mensalidade || 0,
      color: mod.cor_calendario || '#7A1F1F',
      activeStudents: activeCount,
      raw: mod
    }
  })
})

const isModalOpen = ref(false)
const isEditing = ref(false)
const isLoadingSave = ref(false)
const formData = ref({ id: '', name: '', price: '', color: '' })

const availableColors = ['#7A1F1F', '#C9A227', '#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280']

const isFormValid = computed(() => {
  return formData.value.name.trim() !== '' && formData.value.price !== '' && formData.value.color !== ''
})

const openModal = (mod?: any) => {
  if (mod) {
    isEditing.value = true
    formData.value = { ...mod, price: mod.price.toString() }
  } else {
    isEditing.value = false
    formData.value = { id: '', name: '', price: '', color: availableColors[0] }
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const save = async () => {
  if (!isFormValid.value) return
  isLoadingSave.value = true
  
  const price = parseFloat(formData.value.price)
  
  try {
    if (isEditing.value) {
      const { error } = await supabase
        .from('modalidades')
        .update({
          nome: formData.value.name,
          valor_padrao_mensalidade: price,
          cor_calendario: formData.value.color
        })
        .eq('id', formData.value.id)
        
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('modalidades')
        .insert({
          nome: formData.value.name,
          valor_padrao_mensalidade: price,
          cor_calendario: formData.value.color,
          ativo: true
        })
        
      if (error) throw error
    }
    await refresh()
    closeModal()
  } catch (error: any) {
    console.error('Erro ao salvar modalidade:', error)
    alert(`Não foi possível salvar. ${error.message || 'Tente novamente.'}`)
  } finally {
    isLoadingSave.value = false
  }
}

const confirmDelete = async (mod: any) => {
  if (mod.activeStudents > 0) {
    alert(`Esta modalidade tem ${mod.activeStudents} alunos vinculados e não pode ser excluída. Migre os alunos para outra modalidade primeiro.`)
    return
  }
  
  if (confirm(`Tem certeza que deseja excluir ${mod.name}?`)) {
    try {
      const { error } = await supabase.from('modalidades').delete().eq('id', mod.id)
      if (error) throw error
      await refresh()
    } catch (error: any) {
      console.error('Erro ao excluir modalidade:', error)
      alert(`Não foi possível excluir. ${error.message || 'Tente novamente.'}`)
    }
  }
}
</script>
