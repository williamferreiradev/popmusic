import { ref, computed } from 'vue'

export type ContractStatus = 'aguardando' | 'aceito' | 'expirado' | 'vencendo' | 'vencido' | 'cancelado' | 'renovado'

export interface Contract {
  id: string
  studentId: string
  studentName: string
  studentPhone?: string
  token: string
  sentAt: string
  acceptedAt: string | null
  expiresAt: string
  status: ContractStatus
  valor: number
  diaVencimento: number
  validityEnd?: string | null
}

const contractsList = ref<Contract[]>([])
const contractModel = ref('')
const isLoading = ref(false)

export const useContratos = () => {
  const supabase = useSupabaseClient()

  // Busca todos os contratos reais com dados dos alunos
  const fetchContracts = async () => {
    isLoading.value = true
    try {
      const { data, error } = await supabase
        .from('contratos')
        .select(`
          id,
          aluno_id,
          token,
          token_expira_em,
          data_envio,
          data_aceite,
          data_fim_vigencia,
          status,
          valor_mensalidade,
          dia_vencimento,
          alunos (id, nome, telefone)
        `)
        .order('criado_em', { ascending: false })

      if (error) throw error

      if (data) {
        contractsList.value = data.map((c: any) => {
          let status: ContractStatus = (c.status === 'aguardando_assinatura' || c.status === 'aguardando') ? 'aguardando' : c.status
          
          // Se estiver aguardando mas expirou o token
          if (status === 'aguardando' && c.token_expira_em) {
            if (new Date(c.token_expira_em).getTime() < Date.now()) {
              status = 'expirado'
            }
          }

          // Se estiver aceito, verificar proximidade do fim da vigência
          if (status === 'aceito' && c.data_fim_vigencia) {
            const diffDays = (new Date(c.data_fim_vigencia).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            if (diffDays <= 0) {
              status = 'vencido'
            } else if (diffDays <= 30) {
              status = 'vencendo'
            }
          }

          return {
            id: c.id,
            studentId: c.aluno_id,
            studentName: c.alunos?.nome || 'Aluno Sem Nome',
            studentPhone: c.alunos?.telefone || '',
            token: c.token,
            sentAt: c.data_envio || c.token_expira_em,
            acceptedAt: c.data_aceite,
            expiresAt: c.token_expira_em,
            status,
            valor: Number(c.valor_mensalidade) || 0,
            diaVencimento: c.dia_vencimento || 10,
            validityEnd: c.data_fim_vigencia
          }
        })
      }
    } catch (e) {
      console.error('Erro ao buscar contratos:', e)
    } finally {
      isLoading.value = false
    }
  }

  // Modelo padrão oficial Pop Music
  const defaultPopMusicModel = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS
Contrato de prestação de serviços estabelecido entre duas partes.

CONTRATANTE:
Nome da Contratante: {{nome_contratante}} CPF: {{cpf_contratante}}
Endereço: {{endereco_contratante}} Bairro: {{bairro_contratante}} Cidade: {{cidade_contratante}} UF: {{uf_contratante}}
Telefones: {{telefone_contratante}} CEP: {{cep_contratante}} D.N: {{data_nascimento_contratante}}

DADOS DO ALUNO
Nome: {{nome_aluno}} D.N: {{data_nascimento_aluno}} CPF: {{cpf_aluno}} Curso: {{curso}}

Por este instrumento particular de contrato, e na melhor forma de direito, entre as partes, justas e avençadas, de um lado o (a) CONTRATANTE, acima identificado, e de outro a Academia de Música POP MUSIC, com sede na Q.498 Casa 08 B Pedregal, Novo Gama -GO. Fica contratado por si e se obrigam mutuamente, a respeitar e cumprir o que se segue:

DO OBJETO DO CONTRATO
CLÁUSULA 1ª. O objeto do presente instrumento é a prestação, pela CONTRATADA, em favor do CONTRATANTE, dos serviços de ensino da música (CNAE 8592-9/03), por meio de aulas de música.

DAS OBRIGAÇÕES DA CONTRATADA
Parágrafo 1º. O curso básico tem duração de um ano, podendo ter um tempo indeterminado por se tratar do interesse e coordenação do aluno, podendo ser cancelado após o sexto mês ou prorrogado por mais 06 meses. O não comparecimento do aluno às aulas estabelecidas conforme esta cláusula, não o exime do pagamento a mensalidade.
Parágrafo 2º. As aulas serão individuais ou em grupo, a depender da grade de horário da Contratada. Serão ministradas 1x por semana, com duração de 60 minutos e agendas no ato da matrícula conforme interesse do aluno e disponibilidade do professor, sendo dia e horário fixo semanal ou por escala a depender da disponibilidade de ambos os envolvidos.
Parágrafo 3º. Caso o aluno desista, a qualquer tempo, ou por qualquer motivo não haverá devolução de dinheiro.
Parágrafo 4º O curso será ministrado no seguinte dia: {{dias_semana}}, DAS {{horario_inicio}} ÀS {{horario_fim}} HS. Podendo haver alterações mediante a disponibilização da contratada.
Parágrafo 5º. A contratada tem sua proposta de ensino orientada de acordo com seu Regimento Musical que tem por finalidade a inicialização e desenvolvimento musical do aluno.

DAS OBRIGAÇÕES DA CONTRATANTE
CLÁUSULA 2ª. É obrigação do CONTRATANTE comunicar, com antecedência mínima de 2 (duas horas), a impossibilidade de comparecer à aula previamente agendada, caso contrário, computar-se-á a aula no pacote do (a) CONTRATANTE, salvo nos casos de enfermidade ou internação hospitalar, devidamente comprovadas por atestado médico.
Parágrafo 1º Aulas fora do período programado, solicitadas pelo aluno, terão custo extra de R$ 50,00 (cinquenta reais) ao mesmo.
Parágrafo 2º. Em períodos de recesso (natal e ano novo) o contratante não será isento do pagamento das parcelas vincendas ou vencidas do plano contratual financeiro à contratada.
Parágrafo 3º. O não comparecimento do aluno às aulas mensais estabelecidas não o exime do pagamento.
Parágrafo 4º. Haverá reposição de aulas somente mediante atestado médico ou caso o professor falte. Não haverá reposição em feriados nacionais e municipais.

DO PAGAMENTO
CLÁUSULA 3ª. Em contrapartida aos serviços prestados, o(a) CONTRATANTE pagará em favor da CONTRATADA o valor certo e ajustado de R$ {{valor_total}} ({{valor_total_extenso}}) os quais serão pagos em {{numero_parcelas}} ({{numero_parcelas_extenso}}) iguais e sucessivas de R$ {{valor_mensalidade}} ({{valor_mensalidade_extenso}}), sendo que a primeira vencerá no dia {{dia_primeira_parcela}} de {{mes_primeira_parcela}} de 20{{ano_primeira_parcela}}, sendo que a primeira será quitada no momento da assinatura deste contrato. As seguintes terão vencimento no dia {{dia_vencimento}} de cada mês. Os pagamentos poderão ser efetuados por meio de boleto bancário, pix, ou cartão de crédito ou débito ou transferência bancária.

Parágrafo 1º. Caso o pagamento seja efetuado após a data de vencimento, importará na cobrança de multa de R$ 5,00 (cinco reais) sobre o valor bruto da prestação em atraso e juros de 0,20 (vinte centavos) ao dia.
Parágrafo 2º. Será cobrada à parte a 2ª Via do Carnê, no valor de 30,00, caso haja extravio por parte do aluno.
Parágrafo 3º Reserva-se o direito à contratada, enviar lembretes via SMS, whatsapp ou email sobre parcelas em aberto ou a vencer até 3 dias antecedentes ao vencimento. Após o vencimento, a CONTRATADA poderá realizar cobranças à contratante, via email, SMS ou Whatsapp.
Parágrafo 4º A CONTRATADA se reserva o direito de cancelar o presente contrato e matrícula, e ainda, sobretudo, na falta de pagamento por mais de 30 dias implicará no desligamento do aluno na grade de horário, sendo que a dívida permanece até que seja efetuado o pagamento da mesma.

CLÁUSULA 4ª. Pelo presente instrumento, o (a) CONTRATANTE cede em favor da CONTRATADA os direitos de utilização de sua imagem e voz em eventos e divulgação da mesma.

DA RESCISÃO
Cláusula 5ª. O presente contrato será rescindido caso uma das partes descumpra o pactuado nas cláusulas deste instrumento.
Cláusula 6ª. Caso ocorra algum impedimento à realização do evento, ligado a caso fortuito ou a força maior, as partes deverão pactuar outra data ou proceder à devolução dos valores vincendos do contrato e à reposição do que foi gasto nos preparativos. Na possibilidade, as partes deverão informar a rescisão do contrato com no mínimo 30 dias de antecedência.

DA MULTA
Cláusula 7ª. A parte que der causa à rescisão do presente pagará multa de R$ 50% (cinquenta por cento) do valor restante ao término do contrato.
Cláusula 8ª As partes elegem o Fórum da Comarca de Novo Gama, como único competente para dirimir toda e qualquer dúvida, controvérsia e litígio, decorrente do exato cumprimento deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja ou venha a ser.

PARÁGRAFO ÚNICO: O Presente contrato terá validade exclusivamente para o ano de {{ano_vigencia}} ou ao término estabelecido de 01 ano deste contrato.

E assim, por estarem justas e contratadas, as partes assinam o presente em duas (02) vias de igual teor, valor e forma, após lido e achado conforme.

Novo Gama, {{data_dia}} de {{data_mes}} de 20{{data_ano}}.

Academia de Música Pop Music (Contratada)
Nome: {{nome_contratante}} (Contratante)

Dados oficiais da contratada disponíveis no cadastro da escola.`

  // Busca o modelo de contrato ativo
  const fetchModel = async () => {
    try {
      const { data } = await supabase
        .from('modelos_contrato')
        .select('*')
        .eq('ativo', true)
        .order('versao', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data?.texto) {
        contractModel.value = data.texto
      } else {
        contractModel.value = defaultPopMusicModel
      }
    } catch (e) {
      console.error('Erro ao buscar modelo de contrato:', e)
      contractModel.value = defaultPopMusicModel
    }
  }

  // Salva ou cria nova versão do modelo
  const saveModel = async (newModel: string) => {
    try {
      contractModel.value = newModel
      
      // Desativa anteriores e insere nova versão
      await supabase.from('modelos_contrato').update({ ativo: false } as any).eq('ativo', true)
      await supabase.from('modelos_contrato').insert({
        texto: newModel,
        versao: Date.now(),
        ativo: true
      })
    } catch (e) {
      console.error('Erro ao salvar modelo:', e)
    }
  }

  // Retorna estatísticas baseadas na data atual vs datas do contrato
  const metrics = computed(() => {
    let aguardando = 0
    let aceitosMes = 0
    let vencendo = 0
    let totalEnviados = contractsList.value.length
    let totalAceitos = 0

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    contractsList.value.forEach(c => {
      if (c.status === 'aguardando') aguardando++
      if (c.status === 'aceito' || c.status === 'vencendo') {
        totalAceitos++
        if (c.acceptedAt) {
          const accDate = new Date(c.acceptedAt)
          if (accDate.getMonth() === currentMonth && accDate.getFullYear() === currentYear) {
            aceitosMes++
          }
        }
      }
      if (c.status === 'vencendo') vencendo++
    })

    const taxaAceite = totalEnviados > 0 ? Math.round((totalAceitos / totalEnviados) * 100) : 0

    return {
      aguardando,
      aceitosMes,
      vencendo,
      taxaAceite
    }
  })

  // Lista dos contratos aguardando há mais tempo
  const oldestPending = computed(() => {
    return contractsList.value
      .filter(c => c.status === 'aguardando')
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
      .slice(0, 5)
  })

  // Lista dos contratos próximos do vencimento
  const closestExpiring = computed(() => {
    return contractsList.value
      .filter(c => c.status === 'vencendo')
      .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())
      .slice(0, 5)
  })

  const getContractByToken = (token: string) => {
    return contractsList.value.find(c => c.token === token)
  }

  const sendContractNotification = async (result: any) => {
    const recipient = result.responsavel_email || result.aluno_email
    if (!recipient) throw new Error('Aluno ou responsável sem e-mail cadastrado.')
    await $fetch('/api/send-contract-email', {
      method: 'POST',
      body: {
        studentName: result.aluno_nome,
        studentEmail: recipient,
        guardianName: result.responsavel_nome || undefined,
        courseName: '',
        monthlyFee: result.valor_mensalidade,
        signUrl: `${window.location.origin}/assinar/${result.token}`
      }
    })
  }

  const resendLink = async (contractId: string) => {
    let tokenRegenerated = false
    try {
      const { data, error } = await (supabase as any).rpc('regenerar_token_contrato', { p_contrato_id: contractId })
      if (error) throw error
      tokenRegenerated = true
      await sendContractNotification(data)
      await fetchContracts()
      return { success: true }
    } catch (e: any) {
      console.error('Erro ao reenviar link de contrato.')
      await fetchContracts()
      return { success: false, message: tokenRegenerated
        ? 'O link foi renovado, mas o e-mail não foi enviado. Verifique a configuração do remetente.'
        : (e?.message || 'Não foi possível renovar o link do contrato.') }
    }
  }

  const renewContract = async (contractId: string, newAmount: number, newDay: number) => {
    let contractCreated = false
    try {
      const { data, error } = await (supabase as any).rpc('renovar_contrato', {
        p_contrato_id: contractId,
        p_valor_mensalidade: newAmount,
        p_dia_vencimento: newDay
      })
      if (error) throw error
      contractCreated = true
      await sendContractNotification(data)
      await fetchContracts()
      return { success: true }
    } catch (e: any) {
      console.error('Erro ao renovar contrato.')
      await fetchContracts()
      return { success: false, message: contractCreated
        ? 'O novo contrato foi criado, mas o e-mail não foi enviado. Reenvie o link após verificar o remetente.'
        : (e?.message || 'Não foi possível renovar o contrato.') }
    }
  }

  return {
    contractsList,
    contractModel,
    isLoading,
    metrics,
    oldestPending,
    closestExpiring,
    fetchContracts,
    fetchModel,
    getContractByToken,
    resendLink,
    renewContract,
    saveModel
  }
}
