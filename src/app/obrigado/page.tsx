'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ObrigadoContent } from '@/components/obrigado/ObrigadoContent'
import type { OrderSummary } from '@/types/checkout'

function ObrigadoInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')

  const [order, setOrder] = useState<OrderSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) {
      router.replace('/')
      return
    }

    async function load() {
      const supabase = createClient()

      // Usa RPC get_order_status — SECURITY DEFINER, retorna apenas
      // colunas necessárias sem expor dados sensíveis da tabela.
      const { data } = await supabase
        .rpc('get_order_status', { p_order_id: orderId! })
        .maybeSingle()

      if (!data) {
        router.replace('/')
        return
      }

      setOrder(data as OrderSummary)
      setLoading(false)
    }
    load()
  }, [orderId, router])

  if (loading) {
    return (
      <main className="min-h-screen bg-background py-16 px-4 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </main>
    )
  }

  if (!order) return null

  return (
    <main className="min-h-screen bg-background py-16 px-4">
      <div className="mx-auto max-w-lg">
        <ObrigadoContent order={order} />
      </div>
    </main>
  )
}

export default function ObrigadoPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background py-16 px-4 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </main>
    }>
      <ObrigadoInner />
    </Suspense>
  )
}
