-- Baseline da aplicação Pop Music, extraída de pg_catalog em 29/10/2026.

-- Sem dados pessoais. Requer projeto Supabase novo, com Auth e Storage provisionados.

-- Inclui estado histórico até 047 e migrations 048/049 ao final; não reaplicar migrations anteriores.

begin;

do $guard$ begin if exists(select 1 from pg_tables where schemaname='public') then raise exception 'BASELINE_REQUER_SCHEMA_PUBLIC_VAZIO'; end if; if to_regclass('auth.users') is null or to_regclass('storage.buckets') is null then raise exception 'AUTH_E_STORAGE_SUPABASE_OBRIGATORIOS'; end if; end $guard$;

create schema if not exists extensions;

create extension if not exists pgcrypto with schema extensions;

create extension if not exists "uuid-ossp" with schema extensions;

set local check_function_bodies=false;

set local search_path=public,extensions,pg_catalog;

create type public.abrangencia_feriado as enum ('nacional','municipal');

create type public.forma_pagamento as enum ('pix','dinheiro','cartao','transferencia','boleto');

create type public.motivo_justificativa as enum ('atestado_medico','falta_professor','outro');

create type public.origem_lancamento as enum ('automatico','manual');

create type public.origem_presenca as enum ('manual','qr_code');

create type public.papel_usuario as enum ('gestao','professor','aluno');

create type public.status_aluno as enum ('pendente','ativo','trancado','cancelado');

create type public.status_cobranca as enum ('pendente','paga','atrasada','cancelada');

create type public.status_contrato as enum ('aguardando_assinatura','aceito','expirado','cancelado','renovado');

create type public.status_presenca as enum ('presente','falta','falta_justificada');

create type public.status_repasse as enum ('pendente','pago');

create type public.tipo_aula as enum ('normal','reposicao');

create type public.tipo_comissao as enum ('percentual','valor_fixo');

create type public.tipo_conta as enum ('banco','carteira_digital','dinheiro_fisico');

create type public.tipo_lancamento_caixa as enum ('entrada','saida');

create table public.alunos (id uuid default extensions.uuid_generate_v4() not null, usuario_id uuid, nome text not null, cpf text, data_nascimento date not null, endereco text, telefone text, email text, tipo_sanguineo text, emergencia_nome text, emergencia_telefone text, emergencia_parentesco text, responsavel_nome text, responsavel_cpf text, responsavel_telefone text, responsavel_email text, cessao_imagem_aceita boolean default false not null, status public.status_aluno default 'pendente'::public.status_aluno not null, data_matricula date default CURRENT_DATE not null, data_inicio_trancamento date, motivo_cancelamento text, data_cancelamento date, criado_em timestamp with time zone default now() not null, atualizado_em timestamp with time zone default now() not null, foto_url text, motivo_trancamento text, consentimento_foto_em timestamp with time zone);

create table public.auditoria (id uuid default extensions.uuid_generate_v4() not null, usuario_id uuid, tabela text not null, registro_id uuid, acao text not null, dados_antes jsonb, dados_depois jsonb, criado_em timestamp with time zone default now() not null);

create table public.chamadas_aula (id uuid default gen_random_uuid() not null, turma_id uuid not null, data_aula date not null, finalizada_em timestamp with time zone default now() not null, finalizada_por uuid default auth.uid() not null, criado_em timestamp with time zone default now() not null, reaberta_em timestamp with time zone, reaberta_por uuid, motivo_reabertura text, ativa boolean default true not null);

create table public.cobrancas (id uuid default extensions.uuid_generate_v4() not null, aluno_id uuid not null, contrato_id uuid, descricao text default 'Mensalidade'::text not null, valor numeric(10,2) not null, vencimento date not null, status public.status_cobranca default 'pendente'::public.status_cobranca not null, forma_pagamento public.forma_pagamento, data_pagamento date, motivo_cancelamento text, gateway_referencia text, criado_em timestamp with time zone default now() not null, observacao_pagamento text, recebido_por uuid);

create table public.comissoes_professor_aluno (id uuid default extensions.uuid_generate_v4() not null, professor_id uuid not null, aluno_id uuid not null, tipo public.tipo_comissao default 'percentual'::public.tipo_comissao not null, valor numeric(10,2) not null, criado_em timestamp with time zone default now() not null);

create table public.comunicacoes (id uuid default gen_random_uuid() not null, canal text not null, tipo text not null, destinatario_mascarado text not null, destinatario_hash text not null, provedor text not null, status text not null, referencia_id uuid, provedor_mensagem_id text, erro_codigo text, criado_em timestamp with time zone default now() not null, atualizado_em timestamp with time zone default now() not null);

create table public.configuracoes (chave text not null, valor jsonb not null, atualizado_em timestamp with time zone default now() not null, atualizado_por uuid);

create table public.contas_financeiras (id uuid default extensions.uuid_generate_v4() not null, nome text not null, tipo public.tipo_conta default 'banco'::public.tipo_conta not null, saldo_inicial numeric(10,2) default 0 not null, ativo boolean default true not null, criado_em timestamp with time zone default now() not null);

create table public.contratos (id uuid default extensions.uuid_generate_v4() not null, aluno_id uuid not null, modelo_contrato_id uuid, texto_gerado text not null, status public.status_contrato default 'aguardando_assinatura'::public.status_contrato not null, token text default encode(extensions.gen_random_bytes(32), 'hex'::text) not null, token_expira_em timestamp with time zone default (now() + '7 days'::interval) not null, valor_mensalidade numeric(10,2) not null, dia_vencimento integer not null, data_envio timestamp with time zone default now() not null, data_aceite timestamp with time zone, data_inicio_vigencia date, data_fim_vigencia date, aceite_ip inet, aceite_user_agent text, aceite_hash text, pdf_url text, contrato_anterior_id uuid, criado_em timestamp with time zone default now() not null, foto_assinatura_url text, documento_assinado_snapshot jsonb, documento_assinado_hash text);

create table public.estornos_pagamento (id uuid default gen_random_uuid() not null, cobranca_id uuid not null, recibo_id uuid not null, fluxo_caixa_original_id uuid not null, fluxo_caixa_estorno_id uuid not null, conta_id uuid not null, valor numeric(12,2) not null, data_estorno date not null, motivo text not null, criado_por uuid not null, criado_em timestamp with time zone default now() not null);

create table public.feriados (id uuid default extensions.uuid_generate_v4() not null, data date not null, nome text not null, abrangencia public.abrangencia_feriado default 'nacional'::public.abrangencia_feriado not null);

create table public.fluxo_caixa (id uuid default extensions.uuid_generate_v4() not null, tipo public.tipo_lancamento_caixa not null, descricao text not null, valor numeric(10,2) not null, data date default CURRENT_DATE not null, conta_id uuid not null, categoria text, origem public.origem_lancamento default 'manual'::public.origem_lancamento not null, origem_tipo text, origem_id uuid, criado_por uuid, criado_em timestamp with time zone default now() not null);

create table public.matriculas_turma (id uuid default extensions.uuid_generate_v4() not null, aluno_id uuid not null, turma_id uuid not null, data_inicio date default CURRENT_DATE not null, data_fim date, criado_em timestamp with time zone default now() not null, motivo_fim text);

create table public.modalidades (id uuid default extensions.uuid_generate_v4() not null, nome text not null, valor_padrao_mensalidade numeric(10,2) default 0 not null, cor_calendario text default '#7A1F1F'::text not null, ativo boolean default true not null, criado_em timestamp with time zone default now() not null);

create table public.modelos_contrato (id uuid default extensions.uuid_generate_v4() not null, texto text not null, versao integer not null, ativo boolean default true not null, criado_em timestamp with time zone default now() not null);

create table public.presencas (id uuid default extensions.uuid_generate_v4() not null, aluno_id uuid not null, turma_id uuid not null, data_aula date not null, horario_previsto time without time zone, horario_real time without time zone, status public.status_presenca not null, motivo_justificativa public.motivo_justificativa, observacao text, conteudo_aula text, origem public.origem_presenca default 'manual'::public.origem_presenca not null, tipo_aula public.tipo_aula default 'normal'::public.tipo_aula not null, reposicao_de_id uuid, registrado_por uuid default auth.uid(), criado_em timestamp with time zone default now() not null);

create table public.professor_modalidades (professor_id uuid not null, modalidade_id uuid not null);

create table public.professores (id uuid default extensions.uuid_generate_v4() not null, usuario_id uuid, nome text not null, cpf text, telefone text, email text, comissao_padrao_tipo public.tipo_comissao default 'percentual'::public.tipo_comissao not null, comissao_padrao_valor numeric(10,2) default 50 not null, ativo boolean default true not null, criado_em timestamp with time zone default now() not null, pix_chave text);

create table public.recibos (id uuid default extensions.uuid_generate_v4() not null, cobranca_id uuid not null, pdf_url text, enviado_em timestamp with time zone);

create table public.relatorios_salvos (id uuid default extensions.uuid_generate_v4() not null, usuario_id uuid not null, nome text not null, origem_dados text not null, filtros jsonb default '{}'::jsonb not null, visibilidade text default 'privado'::text not null, criado_em timestamp with time zone default now() not null);

create table public.repasse_itens (id uuid default extensions.uuid_generate_v4() not null, repasse_id uuid not null, presenca_id uuid, aluno_id uuid not null, valor numeric(10,2) not null, criado_em timestamp with time zone default now() not null, turma_id uuid, valor_base numeric(12,2), tipo_comissao public.tipo_comissao, valor_configurado numeric(12,2), aulas_finalizadas integer default 0 not null, cobranca_id uuid);

create table public.repasses_professor (id uuid default extensions.uuid_generate_v4() not null, professor_id uuid not null, mes_referencia date not null, status public.status_repasse default 'pendente'::public.status_repasse not null, forma_pagamento public.forma_pagamento, data_pagamento date, conta_financeira_id uuid, valor_total numeric(10,2) default 0 not null, criado_em timestamp with time zone default now() not null);

create table public.salas (id uuid default extensions.uuid_generate_v4() not null, nome text not null, modalidade_padrao_id uuid, capacidade_padrao integer default 1 not null, ativo boolean default true not null, criado_em timestamp with time zone default now() not null);

create table public.tentativas_assinatura (id uuid default gen_random_uuid() not null, token_hash text not null, ip_hash text not null, criada_em timestamp with time zone default now() not null, sucesso boolean default false not null);

create table public.turmas (id uuid default extensions.uuid_generate_v4() not null, modalidade_id uuid not null, professor_id uuid not null, sala_id uuid not null, dia_semana smallint not null, horario_inicio time without time zone not null, horario_fim time without time zone not null, capacidade_maxima integer default 1 not null, ativo boolean default true not null, criado_em timestamp with time zone default now() not null);

create table public.usuarios (id uuid not null, nome text not null, papel public.papel_usuario not null, telefone text, ativo boolean default true not null, unidade text default 'Unidade Centro'::text, criado_em timestamp with time zone default now() not null, atualizado_em timestamp with time zone default now() not null, onboarding_concluido boolean default false not null);

alter table public.alunos add constraint alunos_pkey PRIMARY KEY (id);

alter table public.alunos add constraint alunos_usuario_id_key UNIQUE (usuario_id);

alter table public.auditoria add constraint auditoria_pkey PRIMARY KEY (id);

alter table public.chamadas_aula add constraint chamadas_aula_motivo_reabertura_check CHECK (ativa = true AND reaberta_em IS NULL AND reaberta_por IS NULL AND motivo_reabertura IS NULL OR ativa = false AND reaberta_em IS NOT NULL AND reaberta_por IS NOT NULL AND length(TRIM(BOTH FROM motivo_reabertura)) >= 5);

alter table public.chamadas_aula add constraint chamadas_aula_pkey PRIMARY KEY (id);

alter table public.cobrancas add constraint cobrancas_pkey PRIMARY KEY (id);

alter table public.cobrancas add constraint cobrancas_valor_positivo CHECK (valor > 0::numeric);

alter table public.comissoes_professor_aluno add constraint comissoes_professor_aluno_pkey PRIMARY KEY (id);

alter table public.comissoes_professor_aluno add constraint comissoes_professor_aluno_professor_id_aluno_id_key UNIQUE (professor_id, aluno_id);

alter table public.comunicacoes add constraint comunicacoes_canal_check CHECK (canal = ANY (ARRAY['email'::text, 'whatsapp'::text]));

alter table public.comunicacoes add constraint comunicacoes_pkey PRIMARY KEY (id);

alter table public.comunicacoes add constraint comunicacoes_status_check CHECK (status = ANY (ARRAY['processando'::text, 'enviado'::text, 'falhou'::text]));

alter table public.configuracoes add constraint configuracoes_pkey PRIMARY KEY (chave);

alter table public.contas_financeiras add constraint contas_financeiras_nome_key UNIQUE (nome);

alter table public.contas_financeiras add constraint contas_financeiras_pkey PRIMARY KEY (id);

alter table public.contratos add constraint contratos_dia_vencimento_check CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31);

alter table public.contratos add constraint contratos_dia_vencimento_valido CHECK (dia_vencimento >= 1 AND dia_vencimento <= 28);

alter table public.contratos add constraint contratos_pkey PRIMARY KEY (id);

alter table public.contratos add constraint contratos_token_key UNIQUE (token);

alter table public.contratos add constraint contratos_valor_mensalidade_positivo CHECK (valor_mensalidade > 0::numeric);

alter table public.estornos_pagamento add constraint estornos_pagamento_cobranca_id_key UNIQUE (cobranca_id);

alter table public.estornos_pagamento add constraint estornos_pagamento_fluxo_caixa_estorno_id_key UNIQUE (fluxo_caixa_estorno_id);

alter table public.estornos_pagamento add constraint estornos_pagamento_motivo_check CHECK (length(btrim(motivo)) >= 5);

alter table public.estornos_pagamento add constraint estornos_pagamento_pkey PRIMARY KEY (id);

alter table public.estornos_pagamento add constraint estornos_pagamento_valor_check CHECK (valor > 0::numeric);

alter table public.feriados add constraint feriados_pkey PRIMARY KEY (id);

alter table public.fluxo_caixa add constraint fluxo_caixa_pkey PRIMARY KEY (id);

alter table public.fluxo_caixa add constraint fluxo_caixa_valor_check CHECK (valor > 0::numeric);

alter table public.matriculas_turma add constraint matriculas_turma_pkey PRIMARY KEY (id);

alter table public.modalidades add constraint modalidades_nome_key UNIQUE (nome);

alter table public.modalidades add constraint modalidades_pkey PRIMARY KEY (id);

alter table public.modelos_contrato add constraint modelos_contrato_pkey PRIMARY KEY (id);

alter table public.presencas add constraint presencas_pkey PRIMARY KEY (id);

alter table public.professor_modalidades add constraint professor_modalidades_pkey PRIMARY KEY (professor_id, modalidade_id);

alter table public.professores add constraint professores_cpf_key UNIQUE (cpf);

alter table public.professores add constraint professores_pkey PRIMARY KEY (id);

alter table public.professores add constraint professores_usuario_id_key UNIQUE (usuario_id);

alter table public.recibos add constraint recibos_cobranca_id_key UNIQUE (cobranca_id);

alter table public.recibos add constraint recibos_pkey PRIMARY KEY (id);

alter table public.relatorios_salvos add constraint relatorios_salvos_pkey PRIMARY KEY (id);

alter table public.repasse_itens add constraint repasse_itens_pkey PRIMARY KEY (id);

alter table public.repasses_professor add constraint repasses_professor_pkey PRIMARY KEY (id);

alter table public.repasses_professor add constraint repasses_professor_professor_id_mes_referencia_key UNIQUE (professor_id, mes_referencia);

alter table public.salas add constraint salas_capacidade_positiva CHECK (capacidade_padrao > 0);

alter table public.salas add constraint salas_nome_key UNIQUE (nome);

alter table public.salas add constraint salas_pkey PRIMARY KEY (id);

alter table public.tentativas_assinatura add constraint tentativas_assinatura_pkey PRIMARY KEY (id);

alter table public.turmas add constraint horario_valido CHECK (horario_fim > horario_inicio);

alter table public.turmas add constraint turmas_capacidade_maxima_check CHECK (capacidade_maxima >= 1);

alter table public.turmas add constraint turmas_capacidade_positiva CHECK (capacidade_maxima > 0);

alter table public.turmas add constraint turmas_dia_semana_check CHECK (dia_semana >= 0 AND dia_semana <= 6);

alter table public.turmas add constraint turmas_horario_valido CHECK (horario_inicio < horario_fim);

alter table public.turmas add constraint turmas_pkey PRIMARY KEY (id);

alter table public.usuarios add constraint usuarios_pkey PRIMARY KEY (id);

CREATE OR REPLACE FUNCTION public.alterar_acesso_gestao(p_usuario_id uuid, p_nome text, p_ativo boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_papel public.papel_usuario; v_ativo_atual boolean;
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then raise exception 'Apenas a gestao pode alterar acessos'; end if;
  if length(trim(coalesce(p_nome,''))) < 3 then raise exception 'Nome invalido'; end if;
  select papel,ativo into v_papel,v_ativo_atual from public.usuarios where id=p_usuario_id for update;
  if not found or v_papel <> 'gestao'::public.papel_usuario then raise exception 'Usuario de gestao nao encontrado'; end if;
  if not p_ativo and p_usuario_id=auth.uid() then raise exception 'Voce nao pode desativar o proprio acesso'; end if;
  if not p_ativo and v_ativo_atual and (select count(*) from public.usuarios where papel='gestao' and ativo)=1 then
    raise exception 'Nao e possivel desativar o ultimo usuario ativo da gestao';
  end if;
  update public.usuarios set nome=trim(p_nome),ativo=p_ativo where id=p_usuario_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.alterar_status_modalidade(p_modalidade_id uuid, p_ativo boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode alterar modalidades'; end if;
  perform 1 from public.modalidades where id=p_modalidade_id for update;
  if not found then raise exception 'Modalidade nao encontrada'; end if;
  if not p_ativo and exists(select 1 from public.turmas where modalidade_id=p_modalidade_id and ativo) then
    raise exception 'A modalidade possui turma ativa. Desative ou altere a turma primeiro';
  end if;
  update public.modalidades set ativo=p_ativo where id=p_modalidade_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.alterar_status_professor(p_professor_id uuid, p_ativo boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_usuario_id uuid;
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode alterar professores'; end if;
  if not p_ativo and exists(select 1 from public.turmas where professor_id=p_professor_id and ativo) then
    raise exception 'O professor possui turma ativa. Realoque ou desative as turmas primeiro';
  end if;
  update public.professores set ativo=p_ativo where id=p_professor_id returning usuario_id into v_usuario_id;
  if not found then raise exception 'Professor nao encontrado'; end if;
  if v_usuario_id is not null then update public.usuarios set ativo=p_ativo where id=v_usuario_id; end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.alterar_status_sala(p_sala_id uuid, p_ativo boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode alterar salas'; end if;
  perform 1 from public.salas where id=p_sala_id for update;
  if not found then raise exception 'Sala nao encontrada'; end if;
  if not p_ativo and exists(select 1 from public.turmas where sala_id=p_sala_id and ativo) then
    raise exception 'A sala possui turma ativa. Desative ou realoque a turma primeiro';
  end if;
  update public.salas set ativo=p_ativo where id=p_sala_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.aluno_do_professor(p_aluno_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists (
    select 1
    from public.matriculas_turma mt
    join public.turmas t on t.id = mt.turma_id
    where mt.aluno_id = p_aluno_id
      and mt.data_fim is null
      and t.professor_id = public.meu_professor_id()
  )
$function$
;

CREATE OR REPLACE FUNCTION public.assinar_contrato(p_token text, p_foto_path text, p_ip text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_contrato public.contratos%rowtype;
  v_hash text := encode(gen_random_bytes(32),'hex');
  v_aceite timestamptz := clock_timestamp();
  v_inicio date := current_date;
  v_fim date := (current_date + interval '1 year')::date;
begin
  if coalesce(length(trim(p_token)),0) < 32 then raise exception 'Token invalido'; end if;
  if coalesce(length(trim(p_foto_path)),0) = 0 then raise exception 'Foto da assinatura obrigatoria'; end if;

  select * into v_contrato from public.contratos where token=p_token for update;
  if not found then raise exception 'Contrato nao encontrado'; end if;
  if v_contrato.status='aceito' then raise exception 'Contrato ja assinado'; end if;
  if v_contrato.status='cancelado' then raise exception 'Contrato cancelado'; end if;
  if v_contrato.status='expirado' or v_contrato.token_expira_em < now() then
    if v_contrato.status <> 'expirado' then update public.contratos set status='expirado' where id=v_contrato.id; end if;
    raise exception 'Link de assinatura expirado';
  end if;
  if v_contrato.status <> 'aguardando_assinatura' then raise exception 'Contrato indisponivel para assinatura'; end if;

  update public.contratos set
    status='aceito', data_aceite=v_aceite, data_inicio_vigencia=v_inicio,
    data_fim_vigencia=v_fim, foto_assinatura_url=trim(p_foto_path),
    aceite_hash=v_hash,
    aceite_ip=case when nullif(trim(coalesce(p_ip,'')),'') is null then null else p_ip::inet end,
    aceite_user_agent=left(coalesce(p_user_agent,'Nao informado'),500)
  where id=v_contrato.id;

  insert into public.cobrancas(aluno_id,contrato_id,descricao,valor,vencimento,status)
  select v_contrato.aluno_id, v_contrato.id,
    format('Mensalidade %s/12',g.n), v_contrato.valor_mensalidade,
    make_date(extract(year from (v_inicio + ((g.n-1)||' month')::interval))::integer,
              extract(month from (v_inicio + ((g.n-1)||' month')::interval))::integer,
              v_contrato.dia_vencimento), 'pendente'
  from generate_series(1,12) g(n)
  on conflict (contrato_id,vencimento) where contrato_id is not null do nothing;

  if (select count(*) from public.cobrancas where contrato_id=v_contrato.id) <> 12 then
    raise exception 'Nao foi possivel garantir as 12 mensalidades do contrato';
  end if;

  return jsonb_build_object('contrato_id',v_contrato.id,'aluno_id',v_contrato.aluno_id,
    'status','aceito','data_aceite',v_aceite,'aceite_hash',v_hash,
    'data_inicio_vigencia',v_inicio,'data_fim_vigencia',v_fim,'foto_assinatura_url',trim(p_foto_path));
end $function$
;

CREATE OR REPLACE FUNCTION public.assinar_contrato_com_consentimento(p_token text, p_foto_path text, p_ip text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare
  v_resultado jsonb;
  v_aluno_id uuid;
  v_contrato_id uuid;
  v_snapshot jsonb;
  v_hash text;
begin
  v_resultado := public.assinar_contrato(p_token, p_foto_path, p_ip, p_user_agent);
  v_aluno_id := (v_resultado ->> 'aluno_id')::uuid;
  v_contrato_id := (v_resultado ->> 'contrato_id')::uuid;

  update public.alunos
     set cessao_imagem_aceita = true,
         consentimento_foto_em = clock_timestamp()
   where id = v_aluno_id;
  if not found then raise exception 'Aluno nao encontrado'; end if;

  select jsonb_build_object(
    'versao', 1,
    'gerado_em', c.data_aceite,
    'aluno', to_jsonb(a) - array['usuario_id'],
    'contrato', to_jsonb(c) - array['token','documento_assinado_snapshot','documento_assinado_hash'],
    'turmas', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', t.id, 'dia_semana', t.dia_semana,
          'horario_inicio', t.horario_inicio, 'horario_fim', t.horario_fim,
          'modalidades', jsonb_build_object('id', m.id, 'nome', m.nome),
          'sala', case when s.id is null then null else jsonb_build_object('id', s.id, 'nome', s.nome) end,
          'professor', case when p.id is null then null else jsonb_build_object('id', p.id, 'nome', p.nome) end
        ) order by t.dia_semana, t.horario_inicio, t.id
      )
      from public.matriculas_turma mt
      join public.turmas t on t.id = mt.turma_id
      join public.modalidades m on m.id = t.modalidade_id
      left join public.salas s on s.id = t.sala_id
      left join public.professores p on p.id = t.professor_id
      where mt.aluno_id = a.id and mt.data_fim is null
    ), '[]'::jsonb),
    'escola', coalesce((select cfg.valor from public.configuracoes cfg where cfg.chave = 'escola' limit 1), '{}'::jsonb)
  ) into v_snapshot
  from public.contratos c
  join public.alunos a on a.id = c.aluno_id
  where c.id = v_contrato_id;

  if v_snapshot is null then raise exception 'Nao foi possivel gerar a via assinada'; end if;
  v_hash := encode(digest(convert_to(v_snapshot::text, 'UTF8'), 'sha256'), 'hex');

  update public.contratos
     set documento_assinado_snapshot = v_snapshot,
         documento_assinado_hash = v_hash
   where id = v_contrato_id and documento_assinado_snapshot is null;
  if not found then raise exception 'A via assinada ja foi gerada'; end if;

  return v_resultado || jsonb_build_object('documento_assinado_hash', v_hash);
end $function$
;

CREATE OR REPLACE FUNCTION public.atualizar_turmas_aluno(p_aluno_id uuid, p_turma_ids uuid[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_turma_id uuid; v_cap integer; v_ocupacao integer;
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode alterar matriculas'; end if;
  if coalesce(array_length(p_turma_ids,1),0)=0 then raise exception 'Selecione ao menos uma turma'; end if;
  update public.matriculas_turma set data_fim=current_date,motivo_fim='Troca de turma'
    where aluno_id=p_aluno_id and data_fim is null and not(turma_id=any(p_turma_ids));
  foreach v_turma_id in array p_turma_ids loop
    if not exists(select 1 from public.matriculas_turma where aluno_id=p_aluno_id and turma_id=v_turma_id and data_fim is null) then
      select capacidade_maxima into v_cap from public.turmas where id=v_turma_id and ativo for update;
      if not found then raise exception 'Turma inexistente ou inativa'; end if;
      select count(*) into v_ocupacao from public.matriculas_turma where turma_id=v_turma_id and data_fim is null;
      if v_ocupacao>=v_cap then raise exception 'Uma turma selecionada esta lotada'; end if;
      insert into public.matriculas_turma(aluno_id,turma_id,data_inicio) values(p_aluno_id,v_turma_id,current_date);
    end if;
  end loop;
end $function$
;

CREATE OR REPLACE FUNCTION public.calcular_repasse_professor(p_professor_id uuid, p_mes date)
 RETURNS TABLE(cobranca_id uuid, aluno_id uuid, aluno_nome text, turma_id uuid, modalidade_nome text, aulas_finalizadas bigint, valor_base numeric, tipo_comissao public.tipo_comissao, valor_configurado numeric, valor_repasse numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then
    raise exception 'Somente a gestão pode calcular repasses';
  end if;

  return query
  with periodo as (
    select date_trunc('month', p_mes)::date as inicio,
           (date_trunc('month', p_mes) + interval '1 month')::date as fim
  ), elegiveis as (
    select
      c.id as cobranca_id,
      a.id as aluno_id,
      a.nome as aluno_nome,
      t.id as turma_id,
      m.nome as modalidade_nome,
      m.valor_padrao_mensalidade::numeric as valor_base,
      coalesce(cpa.tipo, p.comissao_padrao_tipo) as tipo_comissao,
      coalesce(cpa.valor, p.comissao_padrao_valor)::numeric as valor_configurado,
      (
        select count(*)
        from public.chamadas_aula ca, periodo pe2
        where ca.turma_id = t.id
          and ca.ativa = true
          and ca.data_aula >= pe2.inicio
          and ca.data_aula < pe2.fim
      ) as aulas_finalizadas
    from public.cobrancas c
    join public.alunos a on a.id = c.aluno_id
    join public.matriculas_turma mt on mt.aluno_id = a.id
    join public.turmas t on t.id = mt.turma_id and t.professor_id = p_professor_id
    join public.professores p on p.id = t.professor_id
    join public.modalidades m on m.id = t.modalidade_id
    left join lateral (
      select ca.tipo, ca.valor
      from public.comissoes_professor_aluno ca
      where ca.professor_id = p.id and ca.aluno_id = a.id
      order by ca.criado_em desc, ca.id desc
      limit 1
    ) cpa on true
    cross join periodo pe
    where c.status = 'paga'::public.status_cobranca
      and c.data_pagamento >= pe.inicio
      and c.data_pagamento < pe.fim
      and p.ativo = true
      and t.ativo = true
      and mt.data_inicio <= c.data_pagamento
      and (mt.data_fim is null or mt.data_fim >= c.data_pagamento)
      and not exists (
        select 1 from public.repasse_itens ri
        where ri.cobranca_id = c.id and ri.turma_id = t.id
      )
  )
  select
    e.cobranca_id,
    e.aluno_id,
    e.aluno_nome,
    e.turma_id,
    e.modalidade_nome,
    e.aulas_finalizadas,
    e.valor_base,
    e.tipo_comissao,
    e.valor_configurado,
    round(case
      when e.tipo_comissao = 'percentual'::public.tipo_comissao
        then e.valor_base * e.valor_configurado / 100
      else e.valor_configurado
    end, 2) as valor_repasse
  from elegiveis e
  order by e.aluno_nome, e.modalidade_nome, e.cobranca_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.cancelar_aluno(p_aluno_id uuid, p_motivo text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_motivo text := trim(coalesce(p_motivo, ''));
  v_inicio_mes date := date_trunc('month', current_date)::date;
  v_proximo_mes date := (date_trunc('month', current_date) + interval '1 month')::date;
  v_fez_aula_no_mes boolean;
begin
  if public.meu_papel() <> 'gestao' then raise exception 'Apenas a gestao pode cancelar matriculas'; end if;
  if length(v_motivo) < 5 then raise exception 'Informe o motivo do cancelamento'; end if;

  perform 1 from public.alunos where id = p_aluno_id for update;
  if not found then raise exception 'Aluno inexistente'; end if;

  update public.alunos set status='cancelado', data_cancelamento=current_date, motivo_cancelamento=v_motivo
   where id=p_aluno_id and status<>'cancelado';
  if not found then raise exception 'Aluno ja cancelado'; end if;

  select exists (
    select 1 from public.presencas p
     where p.aluno_id=p_aluno_id and p.data_aula>=v_inicio_mes and p.data_aula<v_proximo_mes
       and p.status='presente'
  ) into v_fez_aula_no_mes;

  update public.matriculas_turma set data_fim=current_date, motivo_fim='Cancelamento: '||v_motivo
   where aluno_id=p_aluno_id and data_fim is null;

  update public.cobrancas set status='cancelada', motivo_cancelamento='Cancelamento sem fidelidade: '||v_motivo
   where aluno_id=p_aluno_id
     and status in ('pendente','atrasada')
     and vencimento>current_date
     and (vencimento>=v_proximo_mes or (vencimento>=v_inicio_mes and not v_fez_aula_no_mes));

  update public.contratos set status='cancelado'
   where aluno_id=p_aluno_id and status in ('aguardando_assinatura','aceito');
  update public.usuarios set ativo=false where id=(select usuario_id from public.alunos where id=p_aluno_id);
end $function$
;

CREATE OR REPLACE FUNCTION public.cancelar_cobranca_aberta(p_cobranca_id uuid, p_motivo text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_status public.status_cobranca;
begin
  if public.meu_papel()<>'gestao'::public.papel_usuario then raise exception 'Apenas a gestao pode cancelar cobrancas'; end if;
  if length(btrim(coalesce(p_motivo,'')))<3 then raise exception 'Informe o motivo do cancelamento'; end if;
  select status into v_status from public.cobrancas where id=p_cobranca_id for update;
  if not found then raise exception 'Cobranca nao encontrada'; end if;
  if v_status='paga'::public.status_cobranca then raise exception 'Cobranca paga nao pode ser cancelada. Realize um estorno'; end if;
  if v_status='cancelada'::public.status_cobranca then raise exception 'Cobranca ja cancelada'; end if;
  update public.cobrancas set status='cancelada',motivo_cancelamento=btrim(p_motivo) where id=p_cobranca_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.concluir_onboarding()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode concluir o onboarding'; end if;
  if not exists(select 1 from public.modalidades where ativo)
    or not exists(select 1 from public.salas where ativo)
    or not exists(select 1 from public.professores where ativo)
    or not exists(select 1 from public.turmas where ativo) then
    raise exception 'Conclua todas as etapas antes de finalizar';
  end if;
  update public.usuarios set onboarding_concluido=true, atualizado_em=now() where id=auth.uid();
end $function$
;

CREATE OR REPLACE FUNCTION public.cpf_valido(p_cpf text)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE STRICT
AS $function$
declare
  c text := regexp_replace(p_cpf,'\D','','g'); s integer; i integer; d1 integer; d2 integer;
begin
  if c !~ '^\d{11}$' or c ~ '^(\d)\1{10}$' then return false; end if;
  s := 0; for i in 1..9 loop s := s + substring(c,i,1)::integer * (11-i); end loop;
  d1 := case when (s * 10) % 11 = 10 then 0 else (s * 10) % 11 end;
  s := 0; for i in 1..10 loop s := s + substring(c,i,1)::integer * (12-i); end loop;
  d2 := case when (s * 10) % 11 = 10 then 0 else (s * 10) % 11 end;
  return d1=substring(c,10,1)::integer and d2=substring(c,11,1)::integer;
end $function$
;

CREATE OR REPLACE FUNCTION public.criar_matricula_com_contrato(p_nome text, p_cpf text, p_data_nascimento date, p_telefone text, p_email text, p_turma_ids uuid[], p_responsavel_nome text DEFAULT NULL::text, p_responsavel_cpf text DEFAULT NULL::text, p_responsavel_telefone text DEFAULT NULL::text, p_texto_contrato text DEFAULT NULL::text, p_dia_vencimento integer DEFAULT 10)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_aluno public.alunos%rowtype; v_turma public.turmas%rowtype;
  v_turma_id uuid; v_contrato_id uuid; v_ocupacao integer; v_idade integer;
  v_valor numeric(12,2) := 0; v_token text;
  v_cpf text := regexp_replace(coalesce(p_cpf,''), '\D','','g');
  v_resp_cpf text := regexp_replace(coalesce(p_responsavel_cpf,''), '\D','','g');
  v_tel text := regexp_replace(coalesce(p_telefone,''), '\D','','g');
  v_resp_tel text := regexp_replace(coalesce(p_responsavel_telefone,''), '\D','','g');
begin
  if public.meu_papel() <> 'gestao' then raise exception 'Apenas a gestao pode criar matriculas'; end if;
  if length(trim(coalesce(p_nome,''))) < 3 then raise exception 'Nome completo invalido'; end if;
  if not public.cpf_valido(v_cpf) then raise exception 'CPF invalido'; end if;
  if p_data_nascimento is null or p_data_nascimento > current_date then raise exception 'Data de nascimento invalida'; end if;
  if v_tel !~ '^\d{10,11}$' then raise exception 'Telefone invalido'; end if;
  if coalesce(trim(p_email),'') !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then raise exception 'E-mail invalido'; end if;
  if coalesce(array_length(p_turma_ids,1),0) = 0 then raise exception 'Selecione ao menos uma turma'; end if;
  if (select count(*) from unnest(p_turma_ids) x) <> (select count(distinct x) from unnest(p_turma_ids) x) then raise exception 'Turma repetida'; end if;

  v_idade := extract(year from age(current_date,p_data_nascimento));
  if v_idade < 18 and (length(trim(coalesce(p_responsavel_nome,''))) < 3 or not public.cpf_valido(v_resp_cpf) or v_resp_tel !~ '^\d{10,11}$') then
    raise exception 'Dados completos do responsavel sao obrigatorios para menor';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_cpf,0));
  if exists (select 1 from public.alunos a where regexp_replace(coalesce(a.cpf,''),'\D','','g')=v_cpf) then raise exception 'Ja existe aluno com este CPF'; end if;

  foreach v_turma_id in array (select array_agg(x order by x) from unnest(p_turma_ids) x) loop
    select * into v_turma from public.turmas where id=v_turma_id for update;
    if not found then raise exception 'Turma nao encontrada'; end if;
    if not v_turma.ativo then raise exception 'Uma turma selecionada esta inativa'; end if;
    select count(*) into v_ocupacao from public.matriculas_turma where turma_id=v_turma_id and data_fim is null;
    if v_ocupacao >= v_turma.capacidade_maxima then raise exception 'Uma turma selecionada esta lotada'; end if;
    select v_valor + m.valor_padrao_mensalidade into v_valor from public.modalidades m where m.id=v_turma.modalidade_id and m.ativo;
    if v_valor is null then raise exception 'Modalidade inativa ou inexistente'; end if;
  end loop;

  insert into public.alunos(nome,cpf,data_nascimento,telefone,email,responsavel_nome,responsavel_cpf,responsavel_telefone,status,cessao_imagem_aceita,data_matricula)
  values(trim(p_nome),v_cpf,p_data_nascimento,v_tel,lower(trim(p_email)),case when v_idade<18 then trim(p_responsavel_nome) end,
    case when v_idade<18 then v_resp_cpf end,case when v_idade<18 then v_resp_tel end,'ativo',false,current_date)
  returning * into v_aluno;

  insert into public.matriculas_turma(aluno_id,turma_id,data_inicio) select v_aluno.id,x,current_date from unnest(p_turma_ids) x;
  v_token := encode(gen_random_bytes(32),'hex');
  insert into public.contratos(aluno_id,texto_gerado,status,token,token_expira_em,valor_mensalidade,dia_vencimento,data_envio)
  values(v_aluno.id,coalesce(nullif(trim(p_texto_contrato),''),'Contrato de Prestacao de Servicos Musicais - Pop Music'),
    'aguardando_assinatura',v_token,now()+interval '7 days',v_valor,p_dia_vencimento,now()) returning id into v_contrato_id;

  return jsonb_build_object('aluno_id',v_aluno.id,'aluno_nome',v_aluno.nome,'telefone',v_aluno.telefone,'email',v_aluno.email,
    'contrato_id',v_contrato_id,'token',v_token,'token_expira_em',now()+interval '7 days','valor_mensalidade',v_valor);
end $function$
;

CREATE OR REPLACE FUNCTION public.definir_autor_acesso(p_actor_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if p_actor_id is null or not exists (
    select 1
    from public.usuarios u
    where u.id = p_actor_id
      and u.papel = 'gestao'::public.papel_usuario
      and u.ativo is true
  ) then
    raise exception 'ATOR_GESTAO_INVALIDO';
  end if;

  perform pg_catalog.set_config('request.jwt.claim.sub', p_actor_id::text, true);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.destrancar_aluno(p_aluno_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_inicio date; v_turma_id uuid; v_cap integer; v_ocupacao integer;
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode destrancar matriculas'; end if;
  select data_inicio_trancamento into v_inicio from public.alunos where id=p_aluno_id and status='trancado' for update;
  if not found or v_inicio is null then raise exception 'Aluno nao esta trancado'; end if;
  select turma_id into v_turma_id from public.matriculas_turma where aluno_id=p_aluno_id order by data_fim desc nulls last,criado_em desc limit 1;
  if v_turma_id is null then raise exception 'Aluno nao possui turma anterior'; end if;
  select capacidade_maxima into v_cap from public.turmas where id=v_turma_id and ativo for update;
  if not found then raise exception 'A turma anterior esta inativa. Use a edicao para escolher outra turma'; end if;
  select count(*) into v_ocupacao from public.matriculas_turma where turma_id=v_turma_id and data_fim is null;
  if v_ocupacao>=v_cap then raise exception 'A turma anterior esta lotada. Escolha outra turma'; end if;
  insert into public.matriculas_turma(aluno_id,turma_id,data_inicio) values(p_aluno_id,v_turma_id,current_date);
  update public.contratos set data_fim_vigencia=data_fim_vigencia+(current_date-v_inicio) where aluno_id=p_aluno_id and status='aceito' and data_fim_vigencia is not null;
  update public.alunos set status='ativo',data_inicio_trancamento=null,motivo_trancamento=null where id=p_aluno_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.estornar_pagamento_manual(p_cobranca_id uuid, p_conta_id uuid, p_data_estorno date, p_motivo text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_cobranca public.cobrancas%rowtype;
  v_recibo_id uuid;
  v_fluxo_original_id uuid;
  v_fluxo_estorno_id uuid;
  v_estorno_id uuid;
  v_motivo text := btrim(coalesce(p_motivo, ''));
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then
    raise exception 'Somente a gestão pode estornar pagamentos';
  end if;
  if length(v_motivo) < 5 then
    raise exception 'Informe um motivo de estorno com pelo menos 5 caracteres';
  end if;
  if p_data_estorno is null or p_data_estorno > current_date then
    raise exception 'A data do estorno é inválida ou está no futuro';
  end if;
  if not exists (
    select 1 from public.contas_financeiras
    where id = p_conta_id and ativo = true
  ) then
    raise exception 'Conta financeira inválida ou inativa';
  end if;

  select * into v_cobranca
  from public.cobrancas
  where id = p_cobranca_id
  for update;

  if not found then raise exception 'Cobrança não encontrada'; end if;
  if v_cobranca.status <> 'paga'::public.status_cobranca then
    raise exception 'Somente uma cobrança paga pode ser estornada';
  end if;
  if exists (select 1 from public.estornos_pagamento where cobranca_id = p_cobranca_id) then
    raise exception 'Esta cobrança já possui estorno';
  end if;

  select id into v_recibo_id
  from public.recibos
  where cobranca_id = p_cobranca_id
  for update;
  if not found then raise exception 'O recibo original da cobrança não foi encontrado'; end if;

  select id into v_fluxo_original_id
  from public.fluxo_caixa
  where origem_tipo = 'cobranca'
    and origem_id = p_cobranca_id
    and tipo = 'entrada'
  order by criado_em desc
  limit 1
  for update;
  if not found then raise exception 'A entrada original no caixa não foi encontrada'; end if;

  insert into public.fluxo_caixa (
    tipo, descricao, valor, data, conta_id, categoria,
    origem, origem_tipo, origem_id, criado_por
  ) values (
    'saida', 'Estorno - ' || coalesce(v_cobranca.descricao, 'Cobrança'),
    v_cobranca.valor, p_data_estorno, p_conta_id, 'Estorno',
    'manual', 'estorno_cobranca', p_cobranca_id, auth.uid()
  ) returning id into v_fluxo_estorno_id;

  insert into public.estornos_pagamento (
    cobranca_id, recibo_id, fluxo_caixa_original_id, fluxo_caixa_estorno_id,
    conta_id, valor, data_estorno, motivo, criado_por
  ) values (
    p_cobranca_id, v_recibo_id, v_fluxo_original_id, v_fluxo_estorno_id,
    p_conta_id, v_cobranca.valor, p_data_estorno, v_motivo, auth.uid()
  ) returning id into v_estorno_id;

  update public.cobrancas
  set status = 'cancelada'::public.status_cobranca,
      motivo_cancelamento = 'Estorno: ' || v_motivo
  where id = p_cobranca_id;

  return v_estorno_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.excluir_aluno_definitivamente(p_aluno_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
  v_usuario_id uuid;
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then
    raise exception 'Apenas a gestão pode excluir alunos';
  end if;

  select usuario_id
    into v_usuario_id
    from public.alunos
   where id = p_aluno_id
   for update;

  if not found then
    raise exception 'Aluno não encontrado';
  end if;

  delete from public.repasse_itens where aluno_id = p_aluno_id;
  delete from public.comissoes_professor_aluno where aluno_id = p_aluno_id;
  delete from public.presencas where aluno_id = p_aluno_id;
  delete from public.recibos
   where cobranca_id in (select id from public.cobrancas where aluno_id = p_aluno_id);
  delete from public.fluxo_caixa
   where origem_id in (select id from public.cobrancas where aluno_id = p_aluno_id);
  delete from public.cobrancas where aluno_id = p_aluno_id;
  delete from public.contratos where aluno_id = p_aluno_id;
  delete from public.matriculas_turma where aluno_id = p_aluno_id;
  delete from public.alunos where id = p_aluno_id;

  if v_usuario_id is not null then
    delete from auth.users where id = v_usuario_id;
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_papel_texto text := pg_catalog.lower(coalesce(new.raw_app_meta_data ->> 'papel', ''));
  v_papel public.papel_usuario := 'aluno'::public.papel_usuario;
  v_ativo boolean := true;
  v_nome text;
begin
  if v_papel_texto in ('gestao', 'professor', 'aluno') then
    v_papel := v_papel_texto::public.papel_usuario;
  end if;

  -- Identidades administrativas so ficam ativas depois que a RPC valida o
  -- gestor autor e conclui o perfil/vinculo. Isso fecha a janela entre o Auth
  -- criado e uma eventual falha no provisionamento PostgreSQL.
  if v_papel in ('gestao'::public.papel_usuario, 'professor'::public.papel_usuario) then
    v_ativo := false;
  end if;

  v_nome := coalesce(
    nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'nome'), ''),
    nullif(pg_catalog.split_part(coalesce(new.email, ''), '@', 1), ''),
    'Usuario'
  );

  insert into public.usuarios (id, nome, papel, ativo)
  values (new.id, v_nome, v_papel, v_ativo)
  on conflict (id) do update
    set nome = excluded.nome,
        papel = excluded.papel,
        ativo = excluded.ativo;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.inativar_turma(p_turma_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode inativar turmas'; end if;
  perform 1 from public.turmas where id=p_turma_id and ativo for update;
  if not found then raise exception 'Turma ativa nao encontrada'; end if;
  if exists(select 1 from public.matriculas_turma where turma_id=p_turma_id and data_fim is null) then
    raise exception 'A turma possui matriculas ativas. Transfira ou encerre os vinculos antes de inativar';
  end if;
  update public.turmas set ativo=false where id=p_turma_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.limpar_acesso_usuario_incompleto(p_actor_id uuid, p_usuario_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform public.definir_autor_acesso(p_actor_id);
  if p_usuario_id is null then
    raise exception 'USUARIO_INVALIDO';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('popmusic-acesso:' || p_usuario_id::text, 0)
  );

  if exists (select 1 from public.alunos a where a.usuario_id = p_usuario_id)
     or exists (select 1 from public.professores p where p.usuario_id = p_usuario_id) then
    return false;
  end if;

  delete from public.usuarios where id = p_usuario_id;
  return true;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.marcar_contrato_anterior_renovado()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if new.status = 'aceito' and old.status is distinct from new.status and new.contrato_anterior_id is not null then
    update public.contratos
       set status = 'renovado'
     where id = new.contrato_anterior_id and status = 'aceito';
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.meu_aluno_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select a.id
  from public.alunos a
  where a.usuario_id = auth.uid()
  limit 1
$function$
;

CREATE OR REPLACE FUNCTION public.meu_papel()
 RETURNS public.papel_usuario
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select u.papel
  from public.usuarios u
  where u.id = auth.uid()
    and u.ativo = true
  limit 1
$function$
;

CREATE OR REPLACE FUNCTION public.meu_professor_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select p.id
  from public.professores p
  where p.usuario_id = auth.uid()
    and p.ativo = true
  limit 1
$function$
;

CREATE OR REPLACE FUNCTION public.obter_resumo_financeiro(p_referencia date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_inicio date := date_trunc('month', p_referencia)::date;
  v_fim date := (date_trunc('month', p_referencia) + interval '1 month')::date;
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then
    raise exception 'Somente a gestão pode consultar o resumo financeiro';
  end if;
  return jsonb_build_object(
    'a_receber_mes', coalesce((select sum(valor) from public.cobrancas where vencimento >= v_inicio and vencimento < v_fim and status in ('pendente'::public.status_cobranca, 'atrasada'::public.status_cobranca)), 0),
    'recebido_mes', coalesce((select sum(case when tipo = 'entrada' then valor else -valor end) from public.fluxo_caixa where data >= v_inicio and data < v_fim and origem_tipo in ('cobranca', 'estorno_cobranca')), 0),
    'em_atraso', coalesce((select sum(valor) from public.cobrancas where vencimento < p_referencia and status in ('pendente'::public.status_cobranca, 'atrasada'::public.status_cobranca)), 0),
    'saldo_caixa', coalesce((select sum(saldo_inicial) from public.contas_financeiras), 0) + coalesce((select sum(case when tipo = 'entrada' then valor else -valor end) from public.fluxo_caixa), 0),
    'referencia', p_referencia
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.obter_usuario_auth_por_email(p_email text)
 RETURNS TABLE(usuario_id uuid, email text, papel text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select
    au.id,
    au.email::text,
    pg_catalog.lower(coalesce(au.raw_app_meta_data ->> 'papel', ''))
  from auth.users au
  where pg_catalog.lower(pg_catalog.btrim(au.email)) = pg_catalog.lower(pg_catalog.btrim(p_email))
    and au.deleted_at is null
  order by au.created_at
  limit 1
$function$
;

CREATE OR REPLACE FUNCTION public.pagar_repasse_professor(p_professor_id uuid, p_mes date, p_conta_id uuid, p_forma_pagamento public.forma_pagamento, p_data_pagamento date)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_mes date := date_trunc('month', p_mes)::date;
  v_total numeric(12,2);
  v_repasse_id uuid;
  v_professor_nome text;
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then
    raise exception 'Somente a gestão pode pagar repasses';
  end if;
  if p_data_pagamento > current_date then
    raise exception 'A data do pagamento não pode estar no futuro';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_professor_id::text || v_mes::text, 0));

  select coalesce(sum(c.valor_repasse), 0), max(p.nome)
    into v_total, v_professor_nome
  from public.calcular_repasse_professor(p_professor_id, v_mes) c
  cross join public.professores p
  where p.id = p_professor_id;

  if v_total <= 0 then raise exception 'Não há mensalidade paga pendente de repasse'; end if;
  if not exists (select 1 from public.contas_financeiras where id = p_conta_id) then
    raise exception 'Conta financeira inválida';
  end if;

  insert into public.repasses_professor (
    professor_id, mes_referencia, status, forma_pagamento,
    data_pagamento, conta_financeira_id, valor_total
  ) values (
    p_professor_id, v_mes, 'pago', p_forma_pagamento,
    p_data_pagamento, p_conta_id, v_total
  ) returning id into v_repasse_id;

  insert into public.repasse_itens (
    repasse_id, cobranca_id, aluno_id, turma_id, presenca_id, valor,
    valor_base, tipo_comissao, valor_configurado, aulas_finalizadas
  )
  select
    v_repasse_id, c.cobranca_id, c.aluno_id, c.turma_id, null, c.valor_repasse,
    c.valor_base, c.tipo_comissao, c.valor_configurado, c.aulas_finalizadas::integer
  from public.calcular_repasse_professor(p_professor_id, v_mes) c;

  if not found then raise exception 'Nenhum item elegível foi reservado para repasse'; end if;

  insert into public.fluxo_caixa (
    tipo, descricao, valor, data, conta_id, categoria,
    origem, origem_tipo, origem_id, criado_por
  ) values (
    'saida', 'Pagamento Professor(a) ' || coalesce(v_professor_nome, ''),
    v_total, p_data_pagamento, p_conta_id, 'Repasse Professores',
    'automatico', 'repasse', v_repasse_id, auth.uid()
  );

  return v_repasse_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.proteger_snapshot_contrato()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if old.documento_assinado_snapshot is not null and
     (new.documento_assinado_snapshot is distinct from old.documento_assinado_snapshot or
      new.documento_assinado_hash is distinct from old.documento_assinado_hash) then
    raise exception 'A via assinada do contrato e imutavel';
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.provisionar_acesso_usuario(p_actor_id uuid, p_usuario_id uuid, p_nome text, p_email text, p_papel public.papel_usuario, p_professor_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_auth_email text;
  v_auth_papel text;
  v_papel_anterior public.papel_usuario;
  v_professor_email text;
  v_professor_ativo boolean;
  v_usuario_anterior uuid;
begin
  perform public.definir_autor_acesso(p_actor_id);

  if p_usuario_id is null then
    raise exception 'USUARIO_INVALIDO';
  end if;
  if pg_catalog.length(pg_catalog.btrim(coalesce(p_nome, ''))) < 3 then
    raise exception 'NOME_INVALIDO';
  end if;
  if p_papel is null
     or p_papel not in ('gestao'::public.papel_usuario, 'professor'::public.papel_usuario) then
    raise exception 'PAPEL_NAO_PERMITIDO';
  end if;
  if (p_papel = 'professor'::public.papel_usuario) <> (p_professor_id is not null) then
    raise exception 'VINCULO_PROFESSOR_INVALIDO';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('popmusic-acesso:' || p_usuario_id::text, 0)
  );

  select pg_catalog.lower(pg_catalog.btrim(au.email)),
         pg_catalog.lower(coalesce(au.raw_app_meta_data ->> 'papel', ''))
    into v_auth_email, v_auth_papel
  from auth.users au
  where au.id = p_usuario_id
  for update;

  if not found then
    raise exception 'AUTH_USUARIO_INEXISTENTE';
  end if;
  if v_auth_email is distinct from pg_catalog.lower(pg_catalog.btrim(p_email)) then
    raise exception 'EMAIL_AUTH_DIVERGENTE';
  end if;
  if v_auth_papel is distinct from p_papel::text then
    raise exception 'PAPEL_AUTH_DIVERGENTE';
  end if;

  -- Um perfil aluno so pode ser promovido quando for um residuo sem aluno nem
  -- professor vinculado. Papeis efetivamente em uso nunca sao sobrescritos.
  select u.papel
    into v_papel_anterior
  from public.usuarios u
  where u.id = p_usuario_id
  for update;

  if found and v_papel_anterior <> p_papel then
    if v_papel_anterior <> 'aluno'::public.papel_usuario
       or exists (select 1 from public.alunos a where a.usuario_id = p_usuario_id)
       or exists (
         select 1 from public.professores p
         where p.usuario_id = p_usuario_id
           and (p_professor_id is null or p.id <> p_professor_id)
       ) then
      raise exception 'PAPEL_JA_EM_USO';
    end if;
  end if;

  if exists (select 1 from public.alunos a where a.usuario_id = p_usuario_id) then
    raise exception 'USUARIO_VINCULADO_A_ALUNO';
  end if;

  if p_papel = 'professor'::public.papel_usuario then
    select pg_catalog.lower(pg_catalog.btrim(p.email)), p.ativo, p.usuario_id
      into v_professor_email, v_professor_ativo, v_usuario_anterior
    from public.professores p
    where p.id = p_professor_id
    for update;

    if not found or not coalesce(v_professor_ativo, false) then
      raise exception 'PROFESSOR_INEXISTENTE_OU_INATIVO';
    end if;
    if v_professor_email is distinct from v_auth_email then
      raise exception 'EMAIL_PROFESSOR_DIVERGENTE';
    end if;
    if exists (
      select 1 from public.professores p
      where p.usuario_id = p_usuario_id
        and p.id <> p_professor_id
    ) then
      raise exception 'USUARIO_VINCULADO_A_OUTRO_PROFESSOR';
    end if;

    if v_usuario_anterior is not null and v_usuario_anterior <> p_usuario_id then
      if exists (select 1 from auth.users au where au.id = v_usuario_anterior) then
        raise exception 'PROFESSOR_JA_POSSUI_AUTH_VALIDO';
      end if;
      if exists (select 1 from public.alunos a where a.usuario_id = v_usuario_anterior)
         or exists (
           select 1 from public.professores p
           where p.usuario_id = v_usuario_anterior
             and p.id <> p_professor_id
         ) then
        raise exception 'VINCULO_ORFAO_EM_USO';
      end if;

      update public.professores
         set usuario_id = null
       where id = p_professor_id
         and usuario_id = v_usuario_anterior;
      update public.usuarios u
         set ativo = false
       where u.id = v_usuario_anterior
         and not exists (select 1 from auth.users au where au.id = u.id);
    end if;
  elsif exists (select 1 from public.professores p where p.usuario_id = p_usuario_id) then
    raise exception 'USUARIO_VINCULADO_A_PROFESSOR';
  end if;

  insert into public.usuarios as target (id, nome, papel, ativo, onboarding_concluido)
  values (
    p_usuario_id,
    pg_catalog.btrim(p_nome),
    p_papel,
    true,
    p_papel = 'gestao'::public.papel_usuario
  )
  on conflict (id) do update
    set nome = excluded.nome,
        papel = excluded.papel,
        ativo = true,
        onboarding_concluido = case
          when excluded.papel = 'gestao'::public.papel_usuario then true
          else target.onboarding_concluido
        end;

  if p_papel = 'professor'::public.papel_usuario then
    update public.professores
       set usuario_id = p_usuario_id
     where id = p_professor_id
       and (usuario_id is null or usuario_id = p_usuario_id);

    if not found then
      raise exception 'FALHA_CONCORRENTE_VINCULO_PROFESSOR';
    end if;
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.regenerar_token_contrato(p_contrato_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare
  v_contrato public.contratos%rowtype;
  v_aluno public.alunos%rowtype;
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then raise exception 'Acesso negado'; end if;
  select * into v_contrato from public.contratos where id = p_contrato_id for update;
  if not found then raise exception 'Contrato nao encontrado'; end if;
  if v_contrato.status not in ('aguardando_assinatura','expirado') then raise exception 'Contrato nao permite reenvio'; end if;

  update public.contratos set
    token = encode(gen_random_bytes(32),'hex'), token_expira_em = now() + interval '7 days',
    data_envio = now(), status = 'aguardando_assinatura'
  where id = v_contrato.id returning * into v_contrato;
  select * into v_aluno from public.alunos where id = v_contrato.aluno_id;

  return jsonb_build_object(
    'contrato_id', v_contrato.id, 'token', v_contrato.token,
    'token_expira_em', v_contrato.token_expira_em, 'aluno_nome', v_aluno.nome,
    'aluno_email', v_aluno.email, 'responsavel_nome', v_aluno.responsavel_nome,
    'responsavel_email', v_aluno.responsavel_email, 'valor_mensalidade', v_contrato.valor_mensalidade,
    'dia_vencimento', v_contrato.dia_vencimento
  );
end $function$
;

CREATE OR REPLACE FUNCTION public.registrar_auditoria_automatica()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_antes jsonb; v_depois jsonb; v_registro uuid; v_usuario uuid;
begin
  v_antes := case when tg_op in ('UPDATE','DELETE') then public.sanitizar_auditoria(tg_table_name,to_jsonb(old)) end;
  v_depois := case when tg_op in ('INSERT','UPDATE') then public.sanitizar_auditoria(tg_table_name,to_jsonb(new)) end;
  v_registro := case when tg_op='DELETE' then old.id else new.id end;
  v_usuario := auth.uid();

  insert into public.auditoria(tabela,registro_id,acao,usuario_id,dados_antes,dados_depois)
  values(tg_table_name,v_registro,lower(tg_op),v_usuario,v_antes,v_depois);
  return case when tg_op='DELETE' then old else new end;
end $function$
;

CREATE OR REPLACE FUNCTION public.registrar_pagamento_manual(p_cobranca_id uuid, p_forma_pagamento public.forma_pagamento, p_data_pagamento date, p_conta_id uuid, p_observacao text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_cobranca public.cobrancas%rowtype;
  v_recibo_id uuid;
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then
    raise exception 'Somente a gestão pode registrar pagamentos';
  end if;

  select * into v_cobranca
  from public.cobrancas
  where id = p_cobranca_id
  for update;

  if not found then raise exception 'Cobrança não encontrada'; end if;
  if v_cobranca.status = 'paga'::public.status_cobranca then
    raise exception 'Esta cobrança já foi paga';
  end if;
  if v_cobranca.status = 'cancelada'::public.status_cobranca then
    raise exception 'Não é possível pagar uma cobrança cancelada';
  end if;
  if p_data_pagamento > current_date then
    raise exception 'A data do pagamento não pode estar no futuro';
  end if;
  if not exists (select 1 from public.contas_financeiras where id = p_conta_id) then
    raise exception 'Conta financeira inválida';
  end if;

  update public.cobrancas
  set status = 'paga',
      forma_pagamento = p_forma_pagamento,
      data_pagamento = p_data_pagamento,
      observacao_pagamento = nullif(trim(p_observacao), ''),
      recebido_por = auth.uid()
  where id = p_cobranca_id;

  insert into public.recibos (cobranca_id)
  values (p_cobranca_id)
  on conflict (cobranca_id) do update set cobranca_id = excluded.cobranca_id
  returning id into v_recibo_id;

  insert into public.fluxo_caixa (
    tipo, descricao, valor, data, conta_id, categoria,
    origem, origem_tipo, origem_id, criado_por
  ) values (
    'entrada', v_cobranca.descricao, v_cobranca.valor,
    p_data_pagamento, p_conta_id, 'Mensalidade',
    'manual', 'cobranca', p_cobranca_id, auth.uid()
  );

  return v_recibo_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.renovar_contrato(p_contrato_id uuid, p_valor_mensalidade numeric, p_dia_vencimento integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare
  v_anterior public.contratos%rowtype;
  v_novo public.contratos%rowtype;
  v_aluno public.alunos%rowtype;
  v_texto text;
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then raise exception 'Acesso negado'; end if;
  if p_valor_mensalidade is null or p_valor_mensalidade <= 0 then raise exception 'Valor da mensalidade invalido'; end if;
  if p_dia_vencimento not between 1 and 28 then raise exception 'Dia de vencimento deve estar entre 1 e 28'; end if;

  select * into v_anterior from public.contratos where id = p_contrato_id for update;
  if not found then raise exception 'Contrato anterior nao encontrado'; end if;
  if v_anterior.status <> 'aceito' then raise exception 'Somente contrato aceito pode ser renovado'; end if;
  if exists (
    select 1 from public.contratos
    where contrato_anterior_id = v_anterior.id and status in ('aguardando_assinatura','aceito')
  ) then raise exception 'Ja existe renovacao ativa para este contrato'; end if;

  select * into v_aluno from public.alunos where id = v_anterior.aluno_id;
  select mc.texto into v_texto from public.modelos_contrato mc where mc.ativo order by mc.versao desc limit 1;

  insert into public.contratos (
    aluno_id, modelo_contrato_id, texto_gerado, status, token, token_expira_em,
    valor_mensalidade, dia_vencimento, data_envio, contrato_anterior_id
  ) values (
    v_anterior.aluno_id, null, coalesce(v_texto, v_anterior.texto_gerado),
    'aguardando_assinatura', encode(gen_random_bytes(32),'hex'), now() + interval '7 days',
    p_valor_mensalidade, p_dia_vencimento, now(), v_anterior.id
  ) returning * into v_novo;

  return jsonb_build_object(
    'contrato_id', v_novo.id, 'contrato_anterior_id', v_anterior.id,
    'token', v_novo.token, 'token_expira_em', v_novo.token_expira_em,
    'aluno_nome', v_aluno.nome, 'aluno_email', v_aluno.email,
    'responsavel_nome', v_aluno.responsavel_nome, 'responsavel_email', v_aluno.responsavel_email,
    'valor_mensalidade', v_novo.valor_mensalidade, 'dia_vencimento', v_novo.dia_vencimento
  );
end $function$
;

CREATE OR REPLACE FUNCTION public.reparar_vinculo_professor_orfao(p_actor_id uuid, p_professor_id uuid, p_usuario_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_usuario_atual uuid;
begin
  perform public.definir_autor_acesso(p_actor_id);
  if p_professor_id is null or p_usuario_id is null then
    raise exception 'PARAMETROS_REPARO_INVALIDOS';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('popmusic-acesso:' || p_usuario_id::text, 0)
  );

  select p.usuario_id
    into v_usuario_atual
  from public.professores p
  where p.id = p_professor_id
  for update;

  if not found or v_usuario_atual is distinct from p_usuario_id then
    return false;
  end if;
  if exists (select 1 from auth.users au where au.id = p_usuario_id) then
    raise exception 'AUTH_USUARIO_AINDA_EXISTE';
  end if;
  if exists (select 1 from public.alunos a where a.usuario_id = p_usuario_id)
     or exists (
       select 1 from public.professores p
       where p.usuario_id = p_usuario_id
         and p.id <> p_professor_id
     ) then
    raise exception 'VINCULO_ORFAO_EM_USO';
  end if;

  update public.professores
     set usuario_id = null
   where id = p_professor_id
     and usuario_id = p_usuario_id;

  if not found then
    return false;
  end if;

  update public.usuarios u
     set ativo = false
   where u.id = p_usuario_id
     and not exists (select 1 from auth.users au where au.id = u.id);
  return true;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.resumo_cobrancas()
 RETURNS TABLE(a_receber numeric, recebido numeric, atrasado numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then
    raise exception 'Apenas a gestão pode consultar o resumo de cobranças';
  end if;

  return query
  select
    coalesce(sum(c.valor) filter (
      where c.status in ('pendente'::public.status_cobranca, 'atrasada'::public.status_cobranca)
    ), 0) as a_receber,
    coalesce(sum(c.valor) filter (
      where c.status = 'paga'::public.status_cobranca
        and c.data_pagamento >= date_trunc('month', current_date)::date
        and c.data_pagamento < (date_trunc('month', current_date) + interval '1 month')::date
    ), 0) as recebido,
    coalesce(sum(c.valor) filter (
      where c.status = 'atrasada'::public.status_cobranca
         or (c.status = 'pendente'::public.status_cobranca and c.vencimento < current_date)
    ), 0) as atrasado
  from public.cobrancas c;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.resumo_contratos()
 RETURNS TABLE(aguardando bigint, aceitos_mes bigint, vencendo bigint, total bigint, total_aceitos bigint, taxa_aceite numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then
    raise exception 'Apenas a gestão pode consultar o resumo de contratos';
  end if;

  return query
  with totais as (
    select
      count(*) filter (
        where c.status = 'aguardando_assinatura'::public.status_contrato
          and (c.token_expira_em is null or c.token_expira_em >= now())
      ) as aguardando,
      count(*) filter (
        where c.status = 'aceito'::public.status_contrato
          and c.data_aceite >= date_trunc('month', current_date)
          and c.data_aceite < date_trunc('month', current_date) + interval '1 month'
      ) as aceitos_mes,
      count(*) filter (
        where c.status = 'aceito'::public.status_contrato
          and c.data_fim_vigencia >= current_date
          and c.data_fim_vigencia <= current_date + 30
      ) as vencendo,
      count(*) as total,
      count(*) filter (where c.status = 'aceito'::public.status_contrato) as total_aceitos
    from public.contratos c
  )
  select
    t.aguardando,
    t.aceitos_mes,
    t.vencendo,
    t.total,
    t.total_aceitos,
    case when t.total = 0 then 0
      else round(t.total_aceitos::numeric * 100 / t.total, 2)
    end
  from totais t;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.resumo_fluxo_caixa(p_conta_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(entradas numeric, saidas numeric, saldo numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then
    raise exception 'Apenas a gestão pode consultar o resumo do fluxo de caixa';
  end if;

  if p_conta_id is not null and not exists (
    select 1 from public.contas_financeiras where id = p_conta_id
  ) then raise exception 'Conta financeira inválida'; end if;

  return query
  with movimento as (
    select
      coalesce(sum(f.valor) filter (where f.tipo = 'entrada'::public.tipo_lancamento_caixa), 0) as entradas,
      coalesce(sum(f.valor) filter (where f.tipo = 'saida'::public.tipo_lancamento_caixa), 0) as saidas
    from public.fluxo_caixa f
    where p_conta_id is null or f.conta_id = p_conta_id
  ), inicial as (
    select coalesce(sum(c.saldo_inicial), 0) as valor
    from public.contas_financeiras c
    where c.ativo = true and (p_conta_id is null or c.id = p_conta_id)
  )
  select m.entradas, m.saidas, i.valor + m.entradas - m.saidas
  from movimento m cross join inicial i;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.salvar_aluno_com_turmas(p_aluno_id uuid, p_nome text, p_cpf text, p_data_nascimento date, p_telefone text, p_email text, p_turma_ids uuid[], p_responsavel_nome text DEFAULT NULL::text, p_responsavel_cpf text DEFAULT NULL::text, p_responsavel_telefone text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then raise exception 'Apenas a gestao pode editar alunos'; end if;
  if length(trim(coalesce(p_nome, ''))) < 3 then raise exception 'Nome invalido'; end if;
  if p_data_nascimento is null or p_data_nascimento > current_date then raise exception 'Data de nascimento invalida'; end if;
  if coalesce(array_length(p_turma_ids, 1), 0) = 0 then raise exception 'Selecione ao menos uma turma'; end if;

  update public.alunos set
    nome=trim(p_nome), cpf=regexp_replace(p_cpf, '\D', '', 'g'), data_nascimento=p_data_nascimento,
    telefone=regexp_replace(p_telefone, '\D', '', 'g'), email=lower(trim(p_email)),
    responsavel_nome=nullif(trim(p_responsavel_nome), ''),
    responsavel_cpf=nullif(regexp_replace(coalesce(p_responsavel_cpf, ''), '\D', '', 'g'), ''),
    responsavel_telefone=nullif(regexp_replace(coalesce(p_responsavel_telefone, ''), '\D', '', 'g'), '')
  where id=p_aluno_id;
  if not found then raise exception 'Aluno nao encontrado'; end if;
  perform public.atualizar_turmas_aluno(p_aluno_id, p_turma_ids);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.salvar_modalidade(p_id uuid, p_nome text, p_valor numeric, p_cor text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid; v_nome text:=btrim(coalesce(p_nome,''));
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode salvar modalidades'; end if;
  if length(v_nome)<2 then raise exception 'Nome da modalidade invalido'; end if;
  if p_valor is null or p_valor<0 then raise exception 'Valor da mensalidade invalido'; end if;
  if coalesce(p_cor,'') !~ '^#[0-9A-Fa-f]{6}$' then raise exception 'Cor invalida'; end if;
  perform pg_advisory_xact_lock(hashtextextended('modalidade:'||lower(v_nome),0));
  if p_id is null then
    insert into public.modalidades(nome,valor_padrao_mensalidade,cor_calendario,ativo)
    values(v_nome,p_valor,upper(p_cor),true) returning id into v_id;
  else
    update public.modalidades set nome=v_nome,valor_padrao_mensalidade=p_valor,cor_calendario=upper(p_cor)
    where id=p_id returning id into v_id;
    if v_id is null then raise exception 'Modalidade nao encontrada'; end if;
  end if;
  return v_id;
exception when unique_violation then raise exception 'Ja existe uma modalidade com este nome';
end $function$
;

CREATE OR REPLACE FUNCTION public.salvar_modelo_contrato(p_texto text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
  v_versao integer;
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then
    raise exception 'Apenas a gestao pode salvar modelos de contrato';
  end if;
  if length(trim(coalesce(p_texto, ''))) < 100 then
    raise exception 'O modelo de contrato precisa ter pelo menos 100 caracteres';
  end if;
  lock table public.modelos_contrato in share row exclusive mode;
  select coalesce(max(versao), 0) + 1 into v_versao from public.modelos_contrato;
  insert into public.modelos_contrato (texto, versao, ativo)
  values (trim(p_texto), v_versao, true) returning id into v_id;
  update public.modelos_contrato set ativo = false where ativo and id <> v_id;
  return v_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.salvar_professor(p_id uuid, p_nome text, p_cpf text, p_telefone text, p_email text, p_comissao_tipo public.tipo_comissao, p_comissao_valor numeric, p_modalidade_ids uuid[])
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid; v_cpf text:=regexp_replace(coalesce(p_cpf,''),'\D','','g');
  v_tel text:=regexp_replace(coalesce(p_telefone,''),'\D','','g');
  v_email text:=lower(trim(coalesce(p_email,'')));
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode salvar professores'; end if;
  if length(trim(coalesce(p_nome,'')))<3 then raise exception 'Nome completo invalido'; end if;
  if not public.cpf_valido(v_cpf) then raise exception 'CPF invalido'; end if;
  if v_tel !~ '^\d{10,11}$' then raise exception 'Telefone invalido'; end if;
  if v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then raise exception 'E-mail invalido'; end if;
  if p_comissao_valor<0 or (p_comissao_tipo='percentual' and p_comissao_valor>100) then raise exception 'Valor de repasse invalido'; end if;
  if coalesce(array_length(p_modalidade_ids,1),0)=0 then raise exception 'Selecione ao menos uma modalidade'; end if;
  if (select count(*) from unnest(p_modalidade_ids)x)<>(select count(distinct x) from unnest(p_modalidade_ids)x) then raise exception 'Modalidade repetida'; end if;
  if exists(select 1 from unnest(p_modalidade_ids)x left join public.modalidades m on m.id=x where m.id is null or not m.ativo) then raise exception 'Modalidade inexistente ou inativa'; end if;

  perform pg_advisory_xact_lock(hashtextextended('prof-cpf:'||v_cpf,0));
  perform pg_advisory_xact_lock(hashtextextended('prof-email:'||v_email,0));
  if exists(select 1 from public.professores where id<>coalesce(p_id,'00000000-0000-0000-0000-000000000000') and regexp_replace(coalesce(cpf,''),'\D','','g')=v_cpf) then raise exception 'Ja existe professor com este CPF'; end if;
  if exists(select 1 from public.professores where id<>coalesce(p_id,'00000000-0000-0000-0000-000000000000') and lower(trim(coalesce(email,'')))=v_email) then raise exception 'Ja existe professor com este e-mail'; end if;

  if p_id is null then
    insert into public.professores(nome,cpf,telefone,email,comissao_padrao_tipo,comissao_padrao_valor,ativo)
    values(trim(p_nome),v_cpf,v_tel,v_email,p_comissao_tipo,p_comissao_valor,true) returning id into v_id;
  else
    update public.professores set nome=trim(p_nome),cpf=v_cpf,telefone=v_tel,email=v_email,
      comissao_padrao_tipo=p_comissao_tipo,comissao_padrao_valor=p_comissao_valor where id=p_id returning id into v_id;
    if v_id is null then raise exception 'Professor nao encontrado'; end if;
  end if;

  delete from public.professor_modalidades where professor_id=v_id;
  insert into public.professor_modalidades(professor_id,modalidade_id) select v_id,x from unnest(p_modalidade_ids)x;
  return v_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.salvar_professor(p_id uuid, p_nome text, p_cpf text, p_telefone text, p_email text, p_comissao_tipo public.tipo_comissao, p_comissao_valor numeric, p_modalidade_ids uuid[], p_pix_chave text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
  v_cpf text := nullif(regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g'), '');
  v_tel text := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if public.meu_papel() <> 'gestao' then
    raise exception 'Apenas a gestao pode salvar professores';
  end if;
  if length(trim(coalesce(p_nome, ''))) < 3 then raise exception 'Nome completo invalido'; end if;
  if v_tel !~ '^\d{10,11}$' then raise exception 'Telefone invalido'; end if;
  if v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then raise exception 'E-mail invalido'; end if;
  if p_comissao_valor < 0 or (p_comissao_tipo = 'percentual' and p_comissao_valor > 100) then
    raise exception 'Valor de repasse invalido';
  end if;
  if coalesce(array_length(p_modalidade_ids, 1), 0) = 0 then
    raise exception 'Selecione ao menos uma modalidade';
  end if;
  if v_cpf is not null and exists (
    select 1 from public.professores
    where id <> coalesce(p_id, '00000000-0000-0000-0000-000000000000')
      and regexp_replace(coalesce(cpf, ''), '\D', '', 'g') = v_cpf
  ) then raise exception 'Ja existe professor com este CPF'; end if;
  if exists (
    select 1 from public.professores
    where id <> coalesce(p_id, '00000000-0000-0000-0000-000000000000')
      and lower(trim(coalesce(email, ''))) = v_email
  ) then raise exception 'Ja existe professor com este e-mail'; end if;

  if p_id is null then
    insert into public.professores (
      nome, cpf, telefone, email, comissao_padrao_tipo,
      comissao_padrao_valor, pix_chave, ativo
    ) values (
      trim(p_nome), v_cpf, v_tel, v_email, p_comissao_tipo,
      p_comissao_valor, nullif(trim(p_pix_chave), ''), true
    ) returning id into v_id;
  else
    update public.professores set
      nome = trim(p_nome),
      cpf = v_cpf,
      telefone = v_tel,
      email = v_email,
      comissao_padrao_tipo = p_comissao_tipo,
      comissao_padrao_valor = p_comissao_valor,
      pix_chave = nullif(trim(p_pix_chave), '')
    where id = p_id
    returning id into v_id;
    if v_id is null then raise exception 'Professor nao encontrado'; end if;
  end if;

  delete from public.professor_modalidades where professor_id = v_id;
  insert into public.professor_modalidades (professor_id, modalidade_id)
  select v_id, modalidade_id from unnest(p_modalidade_ids) as modalidade_id;
  return v_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.salvar_sala(p_id uuid, p_nome text, p_capacidade integer, p_modalidade_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid; v_nome text:=btrim(coalesce(p_nome,''));
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode salvar salas'; end if;
  if length(v_nome)<2 then raise exception 'Nome da sala invalido'; end if;
  if p_capacidade is null or p_capacidade<=0 then raise exception 'A capacidade deve ser maior que zero'; end if;
  if p_modalidade_id is not null and not exists(select 1 from public.modalidades where id=p_modalidade_id and ativo) then
    raise exception 'Modalidade padrao inexistente ou inativa';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('sala-nome:'||lower(v_nome),0));
  if p_id is null then
    insert into public.salas(nome,capacidade_padrao,modalidade_padrao_id,ativo)
    values(v_nome,p_capacidade,p_modalidade_id,true) returning id into v_id;
  else
    perform 1 from public.salas where id=p_id for update;
    if not found then raise exception 'Sala nao encontrada'; end if;
    if exists(select 1 from public.turmas where sala_id=p_id and ativo and capacidade_maxima>p_capacidade) then
      raise exception 'A capacidade e menor que a capacidade de uma turma ativa desta sala';
    end if;
    update public.salas set nome=v_nome,capacidade_padrao=p_capacidade,modalidade_padrao_id=p_modalidade_id
    where id=p_id returning id into v_id;
  end if;
  return v_id;
exception when unique_violation then raise exception 'Ja existe uma sala com este nome';
end $function$
;

CREATE OR REPLACE FUNCTION public.salvar_turma(p_id uuid, p_modalidade_id uuid, p_professor_id uuid, p_sala_id uuid, p_dia_semana integer, p_horario_inicio time without time zone, p_horario_fim time without time zone, p_capacidade_maxima integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid;
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode salvar turmas'; end if;
  if p_id is null then
    insert into public.turmas(modalidade_id,professor_id,sala_id,dia_semana,horario_inicio,horario_fim,capacidade_maxima,ativo)
    values(p_modalidade_id,p_professor_id,p_sala_id,p_dia_semana,p_horario_inicio,p_horario_fim,p_capacidade_maxima,true)
    returning id into v_id;
  else
    update public.turmas set modalidade_id=p_modalidade_id,professor_id=p_professor_id,sala_id=p_sala_id,
      dia_semana=p_dia_semana,horario_inicio=p_horario_inicio,horario_fim=p_horario_fim,
      capacidade_maxima=p_capacidade_maxima
    where id=p_id and ativo returning id into v_id;
    if v_id is null then raise exception 'Turma ativa nao encontrada'; end if;
  end if;
  return v_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.salvar_turmas_em_lote(p_modalidade_id uuid, p_professor_id uuid, p_sala_id uuid, p_dias_semana integer[], p_horario_inicio time without time zone, p_horario_fim time without time zone, p_capacidade_maxima integer)
 RETURNS uuid[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_dias integer[];
  v_dia integer;
  v_id uuid;
  v_ids uuid[] := array[]::uuid[];
begin
  if public.meu_papel() <> 'gestao' then
    raise exception 'Apenas a gestão pode cadastrar turmas.';
  end if;

  select array_agg(distinct dia order by dia)
    into v_dias
    from unnest(p_dias_semana) as dias(dia);

  if coalesce(array_length(v_dias, 1), 0) = 0 then
    raise exception 'Selecione ao menos um dia da semana.';
  end if;
  if exists (select 1 from unnest(v_dias) as dias(dia) where dia not between 0 and 6) then
    raise exception 'Existe um dia da semana inválido no lote.';
  end if;
  if p_horario_inicio is null or p_horario_fim is null or p_horario_fim <= p_horario_inicio then
    raise exception 'O horário final deve ser posterior ao horário inicial.';
  end if;
  if p_capacidade_maxima is null or p_capacidade_maxima < 1 then
    raise exception 'A capacidade máxima deve ser maior que zero.';
  end if;

  foreach v_dia in array v_dias loop
    insert into public.turmas (
      modalidade_id, professor_id, sala_id, dia_semana,
      horario_inicio, horario_fim, capacidade_maxima, ativo
    ) values (
      p_modalidade_id, p_professor_id, p_sala_id, v_dia,
      p_horario_inicio, p_horario_fim, p_capacidade_maxima, true
    ) returning id into v_id;

    v_ids := array_append(v_ids, v_id);
  end loop;

  if array_length(v_ids, 1) <> array_length(v_dias, 1) then
    raise exception 'Não foi possível criar todas as turmas do lote.';
  end if;

  return v_ids;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.sanitizar_auditoria(p_tabela text, p_dados jsonb)
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select case p_tabela
    when 'alunos' then p_dados - array['cpf','telefone','email','responsavel_cpf','responsavel_telefone','responsavel_email','foto_url','avatar_url']
    when 'professores' then p_dados - array['cpf','telefone','email']
    when 'contratos' then p_dados - array['token','texto_gerado','foto_assinatura_url','aceite_hash','aceite_ip','aceite_user_agent']
    when 'cobrancas' then p_dados - array['gateway_referencia']
    when 'usuarios' then p_dados - array['telefone']
    else p_dados
  end
$function$
;

CREATE OR REPLACE FUNCTION public.set_atualizado_em()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.atualizado_em = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.trancar_aluno(p_aluno_id uuid, p_motivo text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode trancar matriculas'; end if;
  if length(trim(coalesce(p_motivo,'')))<5 then raise exception 'Informe o motivo do trancamento'; end if;
  update public.alunos set status='trancado',data_inicio_trancamento=current_date,motivo_trancamento=trim(p_motivo) where id=p_aluno_id and status='ativo';
  if not found then raise exception 'Aluno nao esta ativo'; end if;
  update public.matriculas_turma set data_fim=current_date,motivo_fim='Trancamento: '||trim(p_motivo) where aluno_id=p_aluno_id and data_fim is null;
  update public.cobrancas set status='cancelada',motivo_cancelamento='Trancamento: '||trim(p_motivo)
    where aluno_id=p_aluno_id and status='pendente' and date_trunc('month',vencimento)>date_trunc('month',current_date);
end $function$
;

CREATE OR REPLACE FUNCTION public.turma_do_professor(p_turma_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists (
    select 1
    from public.turmas t
    where t.id = p_turma_id
      and t.professor_id = public.meu_professor_id()
  )
$function$
;

CREATE OR REPLACE FUNCTION public.validar_turma()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_capacidade_sala integer;
  v_matriculados integer;
begin
  if new.dia_semana not between 0 and 6 then raise exception 'Dia da semana invalido'; end if;
  if new.horario_inicio >= new.horario_fim then raise exception 'O horario inicial deve ser anterior ao final'; end if;
  if new.capacidade_maxima <= 0 then raise exception 'A capacidade da turma deve ser maior que zero'; end if;

  select capacidade_padrao into v_capacidade_sala from public.salas where id=new.sala_id and ativo for share;
  if not found then raise exception 'Sala inexistente ou inativa'; end if;
  if new.capacidade_maxima > v_capacidade_sala then raise exception 'A capacidade da turma ultrapassa a capacidade da sala (%)',v_capacidade_sala; end if;
  if not exists(select 1 from public.professores where id=new.professor_id and ativo) then raise exception 'Professor inexistente ou inativo'; end if;
  if not exists(select 1 from public.modalidades where id=new.modalidade_id and ativo) then raise exception 'Modalidade inexistente ou inativa'; end if;

  -- Serializa alteracoes da mesma agenda para impedir conflitos concorrentes.
  perform pg_advisory_xact_lock(hashtextextended('professor:'||new.professor_id||':'||new.dia_semana,0));
  perform pg_advisory_xact_lock(hashtextextended('sala:'||new.sala_id||':'||new.dia_semana,0));

  if new.ativo and exists(
    select 1 from public.turmas t where t.id<>coalesce(new.id,'00000000-0000-0000-0000-000000000000'::uuid)
      and t.ativo and t.dia_semana=new.dia_semana and t.professor_id=new.professor_id
      and t.horario_inicio < new.horario_fim and t.horario_fim > new.horario_inicio
  ) then raise exception 'O professor ja possui turma nesse horario'; end if;

  if new.ativo and exists(
    select 1 from public.turmas t where t.id<>coalesce(new.id,'00000000-0000-0000-0000-000000000000'::uuid)
      and t.ativo and t.dia_semana=new.dia_semana and t.sala_id=new.sala_id
      and t.horario_inicio < new.horario_fim and t.horario_fim > new.horario_inicio
  ) then raise exception 'A sala ja esta ocupada nesse horario'; end if;

  if tg_op='UPDATE' and new.capacidade_maxima < old.capacidade_maxima then
    select count(*) into v_matriculados from public.matriculas_turma where turma_id=new.id and data_fim is null;
    if new.capacidade_maxima < v_matriculados then raise exception 'A capacidade nao pode ser menor que os % alunos matriculados',v_matriculados; end if;
  end if;
  return new;
end $function$
;

alter table public.alunos add constraint alunos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;

alter table public.auditoria add constraint auditoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);

alter table public.chamadas_aula add constraint chamadas_aula_finalizada_por_fkey FOREIGN KEY (finalizada_por) REFERENCES public.usuarios(id) ON DELETE RESTRICT;

alter table public.chamadas_aula add constraint chamadas_aula_reaberta_por_fkey FOREIGN KEY (reaberta_por) REFERENCES public.usuarios(id) ON DELETE RESTRICT;

alter table public.chamadas_aula add constraint chamadas_aula_turma_id_fkey FOREIGN KEY (turma_id) REFERENCES public.turmas(id) ON DELETE RESTRICT;

alter table public.cobrancas add constraint cobrancas_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE;

alter table public.cobrancas add constraint cobrancas_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id);

alter table public.cobrancas add constraint cobrancas_recebido_por_fkey FOREIGN KEY (recebido_por) REFERENCES public.usuarios(id) ON DELETE RESTRICT;

alter table public.comissoes_professor_aluno add constraint comissoes_professor_aluno_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE;

alter table public.comissoes_professor_aluno add constraint comissoes_professor_aluno_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.professores(id) ON DELETE CASCADE;

alter table public.configuracoes add constraint configuracoes_atualizado_por_fkey FOREIGN KEY (atualizado_por) REFERENCES public.usuarios(id);

alter table public.contratos add constraint contratos_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE;

alter table public.contratos add constraint contratos_contrato_anterior_id_fkey FOREIGN KEY (contrato_anterior_id) REFERENCES public.contratos(id);

alter table public.contratos add constraint contratos_modelo_contrato_id_fkey FOREIGN KEY (modelo_contrato_id) REFERENCES public.modelos_contrato(id);

alter table public.estornos_pagamento add constraint estornos_pagamento_cobranca_id_fkey FOREIGN KEY (cobranca_id) REFERENCES public.cobrancas(id) ON DELETE RESTRICT;

alter table public.estornos_pagamento add constraint estornos_pagamento_conta_id_fkey FOREIGN KEY (conta_id) REFERENCES public.contas_financeiras(id) ON DELETE RESTRICT;

alter table public.estornos_pagamento add constraint estornos_pagamento_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.usuarios(id) ON DELETE RESTRICT;

alter table public.estornos_pagamento add constraint estornos_pagamento_fluxo_caixa_estorno_id_fkey FOREIGN KEY (fluxo_caixa_estorno_id) REFERENCES public.fluxo_caixa(id) ON DELETE RESTRICT;

alter table public.estornos_pagamento add constraint estornos_pagamento_fluxo_caixa_original_id_fkey FOREIGN KEY (fluxo_caixa_original_id) REFERENCES public.fluxo_caixa(id) ON DELETE RESTRICT;

alter table public.estornos_pagamento add constraint estornos_pagamento_recibo_id_fkey FOREIGN KEY (recibo_id) REFERENCES public.recibos(id) ON DELETE RESTRICT;

alter table public.fluxo_caixa add constraint fluxo_caixa_conta_id_fkey FOREIGN KEY (conta_id) REFERENCES public.contas_financeiras(id);

alter table public.fluxo_caixa add constraint fluxo_caixa_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.usuarios(id);

alter table public.matriculas_turma add constraint matriculas_turma_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE;

alter table public.matriculas_turma add constraint matriculas_turma_turma_id_fkey FOREIGN KEY (turma_id) REFERENCES public.turmas(id) ON DELETE CASCADE;

alter table public.presencas add constraint presencas_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE;

alter table public.presencas add constraint presencas_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES public.usuarios(id);

alter table public.presencas add constraint presencas_reposicao_de_id_fkey FOREIGN KEY (reposicao_de_id) REFERENCES public.presencas(id);

alter table public.presencas add constraint presencas_turma_id_fkey FOREIGN KEY (turma_id) REFERENCES public.turmas(id) ON DELETE CASCADE;

alter table public.professor_modalidades add constraint professor_modalidades_modalidade_id_fkey FOREIGN KEY (modalidade_id) REFERENCES public.modalidades(id) ON DELETE CASCADE;

alter table public.professor_modalidades add constraint professor_modalidades_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.professores(id) ON DELETE CASCADE;

alter table public.professores add constraint professores_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;

alter table public.recibos add constraint recibos_cobranca_id_fkey FOREIGN KEY (cobranca_id) REFERENCES public.cobrancas(id) ON DELETE CASCADE;

alter table public.relatorios_salvos add constraint relatorios_salvos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;

alter table public.repasse_itens add constraint repasse_itens_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.alunos(id);

alter table public.repasse_itens add constraint repasse_itens_cobranca_id_fkey FOREIGN KEY (cobranca_id) REFERENCES public.cobrancas(id) ON DELETE RESTRICT;

alter table public.repasse_itens add constraint repasse_itens_presenca_id_fkey FOREIGN KEY (presenca_id) REFERENCES public.presencas(id);

alter table public.repasse_itens add constraint repasse_itens_repasse_id_fkey FOREIGN KEY (repasse_id) REFERENCES public.repasses_professor(id) ON DELETE CASCADE;

alter table public.repasse_itens add constraint repasse_itens_turma_id_fkey FOREIGN KEY (turma_id) REFERENCES public.turmas(id) ON DELETE RESTRICT;

alter table public.repasses_professor add constraint fk_repasse_conta FOREIGN KEY (conta_financeira_id) REFERENCES public.contas_financeiras(id);

alter table public.repasses_professor add constraint repasses_professor_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.professores(id) ON DELETE CASCADE;

alter table public.salas add constraint salas_modalidade_padrao_id_fkey FOREIGN KEY (modalidade_padrao_id) REFERENCES public.modalidades(id) ON DELETE SET NULL;

alter table public.turmas add constraint turmas_modalidade_id_fkey FOREIGN KEY (modalidade_id) REFERENCES public.modalidades(id);

alter table public.turmas add constraint turmas_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.professores(id);

alter table public.turmas add constraint turmas_sala_id_fkey FOREIGN KEY (sala_id) REFERENCES public.salas(id);

alter table public.usuarios add constraint usuarios_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

create view public.vw_aluno_meu_contrato with (security_invoker=true) as  SELECT id,
    status,
    data_envio,
    data_aceite,
    data_fim_vigencia,
    pdf_url
   FROM public.contratos c
  WHERE aluno_id = public.meu_aluno_id();

create view public.vw_aluno_meu_perfil with (security_invoker=true) as  SELECT id,
    nome,
    email,
    telefone,
    endereco,
    tipo_sanguineo,
    status,
    data_matricula
   FROM public.alunos a
  WHERE id = public.meu_aluno_id();

create view public.vw_aluno_minha_frequencia with (security_invoker=true) as  SELECT pr.id,
    pr.turma_id,
    pr.data_aula,
    pr.status,
    pr.tipo_aula,
    m.nome AS modalidade
   FROM public.presencas pr
     JOIN public.turmas t ON t.id = pr.turma_id
     JOIN public.modalidades m ON m.id = t.modalidade_id
  WHERE pr.aluno_id = public.meu_aluno_id();

create view public.vw_aluno_minhas_cobrancas with (security_invoker=true) as  SELECT id,
    descricao,
    valor,
    vencimento,
    status,
    data_pagamento
   FROM public.cobrancas c
  WHERE aluno_id = public.meu_aluno_id();

create view public.vw_aluno_minhas_turmas with (security_invoker=true) as  SELECT t.id AS turma_id,
    t.dia_semana,
    t.horario_inicio,
    t.horario_fim,
    m.nome AS modalidade,
    p.nome AS professor,
    s.nome AS sala
   FROM public.matriculas_turma mt
     JOIN public.turmas t ON t.id = mt.turma_id
     JOIN public.modalidades m ON m.id = t.modalidade_id
     LEFT JOIN public.professores p ON p.id = t.professor_id
     LEFT JOIN public.salas s ON s.id = t.sala_id
  WHERE mt.aluno_id = public.meu_aluno_id() AND mt.data_fim IS NULL AND t.ativo = true;

create view public.vw_professor_agenda with (security_invoker=true) as  SELECT t.id AS turma_id,
    t.dia_semana,
    t.horario_inicio,
    t.horario_fim,
    t.capacidade_maxima,
    m.nome AS modalidade,
    m.cor_calendario,
    s.nome AS sala,
    count(mt.id) FILTER (WHERE mt.data_fim IS NULL) AS alunos_matriculados
   FROM public.turmas t
     JOIN public.modalidades m ON m.id = t.modalidade_id
     JOIN public.salas s ON s.id = t.sala_id
     LEFT JOIN public.matriculas_turma mt ON mt.turma_id = t.id
  WHERE t.ativo = true AND t.professor_id = public.meu_professor_id()
  GROUP BY t.id, m.nome, m.cor_calendario, s.nome;

create view public.vw_professor_alunos with (security_invoker=true) as  SELECT DISTINCT a.id,
    a.nome,
    NULL::text AS telefone,
    NULL::text AS email,
    a.status,
    NULL::text AS tipo_sanguineo,
    NULL::text AS emergencia_nome,
    NULL::text AS emergencia_telefone
   FROM public.alunos a
     JOIN public.matriculas_turma mt ON mt.aluno_id = a.id AND mt.data_fim IS NULL
     JOIN public.turmas t ON t.id = mt.turma_id
  WHERE a.status = 'ativo'::public.status_aluno AND t.ativo = true AND t.professor_id = public.meu_professor_id();

create view public.vw_professor_meu_repasse with (security_invoker=true) as  SELECT id,
    mes_referencia,
    valor_total,
    status,
    data_pagamento
   FROM public.repasses_professor r
  WHERE professor_id = public.meu_professor_id();

CREATE INDEX idx_alunos_nome ON public.alunos USING gin (to_tsvector('portuguese'::regconfig, nome));

CREATE INDEX idx_alunos_status ON public.alunos USING btree (status);

CREATE INDEX idx_alunos_usuario_id ON public.alunos USING btree (usuario_id);

CREATE INDEX idx_auditoria_data ON public.auditoria USING btree (criado_em DESC);

CREATE INDEX idx_auditoria_tabela_registro ON public.auditoria USING btree (tabela, registro_id);

CREATE INDEX idx_auditoria_usuario_data ON public.auditoria USING btree (usuario_id, criado_em DESC);

CREATE INDEX idx_chamadas_aula_data ON public.chamadas_aula USING btree (data_aula);

CREATE INDEX idx_chamadas_aula_finalizada_por ON public.chamadas_aula USING btree (finalizada_por);

CREATE UNIQUE INDEX uq_chamada_ativa_turma_data ON public.chamadas_aula USING btree (turma_id, data_aula) WHERE (ativa = true);

CREATE INDEX idx_cobrancas_aluno ON public.cobrancas USING btree (aluno_id);

CREATE INDEX idx_cobrancas_aluno_id ON public.cobrancas USING btree (aluno_id);

CREATE INDEX idx_cobrancas_contrato_id ON public.cobrancas USING btree (contrato_id);

CREATE INDEX idx_cobrancas_status_vencimento ON public.cobrancas USING btree (status, vencimento);

CREATE UNIQUE INDEX uq_cobrancas_contrato_vencimento ON public.cobrancas USING btree (contrato_id, vencimento) WHERE (contrato_id IS NOT NULL);

CREATE INDEX idx_comunicacoes_data ON public.comunicacoes USING btree (criado_em DESC);

CREATE INDEX idx_comunicacoes_destino ON public.comunicacoes USING btree (destinatario_hash, criado_em DESC);

CREATE INDEX idx_comunicacoes_status ON public.comunicacoes USING btree (status, criado_em DESC);

CREATE INDEX idx_contratos_aluno ON public.contratos USING btree (aluno_id);

CREATE INDEX idx_contratos_aluno_id ON public.contratos USING btree (aluno_id);

CREATE INDEX idx_contratos_documento_hash ON public.contratos USING btree (documento_assinado_hash) WHERE (documento_assinado_hash IS NOT NULL);

CREATE INDEX idx_contratos_status ON public.contratos USING btree (status);

CREATE INDEX idx_contratos_token ON public.contratos USING btree (token);

CREATE UNIQUE INDEX uq_contratos_token ON public.contratos USING btree (token);

CREATE INDEX idx_estornos_pagamento_data ON public.estornos_pagamento USING btree (data_estorno DESC);

CREATE UNIQUE INDEX idx_feriados_data_abrangencia ON public.feriados USING btree (data, abrangencia);

CREATE INDEX idx_fluxo_caixa_conta_data ON public.fluxo_caixa USING btree (conta_id, data);

CREATE UNIQUE INDEX idx_matricula_ativa_unica ON public.matriculas_turma USING btree (aluno_id, turma_id) WHERE (data_fim IS NULL);

CREATE INDEX idx_matriculas_aluno_turma ON public.matriculas_turma USING btree (aluno_id, turma_id);

CREATE INDEX idx_matriculas_turma_aluno ON public.matriculas_turma USING btree (aluno_id);

CREATE INDEX idx_matriculas_turma_turma ON public.matriculas_turma USING btree (turma_id);

CREATE UNIQUE INDEX uq_matricula_ativa_aluno_turma ON public.matriculas_turma USING btree (aluno_id, turma_id) WHERE (data_fim IS NULL);

CREATE UNIQUE INDEX modalidades_nome_unico ON public.modalidades USING btree (lower(btrim(nome)));

CREATE UNIQUE INDEX idx_presenca_unica ON public.presencas USING btree (aluno_id, turma_id, data_aula);

CREATE INDEX idx_presencas_aluno ON public.presencas USING btree (aluno_id);

CREATE INDEX idx_presencas_aluno_data ON public.presencas USING btree (aluno_id, data_aula);

CREATE INDEX idx_presencas_turma_data ON public.presencas USING btree (turma_id, data_aula);

CREATE UNIQUE INDEX uq_presencas_aluno_turma_data_tipo ON public.presencas USING btree (aluno_id, turma_id, data_aula, tipo_aula);

CREATE INDEX idx_professores_usuario_id ON public.professores USING btree (usuario_id);

CREATE UNIQUE INDEX uq_repasse_item_cobranca_turma ON public.repasse_itens USING btree (cobranca_id, turma_id) WHERE (cobranca_id IS NOT NULL);

CREATE INDEX idx_repasses_professor_id ON public.repasses_professor USING btree (professor_id);

CREATE UNIQUE INDEX salas_nome_unico ON public.salas USING btree (lower(btrim(nome)));

CREATE INDEX idx_tentativas_assinatura_ip_data ON public.tentativas_assinatura USING btree (ip_hash, criada_em DESC);

CREATE INDEX idx_tentativas_assinatura_token_data ON public.tentativas_assinatura USING btree (token_hash, criada_em DESC);

CREATE INDEX idx_turmas_professor ON public.turmas USING btree (professor_id);

CREATE INDEX idx_turmas_professor_id ON public.turmas USING btree (professor_id);

CREATE INDEX idx_turmas_sala_dia ON public.turmas USING btree (sala_id, dia_semana);

CREATE TRIGGER trg_alunos_atualizado BEFORE UPDATE ON public.alunos FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

CREATE TRIGGER trg_auditoria_automatica AFTER INSERT OR DELETE OR UPDATE ON public.alunos FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica();

CREATE TRIGGER trg_auditoria_automatica AFTER INSERT OR DELETE OR UPDATE ON public.chamadas_aula FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica();

CREATE TRIGGER trg_auditoria_automatica AFTER INSERT OR DELETE OR UPDATE ON public.cobrancas FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica();

CREATE TRIGGER trg_auditoria_automatica AFTER INSERT OR DELETE OR UPDATE ON public.contas_financeiras FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica();

CREATE TRIGGER trg_auditoria_automatica AFTER INSERT OR DELETE OR UPDATE ON public.contratos FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica();

CREATE TRIGGER trg_marcar_contrato_anterior_renovado AFTER UPDATE OF status ON public.contratos FOR EACH ROW EXECUTE FUNCTION public.marcar_contrato_anterior_renovado();

CREATE TRIGGER trg_proteger_snapshot_contrato BEFORE UPDATE ON public.contratos FOR EACH ROW EXECUTE FUNCTION public.proteger_snapshot_contrato();

CREATE TRIGGER trg_auditoria_automatica AFTER INSERT OR DELETE OR UPDATE ON public.estornos_pagamento FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica();

CREATE TRIGGER trg_auditoria_automatica AFTER INSERT OR DELETE OR UPDATE ON public.fluxo_caixa FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica();

CREATE TRIGGER trg_auditoria_automatica AFTER INSERT OR DELETE OR UPDATE ON public.matriculas_turma FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica();

CREATE TRIGGER trg_auditoria_automatica AFTER INSERT OR DELETE OR UPDATE ON public.presencas FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica();

CREATE TRIGGER trg_auditoria_automatica AFTER INSERT OR DELETE OR UPDATE ON public.professores FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica();

CREATE TRIGGER trg_auditoria_automatica AFTER INSERT OR DELETE OR UPDATE ON public.recibos FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica();

CREATE TRIGGER trg_auditoria_automatica AFTER INSERT OR DELETE OR UPDATE ON public.repasses_professor FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica();

CREATE TRIGGER trg_auditoria_automatica AFTER INSERT OR DELETE OR UPDATE ON public.turmas FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica();

CREATE TRIGGER trg_validar_turma BEFORE INSERT OR UPDATE OF dia_semana, horario_inicio, horario_fim, capacidade_maxima, professor_id, sala_id, modalidade_id, ativo ON public.turmas FOR EACH ROW EXECUTE FUNCTION public.validar_turma();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER trg_auditoria_automatica AFTER INSERT OR DELETE OR UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica();

CREATE TRIGGER trg_usuarios_atualizado BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

alter table public."alunos" enable row level security;

alter table public."auditoria" enable row level security;

alter table public."chamadas_aula" enable row level security;

alter table public."cobrancas" enable row level security;

alter table public."comissoes_professor_aluno" enable row level security;

alter table public."comunicacoes" enable row level security;

alter table public."configuracoes" enable row level security;

alter table public."contas_financeiras" enable row level security;

alter table public."contratos" enable row level security;

alter table public."estornos_pagamento" enable row level security;

alter table public."feriados" enable row level security;

alter table public."fluxo_caixa" enable row level security;

alter table public."matriculas_turma" enable row level security;

alter table public."modalidades" enable row level security;

alter table public."modelos_contrato" enable row level security;

alter table public."presencas" enable row level security;

alter table public."professor_modalidades" enable row level security;

alter table public."professores" enable row level security;

alter table public."recibos" enable row level security;

alter table public."relatorios_salvos" enable row level security;

alter table public."repasse_itens" enable row level security;

alter table public."repasses_professor" enable row level security;

alter table public."salas" enable row level security;

alter table public."tentativas_assinatura" enable row level security;

alter table public."turmas" enable row level security;

alter table public."usuarios" enable row level security;

create policy "Aluno vê apenas o próprio registro" on public.alunos as permissive for select to public using (((public.meu_papel() = 'aluno'::public.papel_usuario) AND (id = public.meu_aluno_id())));

create policy "Gestão atualiza alunos" on public.alunos as permissive for update to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Gestão cria alunos" on public.alunos as permissive for insert to public with check ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Gestão vê todos os alunos" on public.alunos as permissive for select to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Professor vê apenas alunos das suas turmas" on public.alunos as permissive for select to public using (((public.meu_papel() = 'professor'::public.papel_usuario) AND public.aluno_do_professor(id)));

create policy aluno_le_proprio_cadastro on public.alunos as permissive for select to authenticated using ((id = public.meu_aluno_id()));

create policy gestao_crud on public.alunos as permissive for all to authenticated using ((public.meu_papel() = 'gestao'::public.papel_usuario)) with check ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy professor_le_alunos_das_turmas on public.alunos as permissive for select to authenticated using (public.aluno_do_professor(id));

create policy "Só gestão consulta auditoria" on public.auditoria as permissive for select to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy gestao_le_auditoria on public.auditoria as permissive for select to authenticated using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy gestao_le_chamadas on public.chamadas_aula as permissive for select to authenticated using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy gestao_reabre_chamada on public.chamadas_aula as permissive for update to authenticated using ((public.meu_papel() = 'gestao'::public.papel_usuario)) with check (((public.meu_papel() = 'gestao'::public.papel_usuario) AND (ativa = false) AND (reaberta_por = auth.uid()) AND (reaberta_em IS NOT NULL) AND (length(TRIM(BOTH FROM motivo_reabertura)) >= 5)));

create policy professor_finaliza_propria_turma on public.chamadas_aula as permissive for insert to authenticated with check (((public.meu_papel() = 'professor'::public.papel_usuario) AND public.turma_do_professor(turma_id) AND (finalizada_por = auth.uid())));

create policy professor_le_fechamento_propria_turma on public.chamadas_aula as permissive for select to authenticated using (public.turma_do_professor(turma_id));

create policy "Aluno vê apenas as próprias cobranças" on public.cobrancas as permissive for select to public using (((public.meu_papel() = 'aluno'::public.papel_usuario) AND (aluno_id = public.meu_aluno_id())));

create policy "Gestão gerencia cobranças" on public.cobrancas as permissive for all to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Gestão vê todas as cobranças" on public.cobrancas as permissive for select to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy aluno_le_proprias_cobrancas on public.cobrancas as permissive for select to authenticated using ((aluno_id = public.meu_aluno_id()));

create policy gestao_crud on public.cobrancas as permissive for all to authenticated using ((public.meu_papel() = 'gestao'::public.papel_usuario)) with check ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Só gestão vê comissões" on public.comissoes_professor_aluno as permissive for all to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy gestao_le_comunicacoes on public.comunicacoes as permissive for select to authenticated using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Gestão atualiza configurações" on public.configuracoes as permissive for update to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Gestão insere configurações" on public.configuracoes as permissive for insert to public with check ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Gestão lê configurações" on public.configuracoes as permissive for select to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy gestao_crud on public.configuracoes as permissive for all to authenticated using ((public.meu_papel() = 'gestao'::public.papel_usuario)) with check ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Só gestão acessa contas financeiras" on public.contas_financeiras as permissive for all to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy gestao_crud on public.contas_financeiras as permissive for all to authenticated using ((public.meu_papel() = 'gestao'::public.papel_usuario)) with check ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Aluno vê apenas os próprios contratos" on public.contratos as permissive for select to public using (((public.meu_papel() = 'aluno'::public.papel_usuario) AND (aluno_id = public.meu_aluno_id())));

create policy "Gestão atualiza contratos" on public.contratos as permissive for update to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Gestão cria contratos" on public.contratos as permissive for insert to public with check ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Gestão vê todos os contratos" on public.contratos as permissive for select to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy aluno_le_proprios_contratos on public.contratos as permissive for select to authenticated using ((aluno_id = public.meu_aluno_id()));

create policy gestao_crud on public.contratos as permissive for all to authenticated using ((public.meu_papel() = 'gestao'::public.papel_usuario)) with check ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy gestao_le_estornos_pagamento on public.estornos_pagamento as permissive for select to authenticated using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Só gestão gerencia feriados" on public.feriados as permissive for all to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Todos os papéis autenticados leem feriados" on public.feriados as permissive for select to public using ((auth.role() = 'authenticated'::text));

create policy gestao_crud on public.feriados as permissive for all to authenticated using ((public.meu_papel() = 'gestao'::public.papel_usuario)) with check ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Só gestão acessa fluxo de caixa" on public.fluxo_caixa as permissive for all to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy gestao_crud on public.fluxo_caixa as permissive for all to authenticated using ((public.meu_papel() = 'gestao'::public.papel_usuario)) with check ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Aluno vê as próprias matrículas" on public.matriculas_turma as permissive for select to public using (((public.meu_papel() = 'aluno'::public.papel_usuario) AND (aluno_id = public.meu_aluno_id())));

create policy "Gestão gerencia matrículas" on public.matriculas_turma as permissive for all to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Gestão vê todas as matrículas" on public.matriculas_turma as permissive for select to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Professor vê matrículas das próprias turmas" on public.matriculas_turma as permissive for select to public using (((public.meu_papel() = 'professor'::public.papel_usuario) AND public.turma_do_professor(turma_id)));

create policy aluno_le_proprias_matriculas on public.matriculas_turma as permissive for select to authenticated using ((aluno_id = public.meu_aluno_id()));

create policy gestao_crud on public.matriculas_turma as permissive for all to authenticated using ((public.meu_papel() = 'gestao'::public.papel_usuario)) with check ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy professor_le_matriculas_das_turmas on public.matriculas_turma as permissive for select to authenticated using (public.turma_do_professor(turma_id));

create policy "Só gestão edita modalidades" on public.modalidades as permissive for update to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Só gestão exclui modalidades" on public.modalidades as permissive for delete to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Só gestão gerencia modalidades" on public.modalidades as permissive for insert to public with check ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Todos os papéis autenticados leem modalidades" on public.modalidades as permissive for select to public using ((auth.role() = 'authenticated'::text));

create policy autenticados_leem_modalidades on public.modalidades as permissive for select to authenticated using ((ativo = true));

create policy gestao_crud on public.modalidades as permissive for all to authenticated using ((public.meu_papel() = 'gestao'::public.papel_usuario)) with check ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Gestão vê modelos de contrato" on public.modelos_contrato as permissive for select to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Só gestão edita modelo de contrato" on public.modelos_contrato as permissive for all to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy gestao_crud on public.modelos_contrato as permissive for all to authenticated using ((public.meu_papel() = 'gestao'::public.papel_usuario)) with check ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy gestao_gerencia_fotos_alunos on storage.objects as permissive for all to authenticated using (((bucket_id = 'fotos_alunos'::text) AND (public.meu_papel() = 'gestao'::public.papel_usuario))) with check (((bucket_id = 'fotos_alunos'::text) AND (public.meu_papel() = 'gestao'::public.papel_usuario)));

create policy gestao_le_fotos_alunos on storage.objects as permissive for select to authenticated using (((bucket_id = 'fotos_alunos'::text) AND (public.meu_papel() = 'gestao'::public.papel_usuario)));

create policy "Aluno vê as próprias presenças" on public.presencas as permissive for select to public using (((public.meu_papel() = 'aluno'::public.papel_usuario) AND (aluno_id = public.meu_aluno_id())));

create policy "Gestão vê todas as presenças" on public.presencas as permissive for select to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Professor e gestão editam presença" on public.presencas as permissive for update to public using (((public.meu_papel() = 'gestao'::public.papel_usuario) OR ((public.meu_papel() = 'professor'::public.papel_usuario) AND public.turma_do_professor(turma_id))));

create policy "Professor e gestão registram presença" on public.presencas as permissive for insert to public with check (((public.meu_papel() = 'gestao'::public.papel_usuario) OR ((public.meu_papel() = 'professor'::public.papel_usuario) AND public.turma_do_professor(turma_id))));

create policy "Professor vê presenças das próprias turmas" on public.presencas as permissive for select to public using (((public.meu_papel() = 'professor'::public.papel_usuario) AND public.turma_do_professor(turma_id)));

create policy aluno_le_proprias_presencas on public.presencas as permissive for select to authenticated using ((aluno_id = public.meu_aluno_id()));

create policy gestao_crud on public.presencas as permissive for all to authenticated using ((public.meu_papel() = 'gestao'::public.papel_usuario)) with check ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy professor_atualiza_presenca on public.presencas as permissive for update to authenticated using (((public.meu_papel() = 'professor'::public.papel_usuario) AND public.turma_do_professor(turma_id) AND (NOT (EXISTS ( SELECT 1
   FROM public.chamadas_aula ca
  WHERE ((ca.turma_id = presencas.turma_id) AND (ca.data_aula = presencas.data_aula) AND (ca.ativa = true))))))) with check ((public.turma_do_professor(turma_id) AND public.aluno_do_professor(aluno_id) AND (registrado_por = auth.uid()) AND (NOT (EXISTS ( SELECT 1
   FROM public.chamadas_aula ca
  WHERE ((ca.turma_id = presencas.turma_id) AND (ca.data_aula = presencas.data_aula) AND (ca.ativa = true)))))));

create policy professor_le_presencas_das_turmas on public.presencas as permissive for select to authenticated using (public.turma_do_professor(turma_id));

create policy professor_registra_presenca on public.presencas as permissive for insert to authenticated with check (((public.meu_papel() = 'professor'::public.papel_usuario) AND public.turma_do_professor(turma_id) AND public.aluno_do_professor(aluno_id) AND (registrado_por = auth.uid()) AND (NOT (EXISTS ( SELECT 1
   FROM public.chamadas_aula ca
  WHERE ((ca.turma_id = presencas.turma_id) AND (ca.data_aula = presencas.data_aula) AND (ca.ativa = true)))))));

create policy gestao_le_professor_modalidades on public.professor_modalidades as permissive for select to authenticated using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy professor_le_proprias_modalidades on public.professor_modalidades as permissive for select to authenticated using (((public.meu_papel() = 'professor'::public.papel_usuario) AND (professor_id = public.meu_professor_id())));

create policy "Só gestão edita professores" on public.professores as permissive for update to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Só gestão gerencia professores" on public.professores as permissive for insert to public with check ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Todos os papéis autenticados leem professores" on public.professores as permissive for select to public using ((auth.role() = 'authenticated'::text));

create policy gestao_crud on public.professores as permissive for all to authenticated using ((public.meu_papel() = 'gestao'::public.papel_usuario)) with check ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy professor_le_proprio_cadastro on public.professores as permissive for select to authenticated using ((id = public.meu_professor_id()));

create policy "Gestão gerencia recibos" on public.recibos as permissive for all to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Gestão vê todos os recibos" on public.recibos as permissive for select to public using (((public.meu_papel() = 'gestao'::public.papel_usuario) OR (EXISTS ( SELECT 1
   FROM public.cobrancas c
  WHERE ((c.id = recibos.cobranca_id) AND (c.aluno_id = public.meu_aluno_id()))))));

create policy aluno_le_proprios_recibos on public.recibos as permissive for select to authenticated using ((EXISTS ( SELECT 1
   FROM public.cobrancas c
  WHERE ((c.id = recibos.cobranca_id) AND (c.aluno_id = public.meu_aluno_id())))));

create policy gestao_crud on public.recibos as permissive for all to authenticated using ((public.meu_papel() = 'gestao'::public.papel_usuario)) with check ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Usuário gerencia os próprios relatórios salvos" on public.relatorios_salvos as permissive for all to public using ((usuario_id = auth.uid()));

create policy "Usuário vê os próprios relatórios salvos" on public.relatorios_salvos as permissive for select to public using (((usuario_id = auth.uid()) OR (visibilidade = 'equipe'::text)));

create policy "Gestão vê itens de repasse" on public.repasse_itens as permissive for select to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Professor vê itens do próprio repasse" on public.repasse_itens as permissive for select to public using (((public.meu_papel() = 'professor'::public.papel_usuario) AND (EXISTS ( SELECT 1
   FROM public.repasses_professor rp
  WHERE ((rp.id = repasse_itens.repasse_id) AND (rp.professor_id = public.meu_professor_id()))))));

create policy "Gestão vê todos os repasses" on public.repasses_professor as permissive for select to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Professor vê apenas o próprio repasse" on public.repasses_professor as permissive for select to public using (((public.meu_papel() = 'professor'::public.papel_usuario) AND (professor_id = public.meu_professor_id())));

create policy "Só gestão gerencia repasses" on public.repasses_professor as permissive for all to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy gestao_crud on public.repasses_professor as permissive for all to authenticated using ((public.meu_papel() = 'gestao'::public.papel_usuario)) with check ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy professor_le_proprios_repasses on public.repasses_professor as permissive for select to authenticated using ((professor_id = public.meu_professor_id()));

create policy "Só gestão edita salas" on public.salas as permissive for update to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Só gestão exclui salas" on public.salas as permissive for delete to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Só gestão gerencia salas" on public.salas as permissive for insert to public with check ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Todos os papéis autenticados leem salas" on public.salas as permissive for select to public using ((auth.role() = 'authenticated'::text));

create policy autenticados_leem_salas on public.salas as permissive for select to authenticated using ((ativo = true));

create policy gestao_crud on public.salas as permissive for all to authenticated using ((public.meu_papel() = 'gestao'::public.papel_usuario)) with check ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Aluno vê turmas em que está matriculado" on public.turmas as permissive for select to public using (((public.meu_papel() = 'aluno'::public.papel_usuario) AND (EXISTS ( SELECT 1
   FROM public.matriculas_turma mt
  WHERE ((mt.turma_id = turmas.id) AND (mt.aluno_id = public.meu_aluno_id()) AND (mt.data_fim IS NULL))))));

create policy "Gestão gerencia turmas" on public.turmas as permissive for all to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Gestão vê todas as turmas" on public.turmas as permissive for select to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Professor vê apenas as próprias turmas" on public.turmas as permissive for select to public using (((public.meu_papel() = 'professor'::public.papel_usuario) AND (professor_id = public.meu_professor_id())));

create policy gestao_crud on public.turmas as permissive for all to authenticated using ((public.meu_papel() = 'gestao'::public.papel_usuario)) with check ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy professor_le_proprias_turmas on public.turmas as permissive for select to authenticated using ((professor_id = public.meu_professor_id()));

create policy "Gestão vê todos os usuários" on public.usuarios as permissive for select to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Só gestão cria usuários" on public.usuarios as permissive for insert to public with check ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Só gestão edita usuários" on public.usuarios as permissive for update to public using ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy "Usuário vê o próprio registro" on public.usuarios as permissive for select to public using ((id = auth.uid()));

create policy gestao_crud on public.usuarios as permissive for all to authenticated using ((public.meu_papel() = 'gestao'::public.papel_usuario)) with check ((public.meu_papel() = 'gestao'::public.papel_usuario));

create policy usuario_le_proprio_perfil on public.usuarios as permissive for select to authenticated using ((id = auth.uid()));

revoke all on table public."alunos" from public,anon,authenticated,service_role;

revoke all on table public."auditoria" from public,anon,authenticated,service_role;

revoke all on table public."chamadas_aula" from public,anon,authenticated,service_role;

revoke all on table public."cobrancas" from public,anon,authenticated,service_role;

revoke all on table public."comissoes_professor_aluno" from public,anon,authenticated,service_role;

revoke all on table public."comunicacoes" from public,anon,authenticated,service_role;

revoke all on table public."configuracoes" from public,anon,authenticated,service_role;

revoke all on table public."contas_financeiras" from public,anon,authenticated,service_role;

revoke all on table public."contratos" from public,anon,authenticated,service_role;

revoke all on table public."estornos_pagamento" from public,anon,authenticated,service_role;

revoke all on table public."feriados" from public,anon,authenticated,service_role;

revoke all on table public."fluxo_caixa" from public,anon,authenticated,service_role;

revoke all on table public."matriculas_turma" from public,anon,authenticated,service_role;

revoke all on table public."modalidades" from public,anon,authenticated,service_role;

revoke all on table public."modelos_contrato" from public,anon,authenticated,service_role;

revoke all on table public."presencas" from public,anon,authenticated,service_role;

revoke all on table public."professor_modalidades" from public,anon,authenticated,service_role;

revoke all on table public."professores" from public,anon,authenticated,service_role;

revoke all on table public."recibos" from public,anon,authenticated,service_role;

revoke all on table public."relatorios_salvos" from public,anon,authenticated,service_role;

revoke all on table public."repasse_itens" from public,anon,authenticated,service_role;

revoke all on table public."repasses_professor" from public,anon,authenticated,service_role;

revoke all on table public."salas" from public,anon,authenticated,service_role;

revoke all on table public."tentativas_assinatura" from public,anon,authenticated,service_role;

revoke all on table public."turmas" from public,anon,authenticated,service_role;

revoke all on table public."usuarios" from public,anon,authenticated,service_role;

revoke all on table public."vw_aluno_meu_contrato" from public,anon,authenticated,service_role;

revoke all on table public."vw_aluno_meu_perfil" from public,anon,authenticated,service_role;

revoke all on table public."vw_aluno_minha_frequencia" from public,anon,authenticated,service_role;

revoke all on table public."vw_aluno_minhas_cobrancas" from public,anon,authenticated,service_role;

revoke all on table public."vw_aluno_minhas_turmas" from public,anon,authenticated,service_role;

revoke all on table public."vw_professor_agenda" from public,anon,authenticated,service_role;

revoke all on table public."vw_professor_alunos" from public,anon,authenticated,service_role;

revoke all on table public."vw_professor_meu_repasse" from public,anon,authenticated,service_role;

grant DELETE on table public.alunos to service_role;

grant UPDATE on table public.alunos to service_role;

grant SELECT on table public.alunos to service_role;

grant INSERT on table public.alunos to service_role;

grant MAINTAIN on table public.alunos to authenticated;

grant TRIGGER on table public.alunos to authenticated;

grant REFERENCES on table public.alunos to authenticated;

grant TRUNCATE on table public.alunos to authenticated;

grant DELETE on table public.alunos to authenticated;

grant UPDATE on table public.alunos to authenticated;

grant SELECT on table public.alunos to authenticated;

grant INSERT on table public.alunos to authenticated;

grant MAINTAIN on table public.alunos to service_role;

grant TRIGGER on table public.alunos to service_role;

grant REFERENCES on table public.alunos to service_role;

grant TRUNCATE on table public.alunos to service_role;

grant MAINTAIN on table public.auditoria to service_role;

grant TRIGGER on table public.auditoria to service_role;

grant REFERENCES on table public.auditoria to service_role;

grant TRUNCATE on table public.auditoria to service_role;

grant DELETE on table public.auditoria to service_role;

grant UPDATE on table public.auditoria to service_role;

grant SELECT on table public.auditoria to service_role;

grant INSERT on table public.auditoria to service_role;

grant MAINTAIN on table public.auditoria to authenticated;

grant TRIGGER on table public.auditoria to authenticated;

grant REFERENCES on table public.auditoria to authenticated;

grant SELECT on table public.auditoria to authenticated;

grant MAINTAIN on table public.chamadas_aula to service_role;

grant TRIGGER on table public.chamadas_aula to service_role;

grant REFERENCES on table public.chamadas_aula to service_role;

grant TRUNCATE on table public.chamadas_aula to service_role;

grant INSERT on table public.chamadas_aula to authenticated;

grant DELETE on table public.chamadas_aula to service_role;

grant UPDATE on table public.chamadas_aula to service_role;

grant SELECT on table public.chamadas_aula to service_role;

grant INSERT on table public.chamadas_aula to service_role;

grant MAINTAIN on table public.chamadas_aula to authenticated;

grant TRIGGER on table public.chamadas_aula to authenticated;

grant REFERENCES on table public.chamadas_aula to authenticated;

grant TRUNCATE on table public.chamadas_aula to authenticated;

grant DELETE on table public.chamadas_aula to authenticated;

grant UPDATE on table public.chamadas_aula to authenticated;

grant SELECT on table public.chamadas_aula to authenticated;

grant SELECT on table public.cobrancas to service_role;

grant INSERT on table public.cobrancas to authenticated;

grant SELECT on table public.cobrancas to authenticated;

grant UPDATE on table public.cobrancas to authenticated;

grant DELETE on table public.cobrancas to authenticated;

grant TRIGGER on table public.cobrancas to service_role;

grant REFERENCES on table public.cobrancas to service_role;

grant TRUNCATE on table public.cobrancas to service_role;

grant DELETE on table public.cobrancas to service_role;

grant UPDATE on table public.cobrancas to service_role;

grant INSERT on table public.cobrancas to service_role;

grant MAINTAIN on table public.cobrancas to authenticated;

grant TRIGGER on table public.cobrancas to authenticated;

grant REFERENCES on table public.cobrancas to authenticated;

grant TRUNCATE on table public.cobrancas to authenticated;

grant MAINTAIN on table public.cobrancas to service_role;

grant DELETE on table public.comissoes_professor_aluno to service_role;

grant MAINTAIN on table public.comissoes_professor_aluno to service_role;

grant TRIGGER on table public.comissoes_professor_aluno to service_role;

grant REFERENCES on table public.comissoes_professor_aluno to service_role;

grant SELECT on table public.comissoes_professor_aluno to anon;

grant UPDATE on table public.comissoes_professor_aluno to anon;

grant DELETE on table public.comissoes_professor_aluno to anon;

grant TRUNCATE on table public.comissoes_professor_aluno to anon;

grant REFERENCES on table public.comissoes_professor_aluno to anon;

grant TRUNCATE on table public.comissoes_professor_aluno to service_role;

grant TRIGGER on table public.comissoes_professor_aluno to anon;

grant MAINTAIN on table public.comissoes_professor_aluno to anon;

grant INSERT on table public.comissoes_professor_aluno to anon;

grant INSERT on table public.comissoes_professor_aluno to authenticated;

grant SELECT on table public.comissoes_professor_aluno to authenticated;

grant UPDATE on table public.comissoes_professor_aluno to authenticated;

grant DELETE on table public.comissoes_professor_aluno to authenticated;

grant TRUNCATE on table public.comissoes_professor_aluno to authenticated;

grant REFERENCES on table public.comissoes_professor_aluno to authenticated;

grant TRIGGER on table public.comissoes_professor_aluno to authenticated;

grant MAINTAIN on table public.comissoes_professor_aluno to authenticated;

grant INSERT on table public.comissoes_professor_aluno to service_role;

grant SELECT on table public.comissoes_professor_aluno to service_role;

grant UPDATE on table public.comissoes_professor_aluno to service_role;

grant SELECT on table public.comunicacoes to authenticated;

grant MAINTAIN on table public.comunicacoes to service_role;

grant TRIGGER on table public.comunicacoes to service_role;

grant REFERENCES on table public.comunicacoes to service_role;

grant INSERT on table public.comunicacoes to service_role;

grant TRUNCATE on table public.comunicacoes to service_role;

grant DELETE on table public.comunicacoes to service_role;

grant UPDATE on table public.comunicacoes to service_role;

grant SELECT on table public.comunicacoes to service_role;

grant MAINTAIN on table public.comunicacoes to authenticated;

grant TRIGGER on table public.comunicacoes to authenticated;

grant REFERENCES on table public.comunicacoes to authenticated;

grant MAINTAIN on table public.configuracoes to service_role;

grant TRIGGER on table public.configuracoes to service_role;

grant REFERENCES on table public.configuracoes to service_role;

grant UPDATE on table public.configuracoes to service_role;

grant SELECT on table public.configuracoes to service_role;

grant INSERT on table public.configuracoes to service_role;

grant MAINTAIN on table public.configuracoes to authenticated;

grant TRIGGER on table public.configuracoes to authenticated;

grant REFERENCES on table public.configuracoes to authenticated;

grant TRUNCATE on table public.configuracoes to authenticated;

grant DELETE on table public.configuracoes to authenticated;

grant UPDATE on table public.configuracoes to authenticated;

grant SELECT on table public.configuracoes to authenticated;

grant INSERT on table public.configuracoes to authenticated;

grant TRUNCATE on table public.configuracoes to service_role;

grant DELETE on table public.configuracoes to service_role;

grant TRUNCATE on table public.contas_financeiras to service_role;

grant DELETE on table public.contas_financeiras to service_role;

grant UPDATE on table public.contas_financeiras to service_role;

grant SELECT on table public.contas_financeiras to service_role;

grant INSERT on table public.contas_financeiras to service_role;

grant MAINTAIN on table public.contas_financeiras to authenticated;

grant TRIGGER on table public.contas_financeiras to authenticated;

grant REFERENCES on table public.contas_financeiras to authenticated;

grant TRUNCATE on table public.contas_financeiras to authenticated;

grant DELETE on table public.contas_financeiras to authenticated;

grant UPDATE on table public.contas_financeiras to authenticated;

grant SELECT on table public.contas_financeiras to authenticated;

grant INSERT on table public.contas_financeiras to authenticated;

grant REFERENCES on table public.contas_financeiras to service_role;

grant MAINTAIN on table public.contas_financeiras to service_role;

grant TRIGGER on table public.contas_financeiras to service_role;

grant SELECT on table public.contratos to authenticated;

grant MAINTAIN on table public.contratos to service_role;

grant TRIGGER on table public.contratos to service_role;

grant TRUNCATE on table public.contratos to service_role;

grant DELETE on table public.contratos to service_role;

grant UPDATE on table public.contratos to service_role;

grant SELECT on table public.contratos to service_role;

grant INSERT on table public.contratos to service_role;

grant MAINTAIN on table public.contratos to authenticated;

grant TRIGGER on table public.contratos to authenticated;

grant REFERENCES on table public.contratos to authenticated;

grant TRUNCATE on table public.contratos to authenticated;

grant DELETE on table public.contratos to authenticated;

grant UPDATE on table public.contratos to authenticated;

grant INSERT on table public.contratos to authenticated;

grant REFERENCES on table public.contratos to service_role;

grant SELECT on table public.estornos_pagamento to authenticated;

grant REFERENCES on table public.estornos_pagamento to authenticated;

grant TRIGGER on table public.estornos_pagamento to authenticated;

grant MAINTAIN on table public.estornos_pagamento to service_role;

grant MAINTAIN on table public.estornos_pagamento to authenticated;

grant INSERT on table public.estornos_pagamento to service_role;

grant SELECT on table public.estornos_pagamento to service_role;

grant UPDATE on table public.estornos_pagamento to service_role;

grant DELETE on table public.estornos_pagamento to service_role;

grant TRUNCATE on table public.estornos_pagamento to service_role;

grant REFERENCES on table public.estornos_pagamento to service_role;

grant TRIGGER on table public.estornos_pagamento to service_role;

grant REFERENCES on table public.feriados to service_role;

grant INSERT on table public.feriados to authenticated;

grant SELECT on table public.feriados to authenticated;

grant UPDATE on table public.feriados to authenticated;

grant DELETE on table public.feriados to authenticated;

grant TRUNCATE on table public.feriados to authenticated;

grant REFERENCES on table public.feriados to authenticated;

grant TRIGGER on table public.feriados to authenticated;

grant MAINTAIN on table public.feriados to authenticated;

grant INSERT on table public.feriados to service_role;

grant SELECT on table public.feriados to service_role;

grant UPDATE on table public.feriados to service_role;

grant DELETE on table public.feriados to service_role;

grant TRUNCATE on table public.feriados to service_role;

grant TRIGGER on table public.feriados to service_role;

grant MAINTAIN on table public.feriados to service_role;

grant UPDATE on table public.fluxo_caixa to authenticated;

grant TRUNCATE on table public.fluxo_caixa to service_role;

grant REFERENCES on table public.fluxo_caixa to service_role;

grant TRIGGER on table public.fluxo_caixa to service_role;

grant MAINTAIN on table public.fluxo_caixa to service_role;

grant INSERT on table public.fluxo_caixa to authenticated;

grant SELECT on table public.fluxo_caixa to authenticated;

grant DELETE on table public.fluxo_caixa to service_role;

grant UPDATE on table public.fluxo_caixa to service_role;

grant SELECT on table public.fluxo_caixa to service_role;

grant INSERT on table public.fluxo_caixa to service_role;

grant MAINTAIN on table public.fluxo_caixa to authenticated;

grant TRIGGER on table public.fluxo_caixa to authenticated;

grant REFERENCES on table public.fluxo_caixa to authenticated;

grant TRUNCATE on table public.fluxo_caixa to authenticated;

grant DELETE on table public.fluxo_caixa to authenticated;

grant INSERT on table public.matriculas_turma to authenticated;

grant REFERENCES on table public.matriculas_turma to service_role;

grant TRIGGER on table public.matriculas_turma to service_role;

grant MAINTAIN on table public.matriculas_turma to service_role;

grant TRUNCATE on table public.matriculas_turma to service_role;

grant DELETE on table public.matriculas_turma to service_role;

grant UPDATE on table public.matriculas_turma to service_role;

grant SELECT on table public.matriculas_turma to service_role;

grant INSERT on table public.matriculas_turma to service_role;

grant MAINTAIN on table public.matriculas_turma to authenticated;

grant TRIGGER on table public.matriculas_turma to authenticated;

grant REFERENCES on table public.matriculas_turma to authenticated;

grant TRUNCATE on table public.matriculas_turma to authenticated;

grant DELETE on table public.matriculas_turma to authenticated;

grant UPDATE on table public.matriculas_turma to authenticated;

grant SELECT on table public.matriculas_turma to authenticated;

grant TRUNCATE on table public.modalidades to authenticated;

grant INSERT on table public.modalidades to authenticated;

grant SELECT on table public.modalidades to authenticated;

grant UPDATE on table public.modalidades to authenticated;

grant DELETE on table public.modalidades to authenticated;

grant MAINTAIN on table public.modalidades to service_role;

grant TRIGGER on table public.modalidades to service_role;

grant REFERENCES on table public.modalidades to service_role;

grant TRUNCATE on table public.modalidades to service_role;

grant DELETE on table public.modalidades to service_role;

grant UPDATE on table public.modalidades to service_role;

grant SELECT on table public.modalidades to service_role;

grant INSERT on table public.modalidades to service_role;

grant MAINTAIN on table public.modalidades to authenticated;

grant TRIGGER on table public.modalidades to authenticated;

grant REFERENCES on table public.modalidades to authenticated;

grant TRIGGER on table public.modelos_contrato to authenticated;

grant INSERT on table public.modelos_contrato to authenticated;

grant SELECT on table public.modelos_contrato to authenticated;

grant UPDATE on table public.modelos_contrato to authenticated;

grant DELETE on table public.modelos_contrato to authenticated;

grant TRUNCATE on table public.modelos_contrato to authenticated;

grant REFERENCES on table public.modelos_contrato to authenticated;

grant MAINTAIN on table public.modelos_contrato to authenticated;

grant INSERT on table public.modelos_contrato to service_role;

grant SELECT on table public.modelos_contrato to service_role;

grant UPDATE on table public.modelos_contrato to service_role;

grant DELETE on table public.modelos_contrato to service_role;

grant TRUNCATE on table public.modelos_contrato to service_role;

grant REFERENCES on table public.modelos_contrato to service_role;

grant TRIGGER on table public.modelos_contrato to service_role;

grant MAINTAIN on table public.modelos_contrato to service_role;

grant SELECT on table public.presencas to authenticated;

grant INSERT on table public.presencas to authenticated;

grant MAINTAIN on table public.presencas to service_role;

grant TRIGGER on table public.presencas to service_role;

grant REFERENCES on table public.presencas to service_role;

grant TRUNCATE on table public.presencas to service_role;

grant DELETE on table public.presencas to service_role;

grant UPDATE on table public.presencas to service_role;

grant SELECT on table public.presencas to service_role;

grant INSERT on table public.presencas to service_role;

grant MAINTAIN on table public.presencas to authenticated;

grant TRIGGER on table public.presencas to authenticated;

grant REFERENCES on table public.presencas to authenticated;

grant TRUNCATE on table public.presencas to authenticated;

grant DELETE on table public.presencas to authenticated;

grant UPDATE on table public.presencas to authenticated;

grant TRIGGER on table public.professor_modalidades to service_role;

grant MAINTAIN on table public.professor_modalidades to service_role;

grant INSERT on table public.professor_modalidades to authenticated;

grant SELECT on table public.professor_modalidades to authenticated;

grant UPDATE on table public.professor_modalidades to authenticated;

grant DELETE on table public.professor_modalidades to authenticated;

grant TRUNCATE on table public.professor_modalidades to authenticated;

grant REFERENCES on table public.professor_modalidades to authenticated;

grant TRIGGER on table public.professor_modalidades to authenticated;

grant MAINTAIN on table public.professor_modalidades to authenticated;

grant INSERT on table public.professor_modalidades to service_role;

grant SELECT on table public.professor_modalidades to service_role;

grant UPDATE on table public.professor_modalidades to service_role;

grant DELETE on table public.professor_modalidades to service_role;

grant TRUNCATE on table public.professor_modalidades to service_role;

grant REFERENCES on table public.professor_modalidades to service_role;

grant MAINTAIN on table public.professores to service_role;

grant DELETE on table public.professores to authenticated;

grant SELECT on table public.professores to authenticated;

grant UPDATE on table public.professores to authenticated;

grant INSERT on table public.professores to authenticated;

grant TRUNCATE on table public.professores to authenticated;

grant REFERENCES on table public.professores to authenticated;

grant TRIGGER on table public.professores to authenticated;

grant MAINTAIN on table public.professores to authenticated;

grant INSERT on table public.professores to service_role;

grant SELECT on table public.professores to service_role;

grant UPDATE on table public.professores to service_role;

grant DELETE on table public.professores to service_role;

grant TRUNCATE on table public.professores to service_role;

grant REFERENCES on table public.professores to service_role;

grant TRIGGER on table public.professores to service_role;

grant SELECT on table public.recibos to service_role;

grant DELETE on table public.recibos to service_role;

grant MAINTAIN on table public.recibos to service_role;

grant TRIGGER on table public.recibos to service_role;

grant REFERENCES on table public.recibos to service_role;

grant TRUNCATE on table public.recibos to service_role;

grant INSERT on table public.recibos to authenticated;

grant SELECT on table public.recibos to authenticated;

grant UPDATE on table public.recibos to authenticated;

grant DELETE on table public.recibos to authenticated;

grant TRUNCATE on table public.recibos to authenticated;

grant REFERENCES on table public.recibos to authenticated;

grant TRIGGER on table public.recibos to authenticated;

grant MAINTAIN on table public.recibos to authenticated;

grant INSERT on table public.recibos to service_role;

grant UPDATE on table public.recibos to service_role;

grant DELETE on table public.relatorios_salvos to service_role;

grant TRUNCATE on table public.relatorios_salvos to service_role;

grant MAINTAIN on table public.relatorios_salvos to service_role;

grant TRIGGER on table public.relatorios_salvos to service_role;

grant REFERENCES on table public.relatorios_salvos to service_role;

grant INSERT on table public.relatorios_salvos to anon;

grant SELECT on table public.relatorios_salvos to anon;

grant UPDATE on table public.relatorios_salvos to anon;

grant DELETE on table public.relatorios_salvos to anon;

grant TRUNCATE on table public.relatorios_salvos to anon;

grant REFERENCES on table public.relatorios_salvos to anon;

grant TRIGGER on table public.relatorios_salvos to anon;

grant MAINTAIN on table public.relatorios_salvos to anon;

grant INSERT on table public.relatorios_salvos to authenticated;

grant SELECT on table public.relatorios_salvos to authenticated;

grant UPDATE on table public.relatorios_salvos to authenticated;

grant DELETE on table public.relatorios_salvos to authenticated;

grant TRUNCATE on table public.relatorios_salvos to authenticated;

grant REFERENCES on table public.relatorios_salvos to authenticated;

grant TRIGGER on table public.relatorios_salvos to authenticated;

grant MAINTAIN on table public.relatorios_salvos to authenticated;

grant INSERT on table public.relatorios_salvos to service_role;

grant SELECT on table public.relatorios_salvos to service_role;

grant UPDATE on table public.relatorios_salvos to service_role;

grant REFERENCES on table public.repasse_itens to authenticated;

grant TRUNCATE on table public.repasse_itens to authenticated;

grant DELETE on table public.repasse_itens to authenticated;

grant UPDATE on table public.repasse_itens to authenticated;

grant SELECT on table public.repasse_itens to authenticated;

grant INSERT on table public.repasse_itens to authenticated;

grant MAINTAIN on table public.repasse_itens to service_role;

grant TRIGGER on table public.repasse_itens to service_role;

grant REFERENCES on table public.repasse_itens to service_role;

grant TRUNCATE on table public.repasse_itens to service_role;

grant DELETE on table public.repasse_itens to service_role;

grant UPDATE on table public.repasse_itens to service_role;

grant SELECT on table public.repasse_itens to service_role;

grant INSERT on table public.repasse_itens to service_role;

grant MAINTAIN on table public.repasse_itens to authenticated;

grant TRIGGER on table public.repasse_itens to authenticated;

grant TRIGGER on table public.repasses_professor to authenticated;

grant MAINTAIN on table public.repasses_professor to authenticated;

grant INSERT on table public.repasses_professor to service_role;

grant SELECT on table public.repasses_professor to service_role;

grant UPDATE on table public.repasses_professor to service_role;

grant DELETE on table public.repasses_professor to service_role;

grant TRUNCATE on table public.repasses_professor to service_role;

grant REFERENCES on table public.repasses_professor to service_role;

grant TRIGGER on table public.repasses_professor to service_role;

grant MAINTAIN on table public.repasses_professor to service_role;

grant INSERT on table public.repasses_professor to authenticated;

grant SELECT on table public.repasses_professor to authenticated;

grant UPDATE on table public.repasses_professor to authenticated;

grant DELETE on table public.repasses_professor to authenticated;

grant TRUNCATE on table public.repasses_professor to authenticated;

grant REFERENCES on table public.repasses_professor to authenticated;

grant DELETE on table public.salas to authenticated;

grant INSERT on table public.salas to authenticated;

grant SELECT on table public.salas to authenticated;

grant UPDATE on table public.salas to authenticated;

grant TRUNCATE on table public.salas to authenticated;

grant REFERENCES on table public.salas to authenticated;

grant TRIGGER on table public.salas to authenticated;

grant MAINTAIN on table public.salas to authenticated;

grant INSERT on table public.salas to service_role;

grant SELECT on table public.salas to service_role;

grant UPDATE on table public.salas to service_role;

grant DELETE on table public.salas to service_role;

grant TRUNCATE on table public.salas to service_role;

grant REFERENCES on table public.salas to service_role;

grant TRIGGER on table public.salas to service_role;

grant MAINTAIN on table public.salas to service_role;

grant INSERT on table public.tentativas_assinatura to service_role;

grant MAINTAIN on table public.tentativas_assinatura to service_role;

grant TRIGGER on table public.tentativas_assinatura to service_role;

grant REFERENCES on table public.tentativas_assinatura to service_role;

grant TRUNCATE on table public.tentativas_assinatura to service_role;

grant DELETE on table public.tentativas_assinatura to service_role;

grant UPDATE on table public.tentativas_assinatura to service_role;

grant SELECT on table public.tentativas_assinatura to service_role;

grant MAINTAIN on table public.turmas to authenticated;

grant TRIGGER on table public.turmas to authenticated;

grant REFERENCES on table public.turmas to authenticated;

grant TRUNCATE on table public.turmas to authenticated;

grant TRIGGER on table public.turmas to service_role;

grant UPDATE on table public.turmas to authenticated;

grant SELECT on table public.turmas to authenticated;

grant INSERT on table public.turmas to authenticated;

grant DELETE on table public.turmas to authenticated;

grant MAINTAIN on table public.turmas to service_role;

grant REFERENCES on table public.turmas to service_role;

grant TRUNCATE on table public.turmas to service_role;

grant DELETE on table public.turmas to service_role;

grant UPDATE on table public.turmas to service_role;

grant SELECT on table public.turmas to service_role;

grant INSERT on table public.turmas to service_role;

grant TRIGGER on table public.usuarios to service_role;

grant INSERT on table public.usuarios to authenticated;

grant SELECT on table public.usuarios to authenticated;

grant UPDATE on table public.usuarios to authenticated;

grant DELETE on table public.usuarios to authenticated;

grant TRUNCATE on table public.usuarios to authenticated;

grant REFERENCES on table public.usuarios to authenticated;

grant TRIGGER on table public.usuarios to authenticated;

grant MAINTAIN on table public.usuarios to authenticated;

grant INSERT on table public.usuarios to service_role;

grant SELECT on table public.usuarios to service_role;

grant UPDATE on table public.usuarios to service_role;

grant DELETE on table public.usuarios to service_role;

grant TRUNCATE on table public.usuarios to service_role;

grant REFERENCES on table public.usuarios to service_role;

grant MAINTAIN on table public.usuarios to service_role;

grant MAINTAIN on table public.vw_aluno_meu_contrato to service_role;

grant TRIGGER on table public.vw_aluno_meu_contrato to authenticated;

grant REFERENCES on table public.vw_aluno_meu_contrato to authenticated;

grant TRUNCATE on table public.vw_aluno_meu_contrato to authenticated;

grant DELETE on table public.vw_aluno_meu_contrato to authenticated;

grant UPDATE on table public.vw_aluno_meu_contrato to authenticated;

grant SELECT on table public.vw_aluno_meu_contrato to authenticated;

grant INSERT on table public.vw_aluno_meu_contrato to authenticated;

grant MAINTAIN on table public.vw_aluno_meu_contrato to authenticated;

grant INSERT on table public.vw_aluno_meu_contrato to service_role;

grant SELECT on table public.vw_aluno_meu_contrato to service_role;

grant UPDATE on table public.vw_aluno_meu_contrato to service_role;

grant DELETE on table public.vw_aluno_meu_contrato to service_role;

grant TRUNCATE on table public.vw_aluno_meu_contrato to service_role;

grant REFERENCES on table public.vw_aluno_meu_contrato to service_role;

grant TRIGGER on table public.vw_aluno_meu_contrato to service_role;

grant MAINTAIN on table public.vw_aluno_meu_perfil to service_role;

grant INSERT on table public.vw_aluno_meu_perfil to authenticated;

grant SELECT on table public.vw_aluno_meu_perfil to authenticated;

grant UPDATE on table public.vw_aluno_meu_perfil to authenticated;

grant DELETE on table public.vw_aluno_meu_perfil to authenticated;

grant TRUNCATE on table public.vw_aluno_meu_perfil to authenticated;

grant REFERENCES on table public.vw_aluno_meu_perfil to authenticated;

grant TRIGGER on table public.vw_aluno_meu_perfil to authenticated;

grant MAINTAIN on table public.vw_aluno_meu_perfil to authenticated;

grant INSERT on table public.vw_aluno_meu_perfil to service_role;

grant SELECT on table public.vw_aluno_meu_perfil to service_role;

grant UPDATE on table public.vw_aluno_meu_perfil to service_role;

grant DELETE on table public.vw_aluno_meu_perfil to service_role;

grant TRUNCATE on table public.vw_aluno_meu_perfil to service_role;

grant REFERENCES on table public.vw_aluno_meu_perfil to service_role;

grant TRIGGER on table public.vw_aluno_meu_perfil to service_role;

grant MAINTAIN on table public.vw_aluno_minha_frequencia to service_role;

grant TRIGGER on table public.vw_aluno_minha_frequencia to authenticated;

grant REFERENCES on table public.vw_aluno_minha_frequencia to authenticated;

grant TRUNCATE on table public.vw_aluno_minha_frequencia to authenticated;

grant DELETE on table public.vw_aluno_minha_frequencia to authenticated;

grant UPDATE on table public.vw_aluno_minha_frequencia to authenticated;

grant SELECT on table public.vw_aluno_minha_frequencia to authenticated;

grant INSERT on table public.vw_aluno_minha_frequencia to authenticated;

grant MAINTAIN on table public.vw_aluno_minha_frequencia to authenticated;

grant INSERT on table public.vw_aluno_minha_frequencia to service_role;

grant SELECT on table public.vw_aluno_minha_frequencia to service_role;

grant UPDATE on table public.vw_aluno_minha_frequencia to service_role;

grant DELETE on table public.vw_aluno_minha_frequencia to service_role;

grant TRUNCATE on table public.vw_aluno_minha_frequencia to service_role;

grant REFERENCES on table public.vw_aluno_minha_frequencia to service_role;

grant TRIGGER on table public.vw_aluno_minha_frequencia to service_role;

grant MAINTAIN on table public.vw_aluno_minhas_cobrancas to service_role;

grant INSERT on table public.vw_aluno_minhas_cobrancas to authenticated;

grant SELECT on table public.vw_aluno_minhas_cobrancas to authenticated;

grant UPDATE on table public.vw_aluno_minhas_cobrancas to authenticated;

grant DELETE on table public.vw_aluno_minhas_cobrancas to authenticated;

grant TRUNCATE on table public.vw_aluno_minhas_cobrancas to authenticated;

grant REFERENCES on table public.vw_aluno_minhas_cobrancas to authenticated;

grant TRIGGER on table public.vw_aluno_minhas_cobrancas to authenticated;

grant MAINTAIN on table public.vw_aluno_minhas_cobrancas to authenticated;

grant INSERT on table public.vw_aluno_minhas_cobrancas to service_role;

grant SELECT on table public.vw_aluno_minhas_cobrancas to service_role;

grant UPDATE on table public.vw_aluno_minhas_cobrancas to service_role;

grant DELETE on table public.vw_aluno_minhas_cobrancas to service_role;

grant TRUNCATE on table public.vw_aluno_minhas_cobrancas to service_role;

grant REFERENCES on table public.vw_aluno_minhas_cobrancas to service_role;

grant TRIGGER on table public.vw_aluno_minhas_cobrancas to service_role;

grant SELECT on table public.vw_aluno_minhas_turmas to authenticated;

grant INSERT on table public.vw_aluno_minhas_turmas to authenticated;

grant UPDATE on table public.vw_aluno_minhas_turmas to authenticated;

grant DELETE on table public.vw_aluno_minhas_turmas to authenticated;

grant TRUNCATE on table public.vw_aluno_minhas_turmas to authenticated;

grant REFERENCES on table public.vw_aluno_minhas_turmas to authenticated;

grant TRIGGER on table public.vw_aluno_minhas_turmas to authenticated;

grant MAINTAIN on table public.vw_aluno_minhas_turmas to authenticated;

grant INSERT on table public.vw_aluno_minhas_turmas to service_role;

grant SELECT on table public.vw_aluno_minhas_turmas to service_role;

grant UPDATE on table public.vw_aluno_minhas_turmas to service_role;

grant DELETE on table public.vw_aluno_minhas_turmas to service_role;

grant TRUNCATE on table public.vw_aluno_minhas_turmas to service_role;

grant REFERENCES on table public.vw_aluno_minhas_turmas to service_role;

grant TRIGGER on table public.vw_aluno_minhas_turmas to service_role;

grant MAINTAIN on table public.vw_aluno_minhas_turmas to service_role;

grant INSERT on table public.vw_professor_agenda to authenticated;

grant SELECT on table public.vw_professor_agenda to authenticated;

grant UPDATE on table public.vw_professor_agenda to authenticated;

grant DELETE on table public.vw_professor_agenda to authenticated;

grant TRUNCATE on table public.vw_professor_agenda to authenticated;

grant REFERENCES on table public.vw_professor_agenda to authenticated;

grant TRIGGER on table public.vw_professor_agenda to authenticated;

grant MAINTAIN on table public.vw_professor_agenda to authenticated;

grant INSERT on table public.vw_professor_agenda to service_role;

grant SELECT on table public.vw_professor_agenda to service_role;

grant UPDATE on table public.vw_professor_agenda to service_role;

grant DELETE on table public.vw_professor_agenda to service_role;

grant TRUNCATE on table public.vw_professor_agenda to service_role;

grant REFERENCES on table public.vw_professor_agenda to service_role;

grant MAINTAIN on table public.vw_professor_agenda to service_role;

grant TRIGGER on table public.vw_professor_agenda to service_role;

grant SELECT on table public.vw_professor_alunos to authenticated;

grant MAINTAIN on table public.vw_professor_alunos to service_role;

grant TRIGGER on table public.vw_professor_alunos to service_role;

grant REFERENCES on table public.vw_professor_alunos to service_role;

grant TRUNCATE on table public.vw_professor_alunos to service_role;

grant DELETE on table public.vw_professor_alunos to service_role;

grant UPDATE on table public.vw_professor_alunos to service_role;

grant SELECT on table public.vw_professor_alunos to service_role;

grant INSERT on table public.vw_professor_alunos to service_role;

grant MAINTAIN on table public.vw_professor_alunos to authenticated;

grant TRIGGER on table public.vw_professor_alunos to authenticated;

grant REFERENCES on table public.vw_professor_alunos to authenticated;

grant TRUNCATE on table public.vw_professor_alunos to authenticated;

grant DELETE on table public.vw_professor_alunos to authenticated;

grant UPDATE on table public.vw_professor_alunos to authenticated;

grant INSERT on table public.vw_professor_alunos to authenticated;

grant MAINTAIN on table public.vw_professor_meu_repasse to service_role;

grant INSERT on table public.vw_professor_meu_repasse to authenticated;

grant SELECT on table public.vw_professor_meu_repasse to authenticated;

grant UPDATE on table public.vw_professor_meu_repasse to authenticated;

grant DELETE on table public.vw_professor_meu_repasse to authenticated;

grant TRUNCATE on table public.vw_professor_meu_repasse to authenticated;

grant REFERENCES on table public.vw_professor_meu_repasse to authenticated;

grant TRIGGER on table public.vw_professor_meu_repasse to authenticated;

grant MAINTAIN on table public.vw_professor_meu_repasse to authenticated;

grant INSERT on table public.vw_professor_meu_repasse to service_role;

grant SELECT on table public.vw_professor_meu_repasse to service_role;

grant UPDATE on table public.vw_professor_meu_repasse to service_role;

grant DELETE on table public.vw_professor_meu_repasse to service_role;

grant TRUNCATE on table public.vw_professor_meu_repasse to service_role;

grant REFERENCES on table public.vw_professor_meu_repasse to service_role;

grant TRIGGER on table public.vw_professor_meu_repasse to service_role;

revoke all on function public.alterar_acesso_gestao(uuid,text,boolean) from public,anon,authenticated,service_role;

grant EXECUTE on function public.alterar_acesso_gestao(uuid,text,boolean) to "authenticated";

grant EXECUTE on function public.alterar_acesso_gestao(uuid,text,boolean) to "service_role";

revoke all on function public.alterar_status_modalidade(uuid,boolean) from public,anon,authenticated,service_role;

grant EXECUTE on function public.alterar_status_modalidade(uuid,boolean) to "authenticated";

grant EXECUTE on function public.alterar_status_modalidade(uuid,boolean) to "service_role";

revoke all on function public.alterar_status_professor(uuid,boolean) from public,anon,authenticated,service_role;

grant EXECUTE on function public.alterar_status_professor(uuid,boolean) to "authenticated";

grant EXECUTE on function public.alterar_status_professor(uuid,boolean) to "service_role";

revoke all on function public.alterar_status_sala(uuid,boolean) from public,anon,authenticated,service_role;

grant EXECUTE on function public.alterar_status_sala(uuid,boolean) to "authenticated";

grant EXECUTE on function public.alterar_status_sala(uuid,boolean) to "service_role";

revoke all on function public.aluno_do_professor(uuid) from public,anon,authenticated,service_role;

grant EXECUTE on function public.aluno_do_professor(uuid) to "anon";

grant EXECUTE on function public.aluno_do_professor(uuid) to "authenticated";

grant EXECUTE on function public.aluno_do_professor(uuid) to "service_role";

revoke all on function public.assinar_contrato(text,text,text,text) from public,anon,authenticated,service_role;

grant EXECUTE on function public.assinar_contrato(text,text,text,text) to "service_role";

revoke all on function public.assinar_contrato_com_consentimento(text,text,text,text) from public,anon,authenticated,service_role;

grant EXECUTE on function public.assinar_contrato_com_consentimento(text,text,text,text) to "service_role";

revoke all on function public.atualizar_turmas_aluno(uuid,uuid[]) from public,anon,authenticated,service_role;

grant EXECUTE on function public.atualizar_turmas_aluno(uuid,uuid[]) to "authenticated";

grant EXECUTE on function public.atualizar_turmas_aluno(uuid,uuid[]) to "service_role";

revoke all on function public.calcular_repasse_professor(uuid,date) from public,anon,authenticated,service_role;

grant EXECUTE on function public.calcular_repasse_professor(uuid,date) to "authenticated";

grant EXECUTE on function public.calcular_repasse_professor(uuid,date) to "service_role";

revoke all on function public.cancelar_aluno(uuid,text) from public,anon,authenticated,service_role;

grant EXECUTE on function public.cancelar_aluno(uuid,text) to "authenticated";

grant EXECUTE on function public.cancelar_aluno(uuid,text) to "service_role";

revoke all on function public.cancelar_cobranca_aberta(uuid,text) from public,anon,authenticated,service_role;

grant EXECUTE on function public.cancelar_cobranca_aberta(uuid,text) to "authenticated";

grant EXECUTE on function public.cancelar_cobranca_aberta(uuid,text) to "service_role";

revoke all on function public.concluir_onboarding() from public,anon,authenticated,service_role;

grant EXECUTE on function public.concluir_onboarding() to "authenticated";

grant EXECUTE on function public.concluir_onboarding() to "service_role";

revoke all on function public.cpf_valido(text) from public,anon,authenticated,service_role;

grant EXECUTE on function public.cpf_valido(text) to public;

grant EXECUTE on function public.cpf_valido(text) to "anon";

grant EXECUTE on function public.cpf_valido(text) to "authenticated";

grant EXECUTE on function public.cpf_valido(text) to "service_role";

revoke all on function public.criar_matricula_com_contrato(text,text,date,text,text,uuid[],text,text,text,text,integer) from public,anon,authenticated,service_role;

grant EXECUTE on function public.criar_matricula_com_contrato(text,text,date,text,text,uuid[],text,text,text,text,integer) to "authenticated";

grant EXECUTE on function public.criar_matricula_com_contrato(text,text,date,text,text,uuid[],text,text,text,text,integer) to "service_role";

revoke all on function public.definir_autor_acesso(uuid) from public,anon,authenticated,service_role;

grant EXECUTE on function public.definir_autor_acesso(uuid) to "service_role";

revoke all on function public.destrancar_aluno(uuid) from public,anon,authenticated,service_role;

grant EXECUTE on function public.destrancar_aluno(uuid) to "authenticated";

grant EXECUTE on function public.destrancar_aluno(uuid) to "service_role";

revoke all on function public.estornar_pagamento_manual(uuid,uuid,date,text) from public,anon,authenticated,service_role;

grant EXECUTE on function public.estornar_pagamento_manual(uuid,uuid,date,text) to "anon";

grant EXECUTE on function public.estornar_pagamento_manual(uuid,uuid,date,text) to "authenticated";

grant EXECUTE on function public.estornar_pagamento_manual(uuid,uuid,date,text) to "service_role";

revoke all on function public.excluir_aluno_definitivamente(uuid) from public,anon,authenticated,service_role;

grant EXECUTE on function public.excluir_aluno_definitivamente(uuid) to "authenticated";

grant EXECUTE on function public.excluir_aluno_definitivamente(uuid) to "service_role";

revoke all on function public.handle_new_user() from public,anon,authenticated,service_role;

grant EXECUTE on function public.handle_new_user() to "service_role";

revoke all on function public.inativar_turma(uuid) from public,anon,authenticated,service_role;

grant EXECUTE on function public.inativar_turma(uuid) to "authenticated";

grant EXECUTE on function public.inativar_turma(uuid) to "service_role";

revoke all on function public.limpar_acesso_usuario_incompleto(uuid,uuid) from public,anon,authenticated,service_role;

grant EXECUTE on function public.limpar_acesso_usuario_incompleto(uuid,uuid) to "service_role";

revoke all on function public.marcar_contrato_anterior_renovado() from public,anon,authenticated,service_role;

grant EXECUTE on function public.marcar_contrato_anterior_renovado() to public;

grant EXECUTE on function public.marcar_contrato_anterior_renovado() to "anon";

grant EXECUTE on function public.marcar_contrato_anterior_renovado() to "authenticated";

grant EXECUTE on function public.marcar_contrato_anterior_renovado() to "service_role";

revoke all on function public.meu_aluno_id() from public,anon,authenticated,service_role;

grant EXECUTE on function public.meu_aluno_id() to "anon";

grant EXECUTE on function public.meu_aluno_id() to "authenticated";

grant EXECUTE on function public.meu_aluno_id() to "service_role";

revoke all on function public.meu_papel() from public,anon,authenticated,service_role;

grant EXECUTE on function public.meu_papel() to "anon";

grant EXECUTE on function public.meu_papel() to "authenticated";

grant EXECUTE on function public.meu_papel() to "service_role";

revoke all on function public.meu_professor_id() from public,anon,authenticated,service_role;

grant EXECUTE on function public.meu_professor_id() to "anon";

grant EXECUTE on function public.meu_professor_id() to "authenticated";

grant EXECUTE on function public.meu_professor_id() to "service_role";

revoke all on function public.obter_resumo_financeiro(date) from public,anon,authenticated,service_role;

grant EXECUTE on function public.obter_resumo_financeiro(date) to "anon";

grant EXECUTE on function public.obter_resumo_financeiro(date) to "authenticated";

grant EXECUTE on function public.obter_resumo_financeiro(date) to "service_role";

revoke all on function public.obter_usuario_auth_por_email(text) from public,anon,authenticated,service_role;

grant EXECUTE on function public.obter_usuario_auth_por_email(text) to "service_role";

revoke all on function public.pagar_repasse_professor(uuid,date,uuid,public.forma_pagamento,date) from public,anon,authenticated,service_role;

grant EXECUTE on function public.pagar_repasse_professor(uuid,date,uuid,public.forma_pagamento,date) to "authenticated";

grant EXECUTE on function public.pagar_repasse_professor(uuid,date,uuid,public.forma_pagamento,date) to "service_role";

revoke all on function public.proteger_snapshot_contrato() from public,anon,authenticated,service_role;

grant EXECUTE on function public.proteger_snapshot_contrato() to public;

grant EXECUTE on function public.proteger_snapshot_contrato() to "anon";

grant EXECUTE on function public.proteger_snapshot_contrato() to "authenticated";

grant EXECUTE on function public.proteger_snapshot_contrato() to "service_role";

revoke all on function public.provisionar_acesso_usuario(uuid,uuid,text,text,public.papel_usuario,uuid) from public,anon,authenticated,service_role;

grant EXECUTE on function public.provisionar_acesso_usuario(uuid,uuid,text,text,public.papel_usuario,uuid) to "service_role";

revoke all on function public.regenerar_token_contrato(uuid) from public,anon,authenticated,service_role;

grant EXECUTE on function public.regenerar_token_contrato(uuid) to "authenticated";

grant EXECUTE on function public.regenerar_token_contrato(uuid) to "service_role";

revoke all on function public.registrar_auditoria_automatica() from public,anon,authenticated,service_role;

grant EXECUTE on function public.registrar_auditoria_automatica() to public;

grant EXECUTE on function public.registrar_auditoria_automatica() to "anon";

grant EXECUTE on function public.registrar_auditoria_automatica() to "authenticated";

grant EXECUTE on function public.registrar_auditoria_automatica() to "service_role";

revoke all on function public.registrar_pagamento_manual(uuid,public.forma_pagamento,date,uuid,text) from public,anon,authenticated,service_role;

grant EXECUTE on function public.registrar_pagamento_manual(uuid,public.forma_pagamento,date,uuid,text) to "anon";

grant EXECUTE on function public.registrar_pagamento_manual(uuid,public.forma_pagamento,date,uuid,text) to "authenticated";

grant EXECUTE on function public.registrar_pagamento_manual(uuid,public.forma_pagamento,date,uuid,text) to "service_role";

revoke all on function public.renovar_contrato(uuid,numeric,integer) from public,anon,authenticated,service_role;

grant EXECUTE on function public.renovar_contrato(uuid,numeric,integer) to "authenticated";

grant EXECUTE on function public.renovar_contrato(uuid,numeric,integer) to "service_role";

revoke all on function public.reparar_vinculo_professor_orfao(uuid,uuid,uuid) from public,anon,authenticated,service_role;

grant EXECUTE on function public.reparar_vinculo_professor_orfao(uuid,uuid,uuid) to "service_role";

revoke all on function public.resumo_cobrancas() from public,anon,authenticated,service_role;

grant EXECUTE on function public.resumo_cobrancas() to "authenticated";

grant EXECUTE on function public.resumo_cobrancas() to "service_role";

revoke all on function public.resumo_contratos() from public,anon,authenticated,service_role;

grant EXECUTE on function public.resumo_contratos() to "authenticated";

grant EXECUTE on function public.resumo_contratos() to "service_role";

revoke all on function public.resumo_fluxo_caixa(uuid) from public,anon,authenticated,service_role;

grant EXECUTE on function public.resumo_fluxo_caixa(uuid) to "authenticated";

grant EXECUTE on function public.resumo_fluxo_caixa(uuid) to "service_role";

revoke all on function public.rls_auto_enable() from public,anon,authenticated,service_role;

grant EXECUTE on function public.rls_auto_enable() to public;

grant EXECUTE on function public.rls_auto_enable() to "anon";

grant EXECUTE on function public.rls_auto_enable() to "authenticated";

grant EXECUTE on function public.rls_auto_enable() to "service_role";

revoke all on function public.salvar_aluno_com_turmas(uuid,text,text,date,text,text,uuid[],text,text,text) from public,anon,authenticated,service_role;

grant EXECUTE on function public.salvar_aluno_com_turmas(uuid,text,text,date,text,text,uuid[],text,text,text) to "authenticated";

grant EXECUTE on function public.salvar_aluno_com_turmas(uuid,text,text,date,text,text,uuid[],text,text,text) to "service_role";

revoke all on function public.salvar_modalidade(uuid,text,numeric,text) from public,anon,authenticated,service_role;

grant EXECUTE on function public.salvar_modalidade(uuid,text,numeric,text) to "authenticated";

grant EXECUTE on function public.salvar_modalidade(uuid,text,numeric,text) to "service_role";

revoke all on function public.salvar_modelo_contrato(text) from public,anon,authenticated,service_role;

grant EXECUTE on function public.salvar_modelo_contrato(text) to "authenticated";

grant EXECUTE on function public.salvar_modelo_contrato(text) to "service_role";

revoke all on function public.salvar_professor(uuid,text,text,text,text,public.tipo_comissao,numeric,uuid[]) from public,anon,authenticated,service_role;

grant EXECUTE on function public.salvar_professor(uuid,text,text,text,text,public.tipo_comissao,numeric,uuid[]) to "authenticated";

grant EXECUTE on function public.salvar_professor(uuid,text,text,text,text,public.tipo_comissao,numeric,uuid[]) to "service_role";

revoke all on function public.salvar_professor(uuid,text,text,text,text,public.tipo_comissao,numeric,uuid[],text) from public,anon,authenticated,service_role;

grant EXECUTE on function public.salvar_professor(uuid,text,text,text,text,public.tipo_comissao,numeric,uuid[],text) to "authenticated";

grant EXECUTE on function public.salvar_professor(uuid,text,text,text,text,public.tipo_comissao,numeric,uuid[],text) to "service_role";

revoke all on function public.salvar_sala(uuid,text,integer,uuid) from public,anon,authenticated,service_role;

grant EXECUTE on function public.salvar_sala(uuid,text,integer,uuid) to "authenticated";

grant EXECUTE on function public.salvar_sala(uuid,text,integer,uuid) to "service_role";

revoke all on function public.salvar_turma(uuid,uuid,uuid,uuid,integer,time without time zone,time without time zone,integer) from public,anon,authenticated,service_role;

grant EXECUTE on function public.salvar_turma(uuid,uuid,uuid,uuid,integer,time without time zone,time without time zone,integer) to "authenticated";

grant EXECUTE on function public.salvar_turma(uuid,uuid,uuid,uuid,integer,time without time zone,time without time zone,integer) to "service_role";

revoke all on function public.salvar_turmas_em_lote(uuid,uuid,uuid,integer[],time without time zone,time without time zone,integer) from public,anon,authenticated,service_role;

grant EXECUTE on function public.salvar_turmas_em_lote(uuid,uuid,uuid,integer[],time without time zone,time without time zone,integer) to "authenticated";

grant EXECUTE on function public.salvar_turmas_em_lote(uuid,uuid,uuid,integer[],time without time zone,time without time zone,integer) to "service_role";

revoke all on function public.sanitizar_auditoria(text,jsonb) from public,anon,authenticated,service_role;

grant EXECUTE on function public.sanitizar_auditoria(text,jsonb) to public;

grant EXECUTE on function public.sanitizar_auditoria(text,jsonb) to "anon";

grant EXECUTE on function public.sanitizar_auditoria(text,jsonb) to "authenticated";

grant EXECUTE on function public.sanitizar_auditoria(text,jsonb) to "service_role";

revoke all on function public.set_atualizado_em() from public,anon,authenticated,service_role;

grant EXECUTE on function public.set_atualizado_em() to public;

grant EXECUTE on function public.set_atualizado_em() to "anon";

grant EXECUTE on function public.set_atualizado_em() to "authenticated";

grant EXECUTE on function public.set_atualizado_em() to "service_role";

revoke all on function public.trancar_aluno(uuid,text) from public,anon,authenticated,service_role;

grant EXECUTE on function public.trancar_aluno(uuid,text) to "authenticated";

grant EXECUTE on function public.trancar_aluno(uuid,text) to "service_role";

revoke all on function public.turma_do_professor(uuid) from public,anon,authenticated,service_role;

grant EXECUTE on function public.turma_do_professor(uuid) to "anon";

grant EXECUTE on function public.turma_do_professor(uuid) to "authenticated";

grant EXECUTE on function public.turma_do_professor(uuid) to "service_role";

revoke all on function public.validar_turma() from public,anon,authenticated,service_role;

grant EXECUTE on function public.validar_turma() to public;

grant EXECUTE on function public.validar_turma() to "anon";

grant EXECUTE on function public.validar_turma() to "authenticated";

grant EXECUTE on function public.validar_turma() to "service_role";

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('fotos_alunos','fotos_alunos',false,null,null) on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

set local check_function_bodies=true;

commit;

begin;
create table if not exists public.exclusoes_aluno (
  id uuid primary key default gen_random_uuid(), aluno_id uuid not null unique,
  usuario_id uuid, solicitado_por uuid not null references public.usuarios(id) on delete restrict,
  fotos text[] not null default '{}',
  status text not null default 'pendente' check(status in ('pendente','concluida')),
  ultimo_erro text, criada_em timestamptz not null default now(), concluida_em timestamptz
);
alter table public.exclusoes_aluno enable row level security;
revoke all on public.exclusoes_aluno from public,anon,authenticated;
grant select,insert,update on public.exclusoes_aluno to service_role;
create or replace function public.excluir_aluno_transacional(p_actor_id uuid,p_aluno_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_aluno public.alunos%rowtype; v_job public.exclusoes_aluno%rowtype; v_fotos text[];
begin
  perform public.definir_autor_acesso(p_actor_id);
  if p_aluno_id is null then raise exception 'ALUNO_INVALIDO'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('excluir-aluno:'||p_aluno_id::text,0));
  select * into v_job from public.exclusoes_aluno where aluno_id=p_aluno_id;
  if found then return to_jsonb(v_job); end if;
  select * into v_aluno from public.alunos where id=p_aluno_id for update;
  if not found then raise exception 'ALUNO_NAO_ENCONTRADO'; end if;
  -- Serializa com baixa/estorno e assinatura antes de validar o histórico.
  perform 1 from public.cobrancas where aluno_id=p_aluno_id for update;
  perform 1 from public.contratos where aluno_id=p_aluno_id for update;
  if v_aluno.usuario_id is not null then perform 1 from public.usuarios where id=v_aluno.usuario_id for update; end if;
  if exists(select 1 from public.cobrancas c where c.aluno_id=p_aluno_id and (c.status='paga' or c.data_pagamento is not null))
    or exists(select 1 from public.recibos r join public.cobrancas c on c.id=r.cobranca_id where c.aluno_id=p_aluno_id)
    or exists(select 1 from public.estornos_pagamento e join public.cobrancas c on c.id=e.cobranca_id where c.aluno_id=p_aluno_id)
    or exists(select 1 from public.fluxo_caixa f join public.cobrancas c on c.id=f.origem_id where c.aluno_id=p_aluno_id)
    or exists(select 1 from public.repasse_itens r where r.aluno_id=p_aluno_id) then
    raise exception 'ALUNO_COM_HISTORICO_FINANCEIRO';
  end if;
  if exists(select 1 from public.contratos c where c.aluno_id=p_aluno_id and
    (c.data_aceite is not null or c.documento_assinado_snapshot is not null or c.status::text in ('aceito','renovado','vencendo','vencido'))) then
    raise exception 'ALUNO_COM_CONTRATO_ASSINADO';
  end if;
  if v_aluno.usuario_id is not null and (
    exists(select 1 from public.usuarios u where u.id=v_aluno.usuario_id and u.papel<>'aluno')
    or exists(select 1 from public.professores p where p.usuario_id=v_aluno.usuario_id)
    or exists(select 1 from public.alunos a where a.usuario_id=v_aluno.usuario_id and a.id<>p_aluno_id)
  ) then raise exception 'ACESSO_ALUNO_COMPARTILHADO'; end if;
  select coalesce(array_agg(distinct path) filter(where path is not null and path<>''),'{}') into v_fotos
  from (select v_aluno.foto_url as path union all select c.foto_assinatura_url from public.contratos c where c.aluno_id=p_aluno_id) photos;
  insert into public.exclusoes_aluno(aluno_id,usuario_id,solicitado_por,fotos)
  values(p_aluno_id,v_aluno.usuario_id,p_actor_id,v_fotos) returning * into v_job;
  if v_aluno.usuario_id is not null then update public.usuarios set ativo=false where id=v_aluno.usuario_id; end if;
  delete from public.comissoes_professor_aluno where aluno_id=p_aluno_id;
  delete from public.presencas where aluno_id=p_aluno_id;
  delete from public.cobrancas where aluno_id=p_aluno_id;
  delete from public.contratos where aluno_id=p_aluno_id;
  delete from public.matriculas_turma where aluno_id=p_aluno_id;
  delete from public.alunos where id=p_aluno_id;
  insert into public.auditoria(tabela,registro_id,acao,usuario_id,dados_depois)
  values('alunos',p_aluno_id,'exclusao_definitiva',p_actor_id,jsonb_build_object('exclusao_id',v_job.id,'acesso_desativado',v_aluno.usuario_id is not null));
  return to_jsonb(v_job);
end $$;
revoke all on function public.excluir_aluno_transacional(uuid,uuid) from public,anon,authenticated;
grant execute on function public.excluir_aluno_transacional(uuid,uuid) to service_role;
create or replace function public.excluir_aluno_definitivamente(p_aluno_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin perform public.excluir_aluno_transacional(auth.uid(),p_aluno_id); end $$;
revoke all on function public.excluir_aluno_definitivamente(uuid) from public,anon;
grant execute on function public.excluir_aluno_definitivamente(uuid) to authenticated;
notify pgrst,'reload schema';
commit;



begin;
create or replace function public.gerar_relatorio_gestao(p_actor_id uuid,p_origem text,p_filtros jsonb default '{}',p_limite integer default 50,p_offset integer default 0)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_sql text; v_result jsonb; v_limit integer:=least(greatest(coalesce(p_limite,50),1),200); v_offset integer:=greatest(coalesce(p_offset,0),0);
begin
  perform public.definir_autor_acesso(p_actor_id);
  if jsonb_typeof(p_filtros) is distinct from 'object' then raise exception 'FILTROS_INVALIDOS'; end if;
  if p_origem='alunos' then
    v_sql:=$q$select a.id,a.nome as name,a.status::text as status,
      coalesce((select string_agg(distinct m.nome,', ' order by m.nome) from public.matriculas_turma mt join public.turmas t on t.id=mt.turma_id join public.modalidades m on m.id=t.modalidade_id where mt.aluno_id=a.id and mt.data_fim is null),'Sem turma') as modality,
      a.data_matricula as date,extract(year from age(current_date,a.data_nascimento))::int as age
      from public.alunos a where
      (nullif($1->>'status','') is null or a.status::text=$1->>'status')
      and (nullif($1->>'startDate','') is null or a.data_matricula>=($1->>'startDate')::date)
      and (nullif($1->>'endDate','') is null or a.data_matricula<=($1->>'endDate')::date)
      and ((nullif($1->>'modality','') is null and nullif($1->>'teacher','') is null) or exists(
        select 1 from public.matriculas_turma mt join public.turmas t on t.id=mt.turma_id where mt.aluno_id=a.id and mt.data_fim is null
        and (nullif($1->>'modality','') is null or t.modalidade_id=($1->>'modality')::uuid)
        and (nullif($1->>'teacher','') is null or t.professor_id=($1->>'teacher')::uuid)))$q$;
  elsif p_origem='frequencia' then
    v_sql:=$q$select * from (select a.id::text||'-'||t.id::text as id,a.nome as name,
      m.nome||' - '||t.horario_inicio::text as class,p.nome as teacher,
      round(100.0*count(*) filter(where pr.status='presente')/nullif(count(*),0),2) as percentage,
      count(*) filter(where pr.status='falta') as absences,count(*) filter(where pr.status='falta_justificada') as justified
      from public.presencas pr join public.alunos a on a.id=pr.aluno_id join public.turmas t on t.id=pr.turma_id
      join public.modalidades m on m.id=t.modalidade_id join public.professores p on p.id=t.professor_id
      where (nullif($1->>'class','') is null or t.id=($1->>'class')::uuid)
      and (nullif($1->>'teacher','') is null or p.id=($1->>'teacher')::uuid)
      and (nullif($1->>'startDate','') is null or pr.data_aula>=($1->>'startDate')::date)
      and (nullif($1->>'endDate','') is null or pr.data_aula<=($1->>'endDate')::date)
      group by a.id,a.nome,t.id,m.nome,p.nome) frequency
      where (nullif($1->>'percentage','') is null or
        ($1->>'percentage'='<50' and percentage<50) or
        ($1->>'percentage'='50-75' and percentage between 50 and 75) or
        ($1->>'percentage'='>75' and percentage>75))$q$;
  elsif p_origem='financeiro' then
    v_sql:=$q$select * from (select c.id,a.nome as name,c.descricao as description,c.valor as amount,c.vencimento as "dueDate",
      case when c.status='pendente' and c.vencimento<current_date then 'atrasada' else c.status::text end as status,
      coalesce(c.forma_pagamento::text,'—') as method from public.cobrancas c join public.alunos a on a.id=c.aluno_id
      where (nullif($1->>'paymentMethod','') is null or c.forma_pagamento::text=$1->>'paymentMethod')
      and (nullif($1->>'startDate','') is null or c.vencimento>=($1->>'startDate')::date)
      and (nullif($1->>'endDate','') is null or c.vencimento<=($1->>'endDate')::date)) charges
      where (nullif($1->>'status','') is null or status=$1->>'status')$q$;
  elsif p_origem='contratos' then
    v_sql:=$q$select * from (select c.id,a.nome as name,
      case when c.status='aguardando_assinatura' and c.token_expira_em<now() then 'expirado'
        when c.status='aceito' and c.data_fim_vigencia<current_date then 'vencido'
        when c.status='aceito' and c.data_fim_vigencia<=current_date+30 then 'vencendo'
        else c.status::text end as status,c.data_envio::date as sent,c.data_aceite::date as accepted
      from public.contratos c join public.alunos a on a.id=c.aluno_id
      where (nullif($1->>'startDate','') is null or c.data_envio::date>=($1->>'startDate')::date)
      and (nullif($1->>'endDate','') is null or c.data_envio::date<=($1->>'endDate')::date)) contracts
      where (nullif($1->>'status','') is null or status=$1->>'status')$q$;
  elsif p_origem='repasses' then
    v_sql:=$q$select r.id::text||'-'||coalesce(ri.id::text,'total') as id,p.nome as teacher,
      coalesce(a.nome,'Fechamento sem itens') as name,coalesce(ri.aulas_finalizadas,0) as classes,
      coalesce(ri.valor,r.valor_total) as amount,r.mes_referencia as month,r.status::text as status
      from public.repasses_professor r join public.professores p on p.id=r.professor_id
      left join public.repasse_itens ri on ri.repasse_id=r.id left join public.alunos a on a.id=ri.aluno_id
      where (nullif($1->>'teacher','') is null or p.id=($1->>'teacher')::uuid)
      and (nullif($1->>'status','') is null or r.status::text=$1->>'status')
      and (nullif($1->>'startDate','') is null or r.mes_referencia>=($1->>'startDate')::date)
      and (nullif($1->>'endDate','') is null or r.mes_referencia<=($1->>'endDate')::date)$q$;
  else raise exception 'ORIGEM_INVALIDA'; end if;
  execute 'with base as ('||v_sql||'), page as (select * from base order by id limit $2 offset $3) select jsonb_build_object(''rows'',coalesce((select jsonb_agg(to_jsonb(page)) from page),''[]''::jsonb),''total'',(select count(*) from base))'
    into v_result using p_filtros,v_limit,v_offset;
  return v_result;
end $$;
revoke all on function public.gerar_relatorio_gestao(uuid,text,jsonb,integer,integer) from public,anon,authenticated;
grant execute on function public.gerar_relatorio_gestao(uuid,text,jsonb,integer,integer) to service_role;
alter table public.relatorios_salvos enable row level security;
revoke all on public.relatorios_salvos from anon;
do $$ declare p record; begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='relatorios_salvos' loop
    execute format('drop policy %I on public.relatorios_salvos',p.policyname);
  end loop;
end $$;
create policy gestor_relatorios_proprios on public.relatorios_salvos for all to authenticated
using(public.meu_papel()='gestao' and usuario_id=auth.uid())
with check(public.meu_papel()='gestao' and usuario_id=auth.uid());
notify pgrst,'reload schema';
commit;
