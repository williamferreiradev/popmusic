-- Pop Music - endurecimento de seguranca e consistencia
-- Esta migracao pressupoe que as tabelas ja existem.
-- Nao apaga registros e nao recria o schema.

begin;

-- ---------------------------------------------------------------------------
-- 1. Remover politicas publicas inseguras deixadas pelos scripts legados
-- ---------------------------------------------------------------------------

drop policy if exists "Acesso publico a contratos por token" on public.contratos;
drop policy if exists "Atualizacao publica de contrato assinado" on public.contratos;
drop policy if exists "Insercao de contratos pelo sistema" on public.contratos;
drop policy if exists "Leitura de alunos para contratos e sistema" on public.alunos;
drop policy if exists "Insercao de alunos pelo sistema" on public.alunos;
drop policy if exists "Atualizacao de aluno por foto e status" on public.alunos;
drop policy if exists "Leitura de matriculas_turma publica" on public.matriculas_turma;
drop policy if exists "Acesso a matriculas_turma" on public.matriculas_turma;
drop policy if exists "Leitura de turmas publica" on public.turmas;
drop policy if exists "Leitura de modalidades publica" on public.modalidades;
drop policy if exists "Insercao publica de cobrancas pelo contrato" on public.cobrancas;
drop policy if exists "Leitura publica de cobrancas" on public.cobrancas;
drop policy if exists "Operacoes de cobrancas" on public.cobrancas;
drop policy if exists "Insercao publica de presencas pela assinatura" on public.presencas;
drop policy if exists "Operacoes de presencas" on public.presencas;

-- Os nomes antigos possuem acentos no banco. As variantes abaixo sao
-- necessarias porque identificadores entre aspas sao comparados literalmente.
drop policy if exists "Acesso público a contratos por token" on public.contratos;
drop policy if exists "Atualização pública de contrato assinado" on public.contratos;
drop policy if exists "Inserção de contratos pelo sistema" on public.contratos;
drop policy if exists "Leitura de alunos para contratos e sistema" on public.alunos;
drop policy if exists "Inserção de alunos pelo sistema" on public.alunos;
drop policy if exists "Atualização de aluno por foto e status" on public.alunos;
drop policy if exists "Leitura de matriculas_turma publica" on public.matriculas_turma;
drop policy if exists "Acesso a matriculas_turma" on public.matriculas_turma;
drop policy if exists "Leitura de turmas publica" on public.turmas;
drop policy if exists "Leitura de modalidades publica" on public.modalidades;
drop policy if exists "Inserção pública de cobranças pelo contrato" on public.cobrancas;
drop policy if exists "Leitura pública de cobranças" on public.cobrancas;
drop policy if exists "Operações de cobrancas" on public.cobrancas;
drop policy if exists "Inserção pública de presenças pela assinatura" on public.presencas;
drop policy if exists "Operações de presencas" on public.presencas;

-- ---------------------------------------------------------------------------
-- 2. Funcoes de autorizacao seguras e estaveis
-- ---------------------------------------------------------------------------

create or replace function public.meu_papel()
returns public.papel_usuario
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select u.papel
  from public.usuarios u
  where u.id = auth.uid()
    and u.ativo = true
  limit 1
$$;

create or replace function public.meu_professor_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id
  from public.professores p
  where p.usuario_id = auth.uid()
    and p.ativo = true
  limit 1
$$;

create or replace function public.meu_aluno_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select a.id
  from public.alunos a
  where a.usuario_id = auth.uid()
  limit 1
$$;

create or replace function public.turma_do_professor(p_turma_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.turmas t
    where t.id = p_turma_id
      and t.professor_id = public.meu_professor_id()
  )
$$;

create or replace function public.aluno_do_professor(p_aluno_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.matriculas_turma mt
    join public.turmas t on t.id = mt.turma_id
    where mt.aluno_id = p_aluno_id
      and mt.data_fim is null
      and t.professor_id = public.meu_professor_id()
  )
$$;

revoke all on function public.meu_papel() from public;
revoke all on function public.meu_professor_id() from public;
revoke all on function public.meu_aluno_id() from public;
revoke all on function public.turma_do_professor(uuid) from public;
revoke all on function public.aluno_do_professor(uuid) from public;
grant execute on function public.meu_papel() to authenticated;
grant execute on function public.meu_professor_id() to authenticated;
grant execute on function public.meu_aluno_id() to authenticated;
grant execute on function public.turma_do_professor(uuid) to authenticated;
grant execute on function public.aluno_do_professor(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Trigger de criacao do perfil do usuario
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.usuarios (id, nome, papel, ativo)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nome', ''), split_part(new.email, '@', 1), 'Usuario'),
    'aluno'::public.papel_usuario,
    true
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 4. RLS das tabelas usadas pela aplicacao
-- ---------------------------------------------------------------------------

alter table public.usuarios enable row level security;
alter table public.alunos enable row level security;
alter table public.professores enable row level security;
alter table public.professor_modalidades enable row level security;
alter table public.modalidades enable row level security;
alter table public.salas enable row level security;
alter table public.turmas enable row level security;
alter table public.matriculas_turma enable row level security;
alter table public.contratos enable row level security;
alter table public.cobrancas enable row level security;
alter table public.presencas enable row level security;
alter table public.recibos enable row level security;
alter table public.repasses_professor enable row level security;
alter table public.fluxo_caixa enable row level security;
alter table public.contas_financeiras enable row level security;
alter table public.configuracoes enable row level security;
alter table public.feriados enable row level security;
alter table public.modelos_contrato enable row level security;

-- Gestao possui CRUD nas tabelas operacionais. O service_role continua
-- ignorando RLS e deve existir somente no backend.
do $policies$
declare
  tabela text;
begin
  foreach tabela in array array[
    'usuarios', 'alunos', 'professores', 'professor_modalidades', 'modalidades', 'salas', 'turmas',
    'matriculas_turma', 'contratos', 'cobrancas', 'presencas', 'recibos',
    'repasses_professor', 'fluxo_caixa', 'contas_financeiras',
    'configuracoes', 'feriados', 'modelos_contrato'
  ]
  loop
    execute format('drop policy if exists "gestao_crud" on public.%I', tabela);
    execute format(
      'create policy "gestao_crud" on public.%I for all to authenticated using (public.meu_papel() = ''gestao''::public.papel_usuario) with check (public.meu_papel() = ''gestao''::public.papel_usuario)',
      tabela
    );
  end loop;
end
$policies$;

-- Cada usuario pode consultar o proprio perfil, mas nao alterar o papel.
drop policy if exists "usuario_le_proprio_perfil" on public.usuarios;
create policy "usuario_le_proprio_perfil"
on public.usuarios for select to authenticated
using (id = auth.uid());

-- Catalogos necessarios aos portais autenticados.
drop policy if exists "autenticados_leem_modalidades" on public.modalidades;
create policy "autenticados_leem_modalidades"
on public.modalidades for select to authenticated
using (ativo = true);

drop policy if exists "autenticados_leem_salas" on public.salas;
create policy "autenticados_leem_salas"
on public.salas for select to authenticated
using (ativo = true);

-- Aluno: somente os proprios dados.
drop policy if exists "aluno_le_proprio_cadastro" on public.alunos;
create policy "aluno_le_proprio_cadastro"
on public.alunos for select to authenticated
using (id = public.meu_aluno_id());

drop policy if exists "aluno_le_proprias_matriculas" on public.matriculas_turma;
create policy "aluno_le_proprias_matriculas"
on public.matriculas_turma for select to authenticated
using (aluno_id = public.meu_aluno_id());

drop policy if exists "aluno_le_proprios_contratos" on public.contratos;
create policy "aluno_le_proprios_contratos"
on public.contratos for select to authenticated
using (aluno_id = public.meu_aluno_id());

drop policy if exists "aluno_le_proprias_cobrancas" on public.cobrancas;
create policy "aluno_le_proprias_cobrancas"
on public.cobrancas for select to authenticated
using (aluno_id = public.meu_aluno_id());

drop policy if exists "aluno_le_proprias_presencas" on public.presencas;
create policy "aluno_le_proprias_presencas"
on public.presencas for select to authenticated
using (aluno_id = public.meu_aluno_id());

drop policy if exists "aluno_le_proprios_recibos" on public.recibos;
create policy "aluno_le_proprios_recibos"
on public.recibos for select to authenticated
using (
  exists (
    select 1 from public.cobrancas c
    where c.id = recibos.cobranca_id
      and c.aluno_id = public.meu_aluno_id()
  )
);

-- Professor: somente turmas, alunos, presencas e repasses relacionados.
drop policy if exists "professor_le_proprio_cadastro" on public.professores;
create policy "professor_le_proprio_cadastro"
on public.professores for select to authenticated
using (id = public.meu_professor_id());

drop policy if exists "professor_le_proprias_turmas" on public.turmas;
create policy "professor_le_proprias_turmas"
on public.turmas for select to authenticated
using (professor_id = public.meu_professor_id());

drop policy if exists "professor_le_matriculas_das_turmas" on public.matriculas_turma;
create policy "professor_le_matriculas_das_turmas"
on public.matriculas_turma for select to authenticated
using (public.turma_do_professor(turma_id));

drop policy if exists "professor_le_alunos_das_turmas" on public.alunos;
create policy "professor_le_alunos_das_turmas"
on public.alunos for select to authenticated
using (public.aluno_do_professor(id));

drop policy if exists "professor_le_presencas_das_turmas" on public.presencas;
create policy "professor_le_presencas_das_turmas"
on public.presencas for select to authenticated
using (public.turma_do_professor(turma_id));

drop policy if exists "professor_registra_presenca" on public.presencas;
create policy "professor_registra_presenca"
on public.presencas for insert to authenticated
with check (
  public.meu_papel() = 'professor'::public.papel_usuario
  and public.turma_do_professor(turma_id)
  and public.aluno_do_professor(aluno_id)
  and registrado_por = auth.uid()
);

drop policy if exists "professor_atualiza_presenca" on public.presencas;
create policy "professor_atualiza_presenca"
on public.presencas for update to authenticated
using (public.turma_do_professor(turma_id))
with check (
  public.turma_do_professor(turma_id)
  and public.aluno_do_professor(aluno_id)
  and registrado_por = auth.uid()
);

drop policy if exists "professor_le_proprios_repasses" on public.repasses_professor;
create policy "professor_le_proprios_repasses"
on public.repasses_professor for select to authenticated
using (professor_id = public.meu_professor_id());

-- Nenhuma permissao direta para anon nas tabelas sensiveis.
revoke all on table public.usuarios from anon;
revoke all on table public.alunos from anon;
revoke all on table public.professor_modalidades from anon;
revoke all on table public.matriculas_turma from anon;
revoke all on table public.contratos from anon;
revoke all on table public.cobrancas from anon;
revoke all on table public.presencas from anon;
revoke all on table public.recibos from anon;
revoke all on table public.repasses_professor from anon;
revoke all on table public.fluxo_caixa from anon;

-- ---------------------------------------------------------------------------
-- 5. Storage de fotografias: privado e somente backend/gestao
-- ---------------------------------------------------------------------------

update storage.buckets
set public = false
where id = 'fotos_alunos';

drop policy if exists "Fotos Alunos - Acesso Publico para Leitura" on storage.objects;
drop policy if exists "Fotos Alunos - Upload Publico de Assinatura" on storage.objects;
drop policy if exists "Fotos Alunos - Atualizacao Publica" on storage.objects;
drop policy if exists "Fotos Alunos - Acesso Público para Leitura" on storage.objects;
drop policy if exists "Fotos Alunos - Upload Público de Assinatura" on storage.objects;
drop policy if exists "Fotos Alunos - Atualização Pública" on storage.objects;

drop policy if exists "gestao_le_fotos_alunos" on storage.objects;
create policy "gestao_le_fotos_alunos"
on storage.objects for select to authenticated
using (
  bucket_id = 'fotos_alunos'
  and public.meu_papel() = 'gestao'::public.papel_usuario
);

drop policy if exists "gestao_gerencia_fotos_alunos" on storage.objects;
create policy "gestao_gerencia_fotos_alunos"
on storage.objects for all to authenticated
using (
  bucket_id = 'fotos_alunos'
  and public.meu_papel() = 'gestao'::public.papel_usuario
)
with check (
  bucket_id = 'fotos_alunos'
  and public.meu_papel() = 'gestao'::public.papel_usuario
);

-- ---------------------------------------------------------------------------
-- 6. Indices de apoio para RLS e consultas principais
-- ---------------------------------------------------------------------------

create index if not exists idx_alunos_usuario_id on public.alunos (usuario_id);
create index if not exists idx_professores_usuario_id on public.professores (usuario_id);
create index if not exists idx_professor_modalidades_professor on public.professor_modalidades (professor_id);
create index if not exists idx_turmas_professor_id on public.turmas (professor_id);
create index if not exists idx_matriculas_aluno_turma on public.matriculas_turma (aluno_id, turma_id);
create index if not exists idx_contratos_aluno_id on public.contratos (aluno_id);
create index if not exists idx_cobrancas_aluno_id on public.cobrancas (aluno_id);
create index if not exists idx_cobrancas_contrato_id on public.cobrancas (contrato_id);
create index if not exists idx_presencas_turma_data on public.presencas (turma_id, data_aula);
create index if not exists idx_presencas_aluno_data on public.presencas (aluno_id, data_aula);
create index if not exists idx_repasses_professor_id on public.repasses_professor (professor_id);

commit;
