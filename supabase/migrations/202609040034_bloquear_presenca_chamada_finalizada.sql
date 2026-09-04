-- Impede o professor de alterar presencas depois do fechamento da chamada.
begin;
drop policy if exists "professor_registra_presenca" on public.presencas;
create policy "professor_registra_presenca" on public.presencas for insert to authenticated
with check (
  public.meu_papel()='professor'::public.papel_usuario and public.turma_do_professor(turma_id)
  and public.aluno_do_professor(aluno_id) and registrado_por=auth.uid()
  and not exists (select 1 from public.chamadas_aula ca where ca.turma_id=presencas.turma_id and ca.data_aula=presencas.data_aula and ca.ativa=true)
);

drop policy if exists "professor_atualiza_presenca" on public.presencas;
create policy "professor_atualiza_presenca" on public.presencas for update to authenticated
using (
  public.meu_papel()='professor'::public.papel_usuario and public.turma_do_professor(turma_id)
  and not exists (select 1 from public.chamadas_aula ca where ca.turma_id=presencas.turma_id and ca.data_aula=presencas.data_aula and ca.ativa=true)
)
with check (
  public.turma_do_professor(turma_id) and public.aluno_do_professor(aluno_id) and registrado_por=auth.uid()
  and not exists (select 1 from public.chamadas_aula ca where ca.turma_id=presencas.turma_id and ca.data_aula=presencas.data_aula and ca.ativa=true)
);
commit;
