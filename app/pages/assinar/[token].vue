<template>
  <div class="min-h-screen bg-light-bg dark:bg-[#050505] flex flex-col font-sans print:bg-white print:p-0">
    
    <!-- Cabeçalho Público (Oculto na impressão) -->
    <header class="h-16 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface flex items-center justify-between px-6 shrink-0 print:hidden">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded bg-primary flex items-center justify-center">
          <Music class="w-5 h-5 text-white" />
        </div>
        <span class="font-bold text-xl tracking-tight text-light-text dark:text-offwhite">Pop Music</span>
      </div>
      
      <button 
        v-if="contract"
        class="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
        @click="triggerPrint"
      >
        <Printer class="w-4 h-4" />
        Imprimir / Salvar PDF
      </button>
    </header>

    <main class="flex-1 flex flex-col items-center p-3 sm:p-6 overflow-y-auto print:p-0 print:overflow-visible">
      
      <!-- Se não encontrou contrato ou deu erro na rota -->
      <div v-if="pending" class="w-full max-w-2xl p-12 text-center mt-12 print:hidden">
        <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <p class="mt-3 text-sm text-light-text/60 dark:text-offwhite/60">Carregando contrato...</p>
      </div>

      <div v-else-if="loadError" class="w-full max-w-2xl bg-light-surface dark:bg-dark-surface p-8 rounded-xl border border-light-border dark:border-dark-border text-center mt-12 shadow-sm print:hidden">
        <Clock v-if="loadError.statusCode === 410" class="w-16 h-16 mx-auto mb-4 text-amber-500 opacity-50" />
        <AlertCircle v-else class="w-16 h-16 mx-auto mb-4 text-red-500/50" />
        <h1 class="text-xl font-bold text-light-text dark:text-offwhite mb-2">{{ loadError.statusCode === 410 ? 'Este link não está mais disponível' : 'Não foi possível carregar o contrato' }}</h1>
        <p class="text-light-text/60 dark:text-offwhite/60">{{ loadError.statusCode === 410 ? 'O link expirou ou o contrato foi cancelado. Solicite um novo envio à secretaria.' : 'Ocorreu uma falha temporária. Atualize a página e tente novamente.' }}</p>
      </div>

      <div v-else-if="!contract" class="w-full max-w-2xl bg-light-surface dark:bg-dark-surface p-8 rounded-xl border border-light-border dark:border-dark-border text-center mt-12 shadow-sm print:hidden">
        <AlertCircle class="w-16 h-16 mx-auto mb-4 text-light-text/20 dark:text-offwhite/20" />
        <h1 class="text-xl font-bold text-light-text dark:text-offwhite mb-2">Contrato não encontrado</h1>
        <p class="text-light-text/60 dark:text-offwhite/60">Verifique se o link está correto ou solicite um novo envio à secretaria.</p>
      </div>

      <!-- Estado: Expirado -->
      <div v-else-if="contract.status === 'expirado'" class="w-full max-w-2xl bg-light-surface dark:bg-dark-surface p-8 rounded-xl border border-light-border dark:border-dark-border text-center mt-12 shadow-sm print:hidden">
        <Clock class="w-16 h-16 mx-auto mb-4 text-amber-500 opacity-50" />
        <h1 class="text-xl font-bold text-light-text dark:text-offwhite mb-2">Este link expirou</h1>
        <p class="text-light-text/60 dark:text-offwhite/60">O prazo para assinatura online encerrou. Peça um novo link à secretaria da Pop Music.</p>
      </div>

      <!-- Exibição do Contrato Oficial (Tanto para ler quanto para assinado) -->
      <div v-else class="w-full max-w-4xl flex flex-col bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl shadow-lg overflow-hidden print:border-none print:shadow-none print:bg-transparent">
        
        <!-- Banner de Status / Instrução (Oculto na impressão) -->
        <div class="p-4 sm:p-5 border-b border-light-border dark:border-dark-border bg-light-bg/60 dark:bg-dark-bg/60 text-center print:hidden flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="text-left">
            <h1 class="text-base sm:text-lg font-bold text-light-text dark:text-offwhite flex items-center gap-2">
              <span>Termo de Aceite do Contrato</span>
              <span v-if="isSigned" class="text-xs bg-green-500/10 text-green-600 dark:text-green-400 font-bold px-2 py-0.5 rounded border border-green-500/20">
                Assinado
              </span>
            </h1>
            <p class="text-xs text-light-text/60 dark:text-offwhite/60 mt-0.5">
              {{ isSigned ? 'Este contrato já foi assinado e possui validade jurídica.' : 'Por favor, confira todos os dados e cláusulas abaixo antes de assinar eletronicamente.' }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button 
              class="px-4 py-2 bg-light-surface dark:bg-dark-surface hover:bg-light-bg dark:hover:bg-dark-bg border border-light-border dark:border-dark-border text-light-text dark:text-offwhite text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
              @click="triggerPrint"
            >
              <Download class="w-3.5 h-3.5" />
              Baixar Cópia em PDF
            </button>
          </div>
        </div>

        <!-- Renderização do Contrato Oficial -->
        <div class="p-4 sm:p-6 overflow-y-auto flex-1 bg-gray-100 dark:bg-[#151515] print:p-0 print:bg-transparent">
          <PopMusicContractDocument 
            :data="contractFormattedData"
            :signed-info="signedInfoData"
            :show-print-button="false"
          />
        </div>

        <!-- Seção de Captura Facial e Assinatura (Apenas se pendente) -->
        <div v-if="!isSigned" class="p-6 border-t border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface shadow-[0_-10px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_20px_rgba(0,0,0,0.2)] flex flex-col gap-6 print:hidden">
          
          <!-- Passo 2: Foto do Rosto -->
          <FaceCaptureSection 
            v-model:photo="userFacePhoto" 
          />

          <!-- Passo 3: Termo de Aceite Legal -->
          <div class="flex flex-col gap-4 pt-2 border-t border-light-border dark:border-dark-border">
            <label class="flex items-start gap-3 cursor-pointer group">
              <div class="mt-0.5">
                <input v-model="hasAccepted" type="checkbox" class="hidden" >
                <div class="w-5 h-5 rounded border-2 border-light-border dark:border-dark-border flex items-center justify-center transition-colors group-hover:border-primary" :class="hasAccepted ? 'bg-primary border-primary' : 'bg-transparent'">
                  <Check v-if="hasAccepted" class="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <span class="text-xs sm:text-sm text-light-text/80 dark:text-offwhite/80 leading-relaxed font-medium">
                Li, compreendi e concordo integralmente com todas as cláusulas e condições deste Contrato de Prestação de Serviços Educacionais da Academia de Música Pop Music. Confirmo a veracidade da minha foto facial e autorizo o registro desta assinatura eletrônica.
              </span>
            </label>

            <label class="flex items-start gap-3 cursor-pointer group">
              <div class="mt-0.5">
                <input v-model="hasPhotoConsent" type="checkbox" class="hidden" >
                <div class="w-5 h-5 rounded border-2 border-light-border dark:border-dark-border flex items-center justify-center transition-colors group-hover:border-primary" :class="hasPhotoConsent ? 'bg-primary border-primary' : 'bg-transparent'">
                  <Check v-if="hasPhotoConsent" class="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <span class="text-xs sm:text-sm text-light-text/80 dark:text-offwhite/80 leading-relaxed font-medium">
                Autorizo a captura e o armazenamento desta foto exclusivamente como evidência da assinatura e identificação do signatário, pelo período de guarda do contrato. Estou ciente de que posso solicitar informações sobre o tratamento dos meus dados à escola.
              </span>
            </label>

            <!-- Aviso caso falte a foto -->
            <p v-if="!userFacePhoto" class="text-xs text-amber-600 dark:text-gold flex items-center gap-1.5 font-medium">
              <AlertCircle class="w-4 h-4 shrink-0" />
              Por favor, tire sua foto facial no Passo 2 acima para habilitar a assinatura.
            </p>
            <p v-if="submitError" class="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400" role="alert">{{ submitError }}</p>

            <button 
              :disabled="!hasAccepted || !hasPhotoConsent || !userFacePhoto || isSubmitting"
              class="w-full py-3.5 text-center text-white font-bold text-base sm:text-lg rounded-lg transition-all shadow-md flex items-center justify-center gap-2"
              :class="hasAccepted && hasPhotoConsent && userFacePhoto ? 'bg-green-600 hover:bg-green-700 cursor-pointer' : 'bg-light-border dark:bg-dark-border text-light-text/40 dark:text-offwhite/40 cursor-not-allowed shadow-none'"
              @click="handleAccept"
            >
              <CheckCircle2 class="w-5 h-5" />
              {{ isSubmitting ? 'Salvando foto e registrando assinatura...' : 'Aceitar e Assinar Contrato com Foto' }}
            </button>
          </div>

        </div>

      </div>

    </main>

    <!-- Modal de Sucesso (após aceite) -->
    <BaseModal 
      :is-open="isSuccessModalOpen"
      title=""
      max-width="md"
      :show-close="false"
      @close="closeSuccessModal"
    >
      <div class="flex flex-col items-center text-center p-2 sm:p-4">
        <div class="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-3 border border-green-500/20">
          <Check class="w-8 h-8 text-green-500" />
        </div>
        <h2 class="text-2xl font-bold text-light-text dark:text-offwhite mb-1">Matrícula Confirmada!</h2>
        <p class="text-xs sm:text-sm text-light-text/70 dark:text-offwhite/70 mb-4 leading-relaxed">
          Sua foto facial e assinatura foram registradas com sucesso. O aluno já está incluído na turma e na agenda do professor.
        </p>

        <!-- Card PIX de Pagamento -->
        <div v-if="pixKeyDefault" class="w-full bg-light-bg dark:bg-dark-bg p-4 rounded-xl border border-primary/30 flex flex-col gap-2 mb-4 text-left">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-primary uppercase tracking-wider">Chave PIX para Mensalidades</span>
            <span class="text-[11px] text-light-text/60 dark:text-offwhite/60">Pop Music</span>
          </div>
          <div class="flex items-center justify-between gap-2 bg-light-surface dark:bg-dark-surface p-2.5 rounded-lg border border-light-border dark:border-dark-border">
            <span class="font-mono text-xs sm:text-sm font-bold text-light-text dark:text-offwhite truncate">
              {{ pixKeyDefault }}
            </span>
            <button 
              type="button" 
              class="px-3 py-1 bg-primary hover:bg-primary-hover text-white rounded text-xs font-bold transition-colors shrink-0 flex items-center gap-1"
              @click="copyPixKey"
            >
              <Copy class="w-3.5 h-3.5" />
              {{ copiedPix ? 'Copiado!' : 'Copiar PIX' }}
            </button>
          </div>
          <p class="text-[11px] text-light-text/60 dark:text-offwhite/60 mt-0.5">
            Envie o comprovante para nosso contato oficial: {{ contract?.escola?.telefone }}
          </p>
        </div>

        <!-- Aviso de E-mail Enviado -->
        <div v-if="contract?.alunos?.email && emailDeliveryStatus === 'sent'" class="w-full flex items-center gap-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-4">
          <Mail class="w-4 h-4 shrink-0" />
          Enviamos uma cópia do contrato e chave PIX para: {{ contract.alunos.email }}
        </div>
        <div v-else-if="contract?.alunos?.email && emailDeliveryStatus === 'failed'" class="w-full flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-700 dark:text-amber-300 mb-4">
          <AlertCircle class="w-4 h-4 shrink-0" />
          O contrato foi assinado, mas o e-mail não pôde ser enviado. Use “Salvar PDF” e avise a secretaria.
        </div>

        <div class="flex flex-col gap-2 w-full">
          <button 
            class="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 text-sm cursor-pointer"
            @click="triggerPrint"
          >
            <Printer class="w-4 h-4" />
            Imprimir / Salvar PDF com Foto
          </button>
          <button 
            class="w-full py-2.5 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text dark:text-offwhite font-bold rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg transition-colors text-sm cursor-pointer"
            @click="closeSuccessModal"
          >
            Fechar
          </button>
        </div>
      </div>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Music, CheckCircle2, Clock, AlertCircle, Download, Check, Printer, Copy, Mail } from '@lucide/vue'
import BaseModal from '~/components/BaseModal.vue'
import PopMusicContractDocument from '~/components/contratos/PopMusicContractDocument.vue'
import FaceCaptureSection from '~/components/contratos/FaceCaptureSection.vue'
import { buildPopMusicContractData, formatCPF } from '~/utils/contractFormatter'

definePageMeta({
  layout: false
})

const route = useRoute()
const token = route.params.token as string

const pixKeyDefault = ref('')
const copiedPix = ref(false)

const copyPixKey = async () => {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    if (pixKeyDefault.value) await navigator.clipboard.writeText(pixKeyDefault.value)
    copiedPix.value = true
    setTimeout(() => { copiedPix.value = false }, 2500)
  }
}

const { data: contract, pending, error: loadError, refresh } = await useAsyncData(`contrato-${token}`, async () => {
  const res: any = await $fetch(`/api/contrato/${encodeURIComponent(token)}`)
  return res?.contract || null
})
watchEffect(() => { pixKeyDefault.value = contract.value?.escola?.pix_chave || '' })

const hasAccepted = ref(false)
const hasPhotoConsent = ref(false)
const userFacePhoto = ref<string | null>(null)
const isSubmitting = ref(false)
const isSuccessModalOpen = ref(false)
const submitError = ref('')
const emailDeliveryStatus = ref<'unknown' | 'sent' | 'failed'>('unknown')

const isSigned = computed(() => {
  if (!contract.value) return false
  const s = contract.value.status
  return s === 'aceito' || s === 'renovado' || s === 'vencendo' || s === 'vencido'
})

const contractFormattedData = computed(() => {
  if (!contract.value) return {}
  const snapshot = isSigned.value ? contract.value.documento_assinado_snapshot : null
  const aluno = snapshot?.aluno || contract.value.alunos || {}
  const contratoFonte = snapshot?.contrato || contract.value
  
  const turmasList: any[] = []
  if (Array.isArray(snapshot?.turmas)) {
    turmasList.push(...snapshot.turmas)
  } else if (aluno.matriculas_turma && Array.isArray(aluno.matriculas_turma)) {
    aluno.matriculas_turma.forEach((m: any) => {
      if (!m.data_fim && m.turmas) turmasList.push(m.turmas)
    })
  }

  const escola = snapshot?.escola || contract.value.escola || {}
  return { ...buildPopMusicContractData(aluno, contratoFonte, turmasList),
    escola_nome: escola.nome, escola_cnpj: escola.cnpj,
    escola_endereco: escola.endereco, escola_telefone: escola.telefone,
    escola_email: escola.email }
})

const signedInfoData = computed(() => {
  if (!isSigned.value || !contract.value) return null
  const snapshot = contract.value.documento_assinado_snapshot
  const aluno = snapshot?.aluno || contract.value.alunos || {}
  const contratoFonte = snapshot?.contrato || contract.value
  const isMenor = !!(aluno.responsavel_nome || aluno.nome_responsavel)
  
  const signerName = isMenor 
    ? (aluno.responsavel_nome || aluno.nome_responsavel || aluno.nome)
    : aluno.nome

  const signerCpf = formatCPF(isMenor 
    ? (aluno.responsavel_cpf || aluno.cpf_responsavel || aluno.cpf)
    : aluno.cpf)

  const acceptedAt = contratoFonte.data_aceite
    ? new Date(contratoFonte.data_aceite).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Assinado Eletronicamente'

  const photo = contract.value.foto_assinatura_url || aluno.foto_url || aluno.avatar_url || userFacePhoto.value || null

  return {
    signerName,
    signerCpf: signerCpf || 'Não informado',
    acceptedAt,
    token: contract.value.documento_assinado_hash || contratoFonte.aceite_hash || 'Documento assinado',
    ip: 'Registro Eletrônico Pop Music',
    signerPhoto: photo
  }
})

const triggerPrint = () => {
  if (typeof window !== 'undefined') {
    window.print()
  }
}

const handleAccept = async () => {
  if (!hasAccepted.value || !hasPhotoConsent.value || !userFacePhoto.value || !contract.value) return
  isSubmitting.value = true
  submitError.value = ''
  
  // 1. Tentar assinar via API do servidor (Robusto e sem problema de RLS)
  try {
    const res: any = await $fetch(`/api/contrato/${encodeURIComponent(token)}`, {
      method: 'POST',
      body: {
        photo: userFacePhoto.value,
        photoConsent: true
      }
    })

    if (res?.success) {
      if (res.contract) {
        contract.value = res.contract
      }
      emailDeliveryStatus.value = res.emailSent === true ? 'sent' : 'failed'
      isSuccessModalOpen.value = true
      await refresh()
      isSubmitting.value = false
      return
    }
    throw new Error('A assinatura não foi confirmada pelo servidor.')
  } catch (serverSignErr) {
    console.error('Erro ao assinar contrato no servidor:', serverSignErr)
    const failure = serverSignErr as { data?: { message?: string, statusMessage?: string }, statusMessage?: string }
    submitError.value = failure.data?.statusMessage || failure.data?.message || failure.statusMessage || 'Não foi possível assinar o contrato. Verifique o link e tente novamente.'
    isSubmitting.value = false
    return
  }

  /* Fluxo legado direto no cliente desativado permanentemente.
  // 2. Fallback de assinatura no cliente
  const today = new Date().toISOString().split('T')[0]
  const oneYearLater = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
  const alunoId = contract.value.aluno_id
  const aluno = contract.value.alunos || {}

  try {
    let finalPhotoUrl = userFacePhoto.value

    // 1. Tentar salvar a foto no Supabase Storage
    try {
      if (userFacePhoto.value.startsWith('data:image')) {
        const res = await fetch(userFacePhoto.value)
        const blob = await res.blob()
        const fileName = `foto_aluno_${alunoId}_${Date.now()}.jpg`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('fotos_alunos')
          .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true })

        if (!uploadError && uploadData) {
          const { data: pubData } = supabase.storage.from('fotos_alunos').getPublicUrl(fileName)
          if (pubData?.publicUrl) {
            finalPhotoUrl = pubData.publicUrl
          }
        }
      }
    } catch (storageErr) {
      console.warn('Armazenando imagem via base64/fallback:', storageErr)
    }

    // 2. Atualiza foto no perfil do aluno e ativa o status
    try {
      await supabase.from('alunos').update({
        foto_url: finalPhotoUrl,
        status: 'ativo'
      } as any).eq('id', alunoId)
    } catch (alunoUpdateErr) {
      console.warn('Erro ao atualizar aluno:', alunoUpdateErr)
    }

    // 3. Atualiza o status do contrato e anexa a foto de assinatura
    const hash = `AUTH-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase()
    const { error: updateError } = await supabase.from('contratos').update({ 
      status: 'aceito',
      data_aceite: new Date().toISOString(),
      data_inicio_vigencia: today,
      data_fim_vigencia: oneYearLater,
      foto_assinatura_url: finalPhotoUrl,
      aceite_hash: hash
    } as any).eq('token', token)
    
    if (updateError) throw updateError

    // 4. Gera automaticamente as 12 parcelas mensais em cobrancas com a CHAVE PIX
    const parcelas = []
    const diaVenc = contract.value.dia_vencimento || 10
    const valor = Number(contract.value.valor_mensalidade) || 180
    const now = new Date()

    for (let i = 1; i <= 12; i++) {
      const dataBase = new Date(now.getFullYear(), now.getMonth() + (i - 1), diaVenc)
      const dataVencimento = dataBase.toISOString().split('T')[0]
      
      parcelas.push({
        aluno_id: contract.value.aluno_id,
        contrato_id: contract.value.id,
        descricao: `Mensalidade ${i}/12`,
        valor: valor,
        vencimento: dataVencimento,
        status: 'pendente',
        forma_pagamento: 'pix',
        gateway_referencia: null
      })
    }

    const { error: cobrancasError } = await supabase.from('cobrancas').insert(parcelas)
    if (cobrancasError) {
      console.error('Erro ao gerar cobranças automáticas do contrato:', cobrancasError)
    }

    // 5. Integração com a Agenda do Professor: Agendar aulas futuras em presencas
    try {
      if (aluno.matriculas_turma && Array.isArray(aluno.matriculas_turma)) {
        const presencasParaInserir: any[] = []
        
        for (const mat of aluno.matriculas_turma) {
          const turma = mat.turmas
          if (turma && turma.dia_semana !== undefined) {
            // Gerar as próximas 4 semanas de aula da turma
            const targetDay = Number(turma.dia_semana) // 0 = Dom, 1 = Seg, etc.
            const d = new Date()
            
            for (let week = 0; week < 4; week++) {
              const aulaDate = new Date(d)
              const currentDay = aulaDate.getDay()
              let diff = (targetDay - currentDay + 7) % 7
              if (diff === 0 && week === 0) diff = 7 // Próxima ocorrência
              aulaDate.setDate(aulaDate.getDate() + diff + (week * 7))
              
              presencasParaInserir.push({
                aluno_id: alunoId,
                turma_id: turma.id,
                data_aula: aulaDate.toISOString().split('T')[0],
                horario_previsto: turma.horario_inicio || '14:00',
                status: 'agendado',
                tipo_aula: 'regular',
                origem: 'presencial'
              })
            }
          }
        }

        if (presencasParaInserir.length > 0) {
          await supabase.from('presencas').insert(presencasParaInserir)
        }
      }
    } catch (agendaErr) {
      console.warn('Erro ao inserir aulas na agenda/presenças:', agendaErr)
    }

    // 6. Enviar E-mail de Confirmação com Cópia do Contrato e Chave PIX
    const contractUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/assinar/${token}`
    if (aluno.email) {
      try {
        const isMenor = !!(aluno.responsavel_nome || aluno.nome_responsavel)
        await $fetch('/api/send-signed-confirmation-email', {
          method: 'POST',
          body: {
            studentName: aluno.nome,
            studentEmail: aluno.email,
            guardianName: isMenor ? (aluno.responsavel_nome || aluno.nome_responsavel) : undefined,
            contractUrl,
            monthlyFee: valor,
            dueDate: diaVenc,
            courseName: contractFormattedData.value?.curso
          }
        })
      } catch (confEmailErr) {
        console.warn('Erro ao disparar e-mail de confirmação:', confEmailErr)
      }
    }
    
    isSuccessModalOpen.value = true
    await refresh()
  } catch (error) {
    console.error('Erro ao assinar:', error)
    alert('Erro ao assinar contrato. Tente novamente.')
  } finally {
    isSubmitting.value = false
  }
  */
}

const closeSuccessModal = () => {
  isSuccessModalOpen.value = false
}
</script>

<style>
@media print {
  @page {
    size: A4 portrait;
    margin: 10mm 12mm;
  }

  html, body {
    background: white !important;
    color: black !important;
    padding: 0 !important;
    margin: 0 !important;
    height: auto !important;
    overflow: visible !important;
  }

  header, nav, .print\:hidden, [role="dialog"], .teleport-modal {
    display: none !important;
  }

  main {
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
    display: block !important;
    width: 100% !important;
  }

  .popmusic-contract-container {
    width: 100% !important;
    max-width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
  }

  .contract-page {
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }
}
</style>
