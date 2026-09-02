<template>
  <div class="p-8 w-full flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-bold text-light-text dark:text-offwhite">Meus Alunos</h1>
      <p class="text-sm text-light-text/60 dark:text-offwhite/50 mt-1">Lista de todos os alunos matriculados nas suas turmas.</p>
    </header>

    <div v-if="pending" class="flex justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
    <div v-else-if="loadError" class="text-center py-12 bg-red-500/10 rounded-xl border border-red-500/30">
      <p class="text-red-600 dark:text-red-400 font-medium">Não foi possível carregar seus alunos.</p>
    </div>

    <div v-else-if="!alunos || alunos.length === 0" class="text-center py-12 bg-light-surface dark:bg-dark-surface rounded-xl border border-light-border dark:border-dark-border">
      <p class="text-light-text/50 dark:text-offwhite/50">Nenhum aluno encontrado nas suas turmas.</p>
    </div>

    <div v-else class="bg-light-surface dark:bg-dark-surface rounded-xl border border-light-border dark:border-dark-border overflow-hidden shadow-sm">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-light-border/30 dark:bg-dark-border/30 border-b border-light-border dark:border-dark-border text-sm font-medium text-light-text/70 dark:text-offwhite/70">
            <th class="py-3 px-4">Aluno</th>
            <th class="py-3 px-4">Turma / Modalidade</th>
            <th class="py-3 px-4">Horário</th>
          </tr>
        </thead>
        <tbody class="text-sm divide-y divide-light-border/50 dark:divide-dark-border/50">
          <tr 
            v-for="aluno in alunos" 
            :key="aluno.matriculaId"
            class="hover:bg-light-bg/50 dark:hover:bg-dark-bg/50 transition-colors"
          >
            <td class="py-3 px-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-gold-soft text-gold font-bold flex items-center justify-center shrink-0 text-xs">
                  {{ aluno.nome ? aluno.nome.substring(0, 2).toUpperCase() : 'AL' }}
                </div>
                <span class="font-medium text-light-text dark:text-offwhite">{{ aluno.nome }}</span>
              </div>
            </td>
            <td class="py-3 px-4">
              <span class="block font-medium text-light-text dark:text-offwhite">{{ aluno.modalidade }}</span>
              <span class="text-xs text-light-text/60 dark:text-offwhite/60">{{ aluno.sala }}</span>
            </td>
            <td class="py-3 px-4 text-light-text/70 dark:text-offwhite/70">
              {{ aluno.dia }} · {{ aluno.horario }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loader2 } from '@lucide/vue'

const supabase = useSupabaseClient()

const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const { data: alunos, pending, error: loadError } = await useAsyncData('professor_alunos', async () => {
  const { data, error } = await supabase
    .from('matriculas_turma')
    .select('id,alunos(id,nome,status),turmas(id,dia_semana,horario_inicio,modalidades(nome),salas(nome))')
    .is('data_fim', null)
    
  if (error) {
    console.error('Erro ao buscar alunos do professor.')
    throw error
  }
  return (data || []).filter((m: any) => m.alunos?.status === 'ativo').map((m: any) => ({
    matriculaId: m.id, id: m.alunos.id, nome: m.alunos.nome,
    modalidade: m.turmas?.modalidades?.nome || 'Modalidade não informada',
    sala: m.turmas?.salas?.nome || 'Sala não definida',
    dia: dias[m.turmas?.dia_semana] || 'Dia não definido',
    horario: m.turmas?.horario_inicio?.slice(0, 5) || 'Horário não definido'
  })).sort((a: any, b: any) => a.nome.localeCompare(b.nome, 'pt-BR'))
})
</script>
