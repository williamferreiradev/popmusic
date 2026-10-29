-- Compatibilidade com clientes que omitem o autor ao receber claims com sub.
-- auth.uid() vem do JWT validado pelo Supabase; nenhuma policy e relaxada.
begin;
alter table public.chamadas_aula alter column finalizada_por set default auth.uid();
alter table public.presencas alter column registrado_por set default auth.uid();
notify pgrst, 'reload schema';
commit;
