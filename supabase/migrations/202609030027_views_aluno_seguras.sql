-- Views do portal do aluno: cada usuário enxerga exclusivamente seus dados.
begin;

-- As views podem existir com uma ordem de colunas legada. O PostgreSQL não
-- permite alterar essa ordem via CREATE OR REPLACE, então recriamos somente
-- as views (nenhuma tabela ou dado é removido).
drop view if exists public.vw_aluno_meu_contrato;
drop view if exists public.vw_aluno_minhas_cobrancas;
drop view if exists public.vw_aluno_minha_frequencia;
drop view if exists public.vw_aluno_minhas_turmas;
drop view if exists public.vw_aluno_meu_perfil;

create view public.vw_aluno_meu_perfil
with (security_invoker = true)
as
select a.id, a.nome, a.email, a.telefone, a.endereco, a.tipo_sanguineo, a.status, a.data_matricula
from public.alunos a
where a.id = public.meu_aluno_id();

create view public.vw_aluno_minhas_turmas
with (security_invoker = true)
as
select
  t.id as turma_id,
  t.dia_semana,
  t.horario_inicio,
  t.horario_fim,
  m.nome as modalidade,
  p.nome as professor,
  s.nome as sala
from public.matriculas_turma mt
join public.turmas t on t.id = mt.turma_id
join public.modalidades m on m.id = t.modalidade_id
left join public.professores p on p.id = t.professor_id
left join public.salas s on s.id = t.sala_id
where mt.aluno_id = public.meu_aluno_id()
  and mt.data_fim is null
  and t.ativo = true;

create view public.vw_aluno_minha_frequencia
with (security_invoker = true)
as
select pr.id, pr.turma_id, pr.data_aula, pr.status, pr.tipo_aula, m.nome as modalidade
from public.presencas pr
join public.turmas t on t.id = pr.turma_id
join public.modalidades m on m.id = t.modalidade_id
where pr.aluno_id = public.meu_aluno_id();

create view public.vw_aluno_minhas_cobrancas
with (security_invoker = true)
as
select c.id, c.descricao, c.valor, c.vencimento, c.status, c.data_pagamento
from public.cobrancas c
where c.aluno_id = public.meu_aluno_id();

create view public.vw_aluno_meu_contrato
with (security_invoker = true)
as
select c.id, c.status, c.data_envio, c.data_aceite, c.data_fim_vigencia, c.pdf_url
from public.contratos c
where c.aluno_id = public.meu_aluno_id();

revoke all on public.vw_aluno_meu_perfil from public, anon;
revoke all on public.vw_aluno_minhas_turmas from public, anon;
revoke all on public.vw_aluno_minha_frequencia from public, anon;
revoke all on public.vw_aluno_minhas_cobrancas from public, anon;
revoke all on public.vw_aluno_meu_contrato from public, anon;

grant select on public.vw_aluno_meu_perfil to authenticated;
grant select on public.vw_aluno_minhas_turmas to authenticated;
grant select on public.vw_aluno_minha_frequencia to authenticated;
grant select on public.vw_aluno_minhas_cobrancas to authenticated;
grant select on public.vw_aluno_meu_contrato to authenticated;

commit;
