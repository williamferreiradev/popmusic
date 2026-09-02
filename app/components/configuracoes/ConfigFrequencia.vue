<template>
  <div class="flex flex-col h-full relative">
    <div class="flex flex-col gap-8 pb-24">
      
      <!-- Seção: Regras de Evasão e Presença -->
      <div class="flex flex-col gap-4">
        <div>
          <h2 class="text-xl font-bold text-light-text dark:text-offwhite">Regras de Frequência</h2>
          <p class="text-sm text-light-text/60 dark:text-offwhite/60">Configura limites usados pelo cálculo automático de risco de evasão e check-in.</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseInput v-model="form.consecutiveAbsencesRisk" label="Faltas consecutivas para sinalizar risco de evasão" type="number" />
          <BaseInput v-model="form.minAttendancePercentage" label="Percentual mínimo de frequência aceitável (%)" type="number" />
          
          <div class="flex flex-col">
            <BaseInput v-model="form.qrCodeToleranceMinutes" label="Janela de tolerância do check-in por QR Code (minutos)" type="number" />
            <p class="text-xs text-light-text/60 dark:text-offwhite/60 mt-1 px-1">
              Tempo antes e depois do horário da aula em que o totem aceita a leitura do QR Code do aluno.
            </p>
          </div>
        </div>
      </div>

      <div class="w-full h-px bg-light-border dark:bg-dark-border"></div>

      <!-- Seção: Feriados -->
      <div class="flex flex-col gap-4">
        <div>
          <h2 class="text-xl font-bold text-light-text dark:text-offwhite">Feriados e Reposições</h2>
          <p class="text-sm text-light-text/60 dark:text-offwhite/60">Configura a política da escola quanto a agendamento em datas comemorativas.</p>
        </div>
        
        <div class="flex flex-col gap-4">
          <div class="flex items-start gap-3 px-2" title="Regra fixa de contrato.">
            <input 
              type="checkbox" 
              v-model="form.blockNationalHolidays" 
              id="blockNational" 
              disabled
              class="w-4 h-4 mt-1 text-primary focus:ring-primary rounded border-light-border dark:border-dark-border disabled:opacity-50" 
            />
            <div class="flex flex-col">
              <label for="blockNational" class="text-sm font-medium text-light-text/60 dark:text-offwhite/60 cursor-not-allowed">Bloquear agendamento de reposição em feriados nacionais</label>
              <p class="text-xs text-light-text/40 dark:text-offwhite/40">Esta regra é fixa no contrato da escola e não pode ser desativada por aqui.</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3 px-2">
            <input 
              type="checkbox" 
              v-model="form.blockMunicipalHolidays" 
              id="blockMunicipal" 
              class="w-4 h-4 mt-1 text-primary focus:ring-primary rounded border-light-border dark:border-dark-border" 
            />
            <div class="flex flex-col">
              <label for="blockMunicipal" class="text-sm font-medium text-light-text dark:text-offwhite cursor-pointer">Bloquear também em feriados municipais (Novo Gama-GO)</label>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Sticky Footer para Salvar -->
    <div class="fixed md:absolute bottom-0 left-0 w-full bg-light-surface dark:bg-dark-surface border-t border-light-border dark:border-dark-border p-4 flex justify-end z-10">
      <BaseButton variant="primary" @click="handleSave" :disabled="!hasChanges || isLoadingSave" class="px-8 flex items-center gap-2">
        <Loader2 v-if="isLoadingSave" class="w-4 h-4 animate-spin" />
        Salvar alterações
      </BaseButton>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Loader2 } from '@lucide/vue'
import BaseInput from '../BaseInput.vue'
import BaseButton from '../BaseButton.vue'

const emit = defineEmits(['unsaved-changes'])
const supabase = useSupabaseClient()

const form = ref<any>({
  consecutiveAbsencesRisk: 3,
  minAttendancePercentage: 70,
  qrCodeToleranceMinutes: 15,
  blockNationalHolidays: true,
  blockMunicipalHolidays: false
})
const originalForm = ref<any>({ ...form.value })
const isLoadingSave = ref(false)

const { pending } = await useAsyncData('config_frequencia', async () => {
  const { data: configs } = await supabase.from('configuracoes').select('*').eq('chave', 'frequencia').single()
  
  if (configs && configs.valor) {
    form.value.consecutiveAbsencesRisk = configs.valor.faltas_consecutivas_risco ?? 3
    form.value.minAttendancePercentage = configs.valor.percentual_minimo_frequencia ?? 70
    form.value.qrCodeToleranceMinutes = configs.valor.janela_checkin_minutos ?? 15
    // O valor do banco para nacional deve sempre ser sobrescrito/mantido como true na interface
    form.value.blockNationalHolidays = true
    form.value.blockMunicipalHolidays = configs.valor.bloquear_reposicao_feriado_municipal ?? false
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

const handleSave = async () => {
  isLoadingSave.value = true
  const parsedForm = {
    ...form.value,
    consecutiveAbsencesRisk: Number(form.value.consecutiveAbsencesRisk),
    minAttendancePercentage: Number(form.value.minAttendancePercentage),
    qrCodeToleranceMinutes: Number(form.value.qrCodeToleranceMinutes),
    blockNationalHolidays: true // Sempre true
  }

  const frequenciaToSave = {
    faltas_consecutivas_risco: parsedForm.consecutiveAbsencesRisk,
    percentual_minimo_frequencia: parsedForm.minAttendancePercentage,
    janela_checkin_minutos: parsedForm.qrCodeToleranceMinutes,
    bloquear_reposicao_feriado_nacional: true,
    bloquear_reposicao_feriado_municipal: parsedForm.blockMunicipalHolidays
  }

  try {
    const { error } = await supabase.from('configuracoes').upsert({ 
      chave: 'frequencia', 
      valor: frequenciaToSave 
    })
    
    if (error) throw error
    
    originalForm.value = { ...parsedForm }
    form.value = { ...parsedForm }
    
    emit('unsaved-changes', false)
    alert('Configurações de frequência e reposição atualizadas com sucesso.')
  } catch (error: any) {
    console.error('Erro ao salvar configurações:', error)
    alert(`Não foi possível salvar. ${error.message || 'Tente novamente.'}`)
  } finally {
    isLoadingSave.value = false
  }
}
</script>
