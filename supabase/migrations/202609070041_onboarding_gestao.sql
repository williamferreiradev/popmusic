begin;

alter table public.usuarios add column if not exists onboarding_concluido boolean;
update public.usuarios set onboarding_concluido=true where onboarding_concluido is null;
alter table public.usuarios alter column onboarding_concluido set default false;
alter table public.usuarios alter column onboarding_concluido set not null;

create or replace function public.concluir_onboarding()
returns void language plpgsql security definer set search_path=public as $$
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode concluir o onboarding'; end if;
  if not exists(select 1 from public.modalidades where ativo)
    or not exists(select 1 from public.salas where ativo)
    or not exists(select 1 from public.professores where ativo)
    or not exists(select 1 from public.turmas where ativo) then
    raise exception 'Conclua todas as etapas antes de finalizar';
  end if;
  update public.usuarios set onboarding_concluido=true, atualizado_em=now() where id=auth.uid();
end $$;

revoke all on function public.concluir_onboarding() from public,anon;
grant execute on function public.concluir_onboarding() to authenticated;

commit;
