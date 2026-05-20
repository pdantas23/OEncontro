'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ObrigadoContent } from '@/components/obrigado/ObrigadoContent'
import type { OrderSummary } from '@/types/checkout'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

function ObrigadoInner() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')

  const [order, setOrder] = useState<OrderSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // static export: window.location em vez de router.replace
    // (route data files não confiáveis no Hostinger)
    if (!orderId) {
      window.location.replace(`${basePath}/`)
      return
    }

    async function load() {
      const supabase = createClient()

      const { data } = await supabase
        .rpc('get_order_status', { p_order_id: orderId! })
        .maybeSingle()

      if (!data) {
        window.location.replace(`${basePath}/`)
        return
      }

      setOrder(data as OrderSummary)
      setLoading(false)
    }
    load()
  }, [orderId])

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
