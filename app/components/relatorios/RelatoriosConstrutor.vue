<template>
  <div class="flex flex-col gap-5 text-light-text dark:text-offwhite">
    <p v-if="errorMessage" class="rounded-lg border border-red-500/40 p-4 text-red-600 dark:text-red-300" role="alert">{{ errorMessage }}</p>
    <p v-if="feedback" class="rounded-lg border border-green-500/40 p-4" role="status">{{ feedback }}</p>
    <div class="grid gap-6 lg:grid-cols-[300px_1fr]">
      <form class="flex flex-col gap-4 rounded-xl border border-light-border dark:border-dark-border p-5" @submit.prevent="generateReport(1)">
        <h2 class="text-lg font-bold">Relatório personalizado</h2>
        <BaseSelect v-model="savedId" label="Relatórios salvos" :options="savedOptions" placeholder="Escolha um relatório" @update:model-value="loadSaved" />
        <BaseSelect v-model="selectedOrigin" label="Origem dos dados" :options="origins" placeholder="Selecione" @update:model-value="clearFilters" />
        <BaseSelect v-if="statusOptions.length" v-model="filters.status" label="Status" :options="statusOptions" placeholder="Todos" />
        <BaseSelect v-if="selectedOrigin==='alunos'" v-model="filters.modality" label="Modalidade" :options="modalityOptions" placeholder="Todas" />
        <BaseSelect v-if="['alunos','frequencia','repasses'].includes(selectedOrigin)" v-model="filters.teacher" label="Professor" :options="teacherOptions" placeholder="Todos" />
        <BaseSelect v-if="selectedOrigin==='frequencia'" v-model="filters.class" label="Turma" :options="classOptions" placeholder="Todas" />
        <BaseSelect v-if="selectedOrigin==='frequencia'" v-model="filters.percentage" label="Presença registrada" :options="[{label:'Todas',value:''},{label:'Menos de 50%',value:'<50'},{label:'De 50% a 75%',value:'50-75'},{label:'Mais de 75%',value:'>75'}]" />
        <BaseSelect v-if="selectedOrigin==='financeiro'" v-model="filters.paymentMethod" label="Forma de pagamento" :options="paymentOptions" placeholder="Todas" />
        <template v-if="selectedOrigin">
          <p class="text-xs opacity-70">{{ dateLabel }}</p>
          <BaseInput v-model="filters.startDate" label="Data inicial" type="date" />
          <BaseInput v-model="filters.endDate" label="Data final" type="date" />
        </template>
        <BaseButton type="submit" variant="primary" :disabled="!selectedOrigin || isLoading || optionsLoading">{{ isLoading?'Gerando...':'Gerar relatório' }}</BaseButton>
        <BaseButton type="button" variant="outline" @click="clearFilters">Limpar filtros</BaseButton>
      </form>
      <div class="min-w-0 flex flex-col gap-4">
        <p v-if="!hasGenerated" class="rounded-xl border border-dashed border-light-border dark:border-dark-border p-10 text-center opacity-70">Escolha a origem e os filtros para consultar os dados do sistema.</p>
        <p v-else-if="isLoading" role="status">Consultando o banco...</p>
        <template v-else>
          <div class="flex flex-wrap justify-between gap-3">
            <p>{{ total }} resultado(s) · Página {{ page }} de {{ totalPages }}</p>
            <BaseButton variant="outline" @click="showSaveModal=true">Salvar filtro</BaseButton>
          </div>
          <RelatoriosResultTable :title="`Relatório de ${originLabel}`" :columns="tableColumns" :data="tableData" @close="hasGenerated=false" />
          <p class="text-xs opacity-70">O CSV exporta somente os resultados da página atual. Presença é calculada sobre registros existentes, sem estimar aulas não registradas.</p>
          <div class="flex justify-end gap-3">
            <BaseButton variant="outline" :disabled="page<=1" @click="generateReport(page-1)">Anterior</BaseButton>
            <BaseButton variant="outline" :disabled="page>=totalPages" @click="generateReport(page+1)">Próxima</BaseButton>
          </div>
        </template>
      </div>
    </div>
    <BaseModal :is-open="showSaveModal" title="Salvar relatório" @close="!isSaving && (showSaveModal=false)">
      <div class="flex flex-col gap-4">
        <p>O filtro ficará disponível no seletor Relatórios salvos desta tela.</p>
        <BaseInput v-model="newReportName" label="Nome" placeholder="Ex: Mensalidades pendentes" />
        <BaseButton variant="primary" :disabled="newReportName.trim().length<3 || isSaving" @click="saveFilter">{{isSaving?'Salvando...':'Salvar'}}</BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { reportColumns, validateReport, type ReportFilters, type ReportOrigin } from '#shared/utils/reportRules'
import type { TableColumn } from './RelatoriosResultTable.vue'
import RelatoriosResultTable from './RelatoriosResultTable.vue'
import BaseSelect from '../BaseSelect.vue'
import BaseInput from '../BaseInput.vue'
import BaseButton from '../BaseButton.vue'
import BaseModal from '../BaseModal.vue'
interface SavedReport {id:string;nome:string;origem_dados:ReportOrigin;filtros:ReportFilters}
interface Options {modalities:{id:string;nome:string}[];teachers:{id:string;nome:string}[];classes:{id:string;dia_semana:number;horario_inicio:string;modalidades:{nome:string}|null;professores:{nome:string}|null}[];saved:SavedReport[]}
const supabase=useSupabaseClient()
const origins=[{label:'Alunos',value:'alunos'},{label:'Frequência',value:'frequencia'},{label:'Financeiro',value:'financeiro'},{label:'Contratos',value:'contratos'},{label:'Repasses',value:'repasses'}]
const selectedOrigin=ref('')
const filters=ref<ReportFilters>({})
const savedId=ref('')
const options=ref<Options>({modalities:[],teachers:[],classes:[],saved:[]})
const optionsLoading=ref(false)
const isLoading=ref(false)
const isSaving=ref(false)
const hasGenerated=ref(false)
const errorMessage=ref('')
const feedback=ref('')
const tableData=ref<Record<string,unknown>[]>([])
const total=ref(0)
const page=ref(1)
const showSaveModal=ref(false)
const newReportName=ref('')
let sequence=0
watch([selectedOrigin, filters],()=>{sequence++;hasGenerated.value=false;tableData.value=[];total.value=0;page.value=1;isLoading.value=false},{deep:true,flush:'sync'})
const headers=async()=>{const{data}=await supabase.auth.getSession();if(!data.session)throw new Error('Sua sessão expirou. Entre novamente.');return{Authorization:`Bearer ${data.session.access_token}`}}
const message=(error:unknown)=>{const e=error as {data?:{statusMessage?:string};message?:string};return e.data?.statusMessage||e.message||'Não foi possível concluir a operação.'}
const refreshOptions=async()=>{optionsLoading.value=true;try{options.value=await $fetch<Options>('/api/admin/reports/options',{headers:await headers()})}catch(e){errorMessage.value=message(e)}finally{optionsLoading.value=false}}
onMounted(refreshOptions)
const modalityOptions=computed(()=>[{label:'Todas',value:''},...options.value.modalities.map(m=>({label:m.nome,value:m.id}))])
const teacherOptions=computed(()=>[{label:'Todos',value:''},...options.value.teachers.map(m=>({label:m.nome,value:m.id}))])
const classOptions=computed(()=>[{label:'Todas',value:''},...options.value.classes.map(t=>({label:`${t.modalidades?.nome||'Turma'} · ${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][t.dia_semana]} ${t.horario_inicio.slice(0,5)} · ${t.professores?.nome||'Sem professor'}`,value:t.id}))])
const savedOptions=computed(()=>options.value.saved.map(s=>({label:s.nome,value:s.id})))
const paymentOptions=[{label:'Todas',value:''},{label:'Pix',value:'pix'},{label:'Dinheiro',value:'dinheiro'},{label:'Cartão',value:'cartao'},{label:'Transferência',value:'transferencia'},{label:'Boleto',value:'boleto'}]
const statuses:Record<string,string[]>={alunos:['ativo','pendente','trancado','cancelado'],financeiro:['paga','atrasada','pendente','cancelada'],contratos:['aguardando_assinatura','aceito','expirado','cancelado','renovado','vencendo','vencido'],repasses:['pago','pendente']}
const statusOptions=computed(()=>statuses[selectedOrigin.value]?[{label:'Todos',value:''},...statuses[selectedOrigin.value]!.map(s=>({label:s.replaceAll('_',' '),value:s}))]:[])
const tableColumns=computed(()=>[...(reportColumns[selectedOrigin.value as ReportOrigin]||[])] as TableColumn[])
const originLabel=computed(()=>origins.find(o=>o.value===selectedOrigin.value)?.label||'')
const totalPages=computed(()=>Math.max(1,Math.ceil(total.value/50)))
const dateLabel=computed(()=>({alunos:'Período da matrícula',frequencia:'Período das aulas registradas',financeiro:'Período de vencimento',contratos:'Período de envio',repasses:'Período da competência'}[selectedOrigin.value as ReportOrigin]))
const clearFilters=()=>{sequence++;filters.value={};savedId.value='';hasGenerated.value=false;tableData.value=[];errorMessage.value='';feedback.value='';isLoading.value=false}
const generateReport=async(nextPage=1)=>{
  const request=++sequence;errorMessage.value='';feedback.value=''
  try{
    const report=validateReport(selectedOrigin.value,filters.value)
    isLoading.value=true;hasGenerated.value=true
    const result=await $fetch<{rows:Record<string,unknown>[];total:number}>('/api/admin/reports/generate',{method:'POST',headers:await headers(),body:{origin:report.origin,filters:report.filters,page:nextPage,pageSize:50}})
    if(request!==sequence)return
    tableData.value=result.rows;total.value=Number(result.total);page.value=nextPage
  }catch(e){if(request===sequence){errorMessage.value=message(e);tableData.value=[];hasGenerated.value=false}}
  finally{if(request===sequence)isLoading.value=false}
}
const loadSaved=()=>{const s=options.value.saved.find(r=>r.id===savedId.value);if(!s)return;selectedOrigin.value=s.origem_dados;filters.value={...s.filtros};void generateReport(1)}
const saveFilter=async()=>{
  if(isSaving.value)return
  isSaving.value=true;errorMessage.value=''
  try{const report=validateReport(selectedOrigin.value,filters.value);await $fetch('/api/admin/reports/save',{method:'POST',headers:await headers(),body:{name:newReportName.value,...report}});await refreshOptions();showSaveModal.value=false;newReportName.value='';feedback.value='Filtro salvo no banco.'}
  catch(e){errorMessage.value=message(e)}finally{isSaving.value=false}
}
</script>
