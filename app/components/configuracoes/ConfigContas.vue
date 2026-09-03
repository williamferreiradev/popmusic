<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-light-text dark:text-offwhite">Contas Financeiras</h2>
        <p class="text-sm text-light-text/60 dark:text-offwhite/60">Bancos e carteiras onde o dinheiro da escola entra e sai.</p>
      </div>
      <BaseButton variant="primary" @click="openModal()" class="flex items-center gap-2">
        <Plus class="w-4 h-4" /> Nova conta
      </BaseButton>
    </div>

    <!-- Tabela -->
    <div class="overflow-x-auto rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface shadow-sm">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-light-border/30 dark:bg-dark-border/30 border-b border-light-border dark:border-dark-border text-sm font-medium text-light-text/70 dark:text-offwhite/70">
            <th class="py-3 px-4">Nome da conta</th>
            <th class="py-3 px-4">Tipo</th>
            <th class="py-3 px-4 text-right">Saldo Inicial</th>
            <th class="py-3 px-4 w-24 text-center">Ações</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          <tr v-if="pending">
            <td colspan="4" class="py-8 text-center">
              <div class="flex justify-center"><Loader2 class="w-6 h-6 animate-spin text-primary" /></div>
            </td>
          </tr>
          <tr v-else-if="!financialAccounts || financialAccounts.length === 0">
            <td colspan="4" class="py-8 text-center text-light-text/50 dark:text-offwhite/50">Nenhuma conta cadastrada.</td>
          </tr>
          <tr 
            v-else
            v-for="account in financialAccounts" 
            :key="account.id"
            class="border-b border-light-border dark:border-dark-border last:border-0 hover:bg-light-border/20 dark:hover:bg-dark-border/20 transition-colors"
          >
            <td class="py-3 px-4 font-medium text-light-text dark:text-offwhite">{{ account.name }}</td>
            <td class="py-3 px-4 text-light-text dark:text-offwhite">{{ formatAccountType(account.type) }}</td>
            <td class="py-3 px-4 text-right text-light-text dark:text-offwhite">R$ {{ account.initialBalance.toFixed(2) }}</td>
            <td class="py-3 px-4 text-center">
              <div class="flex items-center justify-center gap-2">
                <button @click="openModal(account)" class="p-1.5 text-light-text/60 dark:text-offwhite/60 hover:text-primary transition-colors" title="Editar">
                  <Pencil class="w-4 h-4" />
                </button>
                <button @click="confirmDelete(account)" class="p-1.5 text-light-text/60 dark:text-offwhite/60 hover:text-red-500 transition-colors" title="Excluir">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Nova/Editar -->
    <BaseModal :isOpen="isModalOpen" :title="isEditing ? 'Editar conta' : 'Nova conta'" @close="closeModal">
      <div class="p-5 flex flex-col gap-4">
        <BaseInput v-model="formData.name" label="Nome da conta" placeholder="Ex: Nubank, Caixa, Dinheiro Físico" required />
        
        <BaseSelect v-model="formData.type" label="Tipo" :options="[{label: 'Banco', value: 'banco'}, {label: 'Carteira digital', value: 'carteira_digital'}, {label: 'Dinheiro físico', value: 'dinheiro_fisico'}]" />
        
        <BaseInput v-model="formData.initialBalance" label="Saldo inicial (R$)" type="number" placeholder="0.00" required :disabled="isEditing" />
        <p v-if="!isEditing" class="text-xs text-light-text/60 dark:text-offwhite/60 -mt-2">O saldo inicial é usado como ponto de partida pro cálculo automático do Fluxo de Caixa.</p>
        
        <div class="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-light-border dark:border-dark-border">
          <BaseButton variant="outline" @click="closeModal">Cancelar</BaseButton>
          <BaseButton variant="primary" @click="save" :disabled="!isFormValid || isLoadingSave" class="flex items-center gap-2">
            <Loader2 v-if="isLoadingSave" class="w-4 h-4 animate-spin" />
            Salvar
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Modal Arquivar / Bloqueio Exclusão -->
    <BaseModal :isOpen="isBlockModalOpen" title="Não é possível excluir" @close="isBlockModalOpen = false">
      <div class="p-5 flex flex-col gap-4">
        <p class="text-sm text-light-text/80 dark:text-offwhite/80">
          Esta conta possui lançamentos registrados no Fluxo de Caixa e não pode ser excluída para não quebrar o histórico financeiro.
        </p>
        <p class="text-sm text-light-text/80 dark:text-offwhite/80">
          Você pode <strong>arquivar</strong> a conta. Ela deixará de aparecer como opção para novos lançamentos, mas o histórico será mantido.
        </p>
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-light-border dark:border-dark-border">
          <BaseButton variant="outline" @click="isBlockModalOpen = false">Cancelar</BaseButton>
          <BaseButton variant="primary" @click="archiveAccount">Arquivar conta</BaseButton>
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
import BaseSelect from '../BaseSelect.vue'

const emit = defineEmits(['unsaved-changes'])
const supabase = useSupabaseClient()

const { data: financialAccounts, pending, refresh } = await useAsyncData('config_contas', async () => {
  const { data, error } = await supabase
    .from('contas_financeiras')
    .select('*')
    .eq('ativo', true)
    .order('nome')

  if (error) {
    console.error('Erro ao buscar contas:', error)
    return []
  }

  return (data || []).map((c: any) => ({
    id: c.id,
    name: c.nome,
    type: c.tipo,
    initialBalance: Number(c.saldo_inicial) || 0,
    hasTransactions: false // we will rely on FK error to determine this during deletion
  }))
})

const isModalOpen = ref(false)
const isBlockModalOpen = ref(false)
const isEditing = ref(false)
const isLoadingSave = ref(false)
const accountToArchive = ref<any>(null)
type AccountType = 'banco' | 'carteira_digital' | 'dinheiro_fisico'
const formData = ref<{id: string, name: string, type: AccountType, initialBalance: string}>({ id: '', name: '', type: 'banco', initialBalance: '' })
const formatAccountType = (type: AccountType) => ({ banco: 'Banco', carteira_digital: 'Carteira digital', dinheiro_fisico: 'Dinheiro físico' })[type]

const isFormValid = computed(() => {
  return formData.value.name.trim() !== '' && formData.value.initialBalance !== ''
})

const openModal = (account?: any) => {
  if (account) {
    isEditing.value = true
    formData.value = { ...account, initialBalance: account.initialBalance.toString() }
  } else {
    isEditing.value = false
    formData.value = { id: '', name: '', type: 'banco', initialBalance: '' }
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const save = async () => {
  if (!isFormValid.value) return
  isLoadingSave.value = true
  
  const balance = parseFloat(formData.value.initialBalance) || 0
  
  try {
    if (isEditing.value) {
      const { error } = await supabase
        .from('contas_financeiras')
        .update({
          nome: formData.value.name,
          tipo: formData.value.type
        })
        .eq('id', formData.value.id)
        
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('contas_financeiras')
        .insert({
          nome: formData.value.name,
          tipo: formData.value.type,
          saldo_inicial: balance
        })
        
      if (error) throw error
    }
    await refresh()
    closeModal()
  } catch (error: any) {
    console.error('Erro ao salvar conta:', error)
    alert(`Não foi possível salvar. ${error.message || 'Tente novamente.'}`)
  } finally {
    isLoadingSave.value = false
  }
}

const confirmDelete = async (account: any) => {
  if (confirm(`Tem certeza que deseja excluir a conta ${account.name}?`)) {
    try {
      const { error } = await supabase
        .from('contas_financeiras')
        .delete()
        .eq('id', account.id)
        
      if (error) {
        // Se houver erro de FK (23503) ou outro erro de restrição
        if (error.code === '23503') {
          accountToArchive.value = account
          isBlockModalOpen.value = true
          return
        }
        throw error
      }
      await refresh()
    } catch (error: any) {
      console.error('Erro ao deletar conta:', error)
      alert(`Não foi possível excluir. ${error.message || 'Tente novamente.'}`)
    }
  }
}

const archiveAccount = async () => {
  if (accountToArchive.value) {
    try {
      const { error } = await supabase
        .from('contas_financeiras')
        .update({ ativo: false })
        .eq('id', accountToArchive.value.id)
        
      if (error) throw error
      await refresh()
      alert(`Conta ${accountToArchive.value.name} arquivada com sucesso.`)
    } catch (error: any) {
      console.error('Erro ao arquivar conta:', error)
      alert(`Não foi possível arquivar. ${error.message || 'Tente novamente.'}`)
    }
  }
  isBlockModalOpen.value = false
}
</script>
