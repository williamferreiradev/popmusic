import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

const corsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || '',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin'
})

const json = (body: unknown, status: number, headers: Record<string, string>) => new Response(
  JSON.stringify(body),
  { status, headers: { ...headers, 'Content-Type': 'application/json' } }
)

serve(async (req) => {
  const origin = req.headers.get('origin')
  const headers = corsHeaders(origin)

  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405, headers)
  if (origin && !allowedOrigins.includes(origin)) return json({ error: 'Origem não autorizada.' }, 403, headers)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const authorization = req.headers.get('Authorization')

    if (!authorization) return json({ error: 'Autenticação obrigatória.' }, 401, headers)

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false }
    })
    const { data: authData, error: authError } = await authClient.auth.getUser()
    if (authError || !authData.user) return json({ error: 'Sessão inválida.' }, 401, headers)

    const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    const { data: requester } = await adminClient
      .from('usuarios')
      .select('papel, ativo')
      .eq('id', authData.user.id)
      .maybeSingle()

    if (!requester?.ativo || requester.papel !== 'gestao') {
      return json({ error: 'Somente a gestão pode convidar usuários.' }, 403, headers)
    }

    const { nome, email, papel, professorId, reenviar } = await req.json()
    const normalizedName = typeof nome === 'string' ? nome.trim() : ''
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    const allowedRoles = ['gestao', 'professor', 'aluno']

    if (normalizedName.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return json({ error: 'Nome ou e-mail inválido.' }, 400, headers)
    }
    if (!allowedRoles.includes(papel)) return json({ error: 'Papel não permitido para convite.' }, 400, headers)
    if (papel === 'professor' && !professorId) return json({ error: 'Professor não informado.' }, 400, headers)

    if (papel === 'professor') {
      const { data: professor } = await adminClient
        .from('professores')
        .select('id, usuario_id, ativo')
        .eq('id', professorId)
        .maybeSingle()
      if (!professor?.ativo) return json({ error: 'Professor inexistente ou inativo.' }, 404, headers)
      if (reenviar) {
        if (!professor.usuario_id) return json({ error: 'Professor ainda não possui conta vinculada.' }, 409, headers)
        const appUrl = (Deno.env.get('APP_URL') || allowedOrigins[0] || '').replace(/\/$/, '')
        const { error: recoveryError } = await adminClient.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: `${appUrl}/confirm?mode=recovery`
        })
        if (recoveryError) throw recoveryError
        return json({ success: true, resent: true }, 200, headers)
      }
      if (professor.usuario_id) return json({ error: 'Este professor já possui acesso vinculado.' }, 409, headers)
    }

    const appUrl = (Deno.env.get('APP_URL') || allowedOrigins[0] || '').replace(/\/$/, '')
    const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(normalizedEmail, {
      data: { nome: normalizedName },
      redirectTo: `${appUrl}/confirm?mode=invite`
    })
    if (inviteError) throw inviteError

    try {
      const { data: profile, error: profileError } = await adminClient
        .from('usuarios')
        .update({ nome: normalizedName, papel, ativo: true })
        .eq('id', invited.user.id)
        .select('id')
        .single()
      if (profileError || !profile) throw profileError || new Error('Perfil do usuário não foi criado.')

      if (papel === 'professor') {
        const { data: linked, error: linkError } = await adminClient
          .from('professores')
          .update({ usuario_id: invited.user.id, email: normalizedEmail })
          .eq('id', professorId)
          .is('usuario_id', null)
          .select('id')
          .single()
        if (linkError || !linked) throw linkError || new Error('Não foi possível vincular a conta ao professor.')
      }
    } catch (linkingError) {
      // Auth e Postgres não compartilham transação; esta compensação evita usuário órfão.
      await adminClient.auth.admin.deleteUser(invited.user.id)
      throw linkingError
    }

    return json({ success: true, userId: invited.user.id }, 200, headers)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao convidar usuário.'
    return json({ error: message }, 500, headers)
  }
})
