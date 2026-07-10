'use client'

/**
 * TrackingConsent — Banner LGPD + carregamento condicional de scripts de rastreamento.
 *
 * Comportamento:
 *   localStorage 'cookie-consent' === 'accepted' → injeta GTM, Meta Pixel, Google Ads
 *   localStorage 'cookie-consent' === 'rejected' → não carrega nada, sem banner
 *   localStorage não definido → exibe banner de consentimento
 *
 * IDs vêm das variáveis de ambiente (NEXT_PUBLIC_*), passados pelo layout.
 */

import { useState, useEffect } from 'react'
import Script from 'next/script'
import { Button } from '@/components/ui/Button'
import { trackConsentAccepted, trackConsentRejected } from '@/utils/tracking'

const CONSENT_KEY = 'cookie-consent'

interface TrackingConsentProps {
  gtmId: string | null
  metaPixelId: string | null
  googleAdsId: string | null
}

export function TrackingConsent({ gtmId, metaPixelId, googleAdsId }: TrackingConsentProps) {
  const [consent, setConsent] = useState<'accepted' | 'rejected' | null | 'loading'>('loading')

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY) as 'accepted' | 'rejected' | null
    setConsent(stored)
  }, [])

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'accepted')
    setConsent('accepted')
    trackConsentAccepted()
  }

  function reject() {
    localStorage.setItem(CONSENT_KEY, 'rejected')
    setConsent('rejected')
    trackConsentRejected()
  }

  const shouldLoad = consent === 'accepted'

  return (
    <>
      {/* GTM */}
      {shouldLoad && gtmId && (
        <>
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmId}');
              `,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
              title="GTM noscript"
            />
          </noscript>
        </>
      )}

      {/* Meta Pixel */}
      {shouldLoad && metaPixelId && (
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window,document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init','${metaPixelId}');
              fbq('track','PageView');
            `,
          }}
        />
      )}

      {/* Google Ads (gtag.js) */}
      {shouldLoad && googleAdsId && (
        <>
          <Script
            id="google-ads-lib"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`}
          />
          <Script
            id="google-ads-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer=window.dataLayer||[];
                function gtag(){dataLayer.push(arguments);}
                gtag('js',new Date());
                gtag('config','${googleAdsId}');
              `,
            }}
          />
        </>
      )}

      {/* Banner LGPD */}
      {consent === null && (
        <div
          role="dialog"
          aria-label="Consentimento de cookies"
          aria-live="polite"
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-secondary/95 backdrop-blur-sm px-4 py-4 md:px-6"
        >
          <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <p className="flex-1 text-sm text-muted-foreground">
              Usamos cookies para melhorar sua experiência e analisar o uso do site.
              Ao aceitar, você concorda com nossa{' '}
              <a href="/privacidade" className="underline hover:text-foreground transition-colors">
                Política de Privacidade
              </a>
              .
            </p>
            <div className="flex shrink-0 gap-3">
              <Button variant="outline" size="sm" onClick={reject}>
                Recusar
              </Button>
              <Button size="sm" onClick={accept}>
                Aceitar cookies
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
