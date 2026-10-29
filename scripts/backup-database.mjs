import {createClient} from '@supabase/supabase-js'
import {mkdir,writeFile,readFile,copyFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {resolve,join} from 'node:path'
import {connectionEnvironment,postgresTool} from './recovery/postgres-tools.mjs'
const digest=data=>createHash('sha256').update(data).digest('hex')
const env=connectionEnvironment(process.env.POPMUSIC_DATABASE_URL)
const folder=resolve('.data','backups',new Date().toISOString().replaceAll(':','-'))
await mkdir(folder,{recursive:true})
const manifest={version:1,complete:false,createdAt:new Date().toISOString(),projectRef:new URL(process.env.NUXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0],scope:['public','auth','storage metadata','fotos_alunos files'],files:[]}
const save=()=>writeFile(join(folder,'manifest.json'),JSON.stringify(manifest,null,2))
await save()
try{
 manifest.postgresVersion=await postgresTool('psql',['-X','-At','-c','show server_version_num'],env,join(folder,'postgres-error.log'))
 await postgresTool('pg_dump',['--format=custom','--data-only','--no-owner','--no-privileges','--schema=public','--schema=auth','--schema=storage','--file='+join(folder,'data.dump')],env,join(folder,'dump-error.log'))
 await postgresTool('pg_restore',['--list',join(folder,'data.dump')],env,join(folder,'archive-error.log'))
 await copyFile('supabase/baseline/20261029_schema.sql',join(folder,'schema.sql'))
 for(const name of ['data.dump','schema.sql']){const data=await readFile(join(folder,name));if(!data.length)throw new Error('Arquivo de backup vazio.');manifest.files.push({name,bytes:data.length,sha256:digest(data)})}
 const admin=createClient(process.env.NUXT_PUBLIC_SUPABASE_URL,process.env.NUXT_SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}})
 const objects=[];await mkdir(join(folder,'storage'),{recursive:true})
 async function copyFolder(prefix=''){
  for(let offset=0;;offset+=100){
   const{data,error}=await admin.storage.from('fotos_alunos').list(prefix,{limit:100,offset,sortBy:{column:'name',order:'asc'}})
   if(error)throw new Error('Não foi possível listar os arquivos de Storage.')
   for(const item of data||[]){const path=prefix?prefix+'/'+item.name:item.name;if(!item.id){await copyFolder(path);continue}
    const file=await admin.storage.from('fotos_alunos').download(path);if(file.error)throw new Error('Falha no download de um arquivo privado.')
    const bytes=Buffer.from(await file.data.arrayBuffer()),name=digest(path)+'.bin';await writeFile(join(folder,'storage',name),bytes)
    objects.push({path,file:name,sha256:digest(bytes),bytes:bytes.length,contentType:file.data.type||'application/octet-stream'})
   }
   if(!data||data.length<100)break
  }
 }
 await copyFolder();await writeFile(join(folder,'storage-manifest.json'),JSON.stringify(objects,null,2))
 const storageManifest=await readFile(join(folder,'storage-manifest.json'));manifest.files.push({name:'storage-manifest.json',sha256:digest(storageManifest),bytes:storageManifest.length})
 manifest.storageObjects=objects.length;manifest.complete=true;await save()
 console.log('Backup concluído e verificado localmente: '+folder)
 console.log('Guarde uma cópia criptografada fora deste computador. Este backup ainda precisa de ensaio em outro projeto Supabase.')
}catch(error){await save();console.error(error.message);console.error('Backup incompleto; pasta privada: '+folder);process.exitCode=1}
