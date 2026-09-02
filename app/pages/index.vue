<template>
  <div class="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg">
    <Loader2 class="w-8 h-8 animate-spin text-primary" />
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { Loader2 } from '@lucide/vue'

const user = useSupabaseUser()
const supabase = useSupabaseClient()

async function redirect() {
  const userId = user.value?.id || (user.value as any)?.sub
  if (!userId) {
    return navigateTo('/login')
  }

  try {
    const { data: userProfile } = await supabase
      .from('usuarios')
      .select('papel')
      .eq('id', userId)
      .maybeSingle()

    const papel = userProfile?.papel
    if (papel === 'professor') return navigateTo('/professor')
    if (papel === 'aluno') return navigateTo('/aluno')
    return navigateTo('/dashboard')
  } catch {
    return navigateTo('/dashboard')
  }
}

watch(user, () => {
  redirect()
}, { immediate: true })
</script>
