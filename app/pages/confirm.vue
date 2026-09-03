<template>
  <div class="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-light-surface dark:bg-dark-surface p-8 rounded-xl shadow-lg border border-light-border dark:border-dark-border">
      <h1 class="text-2xl font-bold text-primary text-center">Defina sua senha</h1>
      <p class="text-sm text-light-text/70 dark:text-offwhite/70 text-center mt-2 mb-6">Use pelo menos 8 caracteres, com letra maiúscula, minúscula e número.</p>

      <div v-if="checking" class="text-center py-8">Validando link...</div>
      <div v-else-if="invalidLink" class="text-center space-y-4">
        <p class="text-red-500">Este link é inválido, expirou ou já foi utilizado.</p>
        <NuxtLink to="/login" class="text-primary font-semibold hover:underline">Voltar ao login</NuxtLink>
      </div>
      <form v-else class="space-y-4" @submit.prevent="savePassword">
        <BaseInput v-model="password" label="Nova senha" type="password" required />
        <BaseInput v-model="confirmation" label="Confirme a senha" type="password" required />
        <p v-if="errorMsg" class="text-sm text-red-500">{{ errorMsg }}</p>
        <BaseButton type="submit" variant="primary" class="w-full" :disabled="saving">{{ saving ? 'Salvando...' : 'Salvar senha e acessar' }}</BaseButton>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isStrongPassword } from '~/utils/authRules'
import { isUserRole, roleDestination } from '~/utils/accessControl'

definePageMeta({ layout: false })
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const checking = ref(true)
const invalidLink = ref(false)
const saving = ref(false)
const password = ref('')
const confirmation = ref('')
const errorMsg = ref('')

onMounted(async () => {
  // O callback pode levar alguns segundos em redes móveis; confirme a sessão diretamente.
  for (let attempt = 0; attempt < 20 && !user.value; attempt++) {
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) break
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  const { data } = await supabase.auth.getSession()
  invalidLink.value = !data.session?.user
  checking.value = false
})

const destination = async () => {
  const { data } = await supabase.from('usuarios').select('papel, ativo').eq('id', user.value!.id).maybeSingle()
  if (!data?.ativo || !isUserRole(data.papel)) {
    await supabase.auth.signOut()
    return '/login?erro=acesso-invalido'
  }
  return roleDestination[data.papel]
}

const savePassword = async () => {
  errorMsg.value = ''
  if (password.value !== confirmation.value) { errorMsg.value = 'As senhas não coincidem.'; return }
  if (!isStrongPassword(password.value)) {
    errorMsg.value = 'A senha não atende aos requisitos mínimos.'; return
  }
  saving.value = true
  const { error } = await supabase.auth.updateUser({ password: password.value })
  if (error) { errorMsg.value = error.message; saving.value = false; return }
  await navigateTo(await destination())
}
</script>
