import { lookup } from 'node:dns/promises'

// Somente leitura. Não imprime chaves, tokens, usuários ou respostas com dados pessoais.
const url = process.env.NUXT_PUBLIC_SUPABASE_URL
const publicKey = process.env.NUXT_PUBLIC_SUPABASE_KEY
const adminKey = process.env.NUXT_SUPABASE_SECRET_KEY
let failures = 0
function report(check, ok, detail) {
  if (!ok) failures++
  console.log(`${ok ? 'OK' : 'FALHA'} | ${check} | ${detail}`)
}

async function request(path, key, options = {}) {
  return fetch(new URL(path, url), {
    ...options,
    headers: { apikey: key, Authorization: `Bearer ${key}`, ...options.headers },
    signal: AbortSignal.timeout(10000)
  })
}

async function main() {
  let parsed
  try {
    parsed = new URL(url)
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error()
  } catch {
    report('URL', false, 'Configure NUXT_PUBLIC_SUPABASE_URL com a Project URL HTTPS do Supabase Studio.')
    return
  }
  report('Chave pública', Boolean(publicKey), publicKey ? 'Configurada; valor oculto.' : 'NUXT_PUBLIC_SUPABASE_KEY ausente.')
  const adminConfigured = Boolean(adminKey) && !adminKey.startsWith('sb_publishable_') && adminKey !== publicKey
  report('Chave administrativa', adminConfigured, adminConfigured ? 'Separada da chave pública; valor oculto.' : 'Configure NUXT_SUPABASE_SECRET_KEY com chave secreta de servidor.')
  try {
    await lookup(parsed.hostname)
    report('DNS', true, parsed.hostname)
  } catch {
    report('DNS', false, `${parsed.hostname} não resolve. Confira URL e estado do projeto no Studio antes de trocar chaves.`)
    return
  }
  if (publicKey) {
    const health = await request('/auth/v1/settings', publicKey)
    report('Auth com chave pública', health.ok, `HTTP ${health.status}; resposta omitida.`)
  }
  if (!adminConfigured) return
  const admin = await request('/auth/v1/admin/users?page=1&per_page=1', adminKey)
  report('Auth administrativo', admin.ok, `HTTP ${admin.status}; dados de usuários omitidos.`)
  if (!admin.ok) return
  // Chamada exclusivamente de consulta: não cria conta nem gera link.
  const migration = await request('/rest/v1/rpc/obter_usuario_auth_por_email', adminKey, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_email: 'diagnostico-inexistente@example.invalid' })
  })
  report('RPC de acesso 202609160045', migration.ok, `HTTP ${migration.status}; se ausente, aplicar migration antes de criar acessos.`)
  for (const table of ['professores', 'usuarios', 'repasses_professor', 'repasse_itens', 'fluxo_caixa', 'vw_professor_meu_repasse']) {
    const response = await request(`/rest/v1/${table}?select=*&limit=0`, adminKey)
    report(`Schema ${table}`, response.ok, `HTTP ${response.status}; sem leitura de registros. Não comprova RLS por papel.`)
  }
}

try {
  await main()
} catch (error) {
  const code = error?.cause?.code || error?.name || 'NETWORK_ERROR'
  report('Conexão', false, `Falha de rede ou timeout (${code}); nenhum dado foi alterado.`)
}
process.exitCode = failures ? 1 : 0
