-- Backup lógico privado: inclui dados sensíveis de Auth. Somente service_role.
-- Executar criação no SQL Editor; remover a função imediatamente após o backup.
create or replace function public.exportar_backup_recuperacao()
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
declare t record; v_rows jsonb; v_tables jsonb:='[]'; v_columns jsonb; v_override text; v_ddl text; v_result jsonb;
begin
 for t in select c.oid,n.nspname,c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('public','auth','storage') and c.relkind='r'
  and not(n.nspname in ('auth','storage') and c.relname in ('schema_migrations','migrations')) order by n.nspname,c.relname loop
  select jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'generated',a.attgenerated<>'') order by a.attnum),
   coalesce(string_agg(format(' || jsonb_build_object(%L,t.%I::text)',a.attname,a.attname),'' order by a.attnum) filter(where a.atttypid not in ('json'::regtype,'jsonb'::regtype)),''),
   format('create table %I.%I (%s);',t.nspname,t.relname,string_agg(format('%I %s%s%s',a.attname,format_type(a.atttypid,a.atttypmod),case when a.attgenerated='s' then ' generated always as ('||pg_get_expr(d.adbin,d.adrelid)||') stored' when a.attidentity<>'' then ' generated '||case when a.attidentity='a' then 'always' else 'by default' end||' as identity' when d.oid is not null then ' default '||pg_get_expr(d.adbin,d.adrelid) else '' end,case when a.attnotnull then ' not null' else '' end),', ' order by a.attnum))
  into v_columns,v_override,v_ddl from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where a.attrelid=t.oid and a.attnum>0 and not a.attisdropped;
  execute format('select coalesce(jsonb_agg(to_jsonb(t)%s),''[]''::jsonb) from %I.%I t',v_override,t.nspname,t.relname) into v_rows;
  v_tables:=v_tables||jsonb_build_array(jsonb_build_object('schema',t.nspname,'name',t.relname,'columns',v_columns,'ddl',v_ddl,'rows',v_rows));
 end loop;
 select jsonb_build_object('version',1,'tables',v_tables,
  'platformTypes',(select coalesce(jsonb_agg(format('create type %I.%I as enum (%s);',n.nspname,enum_type.typname,(select string_agg(quote_literal(e.enumlabel),',' order by e.enumsortorder) from pg_enum e where e.enumtypid=enum_type.oid))),'[]') from pg_type enum_type join pg_namespace n on n.oid=enum_type.typnamespace where n.nspname in ('auth','storage') and enum_type.typtype='e'),
  'platformConstraints',(select coalesce(jsonb_agg(format('alter table %I.%I add constraint %I %s;',n.nspname,c.relname,con.conname,pg_get_constraintdef(con.oid,true)) order by case when con.contype='f' then 1 else 0 end),'[]') from pg_constraint con join pg_class c on c.oid=con.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('auth','storage') and c.relkind='r' and c.relname not in ('schema_migrations','migrations')),
  'sequences',(select coalesce(jsonb_agg(jsonb_build_object('schema',schemaname,'name',sequencename,'lastValue',last_value::text,'ddl',format('create sequence %I.%I as %s increment by %s minvalue %s maxvalue %s start with %s cache %s%s;',schemaname,sequencename,data_type,increment_by,min_value,max_value,start_value,cache_size,case when cycle then ' cycle' else '' end))),'[]') from pg_sequences where schemaname in ('public','auth','storage')),
  'postgresVersion',current_setting('server_version_num')) into v_result;
 return v_result;
end $$;
revoke all on function public.exportar_backup_recuperacao() from public,anon,authenticated;
grant execute on function public.exportar_backup_recuperacao() to service_role;
notify pgrst,'reload schema';
