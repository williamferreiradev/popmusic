import {createClient} from '@supabase/supabase-js'
import {mkdir,writeFile,readFile,copyFile} from 'node:fs/promises'
import {resolve,join} from 'node:path'
import {createHash} from 'node:crypto'
const digest=value=>createHash('sha256').update(value).digest('hex')
const client=createClient(process.env.NUXT_PUBLIC_SUPABASE_URL,process.env.NUXT_SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}})
const folder=resolve('.data','backups','studio-'+new Date().toISOString().replaceAll(':','-'))
await mkdir(join(folder,'storage'),{recursive:true})
const manifest={version:2,kind:'logical-json',complete:false,projectRef:new URL(process.env.NUXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0],createdAt:new Date().toISOString(),files:[],storage:[]}
const save=()=>writeFile(join(folder,'manifest.json'),JSON.stringify(manifest,null,2))
await save()
try{
 const result=await client.rpc('exportar_backup_recuperacao')
 if(result.error)throw new Error('O exportador temporário de backup não está disponível. Execute a definição pelo SQL Editor.')
 await writeFile(join(folder,'database.json'),JSON.stringify(result.data))
 await copyFile('supabase/baseline/20261029_schema.sql',join(folder,'schema.sql'))
 const buckets=result.data.tables.find(t=>t.schema==='storage'&&t.name==='buckets')?.rows||[]
 for(const bucket of buckets){
  async function download(prefix=''){
   for(let offset=0;;offset+=100){
    const{data,error}=await client.storage.from(bucket.id).list(prefix,{limit:100,offset,sortBy:{column:'name',order:'asc'}})
    if(error)throw new Error('Falha ao listar um bucket; backup não concluído.')
    for(const item of data||[]){const path=prefix?prefix+'/'+item.name:item.name;if(!item.id){await download(path);continue}
     const object=await client.storage.from(bucket.id).download(path);if(object.error)throw new Error('Falha ao baixar uma evidência privada.')
     const bytes=Buffer.from(await object.data.arrayBuffer()),name=digest(bucket.id+'/'+path)+'.bin'
     await writeFile(join(folder,'storage',name),bytes)
     manifest.storage.push({bucket:bucket.id,path,file:name,bytes:bytes.length,sha256:digest(bytes),contentType:object.data.type||'application/octet-stream'})
    }
    if(!data||data.length<100)break
   }
  }
  await download()
 }
 for(const name of ['database.json','schema.sql']){const bytes=await readFile(join(folder,name));manifest.files.push({name,sha256:digest(bytes),bytes:bytes.length})}
 manifest.complete=true;manifest.tableCount=result.data.tables.length;manifest.rowCount=result.data.tables.reduce((n,t)=>n+t.rows.length,0);await save()
 await writeFile('.data/ultimo-backup-studio.txt',folder)
 console.log(JSON.stringify({complete:true,folder,tables:manifest.tableCount,rows:manifest.rowCount,storageFiles:manifest.storage.length}))
}catch(error){await save();console.error(error.message);console.error('Backup incompleto; dados privados não foram exibidos.');process.exitCode=1}
