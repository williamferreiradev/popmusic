<template>
  <div class="p-8 w-full flex flex-col gap-6">
    
    <!-- Cabeçalho -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-light-text dark:text-offwhite">Alunos</h1>
        <p class="text-sm text-light-text/70 dark:text-offwhite/70">Gerencie as matrículas e o perfil dos seus alunos.</p>
      </div>
      <button 
        class="bg-primary hover:bg-primary-hover text-offwhite px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 self-start sm:self-auto shadow-sm"
        @click="isCreateModalOpen = true"
      >
        <Plus class="w-5 h-5" />
        Nova matrícula
      </button>
    </div>

    <!-- Barra de Filtros e Busca -->
    <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 rounded-lg shadow-sm flex flex-col sm:flex-row gap-4 transition-colors duration-300">
      
      <!-- Busca por Nome/CPF -->
      <div class="flex-1">
        <BaseInput 
          v-model="searchQuery" 
          placeholder="Buscar por nome, CPF ou email..." 
          type="text"
        >
          <template #icon>
            <Search class="w-4 h-4" />
          </template>
        </BaseInput>
      </div>

      <!-- Filtros Dropdowns -->
      <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <div class="w-full sm:w-48">
          <BaseSelect 
            v-model="statusFilter"
            placeholder="Todos os Status"
            :options="statusOptions"
          />
        </div>
        <div class="w-full sm:w-48">
          <BaseSelect 
            v-model="classFilter"
            placeholder="Todas as Turmas"
            :options="classOptions"
          />
        </div>
      </div>

    </div>

    <!-- Tabela de Alunos -->
    <div class="flex-1 relative">
      <StudentsTable
        :students="mappedStudents"
        :pending="pending"
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        :total-count="studentsResult?.count || 0"
        @page-change="currentPage = $event"
        @refresh="refresh"
      />
    </div>

    <!-- Modais -->
    <StudentCreateModal 
      :is-open="isCreateModalOpen" 
      @close="isCreateModalOpen = false"
      @saved="handleStudentSaved"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Search } from '@lucide/vue'
import BaseInput from '~/components/BaseInput.vue'
import BaseSelect from '~/components/BaseSelect.vue'
import StudentsTable from '~/components/students/StudentsTable.vue'
import StudentCreateModal from '~/components/modals/StudentCreateModal.vue'

const supabase = useSupabaseClient()

// Controle de Modais
const isCreateModalOpen = ref(false)

const handleStudentSaved = (data: any) => {
  console.log('Novo aluno salvo:', data)
  refresh() // Atualiza a lista em segundo plano, mantendo o popup de sucesso aberto
}

// Estado dos filtros
const searchQuery = ref('')
const statusFilter = ref<'' | 'pendente' | 'ativo' | 'trancado' | 'cancelado'>('')
const classFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = 8

// Buscar modalidades para o filtro (usamos useAsyncData sem depender de var reativa)
const { data: modalidades } = await useAsyncData('modalidades', async () => {
  const { data } = await supabase.from('modalidades').select('id, nome').eq('ativo', true).order('nome')
  return data || []
})

const classOptions = computed(() => {
  const opts = (modalidades.value || []).map((m: any) => ({ label: m.nome, value: m.id }))
  return [{ label: 'Todas as Turmas', value: '' }, ...opts]
})

const statusOptions = [
  { label: 'Todos os Status', value: '' },
  { label: 'Pendente', value: 'pendente' },
  { label: 'Ativo', value: 'ativo' },
  { label: 'Trancado', value: 'trancado' },
  { label: 'Cancelado', value: 'cancelado' }
]

// Buscar alunos com watch nos filtros que batem no banco
const { data: studentsResult, pending, refresh } = await useAsyncData('students_list', async () => {
  const enrollmentRelation = classFilter.value ? 'matriculas_turma!inner' : 'matriculas_turma'
  const classRelation = classFilter.value ? 'turmas!inner' : 'turmas'
  let query = supabase.from('alunos').select(`
    *,
    ${enrollmentRelation} (
      turma_id,
      data_inicio,
      data_fim,
      ${classRelation} (
        modalidades (id, nome)
      )
    )
  `, { count: 'exact' })
  
  if (statusFilter.value) {
    query = query.eq('status', statusFilter.value)
  }
  
  if (searchQuery.value) {
    const term = searchQuery.value.trim().replace(/[(),\\]/g, ' ')
    query = query.or(`nome.ilike.%${term}%,cpf.ilike.%${term}%,email.ilike.%${term}%`)
  }

  if (classFilter.value) {
    query = query
      .is('matriculas_turma.data_fim', null)
      .eq('matriculas_turma.turmas.modalidade_id', classFilter.value)
  }

  const from = (currentPage.value - 1) * itemsPerPage
  const { data, count, error } = await query
    .order('nome')
    .range(from, from + itemsPerPage - 1)
  
  if (error) {
    console.error('Erro ao buscar alunos:', error)
    return { rows: [], count: 0 }
  }

  return { rows: data || [], count: count || 0 }
}, {
  watch: [searchQuery, statusFilter, classFilter, currentPage]
})

watch([searchQuery, statusFilter, classFilter], () => { currentPage.value = 1 })

// Mapear dados para a tabela
const mappedStudents = computed(() => {
  const filtered = studentsResult.value?.rows || []

  return filtered.map((aluno: any) => {
    // Definir variante e label baseado no status
    let statusVariant = 'neutral'
    let statusLabel = 'Desconhecido'
    
    switch (aluno.status) {
      case 'ativo': statusVariant = 'success'; statusLabel = 'Ativo'; break;
      case 'inadimplente': statusVariant = 'danger'; statusLabel = 'Inadimplente'; break;
      case 'trancado': statusVariant = 'info'; statusLabel = 'Trancado'; break;
      case 'cancelado': statusVariant = 'neutral'; statusLabel = 'Cancelado'; break;
      case 'pendente': statusVariant = 'alert-gold'; statusLabel = 'Pendente'; break;
    }

    // Pegar a turma principal (primeira que achar)
    let mainClass = '-'
    if (aluno.matriculas_turma && aluno.matriculas_turma.length > 0) {
      const firstClass = aluno.matriculas_turma.find((m:any)=>!m.data_fim)?.turmas?.modalidades?.nome
      if (firstClass) mainClass = firstClass
    }

    // Gerar iniciais
    const names = (aluno.nome || '').trim().split(' ')
    let initials = 'AL'
    if (names.length >= 2) {
      initials = `${names[0][0]}${names[1][0]}`.toUpperCase()
    } else if (names.length === 1 && names[0].length > 0) {
      initials = names[0].substring(0, 2).toUpperCase()
    }

    return {
      id: aluno.id,
      name: aluno.nome,
      email: aluno.email || '-',
      phone: aluno.telefone || '-',
      mainClass: mainClass,
      statusVariant,
      statusLabel,
      initials,
      avatar: aluno.foto_url || aluno.avatar_url || aluno.foto || null,
      raw: aluno // Guarda os dados originais se precisar nos modais
    }
  })
})
</script>
