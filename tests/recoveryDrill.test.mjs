import {PGlite} from '@electric-sql/pglite'
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto'
import {uuid_ossp} from '@electric-sql/pglite/contrib/uuid_ossp'
import {restoredDatabase} from './helpers/restoredDatabase.mjs'
import {describe,it} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
describe('ensaio local de recuperação de dados e segurança',()=>{
 it('exporta um banco de teste e recupera dados, vínculos e políticas em outra instância',async()=>{
  const source=await restoredDatabase();let destination
  try{
   await source.exec("insert into public.modalidades(nome,valor_padrao_mensalidade) values('Evidência de recuperação',180)")
   const snapshot=await source.dumpDataDir()
   destination=new PGlite({loadDataDir:snapshot,extensions:{pgcrypto,uuid_ossp}})
   assert.equal((await destination.query("select nome from public.modalidades")).rows[0].nome,'Evidência de recuperação')
   await destination.exec(readFileSync(new URL('../supabase/manual/verificar_recuperacao.sql',import.meta.url),'utf8'))
   await destination.exec('set role anon')
   try{await assert.rejects(destination.query('select * from public.alunos'),e=>e.code==='42501')}finally{await destination.exec('reset role')}
  }finally{if(destination)await destination.close();await source.close()}
 })
})
