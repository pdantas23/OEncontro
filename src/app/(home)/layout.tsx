/**
 * src/app/(home)/layout.tsx
 *
 * Layout da landing page.
 * IDs de rastreamento vêm das variáveis de ambiente (NEXT_PUBLIC_*).
 * GTM, Meta Pixel e Google Ads carregados apenas após consentimento LGPD.
 */

import { MarketingLayout } from '@/components/layout/MarketingLayout'
import { TrackingConsent } from '@/components/tracking/TrackingConsent'

export default function Layout({ children }: { children: React.ReactNode }) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID || null
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || null
  const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || null

  return (
    <MarketingLayout>
      {children}
      <TrackingConsent gtmId={gtmId} metaPixelId={metaPixelId} googleAdsId={googleAdsId} />
    </MarketingLayout>
  )
}
