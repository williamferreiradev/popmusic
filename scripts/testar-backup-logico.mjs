import{PGlite}from'@electric-sql/pglite'
import{pgcrypto}from'@electric-sql/pglite/contrib/pgcrypto'
import{uuid_ossp}from'@electric-sql/pglite/contrib/uuid_ossp'
import{readFile,writeFile,mkdir,copyFile}from'node:fs/promises'
import{resolve,join}from'node:path'
import{createHash}from'node:crypto'
import{logicalRestoreSql}from'./recovery/logical-sql.mjs'
const directory=process.argv[2]||String(await readFile('.data/ultimo-backup-studio.txt','utf8')).trim()
const folder=resolve(directory),manifest=JSON.parse(await readFile(join(folder,'manifest.json'),'utf8'))
const digest=value=>createHash('sha256').update(value).digest('hex')
if(!manifest.complete||manifest.kind!=='logical-json')throw new Error('Backup lógico incompleto ou não reconhecido.')
for(const f of manifest.files){if(!['database.json','schema.sql'].includes(f.name)||digest(await readFile(join(folder,f.name)))!==f.sha256)throw new Error('Checksum do backup inválido.')}
const backup=JSON.parse(await readFile(join(folder,'database.json'),'utf8')),schema=await readFile(join(folder,'schema.sql'),'utf8')
const db=new PGlite({extensions:{pgcrypto,uuid_ossp}})
try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;create schema extensions;
 create extension pgcrypto with schema extensions;create extension "uuid-ossp" with schema extensions;
 create function auth.uid() returns uuid language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub'))::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}')$$;
 create function auth.role() returns text language sql stable as $$select nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role'$$;
 create function storage.foldername(text) returns text[] language sql immutable as $$select (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1]$$;
 grant usage on schema public,auth,storage,extensions to anon,authenticated,service_role;`)
 for(const ddl of backup.platformTypes)await db.exec(ddl)
 for(const s of backup.sequences.filter(s=>s.schema!=='public'))await db.exec(s.ddl)
 for(const table of backup.tables.filter(t=>t.schema!=='public'))await db.exec(table.ddl)
 for(const ddl of backup.platformConstraints)await db.exec(ddl)
 await db.exec(schema)
 const restoreData=logicalRestoreSql(backup)
 const verify=await readFile('supabase/manual/verificar_recuperacao.sql','utf8')
 await db.exec('begin;\n'+restoreData+'\n'+verify+'\ncommit;')
 let rows=0
 for(const table of backup.tables){const n=Number((await db.query(`select count(*) as n from "${table.schema}"."${table.name}"`)).rows[0].n);if(n!==table.rows.length)throw new Error('Contagem divergente após recuperação.');rows+=n}
 for(const user of backup.tables.find(t=>t.schema==='auth'&&t.name==='users').rows){const restored=(await db.query('select encrypted_password from auth.users where id=$1',[user.id])).rows[0];if(restored.encrypted_password!==user.encrypted_password)throw new Error('Hash de senha divergente.')}
 const restoredFiles=join(folder,'ensaio-arquivos');await mkdir(restoredFiles,{recursive:true})
 for(const object of manifest.storage){if(!/^[a-f0-9]{64}\.bin$/.test(object.file))throw new Error('Arquivo de Storage inválido.');const source=join(folder,'storage',object.file);if(digest(await readFile(source))!==object.sha256)throw new Error('Checksum de arquivo inválido.');await copyFile(source,join(restoredFiles,object.file));if(digest(await readFile(join(restoredFiles,object.file)))!==object.sha256)throw new Error('Arquivo restaurado divergente.')}
 await db.exec('set role anon');let denied=false;try{await db.query('select * from public.alunos')}catch{denied=true}finally{await db.exec('reset role')}
 if(!denied)throw new Error('Acesso anônimo não foi bloqueado no ensaio.')
 await writeFile(join(folder,'restore-data.sql'),'begin;\n'+restoreData+'\n'+verify+'\ncommit;')
 const result={success:true,environment:'PostgreSQL local descartável (PGlite)',tables:backup.tables.length,rows,storageFilesVerified:manifest.storage.length,authPasswordHashesVerified:true,foreignKeysVerified:true,anonymousAccessBlocked:true,restoredAt:new Date().toISOString(),supabaseDestinationTested:false}
 await writeFile(join(folder,'ensaio-resultado.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2))
}catch(error){console.error(JSON.stringify({success:false,error:error.message,table:error.table,constraint:error.constraint}));process.exitCode=1}finally{await db.close()}
