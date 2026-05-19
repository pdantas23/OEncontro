import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/forms/LoginForm'
import { buildMetadata } from '@/components/shared/SEOWrapper'

export const metadata: Metadata = buildMetadata({
  title: 'Acesso ao Painel',
  noIndex: true,
})

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-primary">
            O Encontro 2026
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acesso exclusivo para a equipe do evento.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-secondary p-6 shadow-sm">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link
            href="/"
            className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Voltar para o site
          </Link>
        </p>
      </div>
    </div>
  )
}
