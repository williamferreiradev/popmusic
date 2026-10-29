import{createClient}from'@supabase/supabase-js'
import{readFile,writeFile}from'node:fs/promises'
import{resolve,join}from'node:path'
import{createHash}from'node:crypto'
import{connectionEnvironment,postgresTool}from'./recovery/postgres-tools.mjs'
const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1]}
const folder=arg('--directory')?resolve(arg('--directory')):null
if(!folder||!process.argv.includes('--confirm-empty-target'))throw new Error('Use --directory PASTA --confirm-empty-target. A restauração aceita somente projeto Supabase novo.')
const manifest=JSON.parse(await readFile(join(folder,'manifest.json'),'utf8'))
if(!manifest.complete)throw new Error('O backup está incompleto.')
const target=process.env.POPMUSIC_RESTORE_DATABASE_URL
const env=connectionEnvironment(target)
const url=new URL(target),user=decodeURIComponent(url.username)
const targetRef=url.hostname.startsWith('db.')?url.hostname.split('.')[1]:user.startsWith('postgres.')?user.slice(9):null
if(!targetRef||targetRef===manifest.projectRef||targetRef!==arg('--target-project-ref'))throw new Error('O destino precisa ser outro projeto Supabase e corresponder a --target-project-ref.')
const digest=data=>createHash('sha256').update(data).digest('hex')
for(const file of manifest.files){if(!['schema.sql','data.dump','storage-manifest.json'].includes(file.name))throw new Error('Manifesto inválido.');if(digest(await readFile(join(folder,file.name)))!==file.sha256)throw new Error('O checksum do backup não confere.')}
const log=join(folder,'restore-error.log')
const empty=await postgresTool('psql',['-X','-At','-c',"select (select count(*) from pg_tables where schemaname='public')+(select count(*) from auth.users)+(select count(*) from storage.objects)"],env,log)
if(empty!=='0')throw new Error('O destino não está vazio. Nenhum dado foi removido.')
const targetStorageUrl=process.env.POPMUSIC_RESTORE_SUPABASE_URL
if(!targetStorageUrl||new URL(targetStorageUrl).hostname.split('.')[0]!==targetRef||!process.env.POPMUSIC_RESTORE_SUPABASE_SECRET_KEY)throw new Error('Configure a URL e chave secreta do Storage do projeto destino para uma recuperação completa.')
const state={complete:false,stage:'starting',targetRef,startedAt:new Date().toISOString()}
const save=()=>writeFile(join(folder,'restore-result.json'),JSON.stringify(state,null,2))
await save()
try{
 await postgresTool('pg_restore',['--data-only','--no-owner','--no-privileges','--file='+join(folder,'restore-data.sql'),join(folder,'data.dump')],env,log)
 await postgresTool('psql',['-X','--set','ON_ERROR_STOP=1','--file',join(folder,'schema.sql')],env,log)
 state.stage='schema-created';await save()
 await postgresTool('psql',['-X','--single-transaction','--set','ON_ERROR_STOP=1','--command',"set session_replication_role=replica; delete from storage.buckets where id='fotos_alunos'",'--file',join(folder,'restore-data.sql'),'--command','set session_replication_role=origin','--file',resolve('supabase/manual/verificar_recuperacao.sql')],env,log)
 state.stage='database-restored';await save()
 const objects=JSON.parse(await readFile(join(folder,'storage-manifest.json'),'utf8'))
 const client=createClient(targetStorageUrl,process.env.POPMUSIC_RESTORE_SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}})
 for(const item of objects){if(!/^[a-f0-9]{64}\.bin$/.test(item.file))throw new Error('Nome de arquivo inválido no manifesto de Storage.')
  const bytes=await readFile(join(folder,'storage',item.file));if(digest(bytes)!==item.sha256)throw new Error('Checksum inválido em uma evidência do Storage.')
  const r=await client.storage.from('fotos_alunos').upload(item.path,bytes,{contentType:item.contentType,upsert:true});if(r.error)throw new Error('Falha na restauração de arquivo de Storage.')
  const check=await client.storage.from('fotos_alunos').download(item.path);if(check.error||digest(Buffer.from(await check.data.arrayBuffer()))!==item.sha256)throw new Error('O arquivo restaurado não passou na conferência de conteúdo.')
 }
 state.stage='database-and-storage-restored';state.complete=true;state.finishedAt=new Date().toISOString();await save()
 console.log('Banco e arquivos restaurados no projeto destino. Configure Auth, chaves e URLs do novo projeto e homologue login, matrícula e financeiro antes de apontar a aplicação.')
}catch(error){await save();console.error(error.message);console.error('Restauração não concluída. Etapa registrada em restore-result.json; não apontar a aplicação para esse destino.');process.exitCode=1}
