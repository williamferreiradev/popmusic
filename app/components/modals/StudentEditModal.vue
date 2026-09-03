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
        <label class="text-sm font-medium text-light-text dark:text-offwhite">Instrumentos / Turmas</label>
        <div class="flex flex-wrap gap-2">
          <button 
            v-for="opt in classOptions" 
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

const { data: turmas } = await useAsyncData('turmas_edit_list', async () => {
  const { data } = await supabase.from('turmas').select(`
    id,
    dia_semana,
    horario_inicio,
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
      label: `${modNome} (${dia} ${hora})`, 
      value: t.id 
    }
  })
})

// Popula os dados quando o modal abre com um aluno
watch(() => props.student, (newStudent) => {
  if (newStudent) {
    const raw = newStudent.raw || newStudent
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
  emit('close')
}

const toggleInstrument = (val: string) => {
  const index = formData.instruments.indexOf(val)
  if (index === -1) {
    formData.instruments.push(val)
  } else {
    formData.instruments.splice(index, 1)
  }
}

const handleSubmit = async () => {
  if (!props.student?.id) return
  isLoading.value = true
  
  try {
    const { error: updateError } = await supabase.from('alunos').update({
      nome: formData.name.trim(),
      cpf: formData.cpf.replace(/\D/g, ''),
      data_nascimento: formData.birthDate,
      telefone: formData.phone.replace(/\D/g, ''),
      email: formData.email.trim(),
      responsavel_nome: isMinor.value ? formData.guardianName : null,
      responsavel_cpf: isMinor.value ? formData.guardianCpf.replace(/\D/g, '') : null,
      responsavel_telefone: isMinor.value ? formData.guardianPhone.replace(/\D/g, '') : null
    } as any).eq('id', props.student.id)

    if (updateError) throw updateError

    const { error: turmaError } = await (supabase as any).rpc('atualizar_turmas_aluno', { p_aluno_id: props.student.id, p_turma_ids: formData.instruments })
    if (turmaError) throw turmaError

    emit('saved', { id: props.student.id, ...formData })
    handleClose()
  } catch (error: any) {
    console.error('Erro ao atualizar aluno:', error)
    alert(`Erro ao salvar: ${error.message || 'Verifique os dados digitados.'}`)
  } finally {
    isLoading.value = false
  }
}
</script>
