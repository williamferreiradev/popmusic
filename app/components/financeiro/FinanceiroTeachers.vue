<template>
  <div class="flex-1 flex flex-col gap-6 relative overflow-hidden">
    
    <!-- Header -->
    <div class="flex justify-between items-end">
      <h2 class="text-xl font-bold text-light-text dark:text-offwhite">Repasses de {{ currentMonthLabel }}</h2>
      <p class="text-sm font-medium text-light-text/60 dark:text-offwhite/60">
        Total pendente: <span class="text-primary font-bold">{{ formatCurrency(totalPending) }}</span>
      </p>
    </div>

    <!-- Grade de Cards -->
    <div v-if="teachers.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      
      <div 
        v-for="teacher in teachers" 
        :key="teacher.id"
        class="bg-light-surface dark:bg-dark-surface p-5 rounded-xl border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-between relative overflow-hidden group transition-all hover:shadow-md"
      >
        <!-- Destaque dourado se houver pendência -->
        <div 
          v-if="teacher.totalToReceive > 0" 
          class="absolute top-0 left-0 w-1.5 h-full bg-gold"
        />

        <div class="ml-2">
          <h3 class="text-lg font-bold text-light-text dark:text-offwhite mb-3">{{ teacher.name }}</h3>
          
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm text-light-text/60 dark:text-offwhite/60">A receber:</span>
            <span class="font-bold text-light-text dark:text-offwhite">{{ formatCurrency(teacher.totalToReceive) }}</span>
          </div>
          
          <div class="flex justify-between items-center mb-4">
            <span class="text-sm text-light-text/60 dark:text-offwhite/60">Já pago (mês):</span>
            <span class="font-bold text-green-500">{{ formatCurrency(teacher.totalPaid) }}</span>
          </div>
        </div>

        <button 
          class="w-full mt-2 py-2 border border-primary text-primary hover:bg-primary hover:text-white font-bold rounded-lg transition-colors text-sm"
          @click="openDrawer(teacher)"
        >
          Ver detalhes
        </button>
      </div>

    </div>

    <div v-else class="flex flex-col items-center justify-center p-12 text-light-text/50 dark:text-offwhite/50 border border-dashed border-light-border dark:border-dark-border rounded-xl">
      <Users class="w-12 h-12 mb-3 opacity-50" />
      <p class="font-medium text-lg text-light-text dark:text-offwhite">Nenhum professor com repasse pendente.</p>
    </div>

    <!-- Drawer (Painel Lateral) -->
    <div 
      class="fixed inset-0 bg-black/50 z-40 transition-opacity"
      :class="isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'"
      @click="closeDrawer"
    />

    <div 
      class="fixed top-0 right-0 h-full w-full max-w-xl bg-light-bg dark:bg-dark-bg shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-light-border dark:border-dark-border flex flex-col"
      :class="isDrawerOpen ? 'translate-x-0' : 'translate-x-full'"
    >
      
      <!-- Drawer Header -->
      <div class="p-6 border-b border-light-border dark:border-dark-border flex justify-between items-start bg-light-surface dark:bg-dark-surface">
        <div>
          <h2 class="text-2xl font-bold text-light-text dark:text-offwhite">{{ activeTeacher?.name }}</h2>
          <p class="text-sm text-light-text/60 dark:text-offwhite/60 mt-1">Repasse pendente: <span class="text-primary font-bold">{{ formatCurrency(activeTeacher?.totalToReceive || 0) }}</span></p>
        </div>
        <button 
          class="p-2 text-light-text/50 hover:bg-light-border/50 dark:text-offwhite/50 dark:hover:bg-dark-border/50 rounded-full transition-colors"
          @click="closeDrawer"
        >
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- Drawer Content (Tabela) -->
      <div class="flex-1 overflow-y-auto p-6">
        <h3 class="text-sm font-bold text-light-text/60 dark:text-offwhite/60 uppercase tracking-wider mb-4">Detalhamento por Aluno</h3>
        
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-light-border dark:border-dark-border text-xs font-bold text-light-text/50 dark:text-offwhite/50 uppercase">
              <th class="py-3 px-2">Aluno</th>
              <th class="py-3 px-2 text-center">Aulas finalizadas</th>
              <th class="py-3 px-2 text-right">Repasse/aluno</th>
              <th class="py-3 px-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-light-border/50 dark:divide-dark-border/50">
            <tr 
              v-for="student in activeTeacher?.students" 
              :key="student.studentName"
              class="hover:bg-light-surface dark:hover:bg-dark-surface transition-colors group"
            >
              <td class="py-3 px-2 text-sm font-medium text-light-text dark:text-offwhite">
                {{ student.studentName }}
              </td>
              <td class="py-3 px-2 text-sm text-center font-bold text-light-text dark:text-offwhite">
                {{ student.classesGiven }}
              </td>
              <td class="py-3 px-2 text-sm text-right text-light-text/80 dark:text-offwhite/80 group">
                <div class="flex items-center justify-end gap-2">
                  <span>{{ formatCurrency(student.amountPerClass) }}</span>
                  <button
v-if="false"
                    class="opacity-0 group-hover:opacity-100 p-1 text-primary hover:bg-primary/10 rounded transition-all"
                    title="Ajustar Comissão"
                    @click="openAdjustModal(student)"
                  >
                    <Edit2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
              <td class="py-3 px-2 text-sm text-right font-bold text-light-text dark:text-offwhite">
                {{ formatCurrency(student.total) }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t border-light-border dark:border-dark-border">
              <td colspan="3" class="py-4 px-2 text-right font-bold text-light-text/60 dark:text-offwhite/60 uppercase text-xs">Total:</td>
              <td class="py-4 px-2 text-right font-bold text-lg text-primary">{{ formatCurrency(activeTeacher?.totalToReceive || 0) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Drawer Footer (Ações) -->
      <div class="p-6 border-t border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface flex flex-col sm:flex-row gap-3 justify-end">
        <button 
          class="px-4 py-2 border border-primary text-primary hover:bg-primary/10 font-bold rounded-md transition-colors text-sm flex justify-center items-center gap-2"
          @click="openStatementModal"
        >
          <FileText class="w-4 h-4" />
          Gerar demonstrativo
        </button>
        <button 
          v-if="(activeTeacher?.totalToReceive || 0) > 0"
          class="px-6 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-md transition-colors shadow-sm flex justify-center items-center gap-2"
          @click="openPayModal"
        >
          <CheckCircle class="w-4 h-4" />
          Marcar tudo como pago
        </button>
      </div>

    </div>

    <!-- Modais -->
    <TeacherStatementModal 
      :is-open="isStatementModalOpen"
      :teacher="activeTeacher"
      @close="isStatementModalOpen = false"
      @confirm="handleStatement"
    />

    <PayTeacherModal 
      :is-open="isPayModalOpen"
      :teacher="activeTeacher"
      :accounts="accounts"
      @close="isPayModalOpen = false"
      @confirm="handlePayment"
    />

    <AdjustCommissionModal 
      :is-open="isAdjustModalOpen"
      :item="selectedStudentItem"
      @close="isAdjustModalOpen = false"
      @confirm="handleAdjust"
    />

    <!-- Toast flutuante -->
    <div 
      class="fixed bottom-6 right-6 bg-light-surface dark:bg-dark-surface border-l-4 border-green-500 shadow-xl rounded-r-md px-6 py-3 transition-all duration-300 z-50 flex flex-col"
      :class="toastVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'"
    >
      <p class="text-sm font-bold text-light-text dark:text-offwhite">{{ toastMessage }}</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { X, FileText, CheckCircle, Edit2, Users } from '@lucide/vue'
import { useFinanceiro, type Teacher } from '../../composables/useFinanceiro'

import TeacherStatementModal from '../modals/TeacherStatementModal.vue'
import PayTeacherModal from '../modals/PayTeacherModal.vue'
import AdjustCommissionModal from '../modals/AdjustCommissionModal.vue'

const { teachers, accounts, fetchTeachers, fetchAccounts, payTeacher } = useFinanceiro()

onMounted(async () => {
  await Promise.all([fetchTeachers(), fetchAccounts()])
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const currentMonthLabel = computed(() => {
  const d = new Date()
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^./, str => str.toUpperCase())
})

const totalPending = computed(() => {
  return teachers.value.reduce((acc, t) => acc + (t.totalToReceive || 0), 0)
})

// Drawer Logic
const isDrawerOpen = ref(false)
const activeTeacher = ref<Teacher | null>(null)

const openDrawer = (teacher: Teacher) => {
  activeTeacher.value = teacher
  isDrawerOpen.value = true
}

const closeDrawer = () => {
  isDrawerOpen.value = false
  setTimeout(() => {
    activeTeacher.value = null
  }, 300)
}

// Modais
const isStatementModalOpen = ref(false)
const isPayModalOpen = ref(false)
const isAdjustModalOpen = ref(false)
const selectedStudentItem = ref<any>(null)

const openStatementModal = () => {
  isStatementModalOpen.value = true
}

const openPayModal = () => {
  isPayModalOpen.value = true
}

const openAdjustModal = (student: any) => {
  selectedStudentItem.value = student
  isAdjustModalOpen.value = true
}

// Funções dos Modais
const handleStatement = (action: 'whatsapp' | 'pdf') => {
  isStatementModalOpen.value = false
  showToast(action === 'whatsapp' ? 'Demonstrativo enviado via WhatsApp.' : 'Download do PDF iniciado.')
}

const handlePayment = async (data: any) => {
  if (activeTeacher.value) {
    await payTeacher(
      activeTeacher.value.id, 
      activeTeacher.value.totalToReceive, 
      data.account, 
      data.paymentMethod, 
      data.paidAt
    )
    isPayModalOpen.value = false
    closeDrawer()
    showToast(`Repasse pago! Lançamento de saída criado na conta ${data.account}.`)
  }
}

const handleAdjust = (newRate: number) => {
  if (selectedStudentItem.value && activeTeacher.value) {
    selectedStudentItem.value.amountPerClass = newRate
    selectedStudentItem.value.total = selectedStudentItem.value.classesGiven * newRate
    activeTeacher.value.totalToReceive = activeTeacher.value.students.reduce(
      (acc, s) => acc + s.total, 
      0
    )
    isAdjustModalOpen.value = false
    showToast('Comissão ajustada para este mês.')
  }
}

// Toast
const toastVisible = ref(false)
const toastMessage = ref('')
let toastTimer: any = null

const showToast = (msg: string) => {
  toastMessage.value = msg
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, 3000)
}
</script>
