<template>
  <BaseModal :is-open="isOpen" :title="appointment?.className || 'Detalhes da turma'" max-width="lg" @close="$emit('close')">
    <div v-if="appointment" class="flex flex-col gap-6">
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div><p class="detail-label">Modalidade</p><p class="detail-value">{{ appointment.className }}</p></div>
        <div><p class="detail-label">Professor</p><p class="detail-value">{{ appointment.teacherName }}</p></div>
        <div><p class="detail-label">Sala</p><p class="detail-value">{{ appointment.roomName }}</p></div>
        <div><p class="detail-label">Horário</p><p class="detail-value flex items-center gap-1"><Clock class="w-4 h-4 text-primary" /> {{ appointment.time }} ({{ appointment.duration }})</p></div>
      </div>

      <div class="border-t border-light-border dark:border-dark-border pt-4">
        <div class="flex items-center justify-between mb-4">
          <p class="text-sm font-bold text-light-text dark:text-offwhite flex items-center gap-2"><Users class="w-4 h-4 text-primary" /> Alunos matriculados</p>
          <span class="text-xs font-semibold px-2 py-1 rounded border border-light-border dark:border-dark-border" :class="appointment.students.length >= appointment.capacity ? 'text-red-500' : 'text-green-600 dark:text-green-400'">
            {{ appointment.students.length }} / {{ appointment.capacity }}
          </span>
        </div>
        <div class="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
          <div v-for="student in appointment.students" :key="student.id" class="flex items-center gap-3 bg-light-bg dark:bg-dark-bg p-3 rounded-lg border border-light-border dark:border-dark-border">
            <div class="w-10 h-10 rounded-full bg-gold-soft text-gold font-bold flex items-center justify-center overflow-hidden shrink-0">
              <img v-if="student.photo" :src="student.photo" :alt="`Foto de ${student.name}`" class="w-full h-full object-cover">
              <span v-else>{{ student.name.charAt(0) }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold text-light-text dark:text-offwhite truncate">{{ student.name }}</p>
              <p class="text-xs text-light-text/50 dark:text-offwhite/50">{{ appointment.className }} · {{ appointment.teacherName }}</p>
            </div>
            <span class="text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap" :class="student.financialStatus === 'em_dia' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-500'">
              {{ student.financialStatus === 'em_dia' ? 'Em dia' : `Com pendência (${student.pendingPayments})` }}
            </span>
          </div>
          <p v-if="!appointment.students.length" class="text-center py-4 text-sm text-light-text/50 dark:text-offwhite/50">Nenhum aluno matriculado nesta turma.</p>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <BaseButton variant="outline" @click="$emit('close')">Fechar</BaseButton>
        <BaseButton variant="primary" @click="$emit('edit', appointment)">Editar turma</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { Clock, Users } from '@lucide/vue'
import BaseButton from '../BaseButton.vue'
import BaseModal from '../BaseModal.vue'

defineProps<{ isOpen: boolean; appointment?: any }>()
defineEmits(['close', 'edit'])
</script>

<style scoped>
.detail-label { @apply text-xs font-bold text-light-text/50 dark:text-offwhite/50 uppercase tracking-wider mb-1; }
.detail-value { @apply text-sm font-medium text-light-text dark:text-offwhite; }
</style>
