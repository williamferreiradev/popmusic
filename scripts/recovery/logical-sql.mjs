export const sqlIdentifier=value=>'"'+value.replaceAll('"','""')+'"'
export const sqlLiteral=value=>"'"+value.replaceAll("'","''")+"'"
export function logicalRestoreSql(backup){
 const statements=["set local standard_conforming_strings=on;","set local search_path=pg_catalog;","set local session_replication_role=replica;","delete from storage.buckets where id='fotos_alunos';"]
 for(const t of backup.tables){
  if(!['public','auth','storage'].includes(t.schema)||!/^\w+$/.test(t.name)||t.columns.some(c=>!/^\w+$/.test(c.name)))throw new Error('Identificador inválido no backup.')
  const table=sqlIdentifier(t.schema)+'.'+sqlIdentifier(t.name)
  const columns=t.columns.filter(c=>!c.generated)
  const names=columns.map(c=>sqlIdentifier(c.name)).join(',')
  statements.push(`do $check$ declare c jsonb; v_type text; n bigint; begin
   for c in select * from jsonb_array_elements(${sqlLiteral(JSON.stringify(t.columns))}::jsonb) loop
    select format_type(a.atttypid,a.atttypmod) into v_type from pg_attribute a where a.attrelid=${sqlLiteral(table)}::regclass and a.attname=c->>'name' and not a.attisdropped;
    if v_type is distinct from c->>'type' then raise exception 'VERSAO_DE_SCHEMA_INCOMPATIVEL: %.%',${sqlLiteral(table)},c->>'name';end if;
   end loop;
   select count(*) into n from ${table};if n<>0 then raise exception 'DESTINO_CONTEM_DADOS: %',${sqlLiteral(table)};end if;
  end $check$;`)
  if(t.rows.length)statements.push(`insert into ${table}(${names}) overriding system value select ${names} from jsonb_populate_recordset(null::${table},${sqlLiteral(JSON.stringify(t.rows))}::jsonb);`)
  statements.push(`do $count$ begin if (select count(*) from ${table})<>${t.rows.length} then raise exception 'CONTAGEM_RESTAURADA_DIVERGENTE';end if;end $count$;`)
 }
 for(const s of backup.sequences){if(s.lastValue!==null)statements.push(`select setval(${sqlLiteral(sqlIdentifier(s.schema)+'.'+sqlIdentifier(s.name))}::regclass,${sqlLiteral(s.lastValue)}::bigint,true);`)}
 statements.push('set local session_replication_role=origin;')
 return statements.join('\n')
}
