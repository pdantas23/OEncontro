'use client'

/**
 * TrackingConsent — Banner LGPD + carregamento condicional do GTM.
 *
 * Comportamento:
 *   localStorage 'cookie-consent' === 'accepted' → injeta GTM, sem banner
 *   localStorage 'cookie-consent' === 'rejected' → não carrega nada, sem banner
 *   localStorage não definido → exibe banner de consentimento
 *
 * GTM ID vem do Server Component pai (event_config.gtm_id).
 * Sem GTM ID: dataLayer.push funciona normalmente, mas o GTM não está ativo.
 */

import { useState, useEffect } from 'react'
import Script from 'next/script'
import { Button } from '@/components/ui/Button'
import { trackConsentAccepted, trackConsentRejected } from '@/utils/tracking'

const CONSENT_KEY = 'cookie-consent'

interface TrackingConsentProps {
  gtmId: string | null
}

export function TrackingConsent({ gtmId }: TrackingConsentProps) {
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

  return (
    <>
      {/* GTM script — só injeta após consentimento e se houver ID */}
      {consent === 'accepted' && gtmId && (
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

      {/* Banner LGPD — exibido apenas se consentimento não definido */}
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
              . {/* TODO TF03: ajustar link da política */}
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
