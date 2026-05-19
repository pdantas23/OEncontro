'use client'

import { Toaster } from '@/components/ui/Toast'
import { AuthProvider } from './AuthProvider'

/**
 * Providers — wrapper raiz para todos os Context Providers do app.
 * Usado no src/app/layout.tsx.
 * Adicionar novos providers aqui conforme necessário.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  )
}
