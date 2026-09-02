export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alunos: {
        Row: {
          atualizado_em: string
          cessao_imagem_aceita: boolean
          cpf: string | null
          criado_em: string
          data_cancelamento: string | null
          data_inicio_trancamento: string | null
          data_matricula: string
          data_nascimento: string
          email: string | null
          emergencia_nome: string | null
          emergencia_parentesco: string | null
          emergencia_telefone: string | null
          endereco: string | null
          id: string
          motivo_cancelamento: string | null
          nome: string
          responsavel_cpf: string | null
          responsavel_email: string | null
          responsavel_nome: string | null
          responsavel_telefone: string | null
          status: Database["public"]["Enums"]["status_aluno"]
          telefone: string | null
          tipo_sanguineo: string | null
          usuario_id: string | null
        }
        Insert: {
          atualizado_em?: string
          cessao_imagem_aceita?: boolean
          cpf?: string | null
          criado_em?: string
          data_cancelamento?: string | null
          data_inicio_trancamento?: string | null
          data_matricula?: string
          data_nascimento: string
          email?: string | null
          emergencia_nome?: string | null
          emergencia_parentesco?: string | null
          emergencia_telefone?: string | null
          endereco?: string | null
          id?: string
          motivo_cancelamento?: string | null
          nome: string
          responsavel_cpf?: string | null
          responsavel_email?: string | null
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          status?: Database["public"]["Enums"]["status_aluno"]
          telefone?: string | null
          tipo_sanguineo?: string | null
          usuario_id?: string | null
        }
        Update: {
          atualizado_em?: string
          cessao_imagem_aceita?: boolean
          cpf?: string | null
          criado_em?: string
          data_cancelamento?: string | null
          data_inicio_trancamento?: string | null
          data_matricula?: string
          data_nascimento?: string
          email?: string | null
          emergencia_nome?: string | null
          emergencia_parentesco?: string | null
          emergencia_telefone?: string | null
          endereco?: string | null
          id?: string
          motivo_cancelamento?: string | null
          nome?: string
          responsavel_cpf?: string | null
          responsavel_email?: string | null
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          status?: Database["public"]["Enums"]["status_aluno"]
          telefone?: string | null
          tipo_sanguineo?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alunos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria: {
        Row: {
          acao: string
          criado_em: string
          dados_antes: Json | null
          dados_depois: Json | null
          id: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          acao: string
          criado_em?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          id?: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          criado_em?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          id?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      cobrancas: {
        Row: {
          aluno_id: string
          contrato_id: string | null
          criado_em: string
          data_pagamento: string | null
          descricao: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"] | null
          gateway_referencia: string | null
          id: string
          motivo_cancelamento: string | null
          status: Database["public"]["Enums"]["status_cobranca"]
          valor: number
          vencimento: string
        }
        Insert: {
          aluno_id: string
          contrato_id?: string | null
          criado_em?: string
          data_pagamento?: string | null
          descricao?: string
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          gateway_referencia?: string | null
          id?: string
          motivo_cancelamento?: string | null
          status?: Database["public"]["Enums"]["status_cobranca"]
          valor: number
          vencimento: string
        }
        Update: {
          aluno_id?: string
          contrato_id?: string | null
          criado_em?: string
          data_pagamento?: string | null
          descricao?: string
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          gateway_referencia?: string | null
          id?: string
          motivo_cancelamento?: string | null
          status?: Database["public"]["Enums"]["status_cobranca"]
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "cobrancas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobrancas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "vw_aluno_meu_perfil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobrancas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "vw_professor_alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobrancas_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobrancas_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "vw_aluno_meu_contrato"
            referencedColumns: ["id"]
          },
        ]
      }
      comissoes_professor_aluno: {
        Row: {
          aluno_id: string
          criado_em: string
          id: string
          professor_id: string
          tipo: Database["public"]["Enums"]["tipo_comissao"]
          valor: number
        }
        Insert: {
          aluno_id: string
          criado_em?: string
          id?: string
          professor_id: string
          tipo?: Database["public"]["Enums"]["tipo_comissao"]
          valor: number
        }
        Update: {
          aluno_id?: string
          criado_em?: string
          id?: string
          professor_id?: string
          tipo?: Database["public"]["Enums"]["tipo_comissao"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_professor_aluno_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_professor_aluno_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "vw_aluno_meu_perfil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_professor_aluno_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "vw_professor_alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_professor_aluno_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          chave: string
          valor: Json
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          chave: string
          valor: Json
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          chave?: string
          valor?: Json
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_atualizado_por_fkey"
            columns: ["atualizado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_financeiras: {
        Row: {
          ativo: boolean
          criado_em: string
          id: string
          nome: string
          saldo_inicial: number
          tipo: Database["public"]["Enums"]["tipo_conta"]
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          id?: string
          nome: string
          saldo_inicial?: number
          tipo?: Database["public"]["Enums"]["tipo_conta"]
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          id?: string
          nome?: string
          saldo_inicial?: number
          tipo?: Database["public"]["Enums"]["tipo_conta"]
        }
        Relationships: []
      }
      contratos: {
        Row: {
          aceite_hash: string | null
          aceite_ip: unknown
          aceite_user_agent: string | null
          aluno_id: string
          contrato_anterior_id: string | null
          criado_em: string
          data_aceite: string | null
          data_envio: string
          data_fim_vigencia: string | null
          data_inicio_vigencia: string | null
          dia_vencimento: number
          id: string
          modelo_contrato_id: string | null
          pdf_url: string | null
          status: Database["public"]["Enums"]["status_contrato"]
          texto_gerado: string
          token: string
          token_expira_em: string
          valor_mensalidade: number
        }
        Insert: {
          aceite_hash?: string | null
          aceite_ip?: unknown
          aceite_user_agent?: string | null
          aluno_id: string
          contrato_anterior_id?: string | null
          criado_em?: string
          data_aceite?: string | null
          data_envio?: string
          data_fim_vigencia?: string | null
          data_inicio_vigencia?: string | null
          dia_vencimento: number
          id?: string
          modelo_contrato_id?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["status_contrato"]
          texto_gerado: string
          token?: string
          token_expira_em?: string
          valor_mensalidade: number
        }
        Update: {
          aceite_hash?: string | null
          aceite_ip?: unknown
          aceite_user_agent?: string | null
          aluno_id?: string
          contrato_anterior_id?: string | null
          criado_em?: string
          data_aceite?: string | null
          data_envio?: string
          data_fim_vigencia?: string | null
          data_inicio_vigencia?: string | null
          dia_vencimento?: number
          id?: string
          modelo_contrato_id?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["status_contrato"]
          texto_gerado?: string
          token?: string
          token_expira_em?: string
          valor_mensalidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "contratos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "vw_aluno_meu_perfil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "vw_professor_alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_contrato_anterior_id_fkey"
            columns: ["contrato_anterior_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_contrato_anterior_id_fkey"
            columns: ["contrato_anterior_id"]
            isOneToOne: false
            referencedRelation: "vw_aluno_meu_contrato"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_modelo_contrato_id_fkey"
            columns: ["modelo_contrato_id"]
            isOneToOne: false
            referencedRelation: "modelos_contrato"
            referencedColumns: ["id"]
          },
        ]
      }
      feriados: {
        Row: {
          abrangencia: Database["public"]["Enums"]["abrangencia_feriado"]
          data: string
          id: string
          nome: string
        }
        Insert: {
          abrangencia?: Database["public"]["Enums"]["abrangencia_feriado"]
          data: string
          id?: string
          nome: string
        }
        Update: {
          abrangencia?: Database["public"]["Enums"]["abrangencia_feriado"]
          data?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      fluxo_caixa: {
        Row: {
          categoria: string | null
          conta_id: string
          criado_em: string
          criado_por: string | null
          data: string
          descricao: string
          id: string
          origem: Database["public"]["Enums"]["origem_lancamento"]
          origem_id: string | null
          origem_tipo: string | null
          tipo: Database["public"]["Enums"]["tipo_lancamento_caixa"]
          valor: number
        }
        Insert: {
          categoria?: string | null
          conta_id: string
          criado_em?: string
          criado_por?: string | null
          data?: string
          descricao: string
          id?: string
          origem?: Database["public"]["Enums"]["origem_lancamento"]
          origem_id?: string | null
          origem_tipo?: string | null
          tipo: Database["public"]["Enums"]["tipo_lancamento_caixa"]
          valor: number
        }
        Update: {
          categoria?: string | null
          conta_id?: string
          criado_em?: string
          criado_por?: string | null
          data?: string
          descricao?: string
          id?: string
          origem?: Database["public"]["Enums"]["origem_lancamento"]
          origem_id?: string | null
          origem_tipo?: string | null
          tipo?: Database["public"]["Enums"]["tipo_lancamento_caixa"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fluxo_caixa_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fluxo_caixa_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      matriculas_turma: {
        Row: {
          aluno_id: string
          criado_em: string
          data_fim: string | null
          data_inicio: string
          id: string
          turma_id: string
        }
        Insert: {
          aluno_id: string
          criado_em?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          turma_id: string
        }
        Update: {
          aluno_id?: string
          criado_em?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          turma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matriculas_turma_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_turma_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "vw_aluno_meu_perfil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_turma_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "vw_professor_alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_turma_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_turma_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "vw_aluno_minha_frequencia"
            referencedColumns: ["turma_id"]
          },
          {
            foreignKeyName: "matriculas_turma_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "vw_aluno_minhas_turmas"
            referencedColumns: ["turma_id"]
          },
          {
            foreignKeyName: "matriculas_turma_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "vw_professor_agenda"
            referencedColumns: ["turma_id"]
          },
        ]
      }
      modalidades: {
        Row: {
          ativo: boolean
          cor_calendario: string
          criado_em: string
          id: string
          nome: string
          valor_padrao_mensalidade: number
        }
        Insert: {
          ativo?: boolean
          cor_calendario?: string
          criado_em?: string
          id?: string
          nome: string
          valor_padrao_mensalidade?: number
        }
        Update: {
          ativo?: boolean
          cor_calendario?: string
          criado_em?: string
          id?: string
          nome?: string
          valor_padrao_mensalidade?: number
        }
        Relationships: []
      }
      modelos_contrato: {
        Row: {
          ativo: boolean
          criado_em: string
          id: string
          texto: string
          versao: number
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          id?: string
          texto: string
          versao: number
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          id?: string
          texto?: string
          versao?: number
        }
        Relationships: []
      }
      presencas: {
        Row: {
          aluno_id: string
          conteudo_aula: string | null
          criado_em: string
          data_aula: string
          horario_previsto: string | null
          horario_real: string | null
          id: string
          motivo_justificativa:
            | Database["public"]["Enums"]["motivo_justificativa"]
            | null
          observacao: string | null
          origem: Database["public"]["Enums"]["origem_presenca"]
          registrado_por: string | null
          reposicao_de_id: string | null
          status: Database["public"]["Enums"]["status_presenca"]
          tipo_aula: Database["public"]["Enums"]["tipo_aula"]
          turma_id: string
        }
        Insert: {
          aluno_id: string
          conteudo_aula?: string | null
          criado_em?: string
          data_aula: string
          horario_previsto?: string | null
          horario_real?: string | null
          id?: string
          motivo_justificativa?:
            | Database["public"]["Enums"]["motivo_justificativa"]
            | null
          observacao?: string | null
          origem?: Database["public"]["Enums"]["origem_presenca"]
          registrado_por?: string | null
          reposicao_de_id?: string | null
          status: Database["public"]["Enums"]["status_presenca"]
          tipo_aula?: Database["public"]["Enums"]["tipo_aula"]
          turma_id: string
        }
        Update: {
          aluno_id?: string
          conteudo_aula?: string | null
          criado_em?: string
          data_aula?: string
          horario_previsto?: string | null
          horario_real?: string | null
          id?: string
          motivo_justificativa?:
            | Database["public"]["Enums"]["motivo_justificativa"]
            | null
          observacao?: string | null
          origem?: Database["public"]["Enums"]["origem_presenca"]
          registrado_por?: string | null
          reposicao_de_id?: string | null
          status?: Database["public"]["Enums"]["status_presenca"]
          tipo_aula?: Database["public"]["Enums"]["tipo_aula"]
          turma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presencas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "vw_aluno_meu_perfil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "vw_professor_alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_reposicao_de_id_fkey"
            columns: ["reposicao_de_id"]
            isOneToOne: false
            referencedRelation: "presencas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_reposicao_de_id_fkey"
            columns: ["reposicao_de_id"]
            isOneToOne: false
            referencedRelation: "vw_aluno_minha_frequencia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "vw_aluno_minha_frequencia"
            referencedColumns: ["turma_id"]
          },
          {
            foreignKeyName: "presencas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "vw_aluno_minhas_turmas"
            referencedColumns: ["turma_id"]
          },
          {
            foreignKeyName: "presencas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "vw_professor_agenda"
            referencedColumns: ["turma_id"]
          },
        ]
      }
      professor_modalidades: {
        Row: {
          modalidade_id: string
          professor_id: string
        }
        Insert: {
          modalidade_id: string
          professor_id: string
        }
        Update: {
          modalidade_id?: string
          professor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professor_modalidades_modalidade_id_fkey"
            columns: ["modalidade_id"]
            isOneToOne: false
            referencedRelation: "modalidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_modalidades_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
        ]
      }
      professores: {
        Row: {
          ativo: boolean
          comissao_padrao_tipo: Database["public"]["Enums"]["tipo_comissao"]
          comissao_padrao_valor: number
          cpf: string | null
          criado_em: string
          email: string | null
          id: string
          nome: string
          telefone: string | null
          usuario_id: string | null
        }
        Insert: {
          ativo?: boolean
          comissao_padrao_tipo?: Database["public"]["Enums"]["tipo_comissao"]
          comissao_padrao_valor?: number
          cpf?: string | null
          criado_em?: string
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
          usuario_id?: string | null
        }
        Update: {
          ativo?: boolean
          comissao_padrao_tipo?: Database["public"]["Enums"]["tipo_comissao"]
          comissao_padrao_valor?: number
          cpf?: string | null
          criado_em?: string
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professores_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      recibos: {
        Row: {
          cobranca_id: string
          enviado_em: string | null
          id: string
          pdf_url: string | null
        }
        Insert: {
          cobranca_id: string
          enviado_em?: string | null
          id?: string
          pdf_url?: string | null
        }
        Update: {
          cobranca_id?: string
          enviado_em?: string | null
          id?: string
          pdf_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recibos_cobranca_id_fkey"
            columns: ["cobranca_id"]
            isOneToOne: true
            referencedRelation: "cobrancas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recibos_cobranca_id_fkey"
            columns: ["cobranca_id"]
            isOneToOne: true
            referencedRelation: "vw_aluno_minhas_cobrancas"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorios_salvos: {
        Row: {
          criado_em: string
          filtros: Json
          id: string
          nome: string
          origem_dados: string
          usuario_id: string
          visibilidade: string
        }
        Insert: {
          criado_em?: string
          filtros?: Json
          id?: string
          nome: string
          origem_dados: string
          usuario_id: string
          visibilidade?: string
        }
        Update: {
          criado_em?: string
          filtros?: Json
          id?: string
          nome?: string
          origem_dados?: string
          usuario_id?: string
          visibilidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_salvos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      repasse_itens: {
        Row: {
          aluno_id: string
          criado_em: string
          id: string
          presenca_id: string
          repasse_id: string
          valor: number
        }
        Insert: {
          aluno_id: string
          criado_em?: string
          id?: string
          presenca_id: string
          repasse_id: string
          valor: number
        }
        Update: {
          aluno_id?: string
          criado_em?: string
          id?: string
          presenca_id?: string
          repasse_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "repasse_itens_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repasse_itens_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "vw_aluno_meu_perfil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repasse_itens_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "vw_professor_alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repasse_itens_presenca_id_fkey"
            columns: ["presenca_id"]
            isOneToOne: false
            referencedRelation: "presencas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repasse_itens_presenca_id_fkey"
            columns: ["presenca_id"]
            isOneToOne: false
            referencedRelation: "vw_aluno_minha_frequencia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repasse_itens_repasse_id_fkey"
            columns: ["repasse_id"]
            isOneToOne: false
            referencedRelation: "repasses_professor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repasse_itens_repasse_id_fkey"
            columns: ["repasse_id"]
            isOneToOne: false
            referencedRelation: "vw_professor_meu_repasse"
            referencedColumns: ["id"]
          },
        ]
      }
      repasses_professor: {
        Row: {
          conta_financeira_id: string | null
          criado_em: string
          data_pagamento: string | null
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"] | null
          id: string
          mes_referencia: string
          professor_id: string
          status: Database["public"]["Enums"]["status_repasse"]
          valor_total: number
        }
        Insert: {
          conta_financeira_id?: string | null
          criado_em?: string
          data_pagamento?: string | null
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          mes_referencia: string
          professor_id: string
          status?: Database["public"]["Enums"]["status_repasse"]
          valor_total?: number
        }
        Update: {
          conta_financeira_id?: string | null
          criado_em?: string
          data_pagamento?: string | null
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          mes_referencia?: string
          professor_id?: string
          status?: Database["public"]["Enums"]["status_repasse"]
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_repasse_conta"
            columns: ["conta_financeira_id"]
            isOneToOne: false
            referencedRelation: "contas_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repasses_professor_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
        ]
      }
      salas: {
        Row: {
          ativo: boolean
          capacidade_padrao: number
          criado_em: string
          id: string
          modalidade_padrao_id: string | null
          nome: string
        }
        Insert: {
          ativo?: boolean
          capacidade_padrao?: number
          criado_em?: string
          id?: string
          modalidade_padrao_id?: string | null
          nome: string
        }
        Update: {
          ativo?: boolean
          capacidade_padrao?: number
          criado_em?: string
          id?: string
          modalidade_padrao_id?: string | null
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "salas_modalidade_padrao_id_fkey"
            columns: ["modalidade_padrao_id"]
            isOneToOne: false
            referencedRelation: "modalidades"
            referencedColumns: ["id"]
          },
        ]
      }
      turmas: {
        Row: {
          ativo: boolean
          capacidade_maxima: number
          criado_em: string
          dia_semana: number
          horario_fim: string
          horario_inicio: string
          id: string
          modalidade_id: string
          professor_id: string
          sala_id: string
        }
        Insert: {
          ativo?: boolean
          capacidade_maxima?: number
          criado_em?: string
          dia_semana: number
          horario_fim: string
          horario_inicio: string
          id?: string
          modalidade_id: string
          professor_id: string
          sala_id: string
        }
        Update: {
          ativo?: boolean
          capacidade_maxima?: number
          criado_em?: string
          dia_semana?: number
          horario_fim?: string
          horario_inicio?: string
          id?: string
          modalidade_id?: string
          professor_id?: string
          sala_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turmas_modalidade_id_fkey"
            columns: ["modalidade_id"]
            isOneToOne: false
            referencedRelation: "modalidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turmas_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turmas_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          id: string
          nome: string
          papel: Database["public"]["Enums"]["papel_usuario"]
          telefone: string | null
          unidade: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id: string
          nome: string
          papel: Database["public"]["Enums"]["papel_usuario"]
          telefone?: string | null
          unidade?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: string
          nome?: string
          papel?: Database["public"]["Enums"]["papel_usuario"]
          telefone?: string | null
          unidade?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      vw_aluno_meu_contrato: {
        Row: {
          data_aceite: string | null
          data_envio: string | null
          data_fim_vigencia: string | null
          id: string | null
          pdf_url: string | null
          status: Database["public"]["Enums"]["status_contrato"] | null
        }
        Insert: {
          data_aceite?: string | null
          data_envio?: string | null
          data_fim_vigencia?: string | null
          id?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["status_contrato"] | null
        }
        Update: {
          data_aceite?: string | null
          data_envio?: string | null
          data_fim_vigencia?: string | null
          id?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["status_contrato"] | null
        }
        Relationships: []
      }
      vw_aluno_meu_perfil: {
        Row: {
          data_matricula: string | null
          email: string | null
          endereco: string | null
          id: string | null
          nome: string | null
          status: Database["public"]["Enums"]["status_aluno"] | null
          telefone: string | null
          tipo_sanguineo: string | null
        }
        Insert: {
          data_matricula?: string | null
          email?: string | null
          endereco?: string | null
          id?: string | null
          nome?: string | null
          status?: Database["public"]["Enums"]["status_aluno"] | null
          telefone?: string | null
          tipo_sanguineo?: string | null
        }
        Update: {
          data_matricula?: string | null
          email?: string | null
          endereco?: string | null
          id?: string | null
          nome?: string | null
          status?: Database["public"]["Enums"]["status_aluno"] | null
          telefone?: string | null
          tipo_sanguineo?: string | null
        }
        Relationships: []
      }
      vw_aluno_minha_frequencia: {
        Row: {
          data_aula: string | null
          id: string | null
          modalidade: string | null
          status: Database["public"]["Enums"]["status_presenca"] | null
          tipo_aula: Database["public"]["Enums"]["tipo_aula"] | null
          turma_id: string | null
        }
        Relationships: []
      }
      vw_aluno_minhas_cobrancas: {
        Row: {
          data_pagamento: string | null
          descricao: string | null
          id: string | null
          status: Database["public"]["Enums"]["status_cobranca"] | null
          valor: number | null
          vencimento: string | null
        }
        Insert: {
          data_pagamento?: string | null
          descricao?: string | null
          id?: string | null
          status?: Database["public"]["Enums"]["status_cobranca"] | null
          valor?: number | null
          vencimento?: string | null
        }
        Update: {
          data_pagamento?: string | null
          descricao?: string | null
          id?: string | null
          status?: Database["public"]["Enums"]["status_cobranca"] | null
          valor?: number | null
          vencimento?: string | null
        }
        Relationships: []
      }
      vw_aluno_minhas_turmas: {
        Row: {
          dia_semana: number | null
          horario_fim: string | null
          horario_inicio: string | null
          modalidade: string | null
          professor: string | null
          sala: string | null
          turma_id: string | null
        }
        Relationships: []
      }
      vw_professor_agenda: {
        Row: {
          alunos_matriculados: number | null
          capacidade_maxima: number | null
          cor_calendario: string | null
          dia_semana: number | null
          horario_fim: string | null
          horario_inicio: string | null
          modalidade: string | null
          sala: string | null
          turma_id: string | null
        }
        Relationships: []
      }
      vw_professor_alunos: {
        Row: {
          email: string | null
          emergencia_nome: string | null
          emergencia_telefone: string | null
          id: string | null
          nome: string | null
          status: Database["public"]["Enums"]["status_aluno"] | null
          telefone: string | null
          tipo_sanguineo: string | null
        }
        Insert: {
          email?: string | null
          emergencia_nome?: string | null
          emergencia_telefone?: string | null
          id?: string | null
          nome?: string | null
          status?: Database["public"]["Enums"]["status_aluno"] | null
          telefone?: string | null
          tipo_sanguineo?: string | null
        }
        Update: {
          email?: string | null
          emergencia_nome?: string | null
          emergencia_telefone?: string | null
          id?: string | null
          nome?: string | null
          status?: Database["public"]["Enums"]["status_aluno"] | null
          telefone?: string | null
          tipo_sanguineo?: string | null
        }
        Relationships: []
      }
      vw_professor_meu_repasse: {
        Row: {
          data_pagamento: string | null
          id: string | null
          mes_referencia: string | null
          status: Database["public"]["Enums"]["status_repasse"] | null
          valor_total: number | null
        }
        Insert: {
          data_pagamento?: string | null
          id?: string | null
          mes_referencia?: string | null
          status?: Database["public"]["Enums"]["status_repasse"] | null
          valor_total?: number | null
        }
        Update: {
          data_pagamento?: string | null
          id?: string | null
          mes_referencia?: string | null
          status?: Database["public"]["Enums"]["status_repasse"] | null
          valor_total?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      aluno_do_professor: { Args: { p_aluno_id: string }; Returns: boolean }
      meu_aluno_id: { Args: never; Returns: string }
      meu_papel: {
        Args: never
        Returns: Database["public"]["Enums"]["papel_usuario"]
      }
      meu_professor_id: { Args: never; Returns: string }
      turma_do_professor: { Args: { p_turma_id: string }; Returns: boolean }
    }
    Enums: {
      abrangencia_feriado: "nacional" | "municipal"
      forma_pagamento:
        | "pix"
        | "dinheiro"
        | "cartao"
        | "transferencia"
        | "boleto"
      motivo_justificativa: "atestado_medico" | "falta_professor" | "outro"
      origem_lancamento: "automatico" | "manual"
      origem_presenca: "manual" | "qr_code"
      papel_usuario: "gestao" | "professor" | "aluno"
      status_aluno: "pendente" | "ativo" | "trancado" | "cancelado"
      status_cobranca: "pendente" | "paga" | "atrasada" | "cancelada"
      status_contrato:
        | "aguardando_assinatura"
        | "aceito"
        | "expirado"
        | "cancelado"
      status_presenca: "presente" | "falta" | "falta_justificada"
      status_repasse: "pendente" | "pago"
      tipo_aula: "normal" | "reposicao"
      tipo_comissao: "percentual" | "valor_fixo"
      tipo_conta: "banco" | "carteira_digital" | "dinheiro_fisico"
      tipo_lancamento_caixa: "entrada" | "saida"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      abrangencia_feriado: ["nacional", "municipal"],
      forma_pagamento: ["pix", "dinheiro", "cartao", "transferencia", "boleto"],
      motivo_justificativa: ["atestado_medico", "falta_professor", "outro"],
      origem_lancamento: ["automatico", "manual"],
      origem_presenca: ["manual", "qr_code"],
      papel_usuario: ["gestao", "professor", "aluno"],
      status_aluno: ["pendente", "ativo", "trancado", "cancelado"],
      status_cobranca: ["pendente", "paga", "atrasada", "cancelada"],
      status_contrato: [
        "aguardando_assinatura",
        "aceito",
        "expirado",
        "cancelado",
      ],
      status_presenca: ["presente", "falta", "falta_justificada"],
      status_repasse: ["pendente", "pago"],
      tipo_aula: ["normal", "reposicao"],
      tipo_comissao: ["percentual", "valor_fixo"],
      tipo_conta: ["banco", "carteira_digital", "dinheiro_fisico"],
      tipo_lancamento_caixa: ["entrada", "saida"],
    },
  },
} as const
