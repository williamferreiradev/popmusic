<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-light-text dark:text-offwhite">Equipe</h2>
        <p class="text-sm text-light-text/60 dark:text-offwhite/60">Controle o acesso administrativo ao painel.</p>
      </div>
      <BaseButton variant="primary" @click="openModal()" class="flex items-center gap-2">
        <UserPlus class="w-4 h-4" /> Convidar usuário
      </BaseButton>
    </div>

    <!-- Tabela -->
    <div class="overflow-x-auto rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface shadow-sm">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-light-border/30 dark:bg-dark-border/30 border-b border-light-border dark:border-dark-border text-sm font-medium text-light-text/70 dark:text-offwhite/70">
            <th class="py-3 px-4">Nome</th>
            <th class="py-3 px-4">E-mail</th>
            <th class="py-3 px-4">Papel</th>
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
          <tr v-else-if="!team || team.length === 0">
            <td colspan="5" class="py-8 text-center text-light-text/50 dark:text-offwhite/50">Nenhum membro na equipe.</td>
          </tr>
          <tr 
            v-else
            v-for="member in team" 
            :key="member.id"
            class="border-b border-light-border dark:border-dark-border last:border-0 hover:bg-light-border/20 dark:hover:bg-dark-border/20 transition-colors"
            :class="{'opacity-50': member.status === 'Inativo'}"
          >
            <td class="py-3 px-4 font-medium text-light-text dark:text-offwhite">{{ member.name }}</td>
            <td class="py-3 px-4 text-light-text dark:text-offwhite">{{ member.email }}</td>
            <td class="py-3 px-4">
              <BaseBadge :variant="member.role === 'Gestão' ? 'primary' : 'neutral'">{{ member.role }}</BaseBadge>
            </td>
            <td class="py-3 px-4 text-center">
              <BaseBadge :variant="member.status === 'Ativo' ? 'success' : 'danger'">{{ member.status }}</BaseBadge>
            </td>
            <td class="py-3 px-4 text-center">
              <div class="flex items-center justify-center gap-2">
                <button @click="openModal(member)" class="p-1.5 text-light-text/60 dark:text-offwhite/60 hover:text-primary transition-colors" title="Editar" :disabled="member.status === 'Inativo'">
                  <Pencil class="w-4 h-4" />
                </button>
                <button v-if="member.status === 'Ativo'" @click="confirmDeactivate(member)" class="p-1.5 text-light-text/60 dark:text-offwhite/60 hover:text-red-500 transition-colors" title="Desativar">
                  <UserMinus class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Nova/Editar -->
    <BaseModal :isOpen="isModalOpen" :title="isEditing ? 'Editar usuário' : 'Convidar novo usuário'" @close="closeModal">
      <div class="p-5 flex flex-col gap-4">
        <BaseInput v-model="formData.name" label="Nome Completo" placeholder="Ex: João da Silva" required />
        <BaseInput v-model="formData.email" label="E-mail de acesso" type="email" placeholder="Ex: joao@escola.com" required :disabled="isEditing" />
        
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-light-text dark:text-offwhite">Papel</label>
          <div class="p-3 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md">
            <span class="text-sm font-medium">Gestão</span>
            <p class="text-xs text-light-text/60 dark:text-offwhite/60 mt-1">Tem acesso completo a todo o painel.</p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-light-border dark:border-dark-border">
          <BaseButton variant="outline" @click="closeModal">Cancelar</BaseButton>
          <BaseButton variant="primary" @click="save" :disabled="!isFormValid || isLoadingSave" class="flex items-center gap-2">
            <Loader2 v-if="isLoadingSave" class="w-4 h-4 animate-spin" />
            {{ isEditing ? 'Salvar' : 'Enviar convite' }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Modal Desativar -->
    <BaseModal :isOpen="isDeactivateModalOpen" :title="`Desativar acesso de ${userToDeactivate?.name}?`" @close="isDeactivateModalOpen = false">
      <div class="p-5 flex flex-col gap-4">
        <p class="text-sm text-light-text/80 dark:text-offwhite/80">
          A pessoa não conseguirá mais acessar o sistema, mas seu histórico de ações permanece registrado.
        </p>
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-light-border dark:border-dark-border">
          <BaseButton variant="outline" @click="isDeactivateModalOpen = false">Cancelar</BaseButton>
          <button @click="executeDeactivate" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium transition-colors text-sm">
            Desativar
          </button>
        </div>
      </div>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Pencil, UserMinus, UserPlus, Loader2 } from '@lucide/vue'
import BaseButton from '../BaseButton.vue'
import BaseModal from '../BaseModal.vue'
import BaseInput from '../BaseInput.vue'
import BaseBadge from '../BaseBadge.vue'

const emit = defineEmits(['unsaved-changes'])
const supabase = useSupabaseClient()

const { data: team, pending, refresh } = await useFetch<any[]>('/api/admin/team', { key: 'config_equipe' })

const isModalOpen = ref(false)
const isDeactivateModalOpen = ref(false)
const isEditing = ref(false)
const isLoadingSave = ref(false)
const formData = ref<{id: string, name: string, email: string, role: 'Gestão'}>({ id: '', name: '', email: '', role: 'Gestão' })
const userToDeactivate = ref<any>(null)

const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email))

const isFormValid = computed(() => {
  return formData.value.name.trim() !== '' && isEmailValid.value
})

const openModal = (member?: any) => {
  if (member) {
    isEditing.value = true
    formData.value = { ...member }
  } else {
    isEditing.value = false
    formData.value = { id: '', name: '', email: '', role: 'Gestão' }
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const save = async () => {
  if (!isFormValid.value) return
  isLoadingSave.value = true
  
  try {
    if (isEditing.value) {
      const { error } = await (supabase as any).rpc('alterar_acesso_gestao', {
        p_usuario_id: formData.value.id,
        p_nome: formData.value.name,
        p_ativo: true
      })
        
      if (error) throw error
    } else {
      await $fetch('/api/admin/invite-user', {
        method: 'POST',
        body: {
          nome: formData.value.name,
          email: formData.value.email,
          papel: 'gestao'
        }
      })
      
      alert(`Convite enviado para ${formData.value.email}.`)
    }
    
    await refresh()
    closeModal()
  } catch (error: any) {
    console.error('Erro ao salvar usuário:', error)
    alert(`Não foi possível concluir. ${error.message || 'Tente novamente.'}`)
  } finally {
    isLoadingSave.value = false
  }
}

const confirmDeactivate = (member: any) => {
  userToDeactivate.value = member
  isDeactivateModalOpen.value = true
}

const executeDeactivate = async () => {
  if (userToDeactivate.value) {
    try {
      const { error } = await (supabase as any).rpc('alterar_acesso_gestao', {
        p_usuario_id: userToDeactivate.value.id,
        p_nome: userToDeactivate.value.name,
        p_ativo: false
      })
        
      if (error) throw error
      await refresh()
    } catch (error: any) {
      console.error('Erro ao desativar usuário:', error)
      alert(`Não foi possível desativar. ${error.message || 'Tente novamente.'}`)
    }
  }
  isDeactivateModalOpen.value = false
}
</script>
