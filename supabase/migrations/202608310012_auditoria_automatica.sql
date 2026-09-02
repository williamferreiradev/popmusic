-- Trilha de auditoria imutavel para operacoes sensiveis.
begin;

alter table public.auditoria enable row level security;
revoke insert, update, delete, truncate on public.auditoria from anon, authenticated;

drop policy if exists "gestao_le_auditoria" on public.auditoria;
create policy "gestao_le_auditoria" on public.auditoria for select to authenticated
using (public.meu_papel()='gestao');

create index if not exists idx_auditoria_tabela_registro on public.auditoria(tabela,registro_id);
create index if not exists idx_auditoria_usuario_data on public.auditoria(usuario_id,criado_em desc);
create index if not exists idx_auditoria_data on public.auditoria(criado_em desc);

create or replace function public.sanitizar_auditoria(p_tabela text,p_dados jsonb)
returns jsonb language sql immutable set search_path=public as $$
  select case p_tabela
    when 'alunos' then p_dados - array['cpf','telefone','email','responsavel_cpf','responsavel_telefone','responsavel_email','foto_url','avatar_url']
    when 'professores' then p_dados - array['cpf','telefone','email']
    when 'contratos' then p_dados - array['token','texto_gerado','foto_assinatura_url','aceite_hash','aceite_ip','aceite_user_agent']
    when 'cobrancas' then p_dados - array['gateway_referencia']
    when 'usuarios' then p_dados - array['telefone']
    else p_dados
  end
$$;

create or replace function public.registrar_auditoria_automatica()
returns trigger language plpgsql security definer set search_path=public as $$
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
end $$;

do $$
declare v_tabela text;
begin
  foreach v_tabela in array array[
    'usuarios','alunos','professores','turmas','matriculas_turma','contratos',
    'cobrancas','presencas','recibos','repasses_professor','fluxo_caixa','contas_financeiras'
  ] loop
    execute format('drop trigger if exists trg_auditoria_automatica on public.%I',v_tabela);
    execute format('create trigger trg_auditoria_automatica after insert or update or delete on public.%I for each row execute function public.registrar_auditoria_automatica()',v_tabela);
  end loop;

  if to_regclass('public.chamadas_aula') is not null then
    execute 'drop trigger if exists trg_auditoria_automatica on public.chamadas_aula';
    execute 'create trigger trg_auditoria_automatica after insert or update or delete on public.chamadas_aula for each row execute function public.registrar_auditoria_automatica()';
  end if;
end $$;

commit;
