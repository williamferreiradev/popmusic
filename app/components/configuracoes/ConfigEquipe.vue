<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-light-text dark:text-offwhite">Equipe</h2>
        <p class="text-sm text-light-text/60 dark:text-offwhite/60">Controle o acesso administrativo ao painel.</p>
      </div>
      <BaseButton variant="primary" class="flex items-center gap-2" :disabled="isLoadingSave || isGeneratingMemberId !== null" @click="openModal()">
        <UserPlus class="w-4 h-4" /> Criar acesso
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
            v-for="member in team"
            v-else
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
                <button v-if="member.status === 'Ativo' && member.email" :disabled="isGeneratingMemberId !== null" class="p-1.5 text-light-text/60 dark:text-offwhite/60 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Validar conta e gerar novo acesso" @click="generateMemberAccess(member)">
                  <Loader2 v-if="isGeneratingMemberId === member.id" class="w-4 h-4 animate-spin" />
                  <KeyRound v-else class="w-4 h-4" />
                </button>
                <button class="p-1.5 text-light-text/60 dark:text-offwhite/60 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Editar" :disabled="member.status === 'Inativo' || isGeneratingMemberId !== null" @click="openModal(member)">
                  <Pencil class="w-4 h-4" />
                </button>
                <button v-if="member.status === 'Ativo'" :disabled="isGeneratingMemberId !== null" class="p-1.5 text-light-text/60 dark:text-offwhite/60 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Desativar" @click="confirmDeactivate(member)">
                  <UserMinus class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Nova/Editar -->
    <BaseModal :is-open="isModalOpen" :title="isEditing ? 'Editar usuário' : 'Criar acesso de gestão'" @close="closeModal">
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
          <BaseButton variant="primary" :disabled="!isFormValid || isLoadingSave" class="flex items-center gap-2" @click="save">
            <Loader2 v-if="isLoadingSave" class="w-4 h-4 animate-spin" />
            {{ isEditing ? 'Salvar' : 'Criar acesso' }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Modal Desativar -->
    <BaseModal :is-open="isDeactivateModalOpen" :title="`Desativar acesso de ${userToDeactivate?.name}?`" @close="isDeactivateModalOpen = false">
      <div class="p-5 flex flex-col gap-4">
        <p class="text-sm text-light-text/80 dark:text-offwhite/80">
          A pessoa não conseguirá mais acessar o sistema, mas seu histórico de ações permanece registrado.
        </p>
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-light-border dark:border-dark-border">
          <BaseButton variant="outline" @click="isDeactivateModalOpen = false">Cancelar</BaseButton>
          <button class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium transition-colors text-sm" @click="executeDeactivate">
            Desativar
          </button>
        </div>
      </div>
    </BaseModal>

    <BaseModal :is-open="isAccessOpen" title="Acesso da gestão" @close="closeAccess">
      <div class="p-5 flex flex-col gap-4">
        <p class="text-sm text-light-text/70 dark:text-offwhite/70">O sistema não envia e-mail. Copie estas informações e encaminhe diretamente para a pessoa.</p>
        <div><label class="text-xs font-bold">Login</label><input :value="accessEmail" readonly class="mt-1 w-full rounded-md border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg px-3 py-2 text-sm text-light-text dark:text-offwhite"></div>
        <div v-if="temporaryPassword"><label class="text-xs font-bold">Senha temporária</label><input :value="temporaryPassword" readonly class="mt-1 w-full rounded-md border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg px-3 py-2 text-sm text-light-text dark:text-offwhite"></div>
        <div><label class="text-xs font-bold">Link</label><input :value="accessLink" readonly class="mt-1 w-full rounded-md border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg px-3 py-2 text-sm text-light-text dark:text-offwhite" @focus="($event.target as HTMLInputElement).select()"></div>
        <div class="flex justify-end gap-3">
          <BaseButton variant="outline" @click="closeAccess">Fechar</BaseButton>
          <BaseButton variant="primary" @click="copyAccess">{{ accessCopied ? 'Acesso copiado!' : 'Copiar acesso' }}</BaseButton>
        </div>
      </div>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { KeyRound, Pencil, UserMinus, UserPlus, Loader2 } from '@lucide/vue'
import BaseButton from '../BaseButton.vue'
import BaseModal from '../BaseModal.vue'
import BaseInput from '../BaseInput.vue'
import BaseBadge from '../BaseBadge.vue'

defineEmits(['unsaved-changes'])
const supabase = useSupabaseClient()

const { data: team, pending, refresh } = await useFetch<any[]>('/api/admin/team', { key: 'config_equipe' })

const isModalOpen = ref(false)
const isDeactivateModalOpen = ref(false)
const isEditing = ref(false)
const isLoadingSave = ref(false)
const isGeneratingMemberId = ref<string | null>(null)
const formData = ref<{id: string, name: string, email: string, role: 'Gestão'}>({ id: '', name: '', email: '', role: 'Gestão' })
const userToDeactivate = ref<any>(null)
const isAccessOpen = ref(false)
const accessLink = ref('')
const accessEmail = ref('')
const temporaryPassword = ref<string | null>(null)
const accessCopied = ref(false)

const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email))

const isFormValid = computed(() => {
  return formData.value.name.trim() !== '' && isEmailValid.value
})

const managementHeaders = async () => {
  const { data } = await supabase.auth.getSession()
  if (!data.session?.access_token) throw new Error('Sua sessão expirou. Entre novamente.')
  return { Authorization: `Bearer ${data.session.access_token}` }
}

const requestErrorMessage = (error: any, fallback: string) => String(
  error?.data?.message
  || error?.data?.statusMessage
  || error?.statusMessage
  || error?.message
  || fallback
)

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
  let generatedAccess: { activationLink: string; temporaryPassword: string | null; email: string } | null = null

  try {
    if (isEditing.value) {
      const { error } = await (supabase as any).rpc('alterar_acesso_gestao', {
        p_usuario_id: formData.value.id,
        p_nome: formData.value.name,
        p_ativo: true
      })

      if (error) throw error
    } else {
      const result = await $fetch<{ activationLink: string; temporaryPassword: string | null }>('/api/admin/invite-user', {
        method: 'POST',
        headers: await managementHeaders(),
        body: {
          nome: formData.value.name,
          email: formData.value.email,
          papel: 'gestao'
        }
      })
      generatedAccess = { ...result, email: formData.value.email }
    }

    await refresh()
    closeModal()
    if (generatedAccess) showAccess(generatedAccess.activationLink, generatedAccess.email, generatedAccess.temporaryPassword)
  } catch (error: any) {
    console.error('Erro ao salvar usuário:', error)
    alert(`Não foi possível concluir. ${requestErrorMessage(error, 'Tente novamente.')}`)
  } finally {
    isLoadingSave.value = false
  }
}

const generateMemberAccess = async (member: any) => {
  if (!member?.email || isGeneratingMemberId.value) return
  if (!confirm(`Validar a conta e gerar um novo acesso para ${member.email}?`)) return
  isGeneratingMemberId.value = member.id
  try {
    const result = await $fetch<{ activationLink: string; temporaryPassword: string | null }>('/api/admin/invite-user', {
      method: 'POST',
      headers: await managementHeaders(),
      body: { nome: member.name, email: member.email, papel: 'gestao' }
    })
    await refresh()
    showAccess(result.activationLink, member.email, result.temporaryPassword)
  } catch (error: any) {
    alert(`Não foi possível gerar o acesso. ${requestErrorMessage(error, 'Tente novamente.')}`)
  } finally {
    isGeneratingMemberId.value = null
  }
}

const showAccess = (link: string, email: string, password: string | null) => {
  accessLink.value = link
  accessEmail.value = email
  temporaryPassword.value = password
  accessCopied.value = false
  isAccessOpen.value = true
}

const closeAccess = () => {
  isAccessOpen.value = false
  accessLink.value = ''
  accessEmail.value = ''
  temporaryPassword.value = null
  accessCopied.value = false
}

const copyAccess = async () => {
  const text = temporaryPassword.value
    ? `Acesso Pop Music\nLogin: ${accessEmail.value}\nSenha temporária: ${temporaryPassword.value}\nLink: ${accessLink.value}\nAltere a senha no primeiro acesso.`
    : `Acesso Pop Music\nLogin: ${accessEmail.value}\nLink para redefinir a senha: ${accessLink.value}`
  try {
    await navigator.clipboard.writeText(text)
    accessCopied.value = true
  } catch {
    alert('Não foi possível copiar automaticamente. Selecione os campos e copie manualmente.')
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
