import type { PopMusicContractData } from '~/components/contratos/PopMusicContractDocument.vue'
import { calculateContractTotals, isMinorOn } from './businessRules'

const UNIDADES = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove']
const DEZ_A_DEZENOVE = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
const DEZENAS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
const CENTENAS = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']

const MESES_EXTENSO = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
]

export function numeroIntPorExtenso(n: number): string {
  if (n === 0) return 'zero'
  if (n === 100) return 'cem'
  if (n < 0) return 'menos ' + numeroIntPorExtenso(Math.abs(n))

  const partes: string[] = []

  // Milhares
  if (n >= 1000) {
    const milhares = Math.floor(n / 1000)
    n = n % 1000
    if (milhares === 1) {
      partes.push('mil')
    } else {
      partes.push(numeroIntPorExtenso(milhares) + ' mil')
    }
  }

  // Centenas
  if (n >= 100) {
    if (n === 100) {
      partes.push('cem')
      n = 0
    } else {
      const c = Math.floor(n / 100)
      partes.push(CENTENAS[c] ?? '')
      n = n % 100
    }
  }

  // Dezenas e Unidades
  if (n >= 10 && n <= 19) {
    partes.push(DEZ_A_DEZENOVE[n - 10] ?? '')
    n = 0
  } else if (n >= 20) {
    const d = Math.floor(n / 10)
    partes.push(DEZENAS[d] ?? '')
    n = n % 10
  }

  if (n > 0 && n < 10) {
    partes.push(UNIDADES[n] ?? '')
  }

  return partes.join(' e ')
}

export function valorMonetarioPorExtenso(valor: number): string {
  const inteiro = Math.floor(valor)
  const centavos = Math.round((valor - inteiro) * 100)

  let resultado = ''
  if (inteiro > 0) {
    const extensoInt = numeroIntPorExtenso(inteiro)
    resultado += extensoInt + (inteiro === 1 ? ' real' : ' reais')
  }

  if (centavos > 0) {
    const extensoCent = numeroIntPorExtenso(centavos)
    if (resultado.length > 0) resultado += ' e '
    resultado += extensoCent + (centavos === 1 ? ' centavo' : ' centavos')
  }

  return resultado || 'zero reais'
}

export function formatCPF(cpf?: string | null): string {
  if (!cpf) return ''
  const clean = cpf.replace(/\D/g, '')
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  return cpf
}

export function formatPhone(phone?: string | null): string {
  if (!phone) return ''
  const clean = phone.replace(/\D/g, '')
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return phone
}

export function formatDateBR(dateInput?: string | Date | null): string {
  if (!dateInput) return ''
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Converte os dados brutos de aluno e contrato do Supabase no formato
 * estruturado exigido pelo documento de contrato oficial Pop Music
 */
export function buildPopMusicContractData(aluno: any, contrato: any, turmasList?: any[]): PopMusicContractData {
  const menorPelaData = aluno?.data_nascimento ? isMinorOn(String(aluno.data_nascimento)) : null
  const isMenor = menorPelaData ?? !!aluno?.responsavel_nome
  
  // Contratante (Responsável se menor, ou o próprio aluno)
  const nomeContratante = isMenor 
    ? (aluno.responsavel_nome || aluno.nome_responsavel || '') 
    : (aluno?.nome || '')
    
  const cpfContratante = formatCPF(isMenor 
    ? (aluno.responsavel_cpf || aluno.cpf_responsavel || '') 
    : (aluno?.cpf || ''))
    
  const telContratante = formatPhone(isMenor 
    ? (aluno.responsavel_telefone || aluno.telefone_responsavel || aluno.telefone || '') 
    : (aluno?.telefone || ''))

  // Endereço
  const enderecoCompleto = aluno?.endereco || ''
  const bairro = aluno?.bairro || ''
  const cidade = aluno?.cidade || ''
  const uf = aluno?.uf || ''
  const cep = aluno?.cep || ''

  // Aluno
  const nomeAluno = aluno?.nome || ''
  const cpfAluno = formatCPF(aluno?.cpf || '')
  const dataNascimentoAluno = aluno?.data_nascimento ? formatDateBR(aluno.data_nascimento) : ''
  const dataNascimentoContratante = isMenor ? '' : dataNascimentoAluno

  // Curso e Horários
  let cursoNome = 'Música'
  let diasSemana = 'A combinar'
  let horarioInicio = '14:00'
  let horarioFim = '15:00'

  if (turmasList && turmasList.length > 0) {
    const nomes = [...new Set(turmasList.map(t => t.modalidades?.nome || t.nome).filter(Boolean))]
    if (nomes.length > 0) cursoNome = nomes.join(', ')

    const diasNomes = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
    const horarios = turmasList.map(t => ({
      dia: t.dia_semana !== undefined ? (diasNomes[Number(t.dia_semana)] || 'Semanal') : 'Semanal',
      inicio: t.horario_inicio?.substring(0, 5) || '',
      fim: t.horario_fim?.substring(0, 5) || ''
    }))
    diasSemana = horarios.map(h => h.dia).join(', ')
    horarioInicio = horarios.map(h => h.inicio).filter(Boolean).join(', ') || ''
    horarioFim = horarios.map(h => h.fim).filter(Boolean).join(', ') || ''
  }

  // Valores e Parcelas
  const valorMensalidadeNum = Number(contrato?.valor_mensalidade) || 180
  const { installments: numParcelas, total: valorTotalNum } = calculateContractTotals(valorMensalidadeNum)

  const valorMensalidadeStr = valorMensalidadeNum.toFixed(2).replace('.', ',')
  const valorMensalidadeExtenso = valorMonetarioPorExtenso(valorMensalidadeNum)

  const valorTotalStr = valorTotalNum.toFixed(2).replace('.', ',')
  const valorTotalExtenso = valorMonetarioPorExtenso(valorTotalNum)

  const numParcelasStr = String(numParcelas)
  const numParcelasExtenso = numeroIntPorExtenso(numParcelas)

  // Datas
  const referenceDate = new Date(contrato?.data_inicio_vigencia || contrato?.data_envio || Date.now())
  const diaVencimento = String(contrato?.dia_vencimento || 10)
  
  const diaAtual = String(referenceDate.getDate()).padStart(2, '0')
  const mesAtual = MESES_EXTENSO[referenceDate.getMonth()] ?? ''
  const anoAtual = String(referenceDate.getFullYear()).slice(-2)
  const anoVigencia = String(referenceDate.getFullYear())

  return {
    nome_contratante: nomeContratante,
    cpf_contratante: cpfContratante,
    endereco_contratante: enderecoCompleto,
    bairro_contratante: bairro,
    cidade_contratante: cidade,
    uf_contratante: uf,
    telefone_contratante: telContratante,
    cep_contratante: cep,
    data_nascimento_contratante: dataNascimentoContratante,

    nome_aluno: nomeAluno,
    data_nascimento_aluno: dataNascimentoAluno,
    cpf_aluno: cpfAluno,
    curso: cursoNome,

    dias_semana: diasSemana,
    horario_inicio: horarioInicio,
    horario_fim: horarioFim,

    valor_total: valorTotalStr,
    valor_total_extenso: valorTotalExtenso,
    numero_parcelas: numParcelasStr,
    numero_parcelas_extenso: numParcelasExtenso,
    valor_mensalidade: valorMensalidadeStr,
    valor_mensalidade_extenso: valorMensalidadeExtenso,

    dia_primeira_parcela: diaVencimento.padStart(2, '0'),
    mes_primeira_parcela: mesAtual,
    ano_primeira_parcela: anoAtual,
    dia_vencimento: diaVencimento,

    ano_vigencia: anoVigencia,
    data_dia: diaAtual,
    data_mes: mesAtual,
    data_ano: anoAtual
  }
}
