-- Congela os dados exibidos no contrato no instante da assinatura.
begin;

alter table public.contratos
  add column if not exists documento_assinado_snapshot jsonb,
  add column if not exists documento_assinado_hash text;

create or replace function public.proteger_snapshot_contrato()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.documento_assinado_snapshot is not null and
     (new.documento_assinado_snapshot is distinct from old.documento_assinado_snapshot or
      new.documento_assinado_hash is distinct from old.documento_assinado_hash) then
    raise exception 'A via assinada do contrato e imutavel';
  end if;
  return new;
end $$;

drop trigger if exists trg_proteger_snapshot_contrato on public.contratos;
create trigger trg_proteger_snapshot_contrato
before update on public.contratos
for each row execute function public.proteger_snapshot_contrato();

create or replace function public.assinar_contrato_com_consentimento(
  p_token text,
  p_foto_path text,
  p_ip text default null,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
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
end $$;

revoke all on function public.assinar_contrato_com_consentimento(text,text,text,text) from public, anon, authenticated;
grant execute on function public.assinar_contrato_com_consentimento(text,text,text,text) to service_role;

create index if not exists idx_contratos_documento_hash
  on public.contratos (documento_assinado_hash)
  where documento_assinado_hash is not null;

commit;
