// Limpa fixtures/resíduos de uma execução do teste RLS 051 (interrompida ou concluída).
// Uso: node --env-file=.env scripts/limpar-rls-051.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync, unlinkSync, existsSync } from 'node:fs'

const url = process.env.NUXT_PUBLIC_SUPABASE_URL
if (new URL(url).hostname !== 'cdsdhwbugjbfgwyrznoy.supabase.co') throw new Error('Limitado ao projeto Pop Music.')
const admin = createClient(url, process.env.NUXT_SUPABASE_SECRET_KEY, { auth: { persistSession: false } })

const arquivo = '.data/teste-rls-051.json'
if (!existsSync(arquivo)) { console.log('Nada a limpar: sem fixtures.'); process.exit(0) }
const f = JSON.parse(readFileSync(arquivo, 'utf8'))

let removidos = 0
// 1. Usuários Auth criados na execução (busca pelo tag, cobre execução interrompida).
for (let page = 1; page <= 20; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200, page })
  if (error) throw error
  for (const u of data.users) {
    if (u.email && u.email.startsWith(f.tag + '-')) {
      const { error: del } = await admin.auth.admin.deleteUser(u.id)
      if (!del) removidos++
    }
  }
  if (data.users.length < 200) break
}

// 2. Cadastros operacionais residuais: sempre pelo padrão de nome, independente
//    do arquivo de estado. Ordem de FK: presencas/chamadas/matriculas → turma
//    → salas/modalidades/professores/alunos.
const padrao = 'TESTE RLS051%'
const { data: salasRes } = await admin.from('salas').select('id').like('nome', padrao)
const { data: modsRes } = await admin.from('modalidades').select('id').like('nome', padrao)
const { data: profsRes } = await admin.from('professores').select('id').like('nome', padrao)
const turmaIds = new Set()
for (const [campo, lista] of [['sala_id', salasRes], ['modalidade_id', modsRes], ['professor_id', profsRes]]) {
  for (const item of lista || []) {
    const { data } = await admin.from('turmas').select('id').eq(campo, item.id)
    for (const t of data || []) turmaIds.add(t.id)
  }
}
if (f.ids?.turma) turmaIds.add(f.ids.turma)
for (const tid of turmaIds) {
  await admin.from('presencas').delete().eq('turma_id', tid)
  await admin.from('chamadas_aula').delete().eq('turma_id', tid)
  await admin.from('matriculas_turma').delete().eq('turma_id', tid)
  await admin.from('turmas').delete().eq('id', tid)
}
for (const tabela of ['salas', 'modalidades', 'professores', 'alunos']) {
  await admin.from(tabela).delete().like('nome', padrao)
}

unlinkSync(arquivo)
console.log(`Limpeza concluída: ${removidos} identidade(s) Auth removida(s) + cadastros residuais.`)
