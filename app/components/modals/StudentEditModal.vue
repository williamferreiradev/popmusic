<template>
  <BaseModal 
    :is-open="isOpen" 
    title="Editar Aluno" 
    max-width="md"
    @close="handleClose"
  >
    <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
      
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

      <StudentAddressFields v-model="address" />
      <p class="text-xs text-light-text/60 dark:text-offwhite/60">A atualização do endereço vale para o cadastro e novos contratos. Contratos já assinados mantêm os dados originais.</p>

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

      <div class="flex flex-col gap-1.5 w-full">
        <label class="text-sm font-medium text-light-text dark:text-offwhite">Professor e turma do aluno</label>
        <BaseSelect v-model="teacherFilter" label="Filtrar horários por professor" :options="teacherOptions" placeholder="Todos os professores" />
        <div class="my-2 rounded-lg border border-light-border p-3 text-xs dark:border-dark-border">
          <p class="font-bold">Vínculos que serão salvos:</p>
          <p v-for="item in selectedClasses" :key="item.value" class="mt-1">{{ item.label }}</p>
          <p class="mt-2 opacity-70">Escolher outra turma da mesma modalidade substitui o vínculo atual. A mudança vale para as próximas aulas; presenças anteriores e o contrato assinado são preservados.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button 
            v-for="opt in filteredClassOptions"
            :key="opt.value"
            type="button"
            class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors border"
            :class="formData.instruments.includes(opt.value) ? 'bg-primary text-white border-primary' : 'bg-light-surface dark:bg-dark-surface text-light-text dark:text-offwhite border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-bg'"
            @click="toggleInstrument(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
        <p v-if="formData.instruments.length === 0" class="text-xs text-red-500 mt-1">Selecione pelo menos um instrumento.</p>
      </div>

      <p v-if="formError" class="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300" role="alert">{{ formError }}</p>

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
          :disabled="isLoading"
        >
          <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
          Salvar Alterações
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { Loader2, User } from '@lucide/vue'
import BaseModal from '../BaseModal.vue'
import BaseInput from '../BaseInput.vue'
import BaseSelect from '../BaseSelect.vue'
import StudentAddressFields from '../students/StudentAddressFields.vue'
import { emptyStudentAddress, normalizeStudentAddress } from '~/utils/studentAddress'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  student: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])

const supabase = useSupabaseClient()
const isLoading = ref(false)
const formError = ref('')
const address = ref(emptyStudentAddress())
const teacherFilter = ref('')
const todayDate = new Date().toISOString().split('T')[0]

const formData = reactive({
  name: '',
  cpf: '',
  birthDate: '',
  phone: '',
  email: '',
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

const { data: turmas, refresh: refreshTurmas } = await useAsyncData('turmas_edit_list', async () => {
  const { data } = await supabase.from('turmas').select(`
    id,
    dia_semana,
    horario_inicio,
    horario_fim,
    modalidade_id,
    professores (id, nome),
    modalidades (id, nome)
  `).eq('ativo', true)
  return data || []
})

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const classOptions = computed(() => {
  return (turmas.value || []).map((t: any) => {
    const modNome = t.modalidades?.nome || 'Aula'
    const dia = dayNames[t.dia_semana] || ''
    const hora = t.horario_inicio ? t.horario_inicio.substring(0, 5) : ''
    return { 
      label: `${modNome} · Prof. ${t.professores?.nome || 'Não informado'} · ${dia} ${hora}–${t.horario_fim?.slice(0, 5) || ''}`,
      value: t.id,
      modalityId: t.modalidade_id,
      teacherId: t.professores?.id || '',
      teacherName: t.professores?.nome || 'Não informado'
    }
  })
})
const teacherOptions = computed(() => [{ value: '', label: 'Todos os professores' }, ...Array.from(new Map(classOptions.value.filter(item => item.teacherId).map(item => [item.teacherId, { value: item.teacherId, label: item.teacherName }])).values())])
const filteredClassOptions = computed(() => classOptions.value.filter(item => !teacherFilter.value || item.teacherId === teacherFilter.value))
const selectedClasses = computed(() => classOptions.value.filter(item => formData.instruments.includes(item.value)))
watch(() => props.isOpen, async open => { if (open) { formError.value = ''; teacherFilter.value = ''; await refreshTurmas() } })

// Popula os dados quando o modal abre com um aluno
watch(() => props.student, (newStudent) => {
  if (newStudent) {
    const raw = newStudent.raw || newStudent
    address.value = { logradouro: raw.logradouro || raw.endereco || '', numero: raw.numero || '', complemento: raw.complemento || '', bairro: raw.bairro || '', cidade: raw.cidade || '', uf: raw.uf || '', cep: raw.cep || '' }
    formData.name = raw.nome || newStudent.name || ''
    formData.cpf = raw.cpf || newStudent.cpf || ''
    formData.birthDate = raw.data_nascimento || newStudent.birthDate || ''
    formData.phone = raw.telefone || newStudent.phone || ''
    formData.email = raw.email || newStudent.email || ''
    formData.guardianName = raw.responsavel_nome || newStudent.guardianName || ''
    formData.guardianCpf = raw.responsavel_cpf || newStudent.guardianCpf || ''
    formData.guardianPhone = raw.responsavel_telefone || newStudent.guardianPhone || ''
    
    // Matrículas ativas
    if (raw.matriculas_turma && Array.isArray(raw.matriculas_turma)) {
      formData.instruments = raw.matriculas_turma.filter((m:any)=>!m.data_fim).map((m: any) => m.turma_id || m.turmas?.id).filter(Boolean)
    } else {
      formData.instruments = []
    }
  }
}, { immediate: true })

const handleClose = () => {
  if (!isLoading.value) emit('close')
}

const toggleInstrument = (val: string) => {
  const index = formData.instruments.indexOf(val)
  if (index === -1) {
    const modalityId = classOptions.value.find(item => item.value === val)?.modalityId
    const sameModality = new Set(classOptions.value.filter(item => item.modalityId === modalityId).map(item => item.value))
    formData.instruments = formData.instruments.filter(id => !sameModality.has(id))
    formData.instruments.push(val)
  } else {
    formData.instruments.splice(index, 1)
  }
}

const handleSubmit = async () => {
  if (!props.student?.id) return
  isLoading.value = true
  formError.value = ''
  
  try {
    const normalizedAddress = normalizeStudentAddress(address.value)
    const { error } = await (supabase as any).rpc('salvar_aluno_com_endereco', {
      p_aluno_id: props.student.id, p_nome: formData.name, p_cpf: formData.cpf,
      p_data_nascimento: formData.birthDate, p_telefone: formData.phone, p_email: formData.email,
      p_turma_ids: formData.instruments, p_responsavel_nome: isMinor.value ? formData.guardianName : null,
      p_endereco: normalizedAddress,
      p_responsavel_cpf: isMinor.value ? formData.guardianCpf : null,
      p_responsavel_telefone: isMinor.value ? formData.guardianPhone : null
    })
    if (error) throw error

    emit('saved', { id: props.student.id, ...formData })
    emit('close')
  } catch (error: any) {
    console.error('Erro ao atualizar aluno:', error)
    formError.value = `Não foi possível salvar. ${error.message || 'Verifique os dados digitados.'}`
  } finally {
    isLoading.value = false
  }
}
</script>
