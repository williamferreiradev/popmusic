-- Views do portal do professor: escopo por usuario e RLS do chamador.
begin;

drop view if exists public.vw_professor_agenda;
drop view if exists public.vw_professor_alunos;
drop view if exists public.vw_professor_meu_repasse;

create view public.vw_professor_agenda
with (security_invoker = true)
as
select
  t.id as turma_id,
  t.dia_semana,
  t.horario_inicio,
  t.horario_fim,
  t.capacidade_maxima,
  m.nome as modalidade,
  m.cor_calendario,
  s.nome as sala,
  count(mt.id) filter (where mt.data_fim is null) as alunos_matriculados
from public.turmas t
join public.modalidades m on m.id = t.modalidade_id
join public.salas s on s.id = t.sala_id
left join public.matriculas_turma mt on mt.turma_id = t.id
where t.ativo = true and t.professor_id = public.meu_professor_id()
group by t.id, m.nome, m.cor_calendario, s.nome;

create view public.vw_professor_alunos
with (security_invoker = true)
as
select distinct
  a.id,
  a.nome,
  null::text as telefone,
  null::text as email,
  a.status,
  null::text as tipo_sanguineo,
  null::text as emergencia_nome,
  null::text as emergencia_telefone
from public.alunos a
join public.matriculas_turma mt on mt.aluno_id = a.id and mt.data_fim is null
join public.turmas t on t.id = mt.turma_id
where a.status = 'ativo' and t.ativo = true and t.professor_id = public.meu_professor_id();

create view public.vw_professor_meu_repasse
with (security_invoker = true)
as
select r.id, r.mes_referencia, r.valor_total, r.status, r.data_pagamento
from public.repasses_professor r
where r.professor_id = public.meu_professor_id();

revoke all on public.vw_professor_agenda from public, anon;
revoke all on public.vw_professor_alunos from public, anon;
revoke all on public.vw_professor_meu_repasse from public, anon;
grant select on public.vw_professor_agenda to authenticated;
grant select on public.vw_professor_alunos to authenticated;
grant select on public.vw_professor_meu_repasse to authenticated;

commit;
