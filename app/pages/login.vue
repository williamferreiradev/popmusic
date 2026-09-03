<template>
  <div class="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-light-surface dark:bg-dark-surface p-8 rounded-xl shadow-lg border border-light-border dark:border-dark-border">
      
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-primary mb-2">Pop Music</h1>
        <p class="text-light-text/70 dark:text-offwhite/70">Acesse o sistema</p>
      </div>

      <form class="space-y-6" @submit.prevent="signInWithPassword">
        <div>
          <label for="email" class="block text-sm font-medium text-light-text dark:text-offwhite mb-2">
            E-mail
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="Digite seu e-mail"
            class="w-full px-4 py-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text dark:text-offwhite focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          >
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-light-text dark:text-offwhite mb-2">
            Senha
          </label>
          <div class="relative">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              placeholder="Digite sua senha"
              class="w-full px-4 py-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text dark:text-offwhite focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors pr-12"
            >
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-light-text/50 dark:text-offwhite/50 hover:text-primary dark:hover:text-primary transition-colors"
              @click="showPassword = !showPassword"
            >
              <Eye v-if="!showPassword" class="w-5 h-5" />
              <EyeOff v-else class="w-5 h-5" />
            </button>
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="loading" class="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"/>
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>

        <button
          type="button"
          :disabled="loading"
          class="w-full text-sm font-semibold text-primary hover:underline disabled:opacity-50"
          @click="requestPasswordRecovery"
        >
          Esqueci minha senha
        </button>

        <p v-if="errorMsg" class="text-sm text-red-500 text-center mt-4">
          {{ errorMsg }}
        </p>
        <p v-if="successMsg" class="text-sm text-green-600 dark:text-green-400 text-center mt-4">{{ successMsg }}</p>
      </form>
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { navigateTo } from '#app'
import { Eye, EyeOff } from '@lucide/vue'

definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const route = useRoute()

if (route.query.erro === 'acesso-invalido') {
  errorMsg.value = 'Seu acesso está inativo ou não possui um perfil válido. Procure a gestão da escola.'
}

async function redirectUser(userId?: string) {
  const id = userId || user.value?.id || (user.value as any)?.sub
  if (!id) {
    return navigateTo('/login')
  }

  try {
    const { data: userProfile, error } = await supabase
      .from('usuarios')
      .select('papel, ativo')
      .eq('id', id)
      .maybeSingle()

    if (error || !userProfile?.ativo) {
      await supabase.auth.signOut()
      return navigateTo('/login?erro=acesso-invalido')
    }
    const papel = userProfile.papel
    if (papel === 'professor') {
      return navigateTo('/professor')
    }
    if (papel === 'aluno') {
      return navigateTo('/aluno')
    }
    if (papel === 'gestao') return navigateTo('/dashboard')
    await supabase.auth.signOut()
    return navigateTo('/login?erro=acesso-invalido')
  } catch {
    await supabase.auth.signOut()
    return navigateTo('/login?erro=acesso-invalido')
  }
}

// Se o usuário já estiver logado ao abrir a tela de login, redireciona automaticamente
watch(user, (currentUser) => {
  if (currentUser) {
    redirectUser()
  }
}, { immediate: true })

async function signInWithPassword() {
  loading.value = true
  errorMsg.value = ''

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (error) {
      if (error.message === 'Invalid login credentials') {
        throw new Error('E-mail ou senha incorretos.')
      }
      throw error
    }
    
    // Redireciona imediatamente com base no usuário autenticado
    await redirectUser(data?.user?.id)
  } catch (err: any) {
    errorMsg.value = err.message || 'Erro ao realizar o login.'
  } finally {
    loading.value = false
  }
}

async function requestPasswordRecovery() {
  errorMsg.value = ''
  successMsg.value = ''
  const normalizedEmail = email.value.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errorMsg.value = 'Informe seu e-mail acima para recuperar a senha.'
    return
  }
  loading.value = true
  try {
    const redirectTo = `${window.location.origin}/confirm?mode=recovery`
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo })
    if (error) throw error
    successMsg.value = 'Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha.'
  } catch {
    // Resposta neutra evita revelar se um e-mail possui conta.
    successMsg.value = 'Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha.'
  } finally {
    loading.value = false
  }
}
</script>
