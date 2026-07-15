/**
 * api/src/routes/admin-users.ts
 *
 * Gestão de usuários do painel (role comercial), autenticado via
 * requireAdmin. Cria contas reais em auth.users com service role —
 * só pode rodar aqui, nunca no browser.
 *
 * GET  /admin/users  — lista usuários role='comercial'
 * POST /admin/users  — cria novo usuário com role fixa 'comercial'
 *
 * Detecção de e-mail duplicado em duas camadas:
 *   1. Pré-check em profiles_encontro (UX — mensagem rápida e limpa).
 *   2. Erro do próprio createUser (cobre e-mail já existente em
 *      auth.users SEM profile — conta órfã de um cadastro anterior
 *      que falhou entre as duas escritas; ver rollback abaixo).
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { getSupabase } from '../lib/supabase.js'
import { requireAdmin, type AdminEnv } from '../lib/require-admin.js'

const app = new Hono<AdminEnv>()

app.use('*', requireAdmin)

// ---------------------------------------------------------------------------
// GET / — lista usuários comercial
// ---------------------------------------------------------------------------

app.get('/', async (c) => {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('profiles_encontro')
    .select('uuid, email, role, created_at')
    .eq('role', 'comercial')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin-users/GET]', error.message)
    return c.json({ success: false, error: 'Erro ao carregar usuários' }, 500)
  }

  return c.json({ success: true, data: data ?? [] })
})

// ---------------------------------------------------------------------------
// POST / — cria novo usuário (role fixa 'comercial')
// ---------------------------------------------------------------------------

const bodySchema = z.object({
  email: z.string().email('E-mail inválido').transform((v) => v.trim().toLowerCase()),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres').max(72, 'Senha muito longa'),
})

app.post('/', async (c) => {
  const parsed = bodySchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({
      success: false,
      error: 'Dados inválidos',
      fields: parsed.error.flatten().fieldErrors,
    }, 400)
  }

  const { email, password } = parsed.data
  const admin = c.get('admin')
  const supabase = getSupabase()

  const { data: existingProfile } = await supabase
    .from('profiles_encontro')
    .select('uuid')
    .eq('email', email)
    .maybeSingle()

  if (existingProfile) {
    return c.json({ success: false, error: 'E-mail já cadastrado' }, 409)
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError || !created?.user) {
    const msg = createError?.message?.toLowerCase() ?? ''
    const isDuplicate = msg.includes('already') || msg.includes('registered')
      || createError?.code === 'email_exists' || createError?.code === 'user_already_exists'

    if (isDuplicate) {
      // Pré-check não achou profile, mas o e-mail já existe em auth.users —
      // conta órfã de um cadastro anterior que falhou no insert do profile.
      console.warn('[admin-users/POST] E-mail já existe em auth.users sem profile (conta órfã):', email)
      return c.json({
        success: false,
        error: `E-mail já existe em uma conta sem perfil ativo. Contate o suporte técnico (e-mail: ${email}).`,
      }, 409)
    }

    console.error('[admin-users/POST] createUser error:', createError?.message)
    return c.json({ success: false, error: 'Erro ao criar usuário. Tente novamente.' }, 500)
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles_encontro')
    .insert({ uuid: created.user.id, email, role: 'comercial' })
    .select('uuid, email, role, created_at')
    .single()

  if (profileError || !profile) {
    console.error('[admin-users/POST] Erro ao inserir profile, revertendo conta auth:', profileError?.message)

    const { error: rollbackError } = await supabase.auth.admin.deleteUser(created.user.id)
    if (rollbackError) {
      console.error('[admin-users/POST] ROLLBACK FALHOU — conta órfã em auth.users:', {
        uuid: created.user.id,
        email,
        rollbackError: rollbackError.message,
      })
      return c.json({
        success: false,
        error: `Conta parcialmente criada e o rollback falhou. Contate o suporte técnico (e-mail: ${email}).`,
      }, 500)
    }

    return c.json({ success: false, error: 'Erro ao criar usuário. Tente novamente.' }, 500)
  }

  console.info('[admin-users/POST] Usuário criado', { by: admin.uuid, created: profile.uuid, email })

  return c.json({ success: true, data: profile }, 201)
})

export default app
