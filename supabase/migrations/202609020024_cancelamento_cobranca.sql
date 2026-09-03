-- Cancelamento seguro de cobranca aberta. Pagamentos exigem fluxo separado de estorno.
begin;

create or replace function public.cancelar_cobranca_aberta(p_cobranca_id uuid,p_motivo text)
returns void language plpgsql security definer set search_path=public as $$
declare v_status public.status_cobranca;
begin
  if public.meu_papel()<>'gestao'::public.papel_usuario then raise exception 'Apenas a gestao pode cancelar cobrancas'; end if;
  if length(btrim(coalesce(p_motivo,'')))<3 then raise exception 'Informe o motivo do cancelamento'; end if;
  select status into v_status from public.cobrancas where id=p_cobranca_id for update;
  if not found then raise exception 'Cobranca nao encontrada'; end if;
  if v_status='paga'::public.status_cobranca then raise exception 'Cobranca paga nao pode ser cancelada. Realize um estorno'; end if;
  if v_status='cancelada'::public.status_cobranca then raise exception 'Cobranca ja cancelada'; end if;
  update public.cobrancas set status='cancelada',motivo_cancelamento=btrim(p_motivo) where id=p_cobranca_id;
end $$;

revoke all on function public.cancelar_cobranca_aberta(uuid,text) from public,anon;
grant execute on function public.cancelar_cobranca_aberta(uuid,text) to authenticated;
commit;
