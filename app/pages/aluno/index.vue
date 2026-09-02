<template>
  <div class="p-8 w-full flex flex-col gap-6">
    <header class="flex flex-col gap-2">
      <h1 class="text-2xl font-bold text-light-text dark:text-offwhite">Olá, {{ userProfile?.nome?.split(' ')[0] || 'Aluno' }}!</h1>
      <p class="text-sm text-light-text/60 dark:text-offwhite/50">Bem-vindo(a) ao seu portal do aluno. Aqui está o resumo das suas atividades.</p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Próxima Aula -->
      <div class="bg-light-surface dark:bg-dark-surface p-5 rounded-xl border border-light-border dark:border-dark-border shadow-sm">
        <div class="flex items-center gap-3 text-primary mb-2">
          <CalendarDays class="w-5 h-5" />
          <h3 class="font-bold">Próxima Aula</h3>
        </div>
        <p class="text-sm text-light-text/70 dark:text-offwhite/70">Acompanhe suas aulas em "Minhas Aulas".</p>
        <NuxtLink to="/aluno/aulas" class="mt-4 block text-xs font-bold text-primary hover:underline">Ver agenda completa &rarr;</NuxtLink>
      </div>

      <!-- Financeiro -->
      <div class="bg-light-surface dark:bg-dark-surface p-5 rounded-xl border border-light-border dark:border-dark-border shadow-sm">
        <div class="flex items-center gap-3 text-[#ff8a8a] mb-2">
          <CreditCard class="w-5 h-5" />
          <h3 class="font-bold">Financeiro</h3>
        </div>
        <p class="text-sm text-light-text/70 dark:text-offwhite/70">Acesse suas faturas e histórico de pagamentos.</p>
        <NuxtLink to="/aluno/financeiro" class="mt-4 block text-xs font-bold text-[#ff8a8a] hover:underline">Ver minhas cobranças &rarr;</NuxtLink>
      </div>

      <!-- Frequência -->
      <div class="bg-light-surface dark:bg-dark-surface p-5 rounded-xl border border-light-border dark:border-dark-border shadow-sm">
        <div class="flex items-center gap-3 text-gold mb-2">
          <CheckSquare class="w-5 h-5" />
          <h3 class="font-bold">Frequência</h3>
        </div>
        <p class="text-sm text-light-text/70 dark:text-offwhite/70">Confira seu histórico de faltas e presenças.</p>
        <NuxtLink to="/aluno/frequencia" class="mt-4 block text-xs font-bold text-gold hover:underline">Ver minha frequência &rarr;</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CalendarDays, CreditCard, CheckSquare } from '@lucide/vue'

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const { data: userProfile } = await useAsyncData('aluno_profile_home', async () => {
  if (!user.value?.sub) return null
  const { data } = await supabase.from('usuarios').select('nome').eq('id', user.value.sub).single()
  return data
})
</script>
