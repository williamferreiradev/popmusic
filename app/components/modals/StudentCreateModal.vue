<template>
  <BaseModal 
    :is-open="isOpen" 
    :title="createdContractData ? 'Matrícula Realizada com Sucesso!' : 'Nova Matrícula'" 
    max-width="md"
    @close="handleClose"
  >
    <!-- Tela de Sucesso com Link de Assinatura Automático -->
    <div v-if="createdContractData" class="flex flex-col items-center text-center gap-4 py-2">
      <div class="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20">
        <CheckCircle2 class="w-8 h-8" />
      </div>
      
      <div>
        <h3 class="text-xl font-bold text-light-text dark:text-offwhite">{{ createdContractData.studentName }}</h3>
        <p class="text-sm text-light-text/70 dark:text-offwhite/70 mt-1">
          Aluno cadastrado e contrato digital gerado automaticamente!
        </p>
      </div>

      <!-- Aviso de E-mail Enviado -->
      <div v-if="createdContractData.email" class="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
        <Mail class="w-4 h-4 shrink-0" />
        Link enviado automaticamente para: {{ createdContractData.email }}
      </div>

      <!-- Caixa do Link -->
      <div class="w-full bg-light-bg dark:bg-dark-bg p-3 rounded-lg border border-light-border dark:border-dark-border flex items-center justify-between gap-2">
        <span class="text-xs font-mono text-light-text/80 dark:text-offwhite/80 truncate text-left">
          {{ contractSignUrl }}
        </span>
        <button 
          type="button" 
          class="px-3 py-1.5 bg-light-surface dark:bg-dark-surface hover:bg-light-border dark:hover:bg-dark-border border border-light-border dark:border-dark-border rounded text-xs font-bold text-light-text dark:text-offwhite flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          @click="copyLink"
        >
          <Copy class="w-3.5 h-3.5" />
          {{ copied ? 'Copiado!' : 'Copiar' }}
        </button>
      </div>

      <!-- Botões de Ação do Link -->
      <div class="flex flex-col sm:flex-row gap-2 w-full">
        <a 
          :href="contractSignUrl"
          target="_blank"
          class="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
        >
          <ExternalLink class="w-4 h-4" />
          Abrir Contrato Agora
        </a>
        <a 
          v-if="createdContractData.phone"
          :href="whatsappUrl"
          target="_blank"
          class="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
        >
          <MessageCircle class="w-4 h-4" />
          Enviar no WhatsApp
        </a>
      </div>

      <button 
        type="button" 
        class="w-full py-2.5 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-bg text-light-text dark:text-offwhite text-sm font-medium rounded-lg transition-colors cursor-pointer"
        @click="handleClose"
      >
        Fechar e Ver Lista de Alunos
      </button>
    </div>

    <!-- Formulário de Matrícula -->
    <form v-else class="flex flex-col gap-4" @submit.prevent="handleSubmit">
      
      <BaseInput 
        v-model="formData.name" 
        label="Nome Completo" 
        placeholder="Ex: João da Silva" 
        required 
      />
      
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput 
          v-model="formData.cpf" 
          label="CPF" 
          placeholder="000.000.000-00" 
          mask="cpf"
          required 
        />
        <BaseInput 
          v-model="formData.birthDate" 
          label="Data de Nascimento" 
          type="date" 
          :max="todayDate"
          required 
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput 
          v-model="formData.phone" 
          label="Telefone (WhatsApp)" 
          placeholder="(00) 90000-0000" 
          mask="phone"
          required 
        />
        <BaseInput 
          v-model="formData.email" 
          label="Email" 
          type="email" 
          placeholder="joao@email.com" 
          required 
        />
      </div>

      <!-- Seção do Responsável (Exibida apenas se menor de idade) -->
      <div v-if="isMinor" class="flex flex-col gap-4 mt-2 p-4 bg-gold-soft/30 dark:bg-gold-soft/10 border border-gold/30 rounded-lg">
        <h4 class="text-sm font-bold text-gold flex items-center gap-2">
          <User class="w-4 h-4" /> Dados do Responsável Legal
        </h4>
        <BaseInput v-model="formData.guardianName" label="Nome do Responsável" placeholder="Ex: Maria da Silva" :required="isMinor" />
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BaseInput v-model="formData.guardianCpf" label="CPF do Responsável" placeholder="000.000.000-00" mask="cpf" :required="isMinor" />
          <BaseInput v-model="formData.guardianPhone" label="Telefone do Responsável" placeholder="(00) 90000-0000" mask="phone" :required="isMinor" />
        </div>
      </div>

      <div class="flex flex-col gap-3 w-full">
        <BaseInput
          v-model="formData.dueDay"
          label="Dia de vencimento da mensalidade"
          type="number"
          min="1"
          max="28"
          required
        />
        <BaseSelect
          v-model="selectedModalityId"
          label="Modalidade"
          :options="modalityOptions"
          placeholder="Selecione uma modalidade"
        />

        <div v-if="selectedModalityId" class="flex flex-col gap-2">
          <label class="text-sm font-medium text-light-text dark:text-offwhite">Turmas disponíveis</label>
          <div v-if="filteredClassOptions.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              v-for="opt in filteredClassOptions"
              :key="opt.value"
              type="button"
              :disabled="opt.isFull && !formData.instruments.includes(opt.value)"
              class="w-full p-3 rounded-lg text-left transition-all border flex items-center justify-between gap-3 disabled:cursor-not-allowed disabled:opacity-60"
              :class="formData.instruments.includes(opt.value) ? 'bg-primary/10 text-primary dark:text-offwhite border-primary ring-1 ring-primary' : 'bg-light-surface dark:bg-dark-surface text-light-text dark:text-offwhite border-light-border dark:border-dark-border hover:border-primary/60'"
              @click="toggleInstrument(opt.value)"
            >
              <span>
                <span class="block text-sm font-bold">{{ opt.modNome }}</span>
                <span class="block text-xs opacity-70 mt-0.5">{{ opt.schedule }}</span>
                <span class="block text-xs opacity-70 mt-1">{{ opt.teacher }} · {{ opt.room }}</span>
                <span class="block text-xs mt-1" :class="opt.isFull ? 'text-red-500 font-bold' : 'text-green-600 dark:text-green-400'">
                  {{ opt.isFull ? 'Turma lotada' : `${opt.available} vaga${opt.available === 1 ? '' : 's'} disponível(is)` }}
                </span>
              </span>
              <span class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0" :class="formData.instruments.includes(opt.value) ? 'border-primary bg-primary text-white' : 'border-light-border dark:border-dark-border'">
                <Check v-if="formData.instruments.includes(opt.value)" class="w-3 h-3" />
              </span>
            </button>
          </div>
          <p v-else class="text-xs p-3 rounded-lg border border-dashed border-light-border dark:border-dark-border text-light-text/50 dark:text-offwhite/50">
            Não há turmas ativas cadastradas para esta modalidade.
          </p>
        </div>
        <p v-else class="text-xs text-light-text/50 dark:text-offwhite/50">Escolha uma modalidade para visualizar seus dias e horários.</p>
        <p v-if="selectedModalityId && formData.instruments.length === 0" class="text-xs text-red-500">Selecione pelo menos uma turma.</p>
      </div>

      <!-- Espaçamento extra pro footer -->
      <div class="mt-2"/>
      
      <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-light-border dark:border-dark-border">
        <button 
          type="button" 
          class="px-4 py-2 rounded-md font-medium text-light-text dark:text-offwhite hover:bg-light-border dark:hover:bg-dark-border transition-colors border border-transparent"
          :disabled="isLoading"
          @click="handleClose"
        >
          Cancelar
        </button>
        <button 
          type="submit"
          class="px-4 py-2 rounded-md font-medium text-white bg-primary hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-2"
          :disabled="isLoading || formData.instruments.length === 0"
        >
          <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
          Concluir Matrícula e Gerar Contrato
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { Loader2, User, CheckCircle2, Copy, MessageCircle, Mail, ExternalLink, Check } from '@lucide/vue'
import BaseModal from '../BaseModal.vue'
import BaseInput from '../BaseInput.vue'
import BaseSelect from '../BaseSelect.vue'

import { buildPopMusicContractData } from '~/utils/contractFormatter'
import { useContratos } from '~/composables/useContratos'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'saved'])

const isLoading = ref(false)
const copied = ref(false)
const selectedModalityId = ref('')
const createdContractData = ref<{ studentName: string, token: string, phone: string, email: string } | null>(null)

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    resetForm()
  }
})

const todayDate = new Date().toISOString().split('T')[0]

const formData = reactive({
  name: '',
  cpf: '',
  birthDate: '',
  phone: '',
  email: '',
  dueDay: 10,
  instruments: [] as string[],
  guardianName: '',
  guardianCpf: '',
  guardianPhone: ''
})

const isMinor = computed(() => {
  if (!formData.birthDate) return false
  
  const birth = new Date(formData.birthDate)
  const today = new Date()
  
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age < 18
})

const supabase = useSupabaseClient()

const { data: modalidades } = await useAsyncData('modalidades_create_list', async () => {
  const { data, error } = await supabase
    .from('modalidades')
    .select('id, nome')
    .eq('ativo', true)
    .order('nome')

  if (error) {
    console.error('Erro ao carregar modalidades da matrícula:', error)
    return []
  }

  return data || []
})

const { data: turmas } = await useAsyncData('turmas_create_list', async () => {
  const { data, error } = await supabase.from('turmas').select(`
      id,
      dia_semana,
      horario_inicio,
      horario_fim,
      capacidade_maxima,
      modalidade_id,
      modalidades (id, nome, valor_padrao_mensalidade),
      professores (id, nome),
      salas (id, nome),
      matriculas_turma (id, data_fim)
    `)
    .eq('ativo', true)

  if (error) {
    console.error('Erro ao carregar turmas da matrícula:', error)
    return []
  }

  return data || []
})

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const modalityOptions = computed(() => {
  return (modalidades.value || []).map(modalidade => ({
    value: modalidade.id,
    label: modalidade.nome
  }))
})

const classOptions = computed(() => {
  return (turmas.value || []).map((t: any) => {
    const modNome = t.modalidades?.nome || 'Aula'
    const dia = dayNames[t.dia_semana] || ''
    const hora = t.horario_inicio ? t.horario_inicio.substring(0, 5) : ''
    const occupied = (t.matriculas_turma || []).filter((m: any) => !m.data_fim).length
    const capacity = Number(t.capacidade_maxima || 0)
    return { 
      label: `${modNome} (${dia} ${hora})`, 
      value: t.id,
      modalidadeId: t.modalidade_id || t.modalidades?.id || '',
      valor: t.modalidades?.valor_padrao_mensalidade || 150,
      modNome,
      teacher: t.professores?.nome || 'Professor não informado',
      room: t.salas?.nome || 'Sala não informada',
      occupied,
      capacity,
      available: Math.max(0, capacity - occupied),
      isFull: occupied >= capacity,
      schedule: `${dia} ${hora}${t.horario_fim ? `–${t.horario_fim.substring(0, 5)}` : ''}`
    }
  }).sort((a, b) => a.schedule.localeCompare(b.schedule, 'pt-BR'))
})

const filteredClassOptions = computed(() => classOptions.value.filter(opt => opt.modalidadeId === selectedModalityId.value))

watch(selectedModalityId, (newId, oldId) => {
  if (!oldId || newId === oldId) return
  const visibleIds = new Set(filteredClassOptions.value.map(opt => opt.value))
  formData.instruments = formData.instruments.filter(id => visibleIds.has(id))
})

const contractSignUrl = computed(() => {
  if (!createdContractData.value?.token) return ''
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/assinar/${createdContractData.value.token}`
})

const whatsappUrl = computed(() => {
  if (!createdContractData.value) return ''
  const phone = createdContractData.value.phone.replace(/\D/g, '')
  const text = encodeURIComponent(
    `Olá, ${createdContractData.value.studentName}! 🎉 Sua matrícula na Pop Music Escola de Música foi realizada com sucesso.\n\nPor favor, acesse o link abaixo para conferir e assinar digitalmente o seu contrato:\n${contractSignUrl.value}`
  )
  return `https://api.whatsapp.com/send?phone=55${phone}&text=${text}`
})

const copyLink = async () => {
  if (!contractSignUrl.value) return
  await navigator.clipboard.writeText(contractSignUrl.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2500)
}

const resetForm = () => {
  formData.name = ''
  formData.cpf = ''
  formData.birthDate = ''
  formData.phone = ''
  formData.email = ''
  formData.dueDay = 10
  formData.instruments = []
  selectedModalityId.value = ''
  formData.guardianName = ''
  formData.guardianCpf = ''
  formData.guardianPhone = ''
  createdContractData.value = null
}

const handleClose = () => {
  resetForm()
  emit('close')
}

const toggleInstrument = (val: string) => {
  const option = classOptions.value.find(item => item.value === val)
  if (option?.isFull && !formData.instruments.includes(val)) return
  const index = formData.instruments.indexOf(val)
  if (index === -1) {
    formData.instruments.push(val)
  } else {
    formData.instruments.splice(index, 1)
  }
}

const { contractModel, fetchModel } = useContratos()

const handleSubmit = async () => {
  if (formData.instruments.length === 0) return
  const dueDay = Number(formData.dueDay)
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 28) {
    alert('Informe um dia de vencimento entre 1 e 28.')
    return
  }
  isLoading.value = true

  try {
    await fetchModel()
    const selectedClasses = classOptions.value.filter(opt => formData.instruments.includes(opt.value))
    const totalMensalidade = selectedClasses.reduce((acc, curr) => acc + Number(curr.valor || 180), 0)
    const turmasList = (turmas.value || []).filter((t: any) => formData.instruments.includes(t.id))
    const alunoContrato = {
      nome: formData.name.trim(), cpf: formData.cpf.replace(/\D/g, ''),
      data_nascimento: formData.birthDate, telefone: formData.phone.replace(/\D/g, ''),
      email: formData.email.trim(), responsavel_nome: isMinor.value ? formData.guardianName : null,
      responsavel_cpf: isMinor.value ? formData.guardianCpf.replace(/\D/g, '') : null,
      responsavel_telefone: isMinor.value ? formData.guardianPhone.replace(/\D/g, '') : null
    }
    const popContractData = buildPopMusicContractData(alunoContrato, { valor_mensalidade: totalMensalidade, dia_vencimento: dueDay }, turmasList)
    let textoContrato = contractModel.value || ''
    Object.entries(popContractData).forEach(([key, val]) => {
      textoContrato = textoContrato.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(val || ''))
    })

    const { data, error } = await (supabase as any).rpc('criar_matricula_com_contrato', {
      p_nome: formData.name, p_cpf: formData.cpf, p_data_nascimento: formData.birthDate,
      p_telefone: formData.phone, p_email: formData.email, p_turma_ids: formData.instruments,
      p_responsavel_nome: isMinor.value ? formData.guardianName : null,
      p_responsavel_cpf: isMinor.value ? formData.guardianCpf : null,
      p_responsavel_telefone: isMinor.value ? formData.guardianPhone : null,
      p_texto_contrato: textoContrato, p_dia_vencimento: dueDay
    })
    if (error) throw error
    const resultado = data as { aluno_id: string, aluno_nome: string, telefone: string, email: string, token: string }
    const signUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/assinar/${resultado.token}`

    if (resultado.email) {
      try {
        await $fetch('/api/send-contract-email', { method: 'POST', body: {
          studentName: resultado.aluno_nome, studentEmail: resultado.email,
          guardianName: isMinor.value ? formData.guardianName : undefined, signUrl,
          courseName: selectedClasses.map(c => c.label).join(', '), monthlyFee: totalMensalidade
        } })
      } catch (emailErr) {
        console.warn('Matrícula concluída, mas o e-mail não foi enviado:', emailErr)
      }
    }

    createdContractData.value = { studentName: resultado.aluno_nome, token: resultado.token, phone: resultado.telefone || '', email: resultado.email || '' }
    emit('saved', { id: resultado.aluno_id, nome: resultado.aluno_nome })
  } catch (error: any) {
    console.error('Erro ao salvar aluno:', error)
    alert(`Erro ao salvar aluno: ${error.message || 'Verifique se o CPF ou Email já está cadastrado.'}`)
  } finally {
    isLoading.value = false
  }
}
</script>
