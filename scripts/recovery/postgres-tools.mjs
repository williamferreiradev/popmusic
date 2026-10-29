import {spawn} from 'node:child_process'
import {join} from 'node:path'
export function connectionEnvironment(value){
 if(!value)throw new Error('Configure POPMUSIC_DATABASE_URL no .env com a conexão PostgreSQL direta ou Session pooler.')
 const u=new URL(value)
 if(!['postgres:','postgresql:'].includes(u.protocol)||!u.hostname||!u.password)throw new Error('Connection string PostgreSQL inválida ou sem senha.')
 if(u.port==='6543')throw new Error('Use conexão direta ou Session pooler na porta 5432; não use Transaction pooler.')
 return{...process.env,PGHOST:u.hostname,PGPORT:u.port||'5432',PGDATABASE:decodeURIComponent(u.pathname.slice(1)||'postgres'),PGUSER:decodeURIComponent(u.username),PGPASSWORD:decodeURIComponent(u.password),PGSSLMODE:'require'}
}
export async function postgresTool(name,args,env,logFile){
 const binary=process.env.POPMUSIC_PG_BIN?join(process.env.POPMUSIC_PG_BIN,name+(process.platform==='win32'?'.exe':'')):name
 const {writeFile}=await import('node:fs/promises')
 return new Promise((resolve,reject)=>{
  const child=spawn(binary,args,{env,windowsHide:true,stdio:['ignore','pipe','pipe']});let stdout='',stderr=''
  child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b)
  child.on('error',()=>reject(new Error(`Não foi possível executar ${name}. Instale as ferramentas PostgreSQL ou configure POPMUSIC_PG_BIN.`)))
  child.on('close',async code=>{if(code!==0){if(logFile)await writeFile(logFile,stderr);reject(new Error(`${name} falhou; nenhum sucesso foi confirmado.${logFile?' Diagnóstico privado: '+logFile:''}`))}else resolve(stdout.trim())})
 })
}
