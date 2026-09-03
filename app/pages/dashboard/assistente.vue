<template>
  <div class="h-screen flex bg-light-bg dark:bg-dark-bg text-light-text dark:text-offwhite overflow-hidden">
    <aside class="hidden lg:flex w-72 shrink-0 border-r border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface flex-col">
      <div class="p-4 border-b border-light-border dark:border-dark-border">
        <button class="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg px-4 py-2.5" @click="newConversation"><Plus class="w-4 h-4" /> Nova conversa</button>
      </div>
      <div class="flex-1 overflow-y-auto p-2 space-y-1">
        <button v-for="conversation in conversations" :key="conversation.id" class="w-full text-left p-3 rounded-lg group flex items-center gap-3" :class="activeId === conversation.id ? 'bg-primary/10 text-primary dark:text-offwhite' : 'hover:bg-light-bg dark:hover:bg-dark-bg'" @click="activeId = conversation.id">
          <MessageSquare class="w-4 h-4 shrink-0" /><span class="truncate text-sm flex-1">{{ conversation.title }}</span>
          <Trash2 class="w-4 h-4 opacity-0 group-hover:opacity-60" @click.stop="removeConversation(conversation.id)" />
        </button>
      </div>
      <div class="p-3 border-t border-light-border dark:border-dark-border text-xs text-light-text/50 dark:text-offwhite/50">Conversas salvas neste navegador</div>
    </aside>

    <section class="flex-1 flex flex-col min-w-0">
      <header class="min-h-16 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3">
        <div><h1 class="font-bold">Assistente Pop Music</h1><p class="text-xs opacity-50">Cadastros e consultas por conversa</p></div>
        <span class="text-xs px-2.5 py-1 rounded-full border text-amber-500 border-amber-500/30 bg-amber-500/10">Modo de demonstração</span>
      </header>

      <div ref="messageArea" class="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8">
        <div class="max-w-3xl mx-auto space-y-6">
          <div v-if="!messages.length" class="min-h-[55vh] flex flex-col items-center justify-center text-center">
            <div class="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4"><Bot class="w-7 h-7" /></div>
            <h2 class="text-xl font-bold">Como posso ajudar?</h2>
            <p class="text-sm opacity-60 mt-2 max-w-md">Digite ou fale uma solicitação. O assistente sempre pedirá confirmação antes de alterar o banco.</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 w-full max-w-xl">
              <button v-for="suggestion in suggestions" :key="suggestion" class="p-3 text-sm text-left rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface hover:border-primary/50" @click="input = suggestion">{{ suggestion }}</button>
            </div>
          </div>

          <div v-for="message in messages" :key="message.id" class="flex gap-3" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
            <div v-if="message.role === 'assistant'" class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><Bot class="w-4 h-4" /></div>
            <div class="max-w-[78%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap" :class="message.role === 'user' ? 'bg-primary text-white rounded-br-md' : 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-bl-md'">
              {{ message.content }}
              <div v-if="message.preview" class="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
                <p class="font-bold">Prévia da operação</p>
                <div v-for="(value, key) in message.preview" :key="key" class="flex justify-between gap-4 text-xs"><span class="opacity-60">{{ labels[key] || key }}</span><span class="font-medium text-right">{{ value || 'Não informado' }}</span></div>
                <div class="flex justify-end gap-2 pt-2"><button class="px-3 py-1.5 rounded-md border" @click="cancelPreview(message)">Cancelar</button><button disabled class="px-3 py-1.5 rounded-md bg-primary text-white opacity-50">Confirmar cadastro</button></div>
                <p class="text-[11px] text-amber-500">A confirmação será habilitada quando a API for configurada.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer class="p-4 border-t border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
        <form class="max-w-3xl mx-auto flex items-end gap-2" @submit.prevent="sendMessage">
          <button type="button" class="p-3 rounded-xl border" :class="isRecording ? 'bg-red-500 text-white border-red-500 animate-pulse' : 'border-light-border dark:border-dark-border hover:border-primary opacity-70'" :title="speechSupported ? 'Falar' : 'Voz indisponível neste navegador'" @click="toggleRecording"><Square v-if="isRecording" class="w-5 h-5" /><Mic v-else class="w-5 h-5" /></button>
          <textarea v-model="input" rows="1" placeholder="Ex.: Cadastre o aluno João, CPF..., nascimento..." class="flex-1 resize-none max-h-32 rounded-xl border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg px-4 py-3 text-sm focus:outline-none focus:border-primary" @keydown.enter.exact.prevent="sendMessage" />
          <button type="submit" :disabled="!input.trim()" class="p-3 rounded-xl bg-primary hover:bg-primary-hover text-white disabled:opacity-40"><Send class="w-5 h-5" /></button>
        </form>
        <p class="text-[11px] text-center mt-2 opacity-40">Confira os dados antes de confirmar qualquer operação.</p>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { Bot, MessageSquare, Mic, Plus, Send, Square, Trash2 } from '@lucide/vue'
type Message = { id: string; role: 'user' | 'assistant'; content: string; preview?: Record<string, string> | null }
type Conversation = { id: string; title: string; messages: Message[] }
const conversations = ref<Conversation[]>([])
const activeId = ref('')
const input = ref('')
const isRecording = ref(false)
const speechSupported = ref(false)
const messageArea = ref<HTMLElement | null>(null)
let recognition: any = null
const suggestions = ['Cadastre um novo aluno para mim', 'Quais são as turmas de teclado?', 'Mostre os contratos pendentes', 'Crie uma turma segunda às 14h']
const labels: Record<string, string> = { nome: 'Nome', cpf: 'CPF', nascimento: 'Nascimento', telefone: 'Telefone', email: 'E-mail', modalidade: 'Modalidade', turma: 'Turma' }
const activeConversation = computed(() => conversations.value.find(item => item.id === activeId.value))
const messages = computed(() => activeConversation.value?.messages || [])
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const newConversation = () => { const item = { id: id(), title: 'Nova conversa', messages: [] }; conversations.value.unshift(item); activeId.value = item.id }
const removeConversation = (conversationId: string) => { conversations.value = conversations.value.filter(item => item.id !== conversationId); if (activeId.value === conversationId) activeId.value = conversations.value[0]?.id || ''; if (!conversations.value.length) newConversation() }
const extractPreview = (text: string) => {
  if (!/cadastr|matr[ií]cul/i.test(text) || !/alun/i.test(text)) return null
  return {
    nome: text.match(/alun[oa]\s+([A-Za-zÀ-ÿ ]+?)(?=,|\s+cpf|\s+nasc|\s+telefone|\s+email|$)/i)?.[1]?.trim() || '',
    cpf: text.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/)?.[0] || '',
    nascimento: text.match(/\b\d{2}\/\d{2}\/\d{4}\b/)?.[0] || '',
    telefone: text.match(/(?:\(?\d{2}\)?\s?)?9?\d{4}[-\s]?\d{4}/)?.[0] || '',
    email: text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0] || '', modalidade: '', turma: ''
  }
}
const sendMessage = async () => {
  const text = input.value.trim(); if (!text) return; if (!activeConversation.value) newConversation()
  const conversation = activeConversation.value!; conversation.messages.push({ id: id(), role: 'user', content: text }); if (conversation.messages.length === 1) conversation.title = text.slice(0, 38); input.value = ''
  const preview = extractPreview(text)
  conversation.messages.push({ id: id(), role: 'assistant', content: preview ? 'Entendi que você deseja cadastrar um aluno. Confira os dados:' : 'A tela está pronta. Quando a API for conectada, vou interpretar e executar esta solicitação.', preview })
  await nextTick(); if (messageArea.value) messageArea.value.scrollTop = messageArea.value.scrollHeight
}
const cancelPreview = (message: Message) => { message.preview = null; message.content = 'Operação cancelada. Nenhum dado foi alterado.' }
const toggleRecording = () => { if (!recognition) return; if (isRecording.value) recognition.stop(); else recognition.start() }
onMounted(() => {
  const saved = localStorage.getItem('popmusic-assistant-conversations'); if (saved) try { conversations.value = JSON.parse(saved) } catch { /* Ignora cache local inválido. */ }
  if (!conversations.value.length) newConversation(); else activeId.value = conversations.value[0]?.id ?? ''
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; speechSupported.value = Boolean(SpeechRecognition)
  if (SpeechRecognition) { recognition = new SpeechRecognition(); recognition.lang = 'pt-BR'; recognition.interimResults = true; recognition.onstart = () => isRecording.value = true; recognition.onend = () => isRecording.value = false; recognition.onresult = (event: any) => input.value = Array.from(event.results).map((result: any) => result[0].transcript).join('') }
})
watch(conversations, value => { if (import.meta.client) localStorage.setItem('popmusic-assistant-conversations', JSON.stringify(value)) }, { deep: true })
</script>
