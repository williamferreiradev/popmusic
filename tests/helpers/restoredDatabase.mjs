import {PGlite} from '@electric-sql/pglite'
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto'
import {uuid_ossp} from '@electric-sql/pglite/contrib/uuid_ossp'
import {readFileSync} from 'node:fs'
export async function restoredDatabase(){
  const db=new PGlite({extensions:{pgcrypto,uuid_ossp}})
  try {
    await db.exec(readFileSync(new URL('./supabase-platform.sql',import.meta.url),'utf8'))
    await db.exec(readFileSync(new URL('../../supabase/baseline/20261029_schema.sql',import.meta.url),'utf8'))
    return db
  }catch(e){await db.close();throw e}
}
