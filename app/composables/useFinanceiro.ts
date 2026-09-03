import { ref, computed } from 'vue'

export type ChargeStatus = 'pendente' | 'paga' | 'atrasada' | 'cancelada'
export type CashflowType = 'entrada' | 'saida'

export interface Charge {
  id: string
  studentId: string
  studentName: string
  description: string
  amount: number
  dueDate: string
  status: ChargeStatus
  paidAt?: string
  paymentMethod?: string
  cancelReason?: string
}

export interface Receipt {
  id: string
  chargeId: string
  studentName: string
  studentCpf?: string
  studentPhone?: string
  amount: number
  paidAt: string
  paymentMethod: string
  description?: string
  refunded?: boolean
  refundReason?: string
}

export interface TeacherCommission {
  studentName: string
  classesGiven: number
  amountPerClass: number
  total: number
  type: 'percentual' | 'fixo'
  value: number
}

export interface Teacher {
  id: string
  name: string
  totalToReceive: number
  totalPaid: number
  students: TeacherCommission[]
}

export interface CashflowEntry {
  id: string
  date: string
  description: string
  type: CashflowType
  account: string
  accountId?: string
  amount: number
  category?: string
  isAuto: boolean
  autoSource?: string
}

export interface FinancialAccount {
  id: string
  nome: string
  tipo: string
  saldo_inicial: number
  saldoAtual?: number
}

export interface FinancialSummary {
  aReceberMes: number
  recebidoMes: number
  emAtraso: number
  saldoCaixa: number
  referencia: string
}

// Estados Reativos Globais
const charges = ref<Charge[]>([])
const receipts = ref<Receipt[]>([])
const teachers = ref<Teacher[]>([])
const cashflow = ref<CashflowEntry[]>([])
const accounts = ref<FinancialAccount[]>([])
const isLoading = ref(false)
const financialSummary = ref<FinancialSummary | null>(null)

export const useFinanceiro = () => {
  const supabase = useSupabaseClient()

  // 1. Buscar Cobranças
  const fetchCharges = async () => {
    isLoading.value = true
    try {
      const { data, error } = await supabase
        .from('cobrancas')
        .select(`
          id,
          aluno_id,
          descricao,
          valor,
          vencimento,
          status,
          forma_pagamento,
          data_pagamento,
          motivo_cancelamento,
          alunos (id, nome)
        `)
        .order('vencimento', { ascending: true })

      if (error) throw error

      if (data) {
        const todayStr = new Date().toISOString().slice(0, 10)

        charges.value = data.map((c: any) => {
          let status: ChargeStatus = c.status || 'pendente'
          
          // Se estiver pendente e o vencimento já passou de hoje -> 'atrasada'
          if (status === 'pendente' && c.vencimento && c.vencimento < todayStr) {
            status = 'atrasada'
          }

          return {
            id: c.id,
            studentId: c.aluno_id,
            studentName: c.alunos?.nome || 'Aluno Desconhecido',
            description: c.descricao || 'Mensalidade',
            amount: Number(c.valor) || 0,
            dueDate: c.vencimento,
            status,
            paidAt: c.data_pagamento,
            paymentMethod: c.forma_pagamento,
            cancelReason: c.motivo_cancelamento
          }
        })
      }
    } catch (e) {
      console.error('Erro ao buscar cobranças:', e)
    } finally {
      isLoading.value = false
    }
  }

  // 2. Buscar Recibos (Derivados das cobranças pagas)
  const fetchReceipts = async () => {
    try {
      const { data, error } = await supabase
        .from('recibos')
        .select(`
          id,
          cobranca_id,
          enviado_em,
          cobrancas (
            id,
            valor,
            data_pagamento,
            forma_pagamento,
            descricao,
            status,
            motivo_cancelamento,
            alunos (id, nome, cpf, telefone)
          )
        `)
        .order('enviado_em', { ascending: false })

      if (error) throw error

      if (data) {
        receipts.value = data.map((r: any) => {
          const c = Array.isArray(r.cobrancas) ? r.cobrancas[0] : r.cobrancas
          const aluno = Array.isArray(c?.alunos) ? c.alunos[0] : c?.alunos
          const refunded = c?.status === 'cancelada' && String(c?.motivo_cancelamento || '').startsWith('Estorno:')
          return {
            id: `REC-${r.id.substring(0, 8).toUpperCase()}`,
            chargeId: r.cobranca_id,
            studentName: aluno?.nome || 'Aluno',
            studentCpf: aluno?.cpf || '',
            studentPhone: aluno?.telefone || '',
            amount: Number(c?.valor) || 0,
            paidAt: c?.data_pagamento || r.enviado_em?.slice(0, 10) || new Date().toISOString().slice(0, 10),
            paymentMethod: c?.forma_pagamento ? c.forma_pagamento.toUpperCase() : 'PIX',
            description: c?.descricao || 'Mensalidade Pop Music',
            refunded,
            refundReason: refunded ? String(c.motivo_cancelamento).replace(/^Estorno:\s*/, '') : undefined
          }
        })
      }
    } catch (e) {
      console.error('Erro ao buscar recibos:', e)
    }
  }

  // 3. Buscar Contas Financeiras
  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('contas_financeiras')
        .select('*')
        .eq('ativo', true)
        .order('nome')

      if (error) throw error
      if (data && data.length > 0) {
        accounts.value = data.map((acc: any) => ({
          id: acc.id,
          nome: acc.nome,
          tipo: acc.tipo,
          saldo_inicial: Number(acc.saldo_inicial) || 0
        }))
      } else accounts.value = []
    } catch (e) {
      console.error('Erro ao buscar contas:', e)
    }
  }

  // 4. Buscar Fluxo de Caixa
  const fetchCashflow = async () => {
    try {
      const { data, error } = await supabase
        .from('fluxo_caixa')
        .select(`
          id,
          tipo,
          descricao,
          valor,
          data,
          conta_id,
          categoria,
          origem,
          contas_financeiras (nome)
        `)
        .order('data', { ascending: false })

      if (error) throw error

      if (data) {
        cashflow.value = data.map((cf: any) => ({
          id: cf.id,
          date: cf.data,
          description: cf.descricao,
          type: cf.tipo,
          account: cf.contas_financeiras?.nome || 'Conta Principal',
          accountId: cf.conta_id,
          amount: Number(cf.valor) || 0,
          category: cf.categoria || (cf.tipo === 'entrada' ? 'Mensalidade' : 'Despesa'),
          isAuto: cf.origem !== 'manual',
          autoSource: cf.origem === 'automatico' ? 'Lançamento automático do sistema' : undefined
        }))
      }
    } catch (e) {
      console.error('Erro ao buscar fluxo de caixa:', e)
    }
  }

  const fetchFinancialSummary = async (reference = new Date().toISOString().slice(0, 10)) => {
    const { data, error } = await (supabase as any).rpc('obter_resumo_financeiro', {
      p_referencia: reference
    })
    if (error) {
      console.warn('Resumo financeiro do banco ainda indisponível:', error)
      financialSummary.value = null
      return
    }
    financialSummary.value = {
      aReceberMes: Number(data?.a_receber_mes) || 0,
      recebidoMes: Number(data?.recebido_mes) || 0,
      emAtraso: Number(data?.em_atraso) || 0,
      saldoCaixa: Number(data?.saldo_caixa) || 0,
      referencia: data?.referencia || reference
    }
  }

  // 5. Buscar Professores e Calcular Comissões / Repasses
  const fetchTeachersLegacy = async () => {
    try {
      // 1. Buscar professores
      const { data: profs, error: profError } = await supabase
        .from('professores')
        .select('*')
        .eq('ativo', true)
        .order('nome')

      if (profError) throw profError

      // 2. Buscar turmas dos professores com matrículas ativas
      const { data: turmas } = await supabase
        .from('turmas')
        .select(`
          id,
          professor_id,
          dia_semana,
          modalidades (nome, valor_padrao_mensalidade),
          matriculas_turma (
            id,
            status,
            aluno_id,
            alunos (id, nome, status)
          )
        `)

      // 3. Buscar presenças do mês atual para calcular comissões reais por aula
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
      const { data: presencas } = await supabase
        .from('presencas')
        .select(`
          id,
          aluno_id,
          turma_id,
          status,
          turmas (
            professor_id,
            modalidades (valor_padrao_mensalidade)
          ),
          alunos (nome)
        `)
        .gte('data_aula', startOfMonth)
        .eq('status', 'presente')

      // 4. Buscar repasses já pagos no mês
      const { data: repassesPagos } = await supabase
        .from('repasses_professor')
        .select('*')
        .gte('mes_referencia', startOfMonth)
        .eq('status', 'pago')

      if (profs) {
        teachers.value = profs.map((prof: any) => {
          // Filtra turmas e presenças deste professor
          const profTurmas = (turmas || []).filter((t: any) => t.professor_id === prof.id)
          const profPresencas = (presencas || []).filter((p: any) => p.turmas?.professor_id === prof.id)
          
          const comissaoTipo = prof.comissao_padrao_tipo || 'percentual'
          const comissaoValor = Number(prof.comissao_padrao_valor) || 50

          // Agrupa por aluno
          const alunoMap: Record<string, { studentName: string, count: number, valorMensal: number }> = {}

          // 1º Adiciona alunos matriculados nas turmas ativas do professor (padrão 4 aulas no mês)
          profTurmas.forEach((t: any) => {
            const valMensal = Number(t.modalidades?.valor_padrao_mensalidade) || 180
            if (t.matriculas_turma && Array.isArray(t.matriculas_turma)) {
              t.matriculas_turma.forEach((m: any) => {
                if (m.status === 'ativa' && m.alunos) {
                  const aId = m.alunos.id
                  const aNome = m.alunos.nome
                  if (!alunoMap[aId]) {
                    alunoMap[aId] = { studentName: aNome, count: 4, valorMensal: valMensal }
                  }
                }
              })
            }
          })

          // 2º Se houver presenças registradas, ajusta a contagem de aulas
          const presencasPorAluno: Record<string, number> = {}
          profPresencas.forEach((p: any) => {
            const aId = p.aluno_id
            presencasPorAluno[aId] = (presencasPorAluno[aId] || 0) + 1
          })

          Object.keys(presencasPorAluno).forEach(aId => {
            if (alunoMap[aId]) {
              // Se há presenças registradas no mês, usa a contagem exata
              alunoMap[aId].count = Math.max(presencasPorAluno[aId] ?? 0, alunoMap[aId].count)
            }
          })

          const studentsList: TeacherCommission[] = Object.values(alunoMap).map(item => {
            const valorAula = item.count > 0 ? (item.valorMensal / 4) : 0
            const repassePorAula = comissaoTipo === 'percentual' ? (valorAula * (comissaoValor / 100)) : comissaoValor
            const totalRepasse = repassePorAula * item.count

            return {
              studentName: item.studentName,
              classesGiven: item.count,
              amountPerClass: repassePorAula,
              total: totalRepasse,
              type: comissaoTipo,
              value: comissaoValor
            }
          })

          const totalCalculado = studentsList.reduce((acc, curr) => acc + curr.total, 0)
          
          const pagoNoMes = (repassesPagos || [])
            .filter((r: any) => r.professor_id === prof.id)
            .reduce((acc: number, curr: any) => acc + Number(curr.valor_total || 0), 0)

          const totalToReceive = Math.max(0, totalCalculado - pagoNoMes)

          return {
            id: prof.id,
            name: prof.nome,
            totalToReceive: totalToReceive,
            totalPaid: pagoNoMes,
            students: studentsList
          }
        })
      }
    } catch (e) {
      console.error('Erro ao buscar professores e comissões:', e)
    }
  }

  // --- Ações de Integração Automatizada ---

  // Helper para mapear forma de pagamento para enum do banco: ["pix", "dinheiro", "cartao", "transferencia", "boleto"]
  const fetchTeachers = async () => {
    try {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
      const { data: profs, error: profError } = await supabase
        .from('professores')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome')
      if (profError) throw profError

      const { data: paidRows, error: paidError } = await supabase
        .from('repasses_professor')
        .select('professor_id, valor_total')
        .eq('mes_referencia', startOfMonth)
        .eq('status', 'pago')
      if (paidError) throw paidError

      teachers.value = await Promise.all((profs || []).map(async (prof: any) => {
        const { data: calculation, error } = await (supabase as any).rpc('calcular_repasse_professor', {
          p_professor_id: prof.id,
          p_mes: startOfMonth
        })
        if (error) throw error

        const paid = (paidRows || [])
          .filter((row: any) => row.professor_id === prof.id)
          .reduce((sum: number, row: any) => sum + Number(row.valor_total || 0), 0)
        const students: TeacherCommission[] = (calculation || []).map((item: any) => ({
          studentName: `${item.aluno_nome} — ${item.modalidade_nome}`,
          classesGiven: Number(item.aulas_finalizadas || 0),
          amountPerClass: Number(item.valor_repasse || 0),
          total: Number(item.valor_repasse || 0),
          type: item.tipo_comissao === 'valor_fixo' ? 'fixo' : 'percentual',
          value: Number(item.valor_configurado || 0)
        }))
        const calculated = students.reduce((sum, item) => sum + item.total, 0)

        return {
          id: prof.id,
          name: prof.nome,
          totalToReceive: paid > 0 ? 0 : calculated,
          totalPaid: paid,
          students
        }
      }))
    } catch (error) {
      console.error('Erro ao calcular repasses:', error)
      teachers.value = []
    }
  }

  const normalizePaymentMethod = (method: string): 'pix' | 'dinheiro' | 'cartao' | 'transferencia' | 'boleto' => {
    const m = (method || '').toLowerCase()
    if (m.includes('dinh')) return 'dinheiro'
    if (m.includes('cart')) return 'cartao'
    if (m.includes('transf')) return 'transferencia'
    if (m.includes('bol')) return 'boleto'
    return 'pix'
  }

  // Ao marcar uma cobrança como paga: atualiza cobrança e lança entrada no fluxo de caixa
  const payChargeLegacy = async (
    chargeId: string, 
    paymentMethod: string, 
    accountName: string, 
    paidDate: string = new Date().toISOString().slice(0, 10)
  ) => {
    const charge = charges.value.find(c => c.id === chargeId)
    if (!charge) return

    const formaPagamento = normalizePaymentMethod(paymentMethod)

    try {
      // 1. Atualiza cobrança para 'paga'
      const { error: updateErr } = await supabase.from('cobrancas').update({
        status: 'paga',
        forma_pagamento: formaPagamento,
        data_pagamento: paidDate
      } as any).eq('id', chargeId)

      if (updateErr) {
        console.error('Erro ao atualizar cobrança:', updateErr)
        throw updateErr
      }

      // 2. Busca id da conta financeira válida
      let contaId = accounts.value.find(a => a.nome === accountName || a.id === accountName)?.id
      if (!contaId && accounts.value.length > 0) {
        contaId = accounts.value[0]?.id
      }

      // 3. Se houver conta registrada, lança Entrada no Fluxo de Caixa (origem: 'automatico')
      if (contaId && !contaId.startsWith('default-')) {
        try {
          await supabase.from('fluxo_caixa').insert({
            tipo: 'entrada',
            descricao: `Mensalidade - ${charge.studentName}`,
            valor: charge.amount,
            data: paidDate,
            conta_id: contaId,
            categoria: 'Mensalidade',
            origem: 'automatico',
            origem_tipo: 'cobranca',
            origem_id: chargeId
          })
        } catch (caixaErr) {
          console.warn('Aviso ao lançar no caixa:', caixaErr)
        }
      }

      // Recarrega todos os dados atualizados
      await Promise.all([fetchCharges(), fetchReceipts(), fetchCashflow()])
    } catch (e) {
      console.error('Erro ao pagar cobrança:', e)
      throw e
    }
  }

  // Ao cancelar uma cobrança
  const payCharge = async (
    chargeId: string,
    paymentMethod: string,
    accountId: string,
    paidDate: string = new Date().toISOString().slice(0, 10),
    observation: string = ''
  ) => {
    if (!accountId) throw new Error('Selecione a conta que recebeu o pagamento.')
    const { error } = await (supabase as any).rpc('registrar_pagamento_manual', {
      p_cobranca_id: chargeId,
      p_forma_pagamento: normalizePaymentMethod(paymentMethod),
      p_data_pagamento: paidDate,
      p_conta_id: accountId,
      p_observacao: observation || null
    })
    if (error) throw error
    await Promise.all([fetchCharges(), fetchReceipts(), fetchCashflow(), fetchFinancialSummary()])
  }

  const cancelCharge = async (chargeId: string, reason: string) => {
    try {
      const { error } = await (supabase as any).rpc('cancelar_cobranca_aberta', {
        p_cobranca_id: chargeId,
        p_motivo: reason
      })

      if (error) throw error
      await fetchCharges()
    } catch (e) {
      console.error('Erro ao cancelar cobrança:', e)
      throw e
    }
  }

  const refundCharge = async (
    chargeId: string,
    accountId: string,
    refundedAt: string,
    reason: string
  ) => {
    if (!accountId) throw new Error('Selecione a conta usada para devolver o pagamento.')
    const { error } = await (supabase as any).rpc('estornar_pagamento_manual', {
      p_cobranca_id: chargeId,
      p_conta_id: accountId,
      p_data_estorno: refundedAt,
      p_motivo: reason
    })
    if (error) throw error
    await Promise.all([fetchCharges(), fetchReceipts(), fetchCashflow(), fetchFinancialSummary()])
  }

  // Ao pagar um professor: grava repasse e gera saída no fluxo de caixa
  const payTeacherLegacy = async (
    teacherId: string, 
    amount: number, 
    accountName: string, 
    paymentMethod: string, 
    paidDate: string = new Date().toISOString().slice(0, 10)
  ) => {
    const teacher = teachers.value.find(t => t.id === teacherId)
    if (!teacher) return

    const formaPagamento = normalizePaymentMethod(paymentMethod)

    try {
      let contaId = accounts.value.find(a => a.nome === accountName || a.id === accountName)?.id
      if (!contaId && accounts.value.length > 0) {
        contaId = accounts.value[0]?.id
      }

      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

      // 1. Insere Repasse
      let repasseId: string | null = null
      try {
        const { data: repasse } = await supabase.from('repasses_professor').insert({
          professor_id: teacherId,
          mes_referencia: startOfMonth,
          status: 'pago',
          forma_pagamento: formaPagamento,
          data_pagamento: paidDate,
          conta_financeira_id: (contaId && !contaId.startsWith('default-')) ? contaId : null,
          valor_total: amount
        } as any).select().single()
        if (repasse) repasseId = repasse.id
      } catch (repErr) {
        console.warn('Aviso ao registrar repasse:', repErr)
      }

      // 2. Lança Saída no Fluxo de Caixa
      if (contaId && !contaId.startsWith('default-')) {
        try {
          await supabase.from('fluxo_caixa').insert({
            tipo: 'saida',
            descricao: `Pagamento Professor(a) ${teacher.name}`,
            valor: amount,
            data: paidDate,
            conta_id: contaId,
            categoria: 'Repasse Professores',
            origem: 'automatico',
            origem_tipo: 'repasse',
            origem_id: repasseId
          })
        } catch (caixaErr) {
          console.warn('Aviso ao lançar saída no caixa:', caixaErr)
        }
      }

      await Promise.all([fetchTeachers(), fetchCashflow()])
    } catch (e) {
      console.error('Erro ao pagar professor:', e)
      throw e
    }
  }

  // Inserir Lançamento Manual no Fluxo de Caixa
  const payTeacher = async (
    teacherId: string,
    amount: number,
    accountName: string,
    paymentMethod: string,
    paidDate: string = new Date().toISOString().slice(0, 10)
  ) => {
    const accountId = accounts.value.find(account => account.nome === accountName || account.id === accountName)?.id
    if (!accountId || accountId.startsWith('default-')) {
      throw new Error('Selecione uma conta financeira cadastrada antes de pagar o repasse.')
    }
    if (amount <= 0) throw new Error('Não há valor elegível para pagamento.')

    const month = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
    const { error } = await (supabase as any).rpc('pagar_repasse_professor', {
      p_professor_id: teacherId,
      p_mes: month,
      p_conta_id: accountId,
      p_forma_pagamento: normalizePaymentMethod(paymentMethod),
      p_data_pagamento: paidDate
    })
    if (error) throw error
    await Promise.all([fetchTeachers(), fetchCashflow()])
  }

  const addCashflowEntry = async (entry: {
    tipo: CashflowType
    descricao: string
    valor: number
    data: string
    conta_id: string
    categoria?: string
  }) => {
    try {
      await supabase.from('fluxo_caixa').insert({
        tipo: entry.tipo,
        descricao: entry.descricao,
        valor: entry.valor,
        data: entry.data,
        conta_id: entry.conta_id,
        categoria: entry.categoria || (entry.tipo === 'entrada' ? 'Receita Diversa' : 'Despesa'),
        origem: 'manual'
      })

      await fetchCashflow()
    } catch (e) {
      console.error('Erro ao lançar entrada no caixa:', e)
    }
  }

  // Criar Nova Cobrança Avulsa
  const createCharge = async (data: {
    aluno_id: string
    descricao: string
    valor: number
    vencimento: string
  }) => {
    try {
      await supabase.from('cobrancas').insert({
        aluno_id: data.aluno_id,
        descricao: data.descricao,
        valor: data.valor,
        vencimento: data.vencimento,
        status: 'pendente'
      })

      await fetchCharges()
    } catch (e) {
      console.error('Erro ao criar cobrança:', e)
    }
  }

  return {
    charges,
    receipts,
    teachers,
    cashflow,
    accounts,
    isLoading,
    financialSummary,
    fetchCharges,
    fetchReceipts,
    fetchAccounts,
    fetchCashflow,
    fetchFinancialSummary,
    fetchTeachers,
    payCharge,
    cancelCharge,
    refundCharge,
    payTeacher,
    addCashflowEntry,
    createCharge
  }
}
