/**
 * src/app/(home)/layout.tsx
 *
 * Layout da landing page.
 * Server Component: busca gtm_id do event_config e passa para TrackingConsent.
 *
 * GTM carregado apenas após consentimento LGPD (TrackingConsent).
 * Meta Pixel e Google Ads são configurados como tags dentro do GTM — não
 * como scripts separados aqui.
 */

import { MarketingLayout } from '@/components/layout/MarketingLayout'
import { TrackingConsent } from '@/components/tracking/TrackingConsent'
import { EventConfigRepository } from '@/repositories/EventConfigRepository'

export default async function Layout({ children }: { children: React.ReactNode }) {
  let gtmId: string | null = null

  try {
    const config = await EventConfigRepository.find()
    gtmId = config?.gtm_id ?? null
  } catch {
    // DB/API indisponível — GTM não carrega, mas a página funciona normalmente
  }

  return (
    <MarketingLayout>
      {children}
      <TrackingConsent gtmId={gtmId} />
    </MarketingLayout>
  )
}
