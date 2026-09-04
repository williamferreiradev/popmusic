<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-light-text dark:text-offwhite">Modalidades</h2>
        <p class="text-sm text-light-text/60 dark:text-offwhite/60">Cursos oferecidos pela escola, usados em matrículas e no calendário.</p>
      </div>
      <BaseButton variant="primary" class="flex items-center gap-2" @click="openModal()">
        <Plus class="w-4 h-4" /> Nova modalidade
      </BaseButton>
    </div>

    <div v-if="feedback" class="rounded-lg border px-4 py-3 text-sm" :class="feedback.type === 'success' ? 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300' : 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300'" role="status">
      {{ feedback.message }}
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
            <th class="py-3 px-4 text-center">Status</th>
            <th class="py-3 px-4 w-24 text-center">Ações</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          <tr v-if="pending">
            <td colspan="6" class="py-8 text-center">
              <div class="flex justify-center"><Loader2 class="w-6 h-6 animate-spin text-primary" /></div>
            </td>
          </tr>
          <tr v-else-if="loadError">
            <td colspan="6" class="py-8 px-4 text-center text-red-600 dark:text-red-400">Não foi possível carregar as modalidades. Tente novamente.</td>
          </tr>
          <tr v-else-if="!modalities || modalities.length === 0">
            <td colspan="6" class="py-8 text-center text-light-text/50 dark:text-offwhite/50">Nenhuma modalidade cadastrada ainda.</td>
          </tr>
          <tr
            v-for="mod in modalities"
            v-else
            :key="mod.id"
            class="border-b border-light-border dark:border-dark-border last:border-0 hover:bg-light-border/20 dark:hover:bg-dark-border/20 transition-colors"
          >
            <td class="py-3 px-4 font-medium text-light-text dark:text-offwhite">{{ mod.name }}</td>
            <td class="py-3 px-4 text-light-text dark:text-offwhite">R$ {{ mod.price.toFixed(2) }}</td>
            <td class="py-3 px-4">
              <div class="flex items-center gap-2 text-light-text dark:text-offwhite">
                <span class="w-4 h-4 rounded-full border border-light-border/50" :style="{ backgroundColor: mod.color }"/>
                {{ mod.color }}
              </div>
            </td>
            <td class="py-3 px-4 text-center text-light-text dark:text-offwhite">{{ mod.activeStudents }}</td>
            <td class="py-3 px-4 text-center"><BaseBadge :variant="mod.active ? 'success' : 'neutral'">{{ mod.active ? 'Ativa' : 'Inativa' }}</BaseBadge></td>
            <td class="py-3 px-4 text-center">
              <div class="flex items-center justify-center gap-2">
                <button class="p-1.5 text-light-text/60 dark:text-offwhite/60 hover:text-primary transition-colors" title="Editar" @click="openModal(mod)">
                  <Pencil class="w-4 h-4" />
                </button>
                <button :disabled="statusLoadingId === mod.id" class="p-1.5 text-light-text/60 dark:text-offwhite/60 transition-colors disabled:opacity-40" :class="mod.active ? 'hover:text-red-500' : 'hover:text-green-500'" :title="mod.active ? 'Inativar' : 'Reativar'" @click="toggleActive(mod)">
                  <UserX v-if="mod.active" class="w-4 h-4" /><UserCheck v-else class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Nova/Editar -->
    <BaseModal :is-open="isModalOpen" :title="isEditing ? 'Editar modalidade' : 'Nova modalidade'" @close="closeModal">
      <div class="p-5 flex flex-col gap-4">
        <BaseInput v-model="formData.name" label="Nome da Modalidade" placeholder="Ex: Violão" required />

        <BaseInput v-model="formData.price" label="Valor padrão de mensalidade (R$)" type="number" placeholder="Ex: 150" required />

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-light-text dark:text-offwhite">Cor no Calendário</label>
          <div class="flex items-center gap-3 flex-wrap">
            <button
              v-for="color in availableColors"
              :key="color"
              class="w-8 h-8 rounded-full border-2 transition-all focus:outline-none"
              :class="formData.color === color ? 'border-light-text dark:border-offwhite scale-110' : 'border-transparent hover:scale-105'"
              :style="{ backgroundColor: color }"
              @click="formData.color = color"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-light-border dark:border-dark-border">
          <BaseButton variant="outline" @click="closeModal">Cancelar</BaseButton>
          <BaseButton variant="primary" :disabled="!isFormValid || isLoadingSave" class="flex items-center gap-2" @click="save">
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
import BaseBadge from '../BaseBadge.vue'

defineEmits(['unsaved-changes'])
const supabase = useSupabaseClient()

const { data: modalities, pending, error: loadError, refresh } = await useAsyncData('config_modalidades', async () => {
  const { data, error } = await supabase
    .from('modalidades')
    .select(`
      *,
      turmas ( id, ativo,
        matriculas_turma ( id, data_fim )
      )
    `)
    .order('nome')

  if (error) throw error

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
      active: mod.ativo,
      activeClasses: (mod.turmas || []).filter((item: any) => item.ativo).length,
      raw: mod
    }
  })
})

const isModalOpen = ref(false)
const isEditing = ref(false)
const isLoadingSave = ref(false)
const statusLoadingId = ref('')
const feedback = ref<{ type: 'success' | 'error', message: string } | null>(null)
const formData = ref({ id: '', name: '', price: '', color: '' })

const availableColors = ['#7A1F1F', '#C9A227', '#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280']

const isFormValid = computed(() => {
  const price = Number(formData.value.price)
  return formData.value.name.trim().length >= 2 && Number.isFinite(price) && price >= 0 && formData.value.color !== ''
})

const openModal = (mod?: any) => {
  if (mod) {
    isEditing.value = true
    formData.value = { ...mod, price: mod.price.toString() }
  } else {
    isEditing.value = false
    formData.value = { id: '', name: '', price: '', color: availableColors[0] ?? '#7A1F1F' }
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const save = async () => {
  if (!isFormValid.value) return
  isLoadingSave.value = true
  feedback.value = null

  const price = parseFloat(formData.value.price)

  try {
    const { error } = await (supabase as any).rpc('salvar_modalidade', {
      p_id: isEditing.value ? formData.value.id : null,
      p_nome: formData.value.name, p_valor: price, p_cor: formData.value.color
    })
    if (error) throw error
    await refresh()
    closeModal()
    feedback.value = { type: 'success', message: `Modalidade ${isEditing.value ? 'atualizada' : 'criada'} com sucesso.` }
  } catch (error: any) {
    console.error('Erro ao salvar modalidade:', error)
    feedback.value = { type: 'error', message: `Não foi possível salvar. ${error.message || 'Tente novamente.'}` }
  } finally {
    isLoadingSave.value = false
  }
}

const toggleActive = async (mod: any) => {
  const action = mod.active ? 'inativar' : 'reativar'
  if (!confirm(`Deseja ${action} ${mod.name}?`)) return
  statusLoadingId.value = mod.id
  feedback.value = null
  try {
    const { error } = await (supabase as any).rpc('alterar_status_modalidade', { p_modalidade_id: mod.id, p_ativo: !mod.active })
    if (error) throw error
    await refresh()
    feedback.value = { type: 'success', message: `Modalidade ${mod.active ? 'inativada' : 'reativada'} com sucesso.` }
  } catch (error: any) {
    feedback.value = { type: 'error', message: `Não foi possível ${action}. ${error.message || 'Tente novamente.'}` }
  } finally {
    statusLoadingId.value = ''
  }
}
</script>
