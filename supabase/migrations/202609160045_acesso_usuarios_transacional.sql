-- Corrige e torna idempotente a criacao de acessos de gestao e professor.
-- Pode ser executada mais de uma vez no SQL Editor do Supabase.
begin;

-- O papel administrativo vem apenas de app_metadata, que somente o backend
-- com a chave secreta pode alterar. raw_user_meta_data nunca e confiavel para
-- autorizacao porque o proprio usuario pode edita-lo.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Nao alteramos automaticamente a FK usuarios -> auth.users. O banco possui
-- referencias historicas para usuarios com ON DELETE RESTRICT; trocar a regra
-- para CASCADE sem reconciliar todas elas poderia impedir a exclusao no Auth ou
-- apagar autoria. O fluxo abaixo tambem nao depende de excluir Auth para reparar.

-- Um mesmo acesso jamais pode representar dois professores.
do $duplicates$
begin
  if exists (
    select 1
    from public.professores p
    where p.usuario_id is not null
    group by p.usuario_id
    having count(*) > 1
  ) then
    raise exception using
      message = 'Existem professores duplicados para o mesmo usuario.',
      hint = 'Execute supabase/manual/diagnostico_acessos_usuarios.sql e corrija as duplicidades antes de reaplicar a migration.';
  end if;
end;
$duplicates$;

do $unique_link$
declare
  v_usuario_attnum smallint;
begin
  select a.attnum::smallint
    into v_usuario_attnum
  from pg_catalog.pg_attribute a
  where a.attrelid = 'public.professores'::regclass
    and a.attname = 'usuario_id'
    and not a.attisdropped;

  if v_usuario_attnum is null then
    raise exception 'A coluna public.professores.usuario_id nao existe';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint c
    where c.conrelid = 'public.professores'::regclass
      and c.contype = 'u'
      and c.conkey = array[v_usuario_attnum]::smallint[]
  ) then
    if exists (
      select 1
      from pg_catalog.pg_constraint c
      where c.conrelid = 'public.professores'::regclass
        and c.conname = 'professores_usuario_id_unique_20260916'
    ) then
      raise exception 'A constraint professores_usuario_id_unique_20260916 existe com outra definicao';
    end if;

    alter table public.professores
      add constraint professores_usuario_id_unique_20260916 unique (usuario_id);
  end if;
end;
$unique_link$;

-- Valida o autor real mesmo quando a chamada chega com a chave secreta. A
-- atribuicao local permite que os triggers de auditoria registrem o gestor que
-- iniciou a operacao, em vez de gravarem usuario nulo para o service_role.
create or replace function public.definir_autor_acesso(p_actor_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

-- Localiza a identidade de um e-mail sem gerar link antes das validacoes de
-- propriedade. A funcao e exclusiva da chave secreta do backend.
create or replace function public.obter_usuario_auth_por_email(p_email text)
returns table(usuario_id uuid, email text, papel text)
language sql
stable
security definer
set search_path = ''
as $$
  select
    au.id,
    au.email::text,
    pg_catalog.lower(coalesce(au.raw_app_meta_data ->> 'papel', ''))
  from auth.users au
  where pg_catalog.lower(pg_catalog.btrim(au.email)) = pg_catalog.lower(pg_catalog.btrim(p_email))
    and au.deleted_at is null
  order by au.created_at
  limit 1
$$;

-- Remove assinaturas da primeira versao do hotfix, caso ela tenha sido
-- executada durante os testes antes desta revisao.
drop function if exists public.provisionar_acesso_usuario(uuid,text,text,public.papel_usuario,uuid);
drop function if exists public.reparar_vinculo_professor_orfao(uuid,uuid);
drop function if exists public.limpar_acesso_usuario_incompleto(uuid,uuid);

-- Faz perfil + vinculo do professor na mesma transacao PostgreSQL. Esta RPC e
-- intencionalmente exclusiva do service_role e nunca fica exposta ao browser.
create or replace function public.provisionar_acesso_usuario(
  p_actor_id uuid,
  p_usuario_id uuid,
  p_nome text,
  p_email text,
  p_papel public.papel_usuario,
  p_professor_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

-- Remove somente um vinculo comprovadamente orfao. Um erro de rede ao consultar
-- o Auth nao deve chamar esta funcao; o backend so a usa depois de um 404 real.
create or replace function public.reparar_vinculo_professor_orfao(
  p_actor_id uuid,
  p_professor_id uuid,
  p_usuario_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

-- Limpeza conservadora para uso manual. Nunca desfaz vinculo operacional e
-- nunca apaga o Auth; retorna false se o UUID passou a ser usado concorrentemente.
create or replace function public.limpar_acesso_usuario_incompleto(
  p_actor_id uuid,
  p_usuario_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

revoke all on function public.definir_autor_acesso(uuid) from public, anon, authenticated;
revoke all on function public.obter_usuario_auth_por_email(text) from public, anon, authenticated;
revoke all on function public.provisionar_acesso_usuario(uuid,uuid,text,text,public.papel_usuario,uuid) from public, anon, authenticated;
revoke all on function public.reparar_vinculo_professor_orfao(uuid,uuid,uuid) from public, anon, authenticated;
revoke all on function public.limpar_acesso_usuario_incompleto(uuid,uuid) from public, anon, authenticated;
grant execute on function public.obter_usuario_auth_por_email(text) to service_role;
grant execute on function public.provisionar_acesso_usuario(uuid,uuid,text,text,public.papel_usuario,uuid) to service_role;
grant execute on function public.reparar_vinculo_professor_orfao(uuid,uuid,uuid) to service_role;
grant execute on function public.limpar_acesso_usuario_incompleto(uuid,uuid) to service_role;

notify pgrst, 'reload schema';
commit;
