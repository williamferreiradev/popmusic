<template>
  <div v-if="pendingCount>0 || errorMessage || feedback" class="rounded-lg border border-light-border dark:border-dark-border p-4 text-light-text dark:text-offwhite">
    <p v-if="pendingCount">{{pendingCount}} cadastro(s) excluído(s) aguardando limpeza de acesso ou fotos. O perfil já está desativado.</p>
    <p v-if="errorMessage" role="alert" class="text-red-600 dark:text-red-300">{{errorMessage}}</p>
    <p v-if="feedback" role="status">{{feedback}}</p>
    <button v-if="pendingCount || errorMessage" class="mt-2 font-semibold underline disabled:opacity-50" :disabled="busy" @click="retry">{{busy?'Processando...':'Tentar concluir limpezas pendentes'}}</button>
  </div>
</template>
<script setup lang="ts">
import{ref,onMounted}from'vue'
const supabase=useSupabaseClient()
const pendingCount=ref(0),busy=ref(false),errorMessage=ref(''),feedback=ref('')
const headers=async()=>{const{data}=await supabase.auth.getSession();if(!data.session)throw new Error('Sessão expirada.');return{Authorization:`Bearer ${data.session.access_token}`}}
async function load(){try{const r=await $fetch<{pending:number}>('/api/admin/student-deletions',{headers:await headers()});pendingCount.value=r.pending}catch{errorMessage.value='Não foi possível verificar a limpeza dos cadastros excluídos.'}}
async function retry(){busy.value=true;errorMessage.value='';try{const r=await $fetch<{completed:number;failed:number}>('/api/admin/student-deletions/retry',{method:'POST',headers:await headers()});feedback.value=`${r.completed} limpeza(s) concluída(s). ${r.failed} ainda pendente(s).`;await load()}catch{errorMessage.value='Não foi possível concluir a limpeza. Tente novamente.'}finally{busy.value=false}}
onMounted(load)
</script>
