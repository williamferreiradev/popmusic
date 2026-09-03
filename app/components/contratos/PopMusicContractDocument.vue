<template>
  <div class="popmusic-contract-container bg-white text-black font-sans text-[11px] leading-[1.35] tracking-tight print:p-0 print:m-0 print:shadow-none print:w-full">
    
    <!-- Botão de Impressão (Apenas visível em tela se solicitado) -->
    <div v-if="showPrintButton" class="print:hidden mb-4 flex justify-end gap-2">
      <button 
        type="button" 
        class="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded shadow flex items-center gap-2 transition-colors cursor-pointer"
        @click="triggerPrint"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Imprimir / Salvar em PDF
      </button>
    </div>

    <!-- Folha do Contrato (Layout A4 Fiel ao PDF) -->
    <div id="printable-popmusic-contract" class="contract-page bg-white p-6 sm:p-8 max-w-[800px] mx-auto border border-gray-300 shadow-lg print:border-none print:shadow-none print:p-4 print:max-w-none">
      
      <!-- Cabeçalho com Logo Banner -->
      <div class="border-t-2 border-b-2 border-black py-2 mb-3">
        <div class="flex items-center justify-between px-2">
          <!-- Logo Estilizado Pop Music -->
          <div class="flex flex-col items-center justify-center w-full">
            <div class="text-center font-extrabold tracking-[0.35em] text-xs uppercase text-gray-800 flex items-center justify-center gap-2 w-full">
              <span class="h-[1px] bg-gray-400 flex-1"/>
              <span>A c a d e m i a &nbsp; d e &nbsp; M ú s i c a</span>
              <span class="h-[1px] bg-gray-400 flex-1"/>
            </div>
            <div class="flex items-center justify-center gap-4 py-1">
              <span class="text-2xl sm:text-3xl font-black italic tracking-widest text-black font-sans">POP MUSIC</span>
            </div>
            <!-- Simulação de Teclado no banner -->
            <div class="flex h-1.5 w-full bg-gray-200 border-t border-b border-black overflow-hidden">
              <div v-for="i in 36" :key="i" class="flex-1 border-r border-gray-400 last:border-0" :class="{'bg-black w-1': i % 3 === 0}"/>
            </div>
          </div>
        </div>
      </div>

      <!-- Título Principal -->
      <div class="text-center mb-3">
        <h1 class="text-xs sm:text-sm font-bold tracking-wider uppercase">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
        <p class="text-[10px] text-gray-700">Contrato de prestação de serviços estabelecido entre duas partes.</p>
      </div>

      <!-- Seção CONTRATANTE -->
      <div class="mb-2.5">
        <div class="font-bold text-[11px] mb-1">CONTRATANTE:</div>
        <div class="space-y-1 text-[10.5px]">
          <div class="flex flex-wrap items-baseline gap-x-2">
            <span class="whitespace-nowrap">Nome da Contratante:</span>
            <span class="font-semibold border-b border-black flex-1 min-w-[200px] px-1">{{ contractData.nome_contratante || '________________________________________________' }}</span>
            <span class="whitespace-nowrap">CPF:</span>
            <span class="font-semibold border-b border-black min-w-[140px] px-1">{{ contractData.cpf_contratante || '_________________________' }}</span>
          </div>
          
          <div class="flex flex-wrap items-baseline gap-x-2">
            <span class="whitespace-nowrap">Endereço:</span>
            <span class="font-semibold border-b border-black flex-1 min-w-[150px] px-1">{{ contractData.endereco_contratante || '_____________________________________' }}</span>
            <span class="whitespace-nowrap">Bairro:</span>
            <span class="font-semibold border-b border-black min-w-[110px] px-1">{{ contractData.bairro_contratante || '___________________' }}</span>
            <span class="whitespace-nowrap">Cidade:</span>
            <span class="font-semibold border-b border-black min-w-[110px] px-1">{{ contractData.cidade_contratante || '___________________' }}</span>
            <span class="whitespace-nowrap">UF:</span>
            <span class="font-semibold border-b border-black min-w-[35px] text-center px-1">{{ contractData.uf_contratante || '____' }}</span>
          </div>

          <div class="flex flex-wrap items-baseline gap-x-2">
            <span class="whitespace-nowrap">Telefones:</span>
            <span class="font-semibold border-b border-black flex-1 min-w-[160px] px-1">{{ contractData.telefone_contratante || '_____________________________________' }}</span>
            <span class="whitespace-nowrap">CEP:</span>
            <span class="font-semibold border-b border-black min-w-[90px] px-1">{{ contractData.cep_contratante || '_____________' }}</span>
            <span class="whitespace-nowrap">D.N:</span>
            <span class="font-semibold border-b border-black min-w-[80px] text-center px-1">{{ contractData.data_nascimento_contratante || '___/___/______' }}</span>
          </div>
        </div>
      </div>

      <!-- Seção DADOS DO ALUNO -->
      <div class="mb-3">
        <div class="font-bold text-[11px] mb-1">DADOS DO ALUNO</div>
        <div class="flex flex-wrap items-baseline gap-x-2 text-[10.5px]">
          <span class="whitespace-nowrap">Nome:</span>
          <span class="font-semibold border-b border-black flex-1 min-w-[160px] px-1">{{ contractData.nome_aluno || '________________________________________' }}</span>
          <span class="whitespace-nowrap">D.N:</span>
          <span class="font-semibold border-b border-black min-w-[75px] text-center px-1">{{ contractData.data_nascimento_aluno || '____/____/______' }}</span>
          <span class="whitespace-nowrap">CPF:</span>
          <span class="font-semibold border-b border-black min-w-[120px] px-1">{{ contractData.cpf_aluno || '___________________' }}</span>
          <span class="whitespace-nowrap">Curso:</span>
          <span class="font-semibold border-b border-black min-w-[120px] px-1">{{ contractData.curso || '__________________________' }}</span>
        </div>
      </div>

      <!-- Preâmbulo -->
      <p class="text-justify text-[10.5px] mb-2.5">
        Por este instrumento particular de contrato, e na melhor forma de direito, entre as partes, justas e avençadas, de um lado o (a) <strong>CONTRATANTE</strong>, acima identificado, e de outro a <strong>{{ contractData.escola_nome || 'Academia de Música POP MUSIC' }}</strong><template v-if="contractData.escola_endereco">, com sede em {{ contractData.escola_endereco }}</template>. Fica contratado por si e se obrigam mutuamente a respeitar e cumprir o que se segue:
      </p>

      <!-- DO OBJETO DO CONTRATO -->
      <div class="mb-2">
        <div class="font-bold text-[11px]">DO OBJETO DO CONTRATO</div>
        <p class="text-justify text-[10.5px]">
          <strong>CLÁUSULA 1ª.</strong> O objeto do presente instrumento é a prestação, pela <strong>CONTRATADA</strong>, em favor do <strong>CONTRATANTE</strong>, dos serviços de ensino da música (CNAE 8592-9/03), por meio de aulas de música.
        </p>
      </div>

      <!-- DAS OBRIGAÇÕES DA CONTRATADA -->
      <div class="mb-2 space-y-1">
        <div class="font-bold text-[11px]">DAS OBRIGAÇÕES DA CONTRATADA</div>
        <p class="text-justify text-[10.5px]">
          <strong>Parágrafo 1º.</strong> O curso básico tem duração de um ano, podendo ter um tempo indeterminado por se tratar do interesse e coordenação do aluno, podendo ser cancelado após o sexto mês ou prorrogado por mais 06 meses. O não comparecimento do aluno às aulas estabelecidas conforme esta cláusula, não o exime do pagamento a mensalidade.
        </p>
        <p class="text-justify text-[10.5px]">
          <strong>Parágrafo 2º.</strong> As aulas serão individuais ou em grupo, a depender da grade de horário da Contratada. Serão ministradas <strong>1x por semana</strong>, com duração de <strong>60 minutos</strong> e agendas no ato da matrícula conforme interesse do aluno e disponibilidade do professor, sendo <strong>dia e horário fixo semanal ou por escala</strong> a depender da disponibilidade de ambos os envolvidos.
        </p>
        <p class="text-justify text-[10.5px]">
          <strong>Parágrafo 3º.</strong> Caso o aluno desista, a qualquer tempo, ou por qualquer motivo não haverá devolução de dinheiro.
        </p>
        <p class="text-justify text-[10.5px]">
          <strong>Parágrafo 4º</strong> O curso será ministrado no seguinte dia: <span class="font-bold underline px-1">{{ contractData.dias_semana || '_______________' }}</span>, DAS <span class="font-bold underline px-1">{{ contractData.horario_inicio || '___:___' }}</span> ÀS <span class="font-bold underline px-1">{{ contractData.horario_fim || '___:___' }}</span> HS. Podendo haver alterações mediante a disponibilização da contratada.
        </p>
        <p class="text-justify text-[10.5px]">
          <strong>Parágrafo 5º.</strong> A contratada tem sua proposta de ensino orientada de acordo com seu Regimento Musical que tem por finalidade a inicialização e desenvolvimento musical do aluno.
        </p>
      </div>

      <!-- DAS OBRIGAÇÕES DA CONTRATANTE -->
      <div class="mb-2 space-y-1">
        <div class="font-bold text-[11px]">DAS OBRIGAÇÕES DA CONTRATANTE</div>
        <p class="text-justify text-[10.5px]">
          <strong>CLÁUSULA 2ª.</strong> É obrigação do <strong>CONTRATANTE</strong> comunicar, com antecedência mínima de 2 (duas horas), a impossibilidade de comparecer à aula previamente agendada, caso contrário, computar-se-á a aula no pacote do (a) CONTRATANTE, salvo nos casos de enfermidade ou internação hospitalar, devidamente comprovadas por atestado médico.
        </p>
        <p class="text-justify text-[10.5px]">
          <strong>Parágrafo 1º</strong> Aulas fora do período programado, solicitadas pelo aluno, terão custo extra de R$ 50,00 (cinquenta reais) ao mesmo.
        </p>
        <p class="text-justify text-[10.5px]">
          <strong>Parágrafo 2º.</strong> Em períodos de recesso (natal e ano novo) o contratante <strong>não será isento</strong> do pagamento das parcelas vincendas ou vencidas do plano contratual financeiro à contratada.
        </p>
        <p class="text-justify text-[10.5px]">
          <strong>Parágrafo 3º.</strong> O não comparecimento do aluno às aulas mensais estabelecidas <strong>não o exime do pagamento</strong>.
        </p>
        <p class="text-justify text-[10.5px]">
          <strong>Parágrafo 4º.</strong> Haverá reposição de aulas somente mediante atestado médico ou caso o professor falte. Não haverá reposição em feriados <strong>nacionais e municipais</strong>.
        </p>
      </div>

      <!-- DO PAGAMENTO -->
      <div class="mb-2 space-y-1">
        <div class="font-bold text-[11px]">DO PAGAMENTO</div>
        <p class="text-justify text-[10.5px] leading-relaxed">
          <strong>CLÁUSULA 3ª.</strong> Em contrapartida aos serviços prestados, o(a) <strong>CONTRATANTE</strong> pagará em favor da <strong>CONTRATADA</strong> o valor certo e ajustado de 
          <span class="font-bold underline px-1">R$ {{ contractData.valor_total || '__________' }}</span> (<span class="font-bold underline px-1">{{ contractData.valor_total_extenso || '_____________________________________' }}</span>) 
          os quais serão pagos em <span class="font-bold underline px-1">{{ contractData.numero_parcelas || '___' }}</span> (<span class="font-bold underline px-1">{{ contractData.numero_parcelas_extenso || '_____________' }}</span>) 
          iguais e sucessivas de <strong>R$ {{ contractData.valor_mensalidade || '180,00' }} ({{ contractData.valor_mensalidade_extenso || 'cento e oitenta reais' }})</strong>, 
          sendo que a primeira vencerá no dia <span class="font-bold underline px-1">{{ contractData.dia_primeira_parcela || '____' }}</span> de <span class="font-bold underline px-1">{{ contractData.mes_primeira_parcela || '_____________' }}</span> de 20<span class="font-bold underline px-0.5">{{ contractData.ano_primeira_parcela || '___' }}</span>, 
          sendo que a primeira será quitada no momento da assinatura deste contrato. As seguintes terão <strong>vencimento no dia {{ contractData.dia_vencimento || '_____' }} de cada mês</strong>. 
          Os pagamentos poderão ser efetuados por meio de boleto bancário, pix, ou cartão de crédito ou débito ou transferência bancária.
        </p>
        <p class="text-justify text-[10.5px]">
          <strong>Parágrafo 1º.</strong> Caso o pagamento seja efetuado após a data de vencimento, importará na cobrança de multa de R$ 5,00 (cinco reais) sobre o valor bruto da prestação em atraso e juros de 0,20 (vinte centavos) ao dia.
        </p>
        <p class="text-justify text-[10.5px]">
          <strong>Parágrafo 2º.</strong> Será cobrada à parte a 2ª Via do Carnê, no valor de 30,00, caso haja extravio por parte do aluno.
        </p>
        <p class="text-justify text-[10.5px]">
          <strong>Parágrafo 3º</strong> Reserva-se o direito à contratada, enviar lembretes via SMS, whatsapp ou email sobre parcelas em aberto ou a vencer até 3 dias antecedentes ao vencimento. Após o vencimento, a CONTRATADA poderá realizar cobranças à contratante, via email, SMS ou Whatsapp.
        </p>
        <p class="text-justify text-[10.5px]">
          <strong>Parágrafo 4º</strong> A CONTRATADA se reserva o direito de cancelar o presente contrato e matrícula, e ainda, sobretudo, na falta de pagamento por mais de 30 dias implicará no desligamento do aluno na grade de horário, sendo que a dívida permanece até que seja efetuado o pagamento da mesma.
        </p>
        <p class="text-justify text-[10.5px]">
          <strong>CLÁUSULA 4ª.</strong> Pelo presente instrumento, o (a) <strong>CONTRATANTE cede em favor da CONTRATADA os direitos de utilização de sua imagem e voz</strong> em eventos e divulgação da mesma.
        </p>
      </div>

      <!-- DA RESCISÃO -->
      <div class="mb-2 space-y-1">
        <div class="font-bold text-[11px]">DA RESCISÃO</div>
        <p class="text-justify text-[10.5px]">
          <strong>Cláusula 5ª.</strong> O presente contrato será rescindido caso uma das partes descumpra o pactuado nas cláusulas deste instrumento.
        </p>
        <p class="text-justify text-[10.5px]">
          <strong>Cláusula 6ª.</strong> Caso ocorra algum impedimento à realização do evento, ligado a caso fortuito ou a força maior, as partes deverão pactuar outra data ou proceder à devolução dos valores vincendos do contrato e à reposição do que foi gasto nos preparativos. Na possibilidade, as partes deverão informar a rescisão do contrato com no mínimo 30 dias de antecedência.
        </p>
      </div>

      <!-- DA MULTA -->
      <div class="mb-3 space-y-1">
        <div class="font-bold text-[11px]">DA MULTA</div>
        <p class="text-justify text-[10.5px]">
          <strong>Cláusula 7ª.</strong> A parte que der causa à rescisão do presente pagará multa de <strong>50% (cinquenta por cento)</strong> do valor restante ao término do contrato.
        </p>
        <p class="text-justify text-[10.5px]">
          <strong>Cláusula 8ª</strong> As partes elegem o <strong>Fórum da Comarca de Novo Gama</strong>, como único competente para dirimir toda e qualquer dúvida, controvérsia e litígio, decorrente do exato cumprimento deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja ou venha a ser.
        </p>
        <p class="text-justify text-[10.5px]">
          <strong>PARÁGRAFO ÚNICO:</strong> O Presente contrato terá validade exclusivamente para o ano de <strong>{{ contractData.ano_vigencia || '2026' }}</strong> ou ao término estabelecido de 01 ano deste contrato.
        </p>
        <p class="text-justify text-[10.5px] mt-1">
          E assim, por estarem justas e contratadas, as partes assinam o presente em duas (02) vias de igual teor, valor e forma, após lido e achado conforme.
        </p>
      </div>

      <!-- Data e Local -->
      <div class="text-right text-[10.5px] my-3">
        Novo Gama, <span class="font-semibold underline px-1">{{ contractData.data_dia || '____' }}</span> de <span class="font-semibold underline px-1">{{ contractData.data_mes || '_______________' }}</span> de 20<span class="font-semibold underline px-0.5">{{ contractData.data_ano || '___' }}</span>.
      </div>

      <!-- Bloco de Assinaturas -->
      <div class="grid grid-cols-2 gap-8 pt-4 pb-2 text-center text-[10.5px]">
        
        <!-- Assinatura Contratada -->
        <div class="flex flex-col items-center">
          <div class="w-full border-t border-black pt-1">
            <div class="font-bold">Academia de Música Pop Music</div>
            <div class="text-[10px] text-gray-700">Contratada</div>
          </div>
        </div>

        <!-- Assinatura Contratante -->
        <div class="flex flex-col items-center">
          <div class="w-full border-t border-black pt-1">
            <div class="font-bold truncate max-w-full">{{ contractData.nome_contratante || 'Contratante' }}</div>
            <div class="text-[10px] text-gray-700">Contratante</div>
          </div>
        </div>

      </div>

      <!-- Carimbo de Assinatura Eletrônica com Foto Facial (Se assinado digitalmente) -->
      <div v-if="signedInfo" class="mt-3 p-2.5 bg-green-50 border border-green-300 rounded text-[9.5px] text-green-900 leading-tight flex items-center gap-3">
        <!-- Foto Facial de Comprovação -->
        <div v-if="signedInfo.signerPhoto" class="shrink-0 flex flex-col items-center">
          <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-md border-2 border-green-600 overflow-hidden shadow-sm bg-white">
            <img :src="signedInfo.signerPhoto" alt="Foto facial do signatário" class="w-full h-full object-cover" >
          </div>
          <span class="text-[7.5px] text-green-800 font-bold mt-0.5 uppercase tracking-tighter">Foto do signatário</span>
        </div>

        <div class="flex-1">
          <div class="font-bold flex items-center gap-1 text-green-800 text-[10px]">
            <svg class="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            ASSINATURA DIGITAL & COMPROVAÇÃO FACIAL REGISTRADAS
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1 text-[9px] text-gray-700">
            <div><strong>Signatário:</strong> {{ signedInfo.signerName }} (CPF: {{ signedInfo.signerCpf }})</div>
            <div><strong>Data/Hora:</strong> {{ signedInfo.acceptedAt }}</div>
            <div><strong>IP de Registro:</strong> {{ signedInfo.ip || '127.0.0.1 (Registro Seguro)' }}</div>
            <div><strong>Token / Hash:</strong> <span class="font-mono">{{ signedInfo.token }}</span></div>
          </div>
          <div class="mt-1 text-[8px] text-gray-500 italic">
            Documento assinado eletronicamente com comprovação fotográfica e validade jurídica nos termos da MP nº 2.200-2/2001 e da Lei nº 14.063/2020.
          </div>
        </div>
      </div>

      <!-- Rodapé Institucional -->
      <div class="mt-4 pt-2 border-t border-black text-center text-[9px] text-gray-800 leading-tight">
        <div>{{ [contractData.escola_endereco, contractData.escola_telefone, contractData.escola_cnpj, contractData.escola_email].filter(Boolean).join(' • ') }}</div>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface PopMusicContractData {
  escola_nome?: string
  escola_cnpj?: string
  escola_endereco?: string
  escola_telefone?: string
  escola_email?: string
  nome_contratante?: string
  cpf_contratante?: string
  endereco_contratante?: string
  bairro_contratante?: string
  cidade_contratante?: string
  uf_contratante?: string
  telefone_contratante?: string
  cep_contratante?: string
  data_nascimento_contratante?: string
  
  nome_aluno?: string
  data_nascimento_aluno?: string
  cpf_aluno?: string
  curso?: string
  
  dias_semana?: string
  horario_inicio?: string
  horario_fim?: string
  
  valor_total?: string
  valor_total_extenso?: string
  numero_parcelas?: string
  numero_parcelas_extenso?: string
  valor_mensalidade?: string
  valor_mensalidade_extenso?: string
  
  dia_primeira_parcela?: string
  mes_primeira_parcela?: string
  ano_primeira_parcela?: string
  dia_vencimento?: string
  
  ano_vigencia?: string
  data_dia?: string
  data_mes?: string
  data_ano?: string
}

export interface SignedContractInfo {
  signerName: string
  signerCpf: string
  acceptedAt: string
  token: string
  ip?: string
  signerPhoto?: string
}

const props = withDefaults(defineProps<{
  data?: PopMusicContractData
  signedInfo?: SignedContractInfo | null
  showPrintButton?: boolean
}>(), {
  data: () => ({}),
  signedInfo: null,
  showPrintButton: true
})

const contractData = computed(() => {
  return props.data || {}
})

const triggerPrint = () => {
  if (typeof window === 'undefined') return

  const elem = document.getElementById('printable-popmusic-contract')
  if (!elem) {
    window.print()
    return
  }

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (doc) {
    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Contrato Oficial - Pop Music</title>
          <style>
            @page { size: A4 portrait; margin: 8mm 10mm; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: white; color: black; margin: 0; padding: 0; }
            .popmusic-contract-container { width: 100%; max-width: 210mm; margin: 0 auto; background: white; }
            .contract-page { padding: 15px; background: white; color: black; line-height: 1.35; font-size: 11px; }
            .border { border-width: 1px; border-color: #000; }
            .border-t { border-top-width: 1px; border-color: #000; }
            .border-b { border-bottom-width: 1px; border-color: #000; }
            .border-green-300 { border-color: #86efac !important; }
            .border-green-600 { border-color: #16a34a !important; }
            .bg-green-50 { background-color: #f0fdf4 !important; }
            .text-green-900 { color: #14532d !important; }
            .text-green-800 { color: #166534 !important; }
            .text-green-600 { color: #16a34a !important; }
            .font-bold { font-weight: bold; }
            .font-mono { font-family: monospace; }
            .text-center { text-align: center; }
            .text-justify { text-align: justify; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .flex { display: flex; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .gap-3 { gap: 0.75rem; }
            .gap-1 { gap: 0.25rem; }
            .rounded-md { border-radius: 0.375rem; }
            .rounded { border-radius: 0.25rem; }
            .object-cover { object-fit: cover; }
            .w-16 { width: 4rem; }
            .h-16 { height: 4rem; }
            .w-full { width: 100%; }
            .h-full { height: 100%; }
            .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          </style>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
        </head>
        <body>
          <div class="popmusic-contract-container">
            ${elem.innerHTML}
          </div>
        </body>
      </html>
    `)
    doc.close()
    iframe.contentWindow?.focus()
    setTimeout(() => {
      iframe.contentWindow?.print()
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 1500)
    }, 400)
  }
}
</script>

<style scoped>
@media print {
  @page {
    size: A4 portrait;
    margin: 8mm 10mm;
  }
  
  body {
    background: white !important;
    color: black !important;
    font-size: 10.5pt !important;
  }

  .popmusic-contract-container {
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
    box-shadow: none !important;
    background: transparent !important;
  }

  .contract-page {
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    box-shadow: none !important;
    max-width: 100% !important;
    width: 100% !important;
  }
}
</style>
