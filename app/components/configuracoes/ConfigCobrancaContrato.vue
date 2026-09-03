<template>
  <div class="flex flex-col h-full relative">
    <div class="flex flex-col gap-8 pb-24">
      <div class="flex flex-col gap-4">
        <div><h2 class="text-xl font-bold text-light-text dark:text-offwhite">Dados oficiais da escola</h2><p class="text-sm text-light-text/60 dark:text-offwhite/60">Fonte usada nos e-mails, contratos, recibos e instruções de pagamento.</p></div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseInput v-model="form.schoolName" label="Nome oficial" required />
          <BaseInput v-model="form.schoolCnpj" label="CNPJ" required />
          <BaseInput v-model="form.schoolAddress" label="Endereço completo" required />
          <BaseInput v-model="form.schoolPhone" label="Telefone / WhatsApp" required />
          <BaseInput v-model="form.schoolEmail" label="E-mail oficial" type="email" required />
          <BaseInput v-model="form.senderEmail" label="Remetente Resend (ex.: Pop Music <contato@dominio.com>)" required />
          <BaseInput v-model="form.pixKey" label="Chave PIX" />
        </div>
      </div>
      <div class="w-full h-px bg-light-border dark:bg-dark-border"/>
      
      <!-- Seção: Contrato -->
      <div class="flex flex-col gap-4">
        <div>
          <h2 class="text-xl font-bold text-light-text dark:text-offwhite">Regras de Contrato</h2>
          <p class="text-sm text-light-text/60 dark:text-offwhite/60">Padrões aplicados na geração do contrato de matrícula.</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseInput v-model="form.courseDurationMonths" label="Duração do curso básico (meses)" type="number" />
          <BaseInput v-model="form.extensionMonths" label="Prorrogação padrão (meses)" type="number" />
          <BaseInput v-model="form.cancelClassAdvanceHours" label="Antecedência mínima para cancelar aula (horas)" type="number" />
          <BaseInput v-model="form.extraClassPrice" label="Valor de aula extra fora do horário (R$)" type="number" />
          <BaseInput v-model="form.linkValidityDays" label="Validade do link de assinatura (dias)" type="number" />
          <div class="flex items-center gap-3 h-[72px] px-2">
            <input id="requireImage" v-model="form.requireImageConsent" type="checkbox" class="w-4 h-4 text-primary focus:ring-primary rounded border-light-border dark:border-dark-border" >
            <label for="requireImage" class="text-sm font-medium text-light-text dark:text-offwhite cursor-pointer">Exigir aceite de cessão de imagem/voz no cadastro</label>
          </div>
        </div>
      </div>

      <div class="w-full h-px bg-light-border dark:bg-dark-border"/>

      <!-- Seção: Cobrança -->
      <div class="flex flex-col gap-4">
        <div>
          <h2 class="text-xl font-bold text-light-text dark:text-offwhite">Regras de Cobrança</h2>
          <p class="text-sm text-light-text/60 dark:text-offwhite/60">Configurações para o motor automático de mensalidades e juros.</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseInput v-model="form.dueDateReminderDays" label="Dias de antecedência do lembrete de vencimento" type="number" />
          <BaseInput v-model="form.lateFee" label="Multa por atraso (R$)" type="number" />
          <BaseInput v-model="form.interestPerDay" label="Juros por dia de atraso (%)" type="number" step="0.01" />
          <BaseInput v-model="form.secondCopyFee" label="Valor da 2ª via de carnê/boleto (R$)" type="number" />
          
          <div class="flex flex-col">
            <BaseInput v-model="form.autoDisconnectDays" label="Atraso para desligamento automático da grade (dias)" type="number" />
            <p class="text-xs text-light-text/60 dark:text-offwhite/60 mt-1 px-1">
              Após esse prazo, o aluno é removido da grade de horários automaticamente, mas a dívida permanece registrada.
            </p>
          </div>

          <div class="flex flex-col">
            <BaseInput v-model="form.lockBillingCutoffDay" label="Dia limite para trancamento sem cobrança do mês" type="number" />
            <p class="text-xs text-light-text/60 dark:text-offwhite/60 mt-1 px-1">
              (Opcional) Se o aluno trancar a matrícula antes ou até este dia, a fatura do mês corrente não será cobrada.
            </p>
          </div>
        </div>
      </div>

    </div>

    <!-- Sticky Footer para Salvar -->
    <div class="fixed md:absolute bottom-0 left-0 w-full bg-light-surface dark:bg-dark-surface border-t border-light-border dark:border-dark-border p-4 flex justify-end z-10">
      <BaseButton variant="primary" :disabled="!hasChanges || isLoadingSave" class="px-8 flex items-center gap-2" @click="handleSave">
        <Loader2 v-if="isLoadingSave" class="w-4 h-4 animate-spin" />
        Salvar alterações
      </BaseButton>
    </div>

    <!-- Modal Confirmação Regra Sensível -->
    <BaseModal :is-open="isConfirmModalOpen" title="Confirmar alteração de regra financeira" @close="isConfirmModalOpen = false">
      <div class="p-5 flex flex-col gap-4">
        <div class="bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 p-4 rounded-lg text-sm">
          <p>Esta mudança afeta apenas <strong>cobranças futuras</strong>. Cobranças já em atraso mantêm a regra vigente no momento em que venceram.</p>
        </div>
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-light-border dark:border-dark-border">
          <BaseButton variant="outline" @click="isConfirmModalOpen = false">Cancelar</BaseButton>
          <BaseButton variant="primary" :disabled="isLoadingSave" class="flex items-center gap-2" @click="executeSave">
            <Loader2 v-if="isLoadingSave" class="w-4 h-4 animate-spin" />
            Confirmar
          </BaseButton>
        </div>
      </div>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Loader2 } from '@lucide/vue'
import BaseInput from '../BaseInput.vue'
import BaseButton from '../BaseButton.vue'
import BaseModal from '../BaseModal.vue'

const emit = defineEmits(['unsaved-changes'])
const supabase = useSupabaseClient()
const asConfigRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}

const form = ref<any>({
  schoolName: '', schoolCnpj: '', schoolAddress: '', schoolPhone: '', schoolEmail: '', senderEmail: '', pixKey: '',
  courseDurationMonths: 12,
  extensionMonths: 6,
  cancelClassAdvanceHours: 2,
  extraClassPrice: 50,
  linkValidityDays: 7,
  requireImageConsent: true,
  dueDateReminderDays: 3,
  lateFee: 5,
  interestPerDay: 0.2,
  secondCopyFee: 30,
  autoDisconnectDays: 30,
  lockBillingCutoffDay: 10
})
const originalForm = ref<any>({ ...form.value })
const isConfirmModalOpen = ref(false)
const isLoadingSave = ref(false)

await useAsyncData('config_cobranca_contrato', async () => {
  const { data: configs } = await supabase.from('configuracoes').select('*').in('chave', ['contrato', 'cobranca', 'escola'])
  
  if (configs) {
    const escolaDb = asConfigRecord(configs.find(c => c.chave === 'escola')?.valor)
    if (escolaDb) {
      form.value.schoolName = escolaDb.nome || ''
      form.value.schoolCnpj = escolaDb.cnpj || ''
      form.value.schoolAddress = escolaDb.endereco || ''
      form.value.schoolPhone = escolaDb.telefone || ''
      form.value.schoolEmail = escolaDb.email || ''
      form.value.senderEmail = escolaDb.email_remetente || ''
      form.value.pixKey = escolaDb.pix_chave || ''
    }
    const contratoDb = asConfigRecord(configs.find(c => c.chave === 'contrato')?.valor)
    if (contratoDb) {
      form.value.courseDurationMonths = contratoDb.duracao_curso_meses ?? 12
      form.value.extensionMonths = contratoDb.prorrogacao_padrao_meses ?? 6
      form.value.cancelClassAdvanceHours = contratoDb.antecedencia_cancelamento_horas ?? 2
      form.value.extraClassPrice = contratoDb.valor_aula_extra ?? 50
      form.value.linkValidityDays = contratoDb.validade_link_dias ?? 7
      form.value.requireImageConsent = contratoDb.exigir_cessao_imagem ?? true
    }
    const cobrancaDb = asConfigRecord(configs.find(c => c.chave === 'cobranca')?.valor)
    if (cobrancaDb) {
      form.value.dueDateReminderDays = cobrancaDb.dias_lembrete_vencimento ?? 3
      form.value.lateFee = cobrancaDb.multa_atraso ?? 5
      form.value.interestPerDay = cobrancaDb.juros_atraso_percentual ?? 0.2
      form.value.secondCopyFee = cobrancaDb.valor_segunda_via ?? 30
      form.value.autoDisconnectDays = cobrancaDb.dias_desligamento_automatico ?? 30
      form.value.lockBillingCutoffDay = cobrancaDb.dia_limite_trancamento_sem_cobranca ?? 10
    }
  }
  
  originalForm.value = { ...form.value }
  return true
})

const hasChanges = computed(() => {
  return JSON.stringify(form.value) !== JSON.stringify(originalForm.value)
})

watch(hasChanges, (newVal) => {
  emit('unsaved-changes', newVal)
})

const handleSave = () => {
  const sensitiveChanged = 
    Number(form.value.lateFee) !== Number(originalForm.value.lateFee) || 
    Number(form.value.autoDisconnectDays) !== Number(originalForm.value.autoDisconnectDays)

  if (sensitiveChanged) {
    isConfirmModalOpen.value = true
  } else {
    executeSave()
  }
}

const executeSave = async () => {
  isLoadingSave.value = true
  const parsedForm = {
    ...form.value,
    courseDurationMonths: Number(form.value.courseDurationMonths),
    extensionMonths: Number(form.value.extensionMonths),
    cancelClassAdvanceHours: Number(form.value.cancelClassAdvanceHours),
    extraClassPrice: Number(form.value.extraClassPrice),
    linkValidityDays: Number(form.value.linkValidityDays),
    dueDateReminderDays: Number(form.value.dueDateReminderDays),
    lateFee: Number(form.value.lateFee),
    interestPerDay: Number(form.value.interestPerDay),
    secondCopyFee: Number(form.value.secondCopyFee),
    autoDisconnectDays: Number(form.value.autoDisconnectDays),
    lockBillingCutoffDay: Number(form.value.lockBillingCutoffDay),
  }

  const contratoToSave = {
    duracao_curso_meses: parsedForm.courseDurationMonths,
    prorrogacao_padrao_meses: parsedForm.extensionMonths,
    antecedencia_cancelamento_horas: parsedForm.cancelClassAdvanceHours,
    valor_aula_extra: parsedForm.extraClassPrice,
    validade_link_dias: parsedForm.linkValidityDays,
    exigir_cessao_imagem: parsedForm.requireImageConsent
  }

  const cobrancaToSave = {
    dias_lembrete_vencimento: parsedForm.dueDateReminderDays,
    multa_atraso: parsedForm.lateFee,
    juros_atraso_percentual: parsedForm.interestPerDay,
    valor_segunda_via: parsedForm.secondCopyFee,
    dias_desligamento_automatico: parsedForm.autoDisconnectDays,
    dia_limite_trancamento_sem_cobranca: parsedForm.lockBillingCutoffDay
  }
  const escolaToSave = { nome: parsedForm.schoolName.trim(), cnpj: parsedForm.schoolCnpj.trim(), endereco: parsedForm.schoolAddress.trim(), telefone: parsedForm.schoolPhone.trim(), email: parsedForm.schoolEmail.trim().toLowerCase(), email_remetente: parsedForm.senderEmail.trim(), pix_chave: parsedForm.pixKey.trim() }

  try {
    const { error } = await supabase.from('configuracoes').upsert([
      { chave: 'contrato', valor: contratoToSave },
      { chave: 'cobranca', valor: cobrancaToSave },
      { chave: 'escola', valor: escolaToSave }
    ])
    
    if (error) throw error
    
    originalForm.value = { ...parsedForm }
    form.value = { ...parsedForm }
    
    isConfirmModalOpen.value = false
    emit('unsaved-changes', false)
    alert('Configurações de cobrança e contrato atualizadas com sucesso.')
  } catch (error: any) {
    console.error('Erro ao salvar configurações:', error)
    alert(`Não foi possível salvar. ${error.message || 'Tente novamente.'}`)
  } finally {
    isLoadingSave.value = false
  }
}
</script>
