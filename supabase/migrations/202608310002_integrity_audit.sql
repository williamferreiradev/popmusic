-- Pop Music - auditoria nao destrutiva antes das constraints unicas
-- Este arquivo apenas retorna inconsistencias. Deve produzir zero linhas em
-- todas as consultas antes da migracao 202608310003.

-- Tokens de contrato duplicados.
select token, count(*) as quantidade
from public.contratos
group by token
having count(*) > 1;

-- Mais de uma cobranca do mesmo contrato na mesma data.
select contrato_id, vencimento, count(*) as quantidade
from public.cobrancas
where contrato_id is not null
group by contrato_id, vencimento
having count(*) > 1;

-- Presencas duplicadas para aluno/turma/data/tipo.
select aluno_id, turma_id, data_aula, tipo_aula, count(*) as quantidade
from public.presencas
group by aluno_id, turma_id, data_aula, tipo_aula
having count(*) > 1;

-- Matriculas ativas duplicadas.
select aluno_id, turma_id, count(*) as quantidade
from public.matriculas_turma
where data_fim is null
group by aluno_id, turma_id
having count(*) > 1;

-- Contratos aceitos sem os dados minimos da assinatura.
select id, aluno_id, data_aceite, aceite_hash
from public.contratos
where status = 'aceito'::public.status_contrato
  and (data_aceite is null or aceite_hash is null);
