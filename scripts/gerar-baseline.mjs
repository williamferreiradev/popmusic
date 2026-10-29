import {readFileSync,writeFileSync} from 'node:fs'
const source=process.argv[2]||'.data/estrutura-recuperacao.json'
const s=JSON.parse(readFileSync(source,'utf8'))
const q=n=>'"'+n.replaceAll('"','""')+'"'
const literal=v=>v===null?'null':"'"+String(v).replaceAll("'","''")+"'"
if(s.tables.some(t=>/nextval\(/i.test(t.ddl))) throw new Error('Há sequências que precisam de exportação específica; não gerar baseline incompleta.')
const views=[];let pending=[...s.views]
while(pending.length){const ready=pending.filter(v=>v.dependencies.every(d=>views.some(x=>x.name===d)||!s.views.some(x=>x.name===d)));if(!ready.length)throw new Error('Dependência circular entre views');views.push(...ready);pending=pending.filter(v=>!ready.includes(v))}
const lines=[
'-- Baseline da aplicação Pop Music, extraída de pg_catalog em 29/10/2026.',
'-- Sem dados pessoais. Requer projeto Supabase novo, com Auth e Storage provisionados.',
'-- Inclui estado histórico até 047 e migrations 048/049 ao final; não reaplicar migrations anteriores.',
'begin;',
`do $guard$ begin if exists(select 1 from pg_tables where schemaname='public') then raise exception 'BASELINE_REQUER_SCHEMA_PUBLIC_VAZIO'; end if; if to_regclass('auth.users') is null or to_regclass('storage.buckets') is null then raise exception 'AUTH_E_STORAGE_SUPABASE_OBRIGATORIOS'; end if; end $guard$;`,
'create schema if not exists extensions;',
'create extension if not exists pgcrypto with schema extensions;',
'create extension if not exists "uuid-ossp" with schema extensions;',
'set local check_function_bodies=false;',
'set local search_path=public,extensions,pg_catalog;',
...s.types,...s.tables.map(t=>t.ddl),...s.constraints.filter(c=>c.type!=='f').map(c=>c.ddl),
...s.functions.map(f=>f.ddl.endsWith(';')?f.ddl:f.ddl+';'),...s.constraints.filter(c=>c.type==='f').map(c=>c.ddl),
...views.map(v=>v.ddl.trim().endsWith(';')?v.ddl:v.ddl+';'),...s.indexes,...s.triggers,
...s.tables.flatMap(t=>[...(t.rls?[`alter table public.${q(t.name)} enable row level security;`]:[]),...(t.force?[`alter table public.${q(t.name)} force row level security;`]:[])]),
...s.policies,
...s.tables.concat(s.views).map(t=>`revoke all on table public.${q(t.name)} from public,anon,authenticated,service_role;`),...s.grants,
...s.functions.flatMap(f=>[`revoke all on function ${f.signature} from public,anon,authenticated,service_role;`,...f.acl.map(a=>`grant ${a.privilege} on function ${f.signature} to ${a.grantee==='public'?'public':q(a.grantee)};`)]),
...s.buckets.map(b=>`insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values(${literal(b.id)},${literal(b.name)},${b.public?'true':'false'},${b.file_size_limit??'null'},${b.allowed_mime_types?'array['+b.allowed_mime_types.map(literal).join(',')+']::text[]':'null'}) on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;`),
'set local check_function_bodies=true;', 'commit;',
readFileSync('supabase/migrations/202610290048_exclusao_aluno_atomica.sql','utf8'),
readFileSync('supabase/migrations/202610290049_relatorios_reais.sql','utf8')]
writeFileSync('supabase/baseline/20261029_schema.sql',lines.join('\n\n')+'\n')
console.log(`Baseline gerada: ${s.tables.length+1} tabelas, ${s.views.length} views; sem linhas de usuários/alunos.`)
