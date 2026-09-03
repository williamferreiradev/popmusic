<template>
  <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg overflow-hidden flex flex-col shadow-sm transition-colors duration-300">
    <div class="p-5 border-b border-light-border dark:border-dark-border flex items-center justify-between">
      <h2 class="text-lg font-bold text-light-text dark:text-offwhite">Próximas turmas do dia</h2>
    </div>
    
    <div class="overflow-x-auto relative min-h-[150px]">
      <table v-if="!pending && turmas && turmas.length > 0" class="w-full text-left text-sm text-light-text dark:text-offwhite">
        <thead class="bg-light-bg/50 dark:bg-dark-bg/50 border-b border-light-border dark:border-dark-border text-light-text/70 dark:text-offwhite/70">
          <tr>
            <th class="px-5 py-3 font-medium">Horário</th>
            <th class="px-5 py-3 font-medium">Turma</th>
            <th class="px-5 py-3 font-medium">Professor</th>
            <th class="px-5 py-3 font-medium">Alunos</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="turma in turmas" 
            :key="turma.id"
            class="border-b border-light-border dark:border-dark-border last:border-0 hover:bg-light-bg/40 dark:hover:bg-dark-bg/40 cursor-pointer transition-colors"
          >
            <td class="px-5 py-4 font-medium">{{ turma.time }}</td>
            <td class="px-5 py-4">
              <span class="inline-flex items-center gap-2">
                <span class="w-2 h-2 rounded-full shadow-sm" :style="{ backgroundColor: turma.colorClass }"/>
                {{ turma.name }}
              </span>
            </td>
            <td class="px-5 py-4">{{ turma.teacher }}</td>
            <td class="px-5 py-4 text-light-text/70 dark:text-offwhite/70 flex items-center gap-2">
              {{ turma.students }}/{{ turma.capacity }}
              <span v-if="turma.students >= turma.capacity" class="text-[10px] font-bold uppercase tracking-wider text-[#ff8a8a] bg-[#7A1F1F]/20 px-1.5 py-0.5 rounded">Cheia</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-else-if="!pending && (!turmas || turmas.length === 0)" class="flex flex-col items-center justify-center py-12 text-light-text/50 dark:text-offwhite/50">
        <p>Nenhuma turma agendada para hoje.</p>
      </div>

      <!-- Loading State -->
      <div v-else class="absolute inset-0 flex items-center justify-center bg-light-surface/50 dark:bg-dark-surface/50">
        <div class="animate-spin w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full"/>
      </div>
    </div>

    <div class="p-4 border-t border-light-border dark:border-dark-border bg-light-bg/20 dark:bg-dark-bg/20 text-center hover:bg-light-bg/40 dark:hover:bg-dark-bg/40 transition-colors">
      <NuxtLink to="/dashboard/agenda" class="text-sm font-medium text-gold hover:underline">
        Ver agenda completa
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()

const { data: turmas, pending } = await useAsyncData('upcomingClasses', async () => {
  const { data, error } = await supabase
    .from('turmas')
    .select(`
      id, 
      horario_inicio, 
      horario_fim, 
      capacidade_maxima,
      modalidades (nome, cor_calendario),
      professores (nome),
      matriculas_turma (id, data_fim)
    `)
    .eq('dia_semana', new Date().getDay())
    .eq('ativo', true)
    .order('horario_inicio')
    
  if (error) {
    console.error(error)
    return []
  }

  return data.map((t: any) => {
    // Conta apenas alunos que ainda estão matriculados (data_fim is null)
    const activeStudents = t.matriculas_turma?.filter((m: any) => m.data_fim === null).length || 0

    return {
      id: t.id,
      time: `${t.horario_inicio.substring(0,5)} - ${t.horario_fim.substring(0,5)}`,
      name: t.modalidades?.nome || 'Turma',
      teacher: t.professores?.nome || 'Não definido',
      students: activeStudents,
      capacity: t.capacidade_maxima,
      colorClass: t.modalidades?.cor_calendario || '#7A1F1F'
    }
  })
})
</script>
