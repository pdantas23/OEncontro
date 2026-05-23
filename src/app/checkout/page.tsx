'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiFetch } from '@/services/api/client'
import { CheckoutWizard } from '@/components/checkout/CheckoutWizard'
import type { TicketLot } from '@/repositories/TicketLotRepository'
import type { OrderBump } from '@/repositories/OrderBumpRepository'
import type { EligibleBump } from '@/types/bumps'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

function CheckoutInner() {
  const searchParams = useSearchParams()
  const lotId = searchParams.get('lot') ?? searchParams.get('lot_id')
  const orderId = searchParams.get('order_id')

  const [lot, setLot] = useState<TicketLot | null>(null)
  const [activeBumps, setActiveBumps] = useState<OrderBump[]>([])
  const [combos, setCombos] = useState<EligibleBump[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // static export: window.location em vez de router.replace
    // (route data files não confiáveis no Hostinger)
    if (orderId) {
      window.location.replace(`${basePath}/obrigado?order_id=${orderId}`)
      return
    }
    if (!lotId) {
      window.location.replace(`${basePath}/`)
      return
    }

    async function load() {
      try {
        const [lotData, bumpsData, combosData] = await Promise.all([
          apiFetch<TicketLot>(`/lots/${lotId}`),
          apiFetch<OrderBump[]>('/order-bumps'),
          apiFetch<EligibleBump[]>(`/lots/${lotId}/bumps`),
        ])

        if (!lotData || lotData.status !== 'active' || (lotData.total_limit - lotData.sold_count) <= 0) {
          window.location.replace(`${basePath}/#ingressos`)
          return
        }

        setLot(lotData)
        setActiveBumps(bumpsData)
        setCombos(combosData)
        setLoading(false)
      } catch (err) {
        console.error('[checkout] Erro ao carregar dados:', err)
        window.location.replace(`${basePath}/#ingressos`)
      }
    }
    load()
  }, [lotId, orderId])

  if (loading) {
    return (
      <main className="min-h-screen bg-background py-12 px-4 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </main>
    )
  }

  if (!lot) return null

  const available = lot.total_limit - lot.sold_count

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">Finalize sua compra</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lot.name}
            {available <= 10 && (
              <span className="ml-2 text-xs font-medium text-amber-400">· Últimas {available} vagas</span>
            )}
          </p>
        </div>
        <CheckoutWizard lot={lot} activeBumps={activeBumps} combos={combos} />
      </div>
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background py-12 px-4 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </main>
    }>
      <CheckoutInner />
    </Suspense>
  )
}
