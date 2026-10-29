-- Executar somente no destino restaurado, após carregar os dados.
do $verify$
declare fk record; v_join text; v_nonnull text; v_bad bigint;
begin
 for fk in select c.oid,c.conname,c.conrelid,c.confrelid,c.conkey,c.confkey from pg_constraint c join pg_namespace n on n.oid=c.connamespace where c.contype='f' and n.nspname in ('public','auth','storage') loop
  select string_agg(format('child.%I=parent.%I',a.attname,b.attname),' and ' order by k.ord),string_agg(format('child.%I is not null',a.attname),' and ' order by k.ord)
   into v_join,v_nonnull from unnest(fk.conkey,fk.confkey) with ordinality k(a,b,ord)
   join pg_attribute a on a.attrelid=fk.conrelid and a.attnum=k.a join pg_attribute b on b.attrelid=fk.confrelid and b.attnum=k.b;
  execute format('select count(*) from %s child where %s and not exists(select 1 from %s parent where %s)',fk.conrelid::regclass,v_nonnull,fk.confrelid::regclass,v_join) into v_bad;
  if v_bad>0 then raise exception 'RECUPERACAO_COM_REFERENCIAS_ORFAS: % (% registros)',fk.conname,v_bad;end if;
 end loop;
 if exists(select 1 from pg_tables where schemaname='public' and not rowsecurity) then raise exception 'RECUPERACAO_COM_TABELA_SEM_RLS';end if;
 if exists(select 1 from storage.buckets where id='fotos_alunos' and public) then raise exception 'BUCKET_DE_EVIDENCIAS_PUBLICO';end if;
end $verify$;
select 'INTEGRIDADE_E_RLS_VERIFICADAS' as resultado;
