'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { adminLoginSchema, type AdminLoginInput } from '@/lib/validations/auth'
import { adminSignInAction } from '@/app/login/actions'

export function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/admin/dashboard'
  const isUnauthorized = searchParams.get('error') === 'unauthorized'

  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
  })

  async function onSubmit(data: AdminLoginInput) {
    setServerError(null)

    const result = await adminSignInAction(data)

    if (!result.success) {
      setServerError(result.error ?? 'Erro ao fazer login.')
      return
    }

    // static export: usar window.location ao invés de router.push
    // (router.push depende de route data files .txt que o Hostinger
    // pode não servir corretamente, travando a navegação)
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
    window.location.href = `${basePath}${redirectTo}`
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {/* Erro de acesso não autorizado (vindo do middleware) */}
      {isUnauthorized && (
        <Alert variant="destructive" title="Acesso negado">
          Você não tem permissão para acessar o painel.
        </Alert>
      )}

      {/* Erro do servidor */}
      {serverError && (
        <Alert variant="destructive">{serverError}</Alert>
      )}

      {/* E-mail */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          E-mail
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="admin@evento.com.br"
          error={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p id="email-error" role="alert" className="text-xs text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Senha */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Senha
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            error={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className="pr-10"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" role="alert" className="text-xs text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button type="submit" loading={isSubmitting} className="mt-1 w-full">
        Entrar no painel
      </Button>
    </form>
  )
}
