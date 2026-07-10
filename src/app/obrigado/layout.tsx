/**
 * src/app/obrigado/layout.tsx
 *
 * Layout da página de confirmação de pagamento.
 * Monta TrackingConsent para que o GTM carregue nesta rota
 * (fora do route group (home)). Respeita o consentimento LGPD
 * persistido em localStorage pelo banner da landing.
 */

import { TrackingConsent } from '@/components/tracking/TrackingConsent'

export default function Layout({ children }: { children: React.ReactNode }) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID || null
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || null
  const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || null

  return (
    <>
      {children}
      <TrackingConsent gtmId={gtmId} metaPixelId={metaPixelId} googleAdsId={googleAdsId} />
    </>
  )
}
