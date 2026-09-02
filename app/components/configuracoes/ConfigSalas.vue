<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-light-text dark:text-offwhite">Salas</h2>
        <p class="text-sm text-light-text/60 dark:text-offwhite/60">Espaços físicos da escola organizados para o calendário.</p>
      </div>
      <BaseButton variant="primary" @click="openModal()" class="flex items-center gap-2">
        <Plus class="w-4 h-4" /> Nova sala
      </BaseButton>
    </div>

    <!-- Tabela -->
    <div class="overflow-x-auto rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface shadow-sm">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-light-border/30 dark:bg-dark-border/30 border-b border-light-border dark:border-dark-border text-sm font-medium text-light-text/70 dark:text-offwhite/70">
            <th class="py-3 px-4">Nome</th>
            <th class="py-3 px-4">Modalidade Padrão</th>
            <th class="py-3 px-4 text-center">Capacidade Máxima</th>
            <th class="py-3 px-4 text-center">Status</th>
            <th class="py-3 px-4 w-24 text-center">Ações</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          <tr v-if="pending">
            <td colspan="5" class="py-8 text-center">
              <div class="flex justify-center"><Loader2 class="w-6 h-6 animate-spin text-primary" /></div>
            </td>
          </tr>
          <tr v-else-if="!rooms || rooms.length === 0">
            <td colspan="5" class="py-8 text-center text-light-text/50 dark:text-offwhite/50">Nenhuma sala cadastrada ainda.</td>
          </tr>
          <tr 
            v-else
            v-for="room in rooms" 
            :key="room.id"
            class="border-b border-light-border dark:border-dark-border last:border-0 hover:bg-light-border/20 dark:hover:bg-dark-border/20 transition-colors"
          >
            <td class="py-3 px-4 font-medium text-light-text dark:text-offwhite">{{ room.name }}</td>
            <td class="py-3 px-4 text-light-text dark:text-offwhite">{{ room.defaultModalityName }}</td>
            <td class="py-3 px-4 text-center text-light-text dark:text-offwhite">{{ room.capacity }} alunos</td>
            <td class="py-3 px-4 text-center"><BaseBadge :variant="room.active ? 'success' : 'neutral'">{{ room.active ? 'Ativa' : 'Inativa' }}</BaseBadge></td>
            <td class="py-3 px-4 text-center">
              <div class="flex items-center justify-center gap-2">
                <button @click="openModal(room)" class="p-1.5 text-light-text/60 dark:text-offwhite/60 hover:text-primary transition-colors" title="Editar">
                  <Pencil class="w-4 h-4" />
                </button>
                <button @click="toggleActive(room)" class="p-1.5 text-light-text/60 dark:text-offwhite/60 transition-colors" :class="room.active ? 'hover:text-red-500' : 'hover:text-green-500'" :title="room.active ? 'Inativar' : 'Reativar'">
                  <UserX v-if="room.active" class="w-4 h-4" /><UserCheck v-else class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Nova/Editar -->
    <BaseModal :isOpen="isModalOpen" :title="isEditing ? 'Editar sala' : 'Nova sala'" @close="closeModal">
      <div class="p-5 flex flex-col gap-4">
        <BaseInput v-model="formData.name" label="Nome da Sala" placeholder="Ex: Sala 2 - Teclado" required />
        
        <BaseSelect v-model="formData.defaultModality" label="Modalidade padrão (opcional)" :options="modalityOptions" placeholder="Selecione..." />
        
        <BaseInput v-model="formData.capacity" label="Capacidade máxima padrão (alunos)" type="number" placeholder="Ex: 5" required />
        
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
import { Plus, Pencil, UserCheck, UserX, Loader2 } from '@lucide/vue'
import BaseButton from '../BaseButton.vue'
import BaseModal from '../BaseModal.vue'
import BaseInput from '../BaseInput.vue'
import BaseSelect from '../BaseSelect.vue'
import BaseBadge from '../BaseBadge.vue'

const emit = defineEmits(['unsaved-changes'])
const supabase = useSupabaseClient()

// Buscar modalidades para o dropdown
const { data: modalidades } = await useAsyncData('modalidades_salas', async () => {
  const { data } = await supabase.from('modalidades').select('id, nome').eq('ativo', true).order('nome')
  return data || []
})

const modalityOptions = computed(() => {
  const options = (modalidades.value || []).map((m: any) => ({ label: m.nome, value: m.id }))
  return [{ label: 'Uso geral', value: '' }, ...options]
})

// Buscar salas
const { data: rooms, pending, refresh } = await useAsyncData('config_salas', async () => {
  const { data, error } = await supabase
    .from('salas')
    .select(`
      *,
      modalidades (nome),
      turmas (id, ativo)
    `)
    .order('nome')

  if (error) {
    console.error('Erro ao buscar salas:', error)
    return []
  }

  return (data || []).map((room: any) => {
    let activeClasses = 0
    if (room.turmas) {
      activeClasses = room.turmas.filter((item: any) => item.ativo).length
    }
    return {
      id: room.id,
      name: room.nome,
      capacity: room.capacidade_padrao || 0,
      defaultModalityId: room.modalidade_padrao_id || '',
      defaultModalityName: room.modalidades?.nome || 'Uso geral',
      activeClasses,
      active: room.ativo,
      raw: room
    }
  })
})

const isModalOpen = ref(false)
const isEditing = ref(false)
const isLoadingSave = ref(false)
const formData = ref({ id: '', name: '', defaultModality: '', capacity: '' })

const isFormValid = computed(() => {
  return formData.value.name.trim() !== '' && formData.value.capacity !== ''
})

const openModal = (room?: any) => {
  if (room) {
    isEditing.value = true
    formData.value = { ...room, capacity: room.capacity.toString(), defaultModality: room.defaultModalityId }
  } else {
    isEditing.value = false
    formData.value = { id: '', name: '', defaultModality: '', capacity: '' }
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const save = async () => {
  if (!isFormValid.value) return
  isLoadingSave.value = true
  
  const capacity = parseInt(formData.value.capacity) || 0
  const modalidade_padrao_id = formData.value.defaultModality ? formData.value.defaultModality : null
  
  try {
    const { error } = await (supabase as any).rpc('salvar_sala', {
      p_id: isEditing.value ? formData.value.id : null,
      p_nome: formData.value.name, p_capacidade: capacity, p_modalidade_id: modalidade_padrao_id
    })
    if (error) throw error
    await refresh()
    closeModal()
  } catch (error: any) {
    console.error('Erro ao salvar sala:', error)
    alert(`Não foi possível salvar. ${error.message || 'Tente novamente.'}`)
  } finally {
    isLoadingSave.value = false
  }
}

const toggleActive = async (room: any) => {
  const action = room.active ? 'inativar' : 'reativar'
  if (!confirm(`Deseja ${action} ${room.name}?`)) return
  const { error } = await (supabase as any).rpc('alterar_status_sala', { p_sala_id: room.id, p_ativo: !room.active })
  if (error) { alert(`Não foi possível ${action}. ${error.message}`); return }
  await refresh()
}
</script>
