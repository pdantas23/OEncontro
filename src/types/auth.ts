/**
 * src/types/auth.ts
 *
 * Tipos de autenticação e autorização do sistema.
 * Autenticação: Supabase Auth (e-mail + senha)
 * Autorização: role armazenada em app_metadata do JWT (zero query no middleware)
 * Roles: 'comercial' | 'marketing' (tabela profiles_encontro)
 */

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export type AdminRole = 'comercial' | 'marketing'

// ---------------------------------------------------------------------------
// Perfil do usuário do painel (tabela profiles_encontro)
// uuid é o mesmo UUID do Supabase Auth (PK e FK para auth.users)
// ---------------------------------------------------------------------------

export interface AdminUser {
  uuid: string
  email: string
  role: AdminRole
  createdAt: string
}

// ---------------------------------------------------------------------------
// Sessão admin — lida do token JWT
// ---------------------------------------------------------------------------

export interface AdminSession {
  userId: string
  email: string
  role: AdminRole
  name?: string
}

// ---------------------------------------------------------------------------
// Resultado padrão de operações de auth
// ---------------------------------------------------------------------------

export interface AuthResult {
  success: boolean
  error?: string
}

// ---------------------------------------------------------------------------
// app_metadata shape esperado no JWT Supabase
// ---------------------------------------------------------------------------

export interface SupabaseAppMetadata {
  role?: AdminRole
  [key: string]: unknown
}
