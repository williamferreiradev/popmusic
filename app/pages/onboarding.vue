<template>
  <div class="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-offwhite p-4 sm:p-8">
    <div class="mx-auto max-w-6xl">
      <header class="mb-8 flex flex-col gap-4">
        <div class="flex items-center justify-between gap-4"><div><p class="text-sm font-bold text-primary">CONFIGURAÇÃO INICIAL</p><h1 class="text-3xl font-bold">Vamos preparar sua escola</h1><p class="mt-1 opacity-70">Siga as etapas na ordem. Os dados são salvos diretamente no sistema.</p></div><button class="text-sm font-semibold text-red-500 hover:underline" @click="logout">Sair</button></div>
        <div class="grid grid-cols-5 gap-2">
          <button v-for="(item, index) in steps" :key="item.title" class="rounded-lg border p-2 text-left transition-colors" :class="index === step ? 'border-primary bg-primary/10 text-primary' : index < step ? 'border-green-500/40 bg-green-500/10' : 'border-light-border dark:border-dark-border opacity-60'" @click="index <= step && (step = index)">
            <span class="block text-xs font-bold">{{ index + 1 }}</span><span class="hidden sm:block text-sm font-semibold">{{ item.title }}</span>
          </button>
        </div>
      </header>

      <main class="rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-4 sm:p-8 shadow-sm">
        <div class="mb-6"><h2 class="text-2xl font-bold">{{ steps[step]?.title }}</h2><p class="text-sm opacity-70">{{ steps[step]?.description }}</p></div>
        <ConfigCobrancaContrato v-if="step === 0" />
        <ConfigModalidades v-else-if="step === 1" />
        <ConfigSalas v-else-if="step === 2" />
        <ConfigProfessores v-else-if="step === 3" />
        <ConfigTurmas v-else />

        <p v-if="errorMessage" class="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300" role="alert">{{ errorMessage }}</p>
        <div class="mt-8 flex justify-between border-t border-light-border dark:border-dark-border pt-5">
          <BaseButton variant="outline" :disabled="step === 0 || loading" @click="step--">Voltar</BaseButton>
          <BaseButton variant="primary" :disabled="loading" @click="continueSetup"><Loader2 v-if="loading" class="h-4 w-4 animate-spin" /> {{ step === steps.length - 1 ? 'Concluir configuração' : 'Salvar e continuar' }}</BaseButton>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Loader2 } from '@lucide/vue'
import BaseButton from '~/components/BaseButton.vue'
import ConfigCobrancaContrato from '~/components/configuracoes/ConfigCobrancaContrato.vue'
import ConfigModalidades from '~/components/configuracoes/ConfigModalidades.vue'
import ConfigSalas from '~/components/configuracoes/ConfigSalas.vue'
import ConfigProfessores from '~/components/configuracoes/ConfigProfessores.vue'
import ConfigTurmas from '~/components/configuracoes/ConfigTurmas.vue'

definePageMeta({ layout: false })
const supabase = useSupabaseClient()
const step = ref(0)
const loading = ref(false)
const errorMessage = ref('')
const steps = [
  { title: 'Escola', description: 'Informe os dados oficiais usados nos contratos, recibos e pagamentos.' },
  { title: 'Modalidades', description: 'Cadastre todos os cursos e instrumentos oferecidos.' },
  { title: 'Salas', description: 'Cadastre os espaços físicos e suas capacidades.' },
  { title: 'Professores', description: 'Cadastre professores, modalidades, comissão e chave PIX.' },
  { title: 'Turmas', description: 'Combine modalidade, professor, sala, dia e horário.' }
]

const validateStep = async () => {
  if (step.value === 0) {
    const { data, error } = await supabase.from('configuracoes').select('valor').eq('chave', 'escola').maybeSingle()
    if (error) throw error
    const school = data?.valor as Record<string, unknown> | null
    if (!school?.nome || !school?.telefone || !school?.email || !school?.endereco || !school?.pix_chave) throw new Error('Salve nome, endereço, telefone, e-mail e chave PIX da escola antes de continuar.')
    return
  }
  const tables = ['modalidades', 'salas', 'professores', 'turmas'] as const
  const table = tables[step.value - 1]
  if (!table) return
  const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true }).eq('ativo', true)
  if (error) throw error
  if (!count) throw new Error(`Cadastre pelo menos um item em ${steps[step.value]?.title} antes de continuar.`)
}

const continueSetup = async () => {
  loading.value = true; errorMessage.value = ''
  try {
    await validateStep()
    if (step.value < steps.length - 1) { step.value++; window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    const { error } = await (supabase as any).rpc('concluir_onboarding')
    if (error) throw error
    await navigateTo('/dashboard')
  } catch (error: any) { errorMessage.value = error.message || 'Não foi possível continuar.' }
  finally { loading.value = false }
}
const logout = async () => { await supabase.auth.signOut(); await navigateTo('/login') }
</script>
