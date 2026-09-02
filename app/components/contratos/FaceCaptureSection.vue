<template>
  <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-5 shadow-md flex flex-col gap-4">
    
    <div class="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-gold/10 text-gold flex items-center justify-center font-bold text-xs">
          2
        </div>
        <div>
          <h3 class="text-sm font-bold text-light-text dark:text-offwhite flex items-center gap-2">
            <Camera class="w-4 h-4 text-gold" />
            Foto facial obrigatória (ao vivo)
          </h3>
          <p class="text-xs text-light-text/60 dark:text-offwhite/60">
            Tire uma foto nítida do seu rosto em tempo real para validação e assinatura do contrato.
          </p>
        </div>
      </div>

      <!-- Badge de Status -->
      <span 
        v-if="capturedPhoto" 
        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
      >
        <CheckCircle2 class="w-3.5 h-3.5" />
        Foto confirmada
      </span>
      <span 
        v-else 
        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
      >
        <AlertCircle class="w-3.5 h-3.5" />
        Obrigatória
      </span>
    </div>

    <!-- 1. Estado: Foto já capturada, verificada e confirmada -->
    <div v-if="capturedPhoto" class="flex flex-col sm:flex-row items-center gap-4 bg-light-bg/50 dark:bg-dark-bg/50 p-4 rounded-xl border border-light-border dark:border-dark-border">
      <div class="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-green-500 shadow-md shrink-0 bg-black">
        <img :src="capturedPhoto" alt="Rosto Capturado" class="w-full h-full object-cover" />
        <div class="absolute bottom-1 right-1 bg-green-600 text-white rounded-full p-0.5 shadow">
          <Check class="w-3.5 h-3.5" />
        </div>
      </div>

      <div class="flex-1 text-center sm:text-left">
        <div class="flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400 mb-1">
          <ShieldCheck class="w-4 h-4" />
          Foto facial validada com sucesso
        </div>
        <p class="text-xs text-light-text/70 dark:text-offwhite/70 leading-relaxed mb-3">
          Sua foto facial foi aprovada e será anexada ao termo de assinatura oficial e ao seu cadastro de aluno.
        </p>
        <button 
          type="button" 
          @click="resetCapture"
          class="px-3.5 py-1.5 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border hover:bg-light-border dark:hover:bg-dark-border text-light-text dark:text-offwhite text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          Tirar Outra Foto
        </button>
      </div>
    </div>

    <!-- 2. Estado: Câmera Ativa com Stream ao Vivo -->
    <div v-else-if="isCameraActive" class="flex flex-col items-center gap-3">
      <div class="relative w-full max-w-sm aspect-square bg-black rounded-2xl overflow-hidden shadow-inner border-2 border-primary flex items-center justify-center">
        
        <!-- Vídeo da Câmera -->
        <video 
          ref="videoRef" 
          autoplay 
          playsinline 
          muted
          class="w-full h-full object-cover -scale-x-100"
        ></video>

        <!-- Guia Oval para enquadrar o rosto -->
        <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div class="w-48 h-60 rounded-[50%] border-2 border-dashed border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center text-white text-center p-2">
            <span class="text-[11px] font-bold bg-black/70 px-3 py-1 rounded-full backdrop-blur-sm mt-auto mb-2 text-white">
              Enquadre seu rosto aqui
            </span>
          </div>
        </div>

        <!-- Indicador de Validação em Andamento -->
        <div v-if="isValidating" class="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 text-white p-4 text-center">
          <Loader2 class="w-8 h-8 animate-spin text-primary" />
          <span class="text-xs font-bold">Analisando a qualidade da foto...</span>
          <span class="text-[10px] text-white/70">Verificando rosto, enquadramento e iluminação</span>
        </div>

      </div>

      <!-- Alerta de Erro de Validação Facial -->
      <div v-if="validationError" class="w-full max-w-sm p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-center flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-semibold">
        <AlertTriangle class="w-5 h-5 shrink-0 text-red-500" />
        <span>{{ validationError }}</span>
      </div>

      <!-- Controles da Câmera -->
      <div class="flex items-center gap-3 mt-1">
        <button 
          type="button"
          @click="takeSnapshot"
          :disabled="isValidating"
          class="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-full shadow-lg transition-transform active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera class="w-4 h-4" />
          Capturar Foto do Rosto
        </button>
        <button 
          type="button"
          @click="stopCamera"
          :disabled="isValidating"
          class="px-4 py-2.5 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text dark:text-offwhite text-xs font-semibold rounded-full hover:bg-light-bg dark:hover:bg-dark-bg transition-colors cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </div>

    <!-- 3. Estado: Foto capturada em revisão (Validada com Sucesso) -->
    <div v-else-if="tempPhoto" class="flex flex-col items-center gap-3">
      <div class="relative w-full max-w-xs aspect-square bg-black rounded-2xl overflow-hidden shadow-md border-2 border-green-500 flex items-center justify-center">
        <img :src="tempPhoto" alt="Prévia da Foto" class="w-full h-full object-cover" />
        <div class="absolute top-2 right-2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
          <Check class="w-3 h-3" /> Rosto Validado
        </div>
      </div>

      <p class="text-xs text-light-text/80 dark:text-offwhite/80 text-center font-medium">
        Foto facial identificada com sucesso! Deseja confirmar e prosseguir com a assinatura?
      </p>

      <div class="flex items-center gap-3">
        <button 
          type="button"
          @click="confirmPhoto"
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Check class="w-4 h-4" />
          Confirmar Esta Foto
        </button>
        <button 
          type="button"
          @click="retakePhoto"
          class="px-4 py-2 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text dark:text-offwhite text-xs font-semibold rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          Tirar Novamente
        </button>
      </div>
    </div>

    <!-- 4. Estado Inicial: Botão Único para Abrir Câmera -->
    <div v-else class="flex flex-col items-center justify-center gap-3 py-3 text-center">
      <p class="text-xs text-light-text/70 dark:text-offwhite/70 max-w-md">
        Para garantir a autenticidade e segurança jurídica, a foto deve ser tirada <strong>ao vivo pela câmera</strong> deste aparelho.
      </p>

      <button 
        type="button"
        @click="startCamera"
        class="px-7 py-3.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
      >
        <Camera class="w-5 h-5" />
        Abrir Câmera e Tirar Foto do Rosto
      </button>
    </div>

    <!-- Alerta de Permissão de Câmera -->
    <p v-if="cameraError" class="text-xs text-red-500 text-center font-medium bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
      {{ cameraError }}
    </p>

    <!-- Canvas invisível para validação visual da foto -->
    <canvas ref="canvasRef" class="hidden"></canvas>

  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { Camera, CheckCircle2, AlertCircle, RotateCcw, Check, ShieldCheck, Loader2, AlertTriangle } from '@lucide/vue'
import { validateFaceImage } from '~/utils/faceDetection'

const props = defineProps<{
  initialPhoto?: string | null
}>()

const emit = defineEmits<{
  (e: 'update:photo', photoData: string | null): void
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const isCameraActive = ref(false)
const isValidating = ref(false)
const capturedPhoto = ref<string | null>(props.initialPhoto || null)
const tempPhoto = ref<string | null>(null)
const cameraError = ref<string | null>(null)
const validationError = ref<string | null>(null)

let mediaStream: MediaStream | null = null

const startCamera = async () => {
  cameraError.value = null
  validationError.value = null
  tempPhoto.value = null

  try {
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      throw new DOMException('Contexto inseguro', 'SecurityError')
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new DOMException('API de câmera indisponível', 'NotSupportedError')
    }
    isCameraActive.value = true
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 720 },
        height: { ideal: 720 }
      },
      audio: false
    })

    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
      await videoRef.value.play()
    }
    const videoTrack = mediaStream.getVideoTracks()[0]
    if (!videoTrack) throw new DOMException('Nenhuma câmera encontrada', 'NotFoundError')
    videoTrack.addEventListener('ended', handleCameraInterrupted, { once: true })
  } catch (err: any) {
    stopCamera(false)
    cameraError.value = cameraErrorMessage(err)
  }
}

const cameraErrorMessage = (err: any) => {
  switch (err?.name) {
    case 'NotAllowedError': return 'A permissão da câmera foi recusada. Autorize o acesso nas configurações do navegador e tente novamente.'
    case 'NotFoundError': return 'Nenhuma câmera foi encontrada neste aparelho.'
    case 'NotReadableError': return 'A câmera está sendo usada por outro aplicativo ou não pôde ser iniciada. Feche outros aplicativos e tente novamente.'
    case 'OverconstrainedError': return 'A câmera disponível não atende à configuração solicitada. Tente novamente ou use outro aparelho.'
    case 'SecurityError': return 'A câmera só pode ser usada em uma conexão segura (HTTPS).'
    case 'NotSupportedError': return 'Este navegador não oferece suporte à captura pela câmera.'
    case 'AbortError': return 'O acesso à câmera foi interrompido. Tente novamente.'
    default: return 'Não foi possível acessar a câmera. Verifique a permissão do navegador e tente novamente.'
  }
}

const handleCameraInterrupted = () => {
  mediaStream = null
  isCameraActive.value = false
  isValidating.value = false
  cameraError.value = 'A câmera foi interrompida ou desconectada. Reconecte-a e tente novamente.'
}

const stopCamera = (intentional = true) => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => {
      track.removeEventListener('ended', handleCameraInterrupted)
      track.stop()
    })
    mediaStream = null
  }
  isCameraActive.value = false
  if (intentional) isValidating.value = false
}

const takeSnapshot = async () => {
  if (!videoRef.value || !canvasRef.value) return

  validationError.value = null
  isValidating.value = true

  const video = videoRef.value
  const canvas = canvasRef.value
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) {
    validationError.value = 'A câmera ainda está iniciando. Aguarde um instante e tente novamente.'
    isValidating.value = false
    return
  }
  const size = Math.min(video.videoWidth || 480, video.videoHeight || 480)
  
  canvas.width = 400
  canvas.height = 400
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    isValidating.value = false
    return
  }

  // Espelha a imagem para selfie natural
  ctx.save()
  ctx.translate(canvas.width, 0)
  ctx.scale(-1, 1)

  const startX = ((video.videoWidth || size) - size) / 2
  const startY = ((video.videoHeight || size) - size) / 2

  ctx.drawImage(video, startX, startY, size, size, 0, 0, canvas.width, canvas.height)
  ctx.restore()

  // Valida presença aparente de rosto, enquadramento e iluminação; não identifica a pessoa.
  let validation
  try {
    validation = await validateFaceImage(canvas)
  } catch {
    validationError.value = 'Não foi possível analisar a foto. Tente novamente em um ambiente bem iluminado.'
    isValidating.value = false
    return
  }

  if (!validation.isValid) {
    validationError.value = validation.message
    isValidating.value = false
    return
  }

  // 2. Se validado com sucesso, gera a imagem e para a câmera
  tempPhoto.value = canvas.toDataURL('image/jpeg', 0.88)
  isValidating.value = false
  stopCamera()
}

const confirmPhoto = () => {
  if (!tempPhoto.value) return
  capturedPhoto.value = tempPhoto.value
  tempPhoto.value = null
  emit('update:photo', capturedPhoto.value)
}

const retakePhoto = () => {
  tempPhoto.value = null
  validationError.value = null
  startCamera()
}

const resetCapture = () => {
  capturedPhoto.value = null
  tempPhoto.value = null
  validationError.value = null
  emit('update:photo', null)
}

onUnmounted(() => {
  stopCamera()
})
</script>
